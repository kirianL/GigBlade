import "server-only";

import type { WaitlistRepository } from "@/application/ports/waitlist-repository";
import { serviceUnavailable } from "@/domain/errors";
import {
  decodeMeetingFromNote,
  encodeMeetingInNote,
  type WaitlistDraft,
  type WaitlistSignup,
  type WaitlistStatus,
} from "@/domain/waitlist";
import { createSupabaseAdminClient } from "@/infrastructure/supabase/admin";
import {
  failPostgrestQuery,
  isPostgrestSchemaFailure,
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
  meeting_at?: string | null;
  status: WaitlistStatus;
  referral_code?: string | null;
  created_at: string;
};

const WAITLIST_COLUMNS =
  "id, artist_name, email, country, city, instagram, phone, note, meeting_at, status, referral_code, created_at";

const WAITLIST_COLUMNS_LEGACY =
  "id, artist_name, email, country, city, instagram, phone, note, status, referral_code, created_at";

export class SupabaseWaitlistRepository implements WaitlistRepository {
  async findByEmail(email: string): Promise<WaitlistSignup | null> {
    const supabase = createSupabaseAdminClient();
    const primary = await supabase
      .from("dj_waitlist")
      .select(WAITLIST_COLUMNS)
      .eq("email", email)
      .maybeSingle();

    if (primary.error && isPostgrestSchemaFailure(primary.error.code)) {
      const fallback = await supabase
        .from("dj_waitlist")
        .select(WAITLIST_COLUMNS_LEGACY)
        .eq("email", email)
        .maybeSingle();
      const row = readPostgrestResult(fallback, {
        operation: "waitlist.findByEmail",
      });
      return row ? mapSignup(row as WaitlistRow) : null;
    }

    const row = readPostgrestResult(primary, {
      operation: "waitlist.findByEmail",
    });
    return row ? mapSignup(row as WaitlistRow) : null;
  }

  async insert(draft: WaitlistDraft): Promise<WaitlistSignup> {
    const supabase = createSupabaseAdminClient();
    const insertPayload: Record<string, unknown> = {
      artist_name: draft.artistName,
      email: draft.email,
      country: draft.country,
      city: draft.city,
      instagram: draft.instagram,
      phone: draft.phone,
      note: draft.note,
    };
    if (draft.meetingAt) {
      insertPayload.meeting_at = draft.meetingAt;
    }
    if (draft.referralCode) {
      insertPayload.referral_code = draft.referralCode;
    }

    const primary = await supabase
      .from("dj_waitlist")
      .insert(insertPayload)
      .select(WAITLIST_COLUMNS)
      .single();

    if (primary.error && isPostgrestSchemaFailure(primary.error.code)) {
      // Fallback if meeting_at or referral_code column is not yet migrated in DB
      delete insertPayload.meeting_at;
      insertPayload.note = encodeMeetingInNote(draft.note, draft.meetingAt);

      let fallback = await supabase
        .from("dj_waitlist")
        .insert(insertPayload)
        .select(WAITLIST_COLUMNS_LEGACY)
        .single();

      if (
        fallback.error &&
        isPostgrestSchemaFailure(fallback.error.code) &&
        insertPayload.referral_code
      ) {
        delete insertPayload.referral_code;
        fallback = await supabase
          .from("dj_waitlist")
          .insert(insertPayload)
          .select(WAITLIST_COLUMNS_LEGACY)
          .single();
      }

      const row = readPostgrestResult(fallback, {
        operation: "waitlist.insert",
      });
      if (!row) {
        throw serviceUnavailable("No se pudo guardar la inscripción");
      }
      return mapSignup(row as WaitlistRow);
    }

    const row = readPostgrestResult(primary, { operation: "waitlist.insert" });

    if (!row) {
      throw serviceUnavailable("No se pudo guardar la inscripción");
    }

    return mapSignup(row as WaitlistRow);
  }

  async list(): Promise<WaitlistSignup[]> {
    const supabase = createSupabaseAdminClient();
    const primary = await supabase
      .from("dj_waitlist")
      .select(WAITLIST_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(200);

    if (primary.error && isPostgrestSchemaFailure(primary.error.code)) {
      const fallback = await supabase
        .from("dj_waitlist")
        .select(WAITLIST_COLUMNS_LEGACY)
        .order("created_at", { ascending: false })
        .limit(200);
      if (fallback.error) {
        failPostgrestQuery(fallback.error, { operation: "waitlist.list" });
      }
      return ((fallback.data ?? []) as WaitlistRow[]).map(mapSignup);
    }

    if (primary.error) {
      failPostgrestQuery(primary.error, { operation: "waitlist.list" });
    }

    return ((primary.data ?? []) as WaitlistRow[]).map(mapSignup);
  }

  async findById(id: string): Promise<WaitlistSignup | null> {
    const supabase = createSupabaseAdminClient();
    const primary = await supabase
      .from("dj_waitlist")
      .select(WAITLIST_COLUMNS)
      .eq("id", id)
      .maybeSingle();

    if (primary.error && isPostgrestSchemaFailure(primary.error.code)) {
      const fallback = await supabase
        .from("dj_waitlist")
        .select(WAITLIST_COLUMNS_LEGACY)
        .eq("id", id)
        .maybeSingle();
      const row = readPostgrestResult(fallback, {
        operation: "waitlist.findById",
      });
      return row ? mapSignup(row as WaitlistRow) : null;
    }

    const row = readPostgrestResult(primary, { operation: "waitlist.findById" });
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
  const { meetingAt, note } = decodeMeetingFromNote(row.note, row.meeting_at ?? null);
  return {
    id: row.id,
    artistName: row.artist_name,
    email: row.email,
    country: row.country,
    city: row.city,
    instagram: row.instagram,
    phone: row.phone,
    note,
    meetingAt,
    referralCode: row.referral_code ?? null,
    status: row.status,
    createdAt: row.created_at,
  };
}
