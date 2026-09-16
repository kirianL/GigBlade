import type {
  NewWishlistRequest,
  WishlistRequestRepository,
} from "@/application/ports/wishlist-request-repository";
import type { WishlistRequest } from "@/domain/wishlist";

const DEMO_TENANT_ID = "11111111-1111-4111-8111-111111111111";

const SEED: NewWishlistRequest[] = [
  {
    tenantId: DEMO_TENANT_ID,
    artistName: "Nox",
    name: "Valeria Soto",
    email: "valeria@clubcentro.cr",
    eventType: "club",
    city: "San José",
    eventDate: "2026-10-18",
    note: "After del festival, set de 2 horas",
  },
  {
    tenantId: DEMO_TENANT_ID,
    artistName: "Nox",
    name: "Mateo Ruiz",
    email: "mateo@productora.cr",
    eventType: "private",
    city: "Escazú",
    eventDate: "2026-11-02",
    note: "Cumpleaños, 11pm a 3am",
  },
  {
    tenantId: "tenant_marco",
    artistName: "DJ Marco",
    name: "Ana Quesada",
    email: "ana@selva.cr",
    eventType: "festival",
    city: "Puerto Viejo",
    eventDate: "2026-12-12",
    note: null,
  },
  {
    tenantId: "tenant_luna",
    artistName: "Luna Set",
    name: "Club Nueve",
    email: "fechas@nueve.cr",
    eventType: "club",
    city: "San José",
    eventDate: "2026-10-31",
    note: "Halloween, main room",
  },
];

export class InMemoryWishlistRepository implements WishlistRequestRepository {
  private readonly requests: WishlistRequest[] = [];

  constructor(seed = true) {
    if (seed) {
      for (const item of SEED) {
        this.requests.push({
          ...item,
          id: `seed_${item.email}`,
          createdAt: new Date(Date.now() - this.requests.length * 36e5).toISOString(),
        });
      }
    }
  }

  async findRecentByEmail(
    tenantId: string,
    email: string,
  ): Promise<WishlistRequest | null> {
    const normalized = email.toLowerCase();
    const matches = this.requests.filter(
      (request) =>
        request.tenantId === tenantId && request.email === normalized,
    );

    return matches.at(-1) ?? null;
  }

  async create(input: NewWishlistRequest): Promise<WishlistRequest> {
    const request: WishlistRequest = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    this.requests.push(request);
    return request;
  }

  async listAll(): Promise<WishlistRequest[]> {
    return [...this.requests].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1,
    );
  }

  async listByTenant(tenantId: string): Promise<WishlistRequest[]> {
    return (await this.listAll()).filter(
      (request) => request.tenantId === tenantId,
    );
  }
}
