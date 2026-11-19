"use client";

import Link from "next/link";
import {
	useRef,
	useState,
	type CSSProperties,
	type ChangeEvent,
	type FormEvent,
} from "react";
import {
	Calendar,
	Eye,
	EyeOff,
	Image as ImageIcon,
	Music,
	Plus,
	RefreshCw,
	Trash2,
	Upload,
} from "lucide-react";
import { DJ_TEMPLATES, djEditorPageUrl } from "@/panel/concept";
import { BrandColorPicker } from "@/panel/BrandColorPicker";
import { PhotoGridReveal } from "@/panel/PhotoGridReveal";
import { SavePublishControl } from "@/panel/SavePublishControl";
import { readPanelAuthSession } from "@/panel/panel-session";
import { publicSiteAssetUrl, uploadSitePhoto } from "@/panel/site-api";
import {
	useDjProfile,
	type DjContentDraft,
	type DjLinkDraft,
	type DjSectionId,
} from "@/panel/useDjContent";
import {
	DjSelect,
	OpenPublicPageButton,
	PageContainer,
	PageHeader,
	PanelButton,
	PanelInput,
	PanelTextarea,
	SegmentedControl,
} from "@/panel/ui";

type FieldErrors = Partial<
	Record<"displayName" | "email" | "phone" | "template" | "save", string>
>;

const LINK_ROWS: { id: keyof DjLinkDraft; label: string; hint: string }[] = [
	{ id: "instagram", label: "Instagram", hint: "Handle o URL https" },
	{ id: "tiktok", label: "TikTok", hint: "URL https" },
	{ id: "youtube", label: "YouTube", hint: "Perfil o canal, URL https" },
	{ id: "facebook", label: "Facebook", hint: "URL https" },
	{ id: "x", label: "X", hint: "URL https" },
	{ id: "soundcloud", label: "SoundCloud", hint: "Perfil, URL https" },
	{ id: "spotify", label: "Spotify", hint: "Perfil, track o playlist" },
];

const SECTION_ROWS: { id: DjSectionId; label: string }[] = [
	{ id: "agenda", label: "Fechas / Agenda" },
	{ id: "bio", label: "Biografía" },
	{ id: "enlaces", label: "Redes y música" },
	{ id: "sets", label: "Sets y mixes" },
	{ id: "contacto", label: "Contacto" },
];

const BACKGROUND_PATTERNS: {
	id: DjContentDraft["backgroundPattern"];
	label: string;
}[] = [
	{ id: "none", label: "Liso" },
	{ id: "dots", label: "Puntos" },
	{ id: "grid", label: "Grilla" },
	{ id: "diagonal", label: "Diagonal" },
	{ id: "grain", label: "Grano" },
];

const PATTERN_INK = "rgba(128, 128, 128, 0.45)";

