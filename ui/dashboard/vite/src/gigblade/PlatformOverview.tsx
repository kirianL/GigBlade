import { Button } from "@autumn/ui";
import { ArrowsClockwiseIcon, ChartBarIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
	GIGBLADE_DJS,
	estimatedMrr,
	payingDjCount,
} from "@/gigblade/concept";
import { DjsTable } from "@/gigblade/DjsTable";
import { fetchPlatformSites } from "@/gigblade/site-api";
import { MetricCard, PageContainer } from "@/gigblade/ui";
import { AnimatedCounter } from "@/gigblade/AnimatedCounter";

export default function PlatformOverview() {
	const mrr = estimatedMrr();
	const [visits, setVisits] = useState(0);

	useEffect(() => {
		const controller = new AbortController();
		void fetchPlatformSites(controller.signal).then((sites) => {
			if (!sites) return;
			setVisits(sites.reduce((sum, site) => sum + site.visits, 0));
		});
		return () => controller.abort();
	}, []);

	return (
		<PageContainer>
			<MetricCard
				icon={
					<ArrowsClockwiseIcon
						size={20}
						className="text-tertiary-foreground"
						aria-hidden
					/>
				}
				label="Monthly Recurring Revenue"
				value={`US$ ${mrr}`}
				suffix="/mo"
				asideValue={String(payingDjCount())}
				asideLabel="active plans"
			/>
			<MetricCard
				icon={
					<ChartBarIcon
						size={20}
						className="text-tertiary-foreground"
						aria-hidden
					/>
				}
				label="Visitantes este mes"
				value={<AnimatedCounter value={visits} />}
				suffix={visits === 1 ? "visitante" : "visitantes"}
				asideValue={String(GIGBLADE_DJS.length)}
				asideLabel="dominios"
			/>

			<DjsTable
				djs={GIGBLADE_DJS}
				showSearch={false}
				getRowHref={(dj) => `/studio?dj=${dj.slug}`}
				actions={
					<Button variant="secondary" size="sm" asChild>
						<Link to="/djs">Ver todos</Link>
					</Button>
				}
			/>
		</PageContainer>
	);
}
