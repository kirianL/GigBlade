import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
	Button,
	CopyButton,
} from "@autumn/ui";
import {
	ChartBarIcon,
	GlobeIcon,
	IdentificationCardIcon,
	KeyIcon,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
	djDomainLabel,
	djInstagramUrl,
	djIntendedDomain,
	djMailto,
	djPublicUrl,
	djTemplateLabel,
	formatLastVisit,
	formatVisitCount,
	PLAN,
} from "@/gigblade/concept";
import { fetchSiteVisits, type SiteVisitStats } from "@/gigblade/site-api";
import { GenerateDjPasswordButton } from "@/gigblade/GenerateDjPassword";
import { DeleteDjButton } from "@/gigblade/DeleteDjButton";
import {
	DjSelect,
	DjStatusCell,
	OpenPublicPageButton,
	PageContainer,
} from "@/gigblade/ui";
import { useDjProfile } from "@/gigblade/useDjContent";
import { useSession } from "@/lib/auth-client";

export default function DjStudioPage() {
	const { dj, setDj, draft } = useDjProfile();
	const { data: session } = useSession();
	const navigate = useNavigate();
	const isPlatform =
		(session?.user as { role?: string } | undefined)?.role === "platform";
	const pageUrl = djPublicUrl(dj);
	const domainLabel = djDomainLabel(dj);
	const instagramUrl = djInstagramUrl(dj);
	const mailUrl = djMailto(dj);
	const contentHref = `/studio/content?dj=${dj.slug}`;
	const visitsHref = `/studio/visitas?dj=${dj.slug}`;
	const intendedDomain = djIntendedDomain(dj);
	const [visits, setVisits] = useState<SiteVisitStats | null>(null);

	useEffect(() => {
		const controller = new AbortController();
		void fetchSiteVisits(dj.slug, controller.signal).then(setVisits);
		return () => controller.abort();
	}, [dj.slug]);

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
						<BreadcrumbItem className="truncate max-w-36">
							<span className="truncate">{dj.name}</span>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>
				<div className="flex items-center gap-2">
					<DjSelect value={dj.slug} onValueChange={setDj} />
					<OpenPublicPageButton href={pageUrl} />
				</div>
			</div>

			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-3">
				<div className="flex items-center gap-2 min-w-0">
					<h1 className="text-md font-semibold truncate min-w-0 max-w-full sm:max-w-sm text-foreground">
						{dj.name}
					</h1>
					<DjStatusCell status={dj.status} />
				</div>
				<div className="flex gap-2 flex-wrap min-w-0">
					<Button variant="primary" size="sm" asChild>
						<Link to={contentHref}>
							<IdentificationCardIcon size={16} aria-hidden />
							Editar contenido
						</Link>
					</Button>
					<CopyButton
						text={dj.email}
						title={dj.email}
						size="mini"
						className="text-tertiary-foreground"
						innerClassName="max-w-30 text-tiny-id truncate !font-normal"
					/>
					{pageUrl ? (
						<CopyButton
							text={pageUrl}
							title={pageUrl}
							size="mini"
							className="text-tertiary-foreground"
							innerClassName="max-w-30 text-tiny-id truncate !font-normal"
						/>
					) : null}
				</div>
			</div>

			<section className="grid gap-3 sm:grid-cols-2">
				<section className="border rounded-lg p-5 flex flex-col gap-3">
					<div className="flex items-start justify-between gap-3">
						<div className="min-w-0">
							<p className="text-xs text-tertiary-foreground">Dominio</p>
							<p className="text-sm font-medium text-foreground break-all">
								{domainLabel}
							</p>
						</div>
						<GlobeIcon
							size={16}
							className="text-subtle shrink-0 mt-0.5"
							aria-hidden
						/>
					</div>
					<p className="text-sm text-tertiary-foreground leading-6">
						{intendedDomain
							? `GigBlade registra y administra ${intendedDomain}. El sitio público no usa un subdominio de GigBlade. La renovación se cobra al costo.`
							: "El dominio propio se asigna después. GigBlade lo registra y administra a nombre de la plataforma."}
					</p>
					<div className="flex flex-wrap gap-2">
						<OpenPublicPageButton href={pageUrl} label="Abrir" />
					</div>
				</section>
				<section className="border rounded-lg p-5 flex flex-col gap-3">
					<div className="flex items-start justify-between gap-3">
						<div>
							<p className="text-xs text-tertiary-foreground">Visitantes este mes</p>
							<p className="text-sm font-medium text-foreground">
								{formatVisitCount(visits?.uniqueVisitors ?? 0)}
							</p>
						</div>
						<ChartBarIcon
							size={16}
							className="text-subtle shrink-0 mt-0.5"
							aria-hidden
						/>
					</div>
					<p className="text-sm text-tertiary-foreground leading-6">
						{formatLastVisit(visits?.lastVisitedAt ?? null)}
					</p>
					<Button variant="secondary" size="sm" asChild>
						<Link to={visitsHref}>Ver visitas</Link>
					</Button>
				</section>
			</section>

			<section className="border rounded-lg bg-interactive-secondary p-5 flex flex-col gap-4">
				<div className="flex items-start justify-between gap-4">
					<div className="min-w-0">
						<p className="text-xs text-tertiary-foreground">Tu página</p>
						<p className="text-sm font-medium text-foreground truncate">
							{domainLabel}
						</p>
					</div>
					<p className="text-xs text-tertiary-foreground shrink-0">
						{djTemplateLabel(draft.template)}
					</p>
				</div>
				<dl className="grid gap-3 sm:grid-cols-2 text-sm">
					<div>
						<dt className="text-xs text-tertiary-foreground">Ciudad</dt>
						<dd className="text-foreground">{draft.city || "Sin ciudad"}</dd>
					</div>
					<div>
						<dt className="text-xs text-tertiary-foreground">Instagram</dt>
						<dd>
							<a
								href={instagramUrl}
								target="_blank"
								rel="noreferrer"
								className="text-foreground hover:underline"
							>
								{dj.instagram}
							</a>
						</dd>
					</div>
					<div className="sm:col-span-2">
						<dt className="text-xs text-tertiary-foreground">Bio</dt>
						<dd className="text-foreground leading-6">
							{draft.bio || "Todavía no hay biografía."}
						</dd>
					</div>
				</dl>
				<div className="flex flex-wrap gap-2">
					<Button variant="secondary" size="sm" asChild>
						<a href={mailUrl}>{dj.email}</a>
					</Button>
					<Button variant="secondary" size="sm" asChild>
						<Link to={contentHref}>Completar perfil</Link>
					</Button>
				</div>
			</section>

			{isPlatform ? (
				<section className="border rounded-lg p-5 flex flex-col gap-3">
					<div className="flex items-start justify-between gap-3">
						<div className="min-w-0">
							<p className="text-xs text-tertiary-foreground">Acceso al panel</p>
							<p className="text-sm font-medium text-foreground">{dj.email}</p>
						</div>
						<KeyIcon
							size={16}
							className="text-subtle shrink-0 mt-0.5"
							aria-hidden
						/>
					</div>
					<p className="text-sm text-tertiary-foreground leading-6">
						Generá una contraseña y pasásela a esta persona. La anterior deja de
						servir y no se vuelve a mostrar.
					</p>
					<div className="flex flex-wrap gap-2">
						<GenerateDjPasswordButton
							slug={dj.slug}
							email={dj.email}
							name={dj.name}
						/>
						<DeleteDjButton
							slug={dj.slug}
							name={dj.name}
							onDeleted={() => navigate("/djs")}
						/>
					</div>
				</section>
			) : null}

			<section className="border rounded-lg p-5 flex flex-col gap-2">
				<p className="text-xs text-tertiary-foreground">Plan</p>
				<div className="flex flex-wrap items-center justify-between gap-2">
					<p className="text-sm font-medium text-foreground">
						{PLAN.name} · US$ {PLAN.priceUsd} /mes
					</p>
					<DjStatusCell status={dj.status} />
				</div>
				<p className="text-sm text-tertiary-foreground leading-6">
					Incluye la página, el dominio administrado por GigBlade, hosting y este
					panel para el contenido.
				</p>
			</section>
		</PageContainer>
	);
}
