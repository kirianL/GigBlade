import "@autumn/ui/styles.css";
import "./styles/gigblade.css";
import { QueryClient } from "@tanstack/react-query";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AppErrorBoundary } from "./gigblade/AppErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeProvider";
import { LanguageProvider } from "./contexts/LanguageProvider";
import { PERSISTED_QUERY_CACHE_KEY } from "./gigblade/panel-session";
import { installFetchMock } from "./demo/installFetchMock";
import { PostHogBoot } from "./app/PostHogBoot";

installFetchMock();

if ("serviceWorker" in navigator) {
	window.addEventListener("load", () => {
		void navigator.serviceWorker
			.getRegistrations()
			.then((regs) => Promise.all(regs.map((reg) => reg.unregister())))
			.catch(() => {});
	});
}

if (import.meta.env.VITE_SENTRY_DSN) {
	void import("@sentry/react").then((Sentry) => {
		Sentry.init({
			dsn: import.meta.env.VITE_SENTRY_DSN,
			sendDefaultPii: true,
		});
	});
}

document.title = "GigBlade";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			// Datos frescos por 30s tras montar; evita refetch al navegar.
			staleTime: 30_000,
			gcTime: 24 * 60 * 60_000,
			// El persister guarda queries hasta 24h — reload muestra datos al toque.
		},
	},
});

const persister = createSyncStoragePersister({
	storage: typeof window === "undefined" ? undefined : window.localStorage,
	key: PERSISTED_QUERY_CACHE_KEY,
	throttleTime: 1000,
});

const shouldInitializePostHog = process.env.NODE_ENV === "production";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<PersistQueryClientProvider
			client={queryClient}
			persistOptions={{
				persister,
				maxAge: 30 * 60_000,
				buster: "v3",
				dehydrateOptions: {
					shouldDehydrateQuery: (query) => {
						const [scope, subKey] = query.queryKey;
						if (scope !== "platform" || query.state.status !== "success") {
							return false;
						}
						if (subKey === "sites") {
							return Array.isArray(query.state.data);
						}
						if (subKey === "site-health" || subKey === "domains") {
							return true;
						}
						return false;
					},
				},
			}}
		>
			<ThemeProvider>
				<LanguageProvider>
					<AppErrorBoundary>
						{shouldInitializePostHog ? (
							<PostHogBoot>
								<App />
							</PostHogBoot>
						) : (
							<App />
						)}
					</AppErrorBoundary>
				</LanguageProvider>
			</ThemeProvider>
		</PersistQueryClientProvider>
	</StrictMode>,
);
