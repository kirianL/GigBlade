"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
	BarChart3,
	FileEdit,
	Globe,
	KeyRound,
	Mail,
} from "lucide-react";
import {
	djDomainLabel,
	djEditorPageUrl,
	djInstagramUrl,
	djIntendedDomain,
	djMailto,
	djTemplateLabel,
	formatLastVisit,
	formatVisitCount,
	PLAN,
} from "@/panel/concept";
import { fetchSiteVisits, type SiteVisitStats } from "@/panel/site-api";
import { GenerateDjPasswordButton } from "@/panel/GenerateDjPassword";
import { InstallDesktopCard } from "@/panel/InstallDesktop";
import { DeleteDjButton } from "@/panel/DeleteDjButton";
import { ConnectDomainModal } from "@/panel/ConnectDomainModal";
import { useDjProfile } from "@/panel/useDjContent";
import { useSession } from "@/panel/auth-client";
import { useLanguage } from "@/panel/LanguageProvider";
import {
	CopyButton,
	DjSelect,
	DjStatusCell,
	OpenPublicPageButton,
	PageContainer,
	PageHeader,
	StatusBadge,
} from "@/panel/ui";

export default function DjStudioPage() {
	const { dj, setDj, draft, visitsReady } = useDjProfile();
	const { data: session } = useSession();
	const { t } = useLanguage();
	const router = useRouter();
	const isPlatform =
		(session?.user as { role?: string } | undefined)?.role === "platform";

	const pageUrl = djEditorPageUrl(dj);
	const domainLabel = djDomainLabel(dj);
	const instagramUrl = djInstagramUrl(dj);
	const mailUrl = djMailto(dj);
	const contentHref = `/studio/content?dj=${dj.slug}`;
	const visitsHref = `/studio/visitas?dj=${dj.slug}`;
	const intendedDomain = djIntendedDomain(dj);
	const [visits, setVisits] = useState<SiteVisitStats | null>(null);

	useEffect(() => {
		if (!visitsReady) return;
		const controller = new AbortController();
		void fetchSiteVisits(dj.slug, controller.signal).then(setVisits);
		return () => controller.abort();
	}, [dj.slug, visitsReady]);

	return (
		<PageContainer>
			<PageHeader
				title={dj.name}
				subtitle={`Estudio de página pública • Plantilla ${djTemplateLabel(draft.template)}`}
				badge={<DjStatusCell status={dj.status} />}
			>
				<DjSelect value={dj.slug} onValueChange={setDj} />
				<OpenPublicPageButton
					href={pageUrl}
					label={
						pageUrl?.includes(".localhost")
							? t("action.viewTemplate", "Ver plantilla")
							: t("action.openPage", "Abrir página")
					}
				/>
				<Link
					href={contentHref}
					className="inline-flex h-9 items-center gap-1.5 px-3.5 bg-grayscale-12 hover:bg-grayscale-11 text-grayscale-1 text-[12.5px] font-medium rounded-md shadow-[0_1px_2px_rgba(28,22,16,0.14)] transition-colors"
				>
					<FileEdit size={13} />
					<span>{t("action.editContent", "Editar contenido")}</span>
				</Link>
			</PageHeader>

			{!isPlatform ? <InstallDesktopCard /> : null}

			{/* Top 2 summary cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				{/* Dominio */}
				<section className="card p-6 shadow-xs flex flex-col justify-between gap-4">
					<div className="space-y-2">
						<div className="flex items-center justify-between gap-2">
							<span className="text-[11px] font-semibold text-grayscale-8 uppercase tracking-wider flex items-center gap-1.5">
								<Globe size={13} />
								Dominio propio
							</span>
							<StatusBadge tone={intendedDomain ? "emerald" : "neutral"}>
								{intendedDomain ? "CONECTADO" : "SIN CONECTAR"}
							</StatusBadge>
						</div>
						<p className="font-mono text-sm font-semibold text-grayscale-12 break-all">
							{intendedDomain ??
								(pageUrl ? "GigBlades Preview" : "Sin dominio asignado")}
						</p>
						<p className="text-xs text-grayscale-9 leading-relaxed">
							{intendedDomain
								? `Tu página oficial responde en ${intendedDomain}. Podés verificar o cambiar el dominio cuando quieras.`
								: "Conectá tu propio dominio comprado en Cloudflare, GoDaddy u otro registrador."}
						</p>
					</div>

					<div className="flex flex-wrap items-center gap-2 pt-3 border-t border-grayscale-3/70 dark:border-white/[0.08]">
						<ConnectDomainModal
							fixedSlug={dj.slug}
							triggerText={
								intendedDomain
									? "Cambiar o verificar dominio"
									: "Conectar dominio propio"
							}
							triggerVariant={intendedDomain ? "secondary" : "primary"}
							onConnected={() => window.location.reload()}
						/>
						{pageUrl ? <CopyButton text={pageUrl} label="Copiar link" /> : null}
					</div>
				</section>

				{/* Visitas */}
				<section className="card p-6 shadow-xs flex flex-col justify-between gap-4">
					<div className="space-y-2">
						<span className="text-[11px] font-semibold text-grayscale-8 uppercase tracking-wider flex items-center gap-1.5">
							<BarChart3 size={13} />
							Visitantes este mes
						</span>
						<p className="text-4xl font-bold tracking-tight text-grayscale-12 tabular-nums">
							{(visits?.uniqueVisitors ?? 0).toLocaleString("es-CR")}
						</p>
						<p className="text-xs text-grayscale-9">
							{formatVisitCount(visits?.uniqueVisitors ?? 0)} •{" "}
							{formatLastVisit(visits?.lastVisitedAt ?? null)}
						</p>
					</div>

					<div className="pt-3 border-t border-grayscale-3/70 dark:border-white/[0.08]">
						<Link
							href={visitsHref}
							className="inline-flex h-8 items-center gap-1.5 px-3 border border-grayscale-4 bg-grayscale-1 hover:bg-grayscale-2 text-[12px] font-medium text-grayscale-11 hover:text-grayscale-12 dark:bg-grayscale-2 dark:hover:bg-grayscale-3 rounded-md shadow-[0_1px_2px_rgba(28,22,16,0.04)] transition-colors"
						>
							<span>{t("action.viewVisits", "Ver detalle de visitas")} →</span>
						</Link>
					</div>
				</section>
			</div>

			{/* Ficha de perfil */}
			<section className="card p-7 shadow-xs space-y-5">
				<div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-grayscale-3/70 dark:border-white/[0.08]">
					<div>
						<span className="text-[11px] font-semibold text-grayscale-8 uppercase tracking-wider block">
							Resumen de perfil público
						</span>
						<h2 className="text-sm font-semibold text-grayscale-12 mt-1">
							{domainLabel}
						</h2>
					</div>
					<StatusBadge tone="sky" dot={false}>
						{djTemplateLabel(draft.template)}
					</StatusBadge>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div className="p-3.5 surface-soft">
						<span className="text-[11px] font-semibold text-grayscale-8 uppercase tracking-wider block">
							Ciudad
						</span>
						<p className="text-xs font-semibold text-grayscale-12 mt-1">
							{draft.city || "Sin ciudad"}
						</p>
					</div>
					<div className="p-3.5 surface-soft">
						<span className="text-[11px] font-semibold text-grayscale-8 uppercase tracking-wider block">
							Instagram
						</span>
						{dj.instagram ? (
							<a
								href={instagramUrl}
								target="_blank"
								rel="noreferrer"
								className="text-xs font-semibold text-grayscale-12 hover:underline mt-1 inline-block"
							>
								{dj.instagram}
							</a>
						) : (
							<p className="text-xs text-grayscale-9 mt-1">Sin Instagram</p>
						)}
					</div>
				</div>

				<div>
					<span className="text-[11px] font-semibold text-grayscale-8 uppercase tracking-wider block mb-2">
						Biografía
					</span>
					<div className="p-4 surface-soft text-xs text-grayscale-11 leading-relaxed">
						{draft.bio || "Todavía no hay biografía cargada."}
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2 pt-2 border-t border-grayscale-3/70 dark:border-white/[0.08]">
					{dj.email ? (
						<a
							href={mailUrl}
							className="inline-flex h-8 items-center gap-1.5 px-3 border border-grayscale-4 bg-grayscale-1 hover:bg-grayscale-2 text-[12px] font-medium text-grayscale-11 hover:text-grayscale-12 dark:bg-grayscale-2 dark:hover:bg-grayscale-3 rounded-md shadow-[0_1px_2px_rgba(28,22,16,0.04)] transition-colors"
						>
							<Mail size={12} />
							<span>{dj.email}</span>
						</a>
					) : null}
					<Link
						href={contentHref}
						className="inline-flex h-8 items-center px-3.5 bg-grayscale-12 hover:bg-grayscale-11 text-grayscale-1 text-[12px] font-medium rounded-md shadow-[0_1px_2px_rgba(28,22,16,0.14)] transition-colors"
					>
						Completar perfil →
					</Link>
				</div>
			</section>

			{/* Controles de plataforma */}
			{isPlatform ? (
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<section className="card p-6 shadow-xs space-y-4">
						<div className="flex items-start justify-between gap-2">
							<div>
								<span className="text-[11px] font-semibold text-grayscale-8 uppercase tracking-wider block">
									Acceso al panel
								</span>
								<p className="text-xs font-semibold text-grayscale-12 mt-1 break-all">
									{dj.email}
								</p>
							</div>
							<KeyRound size={15} className="text-grayscale-8 shrink-0" />
						</div>
						<p className="text-xs text-grayscale-9 leading-relaxed">
							Generá una nueva contraseña y pasásela al DJ. La anterior deja de
							servir inmediatamente.
						</p>
						<div className="flex flex-wrap gap-2 pt-2 border-t border-grayscale-3/70 dark:border-white/[0.08]">
							<GenerateDjPasswordButton
								slug={dj.slug}
								email={dj.email}
								name={dj.name}
							/>
							<DeleteDjButton
								slug={dj.slug}
								name={dj.name}
								onDeleted={() => router.push("/djs")}
							/>
						</div>
					</section>

					<section className="card p-6 shadow-xs space-y-3">
						<div className="flex items-center justify-between gap-2">
							<span className="text-[11px] font-semibold text-grayscale-8 uppercase tracking-wider">
								Plan suscrito
							</span>
							<DjStatusCell status={dj.status} />
						</div>
						<p className="text-sm font-semibold text-grayscale-12">
							{PLAN.name} · US${PLAN.setupUsd} setup + US${PLAN.priceUsd}/mes
						</p>
						<p className="text-xs text-grayscale-9 leading-relaxed">
							Incluye la página personalizable, seguridad, hosting y este panel
							para editar contenido y contrataciones.
						</p>
					</section>
				</div>
			) : null}
		</PageContainer>
	);
}
