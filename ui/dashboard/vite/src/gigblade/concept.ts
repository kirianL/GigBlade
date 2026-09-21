import { CusProductStatus } from "@autumn/shared";

export type DjStatus = "active" | "trialing" | "canceled";

export type SiteTemplateId = "pista" | "festival" | "after";

export type GigbladeDj = {
	slug: string;
	name: string;
	email: string;
	domain: string;
	city: string;
	template: SiteTemplateId;
	status: DjStatus;
	bio: string;
	instagram: string;
	createdAt: number;
};

export const LAST_DJ_STORAGE_KEY = "gigblade.last-dj";

export const DJ_TEMPLATES = [
	{ id: "pista", label: "Modo claro" },
	{ id: "festival", label: "Modo oscuro" },
	{ id: "after", label: "Party" },
] as const;

export const TEMPLATE_BRAND_COLORS: Record<SiteTemplateId, string> = {
	pista: "#ffffff",
	festival: "#000000",
	after: "#e52b20",
};

export function djTemplateLabel(id: string) {
	return DJ_TEMPLATES.find((template) => template.id === id)?.label ?? id;
}

export const PLAN = {
	name: "Todo incluido",
	priceUsd: 65,
	cadence: "mes",
	includes: [
		"Página propia con plantilla para eventos",
		"Dominio propio (registrado y administrado por GigBlade)",
		"Hosting, seguridad y performance",
		"Panel para contenido",
	],
	domainNote:
		"El dominio queda a nombre de la plataforma. La renovación se cobra aparte, al costo real, sin margen.",
} as const;

export const CONCEPT = {
	what: "Cada DJ que se suma tiene su propia página en internet, con su propio nombre de dominio (por ejemplo djmarco.com), donde la gente puede ver su información y contactarlo. Todos los DJs comparten por detrás la misma base técnica: no hay que armar un sistema nuevo cada vez que entra un cliente.",
	problem:
		"Hoy un DJ que quiere verse profesional en internet tiene dos opciones: pagarle a alguien para que le arme una página desde cero (caro y lento), o quedarse dependiendo solo de Instagram (poco profesional, y sin control sobre su imagen). GigBlade es la tercera: página propia, dominio propio, sin entender tecnología.",
	how: [
		{
			id: "01",
			title: "Plan y dominio",
			detail: "Elige el plan todo incluido y un dominio propio.",
		},
		{
			id: "02",
			title: "Plantilla",
			detail: "Elige un diseño de plantilla ya armado.",
		},
		{
			id: "03",
			title: "Contenido",
			detail: "Carga fotos, biografía y redes sociales.",
		},
		{
			id: "04",
			title: "Página publicada",
			detail: "La página queda publicada en su dominio.",
		},
	],
	ops: "Todo el trabajo técnico — que la página funcione rápido, que esté segura, que el dominio esté activo — lo maneja la plataforma, no el DJ.",
	model: `US$ ${PLAN.priceUsd} al mes cubre absolutamente todo: la página, la seguridad y el hosting. El dominio queda a nombre de la plataforma y se cobra aparte, al costo real, sin margen.`,
	scale:
		"El costo de mantener la plataforma es prácticamente el mismo con 1 DJ o con 50. Cuantos más DJs se sumen, menos cuesta cada uno mantener esa base, y más queda de ganancia por cada suscripción nueva. Con pocos DJs activos ya se cubre el costo fijo.",
} as const;

const DAY = 86_400_000;
const NOW = Date.now();

