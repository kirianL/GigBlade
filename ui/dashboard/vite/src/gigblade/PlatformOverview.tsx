import { Button } from "@autumn/ui";
import { ArrowsClockwiseIcon, ChartBarIcon } from "@phosphor-icons/react";
import { Link } from "react-router";
import { PLAN } from "@/gigblade/concept";
import { DjsTable } from "@/gigblade/DjsTable";
import { MetricCard, PageContainer } from "@/gigblade/ui";
import { AnimatedCounter } from "@/gigblade/AnimatedCounter";
import { usePlatformDjs } from "@/gigblade/usePlatformDjs";

export default function PlatformOverview() {
	const { djs, sites } = usePlatformDjs();
	const paying = djs.filter((dj) => dj.status === "active").length;
	const mrr = paying * PLAN.priceUsd;
	const visits = (sites ?? []).reduce((sum, site) => sum + site.visits, 0);

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
				asideValue={String(paying)}
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
				asideValue={String(djs.length)}
				asideLabel="dominios"
			/>

			<DjsTable
				djs={djs}
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
