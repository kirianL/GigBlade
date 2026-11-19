"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
	CheckCircle2,
	DollarSign,
	Plus,
	RefreshCw,
	Settings,
	Share2,
	Users,
	Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/panel/auth-client";
import { useLanguage } from "@/panel/LanguageProvider";
import { gigbladeMarketingSiteUrl } from "@/panel/concept";
import { NumericInput, parseNumericField } from "@/panel/numeric-input";
import {
	createPlatformAffiliate,
	fetchPlatformReferrals,
	recordPlatformReferralPayout,
	updatePlatformReferralSettings,
	type PlatformAffiliate,
	type PlatformReferralSettings,
} from "@/panel/site-api";
import { PLATFORM_REFERRALS_QUERY_KEY } from "@/panel/platform-referrals-query";
import {
	CopyButton,
	EmptyState,
	INPUT_CLASS,
	MetricCard,
	PageContainer,
	PageHeader,
	PanelButton,
	PanelInput,
	PanelModal,
	SegmentedControl,
	StatusBadge,
} from "@/panel/ui";

export { PLATFORM_REFERRALS_QUERY_KEY };

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
	} | null>(null);

	const query = useQuery({
		queryKey: PLATFORM_REFERRALS_QUERY_KEY,
		queryFn: ({ signal }) => fetchPlatformReferrals(signal),
		enabled: Boolean(isPlatform),
		staleTime: 15_000,
		retry: 1,
	});

	useEffect(() => {
		if (!query.isError) return;
		toast.error("No se pudieron cargar referidos y comisiones.");
	}, [query.isError]);

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

	const metrics = useMemo(() => {
		let totalEarnedUsd = 0;
		let totalEarnedCrc = 0;
		for (const conv of conversions) {
			totalEarnedUsd +=
				conv.commissionAmountUsd ?? conv.commissionAmount / exchangeRate;
			totalEarnedCrc += conv.commissionAmountCrc ?? conv.commissionAmount;
		}
		let totalPaidCrc = 0;
		for (const p of payouts) totalPaidCrc += p.amount;
		const totalPaidUsd = totalPaidCrc / exchangeRate;
		return {
			totalEarnedUsd,
			totalEarnedCrc,
			totalPaidUsd,
			totalPaidCrc,
			pendingBalanceUsd: Math.max(0, totalEarnedUsd - totalPaidUsd),
			pendingBalanceCrc: Math.max(0, totalEarnedCrc - totalPaidCrc),
		};
	}, [conversions, payouts, exchangeRate]);

	const refreshAll = () => {
		void query.refetch();
		void queryClient.invalidateQueries({
			queryKey: PLATFORM_REFERRALS_QUERY_KEY,
		});
	};

	return (
		<PageContainer wide>
			<PageHeader
				title={t("referrals.title", "Referidos y comisiones")}
				subtitle="Gestión de afiliados, enlaces de recomendación, conversiones y liquidaciones"
			>
				<Link
					href="/distribucion"
					className="inline-flex h-9 items-center gap-1.5 px-3.5 border border-grayscale-4 bg-grayscale-1 hover:bg-grayscale-2 text-grayscale-11 hover:text-grayscale-12 dark:bg-grayscale-2 dark:hover:bg-grayscale-3 text-[12.5px] font-medium rounded-md shadow-[0_1px_2px_rgba(28,22,16,0.04)] transition-colors"
				>
					<DollarSign size={13} />
					<span>Finanzas</span>
				</Link>
				<PanelButton
					variant="secondary"
					onClick={() => setSettingsModalOpen(true)}
				>
					<Settings size={13} />
					<span>Tarifas y %</span>
				</PanelButton>
				<PanelButton
					variant="primary"
					onClick={() => setCreateModalOpen(true)}
				>
					<Plus size={13} />
					<span>Nuevo afiliado</span>
				</PanelButton>
			</PageHeader>

			{/* KPIs */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<MetricCard
					label="Comisiones generadas"
					value={formatUsd(metrics.totalEarnedUsd)}
					footer={
						<span>
							≈ {formatCrc(metrics.totalEarnedCrc)} • {conversions.length} conversiones
						</span>
					}
				/>
				<MetricCard
					label="Saldo pendiente de pago"
					value={formatUsd(metrics.pendingBalanceUsd)}
					valueClassName="text-amber-600"
					footer={
						<>
							<span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
							<span>≈ {formatCrc(metrics.pendingBalanceCrc)} por liquidar</span>
						</>
					}
				/>
				<MetricCard
					label="Total liquidado"
					value={formatUsd(metrics.totalPaidUsd)}
					valueClassName="text-emerald-600"
					footer={
						<>
							<span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
							<span>
								≈ {formatCrc(metrics.totalPaidCrc)} en {payouts.length} pagos
							</span>
						</>
					}
				/>
			</div>

			{/* Scheme summary */}
			<div className="card p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
				<div className="flex flex-wrap items-center gap-3 text-xs">
					<span className="font-semibold text-grayscale-12">Esquema actual:</span>
					<StatusBadge tone="purple" dot={false}>
						Setup ${settings.initialSetupPriceUsd ?? 100} → {settings.initialSetupPercent ?? 20}%
					</StatusBadge>
					<StatusBadge tone="sky" dot={false}>
						Mensualidad ${settings.monthlyPriceUsd ?? 30} → {settings.monthlyPercent ?? 15}%
					</StatusBadge>
					<span className="text-grayscale-9 font-mono">
						T.C. ₡{exchangeRate}
					</span>
				</div>
				<PanelButton
					variant="ghost"
					size="sm"
					onClick={() => void query.refetch()}
					disabled={query.isFetching}
				>
					<RefreshCw
						size={12}
						className={query.isFetching ? "animate-spin" : ""}
					/>
					<span>Actualizar</span>
				</PanelButton>
			</div>

			{/* Segmented Control */}
			<SegmentedControl
				value={activeTab}
				onChange={setActiveTab}
				options={[
					{ value: "tablero", label: "Conversiones", count: conversions.length },
					{ value: "afiliados", label: "Afiliados", count: affiliates.length },
					{ value: "pagos", label: "Liquidaciones", count: payouts.length },
				]}
			/>

			{/* TAB 1: CONVERSIONES */}
			{activeTab === "tablero" ? (
				conversions.length === 0 ? (
					<EmptyState
						icon={<Share2 size={22} />}
						title="Aún no hay conversiones registradas"
						description="Cuando un DJ se registre usando un enlace /r/CODIGO y se cree su página, aparecerá aquí."
					/>
				) : (
					<div className="grid grid-cols-1 gap-3">
						{conversions.map((conv) => {
							const commUsd =
								conv.commissionAmountUsd ?? conv.commissionAmount / exchangeRate;
							const commCrc = conv.commissionAmountCrc ?? conv.commissionAmount;
							return (
								<div
									key={conv.id}
									className="p-5 card flex flex-col sm:flex-row sm:items-center justify-between gap-4"
								>
									<div className="space-y-1.5 min-w-0 flex-1">
										<div className="flex items-center gap-2 flex-wrap">
											<span className="text-[11px] font-mono font-semibold text-grayscale-10 px-2 py-0.5 bg-grayscale-2 rounded-md">
												{conv.affiliateCode}
											</span>
											<h3 className="text-sm font-semibold text-grayscale-12">
												{conv.djName}
											</h3>
											<StatusBadge
												tone={conv.chargeType === "monthly" ? "sky" : "purple"}
												dot={false}
											>
												{conv.chargeType === "monthly"
													? "MENSUALIDAD"
													: "SETUP INICIAL"}
											</StatusBadge>
											<StatusBadge
												tone={conv.payoutStatus === "paid" ? "emerald" : "amber"}
											>
												{conv.payoutStatus === "paid" ? "PAGADA" : "PENDIENTE"}
											</StatusBadge>
										</div>
										<p className="text-xs text-grayscale-9">
											Promotor: <strong className="text-grayscale-11">{conv.affiliateName}</strong> • {conv.djEmail} • {formatDate(conv.createdAt, language)}
										</p>
									</div>

									<div className="text-left sm:text-right shrink-0 tabular-nums">
										<p className="text-base font-bold text-grayscale-12">
											{formatUsd(commUsd)}
										</p>
										<p className="text-[11px] text-grayscale-9">
											≈ {formatCrc(commCrc)} ({conv.commissionPercentage}%)
										</p>
									</div>
								</div>
							);
						})}
					</div>
				)
			) : null}

			{/* TAB 2: AFILIADOS */}
			{activeTab === "afiliados" ? (
				affiliates.length === 0 ? (
					<EmptyState
						icon={<Users size={22} />}
						title="Todavía no hay afiliados"
						description="Creá tu primer promotor o afiliado para generar su enlace de referidos único."
						action={
							<PanelButton onClick={() => setCreateModalOpen(true)}>
								<Plus size={13} />
								<span>Crear primer afiliado</span>
							</PanelButton>
						}
					/>
				) : (
					<div className="grid grid-cols-1 gap-3">
						{affiliates.map((aff) => {
							const link =
								aff.referralLink ||
								`${gigbladeMarketingSiteUrl()}/r/${aff.code}`;
							const pendingUsd = aff.pendingBalance / exchangeRate;
							return (
								<div
									key={aff.id}
									className="p-5 card card-hover transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
								>
									<div className="space-y-1.5 min-w-0 flex-1">
										<div className="flex items-center gap-2 flex-wrap">
											<span className="text-[11px] font-mono font-semibold text-grayscale-10 px-2 py-0.5 bg-grayscale-2 rounded-md">
												{aff.code}
											</span>
											<h3 className="text-sm font-semibold text-grayscale-12">
												{aff.name}
											</h3>
											<StatusBadge
												tone={aff.status === "active" ? "emerald" : "neutral"}
											>
												{aff.status.toUpperCase()}
											</StatusBadge>
										</div>
										<p className="text-xs text-grayscale-9">
											{aff.email}
											{aff.phone ? ` • ${aff.phone}` : ""} • Método:{" "}
											<strong className="uppercase text-grayscale-11">
												{aff.paymentMethod}
											</strong>
										</p>
										<div className="flex items-center gap-2 flex-wrap pt-1">
											<span className="font-mono text-[11px] text-grayscale-10 bg-grayscale-2/60 border border-grayscale-3 px-2.5 py-1 rounded-lg truncate max-w-xs">
												{link}
											</span>
											<CopyButton text={link} label="Copiar link" />
										</div>
									</div>

									<div className="flex flex-wrap sm:flex-col items-center sm:items-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-grayscale-3/70 dark:border-white/[0.08]">
										<div className="text-left sm:text-right tabular-nums">
											<p className="text-xs text-grayscale-9">
												{aff.totalConversions} conversiones • Pendiente:
											</p>
											<p className="text-base font-bold text-grayscale-12">
												{formatUsd(pendingUsd)}{" "}
												<span className="text-[11px] font-normal text-grayscale-9">
													({formatCrc(aff.pendingBalance)})
												</span>
											</p>
										</div>
										{aff.pendingBalance > 0 ? (
											<PanelButton
												variant="success"
												size="sm"
												onClick={() =>
													setPayoutTarget({
														affiliate: aff,
														amountCrc: aff.pendingBalance,
														amountUsd: pendingUsd,
													})
												}
											>
												<Wallet size={13} />
												<span>Liquidar saldo</span>
											</PanelButton>
										) : (
											<span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-11">
												<CheckCircle2 size={12} />
												Al día
											</span>
										)}
									</div>
								</div>
							);
						})}
					</div>
				)
			) : null}

			{/* TAB 3: LIQUIDACIONES */}
			{activeTab === "pagos" ? (
				payouts.length === 0 ? (
					<EmptyState
						icon={<Wallet size={22} />}
						title="Sin liquidaciones registradas"
						description="Cuando pagues comisiones por SINPE o IBAN a un afiliado, el comprobante aparecerá aquí."
					/>
				) : (
					<div className="grid grid-cols-1 gap-3">
						{payouts.map((p) => (
							<div
								key={p.id}
								className="p-5 card flex flex-col sm:flex-row sm:items-center justify-between gap-4"
							>
								<div className="space-y-1">
									<div className="flex items-center gap-2 flex-wrap">
										<span className="text-[11px] font-mono font-semibold text-grayscale-10 px-2 py-0.5 bg-grayscale-2 rounded-md">
											{p.affiliateCode}
										</span>
										<h3 className="text-sm font-semibold text-grayscale-12">
											{p.affiliateName}
										</h3>
										<StatusBadge tone="emerald">LIQUIDADO</StatusBadge>
									</div>
									<p className="text-xs text-grayscale-9">
										Método: <strong className="uppercase">{p.method}</strong> • Ref:{" "}
										<span className="font-mono text-grayscale-11">
											{p.referenceNumber}
										</span>{" "}
										• {formatDate(p.paidAt, language)}
									</p>
									{p.note ? (
										<p className="text-xs text-grayscale-10">{p.note}</p>
									) : null}
								</div>
								<div className="text-left sm:text-right tabular-nums shrink-0">
									<p className="text-base font-bold text-green-11">
										{formatCrc(p.amount)}
									</p>
									<p className="text-[11px] text-grayscale-9">
										≈ {formatUsd(p.amountUsd ?? p.amount / exchangeRate)}
									</p>
								</div>
							</div>
						))}
					</div>
				)
			) : null}

			{/* Modals */}
			<CreateAffiliateModal
				open={createModalOpen}
				onClose={() => setCreateModalOpen(false)}
				onCreated={() => {
					setCreateModalOpen(false);
					refreshAll();
				}}
			/>

			<ReferralSettingsModal
				open={settingsModalOpen}
				onClose={() => setSettingsModalOpen(false)}
				settings={settings}
				onSaved={() => {
					setSettingsModalOpen(false);
					refreshAll();
				}}
			/>

			{payoutTarget ? (
				<PayoutModal
					open={Boolean(payoutTarget)}
					onClose={() => setPayoutTarget(null)}
					affiliate={payoutTarget.affiliate}
					amountCrc={payoutTarget.amountCrc}
					amountUsd={payoutTarget.amountUsd}
					onPaid={() => {
						setPayoutTarget(null);
						refreshAll();
					}}
				/>
			) : null}
		</PageContainer>
	);
}

