import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import type { WaitlistPaymentOrder } from "@/domain/tilopay";
import { getServerEnv } from "@/lib/env/server";

export const TILOPAY_ORDER_COOKIE = "gb_tpay_order";
const COOKIE_MAX_AGE_SECONDS = 30 * 60;
const FALLBACK_DEV_SECRET = "gigblades-local-dev-tilopay-cookie-secret";

type SignedPayload = {
  v: 1;
  order: WaitlistPaymentOrder;
};

function signingSecret(): string {
  const env = getServerEnv();
  const explicit =
    env.TILOPAY_WEBHOOK_SECRET || process.env.GIGBLADE_PANEL_PASSWORD?.trim();
  const tilopayCombined = [env.TILOPAY_API_PASSWORD, env.TILOPAY_API_KEY]
    .filter(Boolean)
    .join(":");
  const supabaseSecret = env.SUPABASE_SERVICE_ROLE_KEY;

  const material = [explicit, tilopayCombined, supabaseSecret]
    .filter(Boolean)
    .join("|");

  return material || FALLBACK_DEV_SECRET;
}

function hmacDigest(encodedPayload: string): string {
  return createHmac("sha256", signingSecret())
    .update(encodedPayload)
    .digest("base64url");
}

export function signTilopayOrderCookie(order: WaitlistPaymentOrder): string {
  const payload: SignedPayload = { v: 1, order };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );
  const sig = hmacDigest(encoded);
  return `${encoded}.${sig}`;
}

export function verifyTilopayOrderCookie(
  rawCookie: string | undefined | null,
): WaitlistPaymentOrder | null {
  if (!rawCookie || typeof rawCookie !== "string") return null;
  const trimmed = rawCookie.trim();
  const dotIdx = trimmed.indexOf(".");
  if (dotIdx <= 0) return null;

  const encoded = trimmed.slice(0, dotIdx);
  const providedSig = trimmed.slice(dotIdx + 1);
  if (!encoded || !providedSig) return null;

  const expectedSig = hmacDigest(encoded);
  const providedBuf = Buffer.from(providedSig, "utf8");
  const expectedBuf = Buffer.from(expectedSig, "utf8");
  if (providedBuf.length !== expectedBuf.length) {
    return null;
  }
  if (!timingSafeEqual(providedBuf, expectedBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as SignedPayload;
    if (!parsed || parsed.v !== 1 || !parsed.order?.orderNumber) {
      return null;
    }
    const expiresMs = Date.parse(parsed.order.expiresAt);
    if (!Number.isFinite(expiresMs) || Date.now() > expiresMs + 30 * 60 * 1000) {
      return null;
    }
    return parsed.order;
  } catch {
    return null;
  }
}

export function readCookieFromHeader(
  cookieHeader: string | null | undefined,
  name: string,
): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const eqIdx = part.indexOf("=");
    if (eqIdx === -1) continue;
    const key = part.slice(0, eqIdx).trim();
    if (key === name) {
      const value = part.slice(eqIdx + 1).trim();
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    }
  }
  return null;
}

export function buildTilopayOrderCookieHeader(value: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${TILOPAY_ORDER_COOKIE}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE_SECONDS}${secure}`;
}

export function clearTilopayOrderCookieHeader(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${TILOPAY_ORDER_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}
