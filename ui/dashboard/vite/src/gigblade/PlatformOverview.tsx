import { Button } from "@autumn/ui";
import { ArrowsClockwiseIcon, UsersIcon } from "@phosphor-icons/react";
import { Link } from "react-router";
import {
	GIGBLADE_DJS,
	estimatedMrr,
	payingDjCount,
} from "@/gigblade/concept";
import { DjsTable } from "@/gigblade/DjsTable";
import { MetricCard, PageContainer } from "@/gigblade/ui";

export default function PlatformOverview() {
	const mrr = estimatedMrr();

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
