"use client";

import {
  ArrowsClockwiseIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  WarningCircleIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { djDomainLabel, djPublicUrl, formatLastVisit } from "@/panel/concept";
import { Skeleton } from "@/panel/Skeleton";
import {
  fetchPlatformSiteHealth,
  type PlatformSiteAudit,
  type SiteHealthLevel,
} from "@/panel/site-api";
import {
  DistributionBar,
  EmptyState,
  MetricCard,
  OpenPublicPageButton,
  PageContainer,
  PageHeader,
  PanelButton,
  SegmentedControl,
  StatusBadge,
} from "@/panel/ui";

const LEVEL_TONE: Record<SiteHealthLevel, "emerald" | "amber" | "red"> = {
  ok: "emerald",
  warn: "amber",
  critical: "red",
};

const LEVEL_LABEL: Record<SiteHealthLevel, string> = {
  ok: "OK",
  warn: "Atención",
  critical: "Crítico",
};

function AuditCard({ site }: { site: PlatformSiteAudit }) {
  const issues = site.checks.filter((check) => check.level !== "ok");
  const pageUrl = djPublicUrl({ slug: site.slug, domain: site.domain });
  const domainLabel = djDomainLabel({ domain: site.domain });

  return (
    <article className="card-shell card-shell-hover">
      <div className="card-panel p-4 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-[14.5px] font-semibold tracking-[-0.01em] text-grayscale-12">
                {site.displayName}
              </h3>
              <StatusBadge tone={LEVEL_TONE[site.overall]}>
                {LEVEL_LABEL[site.overall]}
              </StatusBadge>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 font-mono text-[11px] text-grayscale-9">
              <span>@{site.slug}</span>
              <span className="text-grayscale-5 dark:text-white/20">|</span>
              <span className="break-all text-grayscale-11">{domainLabel}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <OpenPublicPageButton href={pageUrl} />
            <Link
              href={`/studio?dj=${site.slug}`}
              className="inline-flex h-8 items-center rounded-md border border-grayscale-4 bg-grayscale-1 px-3 text-[12px] font-medium text-grayscale-11 hover:bg-grayscale-2 hover:text-grayscale-12 dark:bg-grayscale-2"
            >
              Panel DJ
            </Link>
            <Link
              href={`/studio/content?dj=${site.slug}`}
              className="inline-flex h-8 items-center rounded-md bg-grayscale-12 px-3 text-[12px] font-medium text-grayscale-1 hover:bg-grayscale-11"
            >
              Contenido
            </Link>
          </div>
        </div>

        {issues.length > 0 ? (
          <div className="surface-soft space-y-2 p-3">
            {issues.map((check) => (
              <div
                key={check.id}
                className="flex items-start gap-2 text-[12px]"
              >
                {check.level === "critical" ? (
                  <XCircleIcon
                    size={14}
                    weight="fill"
                    className="mt-0.5 shrink-0 text-red-9"
                  />
                ) : (
                  <WarningCircleIcon
                    size={14}
                    weight="fill"
                    className="mt-0.5 shrink-0 text-amber-9"
                  />
                )}
                <p className="leading-relaxed">
                  <span className="font-semibold text-grayscale-12">
                    {check.label}:
                  </span>{" "}
                  <span className="text-grayscale-10">{check.detail}</span>
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl bg-green-3/60 px-3 py-2 text-[12px] font-medium text-green-11">
            <CheckCircleIcon
              size={14}
              weight="fill"
              className="shrink-0 text-green-9"
            />
            <span>Todos los controles pasaron correctamente.</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 font-mono text-[11px] text-grayscale-9">
        <span>
          Tenant {site.tenantStatus} | Ruta{" "}
          {site.routeStatus === "missing" ? "ausente" : site.routeStatus}
        </span>
        <span>{site.checks.length} controles</span>
      </div>
    </article>
  );
}

export default function PlatformSiteHealth() {
  const [filter, setFilter] = useState<"all" | SiteHealthLevel>("all");

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

  const totals = report?.totals ?? { ok: 0, warn: 0, critical: 0 };
  const totalSites = totals.ok + totals.warn + totals.critical;
  const pctOk = totalSites > 0 ? (totals.ok / totalSites) * 100 : 0;
  const pctWarn = totalSites > 0 ? (totals.warn / totalSites) * 100 : 0;
  const pctCritical = totalSites > 0 ? (totals.critical / totalSites) * 100 : 0;
  const checkedAt = report?.checkedAt
    ? formatLastVisit(report.checkedAt)
    : "Sin datos";

  const visibleSites = (report?.sites ?? []).filter(
    (site) => filter === "all" || site.overall === filter,
  );

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Operación"
        title="Estado de páginas"
        subtitle={`Revisión de enrutamiento, API pública y enlaces seguros. Última corrida: ${checkedAt}.`}
      >
        <PanelButton
          variant="secondary"
          size="sm"
          onClick={() => void query.refetch()}
          disabled={refreshing || status === "loading"}
        >
          <ArrowsClockwiseIcon
            size={14}
            className={refreshing ? "animate-spin" : ""}
          />
          <span>{refreshing ? "Auditando…" : "Auditar de nuevo"}</span>
        </PanelButton>
      </PageHeader>

      <section className="stagger grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard
          label="Sin alertas"
          value={totals.ok}
          tone="emerald"
          ratio={totalSites > 0 ? totals.ok / totalSites : 0}
          icon={ShieldCheckIcon}
          delay={0}
          footer={<span>Operando sin observaciones</span>}
        />
        <MetricCard
          label="Atención"
          value={totals.warn}
          tone="amber"
          ratio={totalSites > 0 ? totals.warn / totalSites : 0}
          icon={WarningCircleIcon}
          delay={1}
          footer={<span>Requieren revisión menor</span>}
        />
        <MetricCard
          label="Crítico"
          value={totals.critical}
          tone="red"
          ratio={totalSites > 0 ? totals.critical / totalSites : 0}
          icon={XCircleIcon}
          delay={2}
          footer={<span>Errores de disponibilidad o ruta</span>}
        />
      </section>

      {totalSites > 0 ? (
        <DistributionBar
          title={`Salud operativa (${totalSites} páginas)`}
          subtitle="Auditoría automática"
          segments={[
            {
              key: "ok",
              label: "OK",
              count: totals.ok,
              percent: pctOk,
              barClass: "bg-green-9",
              cardClass: "",
              labelClass: "",
              valueClass: "",
            },
            {
              key: "warn",
              label: "Atención",
              count: totals.warn,
              percent: pctWarn,
              barClass: "bg-amber-9",
              cardClass: "",
              labelClass: "",
              valueClass: "",
            },
            {
              key: "critical",
              label: "Crítico",
              count: totals.critical,
              percent: pctCritical,
              barClass: "bg-red-9",
              cardClass: "",
              labelClass: "",
              valueClass: "",
            },
          ]}
        />
      ) : null}

      <SegmentedControl
        value={filter}
        onChange={setFilter}
        ariaLabel="Filtrar auditoría"
        options={[
          { value: "all", label: "Todas", count: totalSites },
          { value: "ok", label: "OK", count: totals.ok },
          { value: "warn", label: "Atención", count: totals.warn },
          { value: "critical", label: "Crítico", count: totals.critical },
        ]}
      />

			{status === "error" ? (
				<div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-[12.5px] text-red-11">
					{loadError ?? "No se pudo cargar la auditoría."}
				</div>
			) : status === "loading" ? (
				<div className="grid grid-cols-1 gap-3">
					{[1, 2].map((i) => (
						<Skeleton key={i} className="h-28 rounded-xl" />
					))}
				</div>
			) : visibleSites.length === 0 ? (
				<EmptyState
					icon={<ShieldCheckIcon size={20} />}
					title="No hay páginas en este filtro"
					description="Probá cambiar el filtro superior o correr una auditoría nueva."
				/>
			) : (
				<div className="stagger grid grid-cols-1 gap-3">
					{visibleSites.map((site) => (
						<AuditCard key={site.slug} site={site} />
					))}
				</div>
			)}
		</PageContainer>
	);
}
