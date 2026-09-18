import { djPreviewOrigin } from "@/gigblade/concept";
import { readPanelAuthSession } from "@/gigblade/panel-session";

const FETCH_TIMEOUT_MS = 4000;

export type PublicSiteProfile = {
	displayName: string;
	tagline: string;
	city: string;
	bio: string;
	email?: string;
	links: {
		instagram?: string;
		tiktok?: string;
		youtube?: string;
		facebook?: string;
		x?: string;
		soundcloud?: string;
		spotify?: string;
	};
	brandColor?: string;
	photos?: string[];
	heroPhoto?: string;
	heroPosition?: "center" | "top" | "bottom" | "left" | "right";
	events?: Array<{
		date: string;
		venue: string;
		location: string;
		ticketUrl?: string;
	}>;
	hiddenSections?: Array<
		"agenda" | "bio" | "enlaces" | "sets" | "contacto"
	>;
	mixes?: Array<{
		title: string;
		url: string;
		platform: "youtube" | "soundcloud";
	}>;
};

export type PublicSite = {
	slug: string;
	domain: string;
	templateId: "pista" | "festival" | "after";
	appearance: "light" | "dark" | "party";
	profile: PublicSiteProfile;
};

export type SiteContentPatch = {
	templateId: PublicSite["templateId"];
	displayName?: string;
	tagline?: string;
	city?: string;
	bio?: string;
	email?: string;
	brandColor?: string;
	photos?: string[];
	heroPosition?: PublicSiteProfile["heroPosition"];
	events?: PublicSiteProfile["events"];
	hiddenSections?: PublicSiteProfile["hiddenSections"];
	links?: PublicSiteProfile["links"];
	mixes?: Array<{
		title: string;
		url: string;
	}>;
};

async function readJson(response: Response) {
	return response.json().catch(() => null);
}

function withTimeout(parent?: AbortSignal, timeoutMs = FETCH_TIMEOUT_MS) {
	const controller = new AbortController();
	const timer = window.setTimeout(() => controller.abort(), timeoutMs);
	parent?.addEventListener("abort", () => controller.abort(), { once: true });
	return {
		signal: controller.signal,
		cancel: () => window.clearTimeout(timer),
	};
}

function siteOrigin() {
	const configured = import.meta.env.VITE_GIGBLADE_SITE_URL?.replace(/\/$/, "");
	return configured || "http://localhost:3000";
}

function tenantApi(slug: string, path = "/api/tenant") {
	const url = new URL(path, `${siteOrigin()}/`);
	url.searchParams.set("slug", slug);
	return url.toString();
}

export function publicSiteAssetUrl(slug: string, url: string) {
	return url.startsWith("/") ? `${djPreviewOrigin(slug)}${url}` : url;
}

function platformApiOrigin() {
	return siteOrigin();
}

export type SiteVisitStats = {
	uniqueVisitors: number;
	month: string | null;
	lastVisitedAt: string | null;
	source?: "preview" | "cloudflare";
};

export type PlatformSite = {
	slug: string;
	displayName: string;
	domain: string;
	preview: boolean;
	status: "active" | "suspended";
	visits: number;
	lastVisitedAt: string | null;
	email?: string;
};

export async function fetchPublicSite(
	slug: string,
	signal?: AbortSignal,
): Promise<PublicSite | null> {
	const timeout = withTimeout(signal);
	try {
		const response = await fetch(tenantApi(slug), {
			signal: timeout.signal,
		});
		if (!response.ok) return null;
		return (await readJson(response)) as PublicSite;
	} catch {
		return null;
	} finally {
		timeout.cancel();
	}
}

export async function savePublicSite(
	slug: string,
	input: SiteContentPatch,
	signal?: AbortSignal,
): Promise<PublicSite> {
	const timeout = withTimeout(signal);
	try {
		const session = readPanelAuthSession();
		const response = await fetch(tenantApi(slug), {
			method: "PATCH",
			headers: {
				"content-type": "application/json",
				...(session?.token ? { authorization: `Bearer ${session.token}` } : {}),
			},
			body: JSON.stringify(input),
			signal: timeout.signal,
		});
		const body = await readJson(response);
		if (!response.ok) {
			throw new Error(body?.message || "No se pudo publicar el contenido.");
		}
		return body as PublicSite;
	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") {
			throw new Error("La API del sitio no respondió.");
		}
		if (error instanceof Error && error.name !== "TypeError") {
			throw error;
		}
		throw new Error("No se pudo publicar el contenido.");
	} finally {
		timeout.cancel();
	}
}

