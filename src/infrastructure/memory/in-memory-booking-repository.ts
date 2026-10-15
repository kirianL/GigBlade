import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

import type { Booking, BookingStatus } from "@/domain/booking";
import type {
  BookingRepository,
  CreateBookingData,
} from "@/application/ports/booking-repository";
import { MEMORY_DEMO_SEEDS } from "@/lib/tenant/memory-demo-routing";

function seedBookings(): Booking[] {
  const seeds: Booking[] = [];
  const now = new Date();

  // Find demo seeds
  const nox = MEMORY_DEMO_SEEDS.find((s) => s.slug === "nox");
  const luna = MEMORY_DEMO_SEEDS.find((s) => s.slug === "luna");
  const marco = MEMORY_DEMO_SEEDS.find((s) => s.slug === "marco");

  if (nox) {
    seeds.push({
      id: "b1111111-0000-4000-8000-000000000001",
      tenantId: nox.id,
      name: "Matías Rossi (Warehouse Producciones)",
      email: "matias@warehouse.cr",
      phone: "+506 8877-6655",
      eventType: "club",
      city: "San José",
      eventDate: new Date(now.getTime() + 14 * 86400000)
        .toISOString()
        .slice(0, 10),
      note: "Set de cierre (02:00 a 04:00 AM) para la fiesta Afterhours. Rider CDJ-3000.",
      status: "pending",
      createdAt: new Date(now.getTime() - 2 * 86400000).toISOString(),
    });
    seeds.push({
      id: "b1111111-0000-4000-8000-000000000002",
      tenantId: nox.id,
      name: "Camila Gómez",
      email: "camila@fiestascr.com",
      phone: "+506 7011-2233",
      eventType: "private",
      city: "Santa Ana",
      eventDate: new Date(now.getTime() + 28 * 86400000)
        .toISOString()
        .slice(0, 10),
      note: "Fiesta de cumpleaños privada con sonido y luces incluidos.",
      status: "confirmed",
      createdAt: new Date(now.getTime() - 5 * 86400000).toISOString(),
    });
  }

  if (luna) {
    seeds.push({
      id: "b2222222-0000-4000-8000-000000000001",
      tenantId: luna.id,
      name: "Santiago Peralta",
      email: "santiago@festivalcosta.cr",
      phone: "+506 8922-3344",
      eventType: "festival",
      city: "Tamarindo, Guanacaste",
      eventDate: new Date(now.getTime() + 45 * 86400000)
        .toISOString()
        .slice(0, 10),
      note: "Main stage sunset set en el festival de playa. Horario 17:30 - 19:30.",
      status: "pending",
      createdAt: new Date(now.getTime() - 1 * 86400000).toISOString(),
    });
    seeds.push({
      id: "b2222222-0000-4000-8000-000000000002",
      tenantId: luna.id,
      name: "Valeria Mora",
      email: "valeria@clubvertigo.cr",
      phone: "+506 8311-5566",
      eventType: "club",
      city: "San José",
      eventDate: new Date(now.getTime() + 10 * 86400000)
        .toISOString()
        .slice(0, 10),
      note: "Noche de Techno Underground. Lineup confirmado con headliner.",
      status: "confirmed",
      createdAt: new Date(now.getTime() - 6 * 86400000).toISOString(),
    });
  }

  if (marco) {
    seeds.push({
      id: "b3333333-0000-4000-8000-000000000001",
      tenantId: marco.id,
      name: "Andrés Montero (Agencia Aura)",
      email: "andres@agenciaaura.com",
      phone: "+506 8700-1122",
      eventType: "corporate",
      city: "Escazú",
      eventDate: new Date(now.getTime() + 20 * 86400000)
        .toISOString()
        .slice(0, 10),
      note: "Lanzamiento de producto y cóctel VIP de fin de año.",
      status: "pending",
      createdAt: new Date(now.getTime() - 3 * 86400000).toISOString(),
    });
  }

  return seeds;
}

export class InMemoryBookingRepository implements BookingRepository {
  private bookings: Booking[];
  private readonly storagePath?: string;

  constructor(storagePath?: string, initial?: Booking[]) {
    this.storagePath = storagePath;

    if (this.storagePath && existsSync(this.storagePath)) {
      try {
        const raw = readFileSync(this.storagePath, "utf-8");
        this.bookings = JSON.parse(raw);
        return;
      } catch {
        // Fallback to initial seeds
      }
    }

    this.bookings = initial ?? seedBookings();
    this.persist();
  }

  private persist() {
    if (!this.storagePath) return;
    try {
      writeFileSync(
        this.storagePath,
        JSON.stringify(this.bookings, null, 2),
        "utf-8",
      );
    } catch {
      // Ignore write failures in read-only envs
    }
  }

  async create(tenantId: string, data: CreateBookingData): Promise<Booking> {
    const booking: Booking = {
      id: randomUUID(),
      tenantId,
      name: data.name,
      email: data.email,
      phone: data.phone ?? null,
      eventType: data.eventType,
      city: data.city ?? null,
      eventDate: data.eventDate ?? null,
      note: data.note ?? null,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    this.bookings.unshift(booking);
    this.persist();
    return booking;
  }

  async listByTenant(tenantId: string): Promise<Booking[]> {
    return this.bookings
      .filter((b) => b.tenantId === tenantId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }

  async findById(id: string): Promise<Booking | null> {
    return this.bookings.find((b) => b.id === id) ?? null;
  }

  async updateStatus(
    tenantId: string,
    bookingId: string,
    status: BookingStatus,
  ): Promise<Booking | null> {
    const item = this.bookings.find(
      (b) => b.id === bookingId && b.tenantId === tenantId,
    );
    if (!item) return null;
    item.status = status;
    this.persist();
    return item;
  }
}
