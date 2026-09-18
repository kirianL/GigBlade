import { lazy, Suspense, type ReactNode } from "react";

const PostHogProvider = lazy(() =>
	import("posthog-js/react").then((mod) => ({ default: mod.PostHogProvider })),
);

export function PostHogBoot({ children }: { children: ReactNode }) {
	return (
		<Suspense fallback={children}>
			<PostHogProvider
				apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
				options={{
					api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
					autocapture: false,
					capture_pageview: false,
					capture_pageleave: false,
				}}
			>
				{children}
			</PostHogProvider>
		</Suspense>
	);
}