export const GIGBLADE_DJS: GigbladeDj[] = [
	{
		slug: "marco",
		name: "DJ Marco",
		email: "marco@djmarco.com",
		domain: "djmarco.com",
		city: "San José",
		template: "pista",
		status: "active",
		bio: "Sets de club y after. Página lista para que las productoras te encuentren.",
		instagram: "@djmarco",
		createdAt: NOW - DAY * 48,
	},
	{
		slug: "luna",
		name: "Luna Set",
		email: "hola@lunaset.cr",
		domain: "lunaset.cr",
		city: "San José",
		template: "festival",
		status: "active",
		bio: "Melodic y downtempo. Un canal formal, sin DMs sueltos.",
		instagram: "@lunaset",
		createdAt: NOW - DAY * 21,
	},
	{
		slug: "nox",
		name: "Nox",
		email: "nox@gigblade.com",
		domain: "",
		city: "San José",
		template: "after",
		status: "active",
		bio: "Sets nocturnos para pistas que no cierran.",
		instagram: "@nox",
		createdAt: NOW - DAY * 9,
	},
	{
		slug: "sofia",
		name: "Sofía Beat",
		email: "sofia@sofiabeat.com",
		domain: "sofiabeat.com",
		city: "Heredia",
		template: "pista",
		status: "trialing",
		bio: "Trial del plan todo incluido. Cargando fotos y bio.",
		instagram: "@sofiabeat",
		createdAt: NOW - DAY * 3,
	},
	{
		slug: "vera",
		name: "Vera Pulse",
		email: "vera@verapulse.com",
		domain: "verapulse.com",
		city: "Cartago",
		template: "festival",
		status: "canceled",
		bio: "Página pausada. El dominio sigue administrado hasta el cierre del ciclo.",
		instagram: "@verapulse",
		createdAt: NOW - DAY * 72,
	},
];

export function djBySlug(slug: string) {
	return GIGBLADE_DJS.find((dj) => dj.slug === slug) ?? GIGBLADE_DJS[2];
}

export function djByArtistName(name: string | null) {
	if (!name) return null;
	const needle = name.trim().toLowerCase();
	return (
		GIGBLADE_DJS.find((dj) => dj.name.toLowerCase() === needle) ??
		GIGBLADE_DJS.find((dj) => dj.slug === needle) ??
		null
	);
}

export function gigbladeMarketingSiteUrl() {
	const configured = import.meta.env.VITE_GIGBLADE_SITE_URL?.replace(/\/$/, "");
	return configured || "http://localhost:3000";
}

export function djPreviewOrigin(slug: string) {
	const configured = import.meta.env.VITE_GIGBLADE_SITE_URL?.replace(
		/\/$/,
		"",
	);
	let port = "3000";
	if (configured) {
		try {
			const parsed = new URL(configured);
			if (parsed.port) port = parsed.port;
		} catch {
			// keep default local port
		}
	}
	return `http://${slug}.localhost:${port}`;
}

export function djIntendedDomain(dj: Pick<GigbladeDj, "domain">) {
	if (!dj.domain || dj.domain.includes("localhost")) return null;
	return dj.domain;
}

export function djPublicUrl(dj: Pick<GigbladeDj, "slug" | "domain">) {
	const publicDomain = djIntendedDomain(dj);
	if (!publicDomain) return null;
	return `https://${publicDomain}`;
}

export function djDomainLabel(dj: Pick<GigbladeDj, "domain">) {
	return djIntendedDomain(dj) ?? "Sin dominio asignado";
}

export function formatVisitCount(visitors: number) {
	return visitors === 1 ? "1 visitante" : `${visitors} visitantes`;
}

export function formatLastVisit(iso: string | null) {
	if (!iso) return "Sin visitas todavía";
	return new Date(iso).toLocaleString("es-CR", {
		dateStyle: "medium",
		timeStyle: "short",
	});
}

export function djInstagramUrl(dj: Pick<GigbladeDj, "instagram">) {
	return `https://instagram.com/${dj.instagram.replace(/^@/, "")}`;
}

export function djMailto(dj: Pick<GigbladeDj, "email">) {
	return `mailto:${dj.email}`;
}

export function payingDjCount() {
	return GIGBLADE_DJS.filter((dj) => dj.status === "active").length;
}

export function domainCount() {
	return GIGBLADE_DJS.length;
}

export function estimatedMrr() {
	return payingDjCount() * PLAN.priceUsd;
}

export function toCusProductStatus(status: DjStatus) {
	if (status === "trialing") return CusProductStatus.Trialing;
	if (status === "canceled") return CusProductStatus.Paused;
	return CusProductStatus.Active;
}
