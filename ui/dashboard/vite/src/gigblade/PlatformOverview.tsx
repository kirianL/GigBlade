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
	const { djs, sites, status } = usePlatformDjs();
	const isLoading = status === "loading";
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
				value={
					isLoading ? (
						<span className="inline-block h-5 w-20 animate-pulse rounded bg-muted" />
					) : (
						`US$ ${mrr}`
					)
				}
				suffix={isLoading ? undefined : "/mo"}
				asideValue={isLoading ? "—" : String(paying)}
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
				value={
					isLoading ? (
						<span className="inline-block h-5 w-16 animate-pulse rounded bg-muted" />
					) : (
						<AnimatedCounter value={visits} />
					)
				}
				suffix={
					isLoading
						? undefined
						: visits === 1
							? t("overview.visitor", "visitante")
							: t("overview.visitors", "visitantes")
				}
				asideValue={isLoading ? "—" : String(djs.length)}
				asideLabel={t("overview.domains", "dominios")}
			/>

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
				actions={
					<Button variant="secondary" size="sm" asChild>
						<Link to="/djs">{t("action.viewAll", "Ver todos")}</Link>
					</Button>
				}
			/>
		</PageContainer>
	);
}
