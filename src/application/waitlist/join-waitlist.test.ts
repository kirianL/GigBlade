import { describe, expect, it } from "vitest";

import { joinWaitlist } from "@/application/waitlist/join-waitlist";
import { InMemoryWaitlistRepository } from "@/infrastructure/memory/in-memory-waitlist-repository";

describe("joinWaitlist", () => {
  it("inscribe a un DJ con datos válidos", async () => {
    const waitlist = new InMemoryWaitlistRepository();
    const result = await joinWaitlist(waitlist, {
      artistName: "Nox",
      email: "nox@example.com",
      city: "San José",
      instagram: "@nox.dj",
    });

    expect(result).toEqual({ alreadyJoined: false });
    await expect(waitlist.findByEmail("nox@example.com")).resolves.toMatchObject({
      artistName: "Nox",
      instagram: "nox.dj",
      city: "San José",
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

  it("rechaza un correo inválido", async () => {
    const waitlist = new InMemoryWaitlistRepository();

    await expect(
      joinWaitlist(waitlist, { artistName: "Nox", email: "no-es-correo" }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
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
