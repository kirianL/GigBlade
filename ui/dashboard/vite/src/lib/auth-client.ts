import {
	DEMO_ORG_LIST_ITEM,
	DEMO_SESSION,
	DEMO_USER,
} from "@/demo/mockData";

const ok = async <T,>(data: T) => ({ data, error: null as null });

export const useSession = () => ({
	data: DEMO_SESSION,
	isPending: false,
	isRefetching: false,
	error: null,
	refetch: async () => ({ data: DEMO_SESSION }),
});

export const useListOrganizations = () => ({
	data: [DEMO_ORG_LIST_ITEM],
	isPending: false,
});

export const signIn = {
	email: () => ok(DEMO_SESSION),
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
	signOut: () => ok({}),
	emailOtp: {
		sendVerificationOtp: () => ok({}),
	},
	passkey: {
		addPasskey: () => ok({}),
		deletePasskey: () => ok({}),
	},
	updateUser: () => ok(DEMO_USER),
	deleteUser: () => ok({}),
	getSession: () => ok(DEMO_SESSION),
	admin: {
		stopImpersonating: () => ok({}),
	},
};
