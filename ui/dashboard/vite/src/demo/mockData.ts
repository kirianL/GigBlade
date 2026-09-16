import {
	AppEnv,
	FeatureType,
	FeatureUsageType,
	ProductItemInterval,
	ProductItemType,
} from "@autumn/shared";

export const DEMO_USER = {
	id: "user_demo",
	name: "Kirian",
	email: "hola@gigblade.com",
	image: null,
	emailVerified: true,
	createdAt: new Date("2025-11-04T00:00:00.000Z"),
	updatedAt: new Date("2026-09-12T00:00:00.000Z"),
};

export const DEMO_ORG_LIST_ITEM = {
	id: "org_demo",
	name: "GigBlade",
	slug: "gigblade",
	createdAt: new Date("2025-11-04T00:00:00.000Z"),
};

export const DEMO_SESSION = {
	user: DEMO_USER,
	session: {
		id: "ses_demo",
		userId: DEMO_USER.id,
		activeOrganizationId: DEMO_ORG_LIST_ITEM.id,
		expiresAt: new Date("2027-01-01T00:00:00.000Z"),
	},
};

const now = Date.UTC(2026, 8, 12);

export const demoOrg = {
	id: DEMO_ORG_LIST_ITEM.id,
	name: DEMO_ORG_LIST_ITEM.name,
	logo: null,
	slug: DEMO_ORG_LIST_ITEM.slug,
	success_url: "https://gigblade.com",
	default_currency: "usd",
	created_at: now,
	test_pkey: "gb_pk_test_demo",
	live_pkey: "gb_pk_live_demo",
	stripe_connection: "connected",
	stripe_secret_key_connected: true,
	stripe_oauth_connected: true,
	master: null,
	through_master: false,
	onboarded: true,
	deployed: true,
	config: {
		usage_alerts: [],
		sandbox_usage_alerts: [],
		bill_upgrade_immediately: true,
		convert_to_charge_automatically: true,
		anchor_start_of_month: false,
		cancel_on_past_due: false,
		prorate_unused: true,
		checkout_on_failed_payment: true,
		reverse_deduction_order: false,
		include_past_due: true,
		block_overdue_entitlements: false,
		sync_status: true,
		merge_billing_cycles: true,
		multiple_trials: false,
		allow_paid_default: false,
		cache_customer: false,
		invoice_memos: false,
		entity_product: false,
		void_invoices_on_subscription_deletion: false,
		default_applies_to_entities: false,
		disable_overage_billing: false,
		disable_stripe_writes: false,
		disabled_auto_topup: false,
		persist_free_overage: false,
		dryrun_autotopups: false,
		forward_customer_metadata: false,
		automatic_tax: false,
		multi_currency: false,
	},
	idempotency_config: null,
	custom_buttons: [],
	redis_config: null,
	processor_configs: {
		vercel: { connected: false },
		revenuecat: { connected: false },
	},
};

export const demoFeatures = [
	{
		internal_id: "feat_dominio",
		org_id: DEMO_ORG_LIST_ITEM.id,
		created_at: now,
		env: AppEnv.Live,
		id: "dominio",
		name: "Dominio propio",
		type: FeatureType.Metered,
		config: { usage_type: FeatureUsageType.Single },
		display: { singular: "dominio", plural: "dominios" },
		archived: false,
		event_names: ["dominio"],
	},
	{
		internal_id: "feat_booking",
		org_id: DEMO_ORG_LIST_ITEM.id,
		created_at: now,
		env: AppEnv.Live,
		id: "booking",
		name: "Solicitudes de booking",
		type: FeatureType.Metered,
		config: { usage_type: FeatureUsageType.Single },
		display: { singular: "solicitud", plural: "solicitudes" },
		archived: false,
		event_names: ["booking"],
	},
	{
		internal_id: "feat_hosting",
		org_id: DEMO_ORG_LIST_ITEM.id,
		created_at: now,
		env: AppEnv.Live,
		id: "hosting",
		name: "Hosting en cache",
		type: FeatureType.Metered,
		config: { usage_type: FeatureUsageType.Continuous },
		display: { singular: "página", plural: "páginas" },
		archived: false,
		event_names: [],
	},
];

