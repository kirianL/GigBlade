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
import {
	ArrowsClockwiseIcon,
	CalendarXIcon,
	IdentificationCardIcon,
	TrashIcon,
} from "@phosphor-icons/react";
import {
	useId,
	useRef,
	useState,
	type ChangeEvent,
	type CSSProperties,
	type FormEvent,
	type ReactNode,
} from "react";
import { Link } from "react-router";
import { DJ_TEMPLATES, djEditorPageUrl, djPublicUrl } from "@/gigblade/concept";
import { BrandColorPicker } from "@/gigblade/BrandColorPicker";
import { PhotoGridReveal } from "@/gigblade/PhotoGridReveal";
import { SavePublishControl } from "@/gigblade/SavePublishControl";
import { readPanelAuthSession } from "@/gigblade/panel-session";
import {
	publicSiteAssetUrl,
	uploadSitePhoto,
} from "@/gigblade/site-api";
import { DjSelect, OpenPublicPageButton, PageContainer, PageHeader } from "@/gigblade/ui";
import {
	useDjProfile,
	type DjContentDraft,
	type DjLinkDraft,
	type DjSectionId,
} from "@/gigblade/useDjContent";

type FieldErrors = Partial<Record<"displayName" | "email" | "phone" | "template" | "save", string>>;

const LINK_ROWS: { id: keyof DjLinkDraft; label: string; hint: string }[] = [
	{ id: "instagram", label: "Instagram", hint: "Handle o URL https" },
	{ id: "tiktok", label: "TikTok", hint: "URL https" },
	{ id: "youtube", label: "YouTube", hint: "Perfil o canal, URL https" },
	{ id: "facebook", label: "Facebook", hint: "URL https" },
	{ id: "x", label: "X", hint: "URL https" },
	{
		id: "soundcloud",
		label: "SoundCloud",
		hint: "Perfil, URL https",
	},
	{
		id: "spotify",
		label: "Spotify",
		hint: "Enlace directo al perfil, track o playlist",
	},
];

const PATTERN_INK = "rgba(0, 0, 0, 0.45)";

function patternPreviewStyle(
	pattern: "none" | "dots" | "grid" | "diagonal" | "grain",
): CSSProperties {
	if (pattern === "dots") {
		return {
			backgroundImage: `radial-gradient(circle, ${PATTERN_INK} 1.15px, transparent 1.25px)`,
			backgroundSize: "10px 10px",
		};
	}
	if (pattern === "grid") {
		return {
			backgroundImage: `linear-gradient(${PATTERN_INK} 1px, transparent 1px), linear-gradient(90deg, ${PATTERN_INK} 1px, transparent 1px)`,
			backgroundSize: "12px 12px",
		};
	}
	if (pattern === "diagonal") {
		return {
			backgroundImage: `repeating-linear-gradient(-32deg, transparent 0 5px, ${PATTERN_INK} 5px 6px)`,
		};
	}
	if (pattern === "grain") {
		return {
			backgroundImage: `radial-gradient(circle, ${PATTERN_INK} 0.6px, transparent 0.7px)`,
			backgroundSize: "4px 4px",
		};
	}
	return {};
}

const SECTION_ROWS: { id: DjSectionId; label: string }[] = [
	{ id: "agenda", label: "Fechas" },
	{ id: "bio", label: "Biografía" },
	{ id: "enlaces", label: "Redes y música" },
	{ id: "sets", label: "Sets y mixes" },
	{ id: "contacto", label: "Contacto" },
];

async function optimizePhoto(file: File): Promise<File> {
	const image = await createImageBitmap(file);
	const maxSide = 1920;
	const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
	const canvas = document.createElement("canvas");
	canvas.width = Math.max(1, Math.round(image.width * scale));
	canvas.height = Math.max(1, Math.round(image.height * scale));
	const context = canvas.getContext("2d");
	if (!context) {
		image.close();
		return file;
	}
	context.drawImage(image, 0, 0, canvas.width, canvas.height);
	image.close();
	const blob = await new Promise<Blob | null>((resolve) =>
		canvas.toBlob(resolve, "image/webp", 0.84),
	);
	if (!blob || blob.size >= file.size) return file;
	return new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), {
		type: "image/webp",
	});
}

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

