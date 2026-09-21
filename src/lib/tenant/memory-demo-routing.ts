export const MEMORY_TENANT_ID = "11111111-1111-4111-8111-111111111111";

export type MemoryTenantRouting = {
  id: string;
  status: "active" | "suspended";
  canonicalHostname: string;
};

export type MemoryDemoSeed = {
  id: string;
  slug: string;
  templateId: "pista" | "festival" | "after";
  displayName: string;
  tagline: string;
  city: string;
  bio: string;
  links: {
    instagram?: string;
    soundcloud?: string;
    spotify?: string;
  };
  photos?: string[];
  mixes?: Array<{ title: string; url: string }>;
};

export const MEMORY_DEMO_SEEDS: MemoryDemoSeed[] = [
  {
    id: "22222222-2222-4222-8222-222222222222",
    slug: "marco",
    templateId: "pista",
    displayName: "DJ Marco",
    tagline: "Sets de club y after",
    city: "San José",
    bio: "Sets de club y after. Página lista para que las productoras te encuentren.",
    links: {
      instagram: "https://instagram.com/djmarco",
      soundcloud: "https://soundcloud.com/djmarco",
      spotify: "https://open.spotify.com/artist/marco",
    },
    photos: [
      "/images/dj/dj-hero.jpg",
      "/images/dj/dj-portrait.jpg",
      "/images/dj/dj-gear.jpg",
      "/images/dj/dj-crowd.jpg",
    ],
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    slug: "luna",
    templateId: "festival",
    displayName: "Luna Set",
    tagline: "Melodic y downtempo",
    city: "San José",
    bio: "Melodic y downtempo. Un canal formal, sin DMs sueltos.",
    links: {
      instagram: "https://instagram.com/lunaset",
      spotify: "https://open.spotify.com/artist/luna",
    },
    photos: [
      "/images/dj/dj-crowd.jpg",
      "/images/dj/dj-hero.jpg",
      "/images/dj/dj-portrait.jpg",
      "/images/dj/dj-gear.jpg",
    ],
  },
  {
    id: MEMORY_TENANT_ID,
    slug: "nox",
    templateId: "after",
    displayName: "Nox",
    tagline: "Sets nocturnos para pistas que no cierran",
    city: "San José",
    bio: "Sets largos, afters y pistas que no cierran.",
    links: {
      instagram: "https://instagram.com/nox",
      soundcloud: "https://soundcloud.com/nox",
      spotify: "https://open.spotify.com/artist/nox",
    },
    photos: [
      "/images/dj/dj-gear.jpg",
      "/images/dj/dj-hero.jpg",
      "/images/dj/dj-crowd.jpg",
      "/images/dj/dj-portrait.jpg",
    ],
    mixes: [
      {
        title: "After hours 04",
        url: "https://soundcloud.com/nox/after-hours-04",
      },
    ],
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    slug: "sofia",
    templateId: "pista",
    displayName: "Sofía Beat",
    tagline: "Trial del plan todo incluido",
    city: "Heredia",
    bio: "Trial del plan todo incluido. Cargando fotos y bio.",
    links: {
      instagram: "https://instagram.com/sofiabeat",
    },
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
    slug: "vera",
    templateId: "festival",
    displayName: "Vera Pulse",
    tagline: "Página pausada",
    city: "Cartago",
    bio: "Página pausada en el panel.",
    links: {
      instagram: "https://instagram.com/verapulse",
    },
  },
];

export function memoryPreviewHostname(slug: string): string {
  return `${slug}.localhost`;
}

export const MEMORY_DEMO_ROUTING: Record<string, MemoryTenantRouting> =
  Object.fromEntries([
    ...MEMORY_DEMO_SEEDS.map((seed) => {
      const host = memoryPreviewHostname(seed.slug);
      return [
        host,
        {
          id: seed.id,
          status: "active" as const,
          canonicalHostname: host,
        },
      ];
    }),
    [
      "demo.localhost",
      {
        id: MEMORY_TENANT_ID,
        status: "active" as const,
        canonicalHostname: "demo.localhost",
      },
    ],
  ]);

export const MEMORY_PREVIEW_HOSTS = Object.keys(MEMORY_DEMO_ROUTING);
