export type PanelRole = "platform" | "dj";

export type PanelUser = {
	email: string;
	name: string;
	role: PanelRole;
	slug?: string;
};

export type PanelAuthSession = {
	user: PanelUser;
};

export const PANEL_SESSION_KEY = "gigblade.panel.session";
export const PANEL_SESSION_EVENT = "gigblade-panel-session";
const PANEL_SIGNED_OUT_KEY = "gigblade.panel.signed-out";
const PANEL_CSRF_COOKIE = "gigblade_csrf";

let memoryCsrfToken: string | null = null;

export function setPanelCsrfToken(token: string | null) {
	memoryCsrfToken = token;
}

export function getPanelCsrfToken(): string | null {
	if (memoryCsrfToken) return memoryCsrfToken;
	if (typeof document === "undefined") return null;
	for (const part of document.cookie.split(";")) {
		const eq = part.indexOf("=");
		if (eq === -1) continue;
		const key = part.slice(0, eq).trim();
		if (key !== PANEL_CSRF_COOKIE) continue;
		const raw = part.slice(eq + 1).trim();
		if (!raw) return null;
		try {
			return decodeURIComponent(raw);
		} catch {
			return raw;
		}
	}
	return null;
}

export function markPanelSignedOut() {
	if (typeof window === "undefined") return;
	window.sessionStorage.setItem(PANEL_SIGNED_OUT_KEY, "1");
}

export function clearPanelSignedOut() {
	if (typeof window === "undefined") return;
	window.sessionStorage.removeItem(PANEL_SIGNED_OUT_KEY);
}

export function wasPanelSignedOut() {
	if (typeof window === "undefined") return false;
	return window.sessionStorage.getItem(PANEL_SIGNED_OUT_KEY) === "1";
}

export function isUser(value: unknown): value is PanelUser {
	if (typeof value !== "object" || value === null) return false;
	const row = value as Partial<PanelUser>;
	return (
		typeof row.email === "string" &&
		typeof row.name === "string" &&
		(row.role === "platform" || row.role === "dj")
	);
}

export function readPanelAuthSession(): PanelAuthSession | null {
	if (typeof window === "undefined") return null;
	try {
		const parsed = JSON.parse(
			window.localStorage.getItem(PANEL_SESSION_KEY) ?? "",
		) as unknown;
		if (typeof parsed !== "object" || parsed === null) return null;
		const row = parsed as Record<string, unknown>;
		if (!isUser(row.user)) return null;
		const clean: PanelAuthSession = {
			user: {
				email: row.user.email,
				name: row.user.name,
				role: row.user.role,
				...(typeof row.user.slug === "string" ? { slug: row.user.slug } : {}),
			},
		};
		if ("token" in row) {
			window.localStorage.setItem(PANEL_SESSION_KEY, JSON.stringify(clean));
		}
		return clean;
	} catch {
		return null;
	}
}

export function writePanelAuthSession(session: PanelAuthSession) {
	window.localStorage.setItem(
		PANEL_SESSION_KEY,
		JSON.stringify({ user: session.user }),
	);
	window.dispatchEvent(new Event(PANEL_SESSION_EVENT));
}

export const PERSISTED_QUERY_CACHE_KEY = "gigblade.query-cache.v1";

export function clearPanelAuthSession() {
	setPanelCsrfToken(null);
	window.localStorage.removeItem(PANEL_SESSION_KEY);
	window.localStorage.removeItem(PERSISTED_QUERY_CACHE_KEY);
	window.dispatchEvent(new Event(PANEL_SESSION_EVENT));
}

export function panelHomePath(user: PanelUser) {
	if (user.role === "dj" && user.slug) {
		return `/studio?dj=${encodeURIComponent(user.slug)}`;
	}
	return "/overview";
}
