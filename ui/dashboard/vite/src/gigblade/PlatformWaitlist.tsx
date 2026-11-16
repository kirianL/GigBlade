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
import {
	CalendarCheckIcon,
	EnvelopeSimpleIcon,
	PlusIcon,
	ShareNetworkIcon,
	TrashIcon,
	WhatsappLogoIcon,
} from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useId, useState } from "react";
import { toast } from "sonner";
import { readPanelAuthSession } from "@/gigblade/panel-session";
import { useLanguage } from "@/contexts/LanguageProvider";
import {
	deleteWaitlistSignup,
	fetchPlatformReferrals,
	fetchPlatformWaitlist,
	onboardWaitlistSignup,
	type WaitlistSignup,
} from "@/gigblade/site-api";
import { PLATFORM_REFERRALS_QUERY_KEY } from "@/gigblade/platform-referrals-query";
import { waitlistWhatsappHref } from "@/gigblade/waitlist-whatsapp";

export const PLATFORM_WAITLIST_QUERY_KEY = ["platform", "waitlist"] as const;

function formatSignupDate(value: string, lang = "es") {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return new Intl.DateTimeFormat(lang === "en" ? "en-US" : "es-CR", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	}).format(date);
}

function formatMeetingDateTime(value: string, lang = "es") {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return null;
	const day = new Intl.DateTimeFormat(lang === "en" ? "en-US" : "es-CR", {
		weekday: "short",
		day: "numeric",
		month: "short",
		timeZone: "America/Costa_Rica",
	}).format(date);
	const time = new Intl.DateTimeFormat(lang === "en" ? "en-US" : "es-CR", {
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
		timeZone: "America/Costa_Rica",
	}).format(date);
	const capDay = day.charAt(0).toUpperCase() + day.slice(1).replace(/\./g, "");
	return `${capDay} · ${time}`;
}

