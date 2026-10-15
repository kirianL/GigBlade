import { validationError } from "@/domain/errors";

export type PaymentMethod = "sinpe" | "iban";
export type AffiliateStatus = "active" | "paused" | "archived";
export type ConversionStatus = "pending" | "approved" | "rejected";
export type PayoutStatus = "unpaid" | "paid";
export type ConversionChargeType = "initial_setup" | "monthly" | string;

export type PaymentDetails = {
  sinpePhone?: string;
  iban?: string;
  bankName?: string;
  accountHolder?: string;
};

export type CommissionPercentages = {
  initial_setup?: number;
  monthly?: number;
  basico?: number;
  pro?: number;
  all_inclusive?: number;
  [key: string]: number | undefined;
};

export type PackagePrices = {
  initial_setup?: number;
  monthly?: number;
  basico?: number;
  pro?: number;
  all_inclusive?: number;
  [key: string]: number | undefined;
};

export type Affiliate = {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string | null;
  paymentMethod: PaymentMethod;
  paymentDetails: PaymentDetails;
  customPercentageEnabled: boolean;
  customPercentages: CommissionPercentages | null;
  status: AffiliateStatus;
  createdAt: string;
  updatedAt: string;
};

export type ReferralCommissionSettings = {
  id?: string;
  currency: string; // "USD"
  exchangeRateCrc: number; // Tipo de cambio (ej. 515 colones por dólar)
  initialSetupPriceUsd: number; // Precio de creación / setup en USD (ej. 100)
  initialSetupPercent: number; // % de comisión por el cobro inicial (ej. 20%)
  monthlyPriceUsd: number; // Mensualidad en USD (ej. 30)
  monthlyPercent: number; // % de comisión por la mensualidad (ej. 15%)
  developerPercent?: number; // % para el desarrollador (ej. 50%)
  founderPercent?: number; // % para el socio fundador / dueño del proyecto (ej. 50%)
  maintenanceMonthlyCostUsd?: number; // Gastos de mantenimiento fijo (Plan Hobby = $0)
  maintenancePercent?: number; // % reserva de mantenimiento (ej. 0%)
  model?: "percentage" | "fixed";
  percentages: CommissionPercentages;
  packagePrices: PackagePrices;
  isActive: boolean;
  updatedAt: string;
};

export type ReferralConversion = {
  id: string;
  affiliateId: string;
  affiliateCode: string;
  affiliateName: string;
  djName: string;
  djEmail: string;
  djWaitlistId: string | null;
  tenantId: string | null;
  chargeType: ConversionChargeType; // "initial_setup" | "monthly"
  amountUsd: number;
  amountCrc: number;
  commissionPercentage: number;
  commissionAmountUsd: number;
  commissionAmountCrc: number;
  packageId: string; // compatibilidad
  packagePrice: number; // compatibilidad (en colones)
  commissionAmount: number; // compatibilidad (en colones)
  currency: string;
  status: ConversionStatus;
  payoutId: string | null;
  payoutStatus: PayoutStatus;
  createdAt: string;
  updatedAt: string;
};

export type ReferralPayout = {
  id: string;
  affiliateId: string;
  affiliateCode: string;
  affiliateName: string;
  amount: number; // Monto pagado en colones para SINPE o en USD
  amountUsd?: number;
  currency: string;
  method: PaymentMethod;
  referenceNumber: string;
  note: string | null;
  paidAt: string;
};

export type AffiliateSummary = Affiliate & {
  referralLink: string;
  totalConversions: number;
  totalEarnedUsd: number;
  totalEarnedCrc: number;
  totalPaidUsd: number;
  totalPaidCrc: number;
  pendingBalanceUsd: number;
  pendingBalanceCrc: number;
  totalEarned: number; // compatibilidad
  totalPaid: number; // compatibilidad
  pendingBalance: number; // compatibilidad
};

