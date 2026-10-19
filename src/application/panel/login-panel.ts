import type { PanelAuthStore } from "@/application/ports/panel-auth-store";
import {
  assertPanelEmail,
  assertPanelPassword,
  createSessionToken,
  hashSessionToken,
  publicPanelUser,
  sessionExpiry,
  verifyPassword,
} from "@/domain/panel-auth";
import { unauthorized } from "@/domain/errors";

const SESSION_CACHE_TTL_MS = 10_000;
const sessionUserCache = new Map<
  string,
  { user: ReturnType<typeof publicPanelUser>; expiresAt: number }
>();

export function clearCachedPanelSessions() {
  sessionUserCache.clear();
}

export async function loginPanel(
  store: PanelAuthStore,
  input: { email: unknown; password: unknown },
) {
  const email = assertPanelEmail(String(input.email ?? ""));
  const password = assertPanelPassword(String(input.password ?? ""));
  const account = await store.findAccount(email);
  if (!account || !verifyPassword(password, account.passwordHash)) {
    throw unauthorized("El correo o la contraseña no coinciden.");
  }

  const token = createSessionToken();
  const tokenHash = hashSessionToken(token);
  await store.saveSession({
    tokenHash,
    email: account.email,
    expiresAt: sessionExpiry(),
  });

  const user = publicPanelUser(account);
  sessionUserCache.set(tokenHash, {
    user,
    expiresAt: Date.now() + SESSION_CACHE_TTL_MS,
  });

  return {
    token,
    user,
  };
}

export async function logoutPanel(store: PanelAuthStore, token: string) {
  if (!token) return;
  const tokenHash = hashSessionToken(token);
  sessionUserCache.delete(tokenHash);
  await store.deleteSession(tokenHash);
}

export async function readPanelSession(store: PanelAuthStore, token: string) {
  if (!token) throw unauthorized("La sesión expiró. Entrá de nuevo.");
  const tokenHash = hashSessionToken(token);
  const cached = sessionUserCache.get(tokenHash);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.user;
  }

  if (store.findSessionWithAccount) {
    const combined = await store.findSessionWithAccount(tokenHash);
    if (!combined || Date.parse(combined.session.expiresAt) <= Date.now()) {
      sessionUserCache.delete(tokenHash);
      throw unauthorized("La sesión expiró. Entrá de nuevo.");
    }
    const user = publicPanelUser(combined.account);
    sessionUserCache.set(tokenHash, {
      user,
      expiresAt: Date.now() + SESSION_CACHE_TTL_MS,
    });
    return user;
  }

  const record = await store.findSession(tokenHash);
  if (!record || Date.parse(record.expiresAt) <= Date.now()) {
    sessionUserCache.delete(tokenHash);
    throw unauthorized("La sesión expiró. Entrá de nuevo.");
  }
  const account = await store.findAccount(record.email);
  if (!account) {
    sessionUserCache.delete(tokenHash);
    throw unauthorized("La sesión expiró. Entrá de nuevo.");
  }
  const user = publicPanelUser(account);
  sessionUserCache.set(tokenHash, {
    user,
    expiresAt: Date.now() + SESSION_CACHE_TTL_MS,
  });
  return user;
}
