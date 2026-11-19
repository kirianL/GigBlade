"use client";

import type { QueryClient } from "@tanstack/react-query";
import { readPanelAuthSession } from "@/panel/panel-session";
import { PLATFORM_REFERRALS_QUERY_KEY } from "@/panel/platform-referrals-query";
import {
	fetchPlatformDomains,
	fetchPlatformReferrals,
	fetchPlatformSiteHealth,
	fetchPlatformSites,
	fetchPlatformWaitlist,
} from "@/panel/site-api";
import { PLATFORM_SITES_QUERY_KEY } from "@/panel/usePlatformDjs";
import { PLATFORM_DOMAINS_QUERY_KEY } from "@/panel/usePlatformDomains";

export function prefetchPanelRoute(pathname: string, queryClient: QueryClient) {
	const session = readPanelAuthSession();
	if (session?.user.role !== "platform") return;

	if (
		pathname === "/overview" ||
		pathname === "/djs" ||
		pathname === "/plan" ||
		pathname.startsWith("/studio")
	) {
		void queryClient.prefetchQuery({
			queryKey: PLATFORM_SITES_QUERY_KEY,
			queryFn: ({ signal }) => fetchPlatformSites(signal),
			staleTime: 30_000,
		});
	}

	if (pathname === "/domains") {
		void queryClient.prefetchQuery({
			queryKey: PLATFORM_DOMAINS_QUERY_KEY,
			queryFn: () => fetchPlatformDomains(session.token),
			staleTime: 60_000,
		});
	}

	if (pathname === "/health") {
		void queryClient.prefetchQuery({
			queryKey: ["platform", "site-health"],
			queryFn: ({ signal }) => fetchPlatformSiteHealth(signal),
			staleTime: 30_000,
		});
	}

	if (pathname === "/lista") {
		void queryClient.prefetchQuery({
			queryKey: ["platform", "waitlist"],
			queryFn: ({ signal }) => fetchPlatformWaitlist(signal),
			staleTime: 30_000,
		});
	}

	if (pathname === "/referidos" || pathname === "/distribucion") {
		void queryClient.prefetchQuery({
			queryKey: PLATFORM_REFERRALS_QUERY_KEY,
			queryFn: ({ signal }) => fetchPlatformReferrals(signal),
			staleTime: 15_000,
		});
	}
}

export function prefetchHomePanelRoute(
	role: string | undefined,
	queryClient: QueryClient,
) {
	if (role === "platform") {
		prefetchPanelRoute("/overview", queryClient);
	}
}