export const DEFAULT_EXCHANGE_RATE_CRC = 515;
export const DEFAULT_INITIAL_SETUP_USD = 100;
export const DEFAULT_INITIAL_SETUP_PERCENT = 20;
export const DEFAULT_MONTHLY_USD = 30;
export const DEFAULT_MONTHLY_PERCENT = 15;

export const DEFAULT_REFERRAL_SETTINGS: ReferralCommissionSettings = {
  currency: "USD",
  exchangeRateCrc: DEFAULT_EXCHANGE_RATE_CRC,
  initialSetupPriceUsd: DEFAULT_INITIAL_SETUP_USD,
  initialSetupPercent: DEFAULT_INITIAL_SETUP_PERCENT,
  monthlyPriceUsd: DEFAULT_MONTHLY_USD,
  monthlyPercent: DEFAULT_MONTHLY_PERCENT,
  model: "percentage",
  percentages: {
    initial_setup: DEFAULT_INITIAL_SETUP_PERCENT,
    monthly: DEFAULT_MONTHLY_PERCENT,
    basico: 20,
    pro: 25,
    all_inclusive: 30,
  },
  packagePrices: {
    initial_setup: DEFAULT_INITIAL_SETUP_USD,
    monthly: DEFAULT_MONTHLY_USD,
    basico: 25000,
    pro: 50000,
    all_inclusive: 75000,
  },
  isActive: true,
  updatedAt: new Date().toISOString(),
};

export const DEFAULT_COMMISSION_PERCENTAGES: CommissionPercentages = {
  initial_setup: 20,
  monthly: 15,
  basico: 20,
  pro: 25,
  all_inclusive: 30,
};

export const DEFAULT_PACKAGE_PRICES: PackagePrices = {
  initial_setup: 100,
  monthly: 30,
  basico: 25000,
  pro: 50000,
  all_inclusive: 75000,
};

const CODE_PATTERN = /^[A-Z0-9_-]{2,30}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeAffiliateCode(value: unknown): string {
  const code = (typeof value === "string" ? value.trim() : "").toUpperCase();
  if (!code) {
    throw validationError("Escribí el código del afiliado.");
  }
  if (!CODE_PATTERN.test(code)) {
    throw validationError("El código de afiliado solo admite letras mayúsculas, números y guiones.");
  }
  return code;
}

export function optionalAffiliateCode(value: unknown): string | null {
  if (!value || typeof value !== "string") return null;
  const clean = value.trim().toUpperCase();
  if (!clean) return null;
  if (!CODE_PATTERN.test(clean)) return null;
  return clean;
}

