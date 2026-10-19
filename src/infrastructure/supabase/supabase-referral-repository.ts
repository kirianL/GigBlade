import "server-only";

import type {
  CreateAffiliateInput,
  RecordConversionInput,
  RecordPayoutInput,
  ReferralRepository,
  UpdateAffiliateInput,
  UpdateSettingsInput,
} from "@/application/ports/referral-repository";
import { conflict, notFound, serviceUnavailable } from "@/domain/errors";
import {
  buildReferralLink,
  calculateCommission,
  DEFAULT_COMMISSION_PERCENTAGES,
  DEFAULT_PACKAGE_PRICES,
  type Affiliate,
  type AffiliateSummary,
  type CommissionPercentages,
  type PackagePrices,
  type ReferralCommissionSettings,
  type ReferralConversion,
  type ReferralPayout,
} from "@/domain/referral";
import { InMemoryReferralRepository } from "@/infrastructure/memory/in-memory-referral-repository";
import { createSupabaseAdminClient } from "@/infrastructure/supabase/admin";
import {
  failPostgrestQuery,
  isPostgrestSchemaFailure,
  readPostgrestResult,
} from "@/infrastructure/supabase/postgrest";

export class SupabaseReferralRepository implements ReferralRepository {
  private readonly fallback = new InMemoryReferralRepository();

  async findAffiliateByCode(code: string): Promise<Affiliate | null> {
    try {
      const supabase = createSupabaseAdminClient();
      const upper = code.trim().toUpperCase();
      const { data, error } = await supabase
        .from("affiliates")
        .select("*")
        .eq("code", upper)
        .maybeSingle();

      if (error) {
        if (isPostgrestSchemaFailure(error.code)) {
          return this.fallback.findAffiliateByCode(code);
        }
        failPostgrestQuery(error, { operation: "affiliates.findByCode" });
      }
      return data ? mapAffiliate(data) : null;
    } catch {
      return this.fallback.findAffiliateByCode(code);
    }
  }

