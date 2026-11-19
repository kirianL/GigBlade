"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
	ExternalLink,
	Globe,
	Info,
	RefreshCw,
	Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { djIntendedDomain, djPublicUrl } from "@/panel/concept";
import { ConnectDomainModal } from "@/panel/ConnectDomainModal";
import { ProviderBrandLogo } from "@/panel/ProviderLogos";
import { checkDomainDns, type DomainDnsScanResult } from "@/panel/site-api";
import { useLanguage } from "@/panel/LanguageProvider";
import { usePlatformDomains } from "@/panel/usePlatformDomains";
import {
	CopyButton,
	DjSelect,
	EmptyState,
	INPUT_CLASS,
	OpenPublicPageButton,
	PageContainer,
	PageHeader,
	PanelButton,
	PanelModal,
	StatusBadge,
	useSelectedDj,
} from "@/panel/ui";

function isApex(hostname: string): boolean {
	const clean = hostname.replace(/^https?:\/\//, "").split("/")[0];
	return clean.split(".").length === 2;
}

function getDefaultRecords(hostname: string) {
	const clean = hostname.replace(/^https?:\/\//, "").split("/")[0].toLowerCase();
	if (isApex(clean)) {
		return [
			{ type: "A" as const, name: "@", value: "76.76.21.21" },
			{ type: "CNAME" as const, name: "www", value: "cname.vercel-dns.com" },
		];
	}
	const sub = clean.split(".")[0] || "@";
	return [{ type: "CNAME" as const, name: sub, value: "cname.vercel-dns.com" }];
}

const DOMAIN_PROVIDERS = [
	{ id: "cloudflare", label: "Cloudflare", url: "https://dash.cloudflare.com" },
	{ id: "godaddy", label: "GoDaddy", url: "https://dcc.godaddy.com/control/dns" },
	{ id: "namecom", label: "Name.com", url: "https://www.name.com/account/domain" },
	{ id: "namecheap", label: "Namecheap", url: "https://ap.www.namecheap.com/domains/list" },
	{ id: "google", label: "Google Domains", url: "https://domains.squarespace.com" },
	{ id: "vercel", label: "Vercel DNS", url: "https://vercel.com/dashboard/domains" },
	{ id: "other", label: "Registrador externo", url: null },
] as const;

type ProviderId = (typeof DOMAIN_PROVIDERS)[number]["id"];

export default function DjDomainPage() {
	const { dj, setDj, ownSiteReady } = useSelectedDj();
	const { t } = useLanguage();
	const pageUrl = djPublicUrl(dj);
	const customDomain = ownSiteReady ? djIntendedDomain(dj) : null;

	const [scan, setScan] = useState<DomainDnsScanResult | null>(null);
	const [isChecking, setIsChecking] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const [providerOverride, setProviderOverride] = useState<{
		domain: string;
		provider: ProviderId;
	} | null>(null);
	const { verifyDomain, isVerifying, removeDomain } = usePlatformDomains();

	const storedProvider =
		typeof window !== "undefined" && customDomain
			? (window.localStorage.getItem(
					`gigblade_provider_${customDomain}`,
				) as ProviderId | null)
			: null;
	const selectedProvider: ProviderId =
		providerOverride?.domain === customDomain
			? providerOverride.provider
			: storedProvider ?? "cloudflare";

	const handleSelectProvider = (provId: ProviderId) => {
		if (customDomain) {
			setProviderOverride({ domain: customDomain, provider: provId });
			if (typeof window !== "undefined") {
				window.localStorage.setItem(`gigblade_provider_${customDomain}`, provId);
			}
		}
		const label =
			DOMAIN_PROVIDERS.find((p) => p.id === provId)?.label || provId;
		toast.success(`Registrador: ${label}`);
	};

	const handleCheck = async (domainToScan: string) => {
		setIsChecking(true);
		try {
			const res = await checkDomainDns({ domain: domainToScan });
			setScan(res);
			if (res.provider && res.provider !== "other") {
				const stored =
					typeof window !== "undefined"
						? window.localStorage.getItem(`gigblade_provider_${domainToScan}`)
						: null;
				if (!stored) {
					setProviderOverride({
						domain: domainToScan,
						provider: res.provider as ProviderId,
					});
				}
			}
		} catch {
			// ignore
		} finally {
			setIsChecking(false);
		}
	};

	useEffect(() => {
		if (!customDomain) return;
		let cancelled = false;
		void checkDomainDns({ domain: customDomain })
			.then((res) => {
				if (cancelled) return;
				setScan(res);
				if (res.provider && res.provider !== "other") {
					const stored =
						typeof window !== "undefined"
							? window.localStorage.getItem(`gigblade_provider_${customDomain}`)
							: null;
					if (!stored) {
						setProviderOverride({
							domain: customDomain,
							provider: res.provider as ProviderId,
						});
					}
				}
			})
			.catch(() => {
				// ignore
			});
		return () => {
			cancelled = true;
		};
	}, [customDomain]);

	const handleVerify = async () => {
		if (!customDomain) return;
		try {
			await verifyDomain(customDomain);
			toast.success(`Dominio ${customDomain} verificado.`);
			void handleCheck(customDomain);
		} catch {
			toast.error(`No se pudo verificar ${customDomain}.`);
		}
	};

	const handleDeleteDomain = async () => {
		if (!customDomain) return;
		setIsDeleting(true);
		try {
			await removeDomain({ domain: customDomain, slug: dj.slug });
			toast.success(`Dominio ${customDomain} desconectado.`);
			setDeleteDialogOpen(false);
			window.location.reload();
		} catch {
			toast.error(`No se pudo desconectar el dominio ${customDomain}.`);
		} finally {
			setIsDeleting(false);
		}
	};

	const activeProvider = DOMAIN_PROVIDERS.find(
		(p) => p.id === selectedProvider,
	);
	const activeRecords =
		scan?.recommendedRecords && scan.recommendedRecords.length > 0
			? scan.recommendedRecords
			: customDomain
				? getDefaultRecords(customDomain)
				: [];

	const providerTip: Record<ProviderId, string> = {
		cloudflare:
			"Cloudflare: configurá el registro en modo 'Solo DNS' (nube gris, sin proxy naranja) para que el SSL se emita automáticamente.",
		godaddy:
			"GoDaddy: entrá a 'Administrar DNS' → 'Agregar nuevo registro'. Colocá el Host y el Valor exactamente como aparecen arriba.",
		namecom:
			"Name.com: entrá a 'DNS Records'. En Host colocá únicamente el nombre sin repetir el dominio, con TTL 300.",
		namecheap:
			"Namecheap: entrá a 'Advanced DNS' → 'Add New Record' con el Host y Valor indicados en TTL Automático.",
		google:
			"Google Domains / Squarespace: agregá los registros en 'DNS personalizados'.",
		vercel: "Vercel DNS: verificá que los registros coincidan con tu zona DNS.",
		other:
			"Agregá estos registros en la zona DNS de tu registrador para conectar tu página y emitir el certificado SSL.",
	};

	return (
		<PageContainer>
			<PageHeader
				title={t("djDomain.title", "Dominio propio")}
				subtitle={t(
					"djDomain.subtitle",
					"Gestioná la conexión DNS de tu marca con cualquier registrador.",
				)}
			>
				<Link
					href={`/studio?dj=${dj.slug}`}
					className="inline-flex h-8 items-center gap-1.5 rounded-md border border-grayscale-4 bg-grayscale-1 px-3 text-[12px] font-medium text-grayscale-11 shadow-[0_1px_2px_rgba(28,22,16,0.04)] transition-[background-color,border-color,color,transform] duration-150 ease-[cubic-bezier(0.2,0,0,1)] hover:border-grayscale-5 hover:bg-grayscale-2 hover:text-grayscale-12 active:scale-[0.96] dark:bg-grayscale-2 dark:hover:bg-grayscale-3"
				>
					← Mi página
				</Link>
				<DjSelect value={dj.slug} onValueChange={setDj} />
				<OpenPublicPageButton href={pageUrl} />
			</PageHeader>

			{!customDomain ? (
				<EmptyState
					icon={<Globe size={22} />}
					title="Todavía no tenés un dominio propio conectado"
					description="Conectá el dominio que compraste en Cloudflare, GoDaddy, Name.com u otro registrador para publicar tu página con tu marca."
					action={
						<ConnectDomainModal
							fixedSlug={dj.slug}
							triggerText={t("djDomain.connectDomain", "Conectar dominio")}
							onConnected={() => window.location.reload()}
						/>
					}
				/>
			) : (
				<div className="space-y-6">
					{/* Main Domain Card */}
					<div className="card p-7 shadow-xs space-y-6">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-grayscale-3/70 dark:border-white/[0.08]">
							<div className="space-y-1.5 min-w-0">
								<div className="flex items-center gap-2 flex-wrap">
									<span className="font-mono text-base font-semibold text-grayscale-12 break-all">
										{customDomain}
									</span>
									<StatusBadge
										tone={scan?.pointsToGigBlade ? "emerald" : "amber"}
									>
										{scan?.pointsToGigBlade ? "CONECTADO" : "PENDIENTE DNS"}
									</StatusBadge>
								</div>
								<p className="text-xs text-grayscale-9">
									{scan?.pointsToGigBlade
										? "Tu dominio apunta correctamente a GigBlades con HTTPS activo."
										: "Agregá los registros DNS abajo en tu registrador y luego verificá."}
								</p>
							</div>

							<div className="flex flex-wrap items-center gap-2 shrink-0">
								<PanelButton
									variant="primary"
									size="sm"
									disabled={isVerifying || isChecking}
									onClick={() => void handleVerify()}
								>
									<RefreshCw
										size={13}
										className={isVerifying || isChecking ? "animate-spin" : ""}
									/>
									<span>
										{isVerifying ? "Verificando…" : "Verificar DNS"}
									</span>
								</PanelButton>
								<ConnectDomainModal
									fixedSlug={dj.slug}
									initialDomain={customDomain}
									triggerText={t("djDomain.changeDomain", "Cambiar dominio")}
									triggerVariant="secondary"
									onConnected={() => window.location.reload()}
								/>
								<PanelButton
									variant="secondary"
									size="sm"
									onClick={() => setDeleteDialogOpen(true)}
									className="text-red-600 hover:bg-red-50/70 hover:border-red-200"
								>
									<Trash2 size={13} />
									<span>Desconectar</span>
								</PanelButton>
							</div>
						</div>

						{/* Registrar Selector */}
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 surface-soft">
							<div className="flex items-center gap-2.5">
								<ProviderBrandLogo
									provider={selectedProvider}
									className="w-5 h-5 shrink-0"
								/>
								<div>
									<span className="text-[11px] font-semibold text-grayscale-8 uppercase tracking-wider block">
										Registrador de dominio
									</span>
									<p className="text-xs font-semibold text-grayscale-12">
										{activeProvider?.label}
									</p>
								</div>
							</div>

							<div className="flex flex-wrap items-center gap-2">
								<select
									value={selectedProvider}
									onChange={(e) =>
										handleSelectProvider(e.target.value as ProviderId)
									}
									className={`${INPUT_CLASS} w-auto bg-grayscale-1 dark:bg-[#1b1b1a] py-1.5`}
								>
									{DOMAIN_PROVIDERS.map((p) => (
										<option key={p.id} value={p.id}>
											{p.label}
										</option>
									))}
								</select>
								{activeProvider?.url ? (
									<a
										href={activeProvider.url}
										target="_blank"
										rel="noreferrer"
										className="inline-flex h-8 items-center gap-1 px-3 border border-grayscale-4 bg-grayscale-1 hover:bg-grayscale-2 text-[12px] font-medium text-grayscale-11 hover:text-grayscale-12 dark:bg-grayscale-2 dark:hover:bg-grayscale-3 rounded-md shadow-[0_1px_2px_rgba(28,22,16,0.04)] transition-colors"
									>
										<ExternalLink size={12} />
										<span>Abrir {activeProvider.label}</span>
									</a>
								) : null}
							</div>
						</div>

						{/* DNS Records */}
						<div className="space-y-3">
							<span className="text-[11px] font-semibold text-grayscale-8 uppercase tracking-wider block">
								Registros DNS requeridos
							</span>
							<div className="space-y-2">
								{activeRecords.map((rec, idx) => (
									<div
										key={`${rec.type}-${rec.name}-${idx}`}
										className="p-3.5 surface-soft flex flex-col sm:flex-row sm:items-center justify-between gap-3"
									>
										<div className="flex flex-wrap items-center gap-3 text-xs font-mono">
											<span className="px-2 py-0.5 bg-grayscale-1 border border-grayscale-4 dark:bg-[#1b1b1a] dark:border-white/[0.1] rounded-md font-bold text-grayscale-11">
												{rec.type}
											</span>
											<div>
												<span className="text-[10px] font-sans font-semibold text-grayscale-8 uppercase block">
													Nombre / Host
												</span>
												<span className="font-semibold text-grayscale-12">
													{rec.name}
												</span>
											</div>
											<div>
												<span className="text-[10px] font-sans font-semibold text-grayscale-8 uppercase block">
													Valor / Destino
												</span>
												<span className="font-semibold text-grayscale-12 break-all">
													{rec.value}
												</span>
											</div>
										</div>
										<div className="flex items-center gap-1.5 shrink-0">
											<CopyButton text={rec.name} label="Host" />
											<CopyButton text={rec.value} label="Valor" />
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Provider Tip */}
						<div className="p-4 bg-blue-3/50 border border-blue-6/50 rounded-xl flex items-start gap-2.5 text-xs text-blue-12 leading-relaxed">
							<Info size={15} className="text-sky-600 shrink-0 mt-0.5" />
							<span>{providerTip[selectedProvider]}</span>
						</div>
					</div>
				</div>
			)}

			<PanelModal
				open={deleteDialogOpen}
				onClose={() => {
					if (!isDeleting) setDeleteDialogOpen(false);
				}}
				title={`Desconectar ${customDomain ?? ""}`}
				description="Tu página dejará de responder en este dominio personalizado hasta que vuelvas a vincularlo."
			>
				<div className="flex justify-end gap-2 pt-2">
					<PanelButton
						variant="ghost"
						onClick={() => setDeleteDialogOpen(false)}
						disabled={isDeleting}
					>
						Cancelar
					</PanelButton>
					<PanelButton
						variant="danger"
						onClick={() => void handleDeleteDomain()}
						disabled={isDeleting}
					>
						{isDeleting ? "Desconectando…" : "Confirmar desconexión"}
					</PanelButton>
				</div>
			</PanelModal>
		</PageContainer>
	);
}
