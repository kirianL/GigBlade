import type {
  CreateAffiliateInput,
  RecordConversionInput,
  RecordPayoutInput,
  ReferralRepository,
  UpdateAffiliateInput,
  UpdateSettingsInput,
} from "@/application/ports/referral-repository";
import { conflict, notFound } from "@/domain/errors";
import {
  buildReferralLink,
  calculateCommission,
  DEFAULT_COMMISSION_PERCENTAGES,
  DEFAULT_EXCHANGE_RATE_CRC,
  DEFAULT_INITIAL_SETUP_PERCENT,
  DEFAULT_INITIAL_SETUP_USD,
  DEFAULT_MONTHLY_PERCENT,
  DEFAULT_MONTHLY_USD,
  DEFAULT_PACKAGE_PRICES,
  type Affiliate,
  type AffiliateSummary,
  type ReferralCommissionSettings,
  type ReferralConversion,
  type ReferralPayout,
} from "@/domain/referral";

export class InMemoryReferralRepository implements ReferralRepository {
  private readonly affiliates = new Map<string, Affiliate>();
  private readonly conversions: ReferralConversion[] = [];
  private readonly payouts: ReferralPayout[] = [];
  private settings: ReferralCommissionSettings = {
    currency: "USD",
    exchangeRateCrc: DEFAULT_EXCHANGE_RATE_CRC,
    initialSetupPriceUsd: DEFAULT_INITIAL_SETUP_USD,
    initialSetupPercent: DEFAULT_INITIAL_SETUP_PERCENT,
    monthlyPriceUsd: DEFAULT_MONTHLY_USD,
    monthlyPercent: DEFAULT_MONTHLY_PERCENT,
    developerPercent: 50,
    founderPercent: 50,
    maintenanceMonthlyCostUsd: 0,
    maintenancePercent: 0,
    model: "percentage",
    percentages: { ...DEFAULT_COMMISSION_PERCENTAGES },
    packagePrices: { ...DEFAULT_PACKAGE_PRICES },
    isActive: true,
    updatedAt: new Date().toISOString(),
  };

  constructor() {
    this.seedDefaults();
  }

