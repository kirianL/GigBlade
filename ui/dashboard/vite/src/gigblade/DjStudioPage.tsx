import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
	Button,
	CopyButton,
} from "@autumn/ui";
import { ArrowSquareOutIcon, IdentificationCardIcon } from "@phosphor-icons/react";
import { Link } from "react-router";
import {
	djInstagramUrl,
	djMailto,
	djPublicUrl,
	djTemplateLabel,
	PLAN,
} from "@/gigblade/concept";
import {
	DjSelect,
	DjStatusCell,
	PageContainer,
} from "@/gigblade/ui";
import { useDjProfile } from "@/gigblade/useDjContent";

export default function DjStudioPage() {
	const { dj, setDj, draft } = useDjProfile();
	const pageUrl = djPublicUrl(dj);
	const instagramUrl = djInstagramUrl(dj);
	const mailUrl = djMailto(dj);
	const contentHref = `/studio/content?dj=${dj.slug}`;

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
					<Button variant="secondary" size="sm" asChild>
						<a href={pageUrl} target="_blank" rel="noreferrer">
							<ArrowSquareOutIcon size={16} aria-hidden />
							Abrir página
						</a>
					</Button>
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
					<CopyButton
						text={pageUrl}
						title={pageUrl}
						size="mini"
						className="text-tertiary-foreground"
						innerClassName="max-w-30 text-tiny-id truncate !font-normal"
					/>
				</div>
			</div>

			<section className="border rounded-lg bg-interactive-secondary p-5 flex flex-col gap-4">
				<div className="flex items-start justify-between gap-4">
					<div className="min-w-0">
						<p className="text-xs text-tertiary-foreground">
							Preview local
						</p>
						<p className="text-sm font-medium text-foreground truncate">
							{pageUrl.replace(/^https?:\/\//, "")}
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
