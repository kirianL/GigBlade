"use client";

import { QueryClient } from "@tanstack/react-query";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { LanguageProvider } from "@/panel/LanguageProvider";
import { SkulletSetup } from "@/panel/SkulletSetup";
import { ThemeProvider } from "@/panel/ThemeProvider";
import { PERSISTED_QUERY_CACHE_KEY } from "@/panel/panel-session";

function makeQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				refetchOnWindowFocus: false,
				staleTime: 30_000,
				gcTime: 24 * 60 * 60_000,
			},
		},
	});
}

export function PanelProviders({ children }: { children: ReactNode }) {
	const [queryClient] = useState(makeQueryClient);
	const [persister] = useState(() =>
		createSyncStoragePersister({
			storage: typeof window === "undefined" ? undefined : window.localStorage,
			key: PERSISTED_QUERY_CACHE_KEY,
			throttleTime: 1000,
		}),
	);

	return (
		<ThemeProvider>
			<SkulletSetup>
				<PersistQueryClientProvider
				client={queryClient}
				persistOptions={{
					persister,
					maxAge: 30 * 60_000,
					buster: "v5-base-main",
					dehydrateOptions: {
						shouldDehydrateQuery: (query) => {
							const [scope, subKey] = query.queryKey;
							if (scope !== "platform" || query.state.status !== "success") {
								return false;
							}
							return (
								(subKey === "sites" && Array.isArray(query.state.data)) ||
								subKey === "site-health" ||
								subKey === "domains"
							);
						},
					},
				}}
			>
				<LanguageProvider>
					<Toaster
						position="top-center"
						duration={4000}
						visibleToasts={3}
						toastOptions={{
							className:
								"rounded-xl border border-grayscale-4 bg-grayscale-1 px-4 py-3 text-[12.5px] font-medium text-grayscale-12 shadow-lg dark:border-white/[0.12] dark:bg-[#1b1b1a]",
						}}
					/>
					{children}
				</LanguageProvider>
			</PersistQueryClientProvider>
			</SkulletSetup>
		</ThemeProvider>
	);
}