function buildAdminGoogleCalendarHref(signup: WaitlistSignup): string | null {
	if (!signup.meetingAt) return null;
	const start = new Date(signup.meetingAt);
	if (Number.isNaN(start.getTime())) return null;
	const end = new Date(start.getTime() + 15 * 60 * 1000);
	const fmt = (d: Date) =>
		d
			.toISOString()
			.replace(/[-:]/g, "")
			.replace(/\.\d{3}Z$/, "Z");
	const title = encodeURIComponent(`GigBlades Demo × ${signup.artistName}`);
	const detailsLines = [
		`Artista: ${signup.artistName}`,
		`Correo: ${signup.email}`,
		signup.phone ? `WhatsApp: ${signup.phone}` : "",
		signup.instagram ? `Instagram: @${signup.instagram}` : "",
		signup.city ? `Provincia: ${signup.city}` : "",
	].filter(Boolean);
	const details = encodeURIComponent(detailsLines.join("\n"));
	const guest = encodeURIComponent(signup.email);
	return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fmt(start)}/${fmt(end)}&details=${details}&add=${guest}`;
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
				className="flex-1 sm:flex-none justify-center"
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
				className="flex-1 sm:flex-none justify-center"
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
									{signup.referralCode
										? ` Al crear la página se acreditará la comisión inicial al promotor ${signup.referralCode}.`
										: ""}
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
	monthlyPriceUsd,
	onDeleted,
	onCreated,
}: {
	signup: WaitlistSignup;
	monthlyPriceUsd: number;
	onDeleted: (id: string) => void;
	onCreated: () => void;
}) {
	const { t, language } = useLanguage();
	const instagram = signup.instagram
		? `https://instagram.com/${signup.instagram}`
		: null;
	const whatsapp = waitlistWhatsappHref(signup, monthlyPriceUsd);
	const meetingFormatted = signup.meetingAt
		? formatMeetingDateTime(signup.meetingAt, language)
		: null;
	const gcalHref = buildAdminGoogleCalendarHref(signup);
	const isUpcomingMeeting = signup.meetingAt
		? new Date(signup.meetingAt).getTime() >= Date.now() - 30 * 60 * 1000
		: false;

	const statusLabel =
		signup.status === "pending"
			? t("waitlist.pending", "Pendiente")
			: signup.status === "contacted"
				? t("waitlist.contacted", "Contactado")
				: signup.status === "onboarded"
					? t("waitlist.onboarded", "En la plataforma")
					: t("waitlist.declined", "Descartado");

	return (
		<li className="border rounded-lg bg-interactive-secondary p-4 sm:p-5 flex flex-col gap-2.5">
			<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center justify-between sm:justify-start gap-2">
						<p className="text-sm font-semibold text-foreground truncate">
							{signup.artistName}
						</p>
						<div className="flex flex-wrap items-center gap-1.5 shrink-0">
							{meetingFormatted ? (
								<span
									className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-mono font-medium ${
										isUpcomingMeeting
											? "border-emerald-500/35 bg-emerald-500/10 text-emerald-500"
											: "border-border bg-background/60 text-tertiary-foreground"
									}`}
									title="Reunión agendada por el DJ desde el formulario de acceso"
								>
									<CalendarCheckIcon size={12} weight="fill" aria-hidden />
									{meetingFormatted}
								</span>
							) : null}
							{signup.referralCode ? (
								<span
									className="inline-flex items-center gap-1 rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 text-[11px] font-mono font-bold text-primary"
									title={`Referido por el promotor ${signup.referralCode}`}
								>
									<ShareNetworkIcon size={12} weight="fill" aria-hidden />
									Ref: {signup.referralCode}
								</span>
							) : null}
							<span className="inline-flex items-center rounded-md border bg-background/60 px-2 py-0.5 text-[11px] font-medium text-tertiary-foreground">
								{statusLabel}
							</span>
						</div>
					</div>
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
							aria-label={`WhatsApp: ${signup.phone}`}
							className="mt-1 block text-sm text-foreground underline-offset-2 hover:underline"
						>
							{signup.phone}
						</a>
					) : null}
				</div>
				<div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60 w-full sm:w-auto sm:justify-end">
					{gcalHref ? (
						<Button variant="outline" size="sm" className="gap-1.5 flex-1 sm:flex-none justify-center" asChild>
							<a
								href={gcalHref}
								target="_blank"
								rel="noreferrer"
								aria-label={`Agendar en Google Calendar: ${signup.artistName}`}
							>
								<CalendarCheckIcon size={16} weight="fill" className="text-primary" />
								Calendario
							</a>
						</Button>
					) : null}
					{whatsapp ? (
						<Button variant="outline" size="sm" className="gap-1.5 flex-1 sm:flex-none justify-center" asChild>
							<a
								href={whatsapp}
								target="_blank"
								rel="noreferrer"
								aria-label={`${t("waitlist.whatsapp", "Contactar WhatsApp")}: ${signup.artistName}`}
							>
								<WhatsappLogoIcon size={16} weight="fill" className="text-emerald-600" />
								{t("waitlist.whatsapp", "WhatsApp")}
							</a>
						</Button>
					) : null}
					{signup.status === "pending" || signup.status === "contacted" ? (
						<CreatePageButton signup={signup} onCreated={onCreated} />
					) : null}
					<DeleteSignupButton signup={signup} onDeleted={onDeleted} />
				</div>
			</div>
			<p className="text-xs text-tertiary-foreground">
				{signup.city ? `${signup.city} · ` : ""}
				{formatSignupDate(signup.createdAt, language)}
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
	const { t } = useLanguage();
	const queryClient = useQueryClient();
	const query = useQuery({
		queryKey: PLATFORM_WAITLIST_QUERY_KEY,
		queryFn: ({ signal }) => fetchPlatformWaitlist(signal),
		staleTime: 15_000,
		retry: 1,
	});
	const referralsQuery = useQuery({
		queryKey: PLATFORM_REFERRALS_QUERY_KEY,
		queryFn: ({ signal }) => fetchPlatformReferrals(signal),
		staleTime: 30_000,
		retry: 1,
	});
	const monthlyPriceUsd = referralsQuery.data?.settings.monthlyPriceUsd ?? 30;
	const signups = query.data ?? [];
	const pending = signups.filter((signup) => signup.status === "pending").length;
	const scheduledMeetings = signups.filter(
		(signup) => signup.status !== "declined" && Boolean(signup.meetingAt),
	).length;

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
				title={t("waitlist.title", "Lista de espera")}
			/>
			<p className="text-sm text-tertiary-foreground leading-6 -mt-2 max-w-3xl">
				{query.isPending
					? t("waitlist.loading", "Cargando solicitudes…")
					: query.isError
						? t("waitlist.error", "No se pudieron cargar las solicitudes. Recargá la página.")
						: `${
								pending === 1
									? `1 ${t("waitlist.pendingSingular", "solicitud pendiente de cupo.")}`
									: `${pending} ${t("waitlist.pendingPlural", "solicitudes pendientes de cupo.")}`
							}${
								scheduledMeetings > 0
									? ` · ${scheduledMeetings} ${
											scheduledMeetings === 1
												? "reunión agendada"
												: "reuniones agendadas"
										}`
									: ""
							}`}
			</p>
			{query.isError ? null : signups.length === 0 && !query.isPending ? (
				<p className="text-sm text-tertiary-foreground">{t("waitlist.empty", "Todavía no hay solicitudes.")}</p>
			) : (
				<ul className="flex flex-col gap-3" aria-label={t("waitlist.title", "Lista de espera")}>
					{signups.map((signup) => (
						<SignupRow
							key={signup.id}
							signup={signup}
							monthlyPriceUsd={monthlyPriceUsd}
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
									queryKey: PLATFORM_REFERRALS_QUERY_KEY,
								});
								void queryClient.invalidateQueries({
									queryKey: ["platform", "djs"],
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
