import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	MiniCopyButton,
	PageContainer,
	PageHeader,
} from "@autumn/ui";
import { EnvelopeSimpleIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useId, useState } from "react";
import { toast } from "sonner";
import { readPanelAuthSession } from "@/gigblade/panel-session";
import {
	deleteWaitlistSignup,
	fetchPlatformWaitlist,
	onboardWaitlistSignup,
	type WaitlistSignup,
} from "@/gigblade/site-api";

export const PLATFORM_WAITLIST_QUERY_KEY = ["platform", "waitlist"] as const;

const STATUS_LABEL: Record<WaitlistSignup["status"], string> = {
	pending: "Pendiente",
	contacted: "Contactado",
	onboarded: "En la plataforma",
	declined: "Descartado",
};

function formatSignupDate(value: string) {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return new Intl.DateTimeFormat("es-CR", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	}).format(date);
}

function whatsappHref(phone: string, country: WaitlistSignup["country"]) {
	let digits = phone.replace(/\D/g, "");
	if (!digits) return null;
	if (country === "CR" && digits.length === 8) digits = `506${digits}`;
	return `https://wa.me/${digits}`;
}

function DeleteSignupButton({
	signup,
	onDeleted,
}: {
	signup: WaitlistSignup;
	onDeleted: (id: string) => void;
}) {
	const titleId = useId();
	const descId = useId();
	const errorId = useId();
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const remove = async () => {
		const session = readPanelAuthSession();
		if (!session?.token) {
			setError("Entrá de nuevo para eliminar una solicitud.");
			return;
		}
		setLoading(true);
		setError(null);
		try {
			await deleteWaitlistSignup({ id: signup.id, token: session.token });
			setOpen(false);
			toast.success(`Se eliminó a ${signup.artistName}.`);
			onDeleted(signup.id);
		} catch (caught) {
			setError(
				caught instanceof Error
					? caught.message
					: "No se pudo eliminar la solicitud.",
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<Button
				variant="secondary"
				size="sm"
				type="button"
				onClick={() => {
					setError(null);
					setOpen(true);
				}}
			>
				<TrashIcon size={16} aria-hidden />
				Eliminar
			</Button>
			<Dialog
				open={open}
				onOpenChange={(next) => {
					if (loading) return;
					setOpen(next);
					if (!next) setError(null);
				}}
			>
				<DialogContent aria-labelledby={titleId} aria-describedby={descId}>
					<DialogHeader>
						<DialogTitle id={titleId}>Eliminar a {signup.artistName}</DialogTitle>
						<DialogDescription id={descId}>
							Se borra la solicitud de la lista de espera. No se puede deshacer.
						</DialogDescription>
					</DialogHeader>
					{error ? (
						<p id={errorId} role="alert" className="text-sm text-destructive">
							{error}
						</p>
					) : null}
					<DialogFooter>
						<Button
							variant="secondary"
							type="button"
							onClick={() => setOpen(false)}
							disabled={loading}
						>
							Cancelar
						</Button>
						<Button
							variant="destructive"
							type="button"
							onClick={() => void remove()}
							disabled={loading}
							aria-busy={loading}
							aria-describedby={error ? errorId : undefined}
						>
							{loading ? "Eliminando…" : "Eliminar solicitud"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

function CreatePageButton({
	signup,
	onCreated,
}: {
	signup: WaitlistSignup;
	onCreated: () => void;
}) {
	const titleId = useId();
	const descId = useId();
	const errorId = useId();
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [created, setCreated] = useState<{
		email: string;
		password: string;
		name: string;
		emailed: boolean;
	} | null>(null);

	const create = async () => {
		const session = readPanelAuthSession();
		if (!session?.token) {
			setError("Entrá de nuevo para crear la página.");
			return;
		}
		setLoading(true);
		setError(null);
		try {
			const next = await onboardWaitlistSignup({
				id: signup.id,
				token: session.token,
			});
			setCreated({
				email: next.email,
				password: next.password,
				name: next.name,
				emailed: next.emailed,
			});
			toast.success(
				next.emailed
					? `Se envió la contraseña a ${next.email}.`
					: `Se creó la página de ${next.name}.`,
			);
			onCreated();
		} catch (caught) {
			setError(
				caught instanceof Error
					? caught.message
					: "No se pudo crear la página.",
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<Button
				variant="secondary"
				size="sm"
				type="button"
				onClick={() => {
					setError(null);
					setCreated(null);
					setOpen(true);
				}}
			>
				<PlusIcon size={16} aria-hidden />
				Crear página
			</Button>
			<Dialog
				open={open}
				onOpenChange={(next) => {
					if (loading) return;
					setOpen(next);
					if (!next) {
						setError(null);
						setCreated(null);
					}
				}}
			>
				<DialogContent aria-labelledby={titleId} aria-describedby={descId}>
					{created ? (
						<>
							<DialogHeader>
								<DialogTitle id={titleId}>Acceso para {created.name}</DialogTitle>
								<DialogDescription id={descId}>
									{created.emailed
										? `La contraseña se envió a ${created.email}. También queda acá por si el correo no llega.`
										: "Pasale estos datos. La contraseña no se vuelve a mostrar."}
								</DialogDescription>
							</DialogHeader>
							<div className="flex flex-col gap-3">
								<div>
									<p className="text-xs text-tertiary-foreground">Correo</p>
									<div className="mt-1 flex items-center justify-between gap-2">
										<p className="font-mono text-sm break-all">{created.email}</p>
										<MiniCopyButton text={created.email} />
									</div>
								</div>
								<div>
									<p className="text-xs text-tertiary-foreground">Contraseña</p>
									<div className="mt-1 flex items-center justify-between gap-2">
										<p className="font-mono text-sm break-all">{created.password}</p>
										<MiniCopyButton text={created.password} />
									</div>
								</div>
							</div>
							<DialogFooter>
								<Button type="button" onClick={() => setOpen(false)}>
									Listo
								</Button>
							</DialogFooter>
						</>
					) : (
						<>
							<DialogHeader>
								<DialogTitle id={titleId}>Crear la página de {signup.artistName}</DialogTitle>
								<DialogDescription id={descId}>
									El acceso queda con {signup.email}. La ciudad, el Instagram y el
									teléfono de la solicitud pasan a la página.
								</DialogDescription>
							</DialogHeader>
							{error ? (
								<p id={errorId} role="alert" className="text-sm text-destructive">
									{error}
								</p>
							) : null}
							<DialogFooter>
								<Button
									variant="secondary"
									type="button"
									onClick={() => setOpen(false)}
									disabled={loading}
								>
									Cancelar
								</Button>
								<Button
									type="button"
									onClick={() => void create()}
									disabled={loading}
									aria-busy={loading}
									aria-describedby={error ? errorId : undefined}
								>
									{loading ? "Creando…" : "Crear página"}
								</Button>
							</DialogFooter>
						</>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}

function SignupRow({
	signup,
	onDeleted,
	onCreated,
}: {
	signup: WaitlistSignup;
	onDeleted: (id: string) => void;
	onCreated: () => void;
}) {
	const instagram = signup.instagram
		? `https://instagram.com/${signup.instagram}`
		: null;
	const whatsapp = signup.phone
		? whatsappHref(signup.phone, signup.country)
		: null;

	return (
		<li className="border rounded-lg bg-interactive-secondary p-4 sm:p-5 flex flex-col gap-2">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="min-w-0">
					<p className="text-sm font-medium text-foreground truncate">
						{signup.artistName}
					</p>
					<a
						href={`mailto:${signup.email}`}
						className="mt-1 block text-sm text-foreground underline-offset-2 hover:underline break-all"
					>
						{signup.email}
					</a>
					{signup.phone && whatsapp ? (
						<a
							href={whatsapp}
							target="_blank"
							rel="noreferrer"
							aria-label={`Abrir WhatsApp de ${signup.artistName}: ${signup.phone}`}
							className="mt-1 block text-sm text-foreground underline-offset-2 hover:underline"
						>
							{signup.phone}
						</a>
					) : null}
				</div>
				<div className="flex items-center gap-3">
					<p className="text-xs font-medium text-tertiary-foreground">
						{STATUS_LABEL[signup.status]}
					</p>
					{signup.status === "pending" || signup.status === "contacted" ? (
						<CreatePageButton signup={signup} onCreated={onCreated} />
					) : null}
					<DeleteSignupButton signup={signup} onDeleted={onDeleted} />
				</div>
			</div>
			<p className="text-xs text-tertiary-foreground">
				{signup.city ? `${signup.city} · ` : ""}
				{formatSignupDate(signup.createdAt)}
				{instagram ? (
					<>
						{" · "}
						<a
							href={instagram}
							target="_blank"
							rel="noreferrer"
							className="underline-offset-2 hover:underline"
						>
							@{signup.instagram}
						</a>
					</>
				) : null}
			</p>
			{signup.note ? (
				<p className="text-sm text-foreground leading-6">{signup.note}</p>
			) : null}
		</li>
	);
}

export default function PlatformWaitlist() {
	const queryClient = useQueryClient();
	const query = useQuery({
		queryKey: PLATFORM_WAITLIST_QUERY_KEY,
		queryFn: ({ signal }) => fetchPlatformWaitlist(signal),
		staleTime: 15_000,
		retry: 1,
	});
	const signups = query.data ?? [];
	const pending = signups.filter((signup) => signup.status === "pending").length;

	return (
		<PageContainer>
			<PageHeader
				icon={
					<EnvelopeSimpleIcon
						size={16}
						weight="fill"
						className="text-subtle"
						aria-hidden
					/>
				}
				title="Lista de espera"
			/>
			<p className="text-sm text-tertiary-foreground leading-6 -mt-2 max-w-3xl">
				{query.isPending
					? "Cargando solicitudes…"
					: query.isError
						? "No se pudieron cargar las solicitudes. Recargá la página."
						: pending === 1
							? "1 solicitud pendiente de cupo."
							: `${pending} solicitudes pendientes de cupo.`}
			</p>
			{query.isError ? null : signups.length === 0 && !query.isPending ? (
				<p className="text-sm text-tertiary-foreground">Todavía no hay solicitudes.</p>
			) : (
				<ul className="flex flex-col gap-3" aria-label="Solicitudes de la lista de espera">
					{signups.map((signup) => (
						<SignupRow
							key={signup.id}
							signup={signup}
							onDeleted={(id) => {
								queryClient.setQueryData<WaitlistSignup[]>(
									PLATFORM_WAITLIST_QUERY_KEY,
									(current) => current?.filter((item) => item.id !== id) ?? [],
								);
							}}
							onCreated={() => {
								void queryClient.invalidateQueries({
									queryKey: PLATFORM_WAITLIST_QUERY_KEY,
								});
								void queryClient.invalidateQueries({
									queryKey: ["platform", "sites"],
								});
							}}
						/>
					))}
				</ul>
			)}
		</PageContainer>
	);
}
