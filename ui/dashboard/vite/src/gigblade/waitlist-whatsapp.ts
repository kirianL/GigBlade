import type { WaitlistSignup } from "@/gigblade/site-api";

function whatsappDigits(phone: string, country: WaitlistSignup["country"]): string | null {
	let digits = phone.replace(/\D/g, "");
	if (!digits) return null;
	if (country === "CR" && digits.length === 8) digits = `506${digits}`;
	return digits;
}

export function buildWaitlistWhatsappMessage(signup: WaitlistSignup): string {
	const name = signup.artistName.trim() || "DJ";
	const lines = [
		`¡Hola ${name}!`,
		"",
		"Soy del equipo de GigBlade. Recibimos tu solicitud en la lista de espera para crear tu página web de DJ.",
		"",
		"Te damos la bienvenida. En GigBlade podés tener:",
		"• Tu sitio web profesional con booking y contacto",
		"• Panel para administrar tu página y solicitudes",
		"• Hosting y soporte del servicio",
		"",
		"El siguiente paso es coordinar el setup inicial y la mensualidad de mantenimiento. Te confirmamos el monto exacto según el plan que elijas.",
	];

	if (signup.city?.trim()) {
		lines.push("", `Ciudad que indicaste: ${signup.city.trim()}.`);
	}

	if (signup.note?.trim()) {
		lines.push("", "Nota de tu solicitud:", signup.note.trim());
	}

	lines.push(
		"",
		"¿Te parece si lo vemos por acá y te contamos disponibilidad y cuánto sería para activar tu página?",
		"",
		"Saludos,",
		"Equipo GigBlade",
	);

	return lines.join("\n");
}

export function waitlistWhatsappHref(signup: WaitlistSignup): string | null {
	if (!signup.phone?.trim()) return null;
	const digits = whatsappDigits(signup.phone, signup.country);
	if (!digits) return null;
	const text = buildWaitlistWhatsappMessage(signup);
	return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
