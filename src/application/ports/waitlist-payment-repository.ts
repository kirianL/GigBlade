import type {
  TilopayCurrency,
  WaitlistPaymentOrder,
} from "@/domain/tilopay";
import type { WaitlistDraft } from "@/domain/waitlist";

export type CreatePendingOrderInput = {
  orderNumber: string;
  draft: WaitlistDraft;
  meetingAt: string;
  amount: number;
  currency: TilopayCurrency;
  expiresAt: string;
};

export type MarkOrderPaidInput = {
  orderNumber: string;
  transactionId: string | null;
  authCode: string | null;
  responseCode: string | null;
  description: string | null;
  waitlistId: string | null;
  paidAt: string;
};

export type MarkOrderFailedInput = {
  orderNumber: string;
  responseCode: string | null;
  description: string | null;
};

export interface WaitlistPaymentRepository {
  createPendingOrder(
    input: CreatePendingOrderInput,
  ): Promise<WaitlistPaymentOrder>;
  findByOrderNumber(orderNumber: string): Promise<WaitlistPaymentOrder | null>;
  listActiveHeldSlots(nowIso?: string): Promise<string[]>;
  markPaid(input: MarkOrderPaidInput): Promise<WaitlistPaymentOrder | null>;
  markFailed(input: MarkOrderFailedInput): Promise<WaitlistPaymentOrder | null>;
}
