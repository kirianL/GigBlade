"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	Calendar,
	CheckCircle2,
	Mail,
	MapPin,
	Phone,
	RotateCcw,
	Search,
	XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { djPublicUrl } from "@/panel/concept";
import { readPanelAuthSession } from "@/panel/panel-session";
import { djBookingWhatsappHref } from "@/panel/booking-whatsapp";
import { Skeleton } from "@/panel/Skeleton";
import {
	fetchDjBookings,
	updateBookingStatus,
	type PublicBooking,
} from "@/panel/site-api";
import {
	DjSelect,
	EmptyState,
	MetricCard,
	OpenPublicPageButton,
	PageContainer,
	PageHeader,
	PanelButton,
	PanelInput,
	SegmentedControl,
	StatusBadge,
	WhatsappIcon,
	useSelectedDj,
	type BadgeTone,
} from "@/panel/ui";
import { useLanguage } from "@/panel/LanguageProvider";

const EVENT_TYPE_LABELS: Record<string, string> = {
	club: "Club / Discoteca",
	festival: "Festival",
	private: "Fiesta privada",
	wedding: "Boda",
	corporate: "Corporativo",
	other: "Otro",
};

const STATUS_META: Record<string, { label: string; tone: BadgeTone }> = {
	pending: { label: "PENDIENTE", tone: "amber" },
	confirmed: { label: "CONFIRMADA", tone: "emerald" },
	declined: { label: "RECHAZADA", tone: "red" },
};

function formatEventDate(dateStr: string | null) {
	if (!dateStr) return "Fecha a coordinar";
	try {
		const [year, month, day] = dateStr.split("-").map(Number);
		const date = new Date(year, month - 1, day);
		return date.toLocaleDateString("es-ES", {
			day: "numeric",
			month: "short",
			year: "numeric",
		});
	} catch {
		return dateStr;
	}
}

function formatRelativeCreated(isoStr: string) {
	try {
		const diff = Date.now() - new Date(isoStr).getTime();
		const hours = Math.floor(diff / (1000 * 60 * 60));
		if (hours < 1) return "Recién recibida";
		if (hours < 24) return `Hace ${hours}h`;
		const days = Math.floor(hours / 24);
		return `Hace ${days}d`;
	} catch {
		return "";
	}
}

