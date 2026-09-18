import { useEffect, useMemo, useState } from "react";
import {
	GIGBLADE_DJS,
	type GigbladeDj,
	type SiteTemplateId,
} from "@/gigblade/concept";
import { fetchPlatformSites, type PlatformSite } from "@/gigblade/site-api";

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
		email: site.email || seed?.email || `${site.slug}@gigblade.dev`,
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
	const [sites, setSites] = useState<PlatformSite[] | null>(null);
	const [status, setStatus] = useState<"loading" | "ready" | "error">(
		"loading",
	);

	useEffect(() => {
		const controller = new AbortController();
		void fetchPlatformSites(controller.signal).then((next) => {
			if (controller.signal.aborted) return;
			if (!next) {
				setSites(null);
				setStatus("error");
				return;
			}
			setSites(next);
			setStatus("ready");
		});
		return () => controller.abort();
	}, []);

	const djs = useMemo(() => {
		if (status === "ready" && sites) return sites.map(gigbladeDjFromSite);
		if (status === "error") return GIGBLADE_DJS;
		return [];
	}, [sites, status]);

	const remove = (slug: string) => {
		setSites((current) => {
			const list =
				current ??
				djs.map((dj) => ({
					slug: dj.slug,
					displayName: dj.name,
					domain: dj.domain,
					preview: dj.domain.includes("localhost"),
					status:
						dj.status === "canceled"
							? ("suspended" as const)
							: ("active" as const),
					visits: 0,
					lastVisitedAt: null,
					email: dj.email,
				}));
			return list.filter((site) => site.slug !== slug);
		});
		setStatus("ready");
	};

	return { djs, sites, status, remove };
}
