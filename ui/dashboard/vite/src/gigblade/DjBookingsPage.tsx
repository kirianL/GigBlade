import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
	Button,
} from "@autumn/ui";
import {
	CalendarBlankIcon,
	CalendarCheckIcon,
	CheckCircleIcon,
	ClockIcon,
	EnvelopeSimpleIcon,
	MagnifyingGlassIcon,
	MapPinIcon,
	PhoneIcon,
	WhatsappLogoIcon,
	XCircleIcon,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { djDomainLabel, djPublicUrl } from "@/gigblade/concept";
import { readPanelAuthSession } from "@/gigblade/panel-session";
import {
	fetchDjBookings,
	updateBookingStatus,
	type PublicBooking,
} from "@/gigblade/site-api";
import {
	DjSelect,
	MetricCard,
	OpenPublicPageButton,
	PageContainer,
	useSelectedDj,
} from "@/gigblade/ui";
import { useLanguage } from "@/contexts/LanguageProvider";

const EVENT_TYPE_LABELS: Record<string, string> = {
	club: "Club / Discoteca",
	festival: "Festival",
	private: "Fiesta privada",
	wedding: "Boda",
	corporate: "Corporativo",
	other: "Otro",
};

const STATUS_LABELS: Record<string, { label: string; color: string; badge: string }> = {
	pending: {
		label: "Pendiente",
		color: "text-amber-500",
		badge: "bg-amber-500/10 text-amber-500 border-amber-500/20",
	},
	confirmed: {
		label: "Confirmada",
		color: "text-emerald-500",
		badge: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
	},
	declined: {
		label: "Rechazada",
		color: "text-rose-500",
		badge: "bg-rose-500/10 text-rose-500 border-rose-500/20",
	},
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

function cleanPhoneForWhatsapp(phone: string) {
	return phone.replace(/[^0-9]/g, "");
}

export default function DjBookingsPage() {
	const { dj, setDj } = useSelectedDj();
	const { t } = useLanguage();
	const pageUrl = djPublicUrl(dj);
	const [bookings, setBookings] = useState<PublicBooking[]>([]);
	const [loading, setLoading] = useState(true);
	const [filterStatus, setFilterStatus] = useState<string>("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [updatingId, setUpdatingId] = useState<string | null>(null);

	const session = readPanelAuthSession();

	useEffect(() => {
		let isMounted = true;
		const controller = new AbortController();
		setLoading(true);

		if (!session?.token) {
			setLoading(false);
			return;
		}

		void fetchDjBookings({
			slug: dj.slug,
			token: session.token,
			signal: controller.signal,
		})
			.then((data) => {
				if (isMounted) {
					setBookings(data);
					setLoading(false);
				}
			})
			.catch(() => {
				if (isMounted) setLoading(false);
			});

		return () => {
			isMounted = false;
			controller.abort();
		};
	}, [dj.slug, session?.token]);

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
				prev.map((b) => (b.id === bookingId ? { ...b, status: updated.status } : b)),
			);

			toast.success(`Contratación marcada como ${STATUS_LABELS[newStatus]?.label.toLowerCase()}`);
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

	const counts = useMemo(() => {
		const pending = bookings.filter((b) => b.status === "pending").length;
		const confirmed = bookings.filter((b) => b.status === "confirmed").length;
		const total = bookings.length;
		return { pending, confirmed, total };
	}, [bookings]);

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
			<div className="flex items-center justify-between w-full gap-4">
				<Breadcrumb className="text-tertiary-foreground flex justify-start">
					<BreadcrumbList className="text-tertiary-foreground text-xs">
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<Link to={`/studio?dj=${dj.slug}`}>{t("nav.myPage", "Mi página")}</Link>
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>{t("nav.bookings", "Contrataciones")}</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>
				<div className="flex items-center gap-2">
					<DjSelect value={dj.slug} onValueChange={setDj} />
					<OpenPublicPageButton href={pageUrl} />
				</div>
			</div>

			{/* Tarjetas métricas */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
				<MetricCard
					icon={
						<CalendarBlankIcon
							size={20}
							className="text-tertiary-foreground"
							aria-hidden
						/>
					}
					label={t("bookings.total", "Total solicitudes")}
					value={counts.total}
				/>
				<MetricCard
					icon={
						<ClockIcon
							size={20}
							className="text-amber-500"
							aria-hidden
						/>
					}
					label={t("bookings.pending", "Por responder")}
					value={counts.pending}
				/>
				<MetricCard
					icon={
						<CalendarCheckIcon
							size={20}
							className="text-emerald-500"
							aria-hidden
						/>
					}
					label={t("bookings.confirmed", "Confirmadas")}
					value={counts.confirmed}
				/>
			</div>

			{/* Barra de Filtros y Búsqueda */}
			<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full border-b pb-4">
				<div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
					{[
						{ id: "all", label: t("bookings.all", "Todas") },
						{ id: "pending", label: t("bookings.pending", "Pendientes") },
						{ id: "confirmed", label: t("bookings.confirmed", "Confirmadas") },
						{ id: "declined", label: t("bookings.declined", "Rechazadas") },
					].map((tab) => (
						<button
							key={tab.id}
							type="button"
							onClick={() => setFilterStatus(tab.id)}
							className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
								filterStatus === tab.id
									? "bg-interactive-secondary text-foreground font-semibold shadow-sm border border-border"
									: "text-muted-foreground hover:text-foreground hover:bg-muted/50"
							}`}
						>
							{tab.label}
						</button>
					))}
				</div>

				<div className="relative min-w-[220px] max-w-sm">
					<MagnifyingGlassIcon
						size={15}
						className="absolute left-2.5 top-1/2 -translate-y-1/2 text-tertiary-foreground"
						aria-hidden
					/>
					<input
						type="text"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Buscar por nombre, ciudad..."
						className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-input bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
					/>
				</div>
			</div>

			{/* Listado de Contrataciones */}
			{loading ? (
				<div className="py-16 text-center text-sm text-tertiary-foreground">
					Cargando solicitudes de contratación...
				</div>
			) : filteredBookings.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
					<CalendarBlankIcon size={36} className="text-tertiary-foreground opacity-50 mb-3" />
					<p className="text-sm font-medium text-foreground">
						No hay solicitudes de contratación {filterStatus !== "all" ? `en estado "${filterStatus}"` : "todavía"}
					</p>
					<p className="text-xs text-muted-foreground mt-1 max-w-sm">
						Cuando los organizadores o productores completen el formulario en tu página pública, los datos de contacto y detalles aparecerán acá.
					</p>
					{pageUrl && (
						<Button variant="secondary" size="sm" className="mt-4" asChild>
							<a href={`${pageUrl}#contacto`} target="_blank" rel="noreferrer">
								Ver formulario en tu página
							</a>
						</Button>
					)}
				</div>
			) : (
				<div className="grid grid-cols-1 gap-3.5 w-full">
					{filteredBookings.map((item) => {
						const statusInfo = STATUS_LABELS[item.status] || STATUS_LABELS.pending;
						const isUpdating = updatingId === item.id;
						const waPhone = item.phone ? cleanPhoneForWhatsapp(item.phone) : null;

						return (
							<div
								key={item.id}
								className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border bg-card hover:border-border/80 transition-colors"
							>
								<div className="flex flex-col gap-2 min-w-0 flex-1">
									<div className="flex items-center gap-2 flex-wrap">
										<span className="font-semibold text-sm text-foreground">
											{item.name}
										</span>
										<span
											className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusInfo.badge}`}
										>
											{statusInfo.label}
										</span>
										<span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-secondary-foreground">
											{EVENT_TYPE_LABELS[item.eventType] || item.eventType}
										</span>
										<span className="text-[10px] text-tertiary-foreground font-mono">
											{formatRelativeCreated(item.createdAt)}
										</span>
									</div>

									{/* Fecha y Ciudad */}
									<div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
										<div className="flex items-center gap-1 text-foreground/90 font-medium">
											<CalendarBlankIcon size={14} className="text-tertiary-foreground" />
											<span>{formatEventDate(item.eventDate)}</span>
										</div>
										{item.city && (
											<div className="flex items-center gap-1">
												<MapPinIcon size={14} className="text-tertiary-foreground" />
												<span>{item.city}</span>
											</div>
										)}
									</div>

									{/* Nota o mensaje del cliente */}
									{item.note && (
										<p className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border/50 max-w-2xl leading-relaxed">
											"{item.note}"
										</p>
									)}

									{/* Canales de contacto directos con el cliente */}
									<div className="flex items-center gap-3 pt-1 text-xs">
										<a
											href={`mailto:${item.email}`}
											className="inline-flex items-center gap-1.5 text-xs text-foreground hover:underline font-medium"
										>
											<EnvelopeSimpleIcon size={14} className="text-tertiary-foreground" />
											{item.email}
										</a>
										{item.phone && (
											<>
												<span className="text-border">•</span>
												<a
													href={`tel:${item.phone}`}
													className="inline-flex items-center gap-1.5 text-xs text-foreground hover:underline font-medium"
												>
													<PhoneIcon size={14} className="text-tertiary-foreground" />
													{item.phone}
												</a>
												{waPhone && (
													<a
														href={`https://wa.me/${waPhone}`}
														target="_blank"
														rel="noreferrer"
														className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium hover:bg-emerald-500/20 transition-colors"
													>
														<WhatsappLogoIcon size={13} weight="fill" />
														WhatsApp
													</a>
												)}
											</>
										)}
									</div>
								</div>

								{/* Acciones de estado */}
								<div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0">
									<div className="flex items-center gap-1.5">
										{item.status !== "confirmed" && (
											<Button
												variant="secondary"
												size="sm"
												disabled={isUpdating}
												onClick={() => handleStatusChange(item.id, "confirmed")}
												className="h-7 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30"
											>
												<CheckCircleIcon size={14} weight="bold" />
												Confirmar
											</Button>
										)}
										{item.status !== "declined" && (
											<Button
												variant="secondary"
												size="sm"
												disabled={isUpdating}
												onClick={() => handleStatusChange(item.id, "declined")}
												className="h-7 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30"
											>
												<XCircleIcon size={14} weight="bold" />
												Rechazar
											</Button>
										)}
										{item.status !== "pending" && (
											<Button
												variant="ghost"
												size="sm"
												disabled={isUpdating}
												onClick={() => handleStatusChange(item.id, "pending")}
												className="h-7 text-xs text-muted-foreground"
											>
												Reabrir
											</Button>
										)}
									</div>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</PageContainer>
	);
}
