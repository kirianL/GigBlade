import "server-only";

import type { WaitlistRepository } from "@/application/ports/waitlist-repository";
import type { WaitlistDraft, WaitlistSignup, WaitlistStatus } from "@/domain/waitlist";
import { createSupabaseAdminClient } from "@/infrastructure/supabase/admin";

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

export class SupabaseWaitlistRepository implements WaitlistRepository {
  async findByEmail(email: string): Promise<WaitlistSignup | null> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("dj_waitlist")
      .select("id, artist_name, email, country, city, instagram, note, status, created_at")
      .eq("email", email)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return mapSignup(data as WaitlistRow);
  }

  async insert(draft: WaitlistDraft): Promise<WaitlistSignup> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("dj_waitlist")
      .insert({
        artist_name: draft.artistName,
        email: draft.email,
        country: draft.country,
        city: draft.city,
        instagram: draft.instagram,
        note: draft.note,
      })
      .select("id, artist_name, email, country, city, instagram, note, status, created_at")
      .single();

    if (error || !data) {
      throw error ?? new Error("No se pudo guardar la inscripción");
    }

    return mapSignup(data as WaitlistRow);
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
