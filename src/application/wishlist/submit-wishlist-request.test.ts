import { describe, expect, it } from "vitest";

import { submitWishlistRequest } from "@/application/wishlist/submit-wishlist-request";
import type { TenantContext } from "@/domain/tenant";
import { InMemoryWishlistRepository } from "@/infrastructure/memory/in-memory-wishlist-repository";

const context: TenantContext = {
  tenantId: "11111111-1111-4111-8111-111111111111",
  hostname: "localhost",
  canonicalHostname: "demo.test",
};

const otherContext: TenantContext = {
  ...context,
  tenantId: "22222222-2222-4222-8211-222222222222",
};

const validInput = {
  name: "Ana Ruiz",
  email: "ana@club.test",
  eventType: "club",
  city: "San José",
  eventDate: "2099-12-24",
  note: "Set de 90 minutos",
};

describe("submitWishlistRequest", () => {
  it("guarda la solicitud con el tenant del contexto", async () => {
    const repository = new InMemoryWishlistRepository();
    const result = await submitWishlistRequest(repository, context, validInput);

    expect(result.duplicate).toBe(false);
    const stored = await repository.findRecentByEmail(
      context.tenantId,
      validInput.email,
    );

    expect(stored?.tenantId).toBe(context.tenantId);
    expect(stored?.email).toBe("ana@club.test");
  });

  it("no mezcla solicitudes entre tenants", async () => {
    const repository = new InMemoryWishlistRepository();
    await submitWishlistRequest(repository, context, validInput);

    await expect(
      repository.findRecentByEmail(otherContext.tenantId, validInput.email),
    ).resolves.toBeNull();
  });

  it("ignora un tenant_id enviado en el body", async () => {
    const repository = new InMemoryWishlistRepository();
    await submitWishlistRequest(repository, context, {
      ...validInput,
      tenantId: otherContext.tenantId,
    });

    const stored = await repository.findRecentByEmail(
      context.tenantId,
      validInput.email,
    );
    expect(stored?.tenantId).toBe(context.tenantId);
  });

  it("devuelve la solicitud existente si el correo se repite el mismo día", async () => {
    const repository = new InMemoryWishlistRepository();
    const first = await submitWishlistRequest(repository, context, validInput);
    const second = await submitWishlistRequest(repository, context, validInput);

    expect(second.id).toBe(first.id);
    expect(second.duplicate).toBe(true);
  });

  it("acepta un honeypot sin persistir", async () => {
    const repository = new InMemoryWishlistRepository();
    const result = await submitWishlistRequest(repository, context, {
      ...validInput,
      website: "https://spam.test",
    });

    expect(result.duplicate).toBe(false);
    await expect(
      repository.findRecentByEmail(context.tenantId, validInput.email),
    ).resolves.toBeNull();
  });

  it("rechaza un correo inválido", async () => {
    const repository = new InMemoryWishlistRepository();

    await expect(
      submitWishlistRequest(repository, context, {
        ...validInput,
        email: "no-es-correo",
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });
});