  private seedDefaults() {
    const maxx: Affiliate = {
      id: "aff_maxx_01",
      code: "MAXX",
      name: "Maxx (Promotor)",
      email: "maxx@gigblade.localhost",
      phone: "+506 8888 1111",
      paymentMethod: "sinpe",
      paymentDetails: { sinpePhone: "88881111" },
      customPercentageEnabled: false,
      customPercentages: null,
      status: "active",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const fama: Affiliate = {
      id: "aff_fama_02",
      code: "FAMA",
      name: "Fama Producciones",
      email: "fama@gigblade.localhost",
      phone: "+506 8777 2222",
      paymentMethod: "sinpe",
      paymentDetails: { sinpePhone: "87772222" },
      customPercentageEnabled: false,
      customPercentages: null,
      status: "active",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.affiliates.set(maxx.id, maxx);
    this.affiliates.set(fama.id, fama);

    // Conversiones iniciales: cobros iniciales y mensualidades
    this.conversions.push(
      {
        id: "conv_01",
        affiliateId: maxx.id,
        affiliateCode: maxx.code,
        affiliateName: maxx.name,
        djName: "DJ Nova",
        djEmail: "nova@music.cr",
        djWaitlistId: null,
        tenantId: null,
        chargeType: "initial_setup",
        amountUsd: 100,
        amountCrc: 51500,
        commissionPercentage: 20,
        commissionAmountUsd: 20,
        commissionAmountCrc: 10300,
        packageId: "initial_setup",
        packagePrice: 51500,
        commissionAmount: 10300,
        currency: "USD",
        status: "approved",
        payoutId: null,
        payoutStatus: "unpaid",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "conv_02",
        affiliateId: maxx.id,
        affiliateCode: maxx.code,
        affiliateName: maxx.name,
        djName: "DJ Alex Costa",
        djEmail: "alex@club.cr",
        djWaitlistId: null,
        tenantId: null,
        chargeType: "monthly",
        amountUsd: 30,
        amountCrc: 15450,
        commissionPercentage: 15,
        commissionAmountUsd: 4.5,
        commissionAmountCrc: 2318,
        packageId: "monthly",
        packagePrice: 15450,
        commissionAmount: 2318,
        currency: "USD",
        status: "approved",
        payoutId: null,
        payoutStatus: "unpaid",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "conv_03",
        affiliateId: fama.id,
        affiliateCode: fama.code,
        affiliateName: fama.name,
        djName: "DJ Esteban",
        djEmail: "esteban@dj.cr",
        djWaitlistId: null,
        tenantId: null,
        chargeType: "initial_setup",
        amountUsd: 100,
        amountCrc: 51500,
        commissionPercentage: 20,
        commissionAmountUsd: 20,
        commissionAmountCrc: 10300,
        packageId: "initial_setup",
        packagePrice: 51500,
        commissionAmount: 10300,
        currency: "USD",
        status: "approved",
        payoutId: null,
        payoutStatus: "unpaid",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        updatedAt: new Date().toISOString(),
      },
    );
  }

  async findAffiliateByCode(code: string): Promise<Affiliate | null> {
    const upper = code.trim().toUpperCase();
    for (const affiliate of this.affiliates.values()) {
      if (affiliate.code === upper) return affiliate;
    }
    return null;
  }

  async findAffiliateById(id: string): Promise<Affiliate | null> {
    return this.affiliates.get(id) ?? null;
  }

  async listAffiliates(): Promise<AffiliateSummary[]> {
    const list = [...this.affiliates.values()];
    return list.map((aff) => {
      const affConvs = this.conversions.filter((c) => c.affiliateId === aff.id);
      const totalConversions = affConvs.length;

      const totalEarnedUsd = Number(
        affConvs.reduce((acc, c) => acc + (c.commissionAmountUsd ?? 0), 0).toFixed(2),
      );
      const totalEarnedCrc = affConvs.reduce((acc, c) => acc + (c.commissionAmountCrc ?? c.commissionAmount ?? 0), 0);

      const affPayouts = this.payouts.filter((p) => p.affiliateId === aff.id);
      const totalPaidCrc = affPayouts.reduce((acc, p) => acc + p.amount, 0);
      const totalPaidUsd = Number(
        affPayouts.reduce((acc, p) => acc + (p.amountUsd ?? (p.amount / (this.settings.exchangeRateCrc || 515))), 0).toFixed(2),
      );

      const pendingBalanceCrc = Math.max(0, totalEarnedCrc - totalPaidCrc);
      const pendingBalanceUsd = Number(Math.max(0, totalEarnedUsd - totalPaidUsd).toFixed(2));

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
  }

  async createAffiliate(input: CreateAffiliateInput): Promise<Affiliate> {
    const existing = await this.findAffiliateByCode(input.code);
    if (existing) {
      throw conflict(`El código de afiliado "${input.code}" ya está en uso.`);
    }

    const affiliate: Affiliate = {
      id: crypto.randomUUID(),
      code: input.code.toUpperCase(),
      name: input.name,
      email: input.email.toLowerCase(),
      phone: input.phone,
      paymentMethod: input.paymentMethod,
      paymentDetails: input.paymentDetails,
      customPercentageEnabled: Boolean(input.customPercentageEnabled),
      customPercentages: input.customPercentages ?? null,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.affiliates.set(affiliate.id, affiliate);
    return affiliate;
  }

  async updateAffiliate(id: string, input: UpdateAffiliateInput): Promise<Affiliate> {
    const current = this.affiliates.get(id);
    if (!current) throw notFound("No encontramos ese afiliado.");

    const updated: Affiliate = {
      ...current,
      ...input,
      updatedAt: new Date().toISOString(),
    };
    this.affiliates.set(id, updated);
    return updated;
  }

  async getSettings(): Promise<ReferralCommissionSettings> {
    return this.settings;
  }

  async updateSettings(input: UpdateSettingsInput): Promise<ReferralCommissionSettings> {
    this.settings = {
      ...this.settings,
      currency: input.currency ?? this.settings.currency,
      exchangeRateCrc: input.exchangeRateCrc ?? this.settings.exchangeRateCrc,
      initialSetupPriceUsd: input.initialSetupPriceUsd ?? this.settings.initialSetupPriceUsd,
      initialSetupPercent: input.initialSetupPercent ?? this.settings.initialSetupPercent,
      monthlyPriceUsd: input.monthlyPriceUsd ?? this.settings.monthlyPriceUsd,
      monthlyPercent: input.monthlyPercent ?? this.settings.monthlyPercent,
      developerPercent: input.developerPercent ?? this.settings.developerPercent ?? 50,
      founderPercent: input.founderPercent ?? this.settings.founderPercent ?? 50,
      maintenanceMonthlyCostUsd: input.maintenanceMonthlyCostUsd ?? this.settings.maintenanceMonthlyCostUsd ?? 0,
      maintenancePercent: input.maintenancePercent ?? this.settings.maintenancePercent ?? 0,
      percentages: {
        ...this.settings.percentages,
        ...(input.percentages ?? {}),
        initial_setup: input.initialSetupPercent ?? this.settings.initialSetupPercent,
        monthly: input.monthlyPercent ?? this.settings.monthlyPercent,
      },
      packagePrices: {
        ...this.settings.packagePrices,
        ...(input.packagePrices ?? {}),
        initial_setup: input.initialSetupPriceUsd ?? this.settings.initialSetupPriceUsd,
        monthly: input.monthlyPriceUsd ?? this.settings.monthlyPriceUsd,
      },
      updatedAt: new Date().toISOString(),
    };
    return this.settings;
  }

  async recordConversion(input: RecordConversionInput): Promise<ReferralConversion> {
    const affiliate = await this.findAffiliateById(input.affiliateId);
    const chargeType = input.chargeType || (input.packageId === "monthly" ? "monthly" : "initial_setup");
    const calc = calculateCommission({
      chargeType,
      packageId: input.packageId,
      settings: this.settings,
      affiliate,
    });

    const conv: ReferralConversion = {
      id: crypto.randomUUID(),
      affiliateId: input.affiliateId,
      affiliateCode: affiliate?.code ?? "UNKNOWN",
      affiliateName: affiliate?.name ?? "Afiliado",
      djName: input.djName,
      djEmail: input.djEmail,
      djWaitlistId: input.djWaitlistId ?? null,
      tenantId: input.tenantId ?? null,
      chargeType: calc.chargeType,
      amountUsd: input.amountUsd ?? calc.amountUsd,
      amountCrc: input.amountCrc ?? calc.amountCrc,
      commissionPercentage: input.commissionPercentage ?? calc.commissionPercentage,
      commissionAmountUsd: input.commissionAmountUsd ?? calc.commissionAmountUsd,
      commissionAmountCrc: input.commissionAmountCrc ?? calc.commissionAmountCrc,
      packageId: calc.chargeType,
      packagePrice: calc.amountCrc,
      commissionAmount: calc.commissionAmountCrc,
      currency: "USD",
      status: "approved",
      payoutId: null,
      payoutStatus: "unpaid",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.conversions.unshift(conv);
    return conv;
  }

  async listConversions(affiliateId?: string): Promise<ReferralConversion[]> {
    if (affiliateId) {
      return this.conversions.filter((c) => c.affiliateId === affiliateId);
    }
    return [...this.conversions];
  }

  async recordPayout(input: RecordPayoutInput): Promise<ReferralPayout> {
    const affiliate = await this.findAffiliateById(input.affiliateId);
    if (!affiliate) throw notFound("No encontramos ese afiliado.");

    const exchangeRate = this.settings.exchangeRateCrc || DEFAULT_EXCHANGE_RATE_CRC;
    const isCrc = input.currency === "CRC";
    const amountCrc = isCrc ? input.amount : Math.round(input.amount * exchangeRate);
    const amountUsd = isCrc ? Number((input.amount / exchangeRate).toFixed(2)) : input.amount;

    const payout: ReferralPayout = {
      id: crypto.randomUUID(),
      affiliateId: input.affiliateId,
      affiliateCode: affiliate.code,
      affiliateName: affiliate.name,
      amount: amountCrc,
      amountUsd,
      currency: "CRC",
      method: input.method,
      referenceNumber: input.referenceNumber,
      note: input.note ?? null,
      paidAt: new Date().toISOString(),
    };

    this.payouts.unshift(payout);

    // Marcar conversiones como pagadas
    let remaining = amountCrc;
    for (const conv of this.conversions) {
      if (
        conv.affiliateId === input.affiliateId &&
        conv.payoutStatus === "unpaid" &&
        conv.status === "approved"
      ) {
        conv.payoutId = payout.id;
        conv.payoutStatus = "paid";
        conv.updatedAt = new Date().toISOString();
        remaining -= (conv.commissionAmountCrc || conv.commissionAmount);
        if (remaining <= 0) break;
      }
    }

    return payout;
  }

  async listPayouts(affiliateId?: string): Promise<ReferralPayout[]> {
    if (affiliateId) {
      return this.payouts.filter((p) => p.affiliateId === affiliateId);
    }
    return [...this.payouts];
  }
}