export default function DjBookingsPage() {
	const { dj, setDj } = useSelectedDj();
	const { t } = useLanguage();
	const pageUrl = djPublicUrl(dj);
	const [bookings, setBookings] = useState<PublicBooking[]>([]);
	const [loading, setLoading] = useState(true);
	const [filterStatus, setFilterStatus] = useState<
		"all" | "pending" | "confirmed" | "declined"
	>("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [updatingId, setUpdatingId] = useState<string | null>(null);

	const session = readPanelAuthSession();
	const isMountedRef = useRef(true);
	const knownBookingIdsRef = useRef<Set<string>>(new Set());

	const reloadBookings = useCallback(
		async (options?: { showLoading?: boolean }) => {
			const showLoading = options?.showLoading ?? false;
			const token = session?.token;
			if (!token) {
				if (showLoading) setLoading(false);
				return;
			}
			if (showLoading) setLoading(true);
			try {
				const data = await fetchDjBookings({ slug: dj.slug, token });
				if (!isMountedRef.current) return;
				const known = knownBookingIdsRef.current;
				if (known.size > 0) {
					const fresh = data.filter((booking) => !known.has(booking.id));
					if (fresh.length === 1) {
						toast.info(`Nueva solicitud de ${fresh[0].name}`);
					} else if (fresh.length > 1) {
						toast.info(`${fresh.length} solicitudes nuevas`);
					}
				}
				knownBookingIdsRef.current = new Set(data.map((b) => b.id));
				setBookings(data);
			} catch {
				// ignore background refresh failures
			} finally {
				if (showLoading && isMountedRef.current) {
					setLoading(false);
				}
			}
		},
		[dj.slug, session?.token],
	);

	useEffect(() => {
		isMountedRef.current = true;
		knownBookingIdsRef.current = new Set();
		const token = session?.token;
		if (!token) {
			const id = window.setTimeout(() => setLoading(false), 0);
			return () => {
				window.clearTimeout(id);
				isMountedRef.current = false;
			};
		}
		let cancelled = false;
		void fetchDjBookings({ slug: dj.slug, token })
			.then((data) => {
				if (cancelled || !isMountedRef.current) return;
				knownBookingIdsRef.current = new Set(data.map((b) => b.id));
				setBookings(data);
			})
			.catch(() => {
				// ignore initial load failures
			})
			.finally(() => {
				if (!cancelled && isMountedRef.current) {
					setLoading(false);
				}
			});
		return () => {
			cancelled = true;
			isMountedRef.current = false;
		};
	}, [dj.slug, session?.token]);

	useEffect(() => {
		if (!session?.token) return;
		const intervalId = window.setInterval(() => {
			void reloadBookings();
		}, 8_000);
		function refreshIfActive() {
			if (document.visibilityState === "visible") {
				void reloadBookings();
			}
		}
		document.addEventListener("visibilitychange", refreshIfActive);
		window.addEventListener("focus", refreshIfActive);
		return () => {
			window.clearInterval(intervalId);
			document.removeEventListener("visibilitychange", refreshIfActive);
			window.removeEventListener("focus", refreshIfActive);
		};
	}, [reloadBookings, session?.token]);

	async function handleStatusChange(
		bookingId: string,
		newStatus: "pending" | "confirmed" | "declined",
	) {
		if (!session?.token) {
			toast.error("Iniciá sesión para modificar el estado.");
			return;
		}
		setUpdatingId(bookingId);
		try {
			const updated = await updateBookingStatus({
				id: bookingId,
				status: newStatus,
				slug: dj.slug,
				token: session.token,
			});
			setBookings((prev) =>
				prev.map((b) =>
					b.id === bookingId ? { ...b, status: updated.status } : b,
				),
			);
			toast.success(
				`Contratación marcada como ${STATUS_META[newStatus]?.label.toLowerCase()}`,
			);
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "No se pudo actualizar el estado de la contratación.",
			);
		} finally {
			setUpdatingId(null);
		}
	}

	const counts = useMemo(
		() => ({
			all: bookings.length,
			pending: bookings.filter((b) => b.status === "pending").length,
			confirmed: bookings.filter((b) => b.status === "confirmed").length,
			declined: bookings.filter((b) => b.status === "declined").length,
		}),
		[bookings],
	);

	const filteredBookings = useMemo(() => {
		return bookings.filter((b) => {
			if (filterStatus !== "all" && b.status !== filterStatus) return false;
			if (!searchQuery.trim()) return true;
			const query = searchQuery.toLowerCase();
			return (
				b.name.toLowerCase().includes(query) ||
				b.email.toLowerCase().includes(query) ||
				(b.city && b.city.toLowerCase().includes(query)) ||
				(b.note && b.note.toLowerCase().includes(query))
			);
		});
	}, [bookings, filterStatus, searchQuery]);

	return (
		<PageContainer>
			<PageHeader
				title={t("nav.bookings", "Contrataciones")}
				subtitle={`Solicitudes recibidas desde el formulario público de ${dj.name}`}
			>
				<DjSelect value={dj.slug} onValueChange={setDj} />
				<OpenPublicPageButton href={pageUrl} />
			</PageHeader>

			{/* Metric Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<MetricCard
					label={t("bookings.total", "Total solicitudes")}
					value={counts.all}
					footer={
						<>
							<span className="inline-block w-2 h-2 rounded-full bg-grayscale-8" />
							<span>Bandeja consolidada</span>
						</>
					}
				/>
				<MetricCard
					label={t("bookings.pending", "Por responder")}
					value={counts.pending}
					valueClassName="text-amber-600"
					footer={
						<>
							<span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
							<span>Requieren seguimiento</span>
						</>
					}
				/>
				<MetricCard
					label={t("bookings.confirmed", "Confirmadas")}
					value={counts.confirmed}
					valueClassName="text-emerald-600"
					footer={
						<>
							<span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
							<span>Fechas cerradas</span>
						</>
					}
				/>
			</div>

			{/* Segmented Control & Search */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
				<SegmentedControl
					value={filterStatus}
					onChange={setFilterStatus}
					options={[
						{ value: "all", label: t("bookings.all", "Todas"), count: counts.all },
						{ value: "pending", label: t("bookings.pending", "Pendientes"), count: counts.pending },
						{ value: "confirmed", label: t("bookings.confirmed", "Confirmadas"), count: counts.confirmed },
						{ value: "declined", label: t("bookings.declined", "Rechazadas"), count: counts.declined },
					]}
				/>

				<div className="relative w-full sm:w-64">
					<Search
						size={14}
						className="absolute left-3 top-1/2 -translate-y-1/2 text-grayscale-8"
					/>
					<PanelInput
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Buscar por nombre, ciudad…"
						className="pl-9 bg-grayscale-1 dark:bg-[#1b1b1a]"
					/>
				</div>
			</div>

			{/* Listado */}
			{loading ? (
				<div className="grid grid-cols-1 gap-3">
					{[1, 2].map((i) => (
						<Skeleton key={i} className="h-32 rounded-xl" />
					))}
				</div>
			) : filteredBookings.length === 0 ? (
				<EmptyState
					icon={<Calendar size={22} />}
					title={`No hay contrataciones ${filterStatus !== "all" ? "en este estado" : "todavía"}`}
					description="Cuando organizadores o productores completen el formulario en tu página pública, aparecerán listados aquí."
					action={
						pageUrl ? (
							<a
								href={`${pageUrl}#contacto`}
								target="_blank"
								rel="noreferrer"
								className="px-4 py-2 bg-grayscale-12 hover:bg-grayscale-11 text-grayscale-1 text-xs font-semibold rounded-xl shadow-xs transition-colors"
							>
								Ver formulario en tu página
							</a>
						) : (
							<Link
								href={`/studio?dj=${dj.slug}`}
								className="px-4 py-2 bg-grayscale-12 hover:bg-grayscale-11 text-grayscale-1 text-xs font-semibold rounded-xl shadow-xs transition-colors"
							>
								Ir a Mi página
							</Link>
						)
					}
				/>
			) : (
				<div className="grid grid-cols-1 gap-3">
					{filteredBookings.map((item) => {
						const statusInfo = STATUS_META[item.status] || STATUS_META.pending;
						const isUpdating = updatingId === item.id;
						const whatsappHref = item.phone
							? djBookingWhatsappHref(item.phone, dj.name, item)
							: null;

						return (
							<div
								key={item.id}
								className="p-5 card card-hover transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4"
							>
								<div className="space-y-2.5 min-w-0 flex-1">
									<div className="flex items-center gap-2 flex-wrap">
										<h2 className="text-sm font-semibold text-grayscale-12">
											{item.name}
										</h2>
										<StatusBadge tone={statusInfo.tone}>
											{statusInfo.label}
										</StatusBadge>
										<span className="text-[11px] font-medium px-2 py-0.5 bg-grayscale-2 text-grayscale-10 rounded-md">
											{EVENT_TYPE_LABELS[item.eventType] || item.eventType}
										</span>
										<span className="text-[11px] font-mono text-grayscale-8">
											{formatRelativeCreated(item.createdAt)}
										</span>
									</div>

									<div className="flex flex-wrap items-center gap-3 text-xs text-grayscale-10">
										<span className="inline-flex items-center gap-1 font-medium text-grayscale-11">
											<Calendar size={13} className="text-grayscale-8" />
											{formatEventDate(item.eventDate)}
										</span>
										{item.city ? (
											<span className="inline-flex items-center gap-1">
												<MapPin size={13} className="text-grayscale-8" />
												{item.city}
											</span>
										) : null}
									</div>

									{item.note ? (
										<div className="p-3 surface-soft text-xs text-grayscale-11 leading-relaxed max-w-2xl">
											“{item.note}”
										</div>
									) : null}

									<div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
										<a
											href={`mailto:${item.email}`}
											className="inline-flex items-center gap-1.5 text-grayscale-11 hover:text-grayscale-12 font-medium break-all"
										>
											<Mail size={13} className="text-grayscale-8 shrink-0" />
											{item.email}
										</a>
										{item.phone ? (
											<>
												<a
													href={`tel:${item.phone}`}
													className="inline-flex items-center gap-1.5 text-grayscale-11 hover:text-grayscale-12 font-medium whitespace-nowrap"
												>
													<Phone size={13} className="text-grayscale-8 shrink-0" />
													{item.phone}
												</a>
												{whatsappHref ? (
													<a
														href={whatsappHref}
														target="_blank"
														rel="noreferrer"
														className="inline-flex h-7 items-center gap-1.5 px-2.5 rounded-md border border-grayscale-4 bg-grayscale-1 text-[11px] font-medium text-grayscale-11 shadow-[0_1px_2px_rgba(28,22,16,0.04)] transition-[background-color,border-color,color,transform] duration-150 ease-[cubic-bezier(0.2,0,0,1)] hover:border-grayscale-5 hover:bg-grayscale-2 hover:text-grayscale-12 active:scale-[0.96] dark:bg-grayscale-2 dark:hover:bg-grayscale-3"
													>
														<WhatsappIcon size={12} className="text-green-10" />
														<span>WhatsApp</span>
													</a>
												) : null}
											</>
										) : null}
									</div>
								</div>

								<div className="flex flex-wrap sm:flex-col items-center sm:items-end gap-2 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-grayscale-3/70 dark:border-white/[0.08]">
									{item.status !== "confirmed" ? (
										<PanelButton
											variant="success"
											size="sm"
											disabled={isUpdating}
											onClick={() => void handleStatusChange(item.id, "confirmed")}
										>
											<CheckCircle2 size={13} />
											<span>Confirmar</span>
										</PanelButton>
									) : null}
									{item.status !== "declined" ? (
										<PanelButton
											variant="secondary"
											size="sm"
											disabled={isUpdating}
											onClick={() => void handleStatusChange(item.id, "declined")}
											className="text-red-600 hover:bg-red-50/70 hover:border-red-200"
										>
											<XCircle size={13} />
											<span>Rechazar</span>
										</PanelButton>
									) : null}
									{item.status !== "pending" ? (
										<PanelButton
											variant="ghost"
											size="sm"
											disabled={isUpdating}
											onClick={() => void handleStatusChange(item.id, "pending")}
										>
											<RotateCcw size={13} />
											<span>Reabrir</span>
										</PanelButton>
									) : null}
								</div>
							</div>
						);
					})}
				</div>
			)}
		</PageContainer>
	);
}
