import "server-only";

import type { WaitlistRepository } from "@/application/ports/waitlist-repository";
import { serviceUnavailable } from "@/domain/errors";
import {
  decodeMeetingFromNote,
  decodePaymentFromNote,
  encodeMeetingInNote,
  encodePaymentInNote,
  type WaitlistDraft,
  type WaitlistPaymentSummaryStatus,
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
  payment_status?: WaitlistPaymentSummaryStatus | null;
  payment_amount?: number | string | null;
  payment_currency?: "USD" | "CRC" | null;
  tilopay_order_number?: string | null;
  tilopay_transaction_id?: string | null;
  tilopay_auth_code?: string | null;
  paid_at?: string | null;
  status: WaitlistStatus;
  referral_code?: string | null;
  created_at: string;
};

const WAITLIST_COLUMNS_WITH_PAYMENT =
  "id, artist_name, email, country, city, instagram, phone, note, meeting_at, payment_status, payment_amount, payment_currency, tilopay_order_number, tilopay_transaction_id, tilopay_auth_code, paid_at, status, referral_code, created_at";

const WAITLIST_COLUMNS =
  "id, artist_name, email, country, city, instagram, phone, note, meeting_at, status, referral_code, created_at";

const WAITLIST_COLUMNS_LEGACY =
  "id, artist_name, email, country, city, instagram, phone, note, status, referral_code, created_at";

const COLUMN_SETS = [
  WAITLIST_COLUMNS_WITH_PAYMENT,
  WAITLIST_COLUMNS,
  WAITLIST_COLUMNS_LEGACY,
] as const;

export class SupabaseWaitlistRepository implements WaitlistRepository {
  async findByEmail(email: string): Promise<WaitlistSignup | null> {
    const supabase = createSupabaseAdminClient();
    for (let i = 0; i < COLUMN_SETS.length; i++) {
      const res = await supabase
        .from("dj_waitlist")
        .select(COLUMN_SETS[i])
        .eq("email", email)
        .maybeSingle();

      if (res.error && isPostgrestSchemaFailure(res.error.code) && i < COLUMN_SETS.length - 1) {
        continue;
      }

      const row = readPostgrestResult(res, { operation: "waitlist.findByEmail" });
      return row ? mapSignup(row as unknown as WaitlistRow) : null;
    }
    return null;
  }

  async insert(draft: WaitlistDraft): Promise<WaitlistSignup> {
    const supabase = createSupabaseAdminClient();
    const basePayload: Record<string, unknown> = {
      artist_name: draft.artistName,
      email: draft.email,
      country: draft.country,
      city: draft.city,
      instagram: draft.instagram,
      phone: draft.phone,
      note: draft.note,
    };
    if (draft.meetingAt) {
      basePayload.meeting_at = draft.meetingAt;
    }
    if (draft.referralCode) {
      basePayload.referral_code = draft.referralCode;
    }
    if (draft.paymentStatus === "paid") {
      basePayload.payment_status = "paid";
      if (draft.paymentAmount !== undefined && draft.paymentAmount !== null) {
        basePayload.payment_amount = draft.paymentAmount;
      }
      if (draft.paymentCurrency) {
        basePayload.payment_currency = draft.paymentCurrency;
      }
      if (draft.tilopayOrderNumber) {
        basePayload.tilopay_order_number = draft.tilopayOrderNumber;
      }
      if (draft.tilopayTransactionId) {
        basePayload.tilopay_transaction_id = draft.tilopayTransactionId;
      }
      if (draft.tilopayAuthCode) {
        basePayload.tilopay_auth_code = draft.tilopayAuthCode;
      }
      if (draft.paidAt) {
        basePayload.paid_at = draft.paidAt;
      }
    }

    const primary = await supabase
      .from("dj_waitlist")
      .insert(basePayload)
      .select(WAITLIST_COLUMNS_WITH_PAYMENT)
      .single();

    if (primary.error && isPostgrestSchemaFailure(primary.error.code)) {
      const paymentFallback = {
        paymentStatus: draft.paymentStatus ?? "unpaid",
        paymentAmount: draft.paymentAmount ?? null,
        paymentCurrency: draft.paymentCurrency ?? null,
        tilopayOrderNumber: draft.tilopayOrderNumber ?? null,
        tilopayTransactionId: draft.tilopayTransactionId ?? null,
        tilopayAuthCode: draft.tilopayAuthCode ?? null,
        paidAt: draft.paidAt ?? null,
      };

      const withoutPaymentCols: Record<string, unknown> = { ...basePayload };
      delete withoutPaymentCols.payment_status;
      delete withoutPaymentCols.payment_amount;
      delete withoutPaymentCols.payment_currency;
      delete withoutPaymentCols.tilopay_order_number;
      delete withoutPaymentCols.tilopay_transaction_id;
      delete withoutPaymentCols.tilopay_auth_code;
      delete withoutPaymentCols.paid_at;
      withoutPaymentCols.note = encodePaymentInNote(draft.note, paymentFallback);

      const mid = await supabase
        .from("dj_waitlist")
        .insert(withoutPaymentCols)
        .select(WAITLIST_COLUMNS)
        .single();

      if (!mid.error) {
        const row = readPostgrestResult(mid, { operation: "waitlist.insert" });
        if (!row) throw serviceUnavailable("No se pudo guardar la inscripción");
        return mapSignup(row as unknown as WaitlistRow);
      }

      if (!isPostgrestSchemaFailure(mid.error.code)) {
        const row = readPostgrestResult(mid, { operation: "waitlist.insert" });
        if (!row) throw serviceUnavailable("No se pudo guardar la inscripción");
        return mapSignup(row as unknown as WaitlistRow);
      }

      // Fallback if meeting_at or referral_code column is not yet migrated in DB
      delete withoutPaymentCols.meeting_at;
      withoutPaymentCols.note = encodePaymentInNote(
        encodeMeetingInNote(draft.note, draft.meetingAt),
        paymentFallback,
      );

      let fallback = await supabase
        .from("dj_waitlist")
        .insert(withoutPaymentCols)
        .select(WAITLIST_COLUMNS_LEGACY)
        .single();

      if (
        fallback.error &&
        isPostgrestSchemaFailure(fallback.error.code) &&
        withoutPaymentCols.referral_code
      ) {
        delete withoutPaymentCols.referral_code;
        fallback = await supabase
          .from("dj_waitlist")
          .insert(withoutPaymentCols)
          .select(WAITLIST_COLUMNS_LEGACY)
          .single();
      }

      const row = readPostgrestResult(fallback, {
        operation: "waitlist.insert",
      });
      if (!row) {
        throw serviceUnavailable("No se pudo guardar la inscripción");
      }
      return mapSignup(row as unknown as WaitlistRow);
    }

    const row = readPostgrestResult(primary, { operation: "waitlist.insert" });

    if (!row) {
      throw serviceUnavailable("No se pudo guardar la inscripción");
    }

    return mapSignup(row as unknown as WaitlistRow);
  }

