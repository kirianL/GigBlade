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
	djEditorPageUrl,
	djTemplateLabel,
	formatLastVisit,
	formatVisitCount,
	PLAN,
} from "@/gigblade/concept";
import { fetchSiteVisits, type SiteVisitStats } from "@/gigblade/site-api";
import { GenerateDjPasswordButton } from "@/gigblade/GenerateDjPassword";
import { InstallDesktopCard } from "@/gigblade/InstallDesktop";
import { DeleteDjButton } from "@/gigblade/DeleteDjButton";
import { ConnectDomainModal } from "@/gigblade/ConnectDomainModal";
import {
	DjSelect,
	DjStatusCell,
	OpenPublicPageButton,
	PageContainer,
} from "@/gigblade/ui";
import { useDjProfile } from "@/gigblade/useDjContent";
import { useSession } from "@/lib/auth-client";
import { useLanguage } from "@/contexts/LanguageProvider";

export default function DjStudioPage() {
	const { dj, setDj, draft, visitsReady } = useDjProfile();
	const { data: session } = useSession();
	const { t } = useLanguage();
	const navigate = useNavigate();
	const isPlatform =
		(session?.user as { role?: string } | undefined)?.role === "platform";
	const pageUrl = djEditorPageUrl(dj);
	const domainLabel = djDomainLabel(dj);
	const instagramUrl = djInstagramUrl(dj);
	const mailUrl = djMailto(dj);
	const contentHref = `/studio/content?dj=${dj.slug}`;
	const visitsHref = `/studio/visitas?dj=${dj.slug}`;
	const intendedDomain = djIntendedDomain(dj);
	const [visits, setVisits] = useState<SiteVisitStats | null>(null);

	useEffect(() => {
		if (!visitsReady) return;
		const controller = new AbortController();
		void fetchSiteVisits(dj.slug, controller.signal).then(setVisits);
		return () => controller.abort();
	}, [dj.slug, visitsReady]);

	return (
		<PageContainer>
			<div className="flex flex-wrap items-center justify-between w-full gap-2 sm:gap-4">
				<Breadcrumb className="text-tertiary-foreground flex justify-start min-w-0">
					<BreadcrumbList className="text-tertiary-foreground text-xs">
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<Link to={`/studio?dj=${dj.slug}`}>{t("nav.myPage", "Mi página")}</Link>
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem className="truncate max-w-36">
							<span className="truncate">{dj.name}</span>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>
				<div className="flex items-center gap-2 min-w-0 max-w-full">
					<DjSelect value={dj.slug} onValueChange={setDj} />
					<OpenPublicPageButton
						href={pageUrl}
						label={pageUrl?.includes(".localhost") ? t("action.viewTemplate", "Ver plantilla") : t("action.openPage", "Abrir página")}
					/>
				</div>
			</div>

			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-3">
				<div className="flex items-center gap-2 min-w-0">
					<h1 className="text-md font-semibold truncate min-w-0 max-w-full sm:max-w-sm text-foreground">
						{dj.name}
					</h1>
					<DjStatusCell status={dj.status} />
				</div>
				<div className="flex gap-2 flex-wrap min-w-0 items-center">
					<Button
						variant="primary"
						size="sm"
						className="h-8 px-3 text-xs font-medium gap-1.5 active:scale-[0.98] transition-all"
						asChild
					>
						<Link to={contentHref}>
							<IdentificationCardIcon size={14} aria-hidden />
							{t("action.editContent", "Editar contenido")}
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

			{isPlatform ? null : <InstallDesktopCard />}

			<section className="grid gap-3 sm:grid-cols-2">
				{isPlatform ? (
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
							<ConnectDomainModal
								fixedSlug={dj.slug}
								triggerText={intendedDomain ? "Cambiar o verificar dominio" : "Conectar dominio propio"}
								triggerVariant={intendedDomain ? "secondary" : "primary"}
								triggerClassName="h-8 px-3 text-xs font-medium gap-1.5 active:scale-[0.98] transition-all"
								onConnected={() => {
									window.location.reload();
								}}
							/>
							<OpenPublicPageButton
								href={pageUrl}
								label={pageUrl?.includes(".localhost") ? "Ver plantilla" : "Abrir"}
							/>
						</div>
					</section>
				) : (
					<section className="border rounded-lg p-5 flex flex-col gap-3">
						<div className="flex items-start justify-between gap-3">
							<div className="min-w-0">
								<p className="text-xs text-tertiary-foreground">Dominio Propio</p>
								<p className="text-sm font-semibold text-foreground break-all">
									{intendedDomain ?? (pageUrl ? "GigBlade Preview" : "Sin dominio asignado")}
								</p>
							</div>
							{intendedDomain ? (
								<span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground shrink-0">
									<span className="relative flex h-2 w-2">
										<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
										<span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
									</span>
									Activo
								</span>
							) : (
								<span className="text-xs text-tertiary-foreground font-mono shrink-0">
									Sin conectar
								</span>
							)}
						</div>
						<p className="text-sm text-tertiary-foreground leading-6">
							{intendedDomain
								? `Tu página oficial responde en ${intendedDomain}. Puedes cambiar o verificar tu dominio en 1 clic.`
								: "Conecta tu propio dominio comprado en GoDaddy, Cloudflare, Name.com u otro registrador en 1 clic."}
						</p>
						<div className="flex flex-wrap items-center gap-2">
							<ConnectDomainModal
								fixedSlug={dj.slug}
								triggerText={intendedDomain ? "Cambiar o verificar dominio" : "Conectar dominio propio"}
								triggerVariant={intendedDomain ? "secondary" : "primary"}
								triggerClassName="h-8 px-3 text-xs font-medium gap-1.5 active:scale-[0.98] transition-all"
								onConnected={() => {
									window.location.reload();
								}}
							/>
							{pageUrl ? (
								<CopyButton text={pageUrl} title="Copiar link" size="mini" />
							) : null}
							{instagramUrl && dj.instagram ? (
								<Button
									variant="secondary"
									size="sm"
									className="h-8 px-3 text-xs font-medium gap-1.5 active:scale-[0.98] transition-all"
									asChild
								>
									<a href={instagramUrl} target="_blank" rel="noreferrer">
										Abrir Instagram
									</a>
								</Button>
							) : null}
						</div>
					</section>
				)}
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
					<Button
						variant="secondary"
						size="sm"
						className="h-8 px-3 text-xs font-medium gap-1.5 active:scale-[0.98] transition-all w-fit"
						asChild
					>
						<Link to={visitsHref}>{t("action.viewVisits", "Ver visitas")}</Link>
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

			{isPlatform ? (
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
			) : null}
		</PageContainer>
	);
}
