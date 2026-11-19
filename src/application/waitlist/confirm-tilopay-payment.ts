import type { ReferralRepository } from "@/application/ports/referral-repository";
import type { TilopayGateway } from "@/application/ports/tilopay-gateway";
import type { WaitlistPaymentRepository } from "@/application/ports/waitlist-payment-repository";
import type { WaitlistRepository } from "@/application/ports/waitlist-repository";
import { serviceUnavailable } from "@/domain/errors";
import {
  formatTilopayAmount,
  isApprovedTilopayTransaction,
  type TilopayCurrency,
  type WaitlistPaymentOrder,
} from "@/domain/tilopay";
import type { WaitlistDraft, WaitlistSignup } from "@/domain/waitlist";

export type RestorableWaitlistDraft = {
  artistName: string;
  email: string;
  phone: string;
  country: "CR" | "US";
  city: string;
  instagram: string;
  meetingAt: string;
  referralCode: string;
};

export type ConfirmTilopayPaymentResult =
  | {
      confirmed: true;
      alreadyJoined: boolean;
      artistName: string;
      country: "CR" | "US";
      meetingAt: string;
      payment: {
        orderNumber: string;
        amount: number;
        currency: TilopayCurrency;
        amountFormatted: string;
        authCode: string | null;
        transactionId: string | null;
        environment: string | null;
      };
    }
  | {
      confirmed: false;
      message: string;
      draft: RestorableWaitlistDraft | null;
    };

function buildRestorableDraft(
  order: WaitlistPaymentOrder,
): RestorableWaitlistDraft {
  return {
    artistName: order.artistName,
    email: order.email,
    phone: order.phone ?? "",
    country: order.country,
    city: order.city ?? "",
    instagram: order.instagram ?? "",
    meetingAt: order.meetingAt,
    referralCode: order.referralCode ?? "",
  };
}

function failureMessage(
  rawDetail: string | null | undefined,
  rawCode: string | null | undefined,
): string {
  const cleanDetail = (rawDetail ?? "").trim();
  const normalized = cleanDetail.toLowerCase();
  if (
    !cleanDetail ||
    normalized === "ok" ||
    normalized === "approved" ||
    normalized === "transacción aprobada" ||
    normalized === "transaction is approved"
  ) {
    if (rawCode && rawCode !== "1") {
      return "El pago no fue aprobado por el emisor. Podés intentar con otra tarjeta.";
    }
    return "No pudimos confirmar el pago con Tilopay. Podés intentar nuevamente.";
  }

  return `El pago no se completó (${cleanDetail.slice(0, 120)}). Podés intentar con otra tarjeta.`;
}

