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
import type { ColumnDef, Table as TanstackTable } from "@tanstack/react-table";
import { useId, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { Table } from "@/components/general/table";
import { DJ_TEMPLATES, djPublicUrl } from "@/gigblade/concept";
import { DjSelect, PageContainer, PageHeader } from "@/gigblade/ui";
import { useDjProfile, type DjContentDraft } from "@/gigblade/useDjContent";
import { useCustomerTable } from "@/views/customers2/hooks/useCustomerTable";

type FieldErrors = Partial<
	Record<"bio" | "city" | "instagram" | "template", string>
>;
type FieldId = "bio" | "city" | "template" | "instagram" | "photos";
type FieldRow = { id: FieldId; label: string };

type ContentMeta = {
	draft: DjContentDraft;
	setDraft: (updater: (current: DjContentDraft) => DjContentDraft) => void;
	errors: FieldErrors;
	ids: Record<FieldId, string>;
	setSaved: (saved: boolean) => void;
	addPhotos: (files: FileList | null) => void;
	removePhoto: (id: string) => void;
};

const FIELD_ROWS: FieldRow[] = [
	{ id: "bio", label: "Biografía" },
	{ id: "city", label: "Ciudad" },
	{ id: "template", label: "Plantilla" },
	{ id: "instagram", label: "Instagram" },
	{ id: "photos", label: "Fotos" },
];

function FieldValue({
	field,
	table,
}: {
	field: FieldId;
	table: TanstackTable<FieldRow>;
}) {
	const meta = table.options.meta as ContentMeta;
	const { draft, setDraft, errors, ids, setSaved, addPhotos, removePhoto } =
		meta;

	const touch = (patch: Partial<DjContentDraft>) => {
		setDraft((current) => ({ ...current, ...patch }));
		setSaved(false);
	};

	if (field === "bio") {
		return (
			<div className="flex flex-col gap-1 py-1 w-full min-w-0">
				<label htmlFor={ids.bio} className="sr-only">
					Biografía
				</label>
				<LongInput
					id={ids.bio}
					value={draft.bio}
					onChange={(event) => touch({ bio: event.target.value })}
					aria-invalid={Boolean(errors.bio)}
					aria-describedby={errors.bio ? `${ids.bio}-error` : undefined}
				/>
				{errors.bio ? (
					<p id={`${ids.bio}-error`} className="text-xs text-destructive">
						{errors.bio}
					</p>
				) : null}
			</div>
		);
	}

	if (field === "city") {
		return (
			<div className="flex flex-col gap-1 py-1 w-full min-w-0">
				<label htmlFor={ids.city} className="sr-only">
					Ciudad
				</label>
				<Input
					id={ids.city}
					value={draft.city}
					onChange={(event) => touch({ city: event.target.value })}
					aria-invalid={Boolean(errors.city)}
					aria-describedby={errors.city ? `${ids.city}-error` : undefined}
				/>
				{errors.city ? (
					<p id={`${ids.city}-error`} className="text-xs text-destructive">
						{errors.city}
					</p>
				) : null}
			</div>
		);
	}

	if (field === "template") {
		return (
			<div className="flex flex-col gap-1 py-1 w-full min-w-0">
				<label htmlFor={ids.template} className="sr-only">
					Plantilla
				</label>
				<select
					id={ids.template}
					value={draft.template}
					onChange={(event) => touch({ template: event.target.value })}
					aria-invalid={Boolean(errors.template)}
					aria-describedby={
						errors.template ? `${ids.template}-error` : undefined
					}
					className="selection:bg-primary selection:text-primary-foreground border-input w-full min-w-0 rounded-lg border text-sm px-2 h-9 shadow-sm outline-none bg-input-background"
				>
					{DJ_TEMPLATES.map((template) => (
						<option key={template} value={template}>
							{template}
						</option>
					))}
				</select>
				{errors.template ? (
					<p id={`${ids.template}-error`} className="text-xs text-destructive">
						{errors.template}
					</p>
				) : null}
			</div>
		);
	}

	if (field === "instagram") {
		return (
			<div className="flex flex-col gap-1 py-1 w-full min-w-0">
				<label htmlFor={ids.instagram} className="sr-only">
					Instagram
				</label>
				<Input
					id={ids.instagram}
					value={draft.instagram}
					onChange={(event) => touch({ instagram: event.target.value })}
					placeholder="@tuhandle"
					aria-invalid={Boolean(errors.instagram)}
					aria-describedby={
						errors.instagram ? `${ids.instagram}-error` : undefined
					}
				/>
				{errors.instagram ? (
					<p id={`${ids.instagram}-error`} className="text-xs text-destructive">
						{errors.instagram}
					</p>
				) : (
					<p className="text-xs text-tertiary-foreground">
						Este es el canal de contacto en la página pública.
					</p>
				)}
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-2 py-1 w-full min-w-0">
			<label htmlFor={ids.photos} className="sr-only">
				Fotos
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
					Todavía no hay fotos. Se guardan acá, no en un servidor.
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
		</div>
	);
}

const columns: ColumnDef<FieldRow>[] = [
	{
		header: "Field",
		accessorKey: "label",
		size: 160,
		cell: ({ row }) => (
			<span className="text-tertiary-foreground">{row.original.label}</span>
		),
	},
	{
		header: "Value",
		id: "value",
		cell: ({ row, table }) => (
			<FieldValue field={row.original.id} table={table} />
		),
	},
];

function validate(draft: DjContentDraft): FieldErrors {
	const errors: FieldErrors = {};
	if (!draft.bio.trim()) errors.bio = "Escribí una bio corta.";
	if (!draft.city.trim()) errors.city = "Indicá la ciudad.";
	if (!draft.template.trim()) errors.template = "Elegí una plantilla.";
	if (!draft.instagram.trim()) {
		errors.instagram = "Indicá el Instagram.";
	} else if (!/^@?[\w.]+$/.test(draft.instagram.trim())) {
		errors.instagram = "Usá un handle, con o sin @.";
	}
	return errors;
}

export default function DjContentPage() {
	const { dj, setDj, draft, setDraft, save } = useDjProfile();
	const [errors, setErrors] = useState<FieldErrors>({});
	const [saved, setSaved] = useState(false);
	const ids = {
		bio: useId(),
		city: useId(),
		template: useId(),
		instagram: useId(),
		photos: useId(),
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

	const onSubmit = (event: FormEvent) => {
		event.preventDefault();
		const nextErrors = validate(draft);
		setErrors(nextErrors);
		if (Object.keys(nextErrors).length > 0) {
			setSaved(false);
			return;
		}
		const instagram = draft.instagram.startsWith("@")
			? draft.instagram
			: `@${draft.instagram}`;
		save({ ...draft, instagram });
		setSaved(true);
	};

	const table = useCustomerTable({
		data: FIELD_ROWS,
		columns,
		options: {
			meta: {
				draft,
				setDraft,
				errors,
				ids,
				setSaved,
				addPhotos,
				removePhoto,
			} satisfies ContentMeta,
		},
	});

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
						<a href={djPublicUrl(dj)} target="_blank" rel="noreferrer">
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
					text={dj.domain}
					title={dj.domain}
					size="mini"
					className="text-tertiary-foreground"
					innerClassName="max-w-30 text-tiny-id truncate !font-normal"
				/>
			</PageHeader>
			<p className="text-sm text-tertiary-foreground leading-6 -mt-2 max-w-3xl">
				Bio, redes, ciudad y fotos. GigBlade publica esto en tu dominio. Vos no
				tocás hosting.
			</p>

			<form onSubmit={onSubmit} noValidate>
				<Table.Provider
					config={{
						table,
						numberOfColumns: columns.length,
						enableSorting: false,
						flexibleTableColumns: true,
						rowClassName: "h-auto",
					}}
				>
					<Table.Container>
						<Table.Toolbar>
							<Table.Heading>
								<IdentificationCardIcon
									size={16}
									weight="fill"
									className="text-subtle"
									aria-hidden
								/>
								Campos
							</Table.Heading>
							<Table.Actions>
								<Button type="submit" variant="primary" size="sm">
									Guardar
								</Button>
							</Table.Actions>
						</Table.Toolbar>
						<Table.Content>
							<Table.Header />
							<Table.Body />
						</Table.Content>
					</Table.Container>
				</Table.Provider>
				<p className="text-xs text-tertiary-foreground mt-3" aria-live="polite">
					{saved ? "Guardado en este navegador." : null}
				</p>
			</form>
		</PageContainer>
	);
}
