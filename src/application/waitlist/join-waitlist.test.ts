import { describe, expect, it } from "vitest";

import { joinWaitlist } from "@/application/waitlist/join-waitlist";
import { listWaitlist } from "@/application/waitlist/list-waitlist";
import { InMemoryWaitlistRepository } from "@/infrastructure/memory/in-memory-waitlist-repository";

describe("joinWaitlist", () => {
  it("inscribe a un DJ con datos válidos", async () => {
    const waitlist = new InMemoryWaitlistRepository();
    const result = await joinWaitlist(waitlist, {
      artistName: "Nox",
      email: "nox@example.com",
      city: "San José",
      instagram: "@nox.dj",
      phone: "+506 8888 0000",
    });

    expect(result).toEqual({ alreadyJoined: false });
    await expect(waitlist.findByEmail("nox@example.com")).resolves.toMatchObject({
      artistName: "Nox",
      instagram: "nox.dj",
      city: "San José",
      phone: "+506 8888 0000",
    });
  });

  it("marca como ya inscrito un correo repetido", async () => {
    const waitlist = new InMemoryWaitlistRepository();
    const payload = { artistName: "Nox", email: "nox@example.com" };

    await joinWaitlist(waitlist, payload);
    await expect(joinWaitlist(waitlist, payload)).resolves.toEqual({
      alreadyJoined: true,
    });
  });

  it("descarta el honeypot sin guardar", async () => {
    const waitlist = new InMemoryWaitlistRepository();
    const result = await joinWaitlist(waitlist, {
      artistName: "Bot",
      email: "bot@example.com",
      website: "https://spam.test",
    });

    expect(result).toEqual({ alreadyJoined: false });
    await expect(waitlist.findByEmail("bot@example.com")).resolves.toBeNull();
  });

  it("rechaza un número inválido", async () => {
    const waitlist = new InMemoryWaitlistRepository();

    await expect(
      joinWaitlist(waitlist, {
        artistName: "Nox",
        email: "nox@example.com",
        phone: "123",
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  it("rechaza un correo inválido", async () => {
    const waitlist = new InMemoryWaitlistRepository();

    await expect(
      joinWaitlist(waitlist, { artistName: "Nox", email: "no-es-correo" }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  it("rechaza campos extra en el cuerpo", async () => {
    const waitlist = new InMemoryWaitlistRepository();

    await expect(
      joinWaitlist(waitlist, {
        artistName: "Nox",
        email: "nox@example.com",
        tenantId: "11111111-1111-4111-8111-111111111111",
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  it("deja la inscripción lista para que la plataforma la lea", async () => {
    const waitlist = new InMemoryWaitlistRepository();
    await joinWaitlist(waitlist, {
      artistName: "Nox",
      email: "nox@example.com",
      city: "San José",
      instagram: "nox.dj",
    });

    await expect(listWaitlist(waitlist)).resolves.toEqual([
      expect.objectContaining({
        artistName: "Nox",
        email: "nox@example.com",
        city: "San José",
        instagram: "nox.dj",
        status: "pending",
      }),
    ]);
  });

  it("mantiene Estados Unidos bloqueado hasta su lanzamiento", async () => {
    const waitlist = new InMemoryWaitlistRepository();

    await expect(
      joinWaitlist(waitlist, {
        artistName: "Nox",
        email: "nox@example.com",
        country: "US",
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });
});