export function defaultReferralOrigin(): string {
  if (typeof process !== "undefined" && process.env) {
    const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    if (explicit) return explicit.replace(/\/+$/, "");

    if (process.env.NODE_ENV === "development") {
      return "http://localhost:3000";
    }

    const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.replace(
      /^https?:\/\//,
      "",
    );
    if (process.env.VERCEL_ENV === "production" && production) {
      return `https://${production.replace(/\/+$/, "")}`;
    }

    const preview = process.env.VERCEL_URL?.replace(/^https?:\/\//, "");
    if (preview) return `https://${preview.replace(/\/+$/, "")}`;
  }

  return "https://gigblades.vercel.app";
}

export function buildReferralLink(code: string, origin?: string): string {
  const base = origin || defaultReferralOrigin();
  return `${base.replace(/\/+$/, "")}/acceso?ref=${encodeURIComponent(code)}`;
}

export function assertAffiliateDraft(input: {
  code?: unknown;
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  paymentMethod?: unknown;
  sinpePhone?: unknown;
  iban?: unknown;
  bankName?: unknown;
  customPercentageEnabled?: unknown;
  customPercentages?: unknown;
}) {
  const code = normalizeAffiliateCode(input.code);
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (name.length < 2 || name.length > 120) {
    throw validationError("El nombre debe tener entre 2 y 120 caracteres.");
  }
  const email = (typeof input.email === "string" ? input.email.trim() : "").toLowerCase();
  if (!EMAIL_PATTERN.test(email)) {
    throw validationError("Escribí un correo válido.");
  }
  const phone = typeof input.phone === "string" ? input.phone.trim() : null;
  const paymentMethod: PaymentMethod =
    input.paymentMethod === "iban" ? "iban" : "sinpe";

  const sinpePhone =
    typeof input.sinpePhone === "string" ? input.sinpePhone.trim() : undefined;
  const iban = typeof input.iban === "string" ? input.iban.trim() : undefined;
  const bankName =
    typeof input.bankName === "string" ? input.bankName.trim() : undefined;

  return {
    code,
    name,
    email,
    phone,
    paymentMethod,
    paymentDetails: {
      sinpePhone,
      iban,
      bankName,
    },
    customPercentageEnabled: Boolean(input.customPercentageEnabled),
    customPercentages: (input.customPercentages as CommissionPercentages) || null,
  };
}

export function calculateCommission({
  chargeType = "initial_setup",
  packageId,
  settings,
  affiliate,
}: {
  chargeType?: ConversionChargeType;
  packageId?: string;
  settings: ReferralCommissionSettings;
  affiliate?: Affiliate | null;
}): {
  chargeType: ConversionChargeType;
  amountUsd: number;
  amountCrc: number;
  commissionPercentage: number;
  commissionAmountUsd: number;
  commissionAmountCrc: number;
  packagePrice: number;
  commissionAmount: number;
  currency: string;
} {
  const exchangeRate = settings.exchangeRateCrc || DEFAULT_EXCHANGE_RATE_CRC;

  const typeKey = (chargeType || packageId || "initial_setup").toLowerCase().replace(/-/g, "_");
  const isMonthly = typeKey === "monthly" || typeKey === "mensualidad";

  let amountUsd = isMonthly
    ? (settings.monthlyPriceUsd ?? DEFAULT_MONTHLY_USD)
    : (settings.initialSetupPriceUsd ?? DEFAULT_INITIAL_SETUP_USD);

  if (settings.packagePrices && typeof settings.packagePrices[typeKey] === "number") {
    const customPrice = settings.packagePrices[typeKey]!;
    if (customPrice > 1000) {
      amountUsd = Math.round(customPrice / exchangeRate);
    } else {
      amountUsd = customPrice;
    }
  }

  let commissionPercentage = isMonthly
    ? (settings.monthlyPercent ?? DEFAULT_MONTHLY_PERCENT)
    : (settings.initialSetupPercent ?? DEFAULT_INITIAL_SETUP_PERCENT);

  if (settings.percentages && typeof settings.percentages[typeKey] === "number") {
    commissionPercentage = settings.percentages[typeKey]!;
  }

  if (affiliate?.customPercentageEnabled && affiliate.customPercentages) {
    const custom = affiliate.customPercentages[typeKey];
    if (typeof custom === "number" && custom >= 0 && custom <= 100) {
      commissionPercentage = custom;
    }
  }

  const commissionAmountUsd = Number(((amountUsd * commissionPercentage) / 100).toFixed(2));
  const amountCrc = Math.round(amountUsd * exchangeRate);
  const commissionAmountCrc = Math.round(commissionAmountUsd * exchangeRate);

  return {
    chargeType: isMonthly ? "monthly" : "initial_setup",
    amountUsd,
    amountCrc,
    commissionPercentage,
    commissionAmountUsd,
    commissionAmountCrc,
    packagePrice: amountCrc,
    commissionAmount: commissionAmountCrc,
    currency: "USD",
  };
}

export const DEFAULT_DEVELOPER_PERCENT = 50;
export const DEFAULT_FOUNDER_PERCENT = 50;
export const DEFAULT_MAINTENANCE_MONTHLY_USD = 0; // Plan Hobby ($0 / mes)
export const DEFAULT_MAINTENANCE_PERCENT = 0;

export type RevenueSplit = {
  chargeType: ConversionChargeType;
  grossAmountUsd: number;
  grossAmountCrc: number;
  referralPercent: number;
  referralAmountUsd: number;
  referralAmountCrc: number;
  maintenanceCostUsd: number;
  maintenanceCostCrc: number;
  netDistributableUsd: number;
  netDistributableCrc: number;
  developerPercent: number;
  developerAmountUsd: number;
  developerAmountCrc: number;
  founderPercent: number;
  founderAmountUsd: number;
  founderAmountCrc: number;
};

export function calculateRevenueSplit({
  chargeType = "initial_setup",
  hasReferral = true,
  settings,
  affiliate,
}: {
  chargeType?: ConversionChargeType;
  hasReferral?: boolean;
  settings: ReferralCommissionSettings;
  affiliate?: Affiliate | null;
}): RevenueSplit {
  const exchangeRate = settings.exchangeRateCrc || DEFAULT_EXCHANGE_RATE_CRC;
  const isMonthly = chargeType === "monthly" || chargeType === "mensualidad";

  const grossAmountUsd = isMonthly
    ? (settings.monthlyPriceUsd ?? DEFAULT_MONTHLY_USD)
    : (settings.initialSetupPriceUsd ?? DEFAULT_INITIAL_SETUP_USD);
  const grossAmountCrc = Math.round(grossAmountUsd * exchangeRate);

  let referralPercent = 0;
  let referralAmountUsd = 0;
  if (hasReferral) {
    const calc = calculateCommission({ chargeType, settings, affiliate });
    referralPercent = calc.commissionPercentage;
    referralAmountUsd = calc.commissionAmountUsd;
  }
  const referralAmountCrc = Math.round(referralAmountUsd * exchangeRate);

  // Mantenimiento (Plan Hobby = $0 de momento)
  const maintenanceCostUsd = isMonthly
    ? (settings.maintenanceMonthlyCostUsd ?? DEFAULT_MAINTENANCE_MONTHLY_USD)
    : Number((((settings.maintenancePercent ?? 0) * grossAmountUsd) / 100).toFixed(2));
  const maintenanceCostCrc = Math.round(maintenanceCostUsd * exchangeRate);

  // Margen neto para repartir entre Desarrollador y Socio Fundador
  const netDistributableUsd = Math.max(
    0,
    Number((grossAmountUsd - referralAmountUsd - maintenanceCostUsd).toFixed(2)),
  );
  const netDistributableCrc = Math.max(
    0,
    grossAmountCrc - referralAmountCrc - maintenanceCostCrc,
  );

  const developerPercent = settings.developerPercent ?? DEFAULT_DEVELOPER_PERCENT;
  const founderPercent = settings.founderPercent ?? DEFAULT_FOUNDER_PERCENT;

  const totalTeamPercent = developerPercent + founderPercent || 100;
  const devShareUsd = Number(
    ((netDistributableUsd * developerPercent) / totalTeamPercent).toFixed(2),
  );
  const devShareCrc = Math.round((netDistributableCrc * developerPercent) / totalTeamPercent);

  const founderShareUsd = Number((netDistributableUsd - devShareUsd).toFixed(2));
  const founderShareCrc = netDistributableCrc - devShareCrc;

  return {
    chargeType: isMonthly ? "monthly" : "initial_setup",
    grossAmountUsd,
    grossAmountCrc,
    referralPercent,
    referralAmountUsd,
    referralAmountCrc,
    maintenanceCostUsd,
    maintenanceCostCrc,
    netDistributableUsd,
    netDistributableCrc,
    developerPercent,
    developerAmountUsd: devShareUsd,
    developerAmountCrc: devShareCrc,
    founderPercent,
    founderAmountUsd: founderShareUsd,
    founderAmountCrc: founderShareCrc,
  };
}
