import type { QueryClient } from "@tanstack/react-query";
import { fetchPlatformReferrals } from "@/gigblade/site-api";

/** Referidos y Finanzas comparten la misma fuente de datos del panel. */
export const PLATFORM_REFERRALS_QUERY_KEY = ["platform", "referrals"] as const;

export function prefetchPlatformReferralsQuery(queryClient: QueryClient) {
	void queryClient.prefetchQuery({
		queryKey: PLATFORM_REFERRALS_QUERY_KEY,
		queryFn: ({ signal }) => fetchPlatformReferrals(signal),
		staleTime: 30_000,
	});
}
