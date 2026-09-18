import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

import { unauthorized, validationError } from "@/domain/errors";

export type PanelRole = "platform" | "dj";

export type PanelAccount = {
  email: string;
  name: string;
  role: PanelRole;
  slug?: string;
  passwordHash: string;
  passwordSetAt: string | null;
};

export type PanelSessionRecord = {
  tokenHash: string;
  email: string;
  expiresAt: string;
};

export type PanelPublicUser = {
  email: string;
  name: string;
  role: PanelRole;
  slug?: string;
};

export const PLATFORM_EMAIL = "hola@gigblade.com";
export const PLATFORM_NAME = "Kirian";
export const PANEL_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

export function normalizePanelEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function assertPanelEmail(value: string): string {
  const email = normalizePanelEmail(value);
  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    throw validationError("Escribí un correo válido.");
  }
  return email;
}

export function assertPanelPassword(value: string): string {
  if (typeof value !== "string" || value.length < 8 || value.length > 128) {
    throw validationError("La contraseña no es válida.");
  }
  return value;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const next = scryptSync(password, salt, 32);
  const current = Buffer.from(hash, "hex");
  if (current.length !== next.length) return false;
  return timingSafeEqual(current, next);
}

export function generatePanelPassword(length = 12): string {
  const bytes = randomBytes(length);
  return Array.from(bytes, (byte) => PASSWORD_ALPHABET[byte % PASSWORD_ALPHABET.length]).join(
    "",
  );
}

export function createSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function publicPanelUser(account: PanelAccount): PanelPublicUser {
  return {
    email: account.email,
    name: account.name,
    role: account.role,
    ...(account.slug ? { slug: account.slug } : {}),
  };
}

export function sessionExpiry(at = new Date()): string {
  return new Date(at.getTime() + PANEL_SESSION_TTL_MS).toISOString();
}

export function isSessionExpired(record: PanelSessionRecord, at = new Date()): boolean {
  return Date.parse(record.expiresAt) <= at.getTime();
}

export function requirePlatform(
  user: PanelPublicUser,
  message = "Solo la plataforma puede generar contraseñas.",
): PanelPublicUser {
  if (user.role !== "platform") {
    throw unauthorized(message);
  }
  return user;
}
