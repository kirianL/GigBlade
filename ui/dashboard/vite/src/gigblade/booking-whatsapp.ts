import type { PublicBooking } from "@/gigblade/site-api";

const EVENT_TYPE_LABELS: Record<PublicBooking["eventType"], string> = {
	club: "Club / Discoteca",
	festival: "Festival",
	private: "Fiesta privada",
	wedding: "Boda",
	corporate: "Corporativo",
	other: "Otro evento",
};

function whatsappDigits(phone: string): string | null {
	let digits = phone.replace(/\D/g, "");
	if (!digits) return null;
	if (digits.length === 8) digits = `506${digits}`;
	return digits;
}

function formatEventDate(dateStr: string | null): string {
	if (!dateStr) return "A coordinar";
	const [year, month, day] = dateStr.split("-");
	if (!year || !month || !day) return dateStr;
	const date = new Date(Number(year), Number(month) - 1, Number(day));
	if (Number.isNaN(date.getTime())) return dateStr;
	return date.toLocaleDateString("es-CR", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});
}

export function buildDjBookingWhatsappMessage(
	artistName: string,
	booking: PublicBooking,
): string {
	const eventLabel = EVENT_TYPE_LABELS[booking.eventType] ?? booking.eventType;
	const lines = [
		`¡Hola ${booking.name.trim()}!`,
		"",
		`Soy ${artistName.trim()}. Recibí tu solicitud de contratación desde mi página.`,
		"",
		"Resumen de tu consulta:",
		`• Evento: ${eventLabel}`,
		`• Fecha estimada: ${formatEventDate(booking.eventDate)}`,
	];

	if (booking.city?.trim()) {
		lines.push(`• Ciudad / lugar: ${booking.city.trim()}`);
	}

	if (booking.note?.trim()) {
		lines.push("", "Detalles / presupuesto que indicaste:", booking.note.trim());
	}

	lines.push(
		"",
		"Me gustaría coordinar contigo disponibilidad y confirmar cuánto sería el servicio para tu fecha.",
		"¿Te parece si lo vemos por acá?",
		"",
		`Saludos,`,
		artistName.trim(),
	);

	return lines.join("\n");
}

export function djBookingWhatsappHref(
	clientPhone: string,
	artistName: string,
	booking: PublicBooking,
): string | null {
	const digits = whatsappDigits(clientPhone);
	if (!digits) return null;
	const text = buildDjBookingWhatsappMessage(artistName, booking);
	return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
