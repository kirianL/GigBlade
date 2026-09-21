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
import { installFetchMock } from "./demo/installFetchMock";
import { PostHogBoot } from "./app/PostHogBoot";

installFetchMock();

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
	key: "gigblade.query-cache.v1",
	throttleTime: 1000,
});

const shouldInitializePostHog = process.env.NODE_ENV === "production";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<PersistQueryClientProvider
			client={queryClient}
			persistOptions={{
				persister,
				maxAge: 24 * 60 * 60_000,
				buster: "v2",
				dehydrateOptions: {
					shouldDehydrateQuery: (query) => {
						const key = query.queryKey[0];
						if (key !== "platform" || query.state.status !== "success") {
							return false;
						}
						if (query.queryKey[1] === "sites") {
							return Array.isArray(query.state.data);
						}
						return true;
					},
				},
			}}
		>
			<ThemeProvider>
				<AppErrorBoundary>
					{shouldInitializePostHog ? (
						<PostHogBoot>
							<App />
						</PostHogBoot>
					) : (
						<App />
					)}
				</AppErrorBoundary>
			</ThemeProvider>
		</PersistQueryClientProvider>
	</StrictMode>,
);
