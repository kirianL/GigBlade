"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
	Calendar,
	CheckCircle2,
	Clock,
	CreditCard,
	Mail,
	MapPin,
	MessageCircle,
	Plus,
	RefreshCw,
	Share2,
	Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { readPanelAuthSession } from "@/panel/panel-session";
import { Skeleton } from "@/panel/Skeleton";
import { useLanguage } from "@/panel/LanguageProvider";
import {
	ALL_MEETING_HOURS,
	DEFAULT_MEETING_AVAILABILITY,
	isDateAvailableForMeeting,
	type MeetingAvailability,
} from "@/domain/meeting-availability";
import {
	deleteWaitlistSignup,
	fetchMeetingAvailability,
	fetchPlatformReferrals,
	fetchPlatformWaitlist,
	onboardWaitlistSignup,
	updateMeetingAvailability,
	type WaitlistSignup,
} from "@/panel/site-api";
import { PLATFORM_REFERRALS_QUERY_KEY } from "@/panel/platform-referrals-query";
import { PLATFORM_SITES_QUERY_KEY } from "@/panel/usePlatformDjs";
import { waitlistWhatsappHref } from "@/panel/waitlist-whatsapp";
import {
	CopyButton,
	EmptyState,
	MetricCard,
	PageContainer,
	PageHeader,
	PanelButton,
	PanelModal,
	SegmentedControl,
	StatusBadge,
	WhatsappIcon,
	type BadgeTone,
} from "@/panel/ui";

export const PLATFORM_WAITLIST_QUERY_KEY = ["platform", "waitlist"] as const;

const STATUS_META: Record<
	WaitlistSignup["status"],
	{ label: string; tone: BadgeTone }