  async list(): Promise<WaitlistSignup[]> {
    const supabase = createSupabaseAdminClient();
    for (let i = 0; i < COLUMN_SETS.length; i++) {
      const res = await supabase
        .from("dj_waitlist")
        .select(COLUMN_SETS[i])
        .order("created_at", { ascending: false })
        .limit(200);

      if (res.error && isPostgrestSchemaFailure(res.error.code) && i < COLUMN_SETS.length - 1) {
        continue;
      }

      if (res.error) {
        failPostgrestQuery(res.error, { operation: "waitlist.list" });
      }

      return ((res.data ?? []) as unknown as WaitlistRow[]).map(mapSignup);
    }
    return [];
  }

  async findById(id: string): Promise<WaitlistSignup | null> {
    const supabase = createSupabaseAdminClient();
    for (let i = 0; i < COLUMN_SETS.length; i++) {
      const res = await supabase
        .from("dj_waitlist")
        .select(COLUMN_SETS[i])
        .eq("id", id)
        .maybeSingle();

      if (res.error && isPostgrestSchemaFailure(res.error.code) && i < COLUMN_SETS.length - 1) {
        continue;
      }

      const row = readPostgrestResult(res, { operation: "waitlist.findById" });
      return row ? mapSignup(row as unknown as WaitlistRow) : null;
    }
    return null;
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
  const { meetingAt, note: noteAfterMeeting } = decodeMeetingFromNote(
    row.note,
    row.meeting_at ?? null,
  );
  const { payment, note } = decodePaymentFromNote(noteAfterMeeting, {
    paymentStatus: row.payment_status ?? undefined,
    paymentAmount:
      row.payment_amount !== null && row.payment_amount !== undefined
        ? Number(row.payment_amount)
        : null,
    paymentCurrency: row.payment_currency ?? null,
    tilopayOrderNumber: row.tilopay_order_number ?? null,
    tilopayTransactionId: row.tilopay_transaction_id ?? null,
    tilopayAuthCode: row.tilopay_auth_code ?? null,
    paidAt: row.paid_at ?? null,
  });

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
    paymentStatus: payment.paymentStatus,
    paymentAmount: payment.paymentAmount,
    paymentCurrency: payment.paymentCurrency,
    tilopayOrderNumber: payment.tilopayOrderNumber,
    tilopayTransactionId: payment.tilopayTransactionId,
    tilopayAuthCode: payment.tilopayAuthCode,
    paidAt: payment.paidAt,
    status: row.status,
    createdAt: row.created_at,
  };
}
