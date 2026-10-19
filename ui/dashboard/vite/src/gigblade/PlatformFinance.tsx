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
	BankIcon,
	CalculatorIcon,
	CalendarCheckIcon,
	CheckCircleIcon,
	ClockIcon,
	CodeIcon,
	CurrencyDollarIcon,
	CrownIcon,
	GearIcon,
	InfoIcon,
	PercentIcon,
	ShareNetworkIcon,
	SparkleIcon,
	TrendUpIcon,
	UsersIcon,
	WrenchIcon,
} from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { useLanguage } from "@/contexts/LanguageProvider";
import {
	fetchPlatformReferrals,
	updatePlatformReferralSettings,
	type PlatformReferralConversion,
	type PlatformReferralSettings,
} from "@/gigblade/site-api";

import { PLATFORM_REFERRALS_QUERY_KEY } from "@/gigblade/platform-referrals-query";
import {
	FieldNumericInput,
	NumericInput,
	parseNumericField,
} from "@/gigblade/numeric-input";

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

export default function PlatformFinance() {
	const { data: session } = useSession();
	const queryClient = useQueryClient();
	const { t, language } = useLanguage();
	const isPlatform =
		(session?.user as { role?: string } | undefined)?.role === "platform";

	const [settingsModalOpen, setSettingsModalOpen] = useState(false);
	const [activeTab, setActiveTab] = useState<"desglose" | "simulador" | "infraestructura">("desglose");
	const [activeSimChargeType, setActiveSimChargeType] = useState<"initial_setup" | "monthly">("initial_setup");
	const [activeSimChannel, setActiveSimChannel] = useState<"referral" | "direct">("referral");
	const [customSimMaintenanceRaw, setCustomSimMaintenanceRaw] = useState<string | null>(
		null,
	);

	const query = useQuery({
		queryKey: PLATFORM_REFERRALS_QUERY_KEY,
		queryFn: ({ signal }) => fetchPlatformReferrals(signal),
		enabled: Boolean(isPlatform),
		staleTime: 15_000,
		retry: 1,
	});

	useEffect(() => {
		if (!query.isError) return;
		toast.error(
			t(
				"finance.loadError",
				"No se pudieron cargar finanzas y comisiones. Recargá la página.",
			),
		);
	}, [query.isError, t]);

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
			developerPercent: 50,
			founderPercent: 50,
			maintenanceMonthlyCostUsd: 0,
			maintenancePercent: 0,
			percentages: { initial_setup: 20, monthly: 15 },
			packagePrices: { initial_setup: 100, monthly: 30 },
			isActive: true,
			updatedAt: new Date().toISOString(),
		},
		payouts: [],
	};

	const exchangeRate = settings.exchangeRateCrc || 515;
	const setupPriceUsd = settings.initialSetupPriceUsd ?? 100;
	const monthlyPriceUsd = settings.monthlyPriceUsd ?? 30;
	const devPercent = settings.developerPercent ?? 50;
	const founderPercent = settings.founderPercent ?? 50;
	const maintenanceMonthlyCostUsd = settings.maintenanceMonthlyCostUsd ?? 0;
	const maintenancePercent = settings.maintenancePercent ?? 0;

	// Cálculo de métricas acumuladas reales a partir del historial de conversiones
	const financeTotals = useMemo(() => {
		let totalGrossBilledUsd = 0;
		let totalGrossBilledCrc = 0;
		let totalAffiliateCommissionsUsd = 0;
		let totalAffiliateCommissionsCrc = 0;
		let totalMaintenanceUsd = 0;
		let totalMaintenanceCrc = 0;
		let totalDeveloperUsd = 0;
		let totalDeveloperCrc = 0;
		let totalFounderUsd = 0;
		let totalFounderCrc = 0;

		const teamTotalPercent = devPercent + founderPercent || 100;

		for (const conv of conversions) {
			const grossUsd = conv.amountUsd ?? (conv.amountCrc ? conv.amountCrc / exchangeRate : 100);
			const grossCrc = conv.amountCrc ?? Math.round(grossUsd * exchangeRate);

			const affiliateUsd = conv.commissionAmountUsd ?? (conv.commissionAmountCrc ? conv.commissionAmountCrc / exchangeRate : 0);
			const affiliateCrc = conv.commissionAmountCrc ?? Math.round(affiliateUsd * exchangeRate);

			// Deducción de infraestructura / mantenimiento (configurable)
			const maintUsd = maintenanceMonthlyCostUsd > 0
				? Math.min(Math.max(0, grossUsd - affiliateUsd), maintenanceMonthlyCostUsd)
				: (grossUsd * maintenancePercent) / 100;
			const maintCrc = Math.round(maintUsd * exchangeRate);

			const netDistributableUsd = Math.max(0, grossUsd - affiliateUsd - maintUsd);
			const netDistributableCrc = Math.max(0, grossCrc - affiliateCrc - maintCrc);

			const devUsd = (netDistributableUsd * devPercent) / teamTotalPercent;
			const devCrc = Math.round((netDistributableCrc * devPercent) / teamTotalPercent);

			const founderUsd = netDistributableUsd - devUsd;
			const founderCrc = netDistributableCrc - devCrc;

			totalGrossBilledUsd += grossUsd;
			totalGrossBilledCrc += grossCrc;
			totalAffiliateCommissionsUsd += affiliateUsd;
			totalAffiliateCommissionsCrc += affiliateCrc;
			totalMaintenanceUsd += maintUsd;
			totalMaintenanceCrc += maintCrc;
			totalDeveloperUsd += devUsd;
			totalDeveloperCrc += devCrc;
			totalFounderUsd += founderUsd;
			totalFounderCrc += founderCrc;
		}

		return {
			totalGrossBilledUsd,
			totalGrossBilledCrc,
			totalAffiliateCommissionsUsd,
			totalAffiliateCommissionsCrc,
			totalMaintenanceUsd,
			totalMaintenanceCrc,
			totalDeveloperUsd,
			totalDeveloperCrc,
			totalFounderUsd,
			totalFounderCrc,
		};
	}, [conversions, exchangeRate, devPercent, founderPercent, maintenanceMonthlyCostUsd, maintenancePercent]);

	// Simulador interactivo en tiempo real
	const simCalculation = useMemo(() => {
		const isMonthly = activeSimChargeType === "monthly";
		const grossUsd = isMonthly
			? (settings.monthlyPriceUsd || 30)
			: (settings.initialSetupPriceUsd || 100);
		const grossCrc = Math.round(grossUsd * exchangeRate);

		let affiliatePercent = 0;
		let affiliateUsd = 0;
		if (activeSimChannel === "referral") {
			affiliatePercent = isMonthly
				? (settings.monthlyPercent ?? 15)
				: (settings.initialSetupPercent ?? 20);
			affiliateUsd = (grossUsd * affiliatePercent) / 100;
		}
		const affiliateCrc = Math.round(affiliateUsd * exchangeRate);

		// Deducción de infraestructura / servidores (configurable)
		const effectiveMaintenanceUsd =
			customSimMaintenanceRaw !== null
				? parseNumericField(customSimMaintenanceRaw, 0)
				: maintenanceMonthlyCostUsd;
		const maintUsd = effectiveMaintenanceUsd > 0
			? Math.min(Math.max(0, grossUsd - affiliateUsd), effectiveMaintenanceUsd)
			: (grossUsd * maintenancePercent) / 100;
		const maintCrc = Math.round(maintUsd * exchangeRate);

		const netDistributableUsd = Math.max(0, grossUsd - affiliateUsd - maintUsd);
		const netDistributableCrc = Math.max(0, grossCrc - affiliateCrc - maintCrc);

		const teamTotalPercent = devPercent + founderPercent || 100;
		const devUsd = (netDistributableUsd * devPercent) / teamTotalPercent;
		const devCrc = Math.round((netDistributableCrc * devPercent) / teamTotalPercent);

		const founderUsd = netDistributableUsd - devUsd;
		const founderCrc = netDistributableCrc - devCrc;

		return {
			grossUsd,
			grossCrc,
			affiliatePercent,
			affiliateUsd,
			affiliateCrc,
			maintUsd,
			maintCrc,
			netDistributableUsd,
			netDistributableCrc,
			devPercent,
			devUsd,
			devCrc,
			founderPercent,
			founderUsd,
			founderCrc,
			effectiveMaintenanceUsd,
		};
	}, [activeSimChargeType, activeSimChannel, settings, exchangeRate, devPercent, founderPercent, maintenanceMonthlyCostUsd, maintenancePercent, customSimMaintenanceRaw]);

	return (
		<PageContainer>
			<PageHeader
				icon={
					<CurrencyDollarIcon
						size={18}
						weight="fill"
						className="text-primary"
						aria-hidden
					/>
				}
				title={t("finance.title", "Finanzas & Reparto de Ingresos")}
			>
				<div className="flex flex-wrap items-center gap-2">
					<Link
						to="/referidos"
						className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted/80 transition-all duration-150 shadow-xs cursor-pointer active:scale-95"
					>
						<ShareNetworkIcon size={16} className="text-primary" />
						<span>{t("finance.viewAffiliates", "Ver Afiliados & Comisiones")}</span>
					</Link>
					<button
						type="button"
						onClick={() => query.refetch()}
						disabled={query.isFetching}
						className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted/80 transition-all duration-150 shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
						title={t("finance.refresh", "Actualizar")}
					>
						<ArrowsClockwiseIcon size={16} className={query.isFetching ? "animate-spin" : ""} />
						<span>{t("finance.refresh", "Actualizar")}</span>
					</button>
					<button
						type="button"
						onClick={() => setSettingsModalOpen(true)}
						className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all duration-150 shadow-xs cursor-pointer active:scale-95"
					>
						<GearIcon size={16} weight="bold" />
						<span>{t("finance.configSplit", "Configurar % de Reparto")}</span>
					</button>
				</div>
			</PageHeader>
			<p className="text-sm text-tertiary-foreground leading-relaxed mt-1 sm:mt-2 max-w-3xl">
				{t("finance.subtitle", "Gestión del reparto financiero de GigBlade conectado en tiempo real con las comisiones de referidos, gastos de mantenimiento y división entre socios.")}
			</p>

			{/* Tarjetas de Métricas Principales (Distribución Acumulada) */}
			<div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
				{/* Facturación Bruta */}
				<div className="rounded-xl border bg-card p-4 shadow-xs">
					<div className="flex items-center justify-between text-muted-foreground">
						<span className="text-xs font-medium uppercase tracking-wider">{t("finance.grossBilled", "Facturado Bruto")}</span>
						<CurrencyDollarIcon size={20} className="text-primary" />
					</div>
					<div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
						{formatUsd(financeTotals.totalGrossBilledUsd)}
					</div>
					<div className="mt-1 text-xs text-muted-foreground">
						≈ {formatCrc(financeTotals.totalGrossBilledCrc)} ({conversions.length} {t("finance.conversionsCount", "cobros registrados")})
					</div>
				</div>

				{/* Comisiones Afiliados */}
				<div className="rounded-xl border bg-card p-4 shadow-xs border-purple-500/20 bg-purple-500/[0.02]">
					<div className="flex items-center justify-between text-purple-600 dark:text-purple-400">
						<span className="text-xs font-medium uppercase tracking-wider">{t("finance.affiliateCommissions", "Comisiones a Afiliados")}</span>
						<ShareNetworkIcon size={20} />
					</div>
					<div className="mt-2 text-2xl font-bold tracking-tight text-purple-600 dark:text-purple-400">
						{formatUsd(financeTotals.totalAffiliateCommissionsUsd)}
					</div>
					<div className="mt-1 text-xs text-muted-foreground">
						≈ {formatCrc(financeTotals.totalAffiliateCommissionsCrc)} {t("finance.deductedBeforeSplit", "deducidos antes de reparto")}
					</div>
				</div>

				{/* Socio Fundador / Dueño */}
				<div className="rounded-xl border bg-card p-4 shadow-xs border-amber-500/20 bg-amber-500/[0.02]">
					<div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
						<span className="text-xs font-medium uppercase tracking-wider">{t("finance.founderShare", "Socio Fundador")} ({founderPercent}%)</span>
						<CrownIcon size={20} />
					</div>
					<div className="mt-2 text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
						{formatUsd(financeTotals.totalFounderUsd)}
					</div>
					<div className="mt-1 text-xs text-muted-foreground">
						≈ {formatCrc(financeTotals.totalFounderCrc)} {t("finance.accumulatedProfit", "beneficio neto acumulado")}
					</div>
				</div>

				{/* Desarrollador */}
				<div className="rounded-xl border bg-card p-4 shadow-xs border-sky-500/20 bg-sky-500/[0.02]">
					<div className="flex items-center justify-between text-sky-600 dark:text-sky-400">
						<span className="text-xs font-medium uppercase tracking-wider">{t("finance.developerShare", "Desarrollador")} ({devPercent}%)</span>
						<CodeIcon size={20} />
					</div>
					<div className="mt-2 text-2xl font-bold tracking-tight text-sky-600 dark:text-sky-400">
						{formatUsd(financeTotals.totalDeveloperUsd)}
					</div>
					<div className="mt-1 text-xs text-muted-foreground">
						≈ {formatCrc(financeTotals.totalDeveloperCrc)} {t("finance.accumulatedProfit", "beneficio neto acumulado")}
					</div>
				</div>
			</div>

			{/* Resumen de Infraestructura Cloud y Regla de Reparto */}
			<div className="mt-4 rounded-xl border bg-gradient-to-r from-card via-card to-card/60 p-4 shadow-xs">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<div className="flex flex-wrap items-center gap-2">
							<WrenchIcon size={18} className="text-primary" />
							<span className="font-semibold text-sm">{t("finance.infraTitle", "Infraestructura & Servidores Cloud")}</span>
							<span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
								<CheckCircleIcon size={12} weight="bold" />
								{t("finance.cloudActiveBadge", "Infraestructura Cloud Activa")}
							</span>
							<span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
								{t("referrals.exchangeRateLabel", "T.C.")} ₡{exchangeRate} / $1 USD
							</span>
						</div>
						<p className="mt-1 text-xs text-muted-foreground max-w-3xl leading-relaxed">
							{t("finance.cloudActiveDesc", "Arquitectura cloud serverless con CDN global, base de datos y edge APIs. El margen neto tras comisiones de afiliados se distribuye íntegramente entre los socios.")}
						</p>
					</div>
					<button
						type="button"
						onClick={() => setSettingsModalOpen(true)}
						className="inline-flex items-center gap-1 rounded-md border bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted transition-colors cursor-pointer self-start sm:self-auto shrink-0"
					>
						<GearIcon size={13} />
						<span>{t("finance.configSplit", "Configurar % de Reparto")}</span>
					</button>
				</div>

				<div className="mt-3">
					{/* Gasto Fijo Actual */}
					<div className="flex items-center justify-between rounded-lg border bg-background/50 p-3">
						<div className="space-y-0.5">
							<div className="flex items-center gap-1.5">
								<WrenchIcon size={16} className="text-emerald-500" />
								<span className="text-xs font-bold">{t("finance.infraFixedCostTitle", "Costos de infraestructura cloud")}</span>
							</div>
							<div className="text-xs text-muted-foreground">
								{t("finance.infraFixedCostDesc", "Optimizada con arquitectura serverless")}
							</div>
						</div>
						<div className="text-right">
							<span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
								{formatUsd(maintenanceMonthlyCostUsd)} / mes
							</span>
							<div className="text-[11px] font-medium text-muted-foreground">
								≈ {formatCrc(maintenanceMonthlyCostUsd * exchangeRate)}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Pestañas de Navegación (Mismo diseño exacto que Referidos y resto de plataforma) */}
			<div className="mt-6 flex border-b">
				<button
					type="button"
					onClick={() => setActiveTab("desglose")}
					className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
						activeTab === "desglose"
							? "border-primary text-foreground"
							: "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
					}`}
				>
					<TrendUpIcon size={18} />
					<span>{t("finance.tabs.ledger", "Desglose en tiempo real")}</span>
					<span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary font-bold">
						{conversions.length}
					</span>
				</button>
				<button
					type="button"
					onClick={() => setActiveTab("simulador")}
					className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
						activeTab === "simulador"
							? "border-primary text-foreground"
							: "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
					}`}
				>
					<CalculatorIcon size={18} />
					<span>{t("finance.tabs.simulator", "Simulador de cascada")}</span>
				</button>
				<button
					type="button"
					onClick={() => setActiveTab("infraestructura")}
					className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
						activeTab === "infraestructura"
							? "border-primary text-foreground"
							: "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
					}`}
				>
					<WrenchIcon size={18} />
					<span>{t("finance.tabs.infrastructure", "Infraestructura & costos")}</span>
					<span className="ml-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
						{maintenanceMonthlyCostUsd > 0 ? `${formatUsd(maintenanceMonthlyCostUsd)}/mes` : "Cloud"}
					</span>
				</button>
			</div>

			{/* Contenido de la pestaña activa */}
			<div className="mt-4">
				{/* 1. DESGLOSE EN TIEMPO REAL (TABLA DIRECTA AL ENTRAR) */}
				{activeTab === "desglose" && (
					<div className="rounded-xl border bg-card shadow-xs overflow-hidden">
						<div className="p-4 border-b flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<h3 className="text-sm font-bold text-foreground">{t("finance.ledgerTitle", "Desglose de Conversiones y Reparto en Tiempo Real")}</h3>
								<p className="text-xs text-muted-foreground">
									{t("finance.ledgerSubtitle", "Cada DJ registrado en GigBlade con su respectiva deducción de afiliado y reparto directo al socio y desarrollador.")}
								</p>
							</div>
							<div className="text-xs font-semibold text-muted-foreground">
								{conversions.length} {t("finance.registeredTransactions", "transacciones registradas")}
							</div>
						</div>

						{conversions.length === 0 ? (
							<div className="p-12 text-center text-muted-foreground">
								<CurrencyDollarIcon size={40} className="mx-auto mb-2 opacity-30" />
								<p className="text-sm font-medium">{t("finance.emptyLedger", "Aún no hay cobros registrados en la plataforma.")}</p>
								<p className="text-xs mt-1">
									{t("finance.emptyLedgerDesc", "Cuando los DJs completen el registro mediante enlaces de afiliados o directo, verás el reparto exacto aquí.")}
								</p>
							</div>
						) : (
							<div className="w-full overflow-x-auto">
								<table className="w-full text-left text-xs">
									<thead className="bg-muted/50 border-b text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
										<tr>
											<th className="py-3 px-4">{t("finance.th.client", "DJ / Cliente")}</th>
											<th className="py-3 px-3">{t("finance.th.chargeType", "Tipo de Cobro")}</th>
											<th className="py-3 px-3">{t("finance.th.grossCharge", "Cobro Bruto")}</th>
											<th className="py-3 px-3">{t("finance.th.affiliateCommission", "Afiliado & Comisión")}</th>
											<th className="py-3 px-3">{t("finance.th.maintenance", "Mantenimiento")}</th>
											<th className="py-3 px-3">{t("finance.founderShare", "Socio Fundador")} ({founderPercent}%)</th>
											<th className="py-3 px-3">{t("finance.developerShare", "Desarrollador")} ({devPercent}%)</th>
											<th className="py-3 px-4 text-right">{t("finance.th.date", "Fecha")}</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-border">
										{conversions.map((conv) => {
											const grossUsd = conv.amountUsd ?? (conv.amountCrc ? conv.amountCrc / exchangeRate : 100);
											const grossCrc = conv.amountCrc ?? Math.round(grossUsd * exchangeRate);

											const affiliateUsd = conv.commissionAmountUsd ?? (conv.commissionAmountCrc ? conv.commissionAmountCrc / exchangeRate : 0);
											const affiliateCrc = conv.commissionAmountCrc ?? Math.round(affiliateUsd * exchangeRate);

											const maintUsd = maintenanceMonthlyCostUsd > 0
												? Math.min(Math.max(0, grossUsd - affiliateUsd), maintenanceMonthlyCostUsd)
												: (grossUsd * maintenancePercent) / 100;
											const maintCrc = Math.round(maintUsd * exchangeRate);

											const netDistributableUsd = Math.max(0, grossUsd - affiliateUsd - maintUsd);
											const netDistributableCrc = Math.max(0, grossCrc - affiliateCrc - maintCrc);

											const teamTotalPercent = devPercent + founderPercent || 100;
											const devUsd = (netDistributableUsd * devPercent) / teamTotalPercent;
											const devCrc = Math.round((netDistributableCrc * devPercent) / teamTotalPercent);

											const founderUsd = netDistributableUsd - devUsd;
											const founderCrc = netDistributableCrc - devCrc;

											return (
												<tr key={conv.id} className="hover:bg-muted/20 transition-colors">
													<td className="py-3 px-4">
														<div className="font-semibold text-foreground">{conv.djName}</div>
														<div className="text-[11px] text-muted-foreground">{conv.djEmail}</div>
													</td>
													<td className="py-3 px-3">
														{conv.chargeType === "monthly" ? (
															<span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-950 dark:bg-sky-950/80 dark:text-sky-300">
																<CalendarCheckIcon size={12} /> {t("finance.monthly", "Mensualidad")}
															</span>
														) : (
															<span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-semibold text-purple-950 dark:bg-purple-950/80 dark:text-purple-300">
																<SparkleIcon size={12} /> {t("finance.setup", "Setup Inicial")}
															</span>
														)}
													</td>
													<td className="py-3 px-3 font-semibold text-foreground">
														<div>{formatUsd(grossUsd)}</div>
														<div className="text-[10px] text-muted-foreground">{formatCrc(grossCrc)}</div>
													</td>
													<td className="py-3 px-3">
														{affiliateUsd > 0 ? (
															<div>
																<div className="font-semibold text-purple-900 dark:text-purple-300">
																	-{formatUsd(affiliateUsd)} ({conv.commissionPercentage}%)
																</div>
																<div className="text-[10px] text-muted-foreground">
																	{conv.affiliateName} ({conv.affiliateCode})
																</div>
															</div>
														) : (
															<span className="text-muted-foreground text-[11px]">{t("finance.direct", "Directo ($0)")}</span>
														)}
													</td>
													<td className="py-3 px-3 font-medium text-foreground">
														{formatUsd(maintUsd)}
													</td>
													<td className="py-3 px-3 font-semibold text-amber-700 dark:text-amber-400">
														<div>{formatUsd(founderUsd)}</div>
														<div className="text-[10px] text-muted-foreground">{formatCrc(founderCrc)}</div>
													</td>
													<td className="py-3 px-3 font-semibold text-sky-700 dark:text-sky-400">
														<div>{formatUsd(devUsd)}</div>
														<div className="text-[10px] text-muted-foreground">{formatCrc(devCrc)}</div>
													</td>
													<td className="py-3 px-4 text-right text-muted-foreground text-[11px]">
														{formatDate(conv.createdAt, language)}
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						)}
					</div>
				)}

				{/* 2. SIMULADOR DE CASCADA DE INGRESOS */}
				{activeTab === "simulador" && (
					<div className="rounded-xl border bg-card p-5 shadow-xs">
						<div className="flex flex-col gap-1 border-b pb-4">
							<div className="flex items-center gap-2">
								<CalculatorIcon size={20} className="text-primary" weight="duotone" />
								<h3 className="text-base font-bold text-foreground">{t("finance.simulatorTitle", "Simulador de Cascada de Ingresos")}</h3>
							</div>
							<p className="text-xs text-muted-foreground">
								{t("finance.simulatorSubtitle", "Visualiza con precisión cuánto dinero ingresa y cómo se reparte cada dólar y colón en cada venta de GigBlade.")}
							</p>

							{/* Barra unificada de controles del simulador */}
							<div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-2.5">
								<span className="text-xs font-semibold text-muted-foreground">
									{t("finance.simulateScenario", "Escenario a simular:")}
								</span>
								<div className="flex flex-wrap items-center gap-2">
									{/* Selector de Cobro */}
									<div className="inline-flex items-center rounded-lg border bg-background/90 p-0.5 shadow-2xs">
										<button
											type="button"
											onClick={() => setActiveSimChargeType("initial_setup")}
											className={`rounded-md px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
												activeSimChargeType === "initial_setup"
													? "bg-primary text-primary-foreground shadow-xs"
													: "text-muted-foreground hover:text-foreground"
											}`}
										>
											{t("finance.setupCharge", "Setup inicial")}{" "}
											({formatUsd(setupPriceUsd)})
										</button>
										<button
											type="button"
											onClick={() => setActiveSimChargeType("monthly")}
											className={`rounded-md px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
												activeSimChargeType === "monthly"
													? "bg-primary text-primary-foreground shadow-xs"
													: "text-muted-foreground hover:text-foreground"
											}`}
										>
											{t("finance.monthlyCharge", "Mensualidad")}{" "}
											({formatUsd(monthlyPriceUsd)})
										</button>
									</div>

									{/* Selector de Canal de Venta */}
									<div className="inline-flex items-center rounded-lg border bg-background/90 p-0.5 shadow-2xs">
										<button
											type="button"
											onClick={() => setActiveSimChannel("referral")}
											className={`rounded-md px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
												activeSimChannel === "referral"
													? "bg-primary text-primary-foreground shadow-xs"
													: "text-muted-foreground hover:text-foreground"
											}`}
										>
											{t("finance.withReferral", "Con Referido")}
										</button>
										<button
											type="button"
											onClick={() => setActiveSimChannel("direct")}
											className={`rounded-md px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
												activeSimChannel === "direct"
													? "bg-primary text-primary-foreground shadow-xs"
													: "text-muted-foreground hover:text-foreground"
											}`}
										>
											{t("finance.directDj", "DJ Directo (100% Margen)")}
										</button>
									</div>

									{/* Costo de Mantenimiento Dinámico del Simulador */}
									<div className="inline-flex items-center gap-1.5 rounded-lg border bg-background/90 px-2.5 py-1 shadow-2xs">
										<span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
											<WrenchIcon size={13} className="text-emerald-500" />
											{t("finance.maintenanceCost", "Mantenimiento")}:
										</span>
										<div className="relative flex items-center">
											<span className="text-xs text-muted-foreground font-semibold mr-1">$</span>
											<NumericInput
												mode="decimal"
												value={
													customSimMaintenanceRaw ??
													String(simCalculation.effectiveMaintenanceUsd)
												}
												onValueChange={(next) => setCustomSimMaintenanceRaw(next)}
												className="w-16 rounded border bg-background px-1.5 py-0.5 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
											/>
										</div>
										{customSimMaintenanceRaw !== null && (
											<button
												type="button"
												onClick={() => setCustomSimMaintenanceRaw(null)}
												title="Restablecer al valor guardado"
												className="text-[10px] text-muted-foreground hover:text-foreground underline cursor-pointer ml-0.5"
											>
												Reset
											</button>
										)}
									</div>
								</div>
							</div>
						</div>

						{/* Visualización de Cascada Paso a Paso */}
						<div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
							{/* Paso 1: Cobro Bruto */}
							<div className="rounded-lg border bg-muted/20 p-3.5 space-y-1">
								<div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
									<span>{t("finance.step1", "1. Cobro al DJ")}</span>
									<span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold">Bruto</span>
								</div>
								<div className="text-xl font-extrabold text-foreground">
									{formatUsd(simCalculation.grossUsd)}
								</div>
								<div className="text-xs text-muted-foreground">
									≈ {formatCrc(simCalculation.grossCrc)}
								</div>
								<p className="pt-1 text-[11px] text-muted-foreground leading-relaxed">
									{activeSimChargeType === "initial_setup"
										? t("finance.step1SetupDesc", "Creación de la web y configuración personalizada.")
										: t("finance.step1MonthlyDesc", "Mantenimiento mensual del perfil y hosting de GigBlade.")}
								</p>
							</div>

							{/* Paso 2: Deducción Afiliado */}
							<div className={`rounded-lg border p-3.5 space-y-1 ${
								simCalculation.affiliateUsd > 0
									? "border-purple-500/25 bg-purple-500/[0.03]"
									: "bg-muted/10 opacity-70"
							}`}>
								<div className="flex items-center justify-between text-xs font-semibold text-purple-600 dark:text-purple-400">
									<span>{t("finance.step2", "2. Comisión Referido")}</span>
									<span className="rounded bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-bold">
										-{simCalculation.affiliatePercent}%
									</span>
								</div>
								<div className="text-xl font-extrabold text-purple-600 dark:text-purple-400">
									{simCalculation.affiliateUsd > 0 ? `-${formatUsd(simCalculation.affiliateUsd)}` : "$0.00"}
								</div>
								<div className="text-xs text-muted-foreground">
									≈ -{formatCrc(simCalculation.affiliateCrc)}
								</div>
								<p className="pt-1 text-[11px] text-muted-foreground leading-relaxed">
									{simCalculation.affiliateUsd > 0
										? t("finance.step2AffiliateDesc", "Pagado al afiliado vía SINPE Móvil o IBAN.")
										: t("finance.step2DirectDesc", "Venta directa sin intermediario: $0 de comisión.")}
								</p>
							</div>

							{/* Paso 3: Mantenimiento / Servidores */}
							<div className={`rounded-lg border p-3.5 space-y-1 ${
								simCalculation.maintUsd > 0
									? "border-emerald-500/25 bg-emerald-500/[0.03]"
									: "bg-muted/10 opacity-70"
							}`}>
								<div className="flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
									<span>{t("finance.step3", "3. Mantenimiento")}</span>
									<span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold">
										{simCalculation.maintUsd > 0 ? `-${formatUsd(simCalculation.maintUsd)}` : "$0.00"}
									</span>
								</div>
								<div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
									{simCalculation.maintUsd > 0 ? `-${formatUsd(simCalculation.maintUsd)}` : "$0.00"}
								</div>
								<div className="text-xs text-muted-foreground">
									≈ {simCalculation.maintUsd > 0 ? `-${formatCrc(simCalculation.maintCrc)}` : "₡0"}
								</div>
								<p className="pt-1 text-[11px] text-muted-foreground leading-relaxed">
									{simCalculation.maintUsd > 0
										? t("finance.step3CostDesc", "Deducido para gastos e infraestructura cloud antes del reparto.")
										: t("finance.step3Desc", "Infraestructura serverless optimizada sin deducciones fijas adicionales.")}
								</p>
							</div>

							{/* Paso 4: Margen Neto Distribuible */}
							<div className="rounded-lg border border-primary/25 bg-primary/[0.03] p-3.5 space-y-1">
								<div className="flex items-center justify-between text-xs font-semibold text-primary">
									<span>{t("finance.step4", "4. Margen Neto")}</span>
									<span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
										100% Reparto
									</span>
								</div>
								<div className="text-xl font-extrabold text-foreground">
									{formatUsd(simCalculation.netDistributableUsd)}
								</div>
								<div className="text-xs text-muted-foreground">
									≈ {formatCrc(simCalculation.netDistributableCrc)}
								</div>
								<p className="pt-1 text-[11px] text-muted-foreground leading-relaxed">
									{t("finance.step4Desc", "Total disponible para dividir entre los dos socios fundadores.")}
								</p>
							</div>
						</div>

						{/* División proporcional exacta entre socios */}
						<div className="mt-4 rounded-xl border bg-background/50 p-4 shadow-2xs space-y-3">
							<div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between text-xs">
								<span className="font-bold text-foreground flex items-center gap-1.5">
									<SparkleIcon size={14} className="text-primary" />
									{t("finance.partnerSplitTitle", "Reparto neto resultante entre socios")}
								</span>
								<span className="font-mono text-muted-foreground">
									{formatUsd(simCalculation.netDistributableUsd)} (≈ {formatCrc(simCalculation.netDistributableCrc)})
								</span>
							</div>

							{/* Barra proporcional visual */}
							<div className="h-2 w-full rounded-full bg-muted overflow-hidden flex shadow-inner">
								<div
									style={{ width: `${founderPercent}%` }}
									className="bg-amber-500 h-full transition-all duration-300"
									title={`${t("finance.founderShare", "Socio Fundador")}: ${founderPercent}%`}
								/>
								<div
									style={{ width: `${devPercent}%` }}
									className="bg-sky-500 h-full transition-all duration-300"
									title={`${t("finance.developerShare", "Desarrollador")}: ${devPercent}%`}
								/>
							</div>

							<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-1">
								{/* Socio Fundador */}
								<div className="flex items-center justify-between rounded-lg border bg-card p-3 shadow-xs border-amber-500/20 bg-amber-500/[0.02]">
									<div className="flex items-center gap-2.5">
										<div className="rounded-lg bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
											<CrownIcon size={20} weight="duotone" />
										</div>
										<div>
											<div className="text-xs font-bold text-foreground">
												{t("finance.founderShare", "Socio Fundador")} & {t("finance.owner", "Dueño")} ({founderPercent}%)
											</div>
											<div className="text-[11px] text-muted-foreground">
												{t("finance.perDjPaid", "Por cada DJ que pague este servicio")}
											</div>
										</div>
									</div>
									<div className="text-right">
										<div className="text-base font-extrabold text-amber-600 dark:text-amber-400">
											{formatUsd(simCalculation.founderUsd)}
										</div>
										<div className="text-[11px] font-medium text-muted-foreground">
											≈ {formatCrc(simCalculation.founderCrc)}
										</div>
									</div>
								</div>

								{/* Desarrollador */}
								<div className="flex items-center justify-between rounded-lg border bg-card p-3 shadow-xs border-sky-500/20 bg-sky-500/[0.02]">
									<div className="flex items-center gap-2.5">
										<div className="rounded-lg bg-sky-500/10 p-2 text-sky-600 dark:text-sky-400">
											<CodeIcon size={20} weight="duotone" />
										</div>
										<div>
											<div className="text-xs font-bold text-foreground">
												{t("finance.developerShare", "Desarrollador")} ({devPercent}%)
											</div>
											<div className="text-[11px] text-muted-foreground">
												{t("finance.perDjPaid", "Por cada DJ que pague este servicio")}
											</div>
										</div>
									</div>
									<div className="text-right">
										<div className="text-base font-extrabold text-sky-600 dark:text-sky-400">
											{formatUsd(simCalculation.devUsd)}
										</div>
										<div className="text-[11px] font-medium text-muted-foreground">
											≈ {formatCrc(simCalculation.devCrc)}
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* 3. INFRAESTRUCTURA & COSTOS DE SERVIDORES */}
				{activeTab === "infraestructura" && (
					<div className="space-y-4">
						<div className="rounded-xl border bg-card p-5 shadow-xs">
							<div className="flex flex-col gap-1 border-b pb-4">
								<div className="flex items-center gap-2">
									<WrenchIcon size={20} className="text-emerald-500" weight="duotone" />
									<h3 className="text-base font-bold text-foreground">
										{t("finance.infraServicesTitle", "Servicios cloud de alta disponibilidad")}
									</h3>
								</div>
								<p className="text-xs text-muted-foreground">
									{t("finance.infraServicesDesc", "GigBlade opera sobre infraestructura serverless moderna de escala mundial:")}
								</p>
							</div>

							<div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
								{/* Vercel */}
								<div className="rounded-lg border bg-background/50 p-3.5 space-y-1.5">
									<div className="flex items-center justify-between">
										<span className="text-xs font-bold text-foreground">Vercel</span>
										<span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
											Cloud Edge
										</span>
									</div>
									<div className="text-[11px] text-muted-foreground leading-relaxed">
										{t("finance.infraVercelDesc", "Alojamiento frontend y Edge APIs con red CDN global de baja latencia.")}
									</div>
									<div className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
										● Producción Activa
									</div>
								</div>

								{/* Supabase */}
								<div className="rounded-lg border bg-background/50 p-3.5 space-y-1.5">
									<div className="flex items-center justify-between">
										<span className="text-xs font-bold text-foreground">Supabase</span>
										<span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
											PostgreSQL
										</span>
									</div>
									<div className="text-[11px] text-muted-foreground leading-relaxed">
										{t("finance.infraSupabaseDesc", "Base de datos PostgreSQL administrada, autenticación y almacenamiento seguro de archivos.")}
									</div>
									<div className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
										● Producción Activa
									</div>
								</div>

								{/* Cloudflare */}
								<div className="rounded-lg border bg-background/50 p-3.5 space-y-1.5">
									<div className="flex items-center justify-between">
										<span className="text-xs font-bold text-foreground">Cloudflare</span>
										<span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
											DDoS & DNS
										</span>
									</div>
									<div className="text-[11px] text-muted-foreground leading-relaxed">
										{t("finance.infraCloudflareDesc", "Seguridad perimetral, gestión de DNS acelerado y mitigación continua de ataques DDoS.")}
									</div>
									<div className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
										● Producción Activa
									</div>
								</div>
							</div>
						</div>

						{/* Escalamiento & Políticas */}
						<div className="rounded-xl border bg-card p-5 shadow-xs">
							<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
								<div className="space-y-1">
									<div className="flex items-center gap-2">
										<SparkleIcon size={18} className="text-primary" />
										<h4 className="text-sm font-bold text-foreground">
											{t("finance.infraScaleTitle", "Presupuesto y reserva para servidores")}
										</h4>
									</div>
									<p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
										{t("finance.infraScaleDesc", "Podés configurar un presupuesto o costo fijo mensual de servidores en las reglas de reparto, el cual se deducirá automáticamente del cobro antes de distribuir el margen neto entre los socios.")}
									</p>
								</div>
								<button
									type="button"
									onClick={() => setSettingsModalOpen(true)}
									className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted transition-all cursor-pointer self-start sm:self-auto shrink-0 shadow-xs"
								>
									<GearIcon size={14} />
									<span>{t("finance.configSplit", "Configurar % de Reparto")}</span>
								</button>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* MODAL PARA MODIFICAR % DE REPARTO Y MANTENIMIENTO */}
			<FinanceSettingsModal
				open={settingsModalOpen}
				onClose={() => setSettingsModalOpen(false)}
				currentSettings={settings}
				onSaved={() => {
					setSettingsModalOpen(false);
					setCustomSimMaintenanceRaw(null);
					void query.refetch();
					void queryClient.invalidateQueries({
						queryKey: PLATFORM_REFERRALS_QUERY_KEY,
					});
				}}
			/>
		</PageContainer>
	);
}

function FinanceSettingsModal({
	open,
	onClose,
	currentSettings,
	onSaved,
}: {
	open: boolean;
	onClose: () => void;
	currentSettings: PlatformReferralSettings;
	onSaved: () => void;
}) {
	const { t } = useLanguage();
	const [devPercentRaw, setDevPercentRaw] = useState(
		String(currentSettings.developerPercent ?? 50),
	);
	const [founderPercentRaw, setFounderPercentRaw] = useState(
		String(currentSettings.founderPercent ?? 50),
	);
	const [maintenanceMonthlyCostUsdRaw, setMaintenanceMonthlyCostUsdRaw] = useState(
		String(currentSettings.maintenanceMonthlyCostUsd ?? 0),
	);
	const [maintenancePercent, setMaintenancePercent] = useState<number>(
		currentSettings.maintenancePercent ?? 0,
	);
	const [exchangeRateCrcRaw, setExchangeRateCrcRaw] = useState(
		String(currentSettings.exchangeRateCrc ?? 515),
	);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (open) {
			setDevPercentRaw(String(currentSettings.developerPercent ?? 50));
			setFounderPercentRaw(String(currentSettings.founderPercent ?? 50));
			setMaintenanceMonthlyCostUsdRaw(
				String(currentSettings.maintenanceMonthlyCostUsd ?? 0),
			);
			setMaintenancePercent(currentSettings.maintenancePercent ?? 0);
			setExchangeRateCrcRaw(String(currentSettings.exchangeRateCrc ?? 515));
		}
	}, [open, currentSettings]);

	const devPercent = parseNumericField(devPercentRaw, 0);
	const founderPercent = parseNumericField(founderPercentRaw, 0);
	const maintenanceMonthlyCostUsd = parseNumericField(
		maintenanceMonthlyCostUsdRaw,
		0,
	);
	const exchangeRateCrc = parseNumericField(exchangeRateCrcRaw, 0);

	const totalPartnerPercent = devPercent + founderPercent;
	const isValidSum = totalPartnerPercent === 100;

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!isValidSum) {
			toast.error(`La suma de los porcentajes del desarrollador y socio fundador debe ser 100% (actualmente ${totalPartnerPercent}%).`);
			return;
		}

		try {
			setSaving(true);
			await updatePlatformReferralSettings({
				developerPercent: devPercent,
				founderPercent: founderPercent,
				maintenanceMonthlyCostUsd,
				maintenancePercent: Number(maintenancePercent),
				exchangeRateCrc,
			});
			toast.success("Reglas de reparto financiero actualizadas con éxito.");
			onSaved();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error al guardar configuración.");
		} finally {
			setSaving(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={(val) => !val && onClose()}>
			<DialogContent className="max-w-lg gap-4">
				<DialogHeader className="space-y-1.5 text-left">
					<DialogTitle>{t("finance.modalTitle", "Configurar Reparto Financiero")}</DialogTitle>
					<DialogDescription className="text-xs leading-relaxed">
						{t("finance.modalDesc", "Define cómo se divide el margen neto de GigBlade entre el desarrollador y el socio fundador, así como la reserva de mantenimiento.")}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="flex flex-col gap-4">
					<div className="grid grid-cols-2 gap-x-3 gap-y-1">
						<div className="flex min-h-[2.75rem] flex-col justify-end">
							<label className="flex items-center gap-1 text-xs font-semibold leading-tight text-foreground">
								<CodeIcon size={14} className="shrink-0 text-sky-500" aria-hidden />
								<span>{t("finance.developerShare", "Desarrollador")}</span>
							</label>
						</div>
						<div className="flex min-h-[2.75rem] flex-col justify-end">
							<label className="flex items-center gap-1 text-xs font-semibold leading-tight text-foreground">
								<CrownIcon size={14} className="shrink-0 text-amber-500" aria-hidden />
								<span>{t("finance.founderShare", "Socio fundador")}</span>
							</label>
						</div>

						<FieldNumericInput
							mode="int"
							required
							suffix="%"
							value={devPercentRaw}
							onValueChange={(next) => {
								setDevPercentRaw(next);
								const val = parseNumericField(next, Number.NaN);
								if (Number.isFinite(val) && val >= 0 && val <= 100) {
									setFounderPercentRaw(String(Math.round(100 - val)));
								}
							}}
						/>
						<FieldNumericInput
							mode="int"
							required
							suffix="%"
							value={founderPercentRaw}
							onValueChange={(next) => {
								setFounderPercentRaw(next);
								const val = parseNumericField(next, Number.NaN);
								if (Number.isFinite(val) && val >= 0 && val <= 100) {
									setDevPercentRaw(String(Math.round(100 - val)));
								}
							}}
						/>
					</div>

					<div
						className={`text-xs px-2.5 py-1.5 rounded-md ${
							isValidSum
								? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
								: "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300"
						}`}
					>
						{t("finance.totalPartners", "Suma total socios")}:{" "}
						<strong>{totalPartnerPercent}%</strong>{" "}
						{isValidSum ? "✓ (Equilibrado)" : "⚠️ Debe sumar exactamente 100%"}
					</div>

					<div className="grid grid-cols-2 gap-x-3 gap-y-1">
						<div className="flex min-h-[2.75rem] flex-col justify-end">
							<label className="flex items-center gap-1 text-xs font-semibold leading-tight text-foreground">
								<WrenchIcon size={14} className="shrink-0 text-muted-foreground" aria-hidden />
								<span>{t("finance.fixedMaintenance", "Infra mensual")}</span>
							</label>
						</div>
						<div className="flex min-h-[2.75rem] flex-col justify-end">
							<label className="flex items-center gap-1 text-xs font-semibold leading-tight text-foreground">
								<ArrowsLeftRightIcon
									size={14}
									className="shrink-0 text-muted-foreground"
									aria-hidden
								/>
								<span>{t("finance.exchangeRate", "Tipo de cambio")}</span>
							</label>
						</div>

						<FieldNumericInput
							mode="decimal"
							prefix="$"
							wrapperClassName="w-full"
							value={maintenanceMonthlyCostUsdRaw}
							onValueChange={setMaintenanceMonthlyCostUsdRaw}
						/>
						<div className="flex w-full min-w-0 items-center gap-1.5">
							<FieldNumericInput
								mode="int"
								prefix="₡"
								wrapperClassName="min-w-0 flex-1"
								value={exchangeRateCrcRaw}
								onValueChange={setExchangeRateCrcRaw}
							/>
							<span className="shrink-0 whitespace-nowrap text-[11px] leading-none text-muted-foreground">
								/ USD
							</span>
						</div>
					</div>

					<p className="text-[11px] leading-snug text-muted-foreground">
						{t(
							"finance.fixedMaintenanceHelp",
							"Monto mensual deducible para infraestructura antes del reparto entre socios.",
						)}{" "}
						{t("finance.exchangeRateHelp", "Tipo de cambio: colones por cada $1 USD.")}
					</p>

					<DialogFooter className="gap-2 sm:justify-end">
						<Button type="button" variant="outline" onClick={onClose} disabled={saving}>
							{t("action.cancel", "Cancelar")}
						</Button>
						<Button type="submit" disabled={saving || !isValidSum}>
							{saving ? "Guardando..." : t("finance.saveDistribution", "Guardar Distribución")}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