function CreateAffiliateModal({
	open,
	onClose,
	onCreated,
}: {
	open: boolean;
	onClose: () => void;
	onCreated: () => void;
}) {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [code, setCode] = useState("");
	const [method, setMethod] = useState<"sinpe" | "iban">("sinpe");
	const [sinpePhone, setSinpePhone] = useState("");
	const [iban, setIban] = useState("");
	const [bankName, setBankName] = useState("");
	const [saving, setSaving] = useState(false);

	const submit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim() || !email.trim()) {
			toast.error("Nombre y correo son obligatorios.");
			return;
		}
		setSaving(true);
		try {
			await createPlatformAffiliate({
				name: name.trim(),
				email: email.trim(),
				phone: phone.trim() || undefined,
				code: (code.trim() || generateAffiliateCode(name)).toUpperCase(),
				paymentMethod: method,
				sinpePhone: method === "sinpe" ? sinpePhone.trim() || phone.trim() : undefined,
				iban: method === "iban" ? iban.trim() : undefined,
				bankName: method === "iban" ? bankName.trim() : undefined,
			});
			toast.success("Afiliado creado correctamente.");
			setName("");
			setEmail("");
			setPhone("");
			setCode("");
			setSinpePhone("");
			setIban("");
			setBankName("");
			onCreated();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "No se pudo crear.");
		} finally {
			setSaving(false);
		}
	};

	return (
		<PanelModal
			open={open}
			onClose={onClose}
			title="Nuevo afiliado / promotor"
			description="Generá un código de referido y registrá el método de pago para sus comisiones."
		>
			<form onSubmit={(e) => void submit(e)} className="space-y-4">
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<div>
						<label className="block text-xs font-semibold text-grayscale-11 mb-1.5">
							Nombre *
						</label>
						<PanelInput
							required
							value={name}
							onChange={(e) => {
								setName(e.target.value);
								if (!code) setCode(generateAffiliateCode(e.target.value));
							}}
							placeholder="Ej. Carlos Méndez"
						/>
					</div>
					<div>
						<label className="block text-xs font-semibold text-grayscale-11 mb-1.5">
							Código *
						</label>
						<PanelInput
							required
							value={code}
							onChange={(e) => setCode(e.target.value.toUpperCase())}
							placeholder="CARLO24"
							className="font-mono uppercase"
						/>
					</div>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<div>
						<label className="block text-xs font-semibold text-grayscale-11 mb-1.5">
							Correo *
						</label>
						<PanelInput
							type="email"
							required
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="promotor@correo.com"
						/>
					</div>
					<div>
						<label className="block text-xs font-semibold text-grayscale-11 mb-1.5">
							Teléfono / WhatsApp
						</label>
						<PanelInput
							value={phone}
							onChange={(e) => setPhone(e.target.value)}
							placeholder="+506 8888-8888"
						/>
					</div>
				</div>

				<div>
					<label className="block text-xs font-semibold text-grayscale-11 mb-1.5">
						Método de pago
					</label>
					<select
						value={method}
						onChange={(e) => setMethod(e.target.value as "sinpe" | "iban")}
						className={INPUT_CLASS}
					>
						<option value="sinpe">SINPE Móvil</option>
						<option value="iban">Transferencia IBAN</option>
					</select>
				</div>

				{method === "sinpe" ? (
					<div>
						<label className="block text-xs font-semibold text-grayscale-11 mb-1.5">
							Número SINPE Móvil
						</label>
						<PanelInput
							value={sinpePhone}
							onChange={(e) => setSinpePhone(e.target.value)}
							placeholder="8888-8888"
						/>
					</div>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div>
							<label className="block text-xs font-semibold text-grayscale-11 mb-1.5">
								Cuenta IBAN
							</label>
							<PanelInput
								value={iban}
								onChange={(e) => setIban(e.target.value)}
								placeholder="CR00..."
								className="font-mono"
							/>
						</div>
						<div>
							<label className="block text-xs font-semibold text-grayscale-11 mb-1.5">
								Banco
							</label>
							<PanelInput
								value={bankName}
								onChange={(e) => setBankName(e.target.value)}
								placeholder="BAC / BCR / BN"
							/>
						</div>
					</div>
				)}

				<div className="pt-3 border-t border-grayscale-3/70 dark:border-white/[0.08] flex justify-end gap-2">
					<PanelButton variant="ghost" onClick={onClose} disabled={saving}>
						Cancelar
					</PanelButton>
					<PanelButton type="submit" disabled={saving}>
						{saving ? "Creando…" : "Crear afiliado"}
					</PanelButton>
				</div>
			</form>
		</PanelModal>
	);
}

