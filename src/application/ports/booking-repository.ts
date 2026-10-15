import type {
  Booking,
  BookingStatus,
  CreateBookingInput,
} from "@/domain/booking";

export type CreateBookingData = Omit<CreateBookingInput, "turnstileToken">;

export interface BookingRepository {
  create(tenantId: string, data: CreateBookingData): Promise<Booking>;
  listByTenant(tenantId: string): Promise<Booking[]>;
  findById(id: string): Promise<Booking | null>;
  updateStatus(
    tenantId: string,
    bookingId: string,
    status: BookingStatus,
  ): Promise<Booking | null>;
}
