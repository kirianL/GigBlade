"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
	CheckCircle2,
	ChevronDown,
	ChevronUp,
	ExternalLink,
	Globe,
	RefreshCw,
	ShieldCheck,
	Zap,
	AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
	djDomainLabel,
	djIntendedDomain,
	djPublicUrl,
	formatLastVisit,
	formatVisitCount,
	PLAN,
} from "@/panel/concept";
import { ConnectDomainModal } from "@/panel/ConnectDomainModal";
import { DeleteDjButton } from "@/panel/DeleteDjButton";
import { GenerateDjPasswordButton } from "@/panel/GenerateDjPassword";
import { usePlatformDjs } from "@/panel/usePlatformDjs";
import { usePlatformDomains } from "@/panel/usePlatformDomains";
import { ProviderBrandLogo } from "@/panel/ProviderLogos";
import { useSession } from "@/panel/auth-client";
import { useLanguage } from "@/panel/LanguageProvider";
import type { DomainAutomationDetail } from "@/panel/site-api";
import {
	CopyButton,
	DjStatusCell,
	EmptyState,
	MetricCard,
	OpenPublicPageButton,
	PageContainer,
	PageHeader,
	PanelButton,
	StatusBadge,
} from "@/panel/ui";

type MergedDomainRow = {
	slug: string;
	name: string;
	email: string;
	hostname: string;
	publicDomain: string | null;
	preview: boolean;
	visits: number;
	lastVisitedAt: string | null;
	status: "active" | "trialing" | "canceled";
	automation?: DomainAutomationDetail;
};

