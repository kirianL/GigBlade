import "server-only";

import type { PanelAuthStore } from "@/application/ports/panel-auth-store";
import {
  hashPassword,
  PLATFORM_EMAIL,
  PLATFORM_NAME,
  type PanelAccount,
  type PanelSessionRecord,
} from "@/domain/panel-auth";
import { createSupabaseAdminClient } from "@/infrastructure/supabase/admin";
import {
  failPostgrestQuery,
  readPostgrestResult,
} from "@/infrastructure/supabase/postgrest";

type AccountRow = {
  email: string;
  name: string;
  role: "platform" | "dj";
  slug: string | null;
  password_hash: string;
  password_set_at: string | null;
};

type SessionRow = {
  token_hash: string;
  email: string;
  expires_at: string;
};

const ACCOUNT_COLUMNS =
  "email, name, role, slug, password_hash, password_set_at";
const SESSION_COLUMNS = "token_hash, email, expires_at";

export class SupabasePanelAuthStore implements PanelAuthStore {
  private platformSeeded = false;

  constructor(private readonly platformPassword: string) {}

  async findAccount(email: string): Promise<PanelAccount | null> {
    await this.ensurePlatformAccount();
    const supabase = createSupabaseAdminClient();
    const row = readPostgrestResult(
      await supabase
        .from("panel_accounts")
        .select(ACCOUNT_COLUMNS)
        .eq("email", email)
        .maybeSingle(),
      { operation: "panel_accounts.findAccount" },
    );
    return row ? mapAccount(row as AccountRow) : null;
  }

  async upsertAccount(account: PanelAccount): Promise<void> {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("panel_accounts").upsert(
      {
        email: account.email,
        name: account.name,
        role: account.role,
        slug: account.slug ?? null,
        password_hash: account.passwordHash,
        password_set_at: account.passwordSetAt,
      },
      { onConflict: "email" },
    );
    if (error) {
      failPostgrestQuery(error, { operation: "panel_accounts.upsertAccount" });
    }
  }

  async listAccounts(): Promise<PanelAccount[]> {
    await this.ensurePlatformAccount();
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("panel_accounts")
      .select(ACCOUNT_COLUMNS)
      .order("email");
    if (error) {
      failPostgrestQuery(error, { operation: "panel_accounts.listAccounts" });
    }
    return (data ?? []).map((row) => mapAccount(row as AccountRow));
  }

  async saveSession(record: PanelSessionRecord): Promise<void> {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("panel_sessions").upsert(
      {
        token_hash: record.tokenHash,
        email: record.email,
        expires_at: record.expiresAt,
      },
      { onConflict: "token_hash" },
    );
    if (error) {
      failPostgrestQuery(error, { operation: "panel_sessions.saveSession" });
    }
  }

  async findSession(tokenHash: string): Promise<PanelSessionRecord | null> {
    const supabase = createSupabaseAdminClient();
    const row = readPostgrestResult(
      await supabase
        .from("panel_sessions")
        .select(SESSION_COLUMNS)
        .eq("token_hash", tokenHash)
        .maybeSingle(),
      { operation: "panel_sessions.findSession" },
    );
    return row ? mapSession(row as SessionRow) : null;
  }

  async deleteSessionsForEmail(email: string): Promise<void> {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("panel_sessions")
      .delete()
      .eq("email", email);
    if (error) {
      failPostgrestQuery(error, {
        operation: "panel_sessions.deleteSessionsForEmail",
      });
    }
  }

  async deleteDjAccountsBySlug(slug: string): Promise<void> {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("panel_accounts")
      .delete()
      .eq("slug", slug)
      .eq("role", "dj");
    if (error) {
      failPostgrestQuery(error, {
        operation: "panel_accounts.deleteDjAccountsBySlug",
      });
    }
  }

  private async ensurePlatformAccount() {
    if (this.platformSeeded) return;
    const supabase = createSupabaseAdminClient();
    const existing = readPostgrestResult(
      await supabase
        .from("panel_accounts")
        .select("email")
        .eq("email", PLATFORM_EMAIL)
        .maybeSingle(),
      { operation: "panel_accounts.seedPlatform.read" },
    );
    if (!existing) {
      const { error } = await supabase.from("panel_accounts").insert({
        email: PLATFORM_EMAIL,
        name: PLATFORM_NAME,
        role: "platform",
        slug: null,
        password_hash: hashPassword(this.platformPassword),
        password_set_at: new Date().toISOString(),
      });
      if (error && !/duplicate key/i.test(error.message ?? "")) {
        failPostgrestQuery(error, {
          operation: "panel_accounts.seedPlatform.insert",
        });
      }
    }
    this.platformSeeded = true;
  }
}

function mapAccount(row: AccountRow): PanelAccount {
  return {
    email: row.email,
    name: row.name,
    role: row.role,
    ...(row.slug ? { slug: row.slug } : {}),
    passwordHash: row.password_hash,
    passwordSetAt: row.password_set_at,
  };
}

function mapSession(row: SessionRow): PanelSessionRecord {
  return {
    tokenHash: row.token_hash,
    email: row.email,
    expiresAt: row.expires_at,
  };
}
