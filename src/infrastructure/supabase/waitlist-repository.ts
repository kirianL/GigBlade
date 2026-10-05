import "server-only";

import type { WaitlistRepository } from "@/application/ports/waitlist-repository";
import { serviceUnavailable } from "@/domain/errors";
import type { WaitlistDraft, WaitlistSignup, WaitlistStatus } from "@/domain/waitlist";
import { createSupabaseAdminClient } from "@/infrastructure/supabase/admin";
import {
  failPostgrestQuery,
  readPostgrestResult,
} from "@/infrastructure/supabase/postgrest";

type WaitlistRow = {
  id: string;
  artist_name: string;
  email: string;
  country: "CR" | "US";
  city: string | null;
  instagram: string | null;
  phone: string | null;
  note: string | null;
  status: WaitlistStatus;
  created_at: string;
};

const WAITLIST_COLUMNS =
  "id, artist_name, email, country, city, instagram, phone, note, status, created_at";

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
          phone: draft.phone,
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

  async list(): Promise<WaitlistSignup[]> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("dj_waitlist")
      .select(WAITLIST_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      failPostgrestQuery(error, { operation: "waitlist.list" });
    }

    return ((data ?? []) as WaitlistRow[]).map(mapSignup);
  }

  async findById(id: string): Promise<WaitlistSignup | null> {
    const supabase = createSupabaseAdminClient();
    const row = readPostgrestResult(
      await supabase
        .from("dj_waitlist")
        .select(WAITLIST_COLUMNS)
        .eq("id", id)
        .maybeSingle(),
      { operation: "waitlist.findById" },
    );
    return row ? mapSignup(row as WaitlistRow) : null;
  }

  async markOnboarded(id: string): Promise<boolean> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("dj_waitlist")
      .update({ status: "onboarded" })
      .eq("id", id)
      .select("id");

    if (error) {
      failPostgrestQuery(error, { operation: "waitlist.markOnboarded" });
    }

    return ((data ?? []) as Array<{ id: string }>).length > 0;
  }

  async deleteById(id: string): Promise<boolean> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("dj_waitlist")
      .delete()
      .eq("id", id)
      .select("id");

    if (error) {
      failPostgrestQuery(error, { operation: "waitlist.delete" });
    }

    return ((data ?? []) as Array<{ id: string }>).length > 0;
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
    phone: row.phone,
    note: row.note,
    status: row.status,
    createdAt: row.created_at,
  };
}
