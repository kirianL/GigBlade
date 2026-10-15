import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  PageContainer,
  PageHeader,
} from "@autumn/ui";
import {
  ArrowsClockwiseIcon,
  ArrowsLeftRightIcon,
  ArrowSquareOutIcon,
  BankIcon,
  CalendarCheckIcon,
  CheckCircleIcon,
  ClockIcon,
  CopyIcon,
  CurrencyDollarIcon,
  DesktopIcon,
  GearIcon,
  PercentIcon,
  PlusIcon,
  ShareNetworkIcon,
  SparkleIcon,
  TrendUpIcon,
  UsersIcon,
} from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { useLanguage } from "@/contexts/LanguageProvider";
import { gigbladeMarketingSiteUrl } from "@/gigblade/concept";
import {
  createPlatformAffiliate,
  fetchPlatformReferrals,
  recordPlatformReferralPayout,
  updatePlatformReferralSettings,
  type PlatformAffiliate,
  type PlatformReferralConversion,
  type PlatformReferralsData,
  type PlatformReferralSettings,
} from "@/gigblade/site-api";

export const PLATFORM_REFERRALS_QUERY_KEY = ["platform", "referrals"] as const;

function formatUsd(amount: number) {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatCrc(amount: number) {
  return `₡${Math.round(amount).toLocaleString("es-CR")}`;
}

function formatDate(isoString: string, lang = "es") {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return new Intl.DateTimeFormat(lang === "en" ? "en-US" : "es-CR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function generateAffiliateCode(name?: string): string {
  if (name && name.trim()) {
    const clean = name
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
    if (clean.length >= 3) {
      const prefix = clean.slice(0, 5);
      const randomSuffix = Math.floor(10 + Math.random() * 90);
      return `${prefix}${randomSuffix}`;
    }
  }
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let random = "";
  for (let i = 0; i < 4; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `GB-${random}`;
}

function chargeTypeBadge(
  chargeType?: string,
  packageId?: string,
  t?: (key: string, fallback?: string) => string,
) {
  const type = (chargeType || packageId || "").toLowerCase();
  if (type === "monthly" || type === "mensualidad") {
    return {
      label: t
        ? t("referrals.badge.monthly", "Mensualidad ($30)")
        : "Mensualidad ($30)",
      icon: CalendarCheckIcon,
      className:
        "bg-sky-500/10 text-sky-600 dark:text-sky-300 border-sky-500/25",
    };
  }
  return {
    label: t
      ? t("referrals.badge.setup", "Cobro Inicial (Página)")
      : "Cobro Inicial (Página)",
    icon: DesktopIcon,
    className:
      "bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/25",
  };
}

export default function PlatformReferrals() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const isPlatform =
    (session?.user as { role?: string } | undefined)?.role === "platform";

  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<"tablero" | "afiliados" | "pagos">(
    "tablero",
  );
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [payoutTarget, setPayoutTarget] = useState<{
    affiliate: PlatformAffiliate;
    amountCrc: number;
    amountUsd: number;
    conversionId?: string;
  } | null>(null);

  const query = useQuery({
    queryKey: PLATFORM_REFERRALS_QUERY_KEY,
    queryFn: ({ signal }) => fetchPlatformReferrals(signal),
    enabled: Boolean(isPlatform),
    staleTime: 15_000,
  });

  const { affiliates, conversions, settings, payouts } = query.data ?? {
    affiliates: [],
    conversions: [],
    settings: {
      currency: "USD",
      exchangeRateCrc: 515,
      initialSetupPriceUsd: 100,
      initialSetupPercent: 20,
      monthlyPriceUsd: 30,
      monthlyPercent: 15,
      percentages: { initial_setup: 20, monthly: 15 },
      packagePrices: { initial_setup: 100, monthly: 30 },
      isActive: true,
      updatedAt: new Date().toISOString(),
    },
    payouts: [],
  };

  const exchangeRate = settings.exchangeRateCrc || 515;

  // Métricas globales en USD y Colones
  const metrics = useMemo(() => {
    let totalEarnedUsd = 0;
    let totalEarnedCrc = 0;

    for (const conv of conversions) {
      const usd =
        conv.commissionAmountUsd ?? conv.commissionAmount / exchangeRate;
      const crc = conv.commissionAmountCrc ?? conv.commissionAmount;
      totalEarnedUsd += usd;
      totalEarnedCrc += crc;
    }

    let totalPaidCrc = 0;
    for (const p of payouts) {
      totalPaidCrc += p.amount;
    }
    const totalPaidUsd = totalPaidCrc / exchangeRate;

    const pendingBalanceCrc = Math.max(0, totalEarnedCrc - totalPaidCrc);
    const pendingBalanceUsd = Math.max(0, totalEarnedUsd - totalPaidUsd);

    return {
      totalEarnedUsd,
      totalEarnedCrc,
      totalPaidUsd,
      totalPaidCrc,
      pendingBalanceUsd,
      pendingBalanceCrc,
      totalConversions: conversions.length,
    };
  }, [conversions, payouts, exchangeRate]);

  return (
    <PageContainer>
      <PageHeader
        icon={
          <ShareNetworkIcon
            size={18}
            weight="fill"
            className="text-primary"
            aria-hidden
          />
        }
        title={t("referrals.title", "Sistema de Referidos y Comisiones")}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/distribucion"
            className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted/80 transition-all duration-150 shadow-xs cursor-pointer active:scale-95"
          >
            <CurrencyDollarIcon size={16} className="text-primary" />
            <span>{t("referrals.financeButton", "Finanzas & Reparto")}</span>
          </Link>
          <button
            type="button"
            onClick={() => setSettingsModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted/80 transition-all duration-150 shadow-xs cursor-pointer active:scale-95"
          >
            <GearIcon size={16} />
            <span>
              {t("referrals.modifyRates", "Modificar Porcentajes y Tarifas")}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all duration-150 shadow-xs cursor-pointer active:scale-95"
          >
            <PlusIcon size={16} weight="bold" />
            <span>{t("referrals.newAffiliate", "Nuevo Afiliado")}</span>
          </button>
        </div>
      </PageHeader>
      <p className="text-sm text-tertiary-foreground leading-6 -mt-2 max-w-3xl">
        {t(
          "referrals.subtitle",
          "Gestión de promotores que recomiendan GigBlade a otros DJs. Ganancias por cobro inicial de página y mensualidad de $30. Todo en dólares con liquidación en colones (SINPE).",
        )}
      </p>

      {/* Tarjetas de Métricas Principales */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">
              {t("referrals.totalCommissions", "Total Comisiones")}
            </span>
            <CurrencyDollarIcon size={20} className="text-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight">
            {formatUsd(metrics.totalEarnedUsd)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            ≈ {formatCrc(metrics.totalEarnedCrc)} ({metrics.totalConversions}{" "}
            {t("referrals.commissionsGenerated", "comisiones generadas")})
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-xs border-amber-500/20 bg-amber-500/[0.02]">
          <div className="flex items-center justify-between text-amber-500">
            <span className="text-xs font-medium uppercase tracking-wider">
              {t("referrals.pendingPayout", "Por Liquidar (SINPE)")}
            </span>
            <ClockIcon size={20} />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-amber-500">
            {formatCrc(metrics.pendingBalanceCrc)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {formatUsd(metrics.pendingBalanceUsd)}{" "}
            {t("referrals.pendingToTransfer", "pendiente de transferir")}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">
              {t("referrals.totalPaid", "Total Pagado")}
            </span>
            <CheckCircleIcon size={20} className="text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-emerald-500">
            {formatCrc(metrics.totalPaidCrc)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {payouts.length}{" "}
            {t("referrals.vouchers", "comprobantes de SINPE / Transferencia")}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">
              {t("referrals.activePromoters", "Promotores Activos")}
            </span>
            <UsersIcon size={20} className="text-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight">
            {affiliates.length}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {t(
              "referrals.withActiveLinks",
              "Con enlaces activos y comisiones habilitadas",
            )}
          </div>
        </div>
      </div>

      {/* Resumen de Tarifas y Porcentajes Configurados (Sin Paquetes) */}
      <div className="mt-4 rounded-xl border bg-gradient-to-r from-card via-card to-card/60 p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <PercentIcon size={18} className="text-primary" />
              <span className="font-semibold text-sm">
                {t("referrals.currentScheme", "Esquema de Comisiones Actual")}
              </span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                {t("referrals.modifiable", "100% Modificable")}
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {t("referrals.exchangeRateLabel", "T.C.")} ₡{exchangeRate} / $1
                USD
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t(
                "referrals.schemeExplanation",
                "Cuando una persona que no es DJ recomienda el servicio y un DJ se suma a GigBlade, el promotor gana:",
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSettingsModalOpen(true)}
            className="inline-flex items-center gap-1 rounded-md border bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted transition-colors cursor-pointer self-start sm:self-auto"
          >
            <GearIcon size={13} />
            <span>{t("referrals.editRates", "Editar tarifas")}</span>
          </button>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* 1. Cobro Inicial de la Página */}
          <div className="flex items-center justify-between rounded-lg border bg-background/50 p-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <DesktopIcon size={16} className="text-purple-400" />
                <span className="text-xs font-bold">
                  {t(
                    "referrals.setupCommissionCard",
                    "1. Cobro Inicial (Creación de Página)",
                  )}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {t("referrals.chargedFee", "Tarifa cobrada:")}{" "}
                <strong className="text-foreground">
                  {formatUsd(settings.initialSetupPriceUsd ?? 100)}
                </strong>{" "}
                (
                {formatCrc(
                  (settings.initialSetupPriceUsd ?? 100) * exchangeRate,
                )}
                )
              </div>
            </div>
            <div className="text-right">
              <span className="text-base font-extrabold text-primary">
                {settings.initialSetupPercent ?? 20}%{" "}
                {t("referrals.commission", "comisión")}
              </span>
              <div className="text-xs font-semibold text-emerald-500 dark:text-emerald-400">
                {t("referrals.earns", "Gana")}{" "}
                {formatUsd(
                  ((settings.initialSetupPriceUsd ?? 100) *
                    (settings.initialSetupPercent ?? 20)) /
                    100,
                )}{" "}
                (
                {formatCrc(
                  (((settings.initialSetupPriceUsd ?? 100) *
                    (settings.initialSetupPercent ?? 20)) /
                    100) *
                    exchangeRate,
                )}
                )
              </div>
            </div>
          </div>

          {/* 2. Mensualidad Recurrente */}
          <div className="flex items-center justify-between rounded-lg border bg-background/50 p-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <CalendarCheckIcon size={16} className="text-sky-400" />
                <span className="text-xs font-bold">
                  {t(
                    "referrals.monthlyCommissionCard",
                    "2. Mensualidad Recurrente del Servicio",
                  )}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {t("referrals.setMonthlyFee", "Mensualidad fijada:")}{" "}
                <strong className="text-foreground">
                  {formatUsd(settings.monthlyPriceUsd ?? 30)}
                  {t("referrals.perMonth", "/mes")}
                </strong>{" "}
                ({formatCrc((settings.monthlyPriceUsd ?? 30) * exchangeRate)}
                {t("referrals.perMonth", "/mes")})
              </div>
            </div>
            <div className="text-right">
              <span className="text-base font-extrabold text-primary">
                {settings.monthlyPercent ?? 15}%{" "}
                {t("referrals.recurring", "recurrente")}
              </span>
              <div className="text-xs font-semibold text-emerald-500 dark:text-emerald-400">
                {t("referrals.earns", "Gana")}{" "}
                {formatUsd(
                  ((settings.monthlyPriceUsd ?? 30) *
                    (settings.monthlyPercent ?? 15)) /
                    100,
                )}
                {t("referrals.perMonth", "/mes")} (
                {formatCrc(
                  (((settings.monthlyPriceUsd ?? 30) *
                    (settings.monthlyPercent ?? 15)) /
                    100) *
                    exchangeRate,
                )}
                {t("referrals.perMonth", "/mes")})
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pestañas con feedback interactivo claro */}
      <div className="mt-6 flex border-b">
        <button
          type="button"
          onClick={() => setActiveTab("tablero")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "tablero"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          }`}
        >
          <TrendUpIcon size={18} />
          <span>
            {t("referrals.tabs.conversions", "Tablero de Comisiones")}
          </span>
          <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary font-bold">
            {conversions.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("afiliados")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "afiliados"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          }`}
        >
          <UsersIcon size={18} />
          <span>{t("referrals.tabs.affiliates", "Promotores & Enlaces")}</span>
          <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs">
            {affiliates.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("pagos")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "pagos"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          }`}
        >
          <BankIcon size={18} />
          <span>{t("referrals.tabs.payouts", "Historial de Pagos SINPE")}</span>
          <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs">
            {payouts.length}
          </span>
        </button>
      </div>

      {/* Contenido de la pestaña */}
      <div className="mt-4">
        {activeTab === "tablero" && (
          <TableroComisiones
            conversions={conversions}
            affiliates={affiliates}
            exchangeRate={exchangeRate}
            onPay={(conv) => {
              const aff = affiliates.find((a) => a.id === conv.affiliateId);
              if (aff) {
                const crc = conv.commissionAmountCrc ?? conv.commissionAmount;
                const usd = conv.commissionAmountUsd ?? crc / exchangeRate;
                setPayoutTarget({
                  affiliate: aff,
                  amountCrc: crc,
                  amountUsd: usd,
                  conversionId: conv.id,
                });
              }
            }}
          />
        )}

        {activeTab === "afiliados" && (
          <ListaAfiliados
            affiliates={affiliates}
            exchangeRate={exchangeRate}
            onPay={(aff) => {
              const crc = aff.pendingBalanceCrc ?? aff.pendingBalance;
              const usd = aff.pendingBalanceUsd ?? crc / exchangeRate;
              setPayoutTarget({
                affiliate: aff,
                amountCrc: crc,
                amountUsd: usd,
              });
            }}
            onCreateNew={() => setCreateModalOpen(true)}
          />
        )}

        {activeTab === "pagos" && (
          <HistorialPagos payouts={payouts} exchangeRate={exchangeRate} />
        )}
      </div>

      {/* Modal: Ajustar Porcentajes y Tarifas */}
      {settingsModalOpen && (
        <ModalAjustarPorcentajes
          currentSettings={settings}
          onClose={() => setSettingsModalOpen(false)}
          onSaved={() => {
            void queryClient.invalidateQueries({
              queryKey: PLATFORM_REFERRALS_QUERY_KEY,
            });
            setSettingsModalOpen(false);
          }}
        />
      )}

      {/* Modal: Nuevo Afiliado con Código Automático */}
      {createModalOpen && (
        <ModalNuevoAfiliado
          onClose={() => setCreateModalOpen(false)}
          onCreated={() => {
            void queryClient.invalidateQueries({
              queryKey: PLATFORM_REFERRALS_QUERY_KEY,
            });
            setCreateModalOpen(false);
          }}
        />
      )}

      {/* Modal: Liquidación de Pago por SINPE Móvil */}
      {payoutTarget && (
        <ModalLiquidacionPago
          target={payoutTarget}
          exchangeRate={exchangeRate}
          onClose={() => setPayoutTarget(null)}
          onPaid={() => {
            void queryClient.invalidateQueries({
              queryKey: PLATFORM_REFERRALS_QUERY_KEY,
            });
            setPayoutTarget(null);
          }}
        />
      )}
    </PageContainer>
  );
}

// ----------------------------------------------------
// TABLERO DE COMISIONES (Botón táctil y Badges limpios)
// ----------------------------------------------------
function TableroComisiones({
  conversions,
  affiliates,
  exchangeRate,
  onPay,
}: {
  conversions: PlatformReferralConversion[];
  affiliates: PlatformAffiliate[];
  exchangeRate: number;
  onPay: (conv: PlatformReferralConversion) => void;
}) {
  const { t, language } = useLanguage();

  if (conversions.length === 0) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center">
        <TrendUpIcon size={32} className="text-muted-foreground/60" />
        <h3 className="mt-2 text-sm font-semibold">
          {t(
            "referrals.emptyConversionsTitle",
            "Sin registros de comisiones aún",
          )}
        </h3>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
          {t(
            "referrals.emptyConversionsDesc",
            "Cuando un DJ se registre con el enlace o código de un promotor y se procese el cobro inicial o su mensualidad, aparecerá aquí.",
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border bg-card shadow-xs overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <th className="px-2.5 py-2">{t("referrals.th.date", "Fecha")}</th>
            <th className="px-2.5 py-2">
              {t("referrals.th.referredDj", "DJ Referido")}
            </th>
            <th className="px-2.5 py-2">
              {t("referrals.th.concept", "Concepto")}
            </th>
            <th className="px-2 py-2">
              {t("referrals.th.chargedAmount", "Cobrado")}
            </th>
            <th className="px-2.5 py-2">
              {t("referrals.th.promoter", "Promotor")}
            </th>
            <th className="px-1.5 py-2 text-center">
              {t("referrals.th.percent", "%")}
            </th>
            <th className="px-2.5 py-2">
              {t("referrals.th.earned", "Comisión")}
            </th>
            <th className="px-2 py-2">
              {t("referrals.th.status", "Estado")}
            </th>
            <th className="px-2.5 py-2 text-right">
              {t("referrals.th.action", "Acción")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {conversions.map((conv) => {
            const isPaid = conv.payoutStatus === "paid";
            const badge = chargeTypeBadge(conv.chargeType, conv.packageId, t);
            const BadgeIcon = badge.icon;

            const usdAmount =
              conv.amountUsd ?? (conv.chargeType === "monthly" ? 30 : 100);
            const crcAmount =
              conv.amountCrc ?? Math.round(usdAmount * exchangeRate);

            const commissionUsd =
              conv.commissionAmountUsd ??
              (usdAmount * conv.commissionPercentage) / 100;
            const commissionCrc =
              conv.commissionAmountCrc ??
              Math.round(commissionUsd * exchangeRate);

            return (
              <tr key={conv.id} className="transition-colors hover:bg-muted/30">
                <td className="whitespace-nowrap px-2.5 py-2 text-xs text-muted-foreground font-mono">
                  {formatDate(conv.createdAt, language)}
                </td>
                <td className="px-2.5 py-2">
                  <div className="font-semibold text-foreground text-xs truncate max-w-[130px]">
                    {conv.djName}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate max-w-[130px]">
                    {conv.djEmail}
                  </div>
                </td>
                <td className="px-2.5 py-2 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-bold ${badge.className}`}
                  >
                    <BadgeIcon size={13} weight="duotone" />
                    <span>{badge.label}</span>
                  </span>
                </td>
                <td className="whitespace-nowrap px-2 py-2 text-xs">
                  <div className="font-semibold text-foreground">
                    {formatUsd(usdAmount)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    ({formatCrc(crcAmount)})
                  </div>
                </td>
                <td className="px-2.5 py-2 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded-md border border-primary/20">
                      {conv.affiliateCode}
                    </span>
                    <span className="text-xs text-muted-foreground truncate max-w-[110px]">
                      {conv.affiliateName}
                    </span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-1.5 py-2 text-center text-xs font-bold text-foreground">
                  {conv.commissionPercentage}%
                </td>
                <td className="whitespace-nowrap px-2.5 py-2">
                  <div className="font-extrabold text-xs text-emerald-500 dark:text-emerald-400">
                    {formatUsd(commissionUsd)}
                  </div>
                  <div className="text-[10px] font-medium text-muted-foreground">
                    ≈ {formatCrc(commissionCrc)}
                  </div>
                </td>
                <td className="whitespace-nowrap px-2 py-2">
                  {isPaid ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircleIcon size={12} weight="bold" />
                      <span>{t("referrals.status.paid", "Pagado")}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-500 dark:text-amber-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                      <span>{t("referrals.status.pending", "Pendiente")}</span>
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-2.5 py-2 text-right">
                  {!isPaid ? (
                    <button
                      type="button"
                      onClick={() => onPay(conv)}
                      className="group inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-500 dark:hover:text-white transition-all duration-150 shadow-2xs active:scale-[0.97] cursor-pointer hover:shadow-sm"
                    >
                      <BankIcon
                        size={12}
                        weight="bold"
                        className="transition-transform group-hover:scale-110"
                      />
                      <span>
                        {t("referrals.action.liquidateSinpe", "Liquidar SINPE")}
                      </span>
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-medium px-2 py-1">
                      <CheckCircleIcon
                        size={12}
                        weight="fill"
                        className="text-emerald-500"
                      />
                      <span>{t("referrals.action.liquidated", "Liquidado")}</span>
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ----------------------------------------------------
// LISTA DE PROMOTORES & ENLACES
// ----------------------------------------------------
function ListaAfiliados({
  affiliates,
  exchangeRate,
  onPay,
  onCreateNew,
}: {
  affiliates: PlatformAffiliate[];
  exchangeRate: number;
  onPay: (aff: PlatformAffiliate) => void;
  onCreateNew: () => void;
}) {
  const { t } = useLanguage();
  const marketingUrl = gigbladeMarketingSiteUrl();

  const resolveReferralLink = (aff: PlatformAffiliate) => {
    // En desarrollo local apunta a localhost:3000 y en producción a gigblades.vercel.app
    return `${marketingUrl.replace(/\/+$/, "")}/acceso?ref=${encodeURIComponent(aff.code)}`;
  };

  const copyLink = (link: string, code: string) => {
    void navigator.clipboard.writeText(link);
    toast.success(
      `${t("referrals.linkCopiedFor", "Enlace copiado para el promotor")} ${code}`,
    );
  };

  if (affiliates.length === 0) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center">
        <UsersIcon size={32} className="text-muted-foreground/60" />
        <h3 className="mt-2 text-sm font-semibold">
          {t("referrals.emptyAffiliatesTitle", "No hay promotores registrados")}
        </h3>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
          {t(
            "referrals.emptyAffiliatesDesc",
            "Registrá a la primera persona para generarle su código único y enlace de recomendación.",
          )}
        </p>
        <button
          type="button"
          onClick={onCreateNew}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer shadow-xs active:scale-95"
        >
          <PlusIcon size={14} weight="bold" />
          <span>
            {t("referrals.createFirstAffiliate", "Crear primer afiliado")}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border bg-card shadow-xs overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <th className="px-2.5 py-2.5">
              {t("referrals.th.promoter", "Promotor")}
            </th>
            <th className="px-2 py-2.5">{t("referrals.th.code", "Código")}</th>
            <th className="px-2 py-2.5">
              {t("referrals.th.directLink", "Enlace Directo")}
            </th>
            <th className="px-2 py-2.5">
              {t("referrals.th.paymentAccount", "Cuenta de Pago")}
            </th>
            <th className="px-2 py-2.5 text-center">
              {t("referrals.th.djsBrought", "DJs")}
            </th>
            <th className="px-2 py-2.5">
              {t("referrals.th.totalGenerated", "Total Generado")}
            </th>
            <th className="px-2 py-2.5">
              {t("referrals.th.pendingBalance", "Saldo Pendiente")}
            </th>
            <th className="px-2.5 py-2.5 text-right">
              {t("referrals.th.action", "Acción")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {affiliates.map((aff) => {
            const pendingCrc = aff.pendingBalanceCrc ?? aff.pendingBalance ?? 0;
            const pendingUsd =
              aff.pendingBalanceUsd ?? pendingCrc / exchangeRate;
            const earnedCrc = aff.totalEarnedCrc ?? aff.totalEarned ?? 0;
            const earnedUsd = aff.totalEarnedUsd ?? earnedCrc / exchangeRate;
            const hasPending = pendingCrc > 0;
            const referralLink = resolveReferralLink(aff);

            return (
              <tr key={aff.id} className="transition-colors hover:bg-muted/30">
                <td className="whitespace-nowrap px-2.5 py-2">
                  <div className="font-semibold text-foreground text-xs truncate max-w-[140px]" title={aff.name}>
                    {aff.name}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate max-w-[140px]" title={aff.email}>
                    {aff.email}
                  </div>
                </td>
                <td className="whitespace-nowrap px-2 py-2">
                  <span className="font-mono font-bold text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded-md border border-primary/20">
                    {aff.code}
                  </span>
                </td>
                <td className="whitespace-nowrap px-2 py-2">
                  <div className="flex items-center gap-1">
                    <span
                      className="max-w-[130px] lg:max-w-[160px] truncate font-mono text-[11px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded select-all"
                      title={referralLink}
                    >
                      {referralLink}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyLink(referralLink, aff.code)}
                      className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors border border-transparent hover:border-border cursor-pointer active:scale-95"
                      title={t("referrals.copyLink", "Copiar enlace")}
                    >
                      <CopyIcon size={13} weight="bold" />
                    </button>
                    <a
                      href={referralLink}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded p-1 text-muted-foreground hover:text-primary hover:bg-muted/80 transition-colors border border-transparent hover:border-border cursor-pointer active:scale-95 inline-flex items-center justify-center"
                      title={t("referrals.openLink", "Abrir enlace de referido en nueva pestaña")}
                    >
                      <ArrowSquareOutIcon size={13} weight="bold" />
                    </a>
                  </div>
                </td>
                <td className="whitespace-nowrap px-2 py-2 text-xs">
                  {aff.paymentMethod === "sinpe" ? (
                    <div className="flex items-center gap-1.5">
                      <span className="rounded bg-emerald-500/10 px-1 py-0.5 text-[10px] font-bold text-emerald-500 border border-emerald-500/20 shrink-0">
                        SINPE
                      </span>
                      <span className="font-mono text-xs font-medium">
                        {aff.paymentDetails.sinpePhone ||
                          aff.phone ||
                          t("referrals.notSpecified", "No indicado")}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="rounded bg-sky-500/10 px-1 py-0.5 text-[10px] font-bold text-sky-500 border border-sky-500/20 shrink-0">
                        IBAN
                      </span>
                      <span className="font-mono text-[11px]">
                        {aff.paymentDetails.iban ||
                          t("referrals.notSpecified", "No indicado")}
                      </span>
                    </div>
                  )}
                </td>
                <td className="whitespace-nowrap px-2 py-2 text-center font-bold text-foreground text-xs">
                  {aff.totalConversions}
                </td>
                <td className="whitespace-nowrap px-2 py-2 text-xs">
                  <div className="font-semibold text-foreground">
                    {formatUsd(earnedUsd)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    ({formatCrc(earnedCrc)})
                  </div>
                </td>
                <td className="whitespace-nowrap px-2 py-2">
                  <span
                    className={`font-extrabold text-xs ${
                      hasPending
                        ? "text-amber-500 dark:text-amber-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    {formatCrc(pendingCrc)}
                  </span>
                  {hasPending && (
                    <div className="text-[10px] text-muted-foreground font-medium">
                      ≈ {formatUsd(pendingUsd)}
                    </div>
                  )}
                </td>
                <td className="whitespace-nowrap px-2.5 py-2 text-right">
                  {hasPending ? (
                    <button
                      type="button"
                      onClick={() => onPay(aff)}
                      className="group inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-500 dark:hover:text-white transition-all duration-150 shadow-2xs active:scale-[0.97] cursor-pointer hover:shadow-sm"
                    >
                      <BankIcon
                        size={12}
                        weight="bold"
                        className="transition-transform group-hover:scale-110"
                      />
                      <span>
                        {t("referrals.action.liquidateSinpe", "Liquidar SINPE")}
                      </span>
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-medium px-1.5 py-0.5">
                      <CheckCircleIcon
                        size={13}
                        weight="fill"
                        className="text-emerald-500"
                      />
                      <span>{t("referrals.action.upToDate", "Al día")}</span>
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ----------------------------------------------------
// HISTORIAL DE PAGOS SINPE / BANCOS
// ----------------------------------------------------
function HistorialPagos({
  payouts,
  exchangeRate,
}: {
  payouts: PlatformReferralsData["payouts"];
  exchangeRate: number;
}) {
  const { t, language } = useLanguage();

  if (payouts.length === 0) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center">
        <BankIcon size={32} className="text-muted-foreground/60" />
        <h3 className="mt-2 text-sm font-semibold">
          {t("referrals.emptyPayoutsTitle", "Sin pagos registrados")}
        </h3>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
          {t(
            "referrals.emptyPayoutsDesc",
            "Los comprobantes de SINPE Móvil y transferencias aparecerán aquí conforme liquides las comisiones de los promotores.",
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border bg-card shadow-xs overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <th className="px-3 py-2.5">
              {t("referrals.th.payoutDate", "Fecha de Pago")}
            </th>
            <th className="px-3 py-2.5">
              {t("referrals.th.promoter", "Promotor")}
            </th>
            <th className="px-3 py-2.5">
              {t("referrals.th.method", "Método")}
            </th>
            <th className="px-3 py-2.5">
              {t("referrals.th.reference", "Nº Comprobante / Referencia")}
            </th>
            <th className="px-3 py-2.5">
              {t("referrals.th.liquidatedAmount", "Monto Liquidado")}
            </th>
            <th className="px-3 py-2.5">{t("referrals.th.note", "Nota")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {payouts.map((payout) => (
            <tr key={payout.id} className="transition-colors hover:bg-muted/30">
              <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted-foreground font-mono">
                {formatDate(payout.paidAt, language)}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 font-semibold text-foreground text-xs">
                {payout.affiliateName} ({payout.affiliateCode})
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold">
                <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[11px]">
                  {payout.method === "sinpe"
                    ? t("referrals.method.sinpe", "SINPE Móvil")
                    : t("referrals.method.iban", "Transferencia IBAN")}
                </span>
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 font-mono font-bold text-xs text-primary bg-primary/5 px-2 rounded">
                {payout.referenceNumber}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5">
                <div className="font-extrabold text-xs text-emerald-500 dark:text-emerald-400">
                  {formatCrc(payout.amount)}
                </div>
                <div className="text-[11px] font-medium text-muted-foreground">
                  ≈{" "}
                  {formatUsd(payout.amountUsd ?? payout.amount / exchangeRate)}
                </div>
              </td>
              <td className="px-3 py-2.5 text-xs text-muted-foreground">
                {payout.note ||
                  t("referrals.defaultPayoutNote", "Liquidación de comisiones")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ----------------------------------------------------
// MODAL: MODIFICAR PORCENTAJES Y TARIFAS (SIN PAQUETES)
// ----------------------------------------------------
function ModalAjustarPorcentajes({
  currentSettings,
  onClose,
  onSaved,
}: {
  currentSettings: PlatformReferralSettings;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(
    currentSettings.exchangeRateCrc || 515,
  );

  // 1. Cobro Inicial
  const [initialPriceUsd, setInitialPriceUsd] = useState(
    currentSettings.initialSetupPriceUsd ?? 100,
  );
  const [initialPercent, setInitialPercent] = useState(
    currentSettings.initialSetupPercent ?? 20,
  );

  // 2. Mensualidad
  const [monthlyPriceUsd, setMonthlyPriceUsd] = useState(
    currentSettings.monthlyPriceUsd ?? 30,
  );
  const [monthlyPercent, setMonthlyPercent] = useState(
    currentSettings.monthlyPercent ?? 15,
  );

  // Previews en vivo
  const initialCommissionUsd = Number(
    ((initialPriceUsd * initialPercent) / 100).toFixed(2),
  );
  const initialCommissionCrc = Math.round(initialCommissionUsd * exchangeRate);

  const monthlyCommissionUsd = Number(
    ((monthlyPriceUsd * monthlyPercent) / 100).toFixed(2),
  );
  const monthlyCommissionCrc = Math.round(monthlyCommissionUsd * exchangeRate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updatePlatformReferralSettings({
        currency: "USD",
        exchangeRateCrc: Number(exchangeRate),
        initialSetupPriceUsd: Number(initialPriceUsd),
        initialSetupPercent: Number(initialPercent),
        monthlyPriceUsd: Number(monthlyPriceUsd),
        monthlyPercent: Number(monthlyPercent),
        percentages: {
          initial_setup: Number(initialPercent),
          monthly: Number(monthlyPercent),
        },
        packagePrices: {
          initial_setup: Number(initialPriceUsd),
          monthly: Number(monthlyPriceUsd),
        },
      });
      toast.success(
        t(
          "referrals.modalSettings.saveSuccess",
          "¡Porcentajes y tarifas actualizados con éxito!",
        ),
      );
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {t(
              "referrals.modalSettings.title",
              "Modificar Porcentajes y Tarifas de Afiliados",
            )}
          </DialogTitle>
          <DialogDescription>
            {t(
              "referrals.modalSettings.desc",
              "Ajustá los porcentajes que ganan los promotores por el cobro inicial de la página y por la mensualidad de $30. Todo se define en dólares con conversión a colones.",
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Tipo de Cambio */}
          <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center gap-2">
              <ArrowsLeftRightIcon size={18} className="text-primary" />
              <div>
                <div className="text-xs font-bold">
                  {t(
                    "referrals.modalSettings.fxTitle",
                    "Tipo de Cambio de Referencia",
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {t(
                    "referrals.modalSettings.fxDesc",
                    "Valor en Colones (₡) por cada $1 USD para liquidaciones SINPE Móvil",
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-muted-foreground">
                ₡
              </span>
              <input
                type="number"
                required
                min="300"
                max="1000"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(Number(e.target.value))}
                className="h-8 w-20 rounded-md border bg-background px-2 text-xs font-mono font-bold text-center"
              />
              <span className="text-xs text-muted-foreground">/ USD</span>
            </div>
          </div>

          {/* 1. Cobro Inicial de la Página */}
          <div className="rounded-xl border p-4 bg-card space-y-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <DesktopIcon
                size={18}
                className="text-purple-600 dark:text-purple-400"
              />
              <span className="text-sm font-bold text-foreground">
                {t(
                  "referrals.modalSettings.setupTitle",
                  "1. Cobro Inicial (Creación / Setup de Página)",
                )}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t(
                "referrals.modalSettings.setupDesc",
                "Monto cobrado al DJ por diseñar y montar su página web por primera vez.",
              )}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  {t(
                    "referrals.modalSettings.priceUsd",
                    "Precio en Dólares ($ USD)",
                  )}
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-xs text-muted-foreground font-bold">
                    $
                  </span>
                  <input
                    type="number"
                    required
                    min="10"
                    value={initialPriceUsd}
                    onChange={(e) => setInitialPriceUsd(Number(e.target.value))}
                    className="h-8 w-full rounded-md border bg-background pl-6 pr-2 text-xs font-semibold"
                  />
                </div>
                <span className="text-[10px] text-muted-foreground mt-0.5 block">
                  ≈ {formatCrc(initialPriceUsd * exchangeRate)}
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  {t(
                    "referrals.modalSettings.percent",
                    "% Comisión del Promotor",
                  )}
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    required
                    min="1"
                    max="100"
                    value={initialPercent}
                    onChange={(e) => setInitialPercent(Number(e.target.value))}
                    className="h-8 w-full rounded-md border bg-background px-2 text-xs font-bold text-primary"
                  />
                  <span className="text-xs font-bold">%</span>
                </div>
                <span className="text-[10px] text-muted-foreground mt-0.5 block">
                  {t(
                    "referrals.modalSettings.percentHelp",
                    "Porcentaje sobre el cobro inicial",
                  )}
                </span>
              </div>
            </div>

            {/* Preview en vivo con alto contraste */}
            <div className="rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 px-3 py-2.5 flex items-center justify-between text-xs">
              <span className="text-purple-800 dark:text-purple-300 font-semibold">
                {t(
                  "referrals.modalSettings.affiliateReceives",
                  "El afiliado recibe de comisión:",
                )}
              </span>
              <span className="font-extrabold text-purple-950 dark:text-purple-100 text-sm">
                {formatUsd(initialCommissionUsd)} USD ≈{" "}
                {formatCrc(initialCommissionCrc)}
              </span>
            </div>
          </div>

          {/* 2. Mensualidad Recurrente */}
          <div className="rounded-xl border p-4 bg-card space-y-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <CalendarCheckIcon
                size={18}
                className="text-sky-600 dark:text-sky-400"
              />
              <span className="text-sm font-bold text-foreground">
                {t(
                  "referrals.modalSettings.monthlyTitle",
                  "2. Mensualidad Recurrente ($30 USD)",
                )}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t(
                "referrals.modalSettings.monthlyDesc",
                "Suscripción mensual de mantenimiento del servicio y hosting del DJ.",
              )}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  {t(
                    "referrals.modalSettings.monthlyPriceUsd",
                    "Mensualidad ($ USD)",
                  )}
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-xs text-muted-foreground font-bold">
                    $
                  </span>
                  <input
                    type="number"
                    required
                    min="5"
                    value={monthlyPriceUsd}
                    onChange={(e) => setMonthlyPriceUsd(Number(e.target.value))}
                    className="h-8 w-full rounded-md border bg-background pl-6 pr-2 text-xs font-semibold"
                  />
                </div>
                <span className="text-[10px] text-muted-foreground mt-0.5 block">
                  ≈ {formatCrc(monthlyPriceUsd * exchangeRate)}
                  {t("referrals.perMonth", "/mes")}
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  {t(
                    "referrals.modalSettings.monthlyPercent",
                    "% Comisión Mensual Recurrente",
                  )}
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    required
                    min="1"
                    max="100"
                    value={monthlyPercent}
                    onChange={(e) => setMonthlyPercent(Number(e.target.value))}
                    className="h-8 w-full rounded-md border bg-background px-2 text-xs font-bold text-primary"
                  />
                  <span className="text-xs font-bold">%</span>
                </div>
                <span className="text-[10px] text-muted-foreground mt-0.5 block">
                  {t(
                    "referrals.modalSettings.monthlyPercentHelp",
                    "Porcentaje ganado cada mes activo",
                  )}
                </span>
              </div>
            </div>

            {/* Preview en vivo con alto contraste */}
            <div className="rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 px-3 py-2.5 flex items-center justify-between text-xs">
              <span className="text-sky-800 dark:text-sky-300 font-semibold">
                {t(
                  "referrals.modalSettings.affiliateReceivesMonthly",
                  "El afiliado recibe cada mes:",
                )}
              </span>
              <span className="font-extrabold text-sky-950 dark:text-sky-100 text-sm">
                {formatUsd(monthlyCommissionUsd)}
                {t("referrals.perMonth", "/mes")} ≈{" "}
                {formatCrc(monthlyCommissionCrc)}
                {t("referrals.perMonth", "/mes")}
              </span>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              variant="secondary"
              type="button"
              onClick={onClose}
              disabled={loading}
            >
              {t("action.cancel", "Cancelar")}
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading
                ? t("referrals.modalSettings.saving", "Guardando...")
                : t(
                    "referrals.modalSettings.save",
                    "Guardar Porcentajes y Tarifas",
                  )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ----------------------------------------------------
// MODAL: NUEVO AFILIADO (CÓDIGO GENERADO AUTOMÁTICAMENTE)
// ----------------------------------------------------
function ModalNuevoAfiliado({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  // Generar código único aleatorio por defecto
  const [code, setCode] = useState(() => generateAffiliateCode());
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"sinpe" | "iban">("sinpe");
  const [sinpePhone, setSinpePhone] = useState("");
  const [iban, setIban] = useState("");
  const [isCustomCode, setIsCustomCode] = useState(false);

  const handleRegenerateCode = () => {
    const newCode = generateAffiliateCode(name);
    setCode(newCode);
    setIsCustomCode(false);
    toast.info(`${t("referrals.modalNew.codeLabel", "Código")}: ${newCode}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Escribí el nombre del promotor.");
    if (!code.trim()) return toast.error("Asignale un código único.");
    if (!email.trim()) return toast.error("Escribí el correo.");

    setLoading(true);
    try {
      await createPlatformAffiliate({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        paymentMethod,
        sinpePhone:
          paymentMethod === "sinpe"
            ? sinpePhone.trim() || phone.trim()
            : undefined,
        iban: paymentMethod === "iban" ? iban.trim() : undefined,
      });
      toast.success(`${code.toUpperCase()} OK`);
      onCreated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t(
              "referrals.modalNew.title",
              "Registrar Nuevo Afiliado / Promotor",
            )}
          </DialogTitle>
          <DialogDescription>
            {t(
              "referrals.modalNew.desc",
              "Cualquier persona que recomiende el servicio a DJs. Se genera su código y enlace único automáticamente.",
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              {t(
                "referrals.modalNew.nameLabel",
                "Nombre completo o artístico *",
              )}
            </label>
            <input
              type="text"
              required
              placeholder={t(
                "referrals.modalNew.namePlaceholder",
                "Ej: Maxx Rodríguez",
              )}
              value={name}
              onChange={(e) => {
                const val = e.target.value;
                setName(val);
                if (!isCustomCode && val.trim().length >= 2) {
                  setCode(generateAffiliateCode(val));
                }
              }}
              className="h-9 w-full rounded-md border bg-background px-3 text-sm focus:border-primary focus:outline-hidden"
            />
          </div>

          {/* Código Único Generado Automáticamente */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <span>
                  {t("referrals.modalNew.codeLabel", "Código de Referido")}
                </span>
                <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.2 text-[10px] font-bold text-primary">
                  <SparkleIcon size={11} weight="fill" />
                  {t("referrals.modalNew.autoBadge", "Automático")}
                </span>
              </label>
              <button
                type="button"
                onClick={handleRegenerateCode}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 cursor-pointer transition-colors"
              >
                <ArrowsClockwiseIcon size={12} weight="bold" />
                <span>
                  {t("referrals.modalNew.regenerate", "Generar otro")}
                </span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                required
                value={code}
                onChange={(e) => {
                  setIsCustomCode(true);
                  setCode(
                    e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""),
                  );
                }}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm font-mono uppercase font-bold text-primary tracking-wider focus:border-primary focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleRegenerateCode}
                title={t("referrals.modalNew.regenerate", "Generar otro")}
                className="h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-md border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer active:scale-95"
              >
                <ArrowsClockwiseIcon size={16} weight="bold" />
              </button>
            </div>
            <span className="text-[11px] text-muted-foreground mt-0.5 block">
              {t(
                "referrals.modalNew.codeHelp",
                "Generado automáticamente. Podés modificarlo si deseás uno personalizado.",
              )}
            </span>
            <div className="rounded-md border bg-muted/30 px-3 py-2 mt-2">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-0.5">
                {t("referrals.modalNew.previewLink", "Enlace directo que se generará:")}
              </span>
              <span className="font-mono text-primary text-xs truncate block select-all">
                {`${gigbladeMarketingSiteUrl().replace(/\/+$/, "")}/acceso?ref=${code || "CODIGO"}`}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                {t("referrals.modalNew.emailLabel", "Correo electrónico *")}
              </label>
              <input
                type="email"
                required
                placeholder="promotor@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm focus:border-primary focus:outline-hidden"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                {t("referrals.modalNew.phoneLabel", "Teléfono / WhatsApp")}
              </label>
              <input
                type="tel"
                placeholder="+506 8888 1111"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (!sinpePhone) setSinpePhone(e.target.value);
                }}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm focus:border-primary focus:outline-hidden"
              />
            </div>
          </div>

          <div className="pt-2 border-t space-y-2">
            <label className="text-xs font-semibold text-muted-foreground block">
              {t(
                "referrals.modalNew.payoutAccountLabel",
                "Cuenta para recibir pagos de comisiones",
              )}
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                <input
                  type="radio"
                  name="method"
                  checked={paymentMethod === "sinpe"}
                  onChange={() => setPaymentMethod("sinpe")}
                />
                <span>SINPE Móvil</span>
              </label>
              <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                <input
                  type="radio"
                  name="method"
                  checked={paymentMethod === "iban"}
                  onChange={() => setPaymentMethod("iban")}
                />
                <span>Transferencia IBAN</span>
              </label>
            </div>

            {paymentMethod === "sinpe" ? (
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">
                  {t(
                    "referrals.modalNew.sinpePhoneLabel",
                    "Número SINPE Móvil",
                  )}
                </label>
                <input
                  type="text"
                  placeholder="Ej: 88881111"
                  value={sinpePhone}
                  onChange={(e) => setSinpePhone(e.target.value)}
                  className="h-8 w-full rounded-md border bg-background px-3 text-xs font-mono"
                />
              </div>
            ) : (
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">
                  {t("referrals.modalNew.ibanLabel", "Número de Cuenta IBAN")}
                </label>
                <input
                  type="text"
                  placeholder="CR00000000000000000000"
                  value={iban}
                  onChange={(e) => setIban(e.target.value.toUpperCase())}
                  className="h-8 w-full rounded-md border bg-background px-3 text-xs font-mono"
                />
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              variant="secondary"
              type="button"
              onClick={onClose}
              disabled={loading}
            >
              {t("action.cancel", "Cancelar")}
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading
                ? t("referrals.modalNew.creating", "Creando...")
                : t("referrals.modalNew.submit", "Crear y Generar Enlace")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ----------------------------------------------------
// MODAL: LIQUIDACIÓN DE PAGO POR SINPE MÓVIL
// ----------------------------------------------------
function ModalLiquidacionPago({
  target,
  exchangeRate,
  onClose,
  onPaid,
}: {
  target: {
    affiliate: PlatformAffiliate;
    amountCrc: number;
    amountUsd: number;
    conversionId?: string;
  };
  exchangeRate: number;
  onClose: () => void;
  onPaid: () => void;
}) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [amountCrc, setAmountCrc] = useState(target.amountCrc);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [note, setNote] = useState("");
  const method = target.affiliate.paymentMethod;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referenceNumber.trim()) {
      return toast.error(
        "Ingresá el número de comprobante o referencia del SINPE.",
      );
    }
    if (amountCrc <= 0) {
      return toast.error("El monto debe ser mayor a cero.");
    }

    setLoading(true);
    try {
      await recordPlatformReferralPayout({
        affiliateId: target.affiliate.id,
        amount: amountCrc,
        currency: "CRC",
        method,
        referenceNumber: referenceNumber.trim(),
        note: note.trim() || undefined,
      });
      toast.success(`${target.affiliate.name} OK`);
      onPaid();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t(
              "referrals.modalPayout.title",
              "Liquidar Comisión (SINPE Móvil / Banco)",
            )}
          </DialogTitle>
          <DialogDescription>
            {t(
              "referrals.modalPayout.desc",
              "Registrá el número de comprobante de la transferencia realizada en colones al promotor.",
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handlePay} className="mt-4 space-y-3">
          <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                {t("referrals.modalPayout.affiliate", "Afiliado:")}
              </span>
              <span className="font-semibold text-foreground">
                {target.affiliate.name} ({target.affiliate.code})
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                {t("referrals.modalPayout.destination", "Destino de pago:")}
              </span>
              <span className="font-mono font-medium text-emerald-500 dark:text-emerald-400">
                {method === "sinpe"
                  ? `SINPE: ${target.affiliate.paymentDetails.sinpePhone || target.affiliate.phone || "---"}`
                  : `IBAN: ${target.affiliate.paymentDetails.iban || "---"}`}
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              {t(
                "referrals.modalPayout.amountLabel",
                "Monto en Colones a transferir (₡ CRC) *",
              )}
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-2 text-sm font-semibold text-muted-foreground">
                ₡
              </span>
              <input
                type="number"
                required
                min="100"
                value={amountCrc}
                onChange={(e) => setAmountCrc(Number(e.target.value))}
                className="h-9 w-full rounded-md border bg-background pl-7 pr-3 text-sm font-bold text-emerald-500 dark:text-emerald-400"
              />
            </div>
            <span className="text-[11px] text-muted-foreground mt-0.5 block">
              {t("referrals.modalPayout.equivalent", "Equivalente a")}{" "}
              {formatUsd(amountCrc / exchangeRate)} USD (
              {t("referrals.exchangeRateLabel", "al T.C.")} ₡{exchangeRate})
            </span>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              {t(
                "referrals.modalPayout.refLabel",
                "Nº de Comprobante / Transacción SINPE *",
              )}
            </label>
            <input
              type="text"
              required
              placeholder={t(
                "referrals.modalPayout.refPlaceholder",
                "Ej: SINPE-948201 o Ref. Banco",
              )}
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="h-9 w-full rounded-md border bg-background px-3 text-sm font-mono tracking-wider focus:border-primary focus:outline-hidden"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              {t("referrals.modalPayout.noteLabel", "Nota interna (opcional)")}
            </label>
            <input
              type="text"
              placeholder={t(
                "referrals.modalPayout.notePlaceholder",
                "Ej: Pago quincenal de referidos",
              )}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              variant="secondary"
              type="button"
              onClick={onClose}
              disabled={loading}
            >
              {t("action.cancel", "Cancelar")}
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading
                ? t("referrals.modalPayout.processing", "Registrando...")
                : t(
                    "referrals.modalPayout.confirm",
                    "Confirmar Pago Realizado",
                  )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
