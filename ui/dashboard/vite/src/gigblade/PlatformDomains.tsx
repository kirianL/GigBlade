import { Button, MiniCopyButton, PageContainer, PageHeader } from "@autumn/ui";
import { ArrowSquareOutIcon, GlobeIcon } from "@phosphor-icons/react";
import { useMemo } from "react";
import { Link } from "react-router";
import {
	djIntendedDomain,
	djPublicUrl,
	formatLastVisit,
	formatVisitCount,
	PLAN,
} from "@/gigblade/concept";
import { DeleteDjButton } from "@/gigblade/DeleteDjButton";
import { GenerateDjPasswordButton } from "@/gigblade/GenerateDjPassword";
import { usePlatformDjs } from "@/gigblade/usePlatformDjs";
import { DjStatusCell } from "@/gigblade/ui";
import { useSession } from "@/lib/auth-client";

type DomainRow = {
	slug: string;
	name: string;
	email: string;
	hostname: string;
	publicDomain: string | null;
	preview: boolean;
	visits: number;
	lastVisitedAt: string | null;
	status: "active" | "trialing" | "canceled";
};

export default function PlatformDomains() {
	const { djs, sites, remove } = usePlatformDjs();
	const { data: session } = useSession();
	const isPlatform =
		(session?.user as { role?: string } | undefined)?.role === "platform";

	const rows = useMemo<DomainRow[]>(() => {
		const bySlug = new Map((sites ?? []).map((site) => [site.slug, site]));
		return djs.map((dj) => {
			const live = bySlug.get(dj.slug);
			return {
				slug: dj.slug,
				name: live?.displayName || dj.name,
				email: live?.email || dj.email,
				hostname: live?.domain || dj.domain,
				publicDomain: djIntendedDomain(dj),
				preview: live?.preview ?? dj.domain.includes("localhost"),
				visits: live?.visits ?? 0,
				lastVisitedAt: live?.lastVisitedAt ?? null,
				status: dj.status,
			};
		});
	}, [djs, sites]);
	const totalVisits = rows.reduce((sum, row) => sum + row.visits, 0);

	return (
		<PageContainer>
			<PageHeader
				icon={
					<GlobeIcon
						size={16}
						weight="fill"
						className="text-subtle"
						aria-hidden
					/>
				}
				title="Dominios"
			/>
			<p className="text-sm text-tertiary-foreground leading-6 -mt-2 max-w-3xl">
				{PLAN.domainNote} El sitio público sale en el dominio propio del DJ, no
				en un subdominio de GigBlade. En local el preview es{" "}
				<code className="text-xs">{`{slug}.localhost`}</code>.
			</p>
			<p className="text-sm text-tertiary-foreground -mt-2">
				{formatVisitCount(totalVisits)} en todas las páginas.
			</p>

			<ul className="flex flex-col gap-3">
				{rows.length === 0 ? (
					<li className="border rounded-lg bg-interactive-secondary p-4 text-sm text-tertiary-foreground">
						Todavía no hay DJs.
					</li>
				) : null}
				{rows.map((row) => {
					const pageUrl = djPublicUrl({ slug: row.slug });
					return (
						<li
							key={row.slug}
							className="border rounded-lg bg-interactive-secondary p-4 sm:p-5 flex flex-col gap-3"
						>
							<div className="flex flex-wrap items-start justify-between gap-3">
								<div className="min-w-0">
									<div className="flex items-center gap-2 min-w-0">
										<p className="text-sm font-medium text-foreground truncate">
											{row.name}
										</p>
										<DjStatusCell status={row.status} />
									</div>
									<p className="mt-1 font-mono text-sm text-foreground break-all">
										{row.hostname}
									</p>
									<p className="mt-1 text-xs text-tertiary-foreground">
										{row.preview
											? "Preview local · administrado por GigBlade"
											: "Dominio propio · a nombre de GigBlade"}
										{row.publicDomain
											? ` · público ${row.publicDomain}`
											: ""}
									</p>
								</div>
								<div className="text-right shrink-0">
									<p className="text-sm font-semibold tabular-nums text-foreground">
										{formatVisitCount(row.visits)}
									</p>
									<p className="text-xs text-subtle">
										{formatLastVisit(row.lastVisitedAt)}
									</p>
								</div>
							</div>
							<div className="flex flex-wrap gap-2">
								<MiniCopyButton text={row.hostname} />
								<Button variant="secondary" size="sm" asChild>
									<a href={pageUrl} target="_blank" rel="noreferrer">
										<ArrowSquareOutIcon size={16} aria-hidden />
										Abrir página
									</a>
								</Button>
								<Button variant="secondary" size="sm" asChild>
									<Link to={`/studio/visitas?dj=${row.slug}`}>Ver visitas</Link>
								</Button>
								<Button variant="secondary" size="sm" asChild>
									<Link to={`/studio?dj=${row.slug}`}>Panel DJ</Link>
								</Button>
								{isPlatform ? (
									<GenerateDjPasswordButton
										slug={row.slug}
										email={row.email}
										name={row.name}
									/>
								) : null}
								{isPlatform ? (
									<DeleteDjButton
										slug={row.slug}
										name={row.name}
										onDeleted={remove}
									/>
								) : null}
							</div>
						</li>
					);
				})}
			</ul>
		</PageContainer>
	);
}
