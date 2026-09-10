import { validationError } from "@/domain/errors";
import { z } from "zod";

export const WISHLIST_EVENT_TYPES = [
  "club",
  "festival",
  "private",
  "wedding",
  "corporate",
  "other",
] as const;

export type WishlistEventType = (typeof WISHLIST_EVENT_TYPES)[number];

export type WishlistRequest = {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  eventType: WishlistEventType;
  city: string;
  eventDate: string | null;
  note: string | null;
  createdAt: string;
};

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : undefined));

export const wishlistRequestInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email(),
  eventType: z.enum(WISHLIST_EVENT_TYPES),
  city: z.string().trim().min(2).max(80),
  eventDate: z.string().optional(),
  note: optionalText(500),
  website: z.string().max(200).optional(),
});

export type WishlistRequestInput = z.infer<typeof wishlistRequestInputSchema>;

export type SubmitWishlistResult = {
  id: string;
  duplicate: boolean;
};

function todayLocalIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function normalizeWishlistInput(input: WishlistRequestInput): {
  name: string;
  email: string;
  eventType: WishlistEventType;
  city: string;
  eventDate: string | null;
  note: string | null;
  isHoneypot: boolean;
} {
  const rawDate = input.eventDate?.trim() ?? "";
  const eventDate = rawDate.length > 0 ? rawDate : null;

  if (eventDate && !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
    throw validationError("La fecha del evento no es válida");
  }

  return {
    name: input.name,
    email: input.email.toLowerCase(),
    eventType: input.eventType,
    city: input.city,
    eventDate,
    note: input.note ?? null,
    isHoneypot: Boolean(input.website?.trim()),
  };
}

export function isEventDateAllowed(eventDate: string | null): boolean {
  if (!eventDate) {
    return true;
  }

  return eventDate >= todayLocalIsoDate();
}
