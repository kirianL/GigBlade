import "scraps-ui/scraps.css";
import "@autumn/ui/styles.css";
import "./styles/gigblade.css";
import * as Sentry from "@sentry/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PostHogProvider } from "posthog-js/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./contexts/ThemeProvider";
import { installFetchMock } from "./demo/installFetchMock";

installFetchMock();

Sentry.init({
	dsn: import.meta.env.VITE_SENTRY_DSN,
	sendDefaultPii: true,
});

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
				{/* <App /> */}
				{shouldInitializePostHog ? (
					<PostHogProvider
						apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
						options={{
							api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
							autocapture: false,
							capture_pageview: false,
							capture_pageleave: false,
						}}
					>
						<App />
					</PostHogProvider>
				) : (
					<App />
				)}
				{/* <ReactQueryDevtools initialIsOpen={false} /> */}
			</ThemeProvider>
		</QueryClientProvider>
	</StrictMode>,
);