function ReferralSettingsModal(props: {
	open: boolean;
	onClose: () => void;
	settings: PlatformReferralSettings;
	onSaved: () => void;
}) {
	if (!props.open) return null;
	return <ReferralSettingsModalInner {...props} />;
}

function ReferralSettingsModalInner({
	open,
	onClose,
	settings,
	onSaved,
}: {
	open: boolean;
	onClose: () => void;
	settings: PlatformReferralSettings;
	onSaved: () => void;
}) {
	const [setupPrice, setSetupPrice] = useState(
		String(settings.initialSetupPriceUsd ?? 100),
	);
	const [setupPercent, setSetupPercent] = useState(
		String(settings.initialSetupPercent ?? 20),
	);
	const [monthlyPrice, setMonthlyPrice] = useState(
		String(settings.monthlyPriceUsd ?? 30),
	);
	const [monthlyPercent, setMonthlyPercent] = useState(
		String(settings.monthlyPercent ?? 15),
	);
	const [exchangeRate, setExchangeRate] = useState(
		String(settings.exchangeRateCrc ?? 515),
	);
	const [saving, setSaving] = useState(false);

	const submit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		try {
			await updatePlatformReferralSettings({
				initialSetupPriceUsd: parseNumericField(setupPrice, 100),
				initialSetupPercent: parseNumericField(setupPercent, 20),
				monthlyPriceUsd: parseNumericField(monthlyPrice, 30),
				monthlyPercent: parseNumericField(monthlyPercent, 15),
				exchangeRateCrc: parseNumericField(exchangeRate, 515),
			});
			toast.success("Tarifas y porcentajes guardados.");
			onSaved();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error al guardar.");
		} finally {
			setSaving(false);
		}
	};

	return (
		<PanelModal
			open={open}
			onClose={onClose}
			title="Tarifas y porcentajes de comisión"
			description="Estos valores se aplican automáticamente a nuevas conversiones y al simulador financiero."
		>
			<form onSubmit={(e) => void submit(e)} className="space-y-4">
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<div>
						<label className="block text-xs font-semibold text-grayscale-11 mb-1.5">
							Setup inicial (USD)
						</label>
						<NumericInput
							mode="decimal"
							value={setupPrice}
							onValueChange={setSetupPrice}
							className={INPUT_CLASS}
						/>
					</div>
					<div>
						<label className="block text-xs font-semibold text-grayscale-11 mb-1.5">
							Comisión setup (%)
						</label>
						<NumericInput
							mode="decimal"
							value={setupPercent}
							onValueChange={setSetupPercent}
							className={INPUT_CLASS}
						/>
					</div>
					<div>
						<label className="block text-xs font-semibold text-grayscale-11 mb-1.5">
							Mensualidad (USD)
						</label>
						<NumericInput
							mode="decimal"
							value={monthlyPrice}
							onValueChange={setMonthlyPrice}
							className={INPUT_CLASS}
						/>
					</div>
					<div>
						<label className="block text-xs font-semibold text-grayscale-11 mb-1.5">
							Comisión mensual (%)
						</label>
						<NumericInput
							mode="decimal"
							value={monthlyPercent}
							onValueChange={setMonthlyPercent}
							className={INPUT_CLASS}
						/>
					</div>
				</div>

				<div>
					<label className="block text-xs font-semibold text-grayscale-11 mb-1.5">
						Tipo de cambio (₡ por $1 USD)
					</label>
					<NumericInput
						mode="int"
						value={exchangeRate}
						onValueChange={setExchangeRate}
						className={INPUT_CLASS}
					/>
				</div>

				<div className="pt-3 border-t border-grayscale-3/70 dark:border-white/[0.08] flex justify-end gap-2">
					<PanelButton variant="ghost" onClick={onClose} disabled={saving}>
						Cancelar
					</PanelButton>
					<PanelButton type="submit" disabled={saving}>
						{saving ? "Guardando…" : "Guardar ajustes"}
					</PanelButton>
				</div>
			</form>
		</PanelModal>
	);
}