export default function PlatformDomains() {
	const { djs, sites, remove } = usePlatformDjs();
	const {
		domains: automationList,
		verifyDomain,
		refetch,
		isRefetching,
	} = usePlatformDomains();

	const { data: session } = useSession();
	const { t } = useLanguage();
	const isPlatform =
		(session?.user as { role?: string } | undefined)?.role === "platform";

	const [expandedDetails, setExpandedDetails] = useState<
		Record<string, boolean>
	>({});
	const [verifyingMap, setVerifyingMap] = useState<Record<string, boolean>>({});

	const toggleDetails = (slug: string) => {
		setExpandedDetails((prev) => ({ ...prev, [slug]: !prev[slug] }));
	};

	const handleVerify = async (hostname: string) => {
		setVerifyingMap((prev) => ({ ...prev, [hostname]: true }));
		try {
			await verifyDomain(hostname);
			toast.success(`Dominio ${hostname} verificado.`);
		} catch {
			toast.error(`No se pudo verificar ${hostname}. Intentá nuevamente.`);
		} finally {
			setVerifyingMap((prev) => ({ ...prev, [hostname]: false }));
		}
	};

	const rows = useMemo<MergedDomainRow[]>(() => {
		const bySlug = new Map((sites ?? []).map((site) => [site.slug, site]));
		const autoByHost = new Map(
			automationList.map((auto) => [auto.hostname.toLowerCase(), auto]),
		);

		return djs.map((dj) => {
			const live = bySlug.get(dj.slug);
			const hostname = live?.domain || dj.domain;
			const publicDomain = djIntendedDomain({ domain: hostname });
			const automation = publicDomain
				? autoByHost.get(publicDomain.toLowerCase())
				: undefined;

			return {
				slug: dj.slug,
				name: live?.displayName || dj.name,
				email: live?.email || dj.email,
				hostname,
				publicDomain,
				preview: live?.preview ?? !publicDomain,
				visits: live?.visits ?? 0,
				lastVisitedAt: live?.lastVisitedAt ?? null,
				status: dj.status,
				automation,
			};
		});
	}, [djs, sites, automationList]);

	const totalVisits = rows.reduce((sum, row) => sum + row.visits, 0);
	const totalWithCustomDomain = rows.filter((r) => r.publicDomain).length;
	const activeOnline = rows.filter(
		(r) => r.automation?.status === "active" || (!r.preview && r.publicDomain),
	).length;

	return (
		<PageContainer>
			<PageHeader
				title={t("domains.headerTitle", "Centro de automatización de dominios")}
				subtitle={`${PLAN.domainNote} Conexión DNS, SSL automático y sincronización con Edge Config.`}
			>
				<PanelButton
					variant="secondary"
					size="sm"
					onClick={() => void refetch()}
					disabled={isRefetching}
				>
					<RefreshCw
						size={13}
						className={isRefetching ? "animate-spin" : ""}
					/>
					<span>{isRefetching ? "Actualizando…" : "Re-escanear"}</span>
				</PanelButton>
				{isPlatform ? (
					<ConnectDomainModal onConnected={() => void refetch()} />
				) : null}
			</PageHeader>

			{/* Metrics Grid */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<MetricCard
					label="Dominios propios"
					value={totalWithCustomDomain}
					suffix={`de ${rows.length} DJs`}
					footer={<span>Vinculados en plataforma</span>}
				/>
				<MetricCard
					label="En línea con SSL"
					value={activeOnline}
					valueClassName="text-emerald-600"
					footer={
						<>
							<span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
							<span>HTTPS activo y verificado</span>
						</>
					}
				/>
				<MetricCard
					label="Visitas globales"
					value={totalVisits.toLocaleString("es-CR")}
					footer={<span>Tráfico acumulado del mes</span>}
				/>
			</div>

			{rows.length === 0 ? (
				<EmptyState
					icon={<Globe size={22} />}
					title="Todavía no hay DJs creados"
					description="Cuando agregues un DJ podrás conectar y verificar su dominio desde aquí."
				/>
			) : (
				<div className="grid grid-cols-1 gap-4">
					{rows.map((row) => {
						const pageUrl = djPublicUrl({ slug: row.slug, domain: row.hostname });
						const domainLabel =
							row.publicDomain ?? djDomainLabel({ domain: row.hostname });
						const isExpanded = Boolean(expandedDetails[row.slug]);
						const isVerifying = Boolean(verifyingMap[row.publicDomain ?? ""]);
						const auto = row.automation;
						const providerLabel =
							auto?.providerLabel ??
							(row.publicDomain ? "Detectando…" : "GigBlades Preview");

						return (
							<div
								key={row.slug}
								className="p-6 card card-hover transition-all space-y-5"
							>
								{/* Header */}
								<div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
									<div className="space-y-1.5 min-w-0 flex-1">
										<div className="flex items-center gap-2 flex-wrap">
											<h2 className="text-sm font-semibold text-grayscale-12">
												{row.name}
											</h2>
											<DjStatusCell status={row.status} />
											{row.publicDomain ? (
												<span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-grayscale-4 bg-grayscale-2/60 text-grayscale-11">
													<ProviderBrandLogo
														provider={auto?.provider}
														nameserverDomain={
															auto?.nameservers?.[0]
																? auto.nameservers[0]
																		.split(".")
																		.slice(-2)
																		.join(".")
																: undefined
														}
														className="w-3.5 h-3.5 shrink-0"
													/>
													{providerLabel}
												</span>
											) : null}
										</div>

										<div className="flex items-center gap-2 flex-wrap">
											<span className="font-mono text-xs font-semibold text-grayscale-11 break-all">
												{domainLabel}
											</span>
											{row.publicDomain ? (
												<CopyButton text={row.publicDomain} />
											) : null}
										</div>

										<p className="text-[11px] text-grayscale-9">
											{row.preview
												? "Dominio en preparación • Servido temporalmente desde GigBlades"
												: "Dominio propio conectado • Producción"}
										</p>
									</div>

									<div className="text-left sm:text-right shrink-0">
										<p className="text-xs font-semibold text-grayscale-12 tabular-nums">
											{formatVisitCount(row.visits)}
										</p>
										<p className="text-[11px] text-grayscale-9 mt-0.5">
											{formatLastVisit(row.lastVisitedAt)}
										</p>
									</div>
								</div>

								{/* 4-Step Pipeline */}
								{row.publicDomain ? (
									<div className="p-4 surface-soft space-y-3">
										<div className="flex flex-wrap items-center justify-between gap-2">
											<span className="text-[11px] font-semibold text-grayscale-8 uppercase tracking-wider">
												{t("domains.pipelineTitle", "Pipeline de automatización")}
											</span>
											<StatusBadge
												tone={auto?.pointsToGigBlade ? "emerald" : "amber"}
											>
												{auto?.pointsToGigBlade
													? "TRÁFICO ENRUTADO"
													: "ESPERANDO DNS"}
											</StatusBadge>
										</div>

										<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
											<div className="p-3 rounded-xl bg-grayscale-1 border border-grayscale-3 dark:bg-[#1b1b1a] dark:border-white/[0.08] flex items-center gap-2">
												{auto?.vercelVerified ? (
													<CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
												) : (
													<AlertCircle size={14} className="text-amber-500 shrink-0" />
												)}
												<div className="min-w-0">
													<p className="font-semibold text-grayscale-12 truncate">
														1. Vercel API
													</p>
													<p className="text-[10px] text-grayscale-9 truncate">
														{auto?.vercelVerified ? "Alta confirmada" : "Pendiente"}
													</p>
												</div>
											</div>

											<div className="p-3 rounded-xl bg-grayscale-1 border border-grayscale-3 dark:bg-[#1b1b1a] dark:border-white/[0.08] flex items-center gap-2">
												{auto?.pointsToGigBlade ? (
													<CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
												) : (
													<AlertCircle size={14} className="text-amber-500 shrink-0" />
												)}
												<div className="min-w-0">
													<p className="font-semibold text-grayscale-12 truncate">
														2. DNS Radar
													</p>
													<p className="text-[10px] text-grayscale-9 truncate">
														{auto?.pointsToGigBlade ? "Apuntando OK" : "Falta apuntar"}
													</p>
												</div>
											</div>

											<div className="p-3 rounded-xl bg-grayscale-1 border border-grayscale-3 dark:bg-[#1b1b1a] dark:border-white/[0.08] flex items-center gap-2">
												{auto?.sslActive ? (
													<CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
												) : (
													<ShieldCheck size={14} className="text-amber-500 shrink-0" />
												)}
												<div className="min-w-0">
													<p className="font-semibold text-grayscale-12 truncate">
														3. Certificado SSL
													</p>
													<p className="text-[10px] text-grayscale-9 truncate">
														{auto?.sslActive ? "HTTPS activo" : "Emitiendo…"}
													</p>
												</div>
											</div>

											<div className="p-3 rounded-xl bg-grayscale-1 border border-grayscale-3 dark:bg-[#1b1b1a] dark:border-white/[0.08] flex items-center gap-2">
												{auto?.edgeConfigSynced ? (
													<CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
												) : (
													<Zap size={14} className="text-amber-500 shrink-0" />
												)}
												<div className="min-w-0">
													<p className="font-semibold text-grayscale-12 truncate">
														4. Edge Config
													</p>
													<p className="text-[10px] text-grayscale-9 truncate">
														{auto?.edgeConfigSynced ? "Sincronizado" : "Pendiente"}
													</p>
												</div>
											</div>
										</div>

										{isExpanded && auto ? (
											<div className="pt-3 border-t border-grayscale-3/80 space-y-2.5 text-xs">
												{auto.recommendedRecords.length > 0 ? (
													<div className="space-y-1.5">
														<span className="text-[10px] font-semibold text-grayscale-8 uppercase tracking-wider block">
															Registros DNS requeridos
														</span>
														{auto.recommendedRecords.map((rec, idx) => (
															<div
																key={`${rec.type}-${rec.name}-${idx}`}
																className="flex items-center justify-between gap-2 p-2 bg-grayscale-1 border border-grayscale-3 dark:bg-[#1b1b1a] dark:border-white/[0.08] rounded-xl"
															>
																<div className="flex items-center gap-2 min-w-0 font-mono">
																	<span className="px-1.5 py-0.5 rounded bg-grayscale-2 text-[10px] font-bold">
																		{rec.type}
																	</span>
																	<span>{rec.name}</span>
																	<span className="text-grayscale-6">→</span>
																	<span className="font-semibold text-grayscale-12 truncate">
																		{rec.value}
																	</span>
																</div>
																<CopyButton text={rec.value} />
															</div>
														))}
													</div>
												) : null}

												{auto.currentIps.length > 0 ? (
													<p className="text-[11px] text-grayscale-9">
														IPs detectadas:{" "}
														<span className="font-mono text-grayscale-11">
															{auto.currentIps.join(", ")}
														</span>
													</p>
												) : null}
											</div>
										) : null}
									</div>
								) : null}

								{/* Footer actions */}
								<div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-grayscale-3/70 dark:border-white/[0.08]">
									<div className="flex flex-wrap items-center gap-2">
										<OpenPublicPageButton href={pageUrl} />
										<Link
											href={`/studio/content?dj=${row.slug}`}
											className="px-3 py-1.5 border border-grayscale-4 bg-grayscale-1 hover:bg-grayscale-2 text-[12px] font-medium text-grayscale-11 hover:text-grayscale-12 dark:bg-grayscale-2 dark:hover:bg-grayscale-3 rounded-xl transition-colors shadow-xs"
										>
											Editar contenido
										</Link>
										{row.publicDomain ? (
											<>
												<PanelButton
													variant="secondary"
													size="sm"
													disabled={isVerifying}
													onClick={() => void handleVerify(row.publicDomain!)}
												>
													<RefreshCw
														size={12}
														className={isVerifying ? "animate-spin" : ""}
													/>
													<span>{isVerifying ? "Verificando…" : "Verificar DNS"}</span>
												</PanelButton>
												<PanelButton
													variant="ghost"
													size="sm"
													onClick={() => toggleDetails(row.slug)}
												>
													{isExpanded ? (
														<ChevronUp size={13} />
													) : (
														<ChevronDown size={13} />
													)}
													<span>{isExpanded ? "Ocultar DNS" : "Ver DNS"}</span>
												</PanelButton>
												{auto?.oneClickUrl ? (
													<a
														href={auto.oneClickUrl}
														target="_blank"
														rel="noreferrer"
														className="inline-flex h-8 items-center gap-1.5 px-3 bg-grayscale-12 hover:bg-grayscale-11 text-grayscale-1 text-[12px] font-medium rounded-md shadow-[0_1px_2px_rgba(28,22,16,0.14)] transition-colors"
													>
														<ExternalLink size={12} />
														<span>Conectar 1-clic</span>
													</a>
												) : null}
											</>
										) : isPlatform ? (
											<ConnectDomainModal
												fixedSlug={row.slug}
												triggerText="Asignar dominio"
												onConnected={() => void refetch()}
											/>
										) : null}
									</div>

									{isPlatform ? (
										<div className="flex flex-wrap items-center gap-2">
											<GenerateDjPasswordButton
												slug={row.slug}
												email={row.email}
												name={row.name}
											/>
											<DeleteDjButton
												slug={row.slug}
												name={row.name}
												onDeleted={remove}
											/>
										</div>
									) : null}
								</div>
							</div>
						);
					})}
				</div>
			)}
		</PageContainer>
	);
}
