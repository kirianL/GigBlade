import "server-only";

import type {
  BookingRepository,
  CreateBookingData,
} from "@/application/ports/booking-repository";
import { serviceUnavailable } from "@/domain/errors";
import type { Booking, BookingEventType, BookingStatus } from "@/domain/booking";
import { createSupabaseAdminClient } from "@/infrastructure/supabase/admin";
import {
  failPostgrestQuery,
  readPostgrestResult,
} from "@/infrastructure/supabase/postgrest";

type BookingRow = {
  id: string;
  tenant_id: string;
  name: string;
  email: string;
  phone: string | null;
  event_type: BookingEventType;
  city: string | null;
  event_date: string | null;
  note: string | null;
  status: BookingStatus;
  created_at: string;
};

const BOOKING_COLUMNS =
  "id, tenant_id, name, email, phone, event_type, city, event_date, note, status, created_at";

export class SupabaseBookingRepository implements BookingRepository {
  async create(tenantId: string, data: CreateBookingData): Promise<Booking> {
    const supabase = createSupabaseAdminClient();
    const row = readPostgrestResult(
      await supabase
        .from("bookings")
        .insert({
          tenant_id: tenantId,
          name: data.name,
          email: data.email,
          phone: data.phone,
          event_type: data.eventType,
          city: data.city,
          event_date: data.eventDate,
          note: data.note,
          status: "pending",
        })
        .select(BOOKING_COLUMNS)
        .single(),
      { operation: "bookings.create" },
    );

    if (!row) {
      throw serviceUnavailable("No se pudo registrar la contratación");
    }

    return mapBooking(row as BookingRow);
  }

  async listByTenant(tenantId: string): Promise<Booking[]> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("bookings")
      .select(BOOKING_COLUMNS)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(300);

    if (error) {
      failPostgrestQuery(error, { operation: "bookings.listByTenant" });
    }

    return ((data ?? []) as BookingRow[]).map(mapBooking);
  }

  async findById(id: string): Promise<Booking | null> {
    const supabase = createSupabaseAdminClient();
    const row = readPostgrestResult(
      await supabase
        .from("bookings")
        .select(BOOKING_COLUMNS)
        .eq("id", id)
        .maybeSingle(),
      { operation: "bookings.findById" },
    );

    return row ? mapBooking(row as BookingRow) : null;
  }

  async updateStatus(
    tenantId: string,
    bookingId: string,
    status: BookingStatus,
  ): Promise<Booking | null> {
    const supabase = createSupabaseAdminClient();
    const row = readPostgrestResult(
      await supabase
        .from("bookings")
        .update({ status })
        .eq("id", bookingId)
        .eq("tenant_id", tenantId)
        .select(BOOKING_COLUMNS)
        .maybeSingle(),
      { operation: "bookings.updateStatus" },
    );

    return row ? mapBooking(row as BookingRow) : null;
  }
}

function mapBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? null,
    eventType: row.event_type,
    city: row.city ?? null,
    eventDate: row.event_date ?? null,
    note: row.note ?? null,
    status: row.status ?? "pending",
    createdAt: row.created_at,
  };
}
