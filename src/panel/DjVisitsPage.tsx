"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
	djDomainLabel,
	djPublicUrl,
	formatLastVisit,
} from "@/panel/concept";
import { fetchSiteVisits, type SiteVisitStats } from "@/panel/site-api";
import { AnimatedCounter } from "@/panel/AnimatedCounter";
import { SkeletonContent } from "@/panel/Skeleton";
import {
	DjSelect,
	MetricCard,
	OpenPublicPageButton,
	PageContainer,
	PageHeader,
	useSelectedDj,
} from "@/panel/ui";

export default function DjVisitsPage() {
	const { dj, setDj, visitsReady } = useSelectedDj();
	const pageUrl = djPublicUrl(dj);
	const domainLabel = djDomainLabel(dj);
	const [statsState, setStatsState] = useState<{
		slug: string;
		data: SiteVisitStats;
	} | null>(null);

	useEffect(() => {
		if (!visitsReady) return;
		const controller = new AbortController();
		void fetchSiteVisits(dj.slug, controller.signal).then((data) => {
			if (!controller.signal.aborted && data) {
				setStatsState({ slug: dj.slug, data });
			}
		});
		return () => controller.abort();
	}, [dj.slug, visitsReady]);

	const stats = statsState?.slug === dj.slug ? statsState.data : null;
	const views = stats?.uniqueVisitors ?? 0;

	return (
		<PageContainer>
			<PageHeader
				title="Visitas"
				subtitle={`Tráfico mensual único de ${dj.name}`}
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

			<SkeletonContent loading={!stats} label="Cargando visitas">
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<MetricCard
					label="Visitantes este mes"
					value={<AnimatedCounter value={views} />}
					suffix={views === 1 ? "visitante" : "visitantes"}
					valueClassName="text-emerald-600"
					footer={
						<>
							<span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
							<span>{domainLabel}</span>
						</>
					}
				/>
				<MetricCard
					label="Última actividad"
					value={formatLastVisit(stats?.lastVisitedAt ?? null)}
					valueClassName="text-xl sm:text-2xl"
					footer={
						<span>
							Fuente: {stats?.source === "cloudflare" ? "Cloudflare Analytics" : "Preview local"}
						</span>
					}
				/>
			</div>
			</SkeletonContent>

			<div className="card p-6 shadow-xs space-y-2">
				<span className="text-[11px] font-semibold text-grayscale-8 uppercase tracking-wider block">
					Cómo se cuenta
				</span>
				<p className="text-xs text-grayscale-10 leading-relaxed">
					Personas distintas que entraron este mes
					{pageUrl ? ` a ${domainLabel}` : ""}. La misma visita no se cuenta dos
					veces. Los datos provienen de Cloudflare Analytics por dominio.
				</p>
			</div>
		</PageContainer>
	);
}
