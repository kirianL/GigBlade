import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
	Button,
} from "@autumn/ui";
import { ArrowSquareOutIcon, ChartBarIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
	djPublicUrl,
	formatLastVisit,
} from "@/gigblade/concept";
import { fetchSiteVisits, type SiteVisitStats } from "@/gigblade/site-api";
import { DjSelect, MetricCard, PageContainer, useSelectedDj } from "@/gigblade/ui";
import { AnimatedCounter } from "@/gigblade/AnimatedCounter";

export default function DjVisitsPage() {
	const { dj, setDj } = useSelectedDj();
	const pageUrl = djPublicUrl(dj);
	const [stats, setStats] = useState<SiteVisitStats | null>(null);

	useEffect(() => {
		const controller = new AbortController();
		setStats(null);
		void fetchSiteVisits(dj.slug, controller.signal).then(setStats);
		return () => controller.abort();
	}, [dj.slug]);

	const views = stats?.uniqueVisitors ?? 0;

	return (
		<PageContainer>
			<div className="flex items-center justify-between w-full gap-4">
				<Breadcrumb className="text-tertiary-foreground flex justify-start">
					<BreadcrumbList className="text-tertiary-foreground text-xs">
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<Link to={`/studio?dj=${dj.slug}`}>Mi página</Link>
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>Visitas</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>
				<div className="flex items-center gap-2">
					<DjSelect value={dj.slug} onValueChange={setDj} />
					<Button variant="secondary" size="sm" asChild>
						<a href={pageUrl} target="_blank" rel="noreferrer">
							<ArrowSquareOutIcon size={16} aria-hidden />
							Abrir página
						</a>
					</Button>
				</div>
			</div>

			<MetricCard
				icon={
					<ChartBarIcon
						size={20}
						className="text-tertiary-foreground"
						aria-hidden
					/>
				}
				label="Visitantes este mes"
				value={<AnimatedCounter value={views} />}
				suffix={views === 1 ? "visitante" : "visitantes"}
				asideValue={dj.name}
				asideLabel={formatLastVisit(stats?.lastVisitedAt ?? null)}
			/>

			<section className="border rounded-lg p-5 flex flex-col gap-2">
				<p className="text-xs text-tertiary-foreground">Cómo se cuenta</p>
				<p className="text-sm text-tertiary-foreground leading-6">
					Queremos saber cuántas personas distintas entran al mes a la página
					de cada DJ. En producción ese número sale de Cloudflare, gratis, por
					dominio. En local todavía no hay Cloudflare: el preview estima
					personas (la misma recarga no suma dos veces) en{" "}
					{pageUrl.replace(/^https?:\/\//, "")}.
				</p>
			</section>
		</PageContainer>
	);
}
