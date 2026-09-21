import { useEffect, useState } from "react";
import {
	DEMO_ORG_LIST_ITEM,
	DEMO_SESSION,
	DEMO_USER,
} from "@/demo/mockData";
import {
	clearPanelAuthSession,
	PANEL_SESSION_EVENT,
	readPanelAuthSession,
	writePanelAuthSession,
	type PanelAuthSession,
} from "@/gigblade/panel-session";
import { loginPanelAccount, readPanelAccount } from "@/gigblade/site-api";

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

export const useSession = () => {
	const [stored, setStored] = useState<PanelAuthSession | null>(() =>
		readPanelAuthSession(),
	);
	const [isPending, setPending] = useState(() => {
		if (typeof window === "undefined") return true;
		return !sessionRevalidated && readPanelAuthSession() !== null;
	});

	useEffect(() => {
		let cancelled = false;
		const local = readPanelAuthSession();

		const onChange = () => setStored(readPanelAuthSession());
		window.addEventListener(PANEL_SESSION_EVENT, onChange);
		window.addEventListener("storage", onChange);

		if (!local?.token || sessionRevalidated) {
			setPending(false);
			return () => {
				window.removeEventListener(PANEL_SESSION_EVENT, onChange);
				window.removeEventListener("storage", onChange);
			};
		}

		void readPanelAccount(local.token)
			.then((user) => {
				if (cancelled) return;
				const next = { token: local.token, user };
				if (
					user.email !== local.user.email ||
					user.role !== local.user.role ||
					user.name !== local.user.name ||
					user.slug !== local.user.slug
				) {
					writePanelAuthSession(next);
				}
				setStored(next);
				setPending(false);
				sessionRevalidated = true;
			})
			.catch((error: unknown) => {
				if (cancelled) return;
				const status =
					typeof error === "object" &&
					error !== null &&
					"status" in error &&
					typeof error.status === "number"
						? error.status
						: null;
				if (status === 401) {
					clearPanelAuthSession();
					setStored(null);
				}
				setPending(false);
				sessionRevalidated = true;
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

export async function acceptPanelToken(token: string) {
	const user = await readPanelAccount(token);
	const session = { token, user };
	writePanelAuthSession(session);
	return session;
}
