import "@autumn/ui/styles.css";
import "./styles/gigblade.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
		},
	},
});

const shouldInitializePostHog = process.env.NODE_ENV === "production";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
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
		</QueryClientProvider>
	</StrictMode>,
);
