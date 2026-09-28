import type { QueryClient } from "@tanstack/react-query";
import {
	fetchPlatformSiteHealth,
	fetchPlatformSites,
	fetchPlatformWaitlist,
} from "@/gigblade/site-api";
import { PLATFORM_SITES_QUERY_KEY } from "@/gigblade/usePlatformDjs";

// Módulos que carga cada ruta. Al hacer hover en el enlace del sidebar
// arrancamos el `import()` para que el chunk esté listo antes del click.
const ROUTE_IMPORTS: Record<string, () => Promise<unknown>> = {
	"/overview": () => import("@/gigblade/PlatformOverview"),
	"/djs": () => import("@/gigblade/PlatformDjs"),
	"/lista": () => import("@/gigblade/PlatformWaitlist"),
	"/domains": () => import("@/gigblade/PlatformDomains"),
	"/health": () => import("@/gigblade/PlatformSiteHealth"),
	"/plan": () => import("@/gigblade/PlatformPlan"),
	"/settings": () => import("@/gigblade/GigbladeSettingsPage"),
	"/studio": () => import("@/gigblade/DjStudioPage"),
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
	if (path === "/overview" || path === "/djs" || path === "/domains") {
		void queryClient.prefetchQuery({
			queryKey: PLATFORM_SITES_QUERY_KEY,
			queryFn: ({ signal }) => fetchPlatformSites(signal),
			staleTime: 30_000,
		});
	}
	if (path === "/lista") {
		void queryClient.prefetchQuery({
			queryKey: ["platform", "waitlist"],
			queryFn: ({ signal }) => fetchPlatformWaitlist(signal),
			staleTime: 15_000,
		});
	}
	if (path === "/health") {
		void queryClient.prefetchQuery({
			queryKey: ["platform", "site-health"],
			queryFn: ({ signal }) => fetchPlatformSiteHealth(signal),
			staleTime: 60_000,
		});
	}
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
