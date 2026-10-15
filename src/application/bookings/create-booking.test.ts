import { describe, expect, it } from "vitest";
import { createBooking } from "./create-booking";
import { listTenantBookings } from "./list-tenant-bookings";
import { updateBookingStatus } from "./update-booking-status";
import { InMemoryBookingRepository } from "@/infrastructure/memory/in-memory-booking-repository";
import type { TenantContext } from "@/domain/tenant";

describe("createBooking use case", () => {
  const context: TenantContext = {
    tenantId: "11111111-1111-4111-8111-111111111111",
    hostname: "nox.localhost",
    canonicalHostname: "nox.localhost",
  };

  it("registra una nueva solicitud de contratación para el tenant", async () => {
    const repository = new InMemoryBookingRepository(undefined, []);

    const booking = await createBooking(repository, context, {
      name: "Club Vertigo Producciones",
      email: "booking@vertigo.cr",
      phone: "+506 8888-7777",
      eventType: "club",
      city: "San José",
      eventDate: "2026-12-15",
      note: "Set de cierre especial.",
      turnstileToken: "XXXX.DUMMY.TOKEN.XXXX",
    });

    expect(booking.id).toBeDefined();
    expect(booking.tenantId).toBe(context.tenantId);
    expect(booking.name).toBe("Club Vertigo Producciones");
    expect(booking.status).toBe("pending");

    const list = await listTenantBookings(repository, context);
    expect(list.length).toBe(1);
    expect(list[0].id).toBe(booking.id);
  });

  it("permite al DJ confirmar o rechazar la contratación", async () => {
    const repository = new InMemoryBookingRepository(undefined, []);

    const booking = await createBooking(repository, context, {
      name: "Festival Picnic",
      email: "picnic@fest.cr",
      eventType: "festival",
      turnstileToken: "XXXX.DUMMY.TOKEN.XXXX",
    });

    expect(booking.status).toBe("pending");

    const confirmed = await updateBookingStatus(
      repository,
      context,
      booking.id,
      { status: "confirmed" },
    );

    expect(confirmed.status).toBe("confirmed");

    const declined = await updateBookingStatus(
      repository,
      context,
      booking.id,
      { status: "declined" },
    );

    expect(declined.status).toBe("declined");
  });
});