function PayoutModal({
	open,
	onClose,
	affiliate,
	amountCrc,
	amountUsd,
	onPaid,
}: {
	open: boolean;
	onClose: () => void;
	affiliate: PlatformAffiliate;
	amountCrc: number;
	amountUsd: number;
	onPaid: () => void;
}) {
	const [method, setMethod] = useState<"sinpe" | "iban">(
		affiliate.paymentMethod || "sinpe",
	);
	const [referenceNumber, setReferenceNumber] = useState("");
	const [note, setNote] = useState("");
	const [saving, setSaving] = useState(false);

	const submit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!referenceNumber.trim()) {
			toast.error("Ingresá el número de comprobante o referencia.");
			return;
		}
		setSaving(true);
		try {
			await recordPlatformReferralPayout({
				affiliateId: affiliate.id,
				amount: amountCrc,
				currency: "CRC",
				method,
				referenceNumber: referenceNumber.trim(),
				note: note.trim() || undefined,
			});
			toast.success(`Liquidación registrada para ${affiliate.name}.`);
			onPaid();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "No se pudo liquidar.");
		} finally {
			setSaving(false);
		}
	};

	return (
		<PanelModal
			open={open}
			onClose={onClose}
			title={`Liquidar a ${affiliate.name}`}
			description={`Saldo a pagar: ${formatCrc(amountCrc)} (≈ ${formatUsd(amountUsd)})`}
		>
			<form onSubmit={(e) => void submit(e)} className="space-y-4">
				<div>
					<label className="block text-xs font-semibold text-grayscale-11 mb-1.5">
						Método de pago
					</label>
					<select
						value={method}
						onChange={(e) => setMethod(e.target.value as "sinpe" | "iban")}
						className={INPUT_CLASS}
					>
						<option value="sinpe">SINPE Móvil</option>
						<option value="iban">IBAN</option>
					</select>
				</div>
				<div>
					<label className="block text-xs font-semibold text-grayscale-11 mb-1.5">
						Número de comprobante / referencia *
					</label>
					<PanelInput
						required
						value={referenceNumber}
						onChange={(e) => setReferenceNumber(e.target.value)}
						placeholder="Ej. 20261118000123"
						className="font-mono"
					/>
				</div>
				<div>
					<label className="block text-xs font-semibold text-grayscale-11 mb-1.5">
						Nota (opcional)
					</label>
					<PanelInput
						value={note}
						onChange={(e) => setNote(e.target.value)}
						placeholder="Ej. Liquidación mensual de comisiones"
					/>
				</div>
				<div className="pt-3 border-t border-grayscale-3/70 dark:border-white/[0.08] flex justify-end gap-2">
					<PanelButton variant="ghost" onClick={onClose} disabled={saving}>
						Cancelar
					</PanelButton>
					<PanelButton type="submit" variant="success" disabled={saving}>
						{saving ? "Registrando…" : "Confirmar liquidación"}
					</PanelButton>
				</div>
			</form>
		</PanelModal>
	);
}
