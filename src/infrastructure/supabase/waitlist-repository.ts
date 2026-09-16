import "server-only";

import type { WaitlistRepository } from "@/application/ports/waitlist-repository";
import { serviceUnavailable } from "@/domain/errors";
import type { WaitlistDraft, WaitlistSignup, WaitlistStatus } from "@/domain/waitlist";
import { createSupabaseAdminClient } from "@/infrastructure/supabase/admin";
import { readPostgrestResult } from "@/infrastructure/supabase/postgrest";

type WaitlistRow = {
  id: string;
  artist_name: string;
  email: string;
  country: "CR" | "US";
  city: string | null;
  instagram: string | null;
  note: string | null;
  status: WaitlistStatus;
  created_at: string;
};

const WAITLIST_COLUMNS =
  "id, artist_name, email, country, city, instagram, note, status, created_at";

export class SupabaseWaitlistRepository implements WaitlistRepository {
  async findByEmail(email: string): Promise<WaitlistSignup | null> {
    const supabase = createSupabaseAdminClient();
    const row = readPostgrestResult(
      await supabase
        .from("dj_waitlist")
        .select(WAITLIST_COLUMNS)
        .eq("email", email)
        .maybeSingle(),
      { operation: "waitlist.findByEmail" },
    );

    return row ? mapSignup(row as WaitlistRow) : null;
  }

  async insert(draft: WaitlistDraft): Promise<WaitlistSignup> {
    const supabase = createSupabaseAdminClient();
    const row = readPostgrestResult(
      await supabase
        .from("dj_waitlist")
        .insert({
          artist_name: draft.artistName,
          email: draft.email,
          country: draft.country,
          city: draft.city,
          instagram: draft.instagram,
          note: draft.note,
        })
        .select(WAITLIST_COLUMNS)
        .single(),
      { operation: "waitlist.insert" },
    );

    if (!row) {
      throw serviceUnavailable("No se pudo guardar la inscripción");
    }

    return mapSignup(row as WaitlistRow);
  }
}

function mapSignup(row: WaitlistRow): WaitlistSignup {
  return {
    id: row.id,
    artistName: row.artist_name,
    email: row.email,
    country: row.country,
    city: row.city,
    instagram: row.instagram,
    note: row.note,
    status: row.status,
    createdAt: row.created_at,
  };
}