export const demoProducts = [
	{
		internal_id: "prod_all_inclusive",
		id: "all_inclusive",
		name: "Todo incluido",
		description: "Hosting, seguridad, página y dominio. US$ 65 al mes.",
		is_add_on: false,
		is_default: true,
		version: 1,
		active: true,
		group: "plans",
		env: AppEnv.Live,
		free_trial: null,
		items: [
			{
				type: ProductItemType.Price,
				price: 65,
				interval: ProductItemInterval.Month,
			},
			{
				type: ProductItemType.Feature,
				feature_id: "dominio",
				included_usage: 1,
			},
			{
				type: ProductItemType.Feature,
				feature_id: "booking",
				included_usage: 200,
				interval: ProductItemInterval.Month,
			},
			{
				type: ProductItemType.Feature,
				feature_id: "hosting",
				included_usage: 1,
			},
		],
		created_at: now,
		archived: false,
		version_slug: "v1",
		licenses: [],
		parent_plan_licenses: [],
	},
];

const emptyCounts = {
	active: 0,
	canceled: 0,
	custom: 0,
	trialing: 0,
	all: 0,
};

export const demoProductCounts = {
	all_inclusive: {
		...emptyCounts,
		active: 3,
		trialing: 1,
		canceled: 1,
		all: 5,
	},
};

export const demoCustomers = [
	{
		id: "cus_marco",
		name: "DJ Marco",
		email: "marco@djmarco.com",
		internal_id: "cus_marco_int",
		org_id: DEMO_ORG_LIST_ITEM.id,
		created_at: now - 86400000 * 48,
		env: AppEnv.Live,
		processor: { type: "stripe", id: "cus_stripe_marco" },
		customer_products: [
			{
				id: "cp_marco",
				status: "active",
				product: {
					id: "all_inclusive",
					name: "Todo incluido",
					is_add_on: false,
				},
			},
		],
	},
	{
		id: "cus_luna",
		name: "Luna Set",
		email: "hola@lunaset.cr",
		internal_id: "cus_luna_int",
		org_id: DEMO_ORG_LIST_ITEM.id,
		created_at: now - 86400000 * 21,
		env: AppEnv.Live,
		processor: { type: "stripe", id: "cus_stripe_luna" },
		customer_products: [
			{
				id: "cp_luna",
				status: "active",
				product: {
					id: "all_inclusive",
					name: "Todo incluido",
					is_add_on: false,
				},
			},
		],
	},
	{
		id: "cus_nox",
		name: "Nox",
		email: "nox@gigblade.com",
		internal_id: "cus_nox_int",
		org_id: DEMO_ORG_LIST_ITEM.id,
		created_at: now - 86400000 * 9,
		env: AppEnv.Live,
		processor: { type: "stripe", id: "cus_stripe_nox" },
		customer_products: [
			{
				id: "cp_nox",
				status: "active",
				product: {
					id: "all_inclusive",
					name: "Todo incluido",
					is_add_on: false,
				},
			},
		],
	},
	{
		id: "cus_sofia",
		name: "Sofía Beat",
		email: "sofia@sofiabeat.com",
		internal_id: "cus_sofia_int",
		org_id: DEMO_ORG_LIST_ITEM.id,
		created_at: now - 86400000 * 3,
		env: AppEnv.Live,
		processor: { type: "stripe", id: "cus_stripe_sofia" },
		customer_products: [
			{
				id: "cp_sofia",
				status: "trialing",
				product: {
					id: "all_inclusive",
					name: "Todo incluido",
					is_add_on: false,
				},
			},
		],
	},
	{
		id: "cus_vera",
		name: "Vera Pulse",
		email: "vera@verapulse.com",
		internal_id: "cus_vera_int",
		org_id: DEMO_ORG_LIST_ITEM.id,
		created_at: now - 86400000 * 72,
		env: AppEnv.Live,
		processor: { type: "stripe", id: "cus_stripe_vera" },
		customer_products: [
			{
				id: "cp_vera",
				status: "canceled",
				product: {
					id: "all_inclusive",
					name: "Todo incluido",
					is_add_on: false,
				},
			},
		],
	},
];

export const demoApiKeys = [
	{
		id: "key_demo",
		org_id: DEMO_ORG_LIST_ITEM.id,
		user_id: DEMO_USER.id,
		name: "Panel",
		prefix: "gb_sk_live_****demo",
		created_at: now,
		env: AppEnv.Live,
		hashed_key: "hashed",
		meta: { author: DEMO_USER.email, created_via: "dashboard" },
		scopes: ["*"],
	},
];

export const demoMemberships = {
	memberships: [
		{
			user: DEMO_USER,
			member: {
				id: "mem_demo",
				organizationId: DEMO_ORG_LIST_ITEM.id,
				userId: DEMO_USER.id,
				role: "owner",
				createdAt: DEMO_USER.createdAt,
			},
		},
	],
	invites: [],
};
