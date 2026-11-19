"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
	Calculator,
	CheckCircle2,
	Code2,
	Crown,
	DollarSign,
	RefreshCw,
	Server,
	Settings,
	Share2,
	Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/panel/auth-client";
import { useLanguage } from "@/panel/LanguageProvider";
import {
	fetchPlatformReferrals,
	updatePlatformReferralSettings,
	type PlatformReferralSettings,
} from "@/panel/site-api";
import { PLATFORM_REFERRALS_QUERY_KEY } from "@/panel/platform-referrals-query";
import {
	FieldNumericInput,
	NumericInput,
	parseNumericField,
} from "@/panel/numeric-input";
import {
	EmptyState,
	MetricCard,
	PageContainer,
	PageHeader,
	PanelButton,
	PanelModal,
	SegmentedControl,
	StatusBadge,
} from "@/panel/ui";

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
	const [activeTab, setActiveTab] = useState<
		"desglose" | "simulador" | "infraestructura"
	>("desglose");
	const [activeSimChargeType, setActiveSimChargeType] = useState<
		"initial_setup" | "monthly"
	>("initial_setup");
	const [activeSimChannel, setActiveSimChannel] = useState<
		"referral" | "direct"
	>("referral");
	const [customSimMaintenanceRaw, setCustomSimMaintenanceRaw] = useState<
		string | null
	>(null);

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

	const { conversions, settings } = query.data ?? {
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
			const grossUsd =
				conv.amountUsd ?? (conv.amountCrc ? conv.amountCrc / exchangeRate : 100);
			const grossCrc = conv.amountCrc ?? Math.round(grossUsd * exchangeRate);
			const affiliateUsd =
				conv.commissionAmountUsd ??
				(conv.commissionAmountCrc ? conv.commissionAmountCrc / exchangeRate : 0);
			const affiliateCrc =
				conv.commissionAmountCrc ?? Math.round(affiliateUsd * exchangeRate);

			const maintUsd =
				maintenanceMonthlyCostUsd > 0
					? Math.min(Math.max(0, grossUsd - affiliateUsd), maintenanceMonthlyCostUsd)
					: (grossUsd * maintenancePercent) / 100;
			const maintCrc = Math.round(maintUsd * exchangeRate);

			const netDistributableUsd = Math.max(0, grossUsd - affiliateUsd - maintUsd);
			const netDistributableCrc = Math.max(0, grossCrc - affiliateCrc - maintCrc);

			const devUsd = (netDistributableUsd * devPercent) / teamTotalPercent;
			const devCrc = Math.round(
				(netDistributableCrc * devPercent) / teamTotalPercent,
			);
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
	}, [
		conversions,
		exchangeRate,
		devPercent,
		founderPercent,
		maintenanceMonthlyCostUsd,
		maintenancePercent,
	]);

	const simCalculation = useMemo(() => {
		const isMonthly = activeSimChargeType === "monthly";
		const grossUsd = isMonthly
			? settings.monthlyPriceUsd || 30
			: settings.initialSetupPriceUsd || 100;
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

		const effectiveMaintenanceUsd =
			customSimMaintenanceRaw !== null
				? parseNumericField(customSimMaintenanceRaw, 0)
				: maintenanceMonthlyCostUsd;
		const maintUsd =
			effectiveMaintenanceUsd > 0
				? Math.min(Math.max(0, grossUsd - affiliateUsd), effectiveMaintenanceUsd)
				: (grossUsd * maintenancePercent) / 100;
		const maintCrc = Math.round(maintUsd * exchangeRate);

		const netDistributableUsd = Math.max(0, grossUsd - affiliateUsd - maintUsd);
		const netDistributableCrc = Math.max(0, grossCrc - affiliateCrc - maintCrc);
		const teamTotalPercent = devPercent + founderPercent || 100;
		const devUsd = (netDistributableUsd * devPercent) / teamTotalPercent;
		const devCrc = Math.round(
			(netDistributableCrc * devPercent) / teamTotalPercent,
		);
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
	}, [
		activeSimChargeType,
		activeSimChannel,
		settings,
		exchangeRate,
		devPercent,
		founderPercent,
		maintenanceMonthlyCostUsd,
		maintenancePercent,
		customSimMaintenanceRaw,
	]);

	return (
		<PageContainer wide>
			<PageHeader
				title={t("finance.title", "Finanzas y reparto")}
				subtitle="Distribución en tiempo real de ingresos, comisiones de afiliados, infraestructura y reparto entre socios"
			>
				<Link
					href="/referidos"
					className="inline-flex h-9 items-center gap-1.5 px-3.5 border border-grayscale-4 bg-grayscale-1 hover:bg-grayscale-2 text-grayscale-11 hover:text-grayscale-12 dark:bg-grayscale-2 dark:hover:bg-grayscale-3 text-[12.5px] font-medium rounded-md shadow-[0_1px_2px_rgba(28,22,16,0.04)] transition-colors"
				>
					<Share2 size={13} />
					<span>Afiliados</span>
				</Link>
				<PanelButton
					variant="secondary"
					onClick={() => void query.refetch()}
					disabled={query.isFetching}
				>
					<RefreshCw
						size={13}
						className={query.isFetching ? "animate-spin" : ""}
					/>
					<span>Actualizar</span>
				</PanelButton>
				<PanelButton
					variant="primary"
					onClick={() => setSettingsModalOpen(true)}
				>
					<Settings size={13} />
					<span>Configurar reparto</span>
				</PanelButton>
			</PageHeader>

			{/* 4 Metric Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<MetricCard
					label="Facturado bruto"
					value={formatUsd(financeTotals.totalGrossBilledUsd)}
					valueClassName="text-2xl sm:text-3xl"
					footer={
						<span>
							≈ {formatCrc(financeTotals.totalGrossBilledCrc)} •{" "}
							{conversions.length} cobros
						</span>
					}
				/>
				<MetricCard
					label="Comisiones afiliados"
					value={formatUsd(financeTotals.totalAffiliateCommissionsUsd)}
					valueClassName="text-2xl sm:text-3xl text-purple-600"
					footer={
						<>
							<span className="inline-block w-2 h-2 rounded-full bg-purple-500" />
							<span>≈ {formatCrc(financeTotals.totalAffiliateCommissionsCrc)}</span>
						</>
					}
				/>
				<MetricCard
					label={`Socio fundador (${founderPercent}%)`}
					value={formatUsd(financeTotals.totalFounderUsd)}
					valueClassName="text-2xl sm:text-3xl text-amber-600"
					footer={
						<>
							<span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
							<span>≈ {formatCrc(financeTotals.totalFounderCrc)}</span>
						</>
					}
				/>
				<MetricCard
					label={`Desarrollador (${devPercent}%)`}
					value={formatUsd(financeTotals.totalDeveloperUsd)}
					valueClassName="text-2xl sm:text-3xl text-sky-600"
					footer={
						<>
							<span className="inline-block w-2 h-2 rounded-full bg-sky-500" />
							<span>≈ {formatCrc(financeTotals.totalDeveloperCrc)}</span>
						</>
					}
				/>
			</div>

			{/* Infrastructure banner */}
			<div className="card p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div className="space-y-1">
					<div className="flex flex-wrap items-center gap-2">
						<span className="text-sm font-semibold text-grayscale-12">
							Infraestructura cloud y tipo de cambio
						</span>
						<StatusBadge tone="emerald">ACTIVA</StatusBadge>
						<span className="text-[11px] font-mono font-semibold text-grayscale-10 px-2 py-0.5 bg-grayscale-2 rounded-md">
							T.C. ₡{exchangeRate} / $1 USD
						</span>
					</div>
					<p className="text-xs text-grayscale-9">
						Reserva mensual de infraestructura configurada:{" "}
						<strong className="text-grayscale-12">
							{formatUsd(maintenanceMonthlyCostUsd)} / mes
						</strong>{" "}
						(≈ {formatCrc(maintenanceMonthlyCostUsd * exchangeRate)})
					</p>
				</div>
				<PanelButton
					variant="secondary"
					size="sm"
					onClick={() => setSettingsModalOpen(true)}
				>
					<Settings size={13} />
					<span>Ajustar reglas</span>
				</PanelButton>
			</div>

			{/* Segmented Control Tabs */}
			<SegmentedControl
				value={activeTab}
				onChange={setActiveTab}
				options={[
					{ value: "desglose", label: "Desglose en tiempo real", count: conversions.length },
					{ value: "simulador", label: "Simulador de cascada" },
					{ value: "infraestructura", label: "Infraestructura y costos" },
				]}
			/>

			{/* TAB 1: DESGLOSE */}
			{activeTab === "desglose" ? (
				conversions.length === 0 ? (
					<EmptyState
						icon={<DollarSign size={22} />}
						title="Aún no hay cobros registrados"
						description="Cuando los DJs completen el registro mediante enlaces de afiliados o directo, verás el reparto exacto aquí."
					/>
				) : (
					<div className="card overflow-hidden">
						<div className="p-6 border-b border-grayscale-3/70 dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-2">
							<div>
								<h2 className="text-sm font-semibold text-grayscale-12">
									Conversiones y reparto acumulado
								</h2>
								<p className="text-xs text-grayscale-9 mt-0.5">
									Cada cobro con deducción de afiliado y distribución entre socios
								</p>
							</div>
							<span className="text-xs font-medium text-grayscale-8">
								{conversions.length} transacciones
							</span>
						</div>
						<div className="overflow-x-auto">
							<table className="w-full text-left text-xs">
								<thead className="bg-grayscale-2/70 border-b border-grayscale-3/70 dark:border-white/[0.08] text-[11px] uppercase tracking-wider text-grayscale-8 font-semibold">
									<tr>
										<th className="py-3.5 px-5">DJ / Cliente</th>
										<th className="py-3.5 px-3">Tipo</th>
										<th className="py-3.5 px-3">Bruto</th>
										<th className="py-3.5 px-3">Afiliado</th>
										<th className="py-3.5 px-3">Infra</th>
										<th className="py-3.5 px-3">Fundador ({founderPercent}%)</th>
										<th className="py-3.5 px-3">Dev ({devPercent}%)</th>
										<th className="py-3.5 px-5 text-right">Fecha</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-grayscale-3/70 dark:divide-white/[0.07]">
									{conversions.map((conv) => {
										const grossUsd =
											conv.amountUsd ??
											(conv.amountCrc ? conv.amountCrc / exchangeRate : 100);
										const grossCrc =
											conv.amountCrc ?? Math.round(grossUsd * exchangeRate);
										const affiliateUsd =
											conv.commissionAmountUsd ??
											(conv.commissionAmountCrc
												? conv.commissionAmountCrc / exchangeRate
												: 0);
										const maintUsd =
											maintenanceMonthlyCostUsd > 0
												? Math.min(
														Math.max(0, grossUsd - affiliateUsd),
														maintenanceMonthlyCostUsd,
													)
												: (grossUsd * maintenancePercent) / 100;
										const netUsd = Math.max(0, grossUsd - affiliateUsd - maintUsd);
										const teamTotal = devPercent + founderPercent || 100;
										const devUsd = (netUsd * devPercent) / teamTotal;
										const founderUsd = netUsd - devUsd;

										return (
											<tr
												key={conv.id}
												className="hover:bg-grayscale-2/50 transition-colors"
											>
												<td className="py-3.5 px-5">
													<div className="font-semibold text-grayscale-12">
														{conv.djName}
													</div>
													<div className="text-[11px] text-grayscale-9">
														{conv.djEmail}
													</div>
												</td>
												<td className="py-3.5 px-3">
													<StatusBadge
														tone={
															conv.chargeType === "monthly" ? "sky" : "purple"
														}
														dot={false}
													>
														{conv.chargeType === "monthly"
															? "MENSUALIDAD"
															: "SETUP INICIAL"}
													</StatusBadge>
												</td>
												<td className="py-3.5 px-3 font-semibold text-grayscale-12 tabular-nums">
													<div>{formatUsd(grossUsd)}</div>
													<div className="text-[10px] text-grayscale-8">
														{formatCrc(grossCrc)}
													</div>
												</td>
												<td className="py-3.5 px-3 tabular-nums">
													{affiliateUsd > 0 ? (
														<div>
															<div className="font-semibold text-purple-11">
																-{formatUsd(affiliateUsd)} ({conv.commissionPercentage}%)
															</div>
															<div className="text-[10px] text-grayscale-8">
																{conv.affiliateName} ({conv.affiliateCode})
															</div>
														</div>
													) : (
														<span className="text-grayscale-8">Directo ($0)</span>
													)}
												</td>
												<td className="py-3.5 px-3 font-medium text-grayscale-11 tabular-nums">
													{formatUsd(maintUsd)}
												</td>
												<td className="py-3.5 px-3 font-semibold text-amber-700 tabular-nums">
													{formatUsd(founderUsd)}
												</td>
												<td className="py-3.5 px-3 font-semibold text-sky-700 tabular-nums">
													{formatUsd(devUsd)}
												</td>
												<td className="py-3.5 px-5 text-right text-grayscale-8 font-mono text-[11px]">
													{formatDate(conv.createdAt, language)}
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					</div>
				)
			) : null}

			{/* TAB 2: SIMULADOR */}
			{activeTab === "simulador" ? (
				<div className="card p-7 shadow-xs space-y-6">
					<div className="flex flex-col gap-4 pb-5 border-b border-grayscale-3/70 dark:border-white/[0.08]">
						<div>
							<h2 className="text-sm font-semibold text-grayscale-12 flex items-center gap-2">
								<Calculator size={15} className="text-grayscale-9" />
								<span>Simulador de cascada de ingresos</span>
							</h2>
							<p className="text-xs text-grayscale-9 mt-1">
								Visualizá cómo se distribuye cada dólar y colón en cada cobro.
							</p>
						</div>

						<div className="flex flex-wrap items-center gap-3">
							<SegmentedControl
								value={activeSimChargeType}
								onChange={setActiveSimChargeType}
								options={[
									{
										value: "initial_setup",
										label: `Setup inicial (${formatUsd(setupPriceUsd)})`,
									},
									{
										value: "monthly",
										label: `Mensualidad (${formatUsd(monthlyPriceUsd)})`,
									},
								]}
							/>
							<SegmentedControl
								value={activeSimChannel}
								onChange={setActiveSimChannel}
								options={[
									{ value: "referral", label: "Con referido" },
									{ value: "direct", label: "DJ directo (100%)" },
								]}
							/>
							<div className="inline-flex items-center gap-2 px-3 py-1.5 bg-grayscale-2 border border-grayscale-4 rounded-xl text-xs">
								<Wrench size={12} className="text-emerald-600" />
								<span className="text-grayscale-10 font-medium">Infra $:</span>
								<NumericInput
									mode="decimal"
									value={
										customSimMaintenanceRaw ??
										String(simCalculation.effectiveMaintenanceUsd)
									}
									onValueChange={setCustomSimMaintenanceRaw}
									className="w-16 px-2 py-0.5 text-xs font-semibold bg-grayscale-1 border border-grayscale-4 dark:bg-[#1b1b1a] dark:border-white/[0.1] rounded-lg"
								/>
								{customSimMaintenanceRaw !== null ? (
									<button
										type="button"
										onClick={() => setCustomSimMaintenanceRaw(null)}
										className="text-[11px] text-grayscale-9 hover:text-grayscale-12 underline cursor-pointer"
									>
										Reset
									</button>
								) : null}
							</div>
						</div>
					</div>

					{/* 4 Steps */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
						<div className="p-4 surface-soft space-y-1">
							<span className="text-[11px] font-semibold text-grayscale-8 uppercase tracking-wider">
								1. Cobro al DJ
							</span>
							<p className="text-2xl font-bold text-grayscale-12 tabular-nums">
								{formatUsd(simCalculation.grossUsd)}
							</p>
							<p className="text-[11px] text-grayscale-9">
								≈ {formatCrc(simCalculation.grossCrc)}
							</p>
						</div>

						<div className="p-4 bg-purple-3/50 border border-purple-6/50 rounded-xl space-y-1">
							<span className="text-[11px] font-semibold text-purple-11 uppercase tracking-wider">
								2. Referido (-{simCalculation.affiliatePercent}%)
							</span>
							<p className="text-2xl font-bold text-purple-11 tabular-nums">
								{simCalculation.affiliateUsd > 0
									? `-${formatUsd(simCalculation.affiliateUsd)}`
									: "$0.00"}
							</p>
							<p className="text-[11px] text-purple-900/70">
								≈ -{formatCrc(simCalculation.affiliateCrc)}
							</p>
						</div>

						<div className="p-4 bg-green-3/50 border border-green-6/50 rounded-xl space-y-1">
							<span className="text-[11px] font-semibold text-green-11 uppercase tracking-wider">
								3. Infraestructura
							</span>
							<p className="text-2xl font-bold text-green-11 tabular-nums">
								{simCalculation.maintUsd > 0
									? `-${formatUsd(simCalculation.maintUsd)}`
									: "$0.00"}
							</p>
							<p className="text-[11px] text-emerald-900/70">
								≈ -{formatCrc(simCalculation.maintCrc)}
							</p>
						</div>

						<div className="p-4 bg-grayscale-12 text-grayscale-1 rounded-xl space-y-1">
							<span className="text-[11px] font-semibold text-grayscale-1/70 uppercase tracking-wider">
								4. Margen neto
							</span>
							<p className="text-2xl font-bold tabular-nums">
								{formatUsd(simCalculation.netDistributableUsd)}
							</p>
							<p className="text-[11px] text-grayscale-1/75">
								≈ {formatCrc(simCalculation.netDistributableCrc)}
							</p>
						</div>
					</div>

					{/* Partner split bar */}
					<div className="p-5 surface-soft space-y-4">
						<div className="flex items-center justify-between text-xs">
							<span className="font-semibold text-grayscale-12">
								Reparto neto resultante entre socios
							</span>
							<span className="font-mono text-grayscale-9">
								{formatUsd(simCalculation.netDistributableUsd)}
							</span>
						</div>

						<div className="h-4 w-full bg-grayscale-3 rounded-full overflow-hidden flex p-0.5 gap-1">
							<div
								style={{ width: `${founderPercent}%` }}
								className="bg-amber-400 rounded-full transition-all"
							/>
							<div
								style={{ width: `${devPercent}%` }}
								className="bg-sky-400 rounded-full transition-all"
							/>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<div className="p-3.5 bg-amber-3/50 border border-amber-6/50 rounded-xl flex items-center justify-between">
								<div className="flex items-center gap-2 text-xs font-semibold text-amber-12">
									<Crown size={14} className="text-amber-600" />
									<span>Socio fundador ({founderPercent}%)</span>
								</div>
								<div className="text-right tabular-nums">
									<div className="text-sm font-bold text-amber-12">
										{formatUsd(simCalculation.founderUsd)}
									</div>
									<div className="text-[10px] text-amber-11">
										≈ {formatCrc(simCalculation.founderCrc)}
									</div>
								</div>
							</div>

							<div className="p-3.5 bg-blue-3/50 border border-blue-6/50 rounded-xl flex items-center justify-between">
								<div className="flex items-center gap-2 text-xs font-semibold text-blue-12">
									<Code2 size={14} className="text-sky-600" />
									<span>Desarrollador ({devPercent}%)</span>
								</div>
								<div className="text-right tabular-nums">
									<div className="text-sm font-bold text-blue-12">
										{formatUsd(simCalculation.devUsd)}
									</div>
									<div className="text-[10px] text-blue-11">
										≈ {formatCrc(simCalculation.devCrc)}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			) : null}

			{/* TAB 3: INFRAESTRUCTURA */}
			{activeTab === "infraestructura" ? (
				<div className="card p-7 shadow-xs space-y-5">
					<div>
						<h2 className="text-sm font-semibold text-grayscale-12 flex items-center gap-2">
							<Server size={15} className="text-emerald-600" />
							<span>Servicios cloud de alta disponibilidad</span>
						</h2>
						<p className="text-xs text-grayscale-9 mt-1">
							Arquitectura serverless unificada sobre Next.js, Supabase y Cloudflare.
						</p>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
						{[
							{
								name: "Vercel",
								tag: "Next.js & Edge",
								desc: "Despliegue unificado para landing, panel y todos los sitios DJ multitenant.",
							},
							{
								name: "Supabase",
								tag: "PostgreSQL",
								desc: "Base de datos relacional con RLS, autenticación y almacenamiento de fotos.",
							},
							{
								name: "Cloudflare",
								tag: "DNS & WAF",
								desc: "Seguridad perimetral, Turnstile, analítica de visitas y gestión de DNS.",
							},
						].map((svc) => (
							<div
								key={svc.name}
								className="p-4 surface-soft space-y-2"
							>
								<div className="flex items-center justify-between">
									<span className="text-xs font-semibold text-grayscale-12">
										{svc.name}
									</span>
									<StatusBadge tone="emerald" dot={false}>
										{svc.tag}
									</StatusBadge>
								</div>
								<p className="text-xs text-grayscale-10 leading-relaxed">
									{svc.desc}
								</p>
								<div className="flex items-center gap-1.5 text-[11px] font-medium text-green-11 pt-1">
									<CheckCircle2 size={12} />
									<span>Producción activa</span>
								</div>
							</div>
						))}
					</div>
				</div>
			) : null}

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

function FinanceSettingsModal(props: {
	open: boolean;
	onClose: () => void;
	currentSettings: PlatformReferralSettings;
	onSaved: () => void;
}) {
	if (!props.open) return null;
	return <FinanceSettingsModalInner {...props} />;
}

function FinanceSettingsModalInner({
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
	const [devPercentRaw, setDevPercentRaw] = useState(
		String(currentSettings.developerPercent ?? 50),
	);
	const [founderPercentRaw, setFounderPercentRaw] = useState(
		String(currentSettings.founderPercent ?? 50),
	);
	const [maintenanceMonthlyCostUsdRaw, setMaintenanceMonthlyCostUsdRaw] =
		useState(String(currentSettings.maintenanceMonthlyCostUsd ?? 0));
	const [exchangeRateCrcRaw, setExchangeRateCrcRaw] = useState(
		String(currentSettings.exchangeRateCrc ?? 515),
	);
	const [saving, setSaving] = useState(false);

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
			toast.error(
				`La suma de socios debe ser 100% (actualmente ${totalPartnerPercent}%).`,
			);
			return;
		}
		try {
			setSaving(true);
			await updatePlatformReferralSettings({
				developerPercent: devPercent,
				founderPercent,
				maintenanceMonthlyCostUsd,
				maintenancePercent: currentSettings.maintenancePercent ?? 0,
				exchangeRateCrc,
			});
			toast.success("Reglas de reparto financiero actualizadas.");
			onSaved();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Error al guardar configuración.",
			);
		} finally {
			setSaving(false);
		}
	}

	return (
		<PanelModal
			open={open}
			onClose={onClose}
			title="Configurar reparto financiero"
			description="Definí cómo se divide el margen neto entre desarrollador y socio fundador, más la reserva de infraestructura."
		>
			<form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<div>
						<label className="block text-xs font-semibold text-grayscale-11 mb-1.5">
							Desarrollador (%)
						</label>
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
					</div>
					<div>
						<label className="block text-xs font-semibold text-grayscale-11 mb-1.5">
							Socio fundador (%)
						</label>
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
				</div>

				<div
					className={`text-xs px-3 py-2 rounded-lg border ${
						isValidSum
							? "bg-green-3/70 border-green-6/70 text-green-11"
							: "bg-red-3/60 border-red-6/60 text-red-11"
					}`}
				>
					Suma total socios: <strong>{totalPartnerPercent}%</strong>{" "}
					{isValidSum ? "✓ Equilibrado" : "— Debe sumar exactamente 100%"}
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<div>
						<label className="block text-xs font-semibold text-grayscale-11 mb-1.5">
							Infra mensual (USD)
						</label>
						<FieldNumericInput
							mode="decimal"
							prefix="$"
							value={maintenanceMonthlyCostUsdRaw}
							onValueChange={setMaintenanceMonthlyCostUsdRaw}
						/>
					</div>
					<div>
						<label className="block text-xs font-semibold text-grayscale-11 mb-1.5">
							Tipo de cambio (₡/USD)
						</label>
						<FieldNumericInput
							mode="int"
							prefix="₡"
							value={exchangeRateCrcRaw}
							onValueChange={setExchangeRateCrcRaw}
						/>
					</div>
				</div>

				<div className="pt-3 border-t border-grayscale-3/70 dark:border-white/[0.08] flex justify-end gap-2">
					<PanelButton variant="ghost" onClick={onClose} disabled={saving}>
						Cancelar
					</PanelButton>
					<PanelButton type="submit" disabled={saving || !isValidSum}>
						{saving ? "Guardando…" : "Guardar distribución"}
					</PanelButton>
				</div>
			</form>
		</PanelModal>
	);
}
