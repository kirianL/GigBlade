import "server-only";

import type {
  CreatePendingOrderInput,
  MarkOrderFailedInput,
  MarkOrderPaidInput,
  WaitlistPaymentRepository,
} from "@/application/ports/waitlist-payment-repository";
import { serviceUnavailable } from "@/domain/errors";
import type {
  TilopayCurrency,
  WaitlistPaymentOrder,
  WaitlistPaymentStatus,
} from "@/domain/tilopay";
import { InMemoryWaitlistPaymentRepository } from "@/infrastructure/memory/in-memory-waitlist-payment-repository";
import { createSupabaseAdminClient } from "@/infrastructure/supabase/admin";
import {
  failPostgrestQuery,
  isPostgrestSchemaFailure,
  readPostgrestResult,
} from "@/infrastructure/supabase/postgrest";

type OrderRow = {
  id: string;
  order_number: string;
  artist_name: string;
  email: string;
  country: "CR" | "US";
  city: string | null;
  instagram: string | null;
  phone: string | null;
  note: string | null;
  meeting_at: string;
  referral_code: string | null;
  package_id: string;
  amount: number | string;
  currency: TilopayCurrency;
  status: WaitlistPaymentStatus;
  tilopay_transaction_id: string | null;
  tilopay_auth_code: string | null;
  tilopay_response_code: string | null;
  tilopay_description: string | null;
  waitlist_id: string | null;
  expires_at: string;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

const ORDER_COLUMNS =
  "id, order_number, artist_name, email, country, city, instagram, phone, note, meeting_at, referral_code, package_id, amount, currency, status, tilopay_transaction_id, tilopay_auth_code, tilopay_response_code, tilopay_description, waitlist_id, expires_at, paid_at, created_at, updated_at";

function mapOrder(row: OrderRow): WaitlistPaymentOrder {
  return {
    id: row.id,
    orderNumber: row.order_number,
    artistName: row.artist_name,
    email: row.email,
    country: row.country,
    city: row.city,
    instagram: row.instagram,
    phone: row.phone,
    note: row.note,
    meetingAt: row.meeting_at,
    referralCode: row.referral_code,
    packageId: row.package_id,
    amount: Number(row.amount),
    currency: row.currency,
    status: row.status,
    tilopayTransactionId: row.tilopay_transaction_id,
    tilopayAuthCode: row.tilopay_auth_code,
    tilopayResponseCode: row.tilopay_response_code,
    tilopayDescription: row.tilopay_description,
    waitlistId: row.waitlist_id,
    expiresAt: row.expires_at,
    paidAt: row.paid_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SupabaseWaitlistPaymentRepository
  implements WaitlistPaymentRepository
{
  private readonly fallback = new InMemoryWaitlistPaymentRepository();

  async createPendingOrder(
    input: CreatePendingOrderInput,
  ): Promise<WaitlistPaymentOrder> {
    const supabase = createSupabaseAdminClient();
    const res = await supabase
      .from("waitlist_payment_orders")
      .insert({
        order_number: input.orderNumber,
        artist_name: input.draft.artistName,
        email: input.draft.email,
        country: input.draft.country,
        city: input.draft.city,
        instagram: input.draft.instagram,
        phone: input.draft.phone,
        note: input.draft.note,
        meeting_at: input.meetingAt,
        referral_code: input.draft.referralCode ?? null,
        package_id: input.draft.packageId ?? "all_inclusive",
        amount: input.amount,
        currency: input.currency,
        status: "pending",
        expires_at: input.expiresAt,
      })
      .select(ORDER_COLUMNS)
      .single();

    if (res.error && isPostgrestSchemaFailure(res.error.code)) {
      return this.fallback.createPendingOrder(input);
    }

    const row = readPostgrestResult(res, {
      operation: "waitlistPayments.createPendingOrder",
    });
    if (!row) {
      throw serviceUnavailable("No se pudo registrar la orden de pago.");
    }
    return mapOrder(row as OrderRow);
  }

  async findByOrderNumber(
    orderNumber: string,
  ): Promise<WaitlistPaymentOrder | null> {
    const supabase = createSupabaseAdminClient();
    const res = await supabase
      .from("waitlist_payment_orders")
      .select(ORDER_COLUMNS)
      .eq("order_number", orderNumber)
      .maybeSingle();

    if (res.error && isPostgrestSchemaFailure(res.error.code)) {
      return this.fallback.findByOrderNumber(orderNumber);
    }

    const row = readPostgrestResult(res, {
      operation: "waitlistPayments.findByOrderNumber",
    });
    return row ? mapOrder(row as OrderRow) : null;
  }

  async listActiveHeldSlots(
    nowIso = new Date().toISOString(),
  ): Promise<string[]> {
    const supabase = createSupabaseAdminClient();
    const res = await supabase
      .from("waitlist_payment_orders")
      .select("meeting_at")
      .eq("status", "pending")
      .gt("expires_at", nowIso);

    if (res.error && isPostgrestSchemaFailure(res.error.code)) {
      return this.fallback.listActiveHeldSlots(nowIso);
    }

    if (res.error) {
      failPostgrestQuery(res.error, {
        operation: "waitlistPayments.listActiveHeldSlots",
      });
    }

    return ((res.data ?? []) as Array<{ meeting_at: string }>)
      .map((r) => r.meeting_at)
      .filter(Boolean);
  }

  async markPaid(
    input: MarkOrderPaidInput,
  ): Promise<WaitlistPaymentOrder | null> {
    const supabase = createSupabaseAdminClient();
    const res = await supabase
      .from("waitlist_payment_orders")
      .update({
        status: "paid",
        tilopay_transaction_id: input.transactionId,
        tilopay_auth_code: input.authCode,
        tilopay_response_code: input.responseCode,
        tilopay_description: input.description,
        waitlist_id: input.waitlistId,
        paid_at: input.paidAt,
        updated_at: new Date().toISOString(),
      })
      .eq("order_number", input.orderNumber)
      .select(ORDER_COLUMNS)
      .maybeSingle();

    if (res.error && isPostgrestSchemaFailure(res.error.code)) {
      return this.fallback.markPaid(input);
    }

    const row = readPostgrestResult(res, {
      operation: "waitlistPayments.markPaid",
    });
    return row ? mapOrder(row as OrderRow) : null;
  }

  async markFailed(
    input: MarkOrderFailedInput,
  ): Promise<WaitlistPaymentOrder | null> {
    const supabase = createSupabaseAdminClient();
    const res = await supabase
      .from("waitlist_payment_orders")
      .update({
        status: "failed",
        tilopay_response_code: input.responseCode,
        tilopay_description: input.description,
        updated_at: new Date().toISOString(),
      })
      .eq("order_number", input.orderNumber)
      .neq("status", "paid")
      .select(ORDER_COLUMNS)
      .maybeSingle();

    if (res.error && isPostgrestSchemaFailure(res.error.code)) {
      return this.fallback.markFailed(input);
    }

    const row = readPostgrestResult(res, {
      operation: "waitlistPayments.markFailed",
    });
    return row ? mapOrder(row as OrderRow) : null;
  }
}
