export type TilopayCurrency = "USD" | "CRC";

export type WaitlistPaymentStatus = "pending" | "paid" | "failed" | "expired";

export type WaitlistPaymentOrder = {
  id: string;
  orderNumber: string;
  artistName: string;
  email: string;
  country: "CR" | "US";
  city: string | null;
  instagram: string | null;
  phone: string | null;
  note: string | null;
  meetingAt: string;
  referralCode: string | null;
  packageId: string;
  amount: number;
  currency: TilopayCurrency;
  status: WaitlistPaymentStatus;
  tilopayTransactionId: string | null;
  tilopayAuthCode: string | null;
  tilopayResponseCode: string | null;
  tilopayDescription: string | null;
  waitlistId: string | null;
  expiresAt: string;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TilopayConsultTransaction = {
  id_tilopay?: string | number | null;
  orderNumber?: string | null;
  amount?: string | number | null;
  currency?: string | null;
  code?: string | number | null;
  response?: string | null;
  auth?: string | null;
  environment?: string | null;
  type?: string | null;
  date?: string | null;
};

export type TilopayBillingDefaults = {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: "CR" | "US";
  telephone: string;
};

const CR_PROVINCE_BILLING: Record<
  string,
  { city: string; state: string; zip: string }
> = {
  "san jose": { city: "San José", state: "CR-SJ", zip: "10101" },
  alajuela: { city: "Alajuela", state: "CR-A", zip: "20101" },
  cartago: { city: "Cartago", state: "CR-C", zip: "30101" },
  heredia: { city: "Heredia", state: "CR-H", zip: "40101" },
  guanacaste: { city: "Liberia", state: "CR-G", zip: "50101" },
  puntarenas: { city: "Puntarenas", state: "CR-P", zip: "60101" },
  limon: { city: "Limón", state: "CR-L", zip: "70101" },
};

function randomHex4(): string {
  const bytes = new Uint8Array(2);
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    bytes[0] = Math.floor(Math.random() * 256);
    bytes[1] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

export function generateTilopayOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  return `GB-${ts}-${randomHex4()}`;
}

export function formatTilopayAmount(
  amount: number,
  currency: TilopayCurrency,
): string {
  const safeAmount = Number.isFinite(amount) && amount > 0 ? amount : 0;
  const hasDecimals = Math.abs(safeAmount - Math.round(safeAmount)) >= 0.005;

  if (currency === "CRC") {
    const rounded = hasDecimals
      ? safeAmount.toFixed(2)
      : String(Math.round(safeAmount));
    const [whole, dec] = rounded.split(".");
    const withCommas = (whole ?? "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return dec ? `₡${withCommas}.${dec}` : `₡${withCommas}`;
  }

  return hasDecimals ? `US$ ${safeAmount.toFixed(2)}` : `US$ ${Math.round(safeAmount)}`;
}

export function costaRicaProvinceBilling(city: string | null): {
  city: string;
  state: string;
  zip: string;
} {
  const normalized = (city ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

  return (
    CR_PROVINCE_BILLING[normalized] ?? {
      city: "San José",
      state: "CR-SJ",
      zip: "10101",
    }
  );
}

export function splitCardholderName(
  fullName: string,
  fallbackArtistName: string,
): { firstName: string; lastName: string } {
  const primary = fullName.trim().replace(/\s+/g, " ");
  const fallback = fallbackArtistName.trim().replace(/\s+/g, " ");
  const source = primary || fallback || "DJ";
  const parts = source.split(" ").filter(Boolean);
  const firstName = (parts[0] || "DJ").slice(0, 60);
  const rest = parts.slice(1).join(" ").slice(0, 60);
  return {
    firstName,
    lastName: rest || "DJ",
  };
}

export function cleanPhoneForBilling(phone: string | null): string {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length >= 7) {
    return digits.slice(0, 15);
  }
  return "88888888";
}

export function isApprovedTilopayTransaction(
  tx: TilopayConsultTransaction | null | undefined,
  expectedOrderNumber: string,
  expectedAmount: number,
  expectedCurrency: TilopayCurrency,
): boolean {
  if (!tx) return false;
  if (String(tx.code ?? "").trim() !== "1") return false;
  if (String(tx.orderNumber ?? "").trim() !== expectedOrderNumber.trim()) {
    return false;
  }

  const txAmount = Number(tx.amount);
  if (!Number.isFinite(txAmount) || Math.abs(txAmount - expectedAmount) >= 0.01) {
    return false;
  }

  const txCurrency = String(tx.currency ?? "").trim().toUpperCase();
  if (txCurrency !== expectedCurrency) {
    return false;
  }

  return true;
}
