import type { ReferralRepository } from "@/application/ports/referral-repository";
import type { TilopayGateway } from "@/application/ports/tilopay-gateway";
import type { WaitlistPaymentRepository } from "@/application/ports/waitlist-payment-repository";
import type { WaitlistRepository } from "@/application/ports/waitlist-repository";
import { serviceUnavailable, validationError } from "@/domain/errors";
import {
  cleanPhoneForBilling,
  costaRicaProvinceBilling,
  formatTilopayAmount,
  generateTilopayOrderNumber,
  splitCardholderName,
  type TilopayBillingDefaults,
  type TilopayCurrency,
  type WaitlistPaymentOrder,
} from "@/domain/tilopay";
import {
  isWaitlistDraft,
  normalizeWaitlistDraft,
  waitlistRequestSchema,
} from "@/domain/waitlist";
import { verifyTurnstileToken } from "@/infrastructure/cloudflare/turnstile";

const SLOT_CONFLICT_WINDOW_MS = 25 * 60 * 1000;
const PAYMENT_HOLD_TTL_MS = 15 * 60 * 1000;

export type StartTilopayCheckoutResult =
  | { discarded: true }
  | { discarded: false; alreadyJoined: true; meetingAt: string | null }
  | {
      discarded: false;
      alreadyJoined: false;
      sdkToken: string;
      orderNumber: string;
      amount: number;
      currency: TilopayCurrency;
      amountFormatted: string;
      redirectUrl: string;
      webhookUrl: string;
      billingDefaults: TilopayBillingDefaults;
      order: WaitlistPaymentOrder;
    };

export async function collectBookedMeetingSlots(
  waitlist: WaitlistRepository,
  waitlistPayments: WaitlistPaymentRepository,
): Promise<string[]> {
  const cutoff = Date.now() - 30 * 60 * 1000;
  const nowIso = new Date().toISOString();

  const [signups, heldSlots] = await Promise.all([
    waitlist.list(),
    waitlistPayments.listActiveHeldSlots(nowIso),
  ]);

  const confirmedSlots = signups
    .filter((s) => s.status !== "declined" && Boolean(s.meetingAt))
    .map((s) => s.meetingAt as string);

  const combined = new Set<string>();
  for (const iso of [...confirmedSlots, ...heldSlots]) {
    const t = new Date(iso).getTime();
    if (!Number.isNaN(t) && t >= cutoff) {
      combined.add(iso);
    }
  }
  return [...combined];
}

export async function startTilopayWaitlistCheckout(
  deps: {
    waitlist: WaitlistRepository;
    waitlistPayments: WaitlistPaymentRepository;
    tilopay: TilopayGateway;
    referrals?: ReferralRepository;
  },
  input: {
    rawInput: unknown;
    origin: string;
    remoteIp?: string | null;
    supersedeOrderNumber?: string | null;
  },
): Promise<StartTilopayCheckoutResult> {
  const { waitlist, waitlistPayments, tilopay, referrals } = deps;
  void referrals;

  const parsed = waitlistRequestSchema.safeParse(
    input.rawInput && typeof input.rawInput === "object" ? input.rawInput : {},
  );
  if (!parsed.success) {
    throw validationError("La solicitud no es válida");
  }

  const draft = normalizeWaitlistDraft(parsed.data);
  if (!isWaitlistDraft(draft)) {
    return { discarded: true };
  }

  if (!draft.meetingAt) {
    throw validationError("Seleccioná un día y una hora para nuestra reunión.");
  }

  const turnstileConfigured = Boolean(
    process.env.TURNSTILE_SECRET_KEY?.trim() &&
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim(),
  );
  if (turnstileConfigured || draft.turnstileToken) {
    const turnstileCheck = await verifyTurnstileToken({
      token: draft.turnstileToken,
      remoteIp: input.remoteIp,
    });
    if (!turnstileCheck.success) {
      throw validationError(
        turnstileCheck.error ||
          "Validación de seguridad de Cloudflare fallida. Intentá de nuevo.",
      );
    }
  }

  if (input.supersedeOrderNumber?.trim()) {
    await waitlistPayments.markFailed({
      orderNumber: input.supersedeOrderNumber.trim(),
      responseCode: "SUPERSEDED",
      description: "Reemplazada por una nueva sesión del usuario",
    });
  }

  const existing = await waitlist.findByEmail(draft.email);
  if (existing) {
    return {
      discarded: false,
      alreadyJoined: true,
      meetingAt: existing.meetingAt ?? null,
    };
  }

  const requestedTime = new Date(draft.meetingAt).getTime();
  if (!Number.isNaN(requestedTime)) {
    const activeSlots = await collectBookedMeetingSlots(
      waitlist,
      waitlistPayments,
    );
    const conflict = activeSlots.some((iso) => {
      const bookedTime = new Date(iso).getTime();
      if (Number.isNaN(bookedTime)) return false;
      return Math.abs(bookedTime - requestedTime) < SLOT_CONFLICT_WINDOW_MS;
    });
    if (conflict) {
      throw validationError(
        "Ese horario acaba de ocuparse. Por favor elegí otra hora disponible.",
      );
    }
  }

  if (!tilopay.isConfigured()) {
    throw serviceUnavailable(
      "La pasarela de pago Tilopay no está configurada en el servidor.",
    );
  }

  const pricing = tilopay.getPricing();
  const sdkSession = await tilopay.createSdkToken();
  const orderNumber = generateTilopayOrderNumber();
  const expiresAt = new Date(Date.now() + PAYMENT_HOLD_TTL_MS).toISOString();

  const order = await waitlistPayments.createPendingOrder({
    orderNumber,
    draft,
    meetingAt: draft.meetingAt,
    amount: pricing.amount,
    currency: pricing.currency,
    expiresAt,
  });

  const { firstName, lastName } = splitCardholderName("", draft.artistName);
  const loc = costaRicaProvinceBilling(draft.city);
  const billingDefaults: TilopayBillingDefaults = {
    firstName,
    lastName,
    email: draft.email,
    address: loc.city,
    city: loc.city,
    state: loc.state,
    zip: loc.zip,
    country: draft.country,
    telephone: cleanPhoneForBilling(draft.phone),
  };

  const cleanOrigin = input.origin.replace(/\/+$/, "");

  return {
    discarded: false,
    alreadyJoined: false,
    sdkToken: sdkSession.accessToken,
    orderNumber,
    amount: pricing.amount,
    currency: pricing.currency,
    amountFormatted: formatTilopayAmount(pricing.amount, pricing.currency),
    redirectUrl: `${cleanOrigin}/acceso`,
    webhookUrl: `${cleanOrigin}/api/payments/tilopay/webhook`,
    billingDefaults,
    order,
  };
}
