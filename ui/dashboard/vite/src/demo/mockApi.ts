import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import {
	demoApiKeys,
	demoCustomers,
	demoFeatures,
	demoMemberships,
	demoOrg,
	demoProductCounts,
	demoProducts,
} from "./mockData";

const json = (
	config: InternalAxiosRequestConfig,
	data: unknown,
	status = 200,
): AxiosResponse => ({
	data,
	status,
	statusText: status === 200 ? "OK" : "Error",
	headers: { "content-type": "application/json" },
	config,
});

const pathOf = (config: InternalAxiosRequestConfig) => {
	const raw = `${config.url ?? ""}`;
	try {
		if (raw.startsWith("http")) {
			return new URL(raw).pathname;
		}
	} catch {
		// fall through
	}
	return raw.split("?")[0];
};

export const resolveMock = (
	config: InternalAxiosRequestConfig,
): unknown => {
	const method = (config.method ?? "get").toLowerCase();
	const path = pathOf(config);

	if (path === "/organization" && method === "get") return demoOrg;
	if (path === "/v1/organization" && method === "get") return demoOrg;
	if (path === "/v1/organization/flags") {
		return {
			maintenanceModes: { analytics: { disableRevenueMetrics: false } },
		};
	}
	if (path === "/products/products") {
		return { products: demoProducts, groupToDefaults: {} };
	}
	if (path === "/products/product_counts") return demoProductCounts;
	if (path === "/products/features") return { features: demoFeatures };
	if (path === "/products/rewards") {
		return { rewards: [], rewardPrograms: [] };
	}
	if (path === "/dev/data") {
		return { api_keys: demoApiKeys, svix_dashboard_url: null };
	}
	if (path === "/query/event_names/list") {
		return { eventNames: [] };
	}
	if (path === "/v1/sandboxes.list") return { list: [] };
	if (path === "/organization/invites") return { invites: [] };
	if (path === "/organization/members") return demoMemberships;
	if (path === "/saved_views") return { views: [] };
	if (path === "/customers/all/search") {
		return { customers: demoCustomers, next_cursor: null };
	}
	if (path === "/customers/all/count") {
		return { totalCount: demoCustomers.length, approximate: false };
	}
	if (path === "/customers/all/full_customers") {
		return { fullCustomers: demoCustomers, next_cursor: null };
	}
	if (path.startsWith("/customers/") && path.endsWith("/schedule")) {
		return { schedule: null, entity_schedules: {} };
	}
	if (path.startsWith("/customers/") && method === "get") {
		const id = path.split("/")[2];
		const customer = demoCustomers.find(
			(c) => c.id === id || c.internal_id === id,
		);
		return {
			customer: customer
				? {
						...customer,
						entities: [],
						invoices: [],
						entitlements: [],
						subscriptions: [],
					}
				: null,
		};
	}
	if (path === "/v1/organization/stripe") return null;
	if (path.startsWith("/products/") && path.endsWith("/data")) {
		const id = path.split("/")[2];
		const product = demoProducts.find((p) => p.id === id) ?? demoProducts[0];
		return {
			product,
			catalogLicenses: [],
			variants: [],
			numVersions: 1,
			versionCounts: {
				1: demoProductCounts[id as keyof typeof demoProductCounts] ?? {
					active: 0,
					canceled: 0,
					custom: 0,
					trialing: 0,
				},
			},
		};
	}
	if (path.startsWith("/products/") && path.endsWith("/count")) {
		const id = path.split("/")[2];
		return demoProductCounts[id as keyof typeof demoProductCounts] ?? {
			active: 0,
			canceled: 0,
			custom: 0,
			trialing: 0,
			all: 0,
		};
	}

	if (method === "get") return {};
	return {};
};

export const mockAxiosAdapter: AxiosAdapter = async (config) => {
	return json(config, resolveMock(config));
};
