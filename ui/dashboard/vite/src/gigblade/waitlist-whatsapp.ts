import type { WaitlistSignup } from "@/gigblade/site-api";

const DEFAULT_MONTHLY_USD = 30;

function formatUsdAmount(amount: number): string {
	const value = Number.isFinite(amount) && amount >= 0 ? amount : DEFAULT_MONTHLY_USD;
	const rounded = Math.round(value * 100) / 100;
	if (Number.isInteger(rounded)) return `$${rounded}`;
	return `$${rounded.toLocaleString("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`;
}

function whatsappDigits(phone: string, country: WaitlistSignup["country"]): string | null {
	let digits = phone.replace(/\D/g, "");
	if (!digits) return null;
	if (country === "CR" && digits.length === 8) digits = `506${digits}`;
	return digits;
}

export function buildWaitlistWhatsappMessage(
	signup: WaitlistSignup,
	monthlyPriceUsd: number,
): string {
	const name = signup.artistName.trim() || "DJ";
	const monthly = formatUsdAmount(monthlyPriceUsd);
	const lines = [
		`¡Hola ${name}!`,
		"",
		"Soy del equipo de GigBlades. Recibimos tu solicitud en la lista de espera para crear tu página web de DJ.",
		"",
		`El pago inicial para crear tu página es de $100 USD. La mensualidad de mantenimiento es de ${monthly} USD.`,
		"",
		"En GigBlades podés tener:",
		"• Tu sitio web profesional con booking y contacto",
		"• Panel para administrar tu página y solicitudes",
		"• Hosting y soporte del servicio",
	];

	if (signup.city?.trim()) {
		lines.push("", `Ciudad que indicaste: ${signup.city.trim()}.`);
	}

	if (signup.note?.trim()) {
		lines.push("", "Nota de tu solicitud:", signup.note.trim());
	}

	lines.push(
		"",
		"¿Te parece si lo vemos por acá y te contamos la disponibilidad para activar tu página?",
		"",
		"Saludos,",
		"Equipo GigBlades",
	);

	return lines.join("\n");
}

export function waitlistWhatsappHref(
	signup: WaitlistSignup,
	monthlyPriceUsd: number,
): string | null {
	if (!signup.phone?.trim()) return null;
	const digits = whatsappDigits(signup.phone, signup.country);
	if (!digits) return null;
	const text = buildWaitlistWhatsappMessage(signup, monthlyPriceUsd);
	return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
