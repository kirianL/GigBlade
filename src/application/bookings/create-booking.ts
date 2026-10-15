import type { BookingRepository } from "@/application/ports/booking-repository";
import { validationError } from "@/domain/errors";
import {
  createBookingInputSchema,
  type Booking,
} from "@/domain/booking";
import type { TenantContext } from "@/domain/tenant";
import { verifyTurnstileToken } from "@/infrastructure/cloudflare/turnstile";

export async function createBooking(
  bookings: BookingRepository,
  context: TenantContext,
  rawInput: unknown,
  remoteIp?: string | null,
): Promise<Booking> {
  const parsed = createBookingInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    throw validationError(
      firstIssue?.message || "Los datos de la contratación son inválidos",
    );
  }

  const { turnstileToken, ...bookingData } = parsed.data;

  // Cloudflare Turnstile bot check
  const turnstileCheck = await verifyTurnstileToken({
    token: turnstileToken,
    remoteIp,
  });

  if (!turnstileCheck.success) {
    throw validationError(
      turnstileCheck.error || "Validación de seguridad fallida. Intentá de nuevo.",
    );
  }

  return await bookings.create(context.tenantId, bookingData);
}
