import { Button } from "@autumn/ui";
import { ArrowsClockwiseIcon, ChartBarIcon } from "@phosphor-icons/react";
import { Link } from "react-router";
import { PLAN } from "@/gigblade/concept";
import { DjsTable } from "@/gigblade/DjsTable";
import { MetricCard, PageContainer } from "@/gigblade/ui";
import { AnimatedCounter } from "@/gigblade/AnimatedCounter";
import { usePlatformDjs } from "@/gigblade/usePlatformDjs";
import { useLanguage } from "@/contexts/LanguageProvider";

export default function PlatformOverview() {
	const { t } = useLanguage();
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
				label={t("overview.mrr", "Ingresos recurrentes mensuales")}
				value={`US$ ${mrr}`}
				suffix="/mo"
				asideValue={String(paying)}
				asideLabel={t("overview.activePlans", "planes activos")}
			/>
			<MetricCard
				icon={
					<ChartBarIcon
						size={20}
						className="text-tertiary-foreground"
						aria-hidden
					/>
				}
				label={t("overview.visitsThisMonth", "Visitantes este mes")}
				value={<AnimatedCounter value={visits} />}
				suffix={visits === 1 ? t("overview.visitor", "visitante") : t("overview.visitors", "visitantes")}
				asideValue={String(djs.length)}
				asideLabel={t("overview.domains", "dominios")}
			/>

			<DjsTable
				djs={djs}
				showSearch={false}
				getRowHref={(dj) => `/studio?dj=${dj.slug}`}
				actions={
					<Button variant="secondary" size="sm" asChild>
						<Link to="/djs">{t("action.viewAll", "Ver todos")}</Link>
					</Button>
				}
			/>
		</PageContainer>
	);
}