function ChoiceGroup<T extends string>({
	legend,
	name,
	value,
	options,
	onChange,
}: {
	legend: string;
	name: string;
	value: T;
	options: ReadonlyArray<{ id: T; label: string }>;
	onChange: (id: T) => void;
}) {
	const legendId = useId();
	return (
		<fieldset className="flex flex-col gap-2 border-0 p-0">
			<legend id={legendId} className="text-sm font-medium text-foreground">
				{legend}
			</legend>
			<div
				role="radiogroup"
				aria-labelledby={legendId}
				className="grid grid-cols-1 gap-2 sm:grid-cols-2"
			>
				{options.map((option) => {
					const checked = value === option.id;
					return (
						<label
							key={option.id}
							className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm ${
								checked
									? "border-foreground bg-interactive-secondary text-foreground"
									: "border-input text-tertiary-foreground"
							}`}
						>
							<input
								type="radio"
								name={name}
								value={option.id}
								checked={checked}
								onChange={() => onChange(option.id)}
								className="accent-foreground"
							/>
							{option.label}
						</label>
					);
				})}
			</div>
		</fieldset>
	);
}

function validate(draft: DjContentDraft): FieldErrors {
	const errors: FieldErrors = {};
	if (!draft.displayName.trim()) errors.displayName = "Indicá el nombre.";
	if (draft.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) {
		errors.email = "Indicá un correo válido.";
	}
	const phone = draft.phone.trim();
	const phoneDigits = phone.replace(/\D/g, "").length;
	if (
		phone &&
		(phone.length > 30 ||
			phoneDigits < 7 ||
			phoneDigits > 15 ||
			!/^\+?[\d\s().-]+$/.test(phone))
	) {
		errors.phone = "Indicá un número válido.";
	}
	if (!DJ_TEMPLATES.some((template) => template.id === draft.template)) {
		errors.template = "Elegí una plantilla.";
	}
	return errors;
}

export default function DjContentPage() {
	const { dj, setDj, draft, setDraft, save, live, maxMixes } = useDjProfile({
		syncLive: true,
	});
	const pageUrl = djEditorPageUrl(dj);
	const [errors, setErrors] = useState<FieldErrors>({});
	const [saved, setSaved] = useState(false);
	const [saving, setSaving] = useState(false);
	const [photoUploading, setPhotoUploading] = useState(false);
	const [photoError, setPhotoError] = useState("");
	const [pendingPhotoPreviews, setPendingPhotoPreviews] = useState<string[]>([]);
	const [replacePreview, setReplacePreview] = useState<{
		id: string;
		src: string;
	} | null>(null);
	const [saveTick, setSaveTick] = useState(0);
	const photoInputRef = useRef<HTMLInputElement>(null);
	const replaceInputRef = useRef<HTMLInputElement>(null);
	const replaceTargetRef = useRef<string | null>(null);
	const eventPhotoInputRef = useRef<HTMLInputElement>(null);
	const eventPhotoTargetRef = useRef<string | null>(null);
	const [eventPhotoPreview, setEventPhotoPreview] = useState<{
		id: string;
		src: string;
	} | null>(null);
	const [eventPhotoUploadingId, setEventPhotoUploadingId] = useState<
		string | null
	>(null);
	const [eventPhotoError, setEventPhotoError] = useState("");
	const ids = {
		displayName: useId(),
		email: useId(),
		phone: useId(),
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

	const addMix = () => {
		setDraft((current) => {
			if (current.mixes.length >= maxMixes) return current;
			return {
				...current,
				mixes: [
					...current.mixes,
					{ id: crypto.randomUUID(), title: "", url: "" },
				],
			};
		});
		setSaved(false);
	};

	const touchMix = (id: string, patch: { title?: string; url?: string }) => {
		setDraft((current) => ({
			...current,
			mixes: current.mixes.map((mix) =>
				mix.id === id ? { ...mix, ...patch } : mix,
			),
		}));
		setSaved(false);
	};

	const removeMix = (id: string) => {
		setDraft((current) => ({
			...current,
			mixes: current.mixes.filter((mix) => mix.id !== id),
		}));
		setSaved(false);
	};

	const addEvent = () => {
		setDraft((current) => ({
			...current,
			events: [
				...current.events,
				{
					id: crypto.randomUUID(),
					date: "",
					venue: "",
					location: "",
					ticketUrl: "",
					photo: "",
				},
			],
		}));
		setSaved(false);
	};

	const touchEvent = (
		id: string,
		patch: Partial<DjContentDraft["events"][number]>,
	) => {
		setDraft((current) => ({
			...current,
			events: current.events.map((event) =>
				event.id === id ? { ...event, ...patch } : event,
			),
		}));
		setSaved(false);
	};

	const removeEvent = (id: string) => {
		setDraft((current) => ({
			...current,
			events: current.events.filter((event) => event.id !== id),
		}));
		setSaved(false);
	};

	const startEventPhoto = (id: string) => {
		eventPhotoTargetRef.current = id;
		eventPhotoInputRef.current?.click();
	};

	const uploadEventPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		const id = eventPhotoTargetRef.current;
		event.target.value = "";
		eventPhotoTargetRef.current = null;
		if (!file || !id) return;

		const session = readPanelAuthSession();
		if (!session) {
			setEventPhotoError("Volvé a iniciar sesión para subir la foto.");
			return;
		}

		const preview = URL.createObjectURL(file);
		setEventPhotoPreview({ id, src: preview });
		setEventPhotoUploadingId(id);
		setEventPhotoError("");
		try {
			const optimized = await optimizePhoto(file);
			const url = await uploadSitePhoto({
				slug: dj.slug,
				file: optimized,
				token: session.token,
			});
			touchEvent(id, { photo: url, clearPhoto: false });
		} catch (error) {
			setEventPhotoError(
				error instanceof Error
					? error.message
					: "No se pudo subir la foto del evento.",
			);
		} finally {
			URL.revokeObjectURL(preview);
			setEventPhotoPreview(null);
			setEventPhotoUploadingId(null);
		}
	};

	const uploadPhotos = async (event: ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(event.target.files ?? []);
		event.target.value = "";
		if (files.length === 0) return;
		const available = Math.max(0, 12 - draft.photos.length);
		if (available === 0) return;

		const session = readPanelAuthSession();
		if (!session) {
			setPhotoError("Volvé a iniciar sesión para subir fotos.");
			return;
		}
		const selectedFiles = files.slice(0, available);
		const previews = selectedFiles.map((file) => URL.createObjectURL(file));
		setPendingPhotoPreviews(previews);
		setPhotoUploading(true);
		setPhotoError("");
		try {
			const uploaded: DjContentDraft["photos"] = [];
			for (const file of selectedFiles) {
				const optimized = await optimizePhoto(file);
				const url = await uploadSitePhoto({
					slug: dj.slug,
					file: optimized,
					token: session.token,
				});
				uploaded.push({ id: crypto.randomUUID(), url });
			}
			setDraft((current) => ({
				...current,
				photos: [...current.photos, ...uploaded],
			}));
			setSaved(false);
		} catch (error) {
			setPhotoError(
				error instanceof Error ? error.message : "No se pudo subir la foto.",
			);
		} finally {
			previews.forEach((preview) => URL.revokeObjectURL(preview));
			setPendingPhotoPreviews([]);
			setPhotoUploading(false);
		}
	};

	const removePhoto = (id: string) => {
		setDraft((current) => ({
			...current,
			photos: current.photos.filter((photo) => photo.id !== id),
		}));
		setSaved(false);
	};

	const startReplacePhoto = (id: string) => {
		replaceTargetRef.current = id;
		replaceInputRef.current?.click();
	};

	const replacePhoto = async (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		const id = replaceTargetRef.current;
		event.target.value = "";
		replaceTargetRef.current = null;
		if (!file || !id) return;

		const session = readPanelAuthSession();
		if (!session) {
			setPhotoError("Volvé a iniciar sesión para cambiar la foto.");
			return;
		}

		const preview = URL.createObjectURL(file);
		setReplacePreview({ id, src: preview });
		setPhotoUploading(true);
		setPhotoError("");
		try {
			const optimized = await optimizePhoto(file);
			const url = await uploadSitePhoto({
				slug: dj.slug,
				file: optimized,
				token: session.token,
			});
			setDraft((current) => ({
				...current,
				photos: current.photos.map((photo) =>
					photo.id === id ? { ...photo, url } : photo,
				),
			}));
			setSaved(false);
		} catch (error) {
			setPhotoError(
				error instanceof Error ? error.message : "No se pudo cambiar la foto.",
			);
		} finally {
			URL.revokeObjectURL(preview);
			setReplacePreview(null);
			setPhotoUploading(false);
		}
	};

	const toggleSection = (section: DjSectionId) => {
		setDraft((current) => ({
			...current,
			hiddenSections: current.hiddenSections.includes(section)
				? current.hiddenSections.filter((id) => id !== section)
				: [...current.hiddenSections, section],
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
								<Link to={`/studio?dj=${dj.slug}`}>
									{draft.displayName.trim() || dj.name}
								</Link>
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>Contenido</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>
				<div className="flex items-center gap-2">
					<DjSelect value={dj.slug} onValueChange={setDj} />
					<OpenPublicPageButton
						href={pageUrl}
						label={djPublicUrl(dj) ? "Abrir página" : "Ver plantilla"}
					/>
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
				{pageUrl ? (
					<CopyButton
						text={pageUrl}
						title={pageUrl}
						size="mini"
						className="text-tertiary-foreground"
						innerClassName="max-w-30 text-tiny-id truncate !font-normal"
					/>
				) : null}
			</PageHeader>

			<form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
				<fieldset className="border rounded-lg p-5 flex flex-col gap-4">
					<legend className="text-sm font-semibold text-foreground px-1">
						Perfil
					</legend>
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
						id={ids.email}
						label="Correo de contacto"
						hint="El correo público del artista. GigBlade no entrega una casilla."
						error={errors.email}
					>
						<Input
							id={ids.email}
							type="email"
							autoComplete="email"
							placeholder="ej. fechas@tu-correo.com"
							value={draft.email}
							onChange={(event) => touch({ email: event.target.value })}
							aria-invalid={Boolean(errors.email)}
							aria-describedby={
								errors.email ? `${ids.email}-error` : `${ids.email}-hint`
							}
						/>
					</Field>
					<Field
						id={ids.phone}
						label="Teléfono"
						hint="Opcional. Se publica en Contacto para llamar."
						error={errors.phone}
					>
						<Input
							id={ids.phone}
							type="tel"
							autoComplete="tel"
							inputMode="tel"
							placeholder="ej. +506 8888 0000"
							value={draft.phone}
							onChange={(event) => touch({ phone: event.target.value })}
							aria-invalid={Boolean(errors.phone)}
							aria-describedby={
								errors.phone ? `${ids.phone}-error` : `${ids.phone}-hint`
							}
						/>
					</Field>
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
				</fieldset>

				<fieldset className="border rounded-lg p-5 flex flex-col gap-4">
					<legend className="text-sm font-semibold text-foreground px-1">
						Próximas fechas
					</legend>
					<div className="flex items-start justify-between gap-3">
						<p className="text-xs text-tertiary-foreground">
							Solo se publica esta sección cuando hay fechas completas.
						</p>
						<Button
							type="button"
							variant="secondary"
							size="sm"
							onClick={addEvent}
							disabled={draft.events.length >= 12}
						>
							Agregar fecha
						</Button>
					</div>
					<input
						ref={eventPhotoInputRef}
						type="file"
						accept="image/jpeg,image/png,image/webp,image/avif"
						onChange={uploadEventPhoto}
						aria-label="Foto del evento"
						className="sr-only"
					/>
					{eventPhotoError ? (
						<p role="alert" className="text-sm text-destructive">
							{eventPhotoError}
						</p>
					) : null}
					{draft.events.length === 0 ? (
						<p className="text-sm text-tertiary-foreground">
							No hay fechas publicadas.
						</p>
					) : (
						<ul className="flex flex-col gap-4">
							{draft.events.map((item, index) => (
								<li
									key={item.id}
									className="grid gap-3 rounded-lg border p-3 sm:grid-cols-2"
								>
									<Field id={`${item.id}-date`} label="Fecha">
										<Input
											id={`${item.id}-date`}
											type="date"
											value={item.date}
											onChange={(event) =>
												touchEvent(item.id, { date: event.target.value })
											}
										/>
									</Field>
									<Field id={`${item.id}-venue`} label="Lugar">
										<Input
											id={`${item.id}-venue`}
											value={item.venue}
											placeholder="Club, festival o evento"
											onChange={(event) =>
												touchEvent(item.id, { venue: event.target.value })
											}
										/>
									</Field>
									<Field id={`${item.id}-location`} label="Ciudad">
										<Input
											id={`${item.id}-location`}
											value={item.location}
											placeholder="San José, Costa Rica"
											onChange={(event) =>
												touchEvent(item.id, { location: event.target.value })
											}
										/>
									</Field>
									<Field
										id={`${item.id}-ticket`}
										label="Entradas"
										hint="Opcional. URL https."
									>
										<Input
											id={`${item.id}-ticket`}
											type="url"
											value={item.ticketUrl}
											onChange={(event) =>
												touchEvent(item.id, {
													ticketUrl: event.target.value,
												})
											}
										/>
									</Field>
									<div className="flex flex-col gap-2 sm:col-span-2">
										<span
											id={`${item.id}-photo-label`}
											className="text-sm font-medium text-foreground"
										>
											Foto del evento
										</span>
										<p
											id={`${item.id}-photo-hint`}
											className="text-xs text-tertiary-foreground"
										>
											Opcional. JPG, PNG, WebP o AVIF, hasta 5 MB.
											Se comprime igual que las fotos de portada.
										</p>
										{eventPhotoPreview?.id === item.id || item.photo ? (
											<img
												src={
													eventPhotoPreview?.id === item.id
														? eventPhotoPreview.src
														: publicSiteAssetUrl(dj.slug, item.photo)
												}
												alt={
													item.venue.trim()
														? `Foto de ${item.venue.trim()}`
														: `Foto de la fecha ${index + 1}`
												}
												className="aspect-video w-full max-w-sm rounded-lg object-cover"
											/>
										) : null}
										<div className="flex flex-wrap items-center gap-1.5">
											<Button
												type="button"
												variant="secondary"
												size="sm"
												onClick={() => startEventPhoto(item.id)}
												disabled={eventPhotoUploadingId === item.id}
												aria-describedby={`${item.id}-photo-hint`}
												aria-label={
													item.venue.trim()
														? `${item.photo ? "Cambiar" : "Subir"} la foto de ${item.venue.trim()}`
														: `${item.photo ? "Cambiar" : "Subir"} la foto de la fecha ${index + 1}`
												}
											>
												<ArrowsClockwiseIcon className="size-3.5" aria-hidden />
												{eventPhotoUploadingId === item.id
													? "Subiendo…"
													: item.photo
														? "Cambiar foto"
														: "Subir foto"}
											</Button>
											{item.photo ? (
												<Button
													type="button"
													variant="secondary"
													size="sm"
													onClick={() =>
														touchEvent(item.id, {
															photo: "",
															clearPhoto: true,
														})
													}
													disabled={eventPhotoUploadingId === item.id}
													aria-label={
														item.venue.trim()
															? `Quitar la foto de ${item.venue.trim()}`
															: `Quitar la foto de la fecha ${index + 1}`
													}
												>
													<TrashIcon className="size-3.5" aria-hidden />
													Quitar foto
												</Button>
											) : null}
											<Button
												type="button"
												variant="secondary"
												size="sm"
												onClick={() => removeEvent(item.id)}
												aria-label={`Quitar fecha ${index + 1}`}
												className="text-destructive sm:ml-auto"
											>
												<CalendarXIcon className="size-3.5" aria-hidden />
												Quitar fecha
											</Button>
										</div>
									</div>
							</li>
							))}
						</ul>
					)}
				</fieldset>

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
							Claro, oscuro o party. Guardá para publicar el cambio en la página.
						</p>
					)}
					<BrandColorPicker
						value={draft.brandColor}
						onChange={(brandColor) => touch({ brandColor })}
					/>
					<fieldset className="flex flex-col gap-2 border-0 p-0">
						<legend
							id={`${ids.template}-pattern`}
							className="text-sm font-medium text-foreground"
						>
							Patrón de fondo
						</legend>
						<div
							role="radiogroup"
							aria-labelledby={`${ids.template}-pattern`}
							className="grid grid-cols-2 gap-2 sm:grid-cols-5"
						>
							{(
								[
									{ id: "none", label: "Liso" },
									{ id: "dots", label: "Puntos" },
									{ id: "grid", label: "Grilla" },
									{ id: "diagonal", label: "Diagonal" },
									{ id: "grain", label: "Grano" },
								] as const
							).map((pattern) => {
								const checked = draft.backgroundPattern === pattern.id;
								return (
									<label
										key={pattern.id}
										className={`flex cursor-pointer flex-col gap-1.5 rounded-lg border px-2 py-2 text-sm ${
											checked
												? "border-foreground bg-interactive-secondary text-foreground"
												: "border-input text-tertiary-foreground"
										}`}
									>
										<span className="flex items-center gap-2">
											<input
												type="radio"
												name="background-pattern"
												value={pattern.id}
												checked={checked}
												onChange={() =>
													touch({ backgroundPattern: pattern.id })
												}
												className="accent-foreground"
											/>
											{pattern.label}
										</span>
										<span
											aria-hidden
											className="h-8 w-full rounded-md border border-input bg-[#f4f4f5]"
											style={patternPreviewStyle(pattern.id)}
										/>
									</label>
								);
							})}
						</div>
						<p className="text-xs text-tertiary-foreground">
							Se publica sobre el color de la página. Guardá para verlo.
						</p>
					</fieldset>
					<ChoiceGroup
						legend="Estilo de portada"
						name="hero-style"
						value={draft.heroStyle}
						onChange={(heroStyle) => touch({ heroStyle })}
						options={[
							{ id: "cinematic", label: "Cine" },
							{ id: "poster", label: "Cartel" },
							{ id: "band", label: "Franja" },
							{ id: "type", label: "Tipográfica" },
							{ id: "duo", label: "Doble foto" },
						]}
					/>
					<ChoiceGroup
						legend="Alineación de la portada"
						name="hero-align"
						value={draft.heroAlign}
						onChange={(heroAlign) => touch({ heroAlign })}
						options={[
							{ id: "start", label: "Izquierda" },
							{ id: "center", label: "Centro" },
						]}
					/>
					<ChoiceGroup
						legend="Fondo de la página"
						name="surface-style"
						value={draft.surfaceStyle}
						onChange={(surfaceStyle) => touch({ surfaceStyle })}
						options={[
							{ id: "plain", label: "Color plano" },
							{ id: "gradient", label: "Degradado" },
							{ id: "bands", label: "Franjas" },
							{ id: "frame", label: "Marco" },
						]}
					/>
					<ChoiceGroup
						legend="Fechas"
						name="agenda-style"
						value={draft.agendaStyle}
						onChange={(agendaStyle) => touch({ agendaStyle })}
						options={[
							{ id: "list", label: "Lista" },
							{ id: "cards", label: "Tarjetas" },
						]}
					/>
					<ChoiceGroup
						legend="Biografía"
						name="bio-style"
						value={draft.bioStyle}
						onChange={(bioStyle) => touch({ bioStyle })}
						options={[
							{ id: "quote", label: "Cita" },
							{ id: "columns", label: "Columnas" },
						]}
					/>
					<ChoiceGroup
						legend="Sets"
						name="mix-style"
						value={draft.mixStyle}
						onChange={(mixStyle) => touch({ mixStyle })}
						options={[
							{ id: "grid", label: "Grilla" },
							{ id: "row", label: "Fila" },
							{ id: "list", label: "Lista" },
						]}
					/>
					<ChoiceGroup
						legend="Redes"
						name="link-style"
						value={draft.linkStyle}
						onChange={(linkStyle) => touch({ linkStyle })}
						options={[
							{ id: "cards", label: "Tarjetas" },
							{ id: "icons", label: "Botones con nombre" },
						]}
					/>
					<ChoiceGroup
						legend="Botones"
						name="button-style"
						value={draft.buttonStyle}
						onChange={(buttonStyle) => touch({ buttonStyle })}
						options={[
							{ id: "pill", label: "Pastilla" },
							{ id: "square", label: "Cuadrado" },
							{ id: "text", label: "Texto" },
						]}
					/>
					<ChoiceGroup
						legend="Esquinas"
						name="corner-style"
						value={draft.cornerStyle}
						onChange={(cornerStyle) => touch({ cornerStyle })}
						options={[
							{ id: "round", label: "Redondas" },
							{ id: "sharp", label: "Rectas" },
						]}
					/>
					<ChoiceGroup
						legend="Tipografía del nombre"
						name="title-style"
						value={draft.titleStyle}
						onChange={(titleStyle) => touch({ titleStyle })}
						options={[
							{ id: "tight", label: "Compacta" },
							{ id: "wide", label: "Abierta" },
							{ id: "spaced", label: "Espaciada" },
						]}
					/>
					<Field
						id={`${ids.template}-hero-position`}
						label="Encuadre de portada"
						hint="Elegí qué zona de la foto debe mantenerse visible."
					>
						<select
							id={`${ids.template}-hero-position`}
							value={draft.heroPosition}
							onChange={(event) =>
								touch({
									heroPosition: event.target
										.value as DjContentDraft["heroPosition"],
								})
							}
							aria-describedby={`${ids.template}-hero-position-hint`}
							className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
						>
							<option value="center">Centro</option>
							<option value="top">Arriba</option>
							<option value="bottom">Abajo</option>
							<option value="left">Izquierda</option>
							<option value="right">Derecha</option>
						</select>
					</Field>
					<fieldset className="flex flex-col gap-2 border-0 p-0">
						<legend className="text-sm font-medium text-foreground">
							Secciones visibles
						</legend>
						<div className="grid gap-2 sm:grid-cols-2">
							{SECTION_ROWS.map((section) => (
								<label
									key={section.id}
									className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm"
								>
									<input
										type="checkbox"
										checked={!draft.hiddenSections.includes(section.id)}
										onChange={() => toggleSection(section.id)}
										className="accent-foreground"
									/>
									{section.label}
								</label>
							))}
						</div>
						<p className="text-xs text-tertiary-foreground">
							Las secciones sin contenido también se ocultan automáticamente.
						</p>
					</fieldset>
				</fieldset>

				<fieldset className="border rounded-lg p-5 flex flex-col gap-4">
					<legend className="text-sm font-semibold text-foreground px-1">
						Redes y música
					</legend>
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
				</fieldset>

				<fieldset className="border rounded-lg p-5 flex flex-col gap-4">
					<legend className="text-sm font-semibold text-foreground px-1">
						Sets y mixes
					</legend>
					<div className="flex items-start justify-between gap-3">
						<p className="text-xs text-tertiary-foreground">
							Pegá el link directo del video o del track. YouTube o
							SoundCloud, hasta {maxMixes}.
						</p>
						<Button
							type="button"
							variant="secondary"
							size="sm"
							onClick={addMix}
							disabled={draft.mixes.length >= maxMixes}
						>
							Agregar mix
						</Button>
					</div>
					{draft.mixes.length === 0 ? (
						<p className="text-sm text-tertiary-foreground">
							Todavía no hay mixes en la página.
						</p>
					) : (
						<ul className="flex flex-col gap-3">
							{draft.mixes.map((mix, index) => {
								const titleId = `${ids.displayName}-mix-title-${mix.id}`;
								const urlId = `${ids.displayName}-mix-url-${mix.id}`;
								return (
									<li
										key={mix.id}
										className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto] sm:items-start"
									>
										<Field id={titleId} label={`Título ${index + 1}`}>
											<Input
												id={titleId}
												value={mix.title}
												onChange={(event) =>
													touchMix(mix.id, { title: event.target.value })
												}
												placeholder="After hours 04"
											/>
										</Field>
										<Field id={urlId} label="Link">
											<Input
												id={urlId}
												value={mix.url}
												onChange={(event) =>
													touchMix(mix.id, { url: event.target.value })
												}
												placeholder="https://soundcloud.com/artista/mix"
											/>
										</Field>
										<div className="flex flex-col gap-1.5">
											<span
												className="hidden text-sm font-medium sm:block"
												aria-hidden="true"
											>
												&nbsp;
											</span>
											<Button
												type="button"
												variant="secondary"
												size="sm"
												onClick={() => removeMix(mix.id)}
												aria-label={`Quitar mix ${index + 1}`}
											>
												Quitar
											</Button>
										</div>
									</li>
								);
							})}
						</ul>
					)}
				</fieldset>

				<fieldset className="border rounded-lg p-5 flex flex-col gap-3">
					<legend className="text-sm font-semibold text-foreground px-1">
						Fotos
					</legend>
					<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
						<p
							id={`${ids.photos}-help`}
							className="text-xs text-tertiary-foreground"
						>
							JPG, PNG, WebP o AVIF, hasta 5 MB. La primera se usa
							en portada. Cambiar una foto mantiene su lugar.
						</p>
						<input
							ref={photoInputRef}
							id={ids.photos}
							type="file"
							accept="image/jpeg,image/png,image/webp,image/avif"
							multiple
							onChange={uploadPhotos}
							aria-describedby={`${ids.photos}-help`}
							className="sr-only"
						/>
						<input
							ref={replaceInputRef}
							type="file"
							accept="image/jpeg,image/png,image/webp,image/avif"
							onChange={replacePhoto}
							aria-label="Nueva imagen para la foto elegida"
							className="sr-only"
						/>
						<Button
							type="button"
							variant="secondary"
							size="sm"
							onClick={() => photoInputRef.current?.click()}
							disabled={photoUploading || draft.photos.length >= 12}
							className="w-full shrink-0 sm:w-auto"
						>
							{photoUploading ? "Subiendo…" : "Subir fotos"}
						</Button>
					</div>
					{photoError ? (
						<p
							role="alert"
							className="text-sm text-destructive"
						>
							{photoError}
						</p>
					) : null}
					{pendingPhotoPreviews.length > 0 ? (
						<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
							{pendingPhotoPreviews.map((preview) => (
								<PhotoGridReveal key={preview} src={preview} />
							))}
						</div>
					) : null}
					{draft.photos.length > 0 ? (
						<ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
							{draft.photos.map((photo, index) => (
								<li
									key={photo.id}
									className="relative overflow-hidden rounded-lg border bg-interactive-secondary"
								>
									<img
										src={
											replacePreview?.id === photo.id
												? replacePreview.src
												: publicSiteAssetUrl(dj.slug, photo.url)
										}
										alt={index === 0 ? "Portada" : `Foto ${index + 1}`}
										className="aspect-4/3 w-full object-cover"
									/>
									<div className="flex items-center justify-between gap-2 px-3 py-2">
										<span className="truncate text-xs font-medium text-foreground">
											{index === 0 ? "Portada" : `Foto ${index + 1}`}
										</span>
										<div className="flex shrink-0 items-center gap-1.5">
											<Button
												type="button"
												variant="secondary"
												size="sm"
												onClick={() => startReplacePhoto(photo.id)}
												disabled={photoUploading}
												aria-label={
													index === 0
														? "Cambiar la portada"
														: `Cambiar foto ${index + 1}`
												}
											>
												<ArrowsClockwiseIcon className="size-3.5" aria-hidden />
												{replacePreview?.id === photo.id
													? "Cambiando…"
													: "Cambiar"}
											</Button>
											<Button
												type="button"
												variant="secondary"
												size="sm"
												onClick={() => removePhoto(photo.id)}
												disabled={photoUploading}
												aria-label={
													index === 0
														? "Quitar la portada"
														: `Quitar foto ${index + 1}`
												}
												className="text-destructive"
											>
												<TrashIcon className="size-3.5" aria-hidden />
												Quitar
											</Button>
										</div>
									</div>
								</li>
							))}
						</ul>
					) : pendingPhotoPreviews.length === 0 ? (
						<div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm text-tertiary-foreground">
							No hay fotos publicadas.
						</div>
					) : null}
				</fieldset>

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