  async findAffiliateById(id: string): Promise<Affiliate | null> {
    try {
      const supabase = createSupabaseAdminClient();
      const { data, error } = await supabase
        .from("affiliates")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        if (isPostgrestSchemaFailure(error.code)) {
          return this.fallback.findAffiliateById(id);
        }
        failPostgrestQuery(error, { operation: "affiliates.findById" });
      }
      return data ? mapAffiliate(data) : null;
    } catch {
      return this.fallback.findAffiliateById(id);
    }
  }

  async listAffiliates(): Promise<AffiliateSummary[]> {
    try {
      const supabase = createSupabaseAdminClient();
      const { data: affRows, error: affErr } = await supabase
        .from("affiliates")
        .select("*")
        .order("created_at", { ascending: false });

      if (affErr) {
        if (isPostgrestSchemaFailure(affErr.code)) {
          return this.fallback.listAffiliates();
        }
        failPostgrestQuery(affErr, { operation: "affiliates.list" });
      }

      const { data: convRows } = await supabase
        .from("referral_conversions")
        .select("affiliate_id, commission_amount, payout_status, status");

      const { data: payoutRows } = await supabase
        .from("referral_payouts")
        .select("affiliate_id, amount");

      const conversions = convRows ?? [];
      const payouts = payoutRows ?? [];

      return ((affRows ?? []) as Record<string, unknown>[]).map((row) => {
        const aff = mapAffiliate(row);
        const affConvs = conversions.filter((c) => c.affiliate_id === aff.id);
        const totalConversions = affConvs.length;
        const totalEarnedCrc = affConvs.reduce(
          (acc, c) => acc + Number(c.commission_amount || 0),
          0,
        );
        const affPayouts = payouts.filter((p) => p.affiliate_id === aff.id);
        const totalPaidCrc = affPayouts.reduce(
          (acc, p) => acc + Number(p.amount || 0),
          0,
        );
        const pendingBalanceCrc = Math.max(0, totalEarnedCrc - totalPaidCrc);
        const totalEarnedUsd = Number((totalEarnedCrc / 515).toFixed(2));
        const totalPaidUsd = Number((totalPaidCrc / 515).toFixed(2));
        const pendingBalanceUsd = Number((pendingBalanceCrc / 515).toFixed(2));

        return {
          ...aff,
          referralLink: buildReferralLink(aff.code),
          totalConversions,
          totalEarnedUsd,
          totalEarnedCrc,
          totalPaidUsd,
          totalPaidCrc,
          pendingBalanceUsd,
          pendingBalanceCrc,
          totalEarned: totalEarnedCrc,
          totalPaid: totalPaidCrc,
          pendingBalance: pendingBalanceCrc,
        };
      });
    } catch {
      return this.fallback.listAffiliates();
    }
  }

  async createAffiliate(input: CreateAffiliateInput): Promise<Affiliate> {
    const existing = await this.findAffiliateByCode(input.code);
    if (existing) {
      throw conflict(`El código de afiliado "${input.code}" ya está en uso.`);
    }

    try {
      const supabase = createSupabaseAdminClient();
      const { data: row, error } = await supabase
        .from("affiliates")
        .insert({
          code: input.code.toUpperCase(),
          name: input.name,
          email: input.email.toLowerCase(),
          phone: input.phone,
          payment_method: input.paymentMethod,
          payment_details: input.paymentDetails,
          custom_percentage_enabled: Boolean(input.customPercentageEnabled),
          custom_percentages: input.customPercentages ?? null,
        })
        .select()
        .single();

      if (error) {
        if (isPostgrestSchemaFailure(error.code)) {
          return this.fallback.createAffiliate(input);
        }
        failPostgrestQuery(error, { operation: "affiliates.create" });
      }

      if (!row) throw serviceUnavailable("No se pudo registrar el afiliado.");
      return mapAffiliate(row);
    } catch {
      return this.fallback.createAffiliate(input);
    }
  }

  async updateAffiliate(id: string, input: UpdateAffiliateInput): Promise<Affiliate> {
    try {
      const supabase = createSupabaseAdminClient();
      const updatePayload: Record<string, unknown> = {};
      if (input.name !== undefined) updatePayload.name = input.name;
      if (input.email !== undefined) updatePayload.email = input.email.toLowerCase();
      if (input.phone !== undefined) updatePayload.phone = input.phone;
      if (input.paymentMethod !== undefined) updatePayload.payment_method = input.paymentMethod;
      if (input.paymentDetails !== undefined) updatePayload.payment_details = input.paymentDetails;
      if (input.status !== undefined) updatePayload.status = input.status;
      if (input.customPercentageEnabled !== undefined) {
        updatePayload.custom_percentage_enabled = input.customPercentageEnabled;
      }
      if (input.customPercentages !== undefined) {
        updatePayload.custom_percentages = input.customPercentages;
      }

      const { data: row, error } = await supabase
        .from("affiliates")
        .update(updatePayload)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        if (isPostgrestSchemaFailure(error.code)) {
          return this.fallback.updateAffiliate(id, input);
        }
        failPostgrestQuery(error, { operation: "affiliates.update" });
      }

      if (!row) throw notFound("No encontramos ese afiliado.");
      return mapAffiliate(row);
    } catch {
      return this.fallback.updateAffiliate(id, input);
    }
  }

  async getSettings(): Promise<ReferralCommissionSettings> {
    try {
      const supabase = createSupabaseAdminClient();
      const { data: row, error } = await supabase
        .from("referral_commission_settings")
        .select("*")
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        if (isPostgrestSchemaFailure(error.code)) {
          return this.fallback.getSettings();
        }
        failPostgrestQuery(error, { operation: "referral_settings.get" });
      }

      if (!row) {
        return this.fallback.getSettings();
      }

      return mapSettings(row);
    } catch {
      return this.fallback.getSettings();
    }
  }

  async updateSettings(input: UpdateSettingsInput): Promise<ReferralCommissionSettings> {
    try {
      const supabase = createSupabaseAdminClient();
      const { data: current, error: currentErr } = await supabase
        .from("referral_commission_settings")
        .select("*")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (currentErr && isPostgrestSchemaFailure(currentErr.code)) {
        return this.fallback.updateSettings(input);
      }

      const currentPercentages = (current?.percentages as Record<string, unknown>) || {};
      const currentPackagePrices = (current?.package_prices as Record<string, unknown>) || {};

      const percentages = {
        ...currentPercentages,
        ...(typeof input.percentages === "object" ? input.percentages : {}),
        initial_setup: typeof input.initialSetupPercent === "number" ? input.initialSetupPercent : (Number(current?.initial_setup_percent) || 20),
        monthly: typeof input.monthlyPercent === "number" ? input.monthlyPercent : (Number(current?.monthly_percent) || 15),
        developer: typeof input.developerPercent === "number" ? input.developerPercent : (Number(currentPercentages.developer) || 50),
        founder: typeof input.founderPercent === "number" ? input.founderPercent : (Number(currentPercentages.founder) || 50),
        maintenance_percent: typeof input.maintenancePercent === "number" ? input.maintenancePercent : (Number(currentPercentages.maintenance_percent) || 0),
      };

      const packagePrices = {
        ...currentPackagePrices,
        ...(typeof input.packagePrices === "object" ? input.packagePrices : {}),
        initial_setup: typeof input.initialSetupPriceUsd === "number" ? input.initialSetupPriceUsd : (Number(current?.initial_setup_price_usd) || 100),
        monthly: typeof input.monthlyPriceUsd === "number" ? input.monthlyPriceUsd : (Number(current?.monthly_price_usd) || 30),
        maintenance_monthly_cost_usd: typeof input.maintenanceMonthlyCostUsd === "number" ? input.maintenanceMonthlyCostUsd : (Number(currentPackagePrices.maintenance_monthly_cost_usd) || 0),
      };

      const payload: Record<string, unknown> = {
        currency: input.currency || current?.currency || "USD",
        exchange_rate_crc: typeof input.exchangeRateCrc === "number" ? input.exchangeRateCrc : (Number(current?.exchange_rate_crc) || 515),
        initial_setup_price_usd: typeof input.initialSetupPriceUsd === "number" ? input.initialSetupPriceUsd : (Number(current?.initial_setup_price_usd) || 100),
        initial_setup_percent: typeof input.initialSetupPercent === "number" ? input.initialSetupPercent : (Number(current?.initial_setup_percent) || 20),
        monthly_price_usd: typeof input.monthlyPriceUsd === "number" ? input.monthlyPriceUsd : (Number(current?.monthly_price_usd) || 30),
        monthly_percent: typeof input.monthlyPercent === "number" ? input.monthlyPercent : (Number(current?.monthly_percent) || 15),
        model: input.model || current?.model || "percentage",
        percentages,
        package_prices: packagePrices,
        updated_by: input.updatedBy ?? null,
        updated_at: new Date().toISOString(),
      };

      let row: unknown;
      if (current?.id) {
        const { data, error } = await supabase
          .from("referral_commission_settings")
          .update(payload)
          .eq("id", current.id)
          .select()
          .single();

        if (error) {
          if (isPostgrestSchemaFailure(error.code)) {
            return this.fallback.updateSettings(input);
          }
          failPostgrestQuery(error, { operation: "referral_settings.update" });
        }
        row = data;
      } else {
        const { data, error } = await supabase
          .from("referral_commission_settings")
          .insert({
            ...payload,
            is_active: true,
          })
          .select()
          .single();

        if (error) {
          if (isPostgrestSchemaFailure(error.code)) {
            return this.fallback.updateSettings(input);
          }
          failPostgrestQuery(error, { operation: "referral_settings.insert" });
        }
        row = data;
      }

      if (!row) throw serviceUnavailable("No se pudo actualizar las tarifas.");
      return mapSettings(row as Record<string, unknown>);
    } catch {
      return this.fallback.updateSettings(input);
    }
  }

  async recordConversion(input: RecordConversionInput): Promise<ReferralConversion> {
    try {
      const supabase = createSupabaseAdminClient();
      const affiliate = await this.findAffiliateById(input.affiliateId);
      const settings = await this.getSettings();

      const calc = calculateCommission({
        packageId: input.packageId,
        settings,
        affiliate,
      });

      const packagePrice = input.packagePrice ?? calc.packagePrice;
      const commissionPercentage =
        input.commissionPercentage ?? calc.commissionPercentage;
      const commissionAmount = input.commissionAmount ?? calc.commissionAmount;
      const currency = input.currency ?? calc.currency;

      const { data: row, error } = await supabase
        .from("referral_conversions")
        .insert({
          affiliate_id: input.affiliateId,
          dj_name: input.djName,
          dj_email: input.djEmail,
          dj_waitlist_id: input.djWaitlistId ?? null,
          tenant_id: input.tenantId ?? null,
          charge_type: calc.chargeType,
          amount_usd: calc.amountUsd,
          amount_crc: calc.amountCrc,
          package_id: input.packageId ?? calc.chargeType ?? "initial_setup",
          package_price: packagePrice,
          commission_percentage: commissionPercentage,
          commission_amount_usd: calc.commissionAmountUsd,
          commission_amount_crc: calc.commissionAmountCrc,
          commission_amount: commissionAmount,
          currency,
          status: "approved",
          payout_status: "unpaid",
        })
        .select()
        .single();

      if (error) {
        if (isPostgrestSchemaFailure(error.code)) {
          return this.fallback.recordConversion(input);
        }
        failPostgrestQuery(error, { operation: "referral_conversions.insert" });
      }

      if (!row) throw serviceUnavailable("No se pudo registrar la comisión.");
      return mapConversion(row, affiliate);
    } catch {
      return this.fallback.recordConversion(input);
    }
  }

  async listConversions(affiliateId?: string): Promise<ReferralConversion[]> {
    try {
      const supabase = createSupabaseAdminClient();
      let query = supabase
        .from("referral_conversions")
        .select("*, affiliates(id, code, name)")
        .order("created_at", { ascending: false })
        .limit(200);

      if (affiliateId) {
        query = query.eq("affiliate_id", affiliateId);
      }

      const { data, error } = await query;
      if (error) {
        if (isPostgrestSchemaFailure(error.code)) {
          return this.fallback.listConversions(affiliateId);
        }
        failPostgrestQuery(error, { operation: "referral_conversions.list" });
      }

      return ((data ?? []) as Record<string, unknown>[]).map((row) => {
        const aff = row.affiliates as { id?: string; code?: string; name?: string } | null;
        return mapConversion(row, aff ? { code: aff.code, name: aff.name } : null);
      });
    } catch {
      return this.fallback.listConversions(affiliateId);
    }
  }

  async recordPayout(input: RecordPayoutInput): Promise<ReferralPayout> {
    try {
      const supabase = createSupabaseAdminClient();
      const affiliate = await this.findAffiliateById(input.affiliateId);
      if (!affiliate) throw notFound("No encontramos ese afiliado.");

      const { data: row, error } = await supabase
        .from("referral_payouts")
        .insert({
          affiliate_id: input.affiliateId,
          amount: input.amount,
          currency: input.currency,
          method: input.method,
          referenceNumber: input.referenceNumber,
          note: input.note ?? null,
          created_by: input.createdBy ?? null,
        })
        .select()
        .single();

      if (error) {
        if (isPostgrestSchemaFailure(error.code)) {
          return this.fallback.recordPayout(input);
        }
        failPostgrestQuery(error, { operation: "referral_payouts.insert" });
      }

      if (!row) throw serviceUnavailable("No se pudo registrar la liquidación.");

      const payout = mapPayout(row, affiliate);

      // Marcar conversiones como pagadas
      const { data: unpaid } = await supabase
        .from("referral_conversions")
        .select("id, commission_amount")
        .eq("affiliate_id", input.affiliateId)
        .eq("payout_status", "unpaid")
        .eq("status", "approved")
        .order("created_at", { ascending: true });

      if (unpaid && unpaid.length > 0) {
        let remaining = input.amount;
        const toPay: string[] = [];
        for (const item of unpaid) {
          toPay.push(item.id);
          remaining -= Number(item.commission_amount || 0);
          if (remaining <= 0) break;
        }
        if (toPay.length > 0) {
          await supabase
            .from("referral_conversions")
            .update({
              payout_id: payout.id,
              payout_status: "paid",
              updated_at: new Date().toISOString(),
            })
            .in("id", toPay);
        }
      }

      return payout;
    } catch {
      return this.fallback.recordPayout(input);
    }
  }

  async listPayouts(affiliateId?: string): Promise<ReferralPayout[]> {
    try {
      const supabase = createSupabaseAdminClient();
      let query = supabase
        .from("referral_payouts")
        .select("*, affiliates(id, code, name)")
        .order("paid_at", { ascending: false })
        .limit(100);

      if (affiliateId) {
        query = query.eq("affiliate_id", affiliateId);
      }

      const { data, error } = await query;
      if (error) {
        if (isPostgrestSchemaFailure(error.code)) {
          return this.fallback.listPayouts(affiliateId);
        }
        failPostgrestQuery(error, { operation: "referral_payouts.list" });
      }

      return ((data ?? []) as Record<string, unknown>[]).map((row) => {
        const aff = row.affiliates as { id?: string; code?: string; name?: string } | null;
        return mapPayout(row, aff ? { code: aff.code ?? "", name: aff.name ?? "" } : null);
      });
    } catch {
      return this.fallback.listPayouts(affiliateId);
    }
  }
}

