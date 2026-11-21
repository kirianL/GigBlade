"use client";

import { useEffect, useState } from "react";
import {
	clearPanelAuthSession,
	clearPanelSignedOut,
	markPanelSignedOut,
	PANEL_SESSION_EVENT,
	readPanelAuthSession,
	setPanelCsrfToken,
	wasPanelSignedOut,
	writePanelAuthSession,
	type PanelAuthSession,
} from "@/panel/panel-session";
import {
	clearRemotePanelSession,
	loginPanelAccount,
	readPanelCookieSession,
} from "@/panel/site-api";

const ok = async <T,>(data: T) => ({ data, error: null as null });

function toAuthSession(session: PanelAuthSession) {
	return {
		user: {
			id: session.user.email,
			name: session.user.name,
			email: session.user.email,
			image: null,
			emailVerified: true,
			role: session.user.role,
			slug: session.user.slug,
		},
		session: {
			id: session.user.email,
			userId: session.user.email,
			expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
		},
	};
}

let sessionRevalidated = false;
let revalidatePromise: Promise<PanelAuthSession | null> | null = null;

/** Sesión recién validada en login: evita un segundo GET /session al entrar. */
export function markPanelSessionTrusted() {
	sessionRevalidated = true;
	revalidatePromise = null;
}

function revalidateSessionOnce(
	local: PanelAuthSession | null,
): Promise<PanelAuthSession | null> {
	if (revalidatePromise) return revalidatePromise;

	revalidatePromise = (async () => {
		try {
			if (wasPanelSignedOut()) return null;
			const remote = await readPanelCookieSession();
			if (wasPanelSignedOut()) return null;
			if (!remote) {
				clearPanelAuthSession();
				return null;
			}
			setPanelCsrfToken(remote.csrfToken);
			const next: PanelAuthSession = { user: remote.user };
			if (
				!local ||
				remote.user.email !== local.user.email ||
				remote.user.role !== local.user.role ||
				remote.user.name !== local.user.name ||
				remote.user.slug !== local.user.slug
			) {
				writePanelAuthSession(next);
			}
			return next;
		} catch (error: unknown) {
			const status =
				typeof error === "object" &&
				error !== null &&
				"status" in error &&
				typeof error.status === "number"
					? error.status
					: null;
			if (status === 401) {
				clearPanelAuthSession();
				return null;
			}
			return local;
		} finally {
			sessionRevalidated = true;
			revalidatePromise = null;
		}
	})();

	return revalidatePromise;
}

export const useSession = () => {
	const [stored, setStored] = useState<PanelAuthSession | null>(() =>
		readPanelAuthSession(),
	);
	const [isPending, setPending] = useState(() => {
		if (typeof window === "undefined") return true;
		return !sessionRevalidated;
	});

	useEffect(() => {
		let cancelled = false;
		const local = readPanelAuthSession();

		const onChange = () => setStored(readPanelAuthSession());
		window.addEventListener(PANEL_SESSION_EVENT, onChange);
		window.addEventListener("storage", onChange);

		if (sessionRevalidated) {
			return () => {
				window.removeEventListener(PANEL_SESSION_EVENT, onChange);
				window.removeEventListener("storage", onChange);
			};
		}

		void revalidateSessionOnce(local).then((resolved) => {
			if (cancelled || wasPanelSignedOut()) {
				if (!cancelled) {
					setStored(null);
					setPending(false);
				}
				return;
			}
			setStored(resolved);
			setPending(false);
		});

		return () => {
			cancelled = true;
			window.removeEventListener(PANEL_SESSION_EVENT, onChange);
			window.removeEventListener("storage", onChange);
		};
	}, []);

	const data = stored ? toAuthSession(stored) : null;

	return {
		data,
		isPending,
		isRefetching: false,
		error: null,
		refetch: async () => ({ data }),
	};
};

export const signIn = {
	email: async ({
		email,
		password,
	}: {
		email: string;
		password: string;
	}) => {
		try {
			const result = await loginPanelAccount({ email, password });
			const session: PanelAuthSession = { user: result.user };
			clearPanelSignedOut();
			setPanelCsrfToken(result.csrfToken);
			writePanelAuthSession(session);
			markPanelSessionTrusted();
			return { data: toAuthSession(session), error: null };
		} catch (error) {
			return {
				data: null,
				error: {
					message:
						error instanceof Error
							? error.message
							: "No se pudo entrar.",
				},
			};
		}
	},
};

export const authClient = {
	useSession,
	signIn,
	signOut: async () => {
		try {
			await clearRemotePanelSession();
		} finally {
			clearPanelAuthSession();
			markPanelSignedOut();
			sessionRevalidated = false;
			revalidatePromise = null;
		}
		return ok({});
	},
	getSession: async () => {
		const stored = readPanelAuthSession();
		return stored ? ok(toAuthSession(stored)) : { data: null, error: null };
	},
};
