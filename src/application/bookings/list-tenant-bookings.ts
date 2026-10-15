import type { BookingRepository } from "@/application/ports/booking-repository";
import type { Booking } from "@/domain/booking";
import type { TenantContext } from "@/domain/tenant";

export async function listTenantBookings(
  bookings: BookingRepository,
  context: TenantContext,
): Promise<Booking[]> {
  return await bookings.listByTenant(context.tenantId);
}
