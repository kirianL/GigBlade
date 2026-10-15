import type {
  Affiliate,
  AffiliateSummary,
  CommissionPercentages,
  ConversionChargeType,
  PackagePrices,
  PaymentDetails,
  PaymentMethod,
  ReferralCommissionSettings,
  ReferralConversion,
  ReferralPayout,
} from "@/domain/referral";

export type CreateAffiliateInput = {
  code: string;
  name: string;
  email: string;
  phone: string | null;
  paymentMethod: PaymentMethod;
  paymentDetails: PaymentDetails;
  customPercentageEnabled?: boolean;
  customPercentages?: CommissionPercentages | null;
};

export type UpdateAffiliateInput = Partial<{
  name: string;
  email: string;
  phone: string | null;
  paymentMethod: PaymentMethod;
  paymentDetails: PaymentDetails;
  status: "active" | "paused" | "archived";
  customPercentageEnabled: boolean;
  customPercentages: CommissionPercentages | null;
}>;

export type RecordConversionInput = {
  affiliateId: string;
  djName: string;
  djEmail: string;
  djWaitlistId?: string | null;
  tenantId?: string | null;
  chargeType?: ConversionChargeType;
  amountUsd?: number;
  amountCrc?: number;
  commissionPercentage?: number;
  commissionAmountUsd?: number;
  commissionAmountCrc?: number;
  packageId?: string; // compatibilidad
  packagePrice?: number;
  commissionAmount?: number;
  currency?: string;
};

export type RecordPayoutInput = {
  affiliateId: string;
  amount: number;
  amountUsd?: number;
  currency: string;
  method: PaymentMethod;
  referenceNumber: string;
  note?: string | null;
  conversionIds?: string[];
  createdBy?: string;
};

export type UpdateSettingsInput = {
  currency?: string;
  exchangeRateCrc?: number;
  initialSetupPriceUsd?: number;
  initialSetupPercent?: number;
  monthlyPriceUsd?: number;
  monthlyPercent?: number;
  developerPercent?: number;
  founderPercent?: number;
  maintenanceMonthlyCostUsd?: number;
  maintenancePercent?: number;
  model?: "percentage" | "fixed";
  percentages?: CommissionPercentages;
  packagePrices?: PackagePrices;
  updatedBy?: string;
};

export interface ReferralRepository {
  findAffiliateByCode(code: string): Promise<Affiliate | null>;
  findAffiliateById(id: string): Promise<Affiliate | null>;
  listAffiliates(): Promise<AffiliateSummary[]>;
  createAffiliate(input: CreateAffiliateInput): Promise<Affiliate>;
  updateAffiliate(id: string, input: UpdateAffiliateInput): Promise<Affiliate>;

  getSettings(): Promise<ReferralCommissionSettings>;
  updateSettings(input: UpdateSettingsInput): Promise<ReferralCommissionSettings>;

  recordConversion(input: RecordConversionInput): Promise<ReferralConversion>;
  listConversions(affiliateId?: string): Promise<ReferralConversion[]>;

  recordPayout(input: RecordPayoutInput): Promise<ReferralPayout>;
  listPayouts(affiliateId?: string): Promise<ReferralPayout[]>;
}