function mapAffiliate(raw: Record<string, unknown>): Affiliate {
  return {
    id: String(raw.id),
    code: String(raw.code),
    name: String(raw.name),
    email: String(raw.email),
    phone: raw.phone ? String(raw.phone) : null,
    paymentMethod: raw.payment_method === "iban" ? "iban" : "sinpe",
    paymentDetails: (raw.payment_details as Affiliate["paymentDetails"]) || {},
    customPercentageEnabled: Boolean(raw.custom_percentage_enabled),
    customPercentages: (raw.custom_percentages as CommissionPercentages) || null,
    status: (raw.status as Affiliate["status"]) || "active",
    createdAt: String(raw.created_at),
    updatedAt: String(raw.updated_at),
  };
}

function mapSettings(raw: Record<string, unknown>): ReferralCommissionSettings {
  const exchangeRateCrc = Number(raw.exchange_rate_crc || 515);
  const initialSetupPriceUsd = Number(raw.initial_setup_price_usd || 100);
  const initialSetupPercent = Number(raw.initial_setup_percent || 20);
  const monthlyPriceUsd = Number(raw.monthly_price_usd || 30);
  const monthlyPercent = Number(raw.monthly_percent || 15);
  const percentages = (raw.percentages as Record<string, unknown>) || {};
  const packagePrices = (raw.package_prices as Record<string, unknown>) || {};

  const developerPercent = Number(
    raw.developer_percent ?? percentages.developer ?? percentages.developer_percent ?? 50,
  );
  const founderPercent = Number(
    raw.founder_percent ?? percentages.founder ?? percentages.founder_percent ?? 50,
  );
  const maintenanceMonthlyCostUsd = Number(
    raw.maintenance_monthly_cost_usd ?? packagePrices.maintenance_monthly_cost_usd ?? packagePrices.maintenance ?? 0,
  );
  const maintenancePercent = Number(
    raw.maintenance_percent ?? percentages.maintenance_percent ?? percentages.maintenance ?? 0,
  );

  return {
    id: String(raw.id),
    currency: String(raw.currency || "USD"),
    exchangeRateCrc,
    initialSetupPriceUsd,
    initialSetupPercent,
    monthlyPriceUsd,
    monthlyPercent,
    developerPercent,
    founderPercent,
    maintenanceMonthlyCostUsd,
    maintenancePercent,
    model: raw.model === "fixed" ? "fixed" : "percentage",
    percentages: (raw.percentages as CommissionPercentages) || {
      initial_setup: initialSetupPercent,
      monthly: monthlyPercent,
      ...DEFAULT_COMMISSION_PERCENTAGES,
    },
    packagePrices: (raw.package_prices as PackagePrices) || {
      initial_setup: initialSetupPriceUsd,
      monthly: monthlyPriceUsd,
      ...DEFAULT_PACKAGE_PRICES,
    },
    isActive: Boolean(raw.is_active),
    updatedAt: String(raw.updated_at),
  };
}

