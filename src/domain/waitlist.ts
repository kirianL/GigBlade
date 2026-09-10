import { validationError } from "@/domain/errors";

export type WaitlistStatus = "pending" | "contacted" | "onboarded" | "declined";

export type WaitlistDraft = {
  artistName: string;
  email: string;
  country: "CR" | "US";
  city: string | null;
  instagram: string | null;
  note: string | null;
};

export type WaitlistSignup = WaitlistDraft & {
  id: string;
  status: WaitlistStatus;
  createdAt: string;
};

export type WaitlistJoinResult = {
  alreadyJoined: boolean;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INSTAGRAM_PATTERN = /^[a-z0-9._]{1,30}$/;

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown, max: number, field: string): string | null {
  const text = asTrimmedString(value);
  if (!text) return null;
  if (text.length > max) {
    throw validationError(`${field} es demasiado largo`);
  }
  return text;
}

export function normalizeInstagram(value: unknown): string | null {
  let handle = asTrimmedString(value);
  if (!handle) return null;

  handle = handle.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "");
  handle = handle.replace(/^@/, "").replace(/\/.*$/, "").replace(/\?.*$/, "");
  handle = handle.toLowerCase();

  if (!INSTAGRAM_PATTERN.test(handle)) {
    throw validationError("El Instagram no es válido");
  }

  return handle;
}

export function normalizeWaitlistDraft(input: {
  artistName?: unknown;
  email?: unknown;
  country?: unknown;
  city?: unknown;
  instagram?: unknown;
  note?: unknown;
  website?: unknown;
}): WaitlistDraft | { discarded: true } {
  if (asTrimmedString(input.website)) {
    return { discarded: true };
  }

  const artistName = asTrimmedString(input.artistName);
  const email = asTrimmedString(input.email).toLowerCase();
  const country = asTrimmedString(input.country) || "CR";

  if (artistName.length < 2 || artistName.length > 80) {
    throw validationError("El nombre artístico debe tener entre 2 y 80 caracteres");
  }

  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    throw validationError("El correo no es válido");
  }

  if (country !== "CR") {
    throw validationError("Este país estará disponible pronto");
  }

  return {
    artistName,
    email,
    country,
    city: optionalText(input.city, 80, "La ciudad"),
    instagram: normalizeInstagram(input.instagram),
    note: optionalText(input.note, 280, "La nota"),
  };
}

export function isWaitlistDraft(
  value: WaitlistDraft | { discarded: true },
): value is WaitlistDraft {
  return !("discarded" in value);
}
