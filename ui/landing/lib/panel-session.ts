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

export function panelHomePath(user: PanelUser) {
	if (user.role === "dj" && user.slug) {
		return `/studio?dj=${encodeURIComponent(user.slug)}`;
	}
	return "/overview";
}

export function readPanelAuthSession(): PanelAuthSession | null {
	if (typeof window === "undefined") return null;
	try {
		const parsed = JSON.parse(
			window.localStorage.getItem(PANEL_SESSION_KEY) ?? "",
		) as unknown;
		if (typeof parsed !== "object" || parsed === null) return null;
		const row = parsed as Record<string, unknown>;
		const user = row.user as Partial<PanelUser> | undefined;
		if (
			typeof user !== "object" ||
			user === null ||
			typeof user.email !== "string" ||
			typeof user.name !== "string" ||
			(user.role !== "platform" && user.role !== "dj")
		) {
			return null;
		}
		const clean: PanelAuthSession = {
			user: {
				email: user.email,
				name: user.name,
				role: user.role,
				...(typeof user.slug === "string" ? { slug: user.slug } : {}),
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
}

export function clearPanelAuthSession() {
	window.localStorage.removeItem(PANEL_SESSION_KEY);
}