export async function fetchSiteVisits(
	slug: string,
	signal?: AbortSignal,
): Promise<SiteVisitStats | null> {
	const timeout = withTimeout(signal);
	try {
		const response = await fetch(tenantApi(slug, "/api/site-visit"), {
			signal: timeout.signal,
		});
		if (!response.ok) return null;
		const body = (await readJson(response)) as
			| (SiteVisitStats & { views?: number })
			| null;
		const uniqueVisitors =
			typeof body?.uniqueVisitors === "number"
				? body.uniqueVisitors
				: typeof body?.views === "number"
					? body.views
					: null;
		if (uniqueVisitors === null) return null;
		return {
			uniqueVisitors,
			month: typeof body?.month === "string" ? body.month : null,
			lastVisitedAt:
				typeof body?.lastVisitedAt === "string" ? body.lastVisitedAt : null,
			source: body?.source === "cloudflare" ? "cloudflare" : "preview",
		};
	} catch {
		return null;
	} finally {
		timeout.cancel();
	}
}

export async function fetchPlatformSites(
	signal?: AbortSignal,
): Promise<PlatformSite[] | null> {
	const timeout = withTimeout(signal);
	try {
		const session = readPanelAuthSession();
		const headers = new Headers();
		if (session?.token) {
			headers.set("authorization", `Bearer ${session.token}`);
		}
		const response = await fetch(`${platformApiOrigin()}/api/platform/sites`, {
			headers,
			signal: timeout.signal,
		});
		if (!response.ok) return null;
		const body = (await readJson(response)) as { sites?: PlatformSite[] } | null;
		return Array.isArray(body?.sites) ? body.sites : null;
	} catch {
		return null;
	} finally {
		timeout.cancel();
	}
}

export type PanelUser = {
	email: string;
	name: string;
	role: "platform" | "dj";
	slug?: string;
};

export type PanelLoginResult = {
	token: string;
	user: PanelUser;
};

export type GeneratedDjPassword = {
	email: string;
	name: string;
	slug: string;
	password: string;
};

async function panelFetch(
	path: string,
	init: RequestInit & { token?: string; timeoutMs?: number },
) {
	const timeout = withTimeout(undefined, init.timeoutMs);
	try {
		const headers = new Headers(init.headers);
		if (
			!headers.has("content-type") &&
			init.body &&
			!(init.body instanceof FormData)
		) {
			headers.set("content-type", "application/json");
		}
		if (init.token) {
			headers.set("authorization", `Bearer ${init.token}`);
		}
		const response = await fetch(`${platformApiOrigin()}${path}`, {
			...init,
			headers,
			signal: timeout.signal,
		});
		const body = await readJson(response);
		if (!response.ok) {
			throw new Error(body?.message || "No se pudo completar el acceso.");
		}
		return body;
	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") {
			throw new Error(
				"La API del sitio no respondió.",
			);
		}
		throw error;
	} finally {
		timeout.cancel();
	}
}

export async function loginPanelAccount(input: {
	email: string;
	password: string;
}): Promise<PanelLoginResult> {
	const body = (await panelFetch("/api/panel/login", {
		method: "POST",
		body: JSON.stringify(input),
		timeoutMs: 8000,
	})) as PanelLoginResult;
	if (!body?.token || !body.user?.email) {
		throw new Error("No se pudo entrar.");
	}
	return body;
}

export async function readPanelAccount(token: string): Promise<PanelUser> {
	const body = (await panelFetch("/api/panel/session", {
		method: "GET",
		token,
		timeoutMs: 8000,
	})) as { user?: PanelUser };
	if (!body?.user?.email) {
		throw new Error("La sesión no es válida.");
	}
	return body.user;
}

export async function generateDjPassword(input: {
	slug: string;
	email: string;
	name: string;
	token: string;
}): Promise<GeneratedDjPassword> {
	const body = (await panelFetch("/api/panel/password", {
		method: "POST",
		token: input.token,
		body: JSON.stringify({
			slug: input.slug,
			email: input.email,
			name: input.name,
		}),
		timeoutMs: 8000,
	})) as GeneratedDjPassword;
	if (!body?.password || !body.email) {
		throw new Error("No se pudo generar la contraseña.");
	}
	return body;
}

export async function deleteDj(input: {
	slug: string;
	token: string;
}): Promise<{ slug: string }> {
	const body = (await panelFetch(
		`/api/platform/sites?slug=${encodeURIComponent(input.slug)}`,
		{
			method: "DELETE",
			token: input.token,
			timeoutMs: 15000,
		},
	)) as { slug?: string };
	if (!body?.slug) {
		throw new Error("No se pudo eliminar el DJ.");
	}
	return { slug: body.slug };
}

export async function uploadSitePhoto(input: {
	slug: string;
	file: File;
	token: string;
}): Promise<string> {
	const formData = new FormData();
	formData.set("slug", input.slug);
	formData.set("file", input.file);
	const body = (await panelFetch("/api/panel/site-photo", {
		method: "POST",
		token: input.token,
		body: formData,
		timeoutMs: 30000,
	})) as { url?: string };
	if (!body.url) throw new Error("No se pudo subir la foto.");
	return body.url;
}
