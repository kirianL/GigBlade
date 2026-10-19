"use client";

import { useEffect } from "react";
import { getDashboardUrl } from "@/lib/dashboard-url";

export default function OverviewPage() {
	useEffect(() => {
		const dashboard = getDashboardUrl().replace(/\/$/, "");
		try {
			if (new URL(dashboard).origin !== window.location.origin) {
				window.location.replace(`${dashboard}/overview`);
				return;
			}
		} catch {
			// keep fallback copy
		}
	}, []);

	return (
		<main className="flex min-h-dvh items-center justify-center bg-[#09090b] px-5 text-white">
			<p className="max-w-md text-center text-sm leading-6 text-white/55">
				Esta no es el dashboard. En el proyecto de la landing en Vercel, configurá
				NEXT_PUBLIC_DASHBOARD_URL=https://app.gigblades.com y redeployá.
			</p>
		</main>
	);
}
