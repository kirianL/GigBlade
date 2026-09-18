import type {
  PanelAccount,
  PanelSessionRecord,
} from "@/domain/panel-auth";

export interface PanelAuthStore {
  findAccount(email: string): Promise<PanelAccount | null>;
  upsertAccount(account: PanelAccount): Promise<void>;
  listAccounts(): Promise<PanelAccount[]>;
  deleteDjAccountsBySlug(slug: string): Promise<void>;
  saveSession(record: PanelSessionRecord): Promise<void>;
  findSession(tokenHash: string): Promise<PanelSessionRecord | null>;
  deleteSessionsForEmail(email: string): Promise<void>;
}
