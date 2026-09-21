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
  await store.saveSession({
    tokenHash: hashSessionToken(token),
    email: account.email,
    expiresAt: sessionExpiry(),
  });

  return {
    token,
    user: publicPanelUser(account),
  };
}

export async function readPanelSession(store: PanelAuthStore, token: string) {
  if (!token) throw unauthorized("La sesión expiró. Entrá de nuevo.");
  const record = await store.findSession(hashSessionToken(token));
  if (!record || Date.parse(record.expiresAt) <= Date.now()) {
    throw unauthorized("La sesión expiró. Entrá de nuevo.");
  }
  const account = await store.findAccount(record.email);
  if (!account) throw unauthorized("La sesión expiró. Entrá de nuevo.");
  return publicPanelUser(account);
}
