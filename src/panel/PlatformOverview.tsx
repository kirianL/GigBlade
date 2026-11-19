"use client";

import {
  ChartLineUpIcon,
  CurrencyDollarIcon,
  GlobeIcon,
  UsersIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { PLAN } from "@/panel/concept";
import { DjsTable } from "@/panel/DjsTable";
import { SkeletonContent } from "@/panel/Skeleton";
import { usePlatformDjs } from "@/panel/usePlatformDjs";
import { useLanguage } from "@/panel/LanguageProvider";
import {
  DistributionBar,
  MetricCard,
  PageContainer,
  PageHeader,
} from "@/panel/ui";

export default function PlatformOverview() {
  const { t } = useLanguage();
  const { djs, sites, status } = usePlatformDjs();
  const isLoading = status === "loading";

  const paying = djs.filter((dj) => dj.status === "active").length;
  const suspended = djs.filter((dj) => dj.status === "canceled").length;
  const withCustomDomain = djs.filter(
    (dj) => Boolean(dj.domain) && !dj.domain.includes("localhost"),
  ).length;
  const mrr = paying * PLAN.priceUsd;
  const visits = (sites ?? []).reduce((sum, site) => sum + site.visits, 0);

  const totalDjs = djs.length;
  const pctActive = totalDjs > 0 ? (paying / totalDjs) * 100 : 0;
  const pctCustomDomain =
    totalDjs > 0 ? (withCustomDomain / totalDjs) * 100 : 0;
  const pctSuspended = totalDjs > 0 ? (suspended / totalDjs) * 100 : 0;

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Supervisión Operativa"
        title={t("nav.overview", "Resumen")}
        subtitle="Estado de páginas DJ, ingresos recurrentes y actividad del mes"
      >
        <Link
          href="/djs"
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-transparent bg-grayscale-12 px-3.5 text-[12.5px] font-medium text-grayscale-1 shadow-[0_1px_2px_rgba(28,22,16,0.14)] transition-all hover:bg-grayscale-11 active:scale-[0.97]"
        >
          <span>{t("action.viewAll", "Ver todos los DJs")}</span>
        </Link>
      </PageHeader>

      {/* 4 Metric Cards estilo base-main (card-shell + spark + ticks) */}
      <SkeletonContent loading={isLoading} label="Cargando resumen">
      <div className="flex flex-col gap-6">
      <section className="stagger grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="MRR"
          value={isLoading ? "—" : `$${mrr}`}
          suffix="/mes"
          tone="emerald"
          ratio={totalDjs > 0 ? paying / totalDjs : 0}
          icon={CurrencyDollarIcon}
          delay={0}
          footer={<span>{paying} planes activos</span>}
        />
        <MetricCard
          label="Visitantes"
          value={isLoading ? "—" : visits}
          suffix="mes"
          tone="blue"
          ratio={visits > 0 ? 0.8 : 0.1}
          icon={ChartLineUpIcon}
          delay={1}
          footer={<span>En {totalDjs} páginas</span>}
        />
        <MetricCard
          label="DJs activos"
          value={isLoading ? "—" : paying}
          suffix={`de ${totalDjs}`}
          tone="neutral"
          ratio={totalDjs > 0 ? paying / totalDjs : 0}
          icon={UsersIcon}
          delay={2}
          footer={<span>{suspended} suspendidos</span>}
        />
        <MetricCard
          label="Dominios"
          value={isLoading ? "—" : withCustomDomain}
          suffix="propios"
          tone="amber"
          ratio={totalDjs > 0 ? withCustomDomain / totalDjs : 0}
          icon={GlobeIcon}
          delay={3}
          footer={
            <span>{Math.max(0, totalDjs - withCustomDomain)} sin conectar</span>
          }
        />
      </section>

      {totalDjs > 0 ? (
        <DistributionBar
          title={`Distribución de páginas (${totalDjs} totales)`}
          subtitle="Tiempo real"
          segments={[
            {
              key: "active",
              label: "Activos",
              count: paying,
              percent: pctActive,
              barClass: "bg-green-9",
              cardClass: "",
              labelClass: "",
              valueClass: "",
            },
            {
              key: "domains",
              label: "Con dominio propio",
              count: withCustomDomain,
              percent: pctCustomDomain,
              barClass: "bg-blue-9",
              cardClass: "",
              labelClass: "",
              valueClass: "",
            },
            {
              key: "suspended",
              label: "Suspendidos",
              count: suspended,
              percent: pctSuspended,
              barClass: "bg-amber-9",
              cardClass: "",
              labelClass: "",
              valueClass: "",
            },
          ]}
        />
      ) : null}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[13.5px] font-semibold text-grayscale-12">
            Directorio reciente de DJs
          </h2>
          <Link
            href="/djs"
            className="font-mono text-[11.5px] font-medium text-grayscale-10 transition-colors hover:text-grayscale-12"
          >
            Gestionar todos →
          </Link>
        </div>
        <DjsTable
          djs={djs}
          isLoading={isLoading}
          showSearch={false}
          emptyStateText={
            status === "error"
              ? "No se pudieron cargar los DJs. Recargá la página."
              : undefined
          }
          getRowHref={(dj) => `/studio?dj=${dj.slug}`}
        />
      </div>
      </div>
      </SkeletonContent>
    </PageContainer>
  );
}