function mapConversion(
  raw: Record<string, unknown>,
  affiliate?: { code?: string; name?: string } | null,
): ReferralConversion {
  const chargeType = String(raw.charge_type || raw.package_id || "initial_setup");
  const isMonthly = chargeType === "monthly" || chargeType === "mensualidad";
  const amountUsd = Number(raw.amount_usd || (isMonthly ? 30 : 100));
  const amountCrc = Number(raw.amount_crc || raw.package_price || amountUsd * 515);
  const commissionPercentage = Number(raw.commission_percentage || (isMonthly ? 15 : 20));
  const commissionAmountUsd = Number(
    raw.commission_amount_usd || Number(((amountUsd * commissionPercentage) / 100).toFixed(2)),
  );
  const commissionAmountCrc = Number(
    raw.commission_amount_crc || raw.commission_amount || Math.round(commissionAmountUsd * 515),
  );

  return {
    id: String(raw.id),
    affiliateId: String(raw.affiliate_id),
    affiliateCode: affiliate?.code || "UNKNOWN",
    affiliateName: affiliate?.name || "Afiliado",
    djName: String(raw.dj_name),
    djEmail: String(raw.dj_email),
    djWaitlistId: raw.dj_waitlist_id ? String(raw.dj_waitlist_id) : null,
    tenantId: raw.tenant_id ? String(raw.tenant_id) : null,
    chargeType,
    amountUsd,
    amountCrc,
    commissionPercentage,
    commissionAmountUsd,
    commissionAmountCrc,
    packageId: chargeType,
    packagePrice: amountCrc,
    commissionAmount: commissionAmountCrc,
    currency: "USD",
    status: (raw.status as ReferralConversion["status"]) || "approved",
    payoutId: raw.payout_id ? String(raw.payout_id) : null,
    payoutStatus: (raw.payout_status as ReferralConversion["payoutStatus"]) || "unpaid",
    createdAt: String(raw.created_at),
    updatedAt: String(raw.updated_at),
  };
}

function mapPayout(
  raw: Record<string, unknown>,
  affiliate?: { code?: string; name?: string } | null,
): ReferralPayout {
  return {
    id: String(raw.id),
    affiliateId: String(raw.affiliate_id),
    affiliateCode: affiliate?.code || "UNKNOWN",
    affiliateName: affiliate?.name || "Afiliado",
    amount: Number(raw.amount),
    currency: String(raw.currency || "CRC"),
    method: raw.method === "iban" ? "iban" : "sinpe",
    referenceNumber: String(raw.reference_number),
    note: raw.note ? String(raw.note) : null,
    paidAt: String(raw.paid_at),
  };
}
