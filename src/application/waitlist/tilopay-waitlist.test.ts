import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type {
  TilopayGateway,
  TilopayPricing,
  TilopaySdkSessionToken,
} from "@/application/ports/tilopay-gateway";
import { confirmTilopayWaitlistPayment } from "@/application/waitlist/confirm-tilopay-payment";
import {
  collectBookedMeetingSlots,
  startTilopayWaitlistCheckout,
} from "@/application/waitlist/start-tilopay-checkout";
import type { TilopayConsultTransaction } from "@/domain/tilopay";
import {
  decodeMeetingFromNote,
  decodePaymentFromNote,
  encodeMeetingInNote,
  encodePaymentInNote,
} from "@/domain/waitlist";
import { InMemoryWaitlistPaymentRepository } from "@/infrastructure/memory/in-memory-waitlist-payment-repository";
import { InMemoryWaitlistRepository } from "@/infrastructure/memory/in-memory-waitlist-repository";
import {
  signTilopayOrderCookie,
  verifyTilopayOrderCookie,
} from "@/infrastructure/tilopay/signed-order-cookie";

class FakeTilopayGateway implements TilopayGateway {
  configured = true;
  pricing: TilopayPricing = { amount: 10, currency: "USD" };
  consultResult: TilopayConsultTransaction[] = [];
  consultCalls: string[] = [];

  isConfigured(): boolean {
    return this.configured;
  }

  getPricing(): TilopayPricing {
    return this.pricing;
  }

  async createSdkToken(): Promise<TilopaySdkSessionToken> {
    return {
      accessToken: "fake-sdk-jwt-token",
      expiresIn: "2026-11-18 18:00:00",
    };
  }

  async consultOrder(orderNumber: string): Promise<TilopayConsultTransaction[]> {
    this.consultCalls.push(orderNumber);
    return this.consultResult;
  }
}

function futureSlot(hoursAhead = 48): string {
  return new Date(Date.now() + hoursAhead * 60 * 60 * 1000).toISOString();
}

