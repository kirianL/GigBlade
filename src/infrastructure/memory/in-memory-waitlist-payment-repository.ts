import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import type {
  CreatePendingOrderInput,
  MarkOrderFailedInput,
  MarkOrderPaidInput,
  WaitlistPaymentRepository,
} from "@/application/ports/waitlist-payment-repository";
import type { WaitlistPaymentOrder } from "@/domain/tilopay";

export class InMemoryWaitlistPaymentRepository
  implements WaitlistPaymentRepository
{
  private readonly orders = new Map<string, WaitlistPaymentOrder>();
  private readonly filePath?: string;

  constructor(filePath?: string) {
    this.filePath = filePath;
    if (filePath && existsSync(filePath)) {
      try {
        const parsed = JSON.parse(
          readFileSync(filePath, "utf8"),
        ) as WaitlistPaymentOrder[];
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item?.orderNumber) {
              this.orders.set(item.orderNumber, item);
            }
          }
        }
      } catch {
        // Ignore corrupted memory cache file
      }
    }
  }

  private persist(): void {
    if (!this.filePath) return;
    try {
      mkdirSync(dirname(this.filePath), { recursive: true });
      writeFileSync(
        this.filePath,
        JSON.stringify([...this.orders.values()]),
        "utf8",
      );
    } catch {
      // Ignore write failures in read-only environments
    }
  }

  async createPendingOrder(
    input: CreatePendingOrderInput,
  ): Promise<WaitlistPaymentOrder> {
    const now = new Date().toISOString();
    const order: WaitlistPaymentOrder = {
      id: crypto.randomUUID(),
      orderNumber: input.orderNumber,
      artistName: input.draft.artistName,
      email: input.draft.email,
      country: input.draft.country,
      city: input.draft.city,
      instagram: input.draft.instagram,
      phone: input.draft.phone,
      note: input.draft.note,
      meetingAt: input.meetingAt,
      referralCode: input.draft.referralCode ?? null,
      packageId: input.draft.packageId ?? "all_inclusive",
      amount: input.amount,
      currency: input.currency,
      status: "pending",
      tilopayTransactionId: null,
      tilopayAuthCode: null,
      tilopayResponseCode: null,
      tilopayDescription: null,
      waitlistId: null,
      expiresAt: input.expiresAt,
      paidAt: null,
      createdAt: now,
      updatedAt: now,
    };

    this.orders.set(order.orderNumber, order);
    this.persist();
    return order;
  }

  async findByOrderNumber(
    orderNumber: string,
  ): Promise<WaitlistPaymentOrder | null> {
    return this.orders.get(orderNumber) ?? null;
  }

  async listActiveHeldSlots(nowIso = new Date().toISOString()): Promise<string[]> {
    const nowMs = Date.parse(nowIso);
    const held: string[] = [];
    for (const order of this.orders.values()) {
      if (order.status !== "pending") continue;
      const expiresMs = Date.parse(order.expiresAt);
      if (Number.isFinite(expiresMs) && expiresMs > nowMs) {
        held.push(order.meetingAt);
      }
    }
    return held;
  }

  async markPaid(input: MarkOrderPaidInput): Promise<WaitlistPaymentOrder | null> {
    const existing = this.orders.get(input.orderNumber);
    if (!existing) return null;
    const updated: WaitlistPaymentOrder = {
      ...existing,
      status: "paid",
      tilopayTransactionId: input.transactionId ?? existing.tilopayTransactionId,
      tilopayAuthCode: input.authCode ?? existing.tilopayAuthCode,
      tilopayResponseCode: input.responseCode ?? existing.tilopayResponseCode,
      tilopayDescription: input.description ?? existing.tilopayDescription,
      waitlistId: input.waitlistId ?? existing.waitlistId,
      paidAt: input.paidAt,
      updatedAt: new Date().toISOString(),
    };
    this.orders.set(updated.orderNumber, updated);
    this.persist();
    return updated;
  }

  async markFailed(
    input: MarkOrderFailedInput,
  ): Promise<WaitlistPaymentOrder | null> {
    const existing = this.orders.get(input.orderNumber);
    if (!existing || existing.status === "paid") return existing ?? null;
    const updated: WaitlistPaymentOrder = {
      ...existing,
      status: "failed",
      tilopayResponseCode: input.responseCode ?? existing.tilopayResponseCode,
      tilopayDescription: input.description ?? existing.tilopayDescription,
      updatedAt: new Date().toISOString(),
    };
    this.orders.set(updated.orderNumber, updated);
    this.persist();
    return updated;
  }
}
