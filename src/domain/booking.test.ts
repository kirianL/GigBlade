import { describe, expect, it } from "vitest";
import {
  createBookingInputSchema,
  updateBookingStatusSchema,
} from "./booking";

describe("booking schemas", () => {
  it("valida una solicitud de contratación correcta", () => {
    const input = {
      name: "Warehouse Club",
      email: "contacto@warehouse.cr",
      phone: "+506 8888-9999",
      eventType: "club",
      city: "San José",
      eventDate: "2026-11-20",
      note: "Set de 2 horas",
    };

    const parsed = createBookingInputSchema.safeParse(input);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.name).toBe("Warehouse Club");
      expect(parsed.data.email).toBe("contacto@warehouse.cr");
      expect(parsed.data.eventType).toBe("club");
      expect(parsed.data.eventDate).toBe("2026-11-20");
    }
  });

  it("rechaza si el correo es inválido", () => {
    const input = {
      name: "Warehouse Club",
      email: "correo-invalido",
      eventType: "club",
    };

    const parsed = createBookingInputSchema.safeParse(input);
    expect(parsed.success).toBe(false);
  });

  it("rechaza si el nombre está vacío", () => {
    const input = {
      name: "   ",
      email: "contacto@warehouse.cr",
      eventType: "club",
    };

    const parsed = createBookingInputSchema.safeParse(input);
    expect(parsed.success).toBe(false);
  });

  it("rechaza tipo de evento no soportado", () => {
    const input = {
      name: "Festival",
      email: "test@fest.com",
      eventType: "cumpleanios_desconocido",
    };

    const parsed = createBookingInputSchema.safeParse(input);
    expect(parsed.success).toBe(false);
  });

  it("valida actualización de estado", () => {
    expect(
      updateBookingStatusSchema.safeParse({ status: "confirmed" }).success,
    ).toBe(true);
    expect(
      updateBookingStatusSchema.safeParse({ status: "declined" }).success,
    ).toBe(true);
    expect(
      updateBookingStatusSchema.safeParse({ status: "pending" }).success,
    ).toBe(true);
    expect(
      updateBookingStatusSchema.safeParse({ status: "cancelado_invalido" })
        .success,
    ).toBe(false);
  });
});