describe("tilopay waitlist checkout & confirmation", () => {
  it("crea orden pendiente, bloquea horario temporalmente y previene doble reserva", async () => {
    const waitlist = new InMemoryWaitlistRepository();
    const waitlistPayments = new InMemoryWaitlistPaymentRepository();
    const tilopay = new FakeTilopayGateway();
    const slot = futureSlot(48);

    const started = await startTilopayWaitlistCheckout(
      { waitlist, waitlistPayments, tilopay },
      {
        rawInput: {
          artistName: "DJ Nox",
          email: "nox@example.com",
          country: "CR",
          city: "San José",
          phone: "8888 0000",
          meetingAt: slot,
        },
        origin: "https://gigblades.com",
      },
    );

    expect(started.discarded).toBe(false);
    if (started.discarded || started.alreadyJoined) {
      throw new Error("Expected checkout session");
    }

    expect(started.sdkToken).toBe("fake-sdk-jwt-token");
    expect(started.orderNumber).toMatch(/^GB-/);
    expect(started.amount).toBe(10);
    expect(started.currency).toBe("USD");
    expect(started.amountFormatted).toBe("US$ 10");
    expect(started.redirectUrl).toBe("https://gigblades.com/acceso");
    expect(started.webhookUrl).toBe(
      "https://gigblades.com/api/payments/tilopay/webhook",
    );
    expect(started.billingDefaults).toMatchObject({
      city: "San José",
      state: "CR-SJ",
      zip: "10101",
      country: "CR",
      telephone: "88880000",
      email: "nox@example.com",
    });

    // El slot queda reservado en collectBookedMeetingSlots mientras está pendiente
    await expect(
      collectBookedMeetingSlots(waitlist, waitlistPayments),
    ).resolves.toContain(slot);

    // Otro DJ no puede tomar el mismo horario mientras el hold de 15 min esté activo
    await expect(
      startTilopayWaitlistCheckout(
        { waitlist, waitlistPayments, tilopay },
        {
          rawInput: {
            artistName: "Luna",
            email: "luna@example.com",
            country: "CR",
            city: "Heredia",
            meetingAt: slot,
          },
          origin: "https://gigblades.com",
        },
      ),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

    // Si el mismo usuario reemplaza su orden vía supersedeOrderNumber, no se auto-bloquea
    const retried = await startTilopayWaitlistCheckout(
      { waitlist, waitlistPayments, tilopay },
      {
        rawInput: {
          artistName: "DJ Nox",
          email: "nox@example.com",
          country: "CR",
          city: "San José",
          meetingAt: slot,
        },
        origin: "https://gigblades.com",
        supersedeOrderNumber: started.orderNumber,
      },
    );

    expect(retried.discarded).toBe(false);
    if (retried.discarded || retried.alreadyJoined) {
      throw new Error("Expected replacement checkout session");
    }
    expect(retried.orderNumber).not.toBe(started.orderNumber);
    await expect(
      waitlistPayments.findByOrderNumber(started.orderNumber),
    ).resolves.toMatchObject({ status: "failed" });
  });

  it("exige fecha de reunión, descarta honeypot/<800ms y no cobra si el correo ya existe", async () => {
    const waitlist = new InMemoryWaitlistRepository();
    const waitlistPayments = new InMemoryWaitlistPaymentRepository();
    const tilopay = new FakeTilopayGateway();

    await expect(
      startTilopayWaitlistCheckout(
        { waitlist, waitlistPayments, tilopay },
        {
          rawInput: {
            artistName: "DJ Nox",
            email: "nox@example.com",
            country: "CR",
            city: "San José",
          },
          origin: "https://gigblades.com",
        },
      ),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

    const honeypot = await startTilopayWaitlistCheckout(
      { waitlist, waitlistPayments, tilopay },
      {
        rawInput: {
          artistName: "Bot",
          email: "bot@example.com",
          website: "https://spam.example",
          meetingAt: futureSlot(48),
        },
        origin: "https://gigblades.com",
      },
    );
    expect(honeypot).toEqual({ discarded: true });

    const fastBot = await startTilopayWaitlistCheckout(
      { waitlist, waitlistPayments, tilopay },
      {
        rawInput: {
          artistName: "FastBot",
          email: "fast@example.com",
          meetingAt: futureSlot(48),
          formStartedAt: Date.now() - 150,
        },
        origin: "https://gigblades.com",
      },
    );
    expect(fastBot).toEqual({ discarded: true });

    const existingMeeting = futureSlot(72);
    await waitlist.insert({
      artistName: "DJ Nox",
      email: "nox@example.com",
      country: "CR",
      city: "San José",
      instagram: null,
      phone: null,
      note: null,
      meetingAt: existingMeeting,
      paymentStatus: "paid",
    });

    const already = await startTilopayWaitlistCheckout(
      { waitlist, waitlistPayments, tilopay },
      {
        rawInput: {
          artistName: "DJ Nox",
          email: "nox@example.com",
          country: "CR",
          city: "San José",
          meetingAt: futureSlot(96),
        },
        origin: "https://gigblades.com",
      },
    );
    expect(already).toEqual({
      discarded: false,
      alreadyJoined: true,
      meetingAt: existingMeeting,
    });
  });

  it("confirma la cita solo si /consult aprueba monto y moneda, y es idempotente entre webhook y retorno", async () => {
    const waitlist = new InMemoryWaitlistRepository();
    const waitlistPayments = new InMemoryWaitlistPaymentRepository();
    const tilopay = new FakeTilopayGateway();
    const slot = futureSlot(48);

    const started = await startTilopayWaitlistCheckout(
      { waitlist, waitlistPayments, tilopay },
      {
        rawInput: {
          artistName: "Hndrxx",
          email: "hndrxx@example.com",
          country: "CR",
          city: "Cartago",
          instagram: "@itshndrxx",
          meetingAt: slot,
        },
        origin: "https://gigblades.com",
      },
    );
    if (started.discarded || started.alreadyJoined) {
      throw new Error("Expected checkout session");
    }

    // Simular aprobación real consultada en Tilopay
    tilopay.consultResult = [
      {
        id_tilopay: 908812,
        orderNumber: started.orderNumber,
        amount: "10.00",
        currency: "USD",
        code: "1",
        response: "Transacción aprobada",
        auth: "AUT445",
        environment: "Test",
      },
    ];

    // 1. Confirmación por webhook
    const webhookConfirm = await confirmTilopayWaitlistPayment(
      { waitlist, waitlistPayments, tilopay },
      { orderNumber: started.orderNumber },
    );

    expect(webhookConfirm.confirmed).toBe(true);
    if (!webhookConfirm.confirmed) throw new Error("Expected confirmed");
    expect(webhookConfirm.meetingAt).toBe(slot);
    expect(webhookConfirm.payment).toMatchObject({
      orderNumber: started.orderNumber,
      amount: 10,
      currency: "USD",
      amountFormatted: "US$ 10",
      authCode: "AUT445",
      transactionId: "908812",
    });

    // Verifica que se guardó en dj_waitlist con los metadatos del pago
    const saved = await waitlist.findByEmail("hndrxx@example.com");
    expect(saved).toMatchObject({
      artistName: "Hndrxx",
      meetingAt: slot,
      paymentStatus: "paid",
      paymentAmount: 10,
      paymentCurrency: "USD",
      tilopayOrderNumber: started.orderNumber,
      tilopayTransactionId: "908812",
      tilopayAuthCode: "AUT445",
    });

    // 2. Confirmación idempotente cuando el navegador redirige tras el webhook
    const browserConfirm = await confirmTilopayWaitlistPayment(
      { waitlist, waitlistPayments, tilopay },
      { orderNumber: started.orderNumber, callbackCode: "1" },
    );
    expect(browserConfirm.confirmed).toBe(true);
    expect(tilopay.consultCalls).toHaveLength(1);
    await expect(waitlist.list()).resolves.toHaveLength(1);
  });

  it("rechaza spoofing de query params si /consult reporta rechazo o monto alterado y libera el horario", async () => {
    const waitlist = new InMemoryWaitlistRepository();
    const waitlistPayments = new InMemoryWaitlistPaymentRepository();
    const tilopay = new FakeTilopayGateway();
    const slot = futureSlot(60);

    const started = await startTilopayWaitlistCheckout(
      { waitlist, waitlistPayments, tilopay },
      {
        rawInput: {
          artistName: "Vera",
          email: "vera@example.com",
          country: "CR",
          city: "Alajuela",
          meetingAt: slot,
        },
        origin: "https://gigblades.com",
      },
    );
    if (started.discarded || started.alreadyJoined) {
      throw new Error("Expected checkout session");
    }

    // Mismo monto pero code = "2" (declinado) o monto manipulado ("1.00")
    tilopay.consultResult = [
      {
        id_tilopay: 908899,
        orderNumber: started.orderNumber,
        amount: "1.00",
        currency: "USD",
        code: "1",
        response: "Transacción aprobada",
        auth: "FAKE1",
      },
    ];

    const rejected = await confirmTilopayWaitlistPayment(
      { waitlist, waitlistPayments, tilopay },
      {
        orderNumber: started.orderNumber,
        callbackCode: "1",
        callbackDescription: "Approved",
      },
    );

    expect(rejected.confirmed).toBe(false);
    if (rejected.confirmed) throw new Error("Expected rejection");
    expect(rejected.draft).toMatchObject({
      email: "vera@example.com",
      meetingAt: slot,
    });

    await expect(waitlist.findByEmail("vera@example.com")).resolves.toBeNull();
    // El horario se libera de inmediato para otros usuarios
    await expect(
      collectBookedMeetingSlots(waitlist, waitlistPayments),
    ).resolves.not.toContain(slot);
  });

  it("firma y verifica cookie HMAC de orden Tilopay y rechaza manipulación", () => {
    const order = {
      id: "ord-1",
      orderNumber: "GB-TEST-01",
      artistName: "DJ Nox",
      email: "nox@example.com",
      country: "CR" as const,
      city: "San José",
      instagram: "nox.dj",
      phone: "88880000",
      note: null,
      meetingAt: futureSlot(24),
      referralCode: null,
      packageId: "all_inclusive",
      amount: 10,
      currency: "USD" as const,
      status: "pending" as const,
      tilopayTransactionId: null,
      tilopayAuthCode: null,
      tilopayResponseCode: null,
      tilopayDescription: null,
      waitlistId: null,
      expiresAt: futureSlot(1),
      paidAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const token = signTilopayOrderCookie(order);
    expect(verifyTilopayOrderCookie(token)).toMatchObject({
      orderNumber: "GB-TEST-01",
      email: "nox@example.com",
      amount: 10,
    });

    const tampered = `X${token.slice(1)}`;
    expect(verifyTilopayOrderCookie(tampered)).toBeNull();
  });

  it("compone y decodifica etiquetas [MEETING:...] y [PAY:...] en note como fallback de esquema", () => {
    const slot = "2026-11-20T20:00:00.000Z";
    const encoded = encodePaymentInNote(
      encodeMeetingInNote("Nota DJ", slot),
      {
        paymentStatus: "paid",
        paymentAmount: 10,
        paymentCurrency: "USD",
        tilopayOrderNumber: "GB-ABC-1234",
        tilopayTransactionId: "734312",
        tilopayAuthCode: "AUT123",
        paidAt: "2026-11-18T22:00:00.000Z",
      },
    );

    const decodedMeeting = decodeMeetingFromNote(encoded, null);
    const decodedPayment = decodePaymentFromNote(decodedMeeting.note, null);

    expect(decodedMeeting.meetingAt).toBe(slot);
    expect(decodedPayment.note).toBe("Nota DJ");
    expect(decodedPayment.payment).toEqual({
      paymentStatus: "paid",
      paymentAmount: 10,
      paymentCurrency: "USD",
      tilopayOrderNumber: "GB-ABC-1234",
      tilopayTransactionId: "734312",
      tilopayAuthCode: "AUT123",
      paidAt: "2026-11-18T22:00:00.000Z",
    });
  });
});
