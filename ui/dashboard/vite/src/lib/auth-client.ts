import { useEffect, useState } from "react";
import {
	DEMO_ORG_LIST_ITEM,
	DEMO_SESSION,
	DEMO_USER,
} from "@/demo/mockData";
import {
	clearPanelAuthSession,
	isUser,
	PANEL_SESSION_EVENT,
	readPanelAuthSession,
	writePanelAuthSession,
	type PanelAuthSession,
	type PanelUser,
} from "@/gigblade/panel-session";
import {
	clearRemotePanelSession,
	loginPanelAccount,
	readPanelAccount,
	readPanelCookieSession,
} from "@/gigblade/site-api";

const ok = async <T,>(data: T) => ({ data, error: null as null });

function toAuthSession(session: PanelAuthSession) {
	return {
		user: {
			id: session.user.email,
			name: session.user.name,
			email: session.user.email,
			image: null,
			emailVerified: true,
			createdAt: DEMO_USER.createdAt,
			updatedAt: new Date(),
			role: session.user.role,
			slug: session.user.slug,
		},
		session: {
			id: session.token.slice(0, 16),
			userId: session.user.email,
			activeOrganizationId: DEMO_ORG_LIST_ITEM.id,
			expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
		},
	};
}

let sessionRevalidated = false;
let revalidatePromise: Promise<PanelAuthSession | null> | null = null;

/** Sesión recién validada en login o token: evita un segundo GET /session al entrar. */
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
			if (!local?.token) {
				const remote = await readPanelCookieSession();
				if (remote) writePanelAuthSession(remote);
				return remote;
			}
			const user = await readPanelAccount(local.token);
			const next = { token: local.token, user };
			if (
				user.email !== local.user.email ||
				user.role !== local.user.role ||
				user.name !== local.user.name ||
				user.slug !== local.user.slug
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
			setPending(false);
			return () => {
				window.removeEventListener(PANEL_SESSION_EVENT, onChange);
				window.removeEventListener("storage", onChange);
			};
		}

		void revalidateSessionOnce(local).then((resolved) => {
			if (cancelled) return;
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

export const useListOrganizations = () => ({
	data: [DEMO_ORG_LIST_ITEM],
	isPending: false,
});

export const signIn = {
	email: async ({
		email,
		password,
	}: {
		email: string;
		password: string;
	}) => {
		try {
			const session = await loginPanelAccount({ email, password });
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
	emailOtp: () => ok(DEMO_SESSION),
};

const organization = {
	list: () => ok([DEMO_ORG_LIST_ITEM]),
	setActive: () => ok({}),
	create: () => ok(DEMO_ORG_LIST_ITEM),
	update: () => ok(DEMO_ORG_LIST_ITEM),
	delete: () => ok({}),
	inviteMember: () => ok({}),
	removeMember: () => ok({}),
	updateMemberRole: () => ok({}),
	cancelInvitation: () => ok({}),
	acceptInvitation: () => ok({}),
	rejectInvitation: () => ok({}),
};

export const authClient = {
	useSession,
	useListOrganizations,
	useActiveOrganization: () => ({
		data: DEMO_ORG_LIST_ITEM,
		isPending: false,
	}),
	useListPasskeys: () => ({ data: [] as unknown[] }),
	organization,
	signIn,
	signOut: async () => {
		clearPanelAuthSession();
		void clearRemotePanelSession();
		return ok({});
	},
	emailOtp: {
		sendVerificationOtp: () => ok({}),
	},
	passkey: {
		addPasskey: () => ok({}),
		deletePasskey: () => ok({}),
	},
	updateUser: () => ok(DEMO_USER),
	deleteUser: () => ok({}),
	getSession: async () => {
		const stored = readPanelAuthSession();
		return stored ? ok(toAuthSession(stored)) : { data: null, error: null };
	},
	admin: {
		stopImpersonating: () => ok({}),
	},
};

export async function acceptPanelToken(token: string, knownUser?: PanelUser) {
	if (knownUser && isUser(knownUser)) {
		const session = { token, user: knownUser };
		writePanelAuthSession(session);
		markPanelSessionTrusted();
		return session;
	}
	const user = await readPanelAccount(token);
	const session = { token, user };
	writePanelAuthSession(session);
	markPanelSessionTrusted();
	return session;
}
