import { Button, PageContainer, PageHeader } from "@autumn/ui";
import {
	ArrowsClockwiseIcon,
	ShieldCheckIcon,
	WarningCircleIcon,
	XCircleIcon,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { djDomainLabel, djPublicUrl, formatLastVisit } from "@/gigblade/concept";
import {
	fetchPlatformSiteHealth,
	type PlatformSiteAudit,
	type PlatformSiteAuditReport,
	type SiteHealthLevel,
} from "@/gigblade/site-api";
import { MetricCard, OpenPublicPageButton } from "@/gigblade/ui";

const LEVEL_LABEL: Record<SiteHealthLevel, string> = {
	ok: "OK",
	warn: "Atención",
	critical: "Crítico",
};

const LEVEL_CLASS: Record<SiteHealthLevel, string> = {
	ok: "text-emerald-600 dark:text-emerald-400",
	warn: "text-amber-600 dark:text-amber-400",
	critical: "text-destructive",
};

function LevelIcon({ level }: { level: SiteHealthLevel }) {
	if (level === "ok") {
		return (
			<ShieldCheckIcon size={16} weight="fill" className={LEVEL_CLASS.ok} aria-hidden />
		);
	}
	if (level === "warn") {
		return (
			<WarningCircleIcon
				size={16}
				weight="fill"
				className={LEVEL_CLASS.warn}
				aria-hidden
			/>
		);
	}
	return <XCircleIcon size={16} weight="fill" className={LEVEL_CLASS.critical} aria-hidden />;
}

function AuditRow({ site }: { site: PlatformSiteAudit }) {
	const issues = site.checks.filter((check) => check.level !== "ok");
	const pageUrl = djPublicUrl({ slug: site.slug, domain: site.domain });
	const domainLabel = djDomainLabel({ domain: site.domain });

	return (
		<li className="border rounded-lg bg-interactive-secondary p-4 sm:p-5 flex flex-col gap-3">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="min-w-0">
					<div className="flex items-center gap-2">
						<LevelIcon level={site.overall} />
						<p className="text-sm font-medium text-foreground truncate">
							{site.displayName}
						</p>
						<span
							className={`text-xs font-medium ${LEVEL_CLASS[site.overall]}`}
						>
							{LEVEL_LABEL[site.overall]}
						</span>
					</div>
					<p className="mt-1 font-mono text-sm text-foreground break-all">
						{domainLabel}
					</p>
					<p className="mt-1 text-xs text-tertiary-foreground">
						Tenant {site.tenantStatus} · Ruta{" "}
						{site.routeStatus === "missing" ? "ausente" : site.routeStatus}
					</p>
				</div>
				<div className="flex flex-wrap gap-2 shrink-0">
					<OpenPublicPageButton href={pageUrl} />
					<Button variant="secondary" size="sm" asChild>
						<Link to={`/studio?dj=${site.slug}`}>Panel DJ</Link>
					</Button>
					<Button variant="secondary" size="sm" asChild>
						<Link to={`/studio/content?dj=${site.slug}`}>Contenido</Link>
					</Button>
				</div>
			</div>
			{issues.length > 0 ? (
				<ul className="flex flex-col gap-2 border-t pt-3">
					{issues.map((check) => (
						<li key={check.id} className="text-sm leading-6">
							<span className={`font-medium ${LEVEL_CLASS[check.level]}`}>
								{check.label}
							</span>
							<span className="text-tertiary-foreground"> — {check.detail}</span>
						</li>
					))}
				</ul>
			) : (
				<p className="text-sm text-tertiary-foreground border-t pt-3">
					Todos los controles pasaron.
				</p>
			)}
		</li>
	);
}

export default function PlatformSiteHealth() {
	const query = useQuery({
		queryKey: ["platform", "site-health"],
		queryFn: ({ signal }) => fetchPlatformSiteHealth(signal),
		staleTime: 60_000,
		gcTime: 5 * 60_000,
		refetchOnMount: false,
		refetchOnWindowFocus: false,
	});
	const report = query.data?.report ?? null;
	const loadError = query.data?.error ?? null;
	const status: "loading" | "ready" | "error" = query.isPending
		? "loading"
		: report
			? "ready"
			: "error";
	const refreshing = query.isFetching && !query.isPending;
	const load = (_manual?: boolean) => query.refetch();

	const totals = report?.totals ?? { ok: 0, warn: 0, critical: 0 };
	const checkedAt = report?.checkedAt
		? formatLastVisit(report.checkedAt)
		: "Sin datos";

	return (
		<PageContainer>
			<div className="flex items-start justify-between gap-4">
				<PageHeader
					icon={
						<ShieldCheckIcon
							size={16}
							weight="fill"
							className="text-subtle"
							aria-hidden
						/>
					}
					title="Estado de páginas"
				/>
				<Button
					variant="secondary"
					size="sm"
					onClick={() => void load(true)}
					disabled={refreshing || status === "loading"}
				>
					<ArrowsClockwiseIcon size={16} aria-hidden />
					{refreshing ? "Auditando…" : "Auditar de nuevo"}
				</Button>
			</div>
			<p className="text-sm text-tertiary-foreground leading-6 -mt-2 max-w-3xl">
				Revisión de enrutamiento, API pública, acceso al panel, contacto visible y
				enlaces inseguros. Última corrida: {checkedAt}.
			</p>

			<div className="grid gap-3 sm:grid-cols-3">
				<MetricCard
					icon={
						<ShieldCheckIcon size={20} className="text-emerald-500" aria-hidden />
					}
					label="Sin alertas"
					value={String(totals.ok)}
					suffix="páginas"
				/>
				<MetricCard
					icon={
						<WarningCircleIcon size={20} className="text-amber-500" aria-hidden />
					}
					label="Atención"
					value={String(totals.warn)}
					suffix="páginas"
				/>
				<MetricCard
					icon={<XCircleIcon size={20} className="text-destructive" aria-hidden />}
					label="Crítico"
					value={String(totals.critical)}
					suffix="páginas"
				/>
			</div>

			{status === "loading" ? (
				<p className="sr-only" role="status">
					Auditando sitios
				</p>
			) : null}
			{status === "error" ? (
				<p className="text-sm text-destructive" role="alert">
					{loadError ??
						"No se pudo cargar la auditoría. Revisá la sesión de plataforma y la API."}
				</p>
			) : null}
			{status === "ready" && report ? (
				<ul className="flex flex-col gap-3">
					{report.sites.length === 0 ? (
						<li className="border rounded-lg p-4 text-sm text-tertiary-foreground">
							No hay DJs para auditar.
						</li>
					) : (
						report.sites.map((site) => <AuditRow key={site.slug} site={site} />)
					)}
				</ul>
			) : null}
		</PageContainer>
	);
}
