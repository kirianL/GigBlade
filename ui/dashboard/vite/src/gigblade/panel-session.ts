export type PanelRole = "platform" | "dj";

export type PanelUser = {
	email: string;
	name: string;
	role: PanelRole;
	slug?: string;
};

export type PanelAuthSession = {
	token: string;
	user: PanelUser;
};

export const PANEL_SESSION_KEY = "gigblade.panel.session";
export const PANEL_SESSION_EVENT = "gigblade-panel-session";

function isUser(value: unknown): value is PanelUser {
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
		const row = parsed as Partial<PanelAuthSession>;
		if (typeof row.token !== "string" || !isUser(row.user)) return null;
		return { token: row.token, user: row.user };
	} catch {
		return null;
	}
}

export function writePanelAuthSession(session: PanelAuthSession) {
	window.localStorage.setItem(PANEL_SESSION_KEY, JSON.stringify(session));
	window.dispatchEvent(new Event(PANEL_SESSION_EVENT));
}

export function clearPanelAuthSession() {
	window.localStorage.removeItem(PANEL_SESSION_KEY);
	window.dispatchEvent(new Event(PANEL_SESSION_EVENT));
}

export function panelHomePath(user: PanelUser) {
	if (user.role === "dj" && user.slug) {
		return `/studio?dj=${encodeURIComponent(user.slug)}`;
	}
	return "/overview";
}
