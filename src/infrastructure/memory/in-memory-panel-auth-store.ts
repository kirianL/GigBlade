import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import type { PanelAuthStore } from "@/application/ports/panel-auth-store";
import {
  hashPassword,
  PLATFORM_EMAIL,
  PLATFORM_NAME,
  type PanelAccount,
  type PanelSessionRecord,
} from "@/domain/panel-auth";

type Stored = {
  accounts: PanelAccount[];
  sessions: PanelSessionRecord[];
};

function readStored(path: string): Stored | null {
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as unknown;
    if (typeof parsed !== "object" || parsed === null) return null;
    const row = parsed as Partial<Stored>;
    if (!Array.isArray(row.accounts) || !Array.isArray(row.sessions)) return null;
    return { accounts: row.accounts, sessions: row.sessions };
  } catch {
    return null;
  }
}

function isAccount(value: unknown): value is PanelAccount {
  if (typeof value !== "object" || value === null) return false;
  const row = value as Partial<PanelAccount>;
  return (
    typeof row.email === "string" &&
    typeof row.name === "string" &&
    (row.role === "platform" || row.role === "dj") &&
    typeof row.passwordHash === "string"
  );
}

function isSession(value: unknown): value is PanelSessionRecord {
  if (typeof value !== "object" || value === null) return false;
  const row = value as Partial<PanelSessionRecord>;
  return (
    typeof row.tokenHash === "string" &&
    typeof row.email === "string" &&
    typeof row.expiresAt === "string"
  );
}

export class InMemoryPanelAuthStore implements PanelAuthStore {
  private readonly accounts = new Map<string, PanelAccount>();
  private readonly sessions = new Map<string, PanelSessionRecord>();
  private readonly persistPath?: string;

  constructor(persistPath?: string, platformPassword = "gigblade") {
    this.persistPath = persistPath;
    this.hydrate();
    if (!this.accounts.has(PLATFORM_EMAIL)) {
      this.accounts.set(PLATFORM_EMAIL, {
        email: PLATFORM_EMAIL,
        name: PLATFORM_NAME,
        role: "platform",
        passwordHash: hashPassword(platformPassword),
        passwordSetAt: new Date().toISOString(),
      });
      this.flush();
    }
  }

  async findAccount(email: string): Promise<PanelAccount | null> {
    this.hydrate();
    return this.accounts.get(email) ?? null;
  }

  async upsertAccount(account: PanelAccount): Promise<void> {
    this.hydrate();
    this.accounts.set(account.email, account);
    this.flush();
  }

  async listAccounts(): Promise<PanelAccount[]> {
    this.hydrate();
    return [...this.accounts.values()];
  }

  async saveSession(record: PanelSessionRecord): Promise<void> {
    this.hydrate();
    this.sessions.set(record.tokenHash, record);
    this.flush();
  }

  async findSession(tokenHash: string): Promise<PanelSessionRecord | null> {
    this.hydrate();
    return this.sessions.get(tokenHash) ?? null;
  }

  async deleteSessionsForEmail(email: string): Promise<void> {
    this.hydrate();
    for (const [key, session] of this.sessions) {
      if (session.email === email) this.sessions.delete(key);
    }
    this.flush();
  }

  private hydrate() {
    if (!this.persistPath) return;
    const stored = readStored(this.persistPath);
    if (!stored) return;
    this.accounts.clear();
    this.sessions.clear();
    for (const account of stored.accounts) {
      if (isAccount(account)) this.accounts.set(account.email, account);
    }
    for (const session of stored.sessions) {
      if (isSession(session)) this.sessions.set(session.tokenHash, session);
    }
  }

  private flush() {
    if (!this.persistPath) return;
    mkdirSync(dirname(this.persistPath), { recursive: true });
    writeFileSync(
      this.persistPath,
      JSON.stringify({
        accounts: [...this.accounts.values()],
        sessions: [...this.sessions.values()],
      }),
    );
  }
}
