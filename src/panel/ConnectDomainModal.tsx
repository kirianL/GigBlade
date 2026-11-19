"use client";

import { useState, type ReactNode } from "react";
import { ExternalLink, Globe, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { usePlatformDjs } from "@/panel/usePlatformDjs";
import { usePlatformDomains } from "@/panel/usePlatformDomains";
import type { DomainDnsScanResult } from "@/panel/site-api";
import { ProviderBrandLogo } from "@/panel/ProviderLogos";
import { useLanguage } from "@/panel/LanguageProvider";
import {
	CopyButton,
	INPUT_CLASS,
	PanelButton,
	PanelInput,
	PanelModal,
	StatusBadge,
} from "@/panel/ui";

export function ConnectDomainModal({
	onConnected,
	initialSlug,
	fixedSlug,
	initialDomain,
	triggerText,
	triggerVariant = "primary",
	triggerClassName,
	triggerIcon,
}: {
	onConnected?: () => void;
	initialSlug?: string;
	fixedSlug?: string;
	initialDomain?: string;
	triggerText?: string;
	triggerVariant?: "primary" | "secondary";
	triggerClassName?: string;
	triggerIcon?: ReactNode;
}) {
	const { t } = useLanguage();
	const [open, setOpen] = useState(false);
	const [domain, setDomain] = useState(initialDomain || "");
	const [selectedSlug, setSelectedSlug] = useState(fixedSlug || initialSlug || "");
	const [scanResult, setScanResult] = useState<DomainDnsScanResult | null>(null);
	const [selectedProvider, setSelectedProvider] = useState<string>("cloudflare");

	const effectiveTriggerText =
		triggerText ||
		(fixedSlug
			? t("modal.connectMyDomain", "Conectar mi dominio")
			: t("modal.connectDomain", "Conectar dominio"));

	const { djs } = usePlatformDjs();
	const { assignDomain, isAssigning, scanDomain, isScanning } =
		usePlatformDomains();

	const handleScan = async () => {
		if (!domain.trim()) return;
		try {
			const clean = domain
				.trim()
				.toLowerCase()
				.replace(/^https?:\/\//, "")
				.replace(/\/.*$/, "");
			setDomain(clean);
			const res = await scanDomain(clean);
			setScanResult(res);
			if (res.provider && res.provider !== "other") {
				setSelectedProvider(res.provider);
			}
		} catch {
			toast.error("No se pudo escanear el dominio. Verificá que sea válido.");
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedSlug) {
			toast.error("Seleccioná un DJ para asignar el dominio.");
			return;
		}
		if (!domain.trim()) {
			toast.error("Ingresá el dominio a conectar.");
			return;
		}
		try {
			const clean = domain.trim().toLowerCase();
			await assignDomain({ slug: selectedSlug, domain: clean });
			if (typeof window !== "undefined") {
				window.localStorage.setItem(
					`gigblade_provider_${clean}`,
					selectedProvider,
				);
			}
			toast.success(`Dominio ${clean} vinculado.`);
			setOpen(false);
			setDomain("");
			setScanResult(null);
			onConnected?.();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Error al vincular el dominio.",
			);
		}
	};

	return (
		<>
			<PanelButton
				variant={triggerVariant}
				size="sm"
				className={triggerClassName}
				onClick={() => {
					if (fixedSlug || initialSlug) {
						setSelectedSlug(fixedSlug || initialSlug || "");
					}
					if (initialDomain && !domain) {
						setDomain(initialDomain);
					}
					setOpen(true);
				}}
			>
				{triggerIcon !== undefined ? triggerIcon : <Plus size={13} />}
				<span>{effectiveTriggerText}</span>
			</PanelButton>

			<PanelModal
				open={open}
				onClose={() => setOpen(false)}
				title={
					fixedSlug
						? t("modal.connectMyDomain", "Conectar mi dominio")
						: t("modal.connectDomain", "Conectar dominio")
				}
				description={
					fixedSlug
						? t(
								"modal.descFixed",
								"Configurá tu dominio propio para que tu página responda con tu marca.",
							)
						: t(
								"modal.descPlatform",
								"Configurá el enrutamiento DNS para el dominio propio del DJ.",
							)
				}
			>
				<form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
					{!fixedSlug ? (
						<div>
							<label className="block text-xs font-semibold text-grayscale-11 mb-1.5">
								{t("modal.assignedDj", "DJ asignado")} *
							</label>
							<select
								value={selectedSlug}
								onChange={(e) => setSelectedSlug(e.target.value)}
								className={INPUT_CLASS}
								required
							>
								<option value="">
									{t("modal.selectDj", "Seleccioná un DJ…")}
								</option>
								{djs.map((dj) => (
									<option key={dj.slug} value={dj.slug}>
										{dj.name} ({dj.slug}){dj.domain ? ` · ${dj.domain}` : ""}
									</option>
								))}
							</select>
						</div>
					) : null}

					<div>
						<label className="block text-xs font-semibold text-grayscale-11 mb-1.5">
							{t("modal.domain", "Dominio")} *
						</label>
						<div className="flex gap-2 items-center">
							<PanelInput
								placeholder={t("modal.domainPlaceholder", "ej. itshndrxx.com")}
								value={domain}
								onChange={(e) => setDomain(e.target.value)}
								className="font-mono flex-1"
								required
							/>
							<PanelButton
								variant="secondary"
								onClick={() => void handleScan()}
								disabled={!domain.trim() || isScanning}
							>
								<RefreshCw
									size={13}
									className={isScanning ? "animate-spin" : ""}
								/>
								<span>
									{isScanning
										? t("modal.scanning", "Escaneando")
										: t("modal.scan", "Escanear")}
								</span>
							</PanelButton>
						</div>
					</div>

					<div>
						<label className="block text-xs font-semibold text-grayscale-11 mb-1.5">
							{t("modal.registrarLabel", "Registrador donde compraste el dominio")}
						</label>
						<select
							value={selectedProvider}
							onChange={(e) => setSelectedProvider(e.target.value)}
							className={INPUT_CLASS}
						>
							<option value="cloudflare">Cloudflare</option>
							<option value="godaddy">GoDaddy</option>
							<option value="namecom">Name.com</option>
							<option value="namecheap">Namecheap</option>
							<option value="google">Google Domains</option>
							<option value="vercel">Vercel DNS</option>
							<option value="other">Otro / Registrador externo</option>
						</select>
					</div>

					{scanResult ? (
						<div className="surface-soft p-4 space-y-3">
							<div className="flex items-center justify-between gap-2">
								<div className="flex items-center gap-2 min-w-0">
									<ProviderBrandLogo
										provider={scanResult.provider}
										nameserverDomain={
											scanResult.nameservers[0]
												? scanResult.nameservers[0]
														.split(".")
														.slice(-2)
														.join(".")
												: undefined
										}
										className="w-4 h-4 shrink-0"
									/>
									<span className="text-xs font-semibold text-grayscale-12 truncate">
										{scanResult.providerLabel}
									</span>
								</div>
								<StatusBadge
									tone={scanResult.pointsToGigBlade ? "emerald" : "amber"}
								>
									{scanResult.pointsToGigBlade ? "DNS OK" : "PENDIENTE DNS"}
								</StatusBadge>
							</div>

							{scanResult.recommendedRecords.length > 0 ? (
								<div className="space-y-2">
									<span className="text-[10px] font-semibold text-grayscale-8 uppercase tracking-wider block">
										Registros DNS requeridos
									</span>
									{scanResult.recommendedRecords.map((rec, idx) => (
										<div
											key={`${rec.type}-${rec.name}-${idx}`}
											className="flex items-center justify-between gap-2 p-2.5 bg-grayscale-1 border border-grayscale-3 dark:bg-[#1b1b1a] dark:border-white/[0.08] rounded-xl text-xs"
										>
											<div className="flex items-center gap-2 min-w-0">
												<span className="font-mono font-bold text-[10px] px-1.5 py-0.5 bg-grayscale-2 rounded text-grayscale-11">
													{rec.type}
												</span>
												<span className="font-mono text-grayscale-10">
													{rec.name}
												</span>
												<span className="text-grayscale-6">→</span>
												<span className="font-mono font-semibold text-grayscale-12 truncate">
													{rec.value}
												</span>
											</div>
											<CopyButton text={rec.value} />
										</div>
									))}
								</div>
							) : null}

							{scanResult.oneClickUrl ? (
								<a
									href={scanResult.oneClickUrl}
									target="_blank"
									rel="noreferrer"
									className="inline-flex items-center gap-1.5 text-xs font-semibold text-grayscale-12 hover:underline"
								>
									<ExternalLink size={12} />
									<span>Abrir configuración 1-clic en {scanResult.providerLabel}</span>
								</a>
							) : null}
						</div>
					) : null}

					<div className="pt-3 border-t border-grayscale-3/70 dark:border-white/[0.08] flex items-center justify-end gap-2">
						<PanelButton variant="ghost" onClick={() => setOpen(false)}>
							Cancelar
						</PanelButton>
						<PanelButton type="submit" disabled={isAssigning}>
							<Globe size={13} />
							<span>{isAssigning ? "Conectando…" : "Vincular dominio"}</span>
						</PanelButton>
					</div>
				</form>
			</PanelModal>
		</>
	);
}