export async function confirmTilopayWaitlistPayment(
  deps: {
    waitlist: WaitlistRepository;
    waitlistPayments: WaitlistPaymentRepository;
    tilopay: TilopayGateway;
    referrals?: ReferralRepository;
  },
  input: {
    orderNumber: string;
    fallbackOrder?: WaitlistPaymentOrder | null;
    callbackCode?: string | null;
    callbackDescription?: string | null;
    callbackAuth?: string | null;
    callbackTransactionId?: string | null;
  },
): Promise<ConfirmTilopayPaymentResult> {
  const { waitlist, waitlistPayments, tilopay, referrals } = deps;
  void referrals;

  const cleanOrderNumber = input.orderNumber.trim();
  if (!cleanOrderNumber) {
    return {
      confirmed: false,
      message: "No recibimos el número de orden para verificar el pago.",
      draft: null,
    };
  }

  const dbOrder = await waitlistPayments.findByOrderNumber(cleanOrderNumber);
  const fallback =
    input.fallbackOrder?.orderNumber === cleanOrderNumber
      ? input.fallbackOrder
      : null;
  const order = dbOrder ?? fallback;

  if (!order) {
    return {
      confirmed: false,
      message:
        "No encontramos la sesión de pago. Por favor seleccioná tu horario e intentá de nuevo.",
      draft: null,
    };
  }

  if (order.status === "paid") {
    let existing = await waitlist.findByEmail(order.email);
    if (!existing) {
      try {
        existing = await waitlist.insert(buildPaidWaitlistDraft(order, {
          transactionId: order.tilopayTransactionId,
          authCode: order.tilopayAuthCode,
          paidAt: order.paidAt ?? new Date().toISOString(),
        }));
      } catch {
        existing = await waitlist.findByEmail(order.email);
      }
    }

    return {
      confirmed: true,
      alreadyJoined: false,
      artistName: order.artistName,
      country: order.country,
      meetingAt: existing?.meetingAt ?? order.meetingAt,
      payment: {
        orderNumber: order.orderNumber,
        amount: order.amount,
        currency: order.currency,
        amountFormatted: formatTilopayAmount(order.amount, order.currency),
        authCode: order.tilopayAuthCode,
        transactionId: order.tilopayTransactionId,
        environment: null,
      },
    };
  }

  // Always verify transaction server-to-server via POST /api/v1/consult
  // Retry briefly if Tilopay redirected with code=1 before /consult indexes it.
  let transactions = await tilopay.consultOrder(order.orderNumber);
  let approvedTx = transactions.find((tx) =>
    isApprovedTilopayTransaction(
      tx,
      order.orderNumber,
      order.amount,
      order.currency,
    ),
  );

  if (!approvedTx && input.callbackCode === "1") {
    for (const delayMs of [900, 1200]) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      transactions = await tilopay.consultOrder(order.orderNumber);
      approvedTx = transactions.find((tx) =>
        isApprovedTilopayTransaction(
          tx,
          order.orderNumber,
          order.amount,
          order.currency,
        ),
      );
      if (approvedTx) break;
    }
  }

  if (!approvedTx) {
    const latestTx = transactions[0];
    const responseCode =
      latestTx?.code != null
        ? String(latestTx.code)
        : (input.callbackCode ?? null);
    const description =
      latestTx?.response != null
        ? String(latestTx.response)
        : (input.callbackDescription ?? null);

    await waitlistPayments.markFailed({
      orderNumber: order.orderNumber,
      responseCode,
      description,
    });

    return {
      confirmed: false,
      message: failureMessage(description, responseCode),
      draft: buildRestorableDraft(order),
    };
  }

  const transactionId =
    approvedTx.id_tilopay != null && String(approvedTx.id_tilopay).trim()
      ? String(approvedTx.id_tilopay).trim()
      : input.callbackTransactionId?.trim() || null;
  const authCode =
    approvedTx.auth != null && String(approvedTx.auth).trim()
      ? String(approvedTx.auth).trim()
      : input.callbackAuth?.trim() || null;
  const responseCode =
    approvedTx.code != null ? String(approvedTx.code) : "1";
  const description =
    approvedTx.response != null
      ? String(approvedTx.response)
      : "Transacción aprobada";
  const environment =
    approvedTx.environment != null ? String(approvedTx.environment) : null;
  const paidAt = new Date().toISOString();

  const existing = await waitlist.findByEmail(order.email);
  let waitlistRecord: WaitlistSignup | null = existing;
  const wasPreExistingOtherOrder = Boolean(
    existing &&
      existing.tilopayOrderNumber &&
      existing.tilopayOrderNumber !== order.orderNumber,
  );

  if (!waitlistRecord) {
    try {
      waitlistRecord = await waitlist.insert(
        buildPaidWaitlistDraft(order, {
          transactionId,
          authCode,
          paidAt,
        }),
      );
    } catch {
      waitlistRecord = await waitlist.findByEmail(order.email);
      if (!waitlistRecord) {
        throw serviceUnavailable("No se pudo registrar tu cita tras el pago.");
      }
    }
  }

  await waitlistPayments.markPaid({
    orderNumber: order.orderNumber,
    transactionId,
    authCode,
    responseCode,
    description,
    waitlistId: waitlistRecord.id,
    paidAt,
  });

  return {
    confirmed: true,
    alreadyJoined: wasPreExistingOtherOrder,
    artistName: order.artistName,
    country: order.country,
    meetingAt: waitlistRecord.meetingAt ?? order.meetingAt,
    payment: {
      orderNumber: order.orderNumber,
      amount: order.amount,
      currency: order.currency,
      amountFormatted: formatTilopayAmount(order.amount, order.currency),
      authCode,
      transactionId,
      environment,
    },
  };
}

function buildPaidWaitlistDraft(
  order: WaitlistPaymentOrder,
  payment: {
    transactionId: string | null;
    authCode: string | null;
    paidAt: string;
  },
): WaitlistDraft {
  return {
    artistName: order.artistName,
    email: order.email,
    country: order.country,
    city: order.city,
    instagram: order.instagram,
    phone: order.phone,
    note: order.note,
    meetingAt: order.meetingAt,
    referralCode: order.referralCode,
    packageId: order.packageId,
    paymentStatus: "paid",
    paymentAmount: order.amount,
    paymentCurrency: order.currency,
    tilopayOrderNumber: order.orderNumber,
    tilopayTransactionId: payment.transactionId,
    tilopayAuthCode: payment.authCode,
    paidAt: payment.paidAt,
  };
}
