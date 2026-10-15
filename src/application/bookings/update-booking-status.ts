import type { BookingRepository } from "@/application/ports/booking-repository";
import { notFound, validationError } from "@/domain/errors";
import {
  updateBookingStatusSchema,
  type Booking,
} from "@/domain/booking";
import type { TenantContext } from "@/domain/tenant";

export async function updateBookingStatus(
  bookings: BookingRepository,
  context: TenantContext,
  bookingId: string,
  rawStatus: unknown,
): Promise<Booking> {
  const parsed = updateBookingStatusSchema.safeParse(rawStatus);
  if (!parsed.success) {
    throw validationError("El estado de contratación es inválido");
  }

  const updated = await bookings.updateStatus(
    context.tenantId,
    bookingId,
    parsed.data.status,
  );

  if (!updated) {
    throw notFound("Contratación no encontrada");
  }

  return updated;
}
