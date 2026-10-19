import {
	PRIVACY_EFFECTIVE_DATE,
	privacyPolicySections,
} from "@/lib/privacyPolicyContent";
import { SITE_URL } from "@/lib/seo";
import { TERMS_EFFECTIVE_DATE, termsSections } from "@/lib/termsContent";

export function buildHomeMarkdown(): string {
	const lines: string[] = [
		"# GigBlades",
		"",
		"> Presencia digital para DJs: página personalizable con bookings, panel, hosting y seguridad. El dominio lo comprás vos.",
		"",
		"## Qué incluye",
		"- Una página con tema, bio, fotos, agenda y sets",
		"- Formulario de bookings",
		"- Panel para editar la página",
		"- Hosting y seguridad en la mensualidad",
		"- El dominio lo compra el DJ",
		"",
		"## Páginas",
		`- [Plan](${SITE_URL}/pricing)`,
		`- [Acceso](${SITE_URL}/acceso)`,
		`- [Términos](${SITE_URL}/terms)`,
		`- [Privacidad](${SITE_URL}/privacy)`,
		"",
		"---",
		`Source: ${SITE_URL}/`,
	];

	return `${lines.join("\n").trim()}\n`;
}

export function buildTermsMarkdown(): string {
	const lines: string[] = [
		"# Terms of Service",
		"",
		`GigBlades — Effective Date: ${TERMS_EFFECTIVE_DATE}`,
		"",
	];

	for (const term of termsSections) {
		lines.push(`## ${term.title}`, "", term.content, "");
	}

	lines.push("---", `Source: ${SITE_URL}/terms`);

	return `${lines.join("\n").trim()}\n`;
}

export function buildPrivacyMarkdown(): string {
	const lines: string[] = [
		"# Privacy Policy",
		"",
		`GigBlades — Effective Date: ${PRIVACY_EFFECTIVE_DATE}`,
		"",
	];

	for (const section of privacyPolicySections) {
		lines.push(`## ${section.title}`, "", section.content, "");
	}

	lines.push("---", `Source: ${SITE_URL}/privacy`);

	return `${lines.join("\n").trim()}\n`;
}
