import type { QueryClient } from "@tanstack/react-query";
import {
	fetchPlatformDomains,
	fetchPlatformSiteHealth,
	fetchPlatformSites,
	fetchPlatformWaitlist,
	fetchPublicSite,
} from "@/gigblade/site-api";
import { prefetchPlatformReferralsQuery } from "@/gigblade/platform-referrals-query";
import { PLATFORM_SITES_QUERY_KEY } from "@/gigblade/usePlatformDjs";
import { PLATFORM_DOMAINS_QUERY_KEY } from "@/gigblade/usePlatformDomains";
import { readPanelAuthSession } from "@/gigblade/panel-session";

// Módulos que carga cada ruta. Al hacer hover en el enlace del sidebar
// arrancamos el `import()` para que el chunk esté listo antes del click.
const ROUTE_IMPORTS: Record<string, () => Promise<unknown>> = {
	"/overview": () => import("@/gigblade/PlatformOverview"),
	"/djs": () => import("@/gigblade/PlatformDjs"),
	"/referidos": () => import("@/gigblade/PlatformReferrals"),
	"/distribucion": () => import("@/gigblade/PlatformFinance"),
	"/lista": () => import("@/gigblade/PlatformWaitlist"),
	"/domains": () => import("@/gigblade/PlatformDomains"),
	"/health": () => import("@/gigblade/PlatformSiteHealth"),
	"/plan": () => import("@/gigblade/PlatformPlan"),
	"/bookings": () => import("@/gigblade/DjBookingsPage"),
	"/settings": () => import("@/gigblade/GigbladeSettingsPage"),
	"/studio": () => import("@/gigblade/DjStudioPage"),
	"/studio/domains": () => import("@/gigblade/DjDomainPage"),
	"/studio/bookings": () => import("@/gigblade/DjBookingsPage"),
	"/studio/content": () => import("@/gigblade/DjContentPage"),
	"/studio/visitas": () => import("@/gigblade/DjVisitsPage"),
};

const started = new Set<string>();

function warmChunk(path: string) {
	if (started.has(path)) return;
	started.add(path);
	const load = ROUTE_IMPORTS[path];
	if (load) void load();
}

function warmData(path: string, queryClient: QueryClient) {
	const session = readPanelAuthSession();
	const isPlatform = session?.user.role === "platform";

	if (isPlatform && (path === "/overview" || path === "/djs")) {
		void queryClient.prefetchQuery({
			queryKey: PLATFORM_SITES_QUERY_KEY,
			queryFn: ({ signal }) => fetchPlatformSites(signal),
			staleTime: 60_000,
		});
	}
	if (path === "/studio" && session?.user.slug) {
		void fetchPublicSite(session.user.slug);
	}
	if (isPlatform && path === "/domains") {
		void queryClient.prefetchQuery({
			queryKey: PLATFORM_DOMAINS_QUERY_KEY,
			queryFn: () => fetchPlatformDomains(session?.token),
			staleTime: 60_000,
		});
	}
	if (path === "/referidos" || path === "/distribucion") {
		prefetchPlatformReferralsQuery(queryClient);
	}
	if (path === "/lista") {
		void queryClient.prefetchQuery({
			queryKey: ["platform", "waitlist"],
			queryFn: ({ signal }) => fetchPlatformWaitlist(signal),
			staleTime: 30_000,
		});
		prefetchPlatformReferralsQuery(queryClient);
	}
	if (path === "/health") {
		void queryClient.prefetchQuery({
			queryKey: ["platform", "site-health"],
			queryFn: ({ signal }) => fetchPlatformSiteHealth(signal),
			staleTime: 60_000,
		});
	}
}

export function warmPanelChunks(paths: string[]) {
	for (const path of paths) warmChunk(path);
}

export function prefetchPanelRoute(path: string, queryClient: QueryClient) {
	warmChunk(path);
	warmData(path, queryClient);
}

export function prefetchAllPanelRoutes(
	role: string | undefined,
	queryClient: QueryClient,
) {
	for (const path of Object.keys(ROUTE_IMPORTS)) warmChunk(path);
	if (role === "platform") {
		warmData("/djs", queryClient);
		warmData("/lista", queryClient);
		warmData("/health", queryClient);
	}
}

/** Solo la pantalla de inicio: evita bloquear el hilo al importar todos los chunks. */
export function prefetchHomePanelRoute(
	role: string | undefined,
	queryClient: QueryClient,
) {
	if (role === "dj") {
		warmChunk("/studio");
		warmData("/studio", queryClient);
		return;
	}
	if (role === "platform") {
		warmChunk("/overview");
		warmData("/overview", queryClient);
		prefetchPlatformReferralsQuery(queryClient);
	}
}