> = {
	pending: { label: "PENDIENTE", tone: "amber" },
	contacted: { label: "CONTACTADO", tone: "sky" },
	onboarded: { label: "ACTIVO", tone: "emerald" },
	declined: { label: "DESCARTADO", tone: "neutral" },
};

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
		d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
	const title = encodeURIComponent(`GigBlades Demo × ${signup.artistName}`);
	const detailsLines = [
		`Artista: ${signup.artistName}`,
		`Correo: ${signup.email}`,
		signup.phone ? `WhatsApp: ${signup.phone}` : "",
		signup.instagram ? `Instagram: @${signup.instagram}` : "",
		signup.city ? `Provincia: ${signup.city}` : "",
	].filter(Boolean);
	return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fmt(start)}/${fmt(end)}&details=${encodeURIComponent(detailsLines.join("\n"))}&add=${encodeURIComponent(signup.email)}`;
}

function DeleteSignupButton({
	signup,
	onDeleted,
}: {
	signup: WaitlistSignup;
	onDeleted: (id: string) => void;
}) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const remove = async () => {
		const session = readPanelAuthSession();
		if (!session) {
			setError("Entrá de nuevo para eliminar una solicitud.");
			return;
		}
		setLoading(true);
		setError(null);
		try {
			await deleteWaitlistSignup({ id: signup.id });
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
			<PanelButton
				variant="secondary"
				size="sm"
				onClick={() => {
					setError(null);
					setOpen(true);
				}}
			>
				<Trash2 size={13} className="text-red-500" />
				<span>Eliminar</span>
			</PanelButton>

			<PanelModal
				open={open}
				onClose={() => {
					if (!loading) setOpen(false);
				}}
				title={`Eliminar a ${signup.artistName}`}
				description="Se borra la solicitud de la lista de espera. Esta acción no se puede deshacer."
			>
				<div className="space-y-4">
					{error ? (
						<div className="p-3.5 bg-red-3/60 border border-red-6/60 text-red-11 text-xs rounded-xl">
							{error}
						</div>
					) : null}
					<div className="flex justify-end gap-2 pt-2">
						<PanelButton
							variant="ghost"
							onClick={() => setOpen(false)}
							disabled={loading}
						>
							Cancelar
						</PanelButton>
						<PanelButton
							variant="danger"
							onClick={() => void remove()}
							disabled={loading}
						>
							{loading ? "Eliminando…" : "Eliminar solicitud"}
						</PanelButton>
					</div>
				</div>
			</PanelModal>
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
		if (!session) {
			setError("Entrá de nuevo para crear la página.");
			return;
		}
		setLoading(true);
		setError(null);
		try {
			const next = await onboardWaitlistSignup({
				id: signup.id,
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
			<PanelButton
				variant="primary"
				size="sm"
				onClick={() => {
					setError(null);
					setCreated(null);
					setOpen(true);
				}}
			>
				<Plus size={13} />
				<span>Crear página</span>
			</PanelButton>

			<PanelModal
				open={open}
				onClose={() => {
					if (!loading) setOpen(false);
				}}
				title={
					created
						? `Acceso para ${created.name}`
						: `Crear la página de ${signup.artistName}`
				}
				description={
					created
						? created.emailed
							? `La contraseña se envió a ${created.email}. También queda acá por si el correo no llega.`
							: "Pasale estos datos. La contraseña no se vuelve a mostrar."
						: `El acceso queda con ${signup.email}. La ciudad, el Instagram y el teléfono pasan a la página.${
								signup.referralCode
									? ` Se acreditará la comisión inicial al promotor ${signup.referralCode}.`
									: ""
							}`
				}
			>
				{created ? (
					<div className="space-y-4">
						<div className="p-4 surface-soft space-y-3">
							<div>
								<span className="text-[11px] font-semibold text-grayscale-8 uppercase tracking-wider block">
									Correo
								</span>
								<div className="mt-1 flex items-center justify-between gap-2">
									<p className="font-mono text-xs font-semibold text-grayscale-12 break-all">
										{created.email}
									</p>
									<CopyButton text={created.email} label="Copiar" />
								</div>
							</div>
							<div className="pt-3 border-t border-grayscale-3/80">
								<span className="text-[11px] font-semibold text-grayscale-8 uppercase tracking-wider block">
									Contraseña
								</span>
								<div className="mt-1 flex items-center justify-between gap-2">
									<p className="font-mono text-xs font-semibold text-grayscale-12 break-all">
										{created.password}
									</p>
									<CopyButton text={created.password} label="Copiar" />
								</div>
							</div>
						</div>
						<div className="flex justify-end">
							<PanelButton onClick={() => setOpen(false)}>Listo</PanelButton>
						</div>
					</div>
				) : (
					<div className="space-y-4">
						{error ? (
							<div className="p-3.5 bg-red-3/60 border border-red-6/60 text-red-11 text-xs rounded-xl">
								{error}
							</div>
						) : null}
						<div className="flex justify-end gap-2 pt-2">
							<PanelButton
								variant="ghost"
								onClick={() => setOpen(false)}
								disabled={loading}
							>
								Cancelar
							</PanelButton>
							<PanelButton onClick={() => void create()} disabled={loading}>
								{loading ? "Creando página…" : "Confirmar y crear"}
							</PanelButton>
						</div>
					</div>
				)}
			</PanelModal>
		</>
	);
}

export default function PlatformWaitlist() {
	const queryClient = useQueryClient();
	const { language, t } = useLanguage();
	const [filter, setFilter] = useState<
		"all" | "pending" | "paid" | "onboarded"
	>("all");
	const [availabilityOpen, setAvailabilityOpen] = useState(false);

	const query = useQuery({
		queryKey: PLATFORM_WAITLIST_QUERY_KEY,
		queryFn: ({ signal }) => fetchPlatformWaitlist(signal),
		staleTime: 30_000,
	});

	const referralsQuery = useQuery({
		queryKey: PLATFORM_REFERRALS_QUERY_KEY,
		queryFn: ({ signal }) => fetchPlatformReferrals(signal),
		staleTime: 60_000,
		retry: false,
	});

	const affiliateByCode = useMemo(() => {
		const map = new Map<string, string>();
		for (const aff of referralsQuery.data?.affiliates ?? []) {
			map.set(aff.code.toUpperCase(), aff.name);
		}
		return map;
	}, [referralsQuery.data]);

	const signups = query.data ?? [];

	const counts = useMemo(
		() => ({
			all: signups.length,
			pending: signups.filter((s) => s.status === "pending").length,
			paid: signups.filter((s) => s.paymentStatus === "paid").length,
			onboarded: signups.filter((s) => s.status === "onboarded").length,
		}),
		[signups],
	);

	const filtered = useMemo(() => {
		return signups.filter((s) => {
			if (filter === "pending") return s.status === "pending";
			if (filter === "paid") return s.paymentStatus === "paid";
			if (filter === "onboarded") return s.status === "onboarded";
			return true;
		});
	}, [signups, filter]);

	const handleDeleted = (id: string) => {
		queryClient.setQueryData<WaitlistSignup[]>(
			PLATFORM_WAITLIST_QUERY_KEY,
			(prev) => (prev ?? []).filter((item) => item.id !== id),
		);
	};

	const handleCreated = () => {
		void queryClient.invalidateQueries({ queryKey: PLATFORM_WAITLIST_QUERY_KEY });
		void queryClient.invalidateQueries({ queryKey: PLATFORM_SITES_QUERY_KEY });
		void queryClient.invalidateQueries({ queryKey: PLATFORM_REFERRALS_QUERY_KEY });
	};

	return (
		<PageContainer>
			<PageHeader
				title={t("nav.waitlist", "Lista de espera")}
				subtitle="Solicitudes de acceso, citas agendadas y pagos de setup vía Tilopay"
			>
				<PanelButton
					variant="secondary"
					size="sm"
					onClick={() => setAvailabilityOpen(true)}
				>
					<Calendar size={13} />
					<span>Disponibilidad</span>
				</PanelButton>
				<PanelButton
					variant="secondary"
					size="sm"
					onClick={() => void query.refetch()}
					disabled={query.isFetching}
				>
					<RefreshCw
						size={13}
						className={query.isFetching ? "animate-spin" : ""}
					/>
					<span>Actualizar</span>
				</PanelButton>
			</PageHeader>

			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<MetricCard
					label="Solicitudes totales"
					value={counts.all}
					footer={<span>Registros acumulados</span>}
				/>
				<MetricCard
					label="Pagos confirmados"
					value={counts.paid}
					valueClassName="text-emerald-600"
					footer={
						<>
							<span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
							<span>Tilopay acreditado</span>
						</>
					}
				/>
				<MetricCard
					label="Pendientes de alta"
					value={counts.pending}
					valueClassName="text-amber-600"
					footer={
						<>
							<span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
							<span>Listos para seguimiento</span>
						</>
					}
				/>
			</div>

			<SegmentedControl
				value={filter}
				onChange={setFilter}
				options={[
					{ value: "all", label: "Todos", count: counts.all },
					{ value: "pending", label: "Pendientes", count: counts.pending },
					{ value: "paid", label: "Pagados", count: counts.paid },
					{ value: "onboarded", label: "Activos", count: counts.onboarded },
				]}
			/>

			{query.isPending ? (
				<div className="grid grid-cols-1 gap-3">
					{[1, 2, 3].map((i) => (
						<Skeleton key={i} className="h-32 rounded-xl" />
					))}
				</div>
			) : query.isError ? (
				<div className="p-4 bg-red-3/60 border border-red-6/60 text-red-11 text-xs rounded-xl">
					{query.error instanceof Error
						? query.error.message
						: "No se pudo cargar la lista de espera."}
				</div>
			) : filtered.length === 0 ? (
				<EmptyState
					icon={<Clock size={22} />}
					title="No hay solicitudes en este filtro"
					description="Cuando un DJ solicite acceso o agende demo en gigblades.com/acceso, aparecerá aquí."
				/>
			) : (
				<div className="grid grid-cols-1 gap-3">
					{filtered.map((signup) => {
						const meta = STATUS_META[signup.status] ?? STATUS_META.pending;
						const meetingLabel = signup.meetingAt
							? formatMeetingDateTime(signup.meetingAt, language)
							: null;
						const calendarHref = buildAdminGoogleCalendarHref(signup);
						const monthlyPriceUsd =
							referralsQuery.data?.settings?.monthlyPriceUsd ?? 30;
						const whatsappHref = waitlistWhatsappHref(signup, monthlyPriceUsd);
						const affiliateName = signup.referralCode
							? affiliateByCode.get(signup.referralCode.toUpperCase())
							: undefined;

						return (
							<div
								key={signup.id}
								className="p-5 card card-hover transition-all space-y-3"
							>
								<div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
									<div className="space-y-1.5 min-w-0 flex-1">
										<div className="flex items-center gap-2 flex-wrap">
											<h2 className="text-sm font-semibold text-grayscale-12">
												{signup.artistName}
											</h2>
											<StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
											{signup.paymentStatus === "paid" ? (
												<StatusBadge tone="emerald">
													<CreditCard size={11} />
													PAGADO
													{signup.paymentAmount
														? ` $${signup.paymentAmount}`
														: ""}
												</StatusBadge>
											) : null}
											{signup.referralCode ? (
												<StatusBadge tone="purple" dot={false}>
													<Share2 size={11} />
													{signup.referralCode}
													{affiliateName ? ` · ${affiliateName}` : ""}
												</StatusBadge>
											) : null}
										</div>

										<div className="flex flex-wrap items-center gap-3 text-xs text-grayscale-9">
											<a
												href={`mailto:${signup.email}`}
												className="inline-flex items-center gap-1 text-grayscale-11 hover:text-grayscale-12 font-medium break-all"
											>
												<Mail size={12} className="text-grayscale-8" />
												{signup.email}
											</a>
											{signup.city ? (
												<span className="inline-flex items-center gap-1">
													<MapPin size={12} className="text-grayscale-8" />
													{signup.city} ({signup.country})
												</span>
											) : null}
											{signup.instagram ? (
												<span>@{signup.instagram.replace(/^@/, "")}</span>
											) : null}
											<span>• {formatSignupDate(signup.createdAt, language)}</span>
										</div>

										{meetingLabel ? (
											<div className="inline-flex items-center gap-2 px-2.5 py-1 bg-grayscale-2 border border-grayscale-4 rounded-md text-xs text-grayscale-11 font-medium dark:bg-grayscale-3/60">
												<Calendar size={13} className="text-grayscale-9" />
												<span>Cita: {meetingLabel}</span>
												{calendarHref ? (
													<a
														href={calendarHref}
														target="_blank"
														rel="noreferrer"
														className="underline text-grayscale-12 font-semibold ml-1"
													>
														Agregar a Calendar
													</a>
												) : null}
											</div>
										) : null}

										{signup.note ? (
											<p className="p-3 surface-soft text-xs text-grayscale-11 leading-relaxed">
												{signup.note}
											</p>
										) : null}
									</div>

									<div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-grayscale-3/70 dark:border-white/[0.08]">
										{whatsappHref ? (
											<a
												href={whatsappHref}
												target="_blank"
												rel="noreferrer"
												className="inline-flex h-8 items-center gap-1.5 px-3 rounded-md border border-grayscale-4 bg-grayscale-1 text-[12px] font-medium text-grayscale-11 shadow-[0_1px_2px_rgba(28,22,16,0.04)] transition-[background-color,border-color,color,transform] duration-150 ease-[cubic-bezier(0.2,0,0,1)] hover:border-grayscale-5 hover:bg-grayscale-2 hover:text-grayscale-12 active:scale-[0.96] dark:bg-grayscale-2 dark:hover:bg-grayscale-3"
											>
												<WhatsappIcon size={13} className="text-green-10" />
												<span>WhatsApp</span>
											</a>
										) : null}
										{signup.status !== "onboarded" ? (
											<CreatePageButton
												signup={signup}
												onCreated={handleCreated}
											/>
										) : (
											<span className="inline-flex items-center gap-1 text-xs font-semibold text-green-11 px-2.5 py-1">
												<CheckCircle2 size={13} />
												Página creada
											</span>
										)}
										<DeleteSignupButton
											signup={signup}
											onDeleted={handleDeleted}
										/>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			)}

			<AvailabilityModal
				open={availabilityOpen}
				onClose={() => setAvailabilityOpen(false)}
			/>
		</PageContainer>
	);
}

const WEEKDAY_LABELS = [
	{ day: 1, label: "Lun" },
	{ day: 2, label: "Mar" },
	{ day: 3, label: "Mié" },
	{ day: 4, label: "Jue" },
	{ day: 5, label: "Vie" },
	{ day: 6, label: "Sáb" },
	{ day: 0, label: "Dom" },
] as const;

function crTodayKey(): string {
	const parts = new Intl.DateTimeFormat("en-CA", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		timeZone: "America/Costa_Rica",
	}).formatToParts(new Date());
	const y = parts.find((p) => p.type === "year")?.value ?? "2026";
	const m = parts.find((p) => p.type === "month")?.value ?? "01";
	const d = parts.find((p) => p.type === "day")?.value ?? "01";
	return `${y}-${m}-${d}`;
}

function AvailabilityModal({
	open,
	onClose,
}: {
	open: boolean;
	onClose: () => void;
}) {
	if (!open) return null;
	return <AvailabilityModalInner open={open} onClose={onClose} />;
}

function AvailabilityModalInner({
	open,
	onClose,
}: {
	open: boolean;
	onClose: () => void;
}) {
	const todayKey = useMemo(() => crTodayKey(), []);
	const [monthCursor, setMonthCursor] = useState(() => {
		const [y, m] = todayKey.split("-").map(Number);
		return { year: y, month: m - 1 };
	});
	const [draft, setDraft] = useState<MeetingAvailability>(
		DEFAULT_MEETING_AVAILABILITY,
	);
	const [saving, setSaving] = useState(false);

	const query = useQuery({
		queryKey: ["platform", "waitlist-availability"],
		queryFn: () => fetchMeetingAvailability(),
		staleTime: 30_000,
	});

	const active = query.data && !saving ? undefined : undefined;
	void active;

	const current: MeetingAvailability = useMemo(
		() => ({
			weekdays: draft === DEFAULT_MEETING_AVAILABILITY && query.data
				? query.data.weekdays
				: draft.weekdays,
			blockedDates: draft === DEFAULT_MEETING_AVAILABILITY && query.data
				? query.data.blockedDates
				: draft.blockedDates,
			enabledDates: draft === DEFAULT_MEETING_AVAILABILITY && query.data
				? query.data.enabledDates
				: draft.enabledDates,
			hours: draft === DEFAULT_MEETING_AVAILABILITY && query.data
				? query.data.hours
				: draft.hours,
		}),
		[draft, query.data],
	);

	const queryClient = useQueryClient();

	const toggleWeekday = (day: number) => {
		const has = current.weekdays.includes(day);
		const next = has
			? current.weekdays.filter((d) => d !== day)
			: [...current.weekdays, day].sort((a, b) => a - b);
		setDraft({ ...current, weekdays: next });
	};

	const toggleDateOverride = (dateKey: string) => {
		if (dateKey < todayKey) return;
		const currentlyAvailable = isDateAvailableForMeeting(
			dateKey,
			todayKey,
			current,
		);
		const d = new Date(`${dateKey}T12:00:00-06:00`);
		const weekdayEnabled = current.weekdays.includes(d.getUTCDay());
		let blockedDates = current.blockedDates.filter((x) => x !== dateKey);
		let enabledDates = current.enabledDates.filter((x) => x !== dateKey);

		if (currentlyAvailable) {
			if (weekdayEnabled) blockedDates = [...blockedDates, dateKey].sort();
		} else {
			if (!weekdayEnabled) enabledDates = [...enabledDates, dateKey].sort();
		}
		setDraft({ ...current, blockedDates, enabledDates });
	};

	const toggleHour = (hour: string) => {
		const has = current.hours.includes(hour);
		const next = has
			? current.hours.filter((h) => h !== hour)
			: [...current.hours, hour].sort();
		if (next.length === 0) {
			toast.error("Dejá al menos una hora disponible.");
			return;
		}
		setDraft({ ...current, hours: next });
	};

	const monthLabel = useMemo(() => {
		const d = new Date(Date.UTC(monthCursor.year, monthCursor.month, 15));
		const text = new Intl.DateTimeFormat("es-CR", {
			month: "long",
			year: "numeric",
			timeZone: "UTC",
		}).format(d);
		return text.charAt(0).toUpperCase() + text.slice(1);
	}, [monthCursor]);

	const calendarDays = useMemo(() => {
		const first = new Date(Date.UTC(monthCursor.year, monthCursor.month, 1));
		const daysInMonth = new Date(
			Date.UTC(monthCursor.year, monthCursor.month + 1, 0),
		).getUTCDate();
		// Monday-first offset (0=Lun .. 6=Dom)
		const firstOffset = (first.getUTCDay() + 6) % 7;
		const cells: (string | null)[] = Array.from(
			{ length: firstOffset },
			() => null,
		);
		for (let day = 1; day <= daysInMonth; day++) {
			const mm = String(monthCursor.month + 1).padStart(2, "0");
			const dd = String(day).padStart(2, "0");
			cells.push(`${monthCursor.year}-${mm}-${dd}`);
		}
		while (cells.length < 42) {
			cells.push(null);
		}
		return cells;
	}, [monthCursor]);

	const shiftMonth = (delta: number) => {
		setMonthCursor((prev) => {
			const d = new Date(Date.UTC(prev.year, prev.month + delta, 1));
			return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
		});
	};

	const save = async () => {
		setSaving(true);
		try {
			const saved = await updateMeetingAvailability(current);
			queryClient.setQueryData(["platform", "waitlist-availability"], saved);
			toast.success("Disponibilidad guardada y sincronizada.");
			onClose();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "No se pudo guardar.",
			);
		} finally {
			setSaving(false);
		}
	};

	return (
		<PanelModal
			open={open}
			onClose={onClose}
			title="Disponibilidad de citas"
			description="Definí días y horarios que se mostrarán en /acceso."
			maxWidthClass="max-w-2xl"
		>
			<div className="space-y-4">
				<div className="grid grid-cols-1 gap-4 md:grid-cols-[276px_1fr] md:items-start md:gap-5">
					{/* Left: Compact full-month square grid (42 cells = fixed height) */}
					<div className="rounded-lg border border-grayscale-4/80 bg-grayscale-2/30 p-2.5 dark:border-white/[0.08] dark:bg-white/[0.02]">
						<div className="mb-2 flex items-center justify-between gap-2">
							<span className="text-[12px] font-semibold tracking-tight text-grayscale-12">
								{monthLabel}
							</span>
							<div className="flex items-center gap-1">
								<button
									type="button"
									onClick={() => shiftMonth(-1)}
									aria-label="Mes anterior"
									className="flex size-6.5 cursor-pointer items-center justify-center rounded-md border border-grayscale-4 bg-grayscale-1 text-[11px] text-grayscale-11 transition-[background-color,transform] duration-150 hover:bg-grayscale-2 active:scale-[0.94] dark:bg-[#1b1b1a]"
								>
									←
								</button>
								<button
									type="button"
									onClick={() => shiftMonth(1)}
									aria-label="Mes siguiente"
									className="flex size-6.5 cursor-pointer items-center justify-center rounded-md border border-grayscale-4 bg-grayscale-1 text-[11px] text-grayscale-11 transition-[background-color,transform] duration-150 hover:bg-grayscale-2 active:scale-[0.94] dark:bg-[#1b1b1a]"
								>
									→
								</button>
							</div>
						</div>

						<div className="mb-1 grid grid-cols-7 gap-1 text-center font-mono text-[9.5px] font-medium uppercase text-grayscale-8">
							<span>L</span>
							<span>M</span>
							<span>X</span>
							<span>J</span>
							<span>V</span>
							<span>S</span>
							<span>D</span>
						</div>
						<div className="grid grid-cols-7 gap-1">
							{calendarDays.map((dateKey, idx) => {
								if (!dateKey) {
									return <div key={`empty-${idx}`} className="h-7.5" />;
								}
								const isPast = dateKey < todayKey;
								const available = isDateAvailableForMeeting(
									dateKey,
									todayKey,
									current,
								);
								const dayNum = Number(dateKey.slice(-2));
								return (
									<button
										key={dateKey}
										type="button"
										disabled={isPast}
										onClick={() => toggleDateOverride(dateKey)}
										className={`flex h-7.5 items-center justify-center rounded-md border font-mono text-[11px] tabular-nums transition-[background-color,border-color,color,transform] duration-150 ${
											isPast
												? "cursor-not-allowed border-transparent text-grayscale-6/70 dark:text-grayscale-7"
												: available
													? "cursor-pointer border-grayscale-12 bg-grayscale-12 font-semibold text-grayscale-1 active:scale-[0.94]"
													: "cursor-pointer border-grayscale-4/80 bg-grayscale-1 text-grayscale-8 hover:border-grayscale-7 hover:text-grayscale-12 active:scale-[0.94] dark:border-white/[0.08] dark:bg-[#161615]"
										}`}
									>
										{dayNum}
									</button>
								);
							})}
						</div>
					</div>

					{/* Right: Weekdays + Hours */}
					<div className="space-y-4">
						<div>
							<span className="section-label mb-1.5 block">Días de la semana</span>
							<div className="grid grid-cols-7 gap-1">
								{WEEKDAY_LABELS.map((item) => {
									const on = current.weekdays.includes(item.day);
									return (
										<button
											key={item.day}
											type="button"
											onClick={() => toggleWeekday(item.day)}
											className={`h-8 cursor-pointer rounded-md border text-[11px] font-medium transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.95] ${
												on
													? "border-grayscale-12 bg-grayscale-12 text-grayscale-1"
													: "border-grayscale-4 bg-grayscale-1 text-grayscale-9 hover:text-grayscale-12 dark:border-white/[0.08] dark:bg-[#161615]"
											}`}
										>
											{item.label}
										</button>
									);
								})}
							</div>
						</div>

						<div>
							<div className="mb-1.5 flex items-center justify-between">
								<span className="section-label">Horarios visibles</span>
								<span className="font-mono text-[10.5px] text-grayscale-9">
									{current.hours.length} activos
								</span>
							</div>
							<div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
								{ALL_MEETING_HOURS.map((hour) => {
									const on = current.hours.includes(hour);
									const [hStr, mStr] = hour.split(":");
									const h = Number(hStr);
									const label = `${h % 12 === 0 ? 12 : h % 12}:${mStr} ${h >= 12 ? "PM" : "AM"}`;
									return (
										<button
											key={hour}
											type="button"
											onClick={() => toggleHour(hour)}
											className={`h-8 cursor-pointer rounded-md border font-mono text-[11px] tabular-nums transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.95] ${
												on
													? "border-grayscale-12 bg-grayscale-12 font-medium text-grayscale-1"
													: "border-grayscale-4 bg-grayscale-1 text-grayscale-8 hover:text-grayscale-12 dark:border-white/[0.08] dark:bg-[#161615]"
											}`}
										>
											{label}
										</button>
									);
								})}
							</div>
						</div>
					</div>
				</div>

				<div className="flex items-center justify-end gap-2 border-t border-grayscale-3/80 pt-3 dark:border-white/[0.08]">
					<PanelButton variant="ghost" onClick={onClose} disabled={saving}>
						Cancelar
					</PanelButton>
					<PanelButton onClick={() => void save()} disabled={saving}>
						{saving ? "Guardando…" : "Guardar disponibilidad"}
					</PanelButton>
				</div>
			</div>
		</PanelModal>
	);
}