function patternPreviewStyle(
	pattern: DjContentDraft["backgroundPattern"],
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

function validate(draft: DjContentDraft): FieldErrors {
	const errors: FieldErrors = {};
	if (!draft.displayName.trim()) errors.displayName = "Indicá el nombre.";
	if (
		draft.email.trim() &&
		!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())
	) {
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
	if (!DJ_TEMPLATES.some((t) => t.id === draft.template)) {
		errors.template = "Elegí una plantilla.";
	}
	return errors;
}

export default function DjContentPage() {
	const { dj, setDj, draft, setDraft, save, live, maxMixes } = useDjProfile({
		syncLive: true,
	});
	const pageUrl = djEditorPageUrl(dj);
	const [sectionTab, setSectionTab] = useState<
		"perfil" | "fotos" | "agenda" | "estilo"
	>("perfil");
	const [errors, setErrors] = useState<FieldErrors>({});
	const [saved, setSaved] = useState(false);
	const [saving, setSaving] = useState(false);
	const [photoUploading, setPhotoUploading] = useState(false);
	const [photoError, setPhotoError] = useState("");
	const [pendingPhotoPreviews, setPendingPhotoPreviews] = useState<string[]>(
		[],
	);
	const [saveTick, setSaveTick] = useState(0);

	const photoInputRef = useRef<HTMLInputElement>(null);
	const replaceInputRef = useRef<HTMLInputElement>(null);
	const replaceTargetRef = useRef<string | null>(null);

	const patch = <K extends keyof DjContentDraft>(
		key: K,
		value: DjContentDraft[K],
	) => {
		setSaved(false);
		setDraft({ ...draft, [key]: value });
	};

	const patchLink = (key: keyof DjLinkDraft, value: string) => {
		setSaved(false);
		setDraft({ ...draft, links: { ...draft.links, [key]: value } });
	};

	const toggleHiddenSection = (sectionId: DjSectionId) => {
		const exists = draft.hiddenSections.includes(sectionId);
		patch(
			"hiddenSections",
			exists
				? draft.hiddenSections.filter((s) => s !== sectionId)
				: [...draft.hiddenSections, sectionId],
		);
	};

	const handlePhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(event.target.files ?? []);
		event.target.value = "";
		if (files.length === 0) return;

		const session = readPanelAuthSession();
		if (!session?.token) {
			setPhotoError("Iniciá sesión de nuevo para subir fotos.");
			return;
		}
		setPhotoError("");
		setPhotoUploading(true);
		const previews = files.map((file) => URL.createObjectURL(file));
		setPendingPhotoPreviews(previews);

		try {
			const uploadedUrls: string[] = [];
			for (const file of files) {
				const optimized = await optimizePhoto(file);
				const url = await uploadSitePhoto({
					slug: dj.slug,
					file: optimized,
					token: session.token,
				});
				uploadedUrls.push(url);
			}
			const nextPhotos = [
				...draft.photos,
				...uploadedUrls.map((url) => ({ id: crypto.randomUUID(), url })),
			];
			patch("photos", nextPhotos);
		} catch (err) {
			setPhotoError(
				err instanceof Error ? err.message : "No se pudieron subir las fotos.",
			);
		} finally {
			for (const url of previews) URL.revokeObjectURL(url);
			setPendingPhotoPreviews([]);
			setPhotoUploading(false);
		}
	};

	const handleReplacePhoto = async (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		const targetId = replaceTargetRef.current;
		event.target.value = "";
		replaceTargetRef.current = null;
		if (!file || !targetId) return;

		const session = readPanelAuthSession();
		if (!session?.token) return;
		setPhotoUploading(true);
		setPhotoError("");
		try {
			const optimized = await optimizePhoto(file);
			const url = await uploadSitePhoto({
				slug: dj.slug,
				file: optimized,
				token: session.token,
			});
			patch(
				"photos",
				draft.photos.map((p) => (p.id === targetId ? { ...p, url } : p)),
			);
		} catch (err) {
			setPhotoError(
				err instanceof Error ? err.message : "No se pudo reemplazar la foto.",
			);
		} finally {
			setPhotoUploading(false);
		}
	};

	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault();
		const nextErrors = validate(draft);
		setErrors(nextErrors);
		if (Object.keys(nextErrors).length > 0) return;

		setSaving(true);
		setSaved(false);
		try {
			await save(draft);
			setSaved(true);
			setSaveTick((t) => t + 1);
		} catch (err) {
			setErrors({
				save: err instanceof Error ? err.message : "No se pudo guardar.",
			});
		} finally {
			setSaving(false);
		}
	};

	return (
		<PageContainer>
			<PageHeader
				title="Contenido y diseño"
				subtitle={`Editá la página pública de ${dj.name} y publicá los cambios al instante`}
			>
				<Link
					href={`/studio?dj=${dj.slug}`}
					className="inline-flex h-8 items-center gap-1.5 rounded-md border border-grayscale-4 bg-grayscale-1 px-3 text-[12px] font-medium text-grayscale-11 shadow-[0_1px_2px_rgba(28,22,16,0.04)] transition-[background-color,border-color,color,transform] duration-150 ease-[cubic-bezier(0.2,0,0,1)] hover:border-grayscale-5 hover:bg-grayscale-2 hover:text-grayscale-12 active:scale-[0.96] dark:bg-grayscale-2 dark:hover:bg-grayscale-3"
				>
					← Mi página
				</Link>
				<DjSelect value={dj.slug} onValueChange={setDj} />
				<OpenPublicPageButton
					href={pageUrl}
					label={pageUrl?.includes(".localhost") ? "Ver plantilla" : "Abrir página"}
				/>
			</PageHeader>

			<SegmentedControl
				value={sectionTab}
				onChange={setSectionTab}
				options={[
					{ value: "perfil", label: "Perfil y redes" },
					{ value: "fotos", label: "Fotos", count: draft.photos.length },
					{
						value: "agenda",
						label: "Fechas y sets",
						count: draft.events.length + draft.mixes.length,
					},
					{ value: "estilo", label: "Apariencia y bloques" },
				]}
			/>

			<form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
				{/* TAB 1: PERFIL Y REDES */}
				{sectionTab === "perfil" ? (
					<div className="space-y-6">
						<section className="card p-7 shadow-xs space-y-5">
							<div>
								<h2 className="text-sm font-semibold text-grayscale-12">
									Información principal
								</h2>
								<p className="text-xs text-grayscale-9 mt-0.5">
									Datos visibles en la portada, biografía y sección de contacto.
								</p>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div>
									<label className="block text-xs font-semibold text-grayscale-11 mb-1.5">
										Nombre artístico *
									</label>
									<PanelInput
										required
										value={draft.displayName}
										onChange={(e) => patch("displayName", e.target.value)}
										placeholder="Ej. DJ Marco"
									/>
									{errors.displayName ? (
										<p className="text-[11px] text-red-600 mt-1">
											{errors.displayName}
										</p>
									) : null}
								</div>

								<div>
									<label className="block text-xs font-semibold text-grayscale-11 mb-1.5">
										Ciudad / Base
									</label>
									<PanelInput
										value={draft.city}
										onChange={(e) => patch("city", e.target.value)}
										placeholder="Ej. San José, CR"
									/>
								</div>

								<div className="sm:col-span-2">
									<label className="block text-xs font-semibold text-grayscale-11 mb-1.5">
										Subtítulo / Tagline
									</label>
									<PanelInput
										value={draft.tagline}
										onChange={(e) => patch("tagline", e.target.value)}
										placeholder="Ej. Tech House · Club & Festival Sets"
									/>
								</div>

								<div className="sm:col-span-2">
									<label className="block text-xs font-semibold text-grayscale-11 mb-1.5">
										Biografía
									</label>
									<PanelTextarea
										rows={4}
										value={draft.bio}
										onChange={(e) => patch("bio", e.target.value)}
										placeholder="Contá tu trayectoria, estilo musical y eventos destacados…"
									/>
								</div>

								<div>
									<label className="block text-xs font-semibold text-grayscale-11 mb-1.5">
										Correo de bookings
									</label>
									<PanelInput
										type="email"
										value={draft.email}
										onChange={(e) => patch("email", e.target.value)}
										placeholder="bookings@dj.com"
									/>
									{errors.email ? (
										<p className="text-[11px] text-red-600 mt-1">{errors.email}</p>
									) : null}
								</div>

								<div>
									<label className="block text-xs font-semibold text-grayscale-11 mb-1.5">
										Teléfono / WhatsApp
									</label>
									<PanelInput
										value={draft.phone}
										onChange={(e) => patch("phone", e.target.value)}
										placeholder="+506 8888-8888"
									/>
									{errors.phone ? (
										<p className="text-[11px] text-red-600 mt-1">{errors.phone}</p>
									) : null}
								</div>
							</div>
						</section>

						<section className="card p-7 shadow-xs space-y-5">
							<div>
								<h2 className="text-sm font-semibold text-grayscale-12">
									Redes sociales y plataformas de música
								</h2>
								<p className="text-xs text-grayscale-9 mt-0.5">
									Dejá en blanco las plataformas que no quieras mostrar.
								</p>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								{LINK_ROWS.map((row) => (
									<div key={row.id}>
										<label className="block text-xs font-semibold text-grayscale-11 mb-1.5">
											{row.label}
										</label>
										<PanelInput
											value={draft.links[row.id]}
											onChange={(e) => patchLink(row.id, e.target.value)}
											placeholder={row.hint}
										/>
									</div>
								))}
							</div>
						</section>
					</div>
				) : null}

				{/* TAB 2: FOTOS */}
				{sectionTab === "fotos" ? (
					<section className="card p-7 shadow-xs space-y-5">
						<div className="flex flex-wrap items-center justify-between gap-3">
							<div>
								<h2 className="text-sm font-semibold text-grayscale-12">
									Galería y foto de portada
								</h2>
								<p className="text-xs text-grayscale-9 mt-0.5">
									La primera foto se usa como portada principal. Se optimizan automáticamente a WebP.
								</p>
							</div>
							<div>
								<input
									ref={photoInputRef}
									type="file"
									accept="image/jpeg,image/png,image/webp"
									multiple
									className="hidden"
									onChange={(e) => void handlePhotoUpload(e)}
								/>
								<input
									ref={replaceInputRef}
									type="file"
									accept="image/jpeg,image/png,image/webp"
									className="hidden"
									onChange={(e) => void handleReplacePhoto(e)}
								/>
								<PanelButton
									variant="primary"
									disabled={photoUploading}
									onClick={() => photoInputRef.current?.click()}
								>
									<Upload size={13} />
									<span>{photoUploading ? "Subiendo…" : "Subir fotos"}</span>
								</PanelButton>
							</div>
						</div>

						{photoError ? (
							<div className="p-3.5 bg-red-3/60 border border-red-6/60 text-red-11 text-xs rounded-xl">
								{photoError}
							</div>
						) : null}

						<div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
							{draft.photos.map((photo, index) => (
								<div
									key={photo.id}
									className="group relative aspect-4/3 rounded-xl overflow-hidden border border-grayscale-4 bg-grayscale-2"
								>
									<img
										src={publicSiteAssetUrl(dj.slug, photo.url)}
										alt=""
										className="w-full h-full object-cover"
									/>
									{index === 0 ? (
										<span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/75 text-white text-[10px] font-semibold">
											Portada
										</span>
									) : null}
									<div className="absolute bottom-2 right-2 flex items-center gap-1.5">
										<button
											type="button"
											onClick={() => {
												replaceTargetRef.current = photo.id;
												replaceInputRef.current?.click();
											}}
											className="p-1.5 rounded-xl bg-white/95 text-grayscale-11 shadow-xs hover:bg-grayscale-1 dark:bg-[#1b1b1a] cursor-pointer"
											title="Reemplazar foto"
										>
											<RefreshCw size={12} />
										</button>
										<button
											type="button"
											onClick={() =>
												patch(
													"photos",
													draft.photos.filter((p) => p.id !== photo.id),
												)
											}
											className="p-1.5 rounded-xl bg-white/95 text-red-600 shadow-xs hover:bg-grayscale-1 dark:bg-[#1b1b1a] cursor-pointer"
											title="Eliminar foto"
										>
											<Trash2 size={12} />
										</button>
									</div>
								</div>
							))}
							{pendingPhotoPreviews.map((src) => (
								<PhotoGridReveal key={src} src={src} />
							))}
						</div>

						{draft.photos.length === 0 && pendingPhotoPreviews.length === 0 ? (
							<div className="p-10 bg-grayscale-2/70 border border-dashed border-grayscale-5 rounded-xl text-center">
								<ImageIcon size={22} className="mx-auto text-grayscale-8 mb-2" />
								<p className="text-xs font-semibold text-grayscale-11">
									Sin fotos cargadas
								</p>
								<p className="text-[11px] text-grayscale-9 mt-0.5">
									Subí al menos una foto para la portada de tu sitio.
								</p>
							</div>
						) : null}
					</section>
				) : null}

				{/* TAB 3: AGENDA Y SETS */}
				{sectionTab === "agenda" ? (
					<div className="space-y-6">
						{/* Eventos */}
						<section className="card p-7 shadow-xs space-y-5">
							<div className="flex items-center justify-between gap-3">
								<div>
									<h2 className="text-sm font-semibold text-grayscale-12 flex items-center gap-2">
										<Calendar size={15} className="text-grayscale-9" />
										<span>Próximas fechas</span>
									</h2>
									<p className="text-xs text-grayscale-9 mt-0.5">
										Agenda pública de presentaciones y enlaces a entradas.
									</p>
								</div>
								<PanelButton
									variant="secondary"
									size="sm"
									onClick={() =>
										patch("events", [
											...draft.events,
											{
												id: crypto.randomUUID(),
												date: "",
												venue: "",
												location: "",
												ticketUrl: "",
												photo: "",
											},
										])
									}
								>
									<Plus size={13} />
									<span>Agregar fecha</span>
								</PanelButton>
							</div>

							{draft.events.length === 0 ? (
								<p className="text-xs text-grayscale-9 py-4 text-center bg-grayscale-2/50 rounded-xl border border-grayscale-3/80">
									No hay fechas cargadas todavía.
								</p>
							) : (
								<div className="space-y-3">
									{draft.events.map((ev) => (
										<div
											key={ev.id}
											className="p-4 surface-soft grid grid-cols-1 sm:grid-cols-2 gap-3"
										>
											<PanelInput
												placeholder="Fecha (ej. 24 Nov)"
												value={ev.date}
												onChange={(e) =>
													patch(
														"events",
														draft.events.map((x) =>
															x.id === ev.id
																? { ...x, date: e.target.value }
																: x,
														),
													)
												}
												className="bg-grayscale-1 dark:bg-[#1b1b1a]"
											/>
											<PanelInput
												placeholder="Club / Festival"
												value={ev.venue}
												onChange={(e) =>
													patch(
														"events",
														draft.events.map((x) =>
															x.id === ev.id
																? { ...x, venue: e.target.value }
																: x,
														),
													)
												}
												className="bg-grayscale-1 dark:bg-[#1b1b1a]"
											/>
											<PanelInput
												placeholder="Ciudad"
												value={ev.location}
												onChange={(e) =>
													patch(
														"events",
														draft.events.map((x) =>
															x.id === ev.id
																? { ...x, location: e.target.value }
																: x,
														),
													)
												}
												className="bg-grayscale-1 dark:bg-[#1b1b1a]"
											/>
											<div className="flex gap-2">
												<PanelInput
													placeholder="URL de tickets (opcional)"
													value={ev.ticketUrl}
													onChange={(e) =>
														patch(
															"events",
															draft.events.map((x) =>
																x.id === ev.id
																	? { ...x, ticketUrl: e.target.value }
																	: x,
															),
														)
													}
													className="bg-grayscale-1 dark:bg-[#1b1b1a] flex-1"
												/>
												<PanelButton
													variant="secondary"
													size="sm"
													onClick={() =>
														patch(
															"events",
															draft.events.filter((x) => x.id !== ev.id),
														)
													}
												>
													<Trash2 size={13} className="text-red-500" />
												</PanelButton>
											</div>
										</div>
									))}
								</div>
							)}
						</section>

						{/* Sets / Mixes */}
						<section className="card p-7 shadow-xs space-y-5">
							<div className="flex items-center justify-between gap-3">
								<div>
									<h2 className="text-sm font-semibold text-grayscale-12 flex items-center gap-2">
										<Music size={15} className="text-grayscale-9" />
										<span>Sets y mixes ({draft.mixes.length}/{maxMixes})</span>
									</h2>
									<p className="text-xs text-grayscale-9 mt-0.5">
										Enlaces directos de YouTube o SoundCloud.
									</p>
								</div>
								<PanelButton
									variant="secondary"
									size="sm"
									disabled={draft.mixes.length >= maxMixes}
									onClick={() =>
										patch("mixes", [
											...draft.mixes,
											{ id: crypto.randomUUID(), title: "", url: "" },
										])
									}
								>
									<Plus size={13} />
									<span>Agregar set</span>
								</PanelButton>
							</div>

							{draft.mixes.length === 0 ? (
								<p className="text-xs text-grayscale-9 py-4 text-center bg-grayscale-2/50 rounded-xl border border-grayscale-3/80">
									No hay sets agregados todavía.
								</p>
							) : (
								<div className="space-y-3">
									{draft.mixes.map((mix) => (
										<div
											key={mix.id}
											className="p-4 surface-soft flex flex-col sm:flex-row gap-3"
										>
											<PanelInput
												placeholder="Título del set"
												value={mix.title}
												onChange={(e) =>
													patch(
														"mixes",
														draft.mixes.map((x) =>
															x.id === mix.id
																? { ...x, title: e.target.value }
																: x,
														),
													)
												}
												className="bg-grayscale-1 dark:bg-[#1b1b1a] sm:w-1/3"
											/>
											<PanelInput
												placeholder="https://youtube.com/... o https://soundcloud.com/..."
												value={mix.url}
												onChange={(e) =>
													patch(
														"mixes",
														draft.mixes.map((x) =>
															x.id === mix.id
																? { ...x, url: e.target.value }
																: x,
														),
													)
												}
												className="bg-grayscale-1 dark:bg-[#1b1b1a] flex-1"
											/>
											<PanelButton
												variant="secondary"
												size="sm"
												onClick={() =>
													patch(
														"mixes",
														draft.mixes.filter((x) => x.id !== mix.id),
													)
												}
											>
												<Trash2 size={13} className="text-red-500" />
											</PanelButton>
										</div>
									))}
								</div>
							)}
						</section>
					</div>
				) : null}

				{/* TAB 4: APARIENCIA Y BLOQUES */}
				{sectionTab === "estilo" ? (
					<div className="space-y-8">
						{/* Grupo 1: Plantilla, color y textura */}
						<section className="space-y-6">
							<div>
								<h2 className="text-sm font-semibold text-grayscale-12">
									Plantilla, color y fondo
								</h2>
								<p className="text-xs text-grayscale-9 mt-0.5">
									Elegí el tema base, el color de acento, el estilo de superficie y el patrón.
								</p>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
								{DJ_TEMPLATES.map((tpl) => {
									const active = draft.template === tpl.id;
									return (
										<button
											key={tpl.id}
											type="button"
											onClick={() => patch("template", tpl.id)}
											className={`px-4 py-3 text-left rounded-lg border transition-[color,background-color,border-color,transform] duration-150 ease-[cubic-bezier(0.2,0,0,1)] active:scale-[0.96] cursor-pointer ${
												active
													? "border-grayscale-12 bg-grayscale-12 text-grayscale-1 shadow-xs"
													: "border-grayscale-4 bg-grayscale-1 dark:bg-[#1b1b1a] hover:border-grayscale-6 text-grayscale-12"
											}`}
										>
											<div className="text-xs font-semibold">{tpl.label}</div>
											<div
												className={`text-[11px] font-mono mt-0.5 ${
													active ? "text-grayscale-1/70" : "text-grayscale-8"
												}`}
											>
												{tpl.id}
											</div>
										</button>
									);
								})}
							</div>

							<div className="pt-2">
								<BrandColorPicker
									value={draft.brandColor}
									onChange={(hex) => patch("brandColor", hex)}
								/>
							</div>

							<div className="space-y-2">
								<span className="section-label block">Fondo de la página</span>
								<SegmentedControl
									value={draft.surfaceStyle}
									onChange={(val) => patch("surfaceStyle", val)}
									ariaLabel="Fondo de la página"
									options={[
										{ value: "plain", label: "Color plano" },
										{ value: "gradient", label: "Degradado" },
										{ value: "bands", label: "Franjas" },
										{ value: "frame", label: "Marco" },
									]}
								/>
							</div>

							<div className="space-y-2">
								<span className="section-label block">Patrón de fondo</span>
								<div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
									{BACKGROUND_PATTERNS.map((pattern) => {
										const active = draft.backgroundPattern === pattern.id;
										return (
											<button
												key={pattern.id}
												type="button"
												onClick={() => patch("backgroundPattern", pattern.id)}
												className={`flex flex-col gap-2 rounded-lg border p-2.5 text-left transition-[color,background-color,border-color,transform] duration-150 ease-[cubic-bezier(0.2,0,0,1)] active:scale-[0.96] cursor-pointer ${
													active
														? "border-grayscale-12 bg-grayscale-2/90 dark:bg-[#232321] text-grayscale-12 shadow-xs"
														: "border-grayscale-4 bg-grayscale-1 dark:bg-[#1b1b1a] hover:border-grayscale-6 text-grayscale-10 hover:text-grayscale-12"
												}`}
											>
												<span
													aria-hidden
													className="h-8 w-full rounded-md border border-grayscale-4/80 bg-grayscale-2 dark:bg-[#141413]"
													style={patternPreviewStyle(pattern.id)}
												/>
												<span className="text-[11.5px] font-medium">
													{pattern.label}
												</span>
											</button>
										);
									})}
								</div>
							</div>
						</section>

						{/* Grupo 2: Portada */}
						<section className="pt-6 border-t border-grayscale-3/80 dark:border-white/[0.08] space-y-5">
							<div>
								<h2 className="text-sm font-semibold text-grayscale-12">
									Portada
								</h2>
								<p className="text-xs text-grayscale-9 mt-0.5">
									Composición, alineación y punto focal de tu foto principal.
								</p>
							</div>

							<div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
								<div className="space-y-2">
									<span className="section-label block">Estilo de portada</span>
									<SegmentedControl
										value={draft.heroStyle}
										onChange={(val) => patch("heroStyle", val)}
										ariaLabel="Estilo de portada"
										options={[
											{ value: "cinematic", label: "Cine" },
											{ value: "poster", label: "Cartel" },
											{ value: "band", label: "Franja" },
											{ value: "type", label: "Tipográfica" },
											{ value: "duo", label: "Doble foto" },
										]}
									/>
								</div>

								<div className="space-y-2">
									<span className="section-label block">Alineación</span>
									<SegmentedControl
										value={draft.heroAlign}
										onChange={(val) => patch("heroAlign", val)}
										ariaLabel="Alineación de portada"
										options={[
											{ value: "start", label: "Izquierda" },
											{ value: "center", label: "Centro" },
										]}
									/>
								</div>
							</div>

							<div className="space-y-2">
								<span className="section-label block">Encuadre de foto</span>
								<SegmentedControl
									value={draft.heroPosition}
									onChange={(val) => patch("heroPosition", val)}
									ariaLabel="Encuadre de portada"
									options={[
										{ value: "center", label: "Centro" },
										{ value: "top", label: "Arriba" },
										{ value: "bottom", label: "Abajo" },
										{ value: "left", label: "Izquierda" },
										{ value: "right", label: "Derecha" },
									]}
								/>
							</div>
						</section>

						{/* Grupo 3: Tipografía y forma */}
						<section className="pt-6 border-t border-grayscale-3/80 dark:border-white/[0.08] space-y-5">
							<div>
								<h2 className="text-sm font-semibold text-grayscale-12">
									Tipografía y geometría
								</h2>
								<p className="text-xs text-grayscale-9 mt-0.5">
									Carácter del título, forma de botones y radio de esquinas.
								</p>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
								<div className="space-y-2">
									<span className="section-label block">Tipografía del nombre</span>
									<SegmentedControl
										value={draft.titleStyle}
										onChange={(val) => patch("titleStyle", val)}
										ariaLabel="Tipografía del nombre"
										options={[
											{ value: "tight", label: "Compacta" },
											{ value: "wide", label: "Abierta" },
											{ value: "spaced", label: "Espaciada" },
										]}
									/>
								</div>

								<div className="space-y-2">
									<span className="section-label block">Botones</span>
									<SegmentedControl
										value={draft.buttonStyle}
										onChange={(val) => patch("buttonStyle", val)}
										ariaLabel="Estilo de botones"
										options={[
											{ value: "pill", label: "Pastilla" },
											{ value: "square", label: "Cuadrado" },
											{ value: "text", label: "Texto" },
										]}
									/>
								</div>

								<div className="space-y-2">
									<span className="section-label block">Esquinas</span>
									<SegmentedControl
										value={draft.cornerStyle}
										onChange={(val) => patch("cornerStyle", val)}
										ariaLabel="Estilo de esquinas"
										options={[
											{ value: "round", label: "Redondas" },
											{ value: "sharp", label: "Rectas" },
										]}
									/>
								</div>
							</div>
						</section>

						{/* Grupo 4: Diseño de bloques */}
						<section className="pt-6 border-t border-grayscale-3/80 dark:border-white/[0.08] space-y-5">
							<div>
								<h2 className="text-sm font-semibold text-grayscale-12">
									Disposición de bloques
								</h2>
								<p className="text-xs text-grayscale-9 mt-0.5">
									Cómo se presentan tus fechas, biografía, sets y redes en la página.
								</p>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
								<div className="space-y-2">
									<span className="section-label block">Fechas / Agenda</span>
									<SegmentedControl
										value={draft.agendaStyle}
										onChange={(val) => patch("agendaStyle", val)}
										ariaLabel="Diseño de fechas"
										options={[
											{ value: "list", label: "Lista" },
											{ value: "cards", label: "Tarjetas" },
										]}
									/>
								</div>

								<div className="space-y-2">
									<span className="section-label block">Biografía</span>
									<SegmentedControl
										value={draft.bioStyle}
										onChange={(val) => patch("bioStyle", val)}
										ariaLabel="Diseño de biografía"
										options={[
											{ value: "quote", label: "Cita" },
											{ value: "columns", label: "Columnas" },
										]}
									/>
								</div>

								<div className="space-y-2">
									<span className="section-label block">Sets y mixes</span>
									<SegmentedControl
										value={draft.mixStyle}
										onChange={(val) => patch("mixStyle", val)}
										ariaLabel="Diseño de sets"
										options={[
											{ value: "grid", label: "Grilla" },
											{ value: "row", label: "Fila" },
											{ value: "list", label: "Lista" },
										]}
									/>
								</div>

								<div className="space-y-2">
									<span className="section-label block">Redes</span>
									<SegmentedControl
										value={draft.linkStyle}
										onChange={(val) => patch("linkStyle", val)}
										ariaLabel="Diseño de redes"
										options={[
											{ value: "cards", label: "Tarjetas" },
											{ value: "icons", label: "Botones con nombre" },
										]}
									/>
								</div>
							</div>
						</section>

						{/* Grupo 5: Secciones visibles */}
						<section className="pt-6 border-t border-grayscale-3/80 dark:border-white/[0.08] space-y-4">
							<div>
								<h2 className="text-sm font-semibold text-grayscale-12">
									Secciones visibles en tu página
								</h2>
								<p className="text-xs text-grayscale-9 mt-0.5">
									Activá o escondé bloques sin perder tu información guardada.
								</p>
							</div>
							<div className="flex flex-wrap gap-2">
								{SECTION_ROWS.map((sec) => {
									const hidden = draft.hiddenSections.includes(sec.id);
									return (
										<button
											key={sec.id}
											type="button"
											onClick={() => toggleHiddenSection(sec.id)}
											className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3.5 text-xs font-medium transition-[color,background-color,border-color,transform] duration-150 ease-[cubic-bezier(0.2,0,0,1)] active:scale-[0.96] cursor-pointer ${
												hidden
													? "bg-grayscale-2/70 border-grayscale-3/80 text-grayscale-8 hover:text-grayscale-11"
													: "bg-grayscale-1 dark:bg-[#1b1b1a] border-grayscale-4 text-grayscale-12 hover:border-grayscale-6 shadow-2xs"
											}`}
										>
											{hidden ? (
												<EyeOff size={13} />
											) : (
												<Eye size={13} className="text-green-10" />
											)}
											<span>{sec.label}</span>
										</button>
									);
								})}
							</div>
						</section>
					</div>
				) : null}

				{/* Sticky Publish Bar limpia sin caja contenedora pesada */}
				<div className="sticky bottom-0 z-20 -mx-1 border-t border-grayscale-3/80 bg-grayscale-1/90 px-1 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-md dark:border-white/[0.08] dark:bg-[#181817]/90 flex flex-wrap items-center justify-between gap-3">
					<SavePublishControl
						saving={saving}
						saved={saved}
						live={live}
						error={errors.save}
						saveTick={saveTick}
					/>
					<span className="text-[11px] text-grayscale-8 font-mono">
						{dj.slug}
					</span>
				</div>
			</form>
		</PageContainer>
	);
}
