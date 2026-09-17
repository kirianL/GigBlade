import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
	Button,
	CopyButton,
	Input,
	LongInput,
} from "@autumn/ui";
import { ArrowSquareOutIcon, IdentificationCardIcon } from "@phosphor-icons/react";
import { useId, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router";
import { DJ_TEMPLATES, djPublicUrl } from "@/gigblade/concept";
import { BrandColorPicker } from "@/gigblade/BrandColorPicker";
import { SavePublishControl } from "@/gigblade/SavePublishControl";
import { DjSelect, PageContainer, PageHeader } from "@/gigblade/ui";
import {
	useDjProfile,
	type DjContentDraft,
	type DjLinkDraft,
} from "@/gigblade/useDjContent";

type FieldErrors = Partial<Record<"displayName" | "template" | "save", string>>;

const LINK_ROWS: { id: keyof DjLinkDraft; label: string; hint: string }[] = [
	{ id: "instagram", label: "Instagram", hint: "Handle o URL https" },
	{ id: "tiktok", label: "TikTok", hint: "URL https" },
	{ id: "youtube", label: "YouTube", hint: "URL https" },
	{ id: "facebook", label: "Facebook", hint: "URL https" },
	{ id: "x", label: "X", hint: "URL https" },
	{
		id: "soundcloud",
		label: "SoundCloud",
		hint: "Enlace directo al perfil, track o playlist",
	},
	{
		id: "spotify",
		label: "Spotify",
		hint: "Enlace directo al perfil, track o playlist",
	},
];

function Field({
	id,
	label,
	hint,
	error,
	children,
}: {
	id: string;
	label: string;
	hint?: string;
	error?: string;
	children: ReactNode;
}) {
	return (
		<div className="flex flex-col gap-1.5">
			<label htmlFor={id} className="text-sm font-medium text-foreground">
				{label}
			</label>
			{children}
			{error ? (
				<p id={`${id}-error`} className="text-xs text-destructive">
					{error}
				</p>
			) : hint ? (
				<p id={`${id}-hint`} className="text-xs text-tertiary-foreground">
					{hint}
				</p>
			) : null}
		</div>
	);
}

function validate(draft: DjContentDraft): FieldErrors {
	const errors: FieldErrors = {};
	if (!draft.displayName.trim()) errors.displayName = "Indicá el nombre.";
	if (!DJ_TEMPLATES.some((template) => template.id === draft.template)) {
		errors.template = "Elegí una plantilla.";
	}
	return errors;
}

export default function DjContentPage() {
	const { dj, setDj, draft, setDraft, save, live } = useDjProfile({
		syncLive: true,
	});
	const pageUrl = djPublicUrl(dj);
	const [errors, setErrors] = useState<FieldErrors>({});
	const [saved, setSaved] = useState(false);
	const [saving, setSaving] = useState(false);
	const [saveTick, setSaveTick] = useState(0);
	const ids = {
		displayName: useId(),
		tagline: useId(),
		bio: useId(),
		city: useId(),
		template: useId(),
		photos: useId(),
	};

	const touch = (patch: Partial<DjContentDraft>) => {
		setDraft((current) => ({ ...current, ...patch }));
		setSaved(false);
	};

	const touchLink = (id: keyof DjLinkDraft, value: string) => {
		setDraft((current) => ({
			...current,
			links: { ...current.links, [id]: value },
		}));
		setSaved(false);
	};

	const addPhotos = (files: FileList | null) => {
		if (!files?.length) return;
		const extra = Array.from(files).map((file) => ({
			id: crypto.randomUUID(),
			name: file.name,
		}));
		setDraft((current) => ({
			...current,
			photos: [...current.photos, ...extra],
		}));
		setSaved(false);
	};

	const removePhoto = (id: string) => {
		setDraft((current) => ({
			...current,
			photos: current.photos.filter((photo) => photo.id !== id),
		}));
		setSaved(false);
	};

	const onSubmit = async (event: FormEvent) => {
		event.preventDefault();
		const nextErrors = validate(draft);
		setErrors(nextErrors);
		if (Object.keys(nextErrors).length > 0) {
			setSaved(false);
			return;
		}
		setSaving(true);
		try {
			await save(draft);
			setErrors({});
			setSaved(true);
			setSaveTick((tick) => tick + 1);
		} catch (error) {
			setSaved(false);
			setErrors({
				save:
					error instanceof Error
						? error.message
						: "No se pudo publicar el contenido.",
			});
		} finally {
			setSaving(false);
		}
	};

	return (
		<PageContainer>
			<div className="flex items-center justify-between w-full gap-4">
				<Breadcrumb className="text-tertiary-foreground flex justify-start">
					<BreadcrumbList className="text-tertiary-foreground text-xs">
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<Link to={`/studio?dj=${dj.slug}`}>{dj.name}</Link>
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>Contenido</BreadcrumbItem>
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

			<PageHeader
				icon={
					<IdentificationCardIcon
						size={16}
						weight="fill"
						className="text-subtle"
						aria-hidden
					/>
				}
				title="Contenido"
			>
				<CopyButton
					text={pageUrl}
					title={pageUrl}
					size="mini"
					className="text-tertiary-foreground"
					innerClassName="max-w-30 text-tiny-id truncate !font-normal"
				/>
			</PageHeader>
			<p className="text-sm text-tertiary-foreground leading-6 -mt-2 max-w-3xl">
				Guardá y recargá el preview local ({pageUrl.replace(/^https?:\/\//, "")})
				para ver claro, oscuro o party. Todavía no se abre el dominio propio.
			</p>

			<form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
				<section className="border rounded-lg p-5 flex flex-col gap-4">
					<h2 className="text-sm font-semibold text-foreground">Perfil</h2>
					<div className="grid gap-4 sm:grid-cols-2">
						<Field
							id={ids.displayName}
							label="Nombre"
							error={errors.displayName}
						>
							<Input
								id={ids.displayName}
								value={draft.displayName}
								onChange={(event) =>
									touch({ displayName: event.target.value })
								}
								aria-invalid={Boolean(errors.displayName)}
								aria-describedby={
									errors.displayName
										? `${ids.displayName}-error`
										: undefined
								}
								required
							/>
						</Field>
						<Field id={ids.city} label="Ciudad">
							<Input
								id={ids.city}
								value={draft.city}
								onChange={(event) => touch({ city: event.target.value })}
							/>
						</Field>
					</div>
					<Field
						id={ids.tagline}
						label="Tagline"
						hint="Una línea para la portada."
					>
						<Input
							id={ids.tagline}
							value={draft.tagline}
							onChange={(event) => touch({ tagline: event.target.value })}
							aria-describedby={`${ids.tagline}-hint`}
						/>
					</Field>
					<Field id={ids.bio} label="Biografía">
						<LongInput
							id={ids.bio}
							value={draft.bio}
							onChange={(event) => touch({ bio: event.target.value })}
							rows={5}
						/>
					</Field>
				</section>

				<fieldset className="border rounded-lg p-5 flex flex-col gap-3">
					<legend className="text-sm font-semibold text-foreground px-1">
						Apariencia
					</legend>
					<div
						id={ids.template}
						role="radiogroup"
						aria-invalid={Boolean(errors.template)}
						aria-describedby={
							errors.template ? `${ids.template}-error` : `${ids.template}-hint`
						}
						className="grid gap-2 sm:grid-cols-3"
					>
						{DJ_TEMPLATES.map((template) => {
							const checked = draft.template === template.id;
							return (
								<label
									key={template.id}
									className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer ${
										checked
											? "border-foreground bg-interactive-secondary text-foreground"
											: "border-input text-tertiary-foreground"
									}`}
								>
									<input
										type="radio"
										name="template"
										value={template.id}
										checked={checked}
										onChange={() => touch({ template: template.id })}
										className="accent-foreground"
									/>
									{template.label}
								</label>
							);
						})}
					</div>
					{errors.template ? (
						<p id={`${ids.template}-error`} className="text-xs text-destructive">
							{errors.template}
						</p>
					) : (
						<p id={`${ids.template}-hint`} className="text-xs text-tertiary-foreground">
							Claro, oscuro o party. El cambio se ve al recargar el preview.
						</p>
					)}
					<BrandColorPicker
						value={draft.brandColor}
						onChange={(brandColor) => touch({ brandColor })}
					/>
				</fieldset>

				<section className="border rounded-lg p-5 flex flex-col gap-4">
					<h2 className="text-sm font-semibold text-foreground">
						Redes y música
					</h2>
					<div className="grid gap-4 sm:grid-cols-2">
						{LINK_ROWS.map((link) => {
							const fieldId = `${ids.displayName}-${link.id}`;
							return (
								<Field
									key={link.id}
									id={fieldId}
									label={link.label}
									hint={link.hint}
								>
									<Input
										id={fieldId}
										value={draft.links[link.id]}
										onChange={(event) =>
											touchLink(link.id, event.target.value)
										}
										aria-describedby={`${fieldId}-hint`}
									/>
								</Field>
							);
						})}
					</div>
				</section>

				<section className="border rounded-lg p-5 flex flex-col gap-3">
					<h2 className="text-sm font-semibold text-foreground">Fotos</h2>
					<label htmlFor={ids.photos} className="text-sm font-medium text-foreground">
						Archivos
					</label>
					<input
						id={ids.photos}
						type="file"
						accept="image/*"
						multiple
						onChange={(event) => {
							addPhotos(event.target.files);
							event.target.value = "";
						}}
						className="text-sm text-tertiary-foreground file:mr-3 file:rounded-lg file:border file:border-border file:bg-interactive-secondary file:px-3 file:py-1.5 file:text-sm file:text-foreground"
					/>
					{draft.photos.length === 0 ? (
						<p className="text-sm text-tertiary-foreground">
							Las fotos todavía no se publican en la página.
						</p>
					) : (
						<ul className="flex flex-col gap-1">
							{draft.photos.map((photo) => (
								<li
									key={photo.id}
									className="flex items-center justify-between gap-2"
								>
									<span className="truncate text-sm">{photo.name}</span>
									<Button
										type="button"
										variant="secondary"
										size="sm"
										onClick={() => removePhoto(photo.id)}
										aria-label={`Quitar ${photo.name}`}
									>
										Quitar
									</Button>
								</li>
							))}
						</ul>
					)}
				</section>

				<SavePublishControl
					saving={saving}
					saved={saved}
					live={live}
					error={errors.save}
					saveTick={saveTick}
				/>
			</form>
		</PageContainer>
	);
}
