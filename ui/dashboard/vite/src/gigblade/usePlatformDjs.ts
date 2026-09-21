import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
	GIGBLADE_DJS,
	type GigbladeDj,
	type SiteTemplateId,
} from "@/gigblade/concept";
import { readPanelAuthSession } from "@/gigblade/panel-session";
import { fetchPlatformSites, type PlatformSite } from "@/gigblade/site-api";

export const PLATFORM_SITES_QUERY_KEY = ["platform", "sites"] as const;

export function gigbladeDjFromSite(site: PlatformSite): GigbladeDj {
	const seed = GIGBLADE_DJS.find((dj) => dj.slug === site.slug);
	const status: GigbladeDj["status"] =
		site.status === "suspended"
			? "canceled"
			: seed?.status === "trialing"
				? "trialing"
				: "active";
	const template: SiteTemplateId = seed?.template ?? "after";

	return {
		slug: site.slug,
		name: site.displayName || seed?.name || site.slug,
		email: site.email || seed?.email || "",
		domain: site.domain,
		city: seed?.city ?? "",
		template,
		status,
		bio: seed?.bio ?? "",
		instagram: seed?.instagram ?? "",
		createdAt: seed?.createdAt ?? Date.now(),
	};
}

export function usePlatformDjs() {
	const queryClient = useQueryClient();
	const query = useQuery({
		queryKey: PLATFORM_SITES_QUERY_KEY,
		queryFn: ({ signal }) => fetchPlatformSites(signal),
		staleTime: 30_000,
		gcTime: 5 * 60_000,
		retry: 1,
		refetchOnMount: true,
		refetchOnWindowFocus: false,
	});

	const sites = query.data ?? null;
	const status: "loading" | "ready" | "error" = query.isPending
		? "loading"
		: query.isError || !sites
			? "error"
			: "ready";

	const djs = useMemo(() => {
		if (status === "ready" && sites) return sites.map(gigbladeDjFromSite);
		if (status === "error") {
			return readPanelAuthSession() ? [] : GIGBLADE_DJS;
		}
		return [];
	}, [sites, status]);

	const remove = (slug: string) => {
		queryClient.setQueryData<PlatformSite[] | null>(
			PLATFORM_SITES_QUERY_KEY,
			(current) => {
				const list =
					current ??
					djs.map((dj) => ({
						slug: dj.slug,
						displayName: dj.name,
						domain: dj.domain,
						preview: !dj.domain || dj.domain.includes("localhost"),
						status:
							dj.status === "canceled"
								? ("suspended" as const)
								: ("active" as const),
						visits: 0,
						lastVisitedAt: null,
						email: dj.email,
					}));
				return list.filter((site) => site.slug !== slug);
			},
		);
		void queryClient.invalidateQueries({ queryKey: ["platform", "site-health"] });
	};

	const add = (site: PlatformSite) => {
		queryClient.setQueryData<PlatformSite[] | null>(
			PLATFORM_SITES_QUERY_KEY,
			(current) => {
				const list = current ?? [];
				if (list.some((item) => item.slug === site.slug)) return list;
				return [...list, site].sort((a, b) => a.slug.localeCompare(b.slug));
			},
		);
		void queryClient.invalidateQueries({ queryKey: ["platform", "site-health"] });
	};

	return { djs, sites, status, remove, add };
}
