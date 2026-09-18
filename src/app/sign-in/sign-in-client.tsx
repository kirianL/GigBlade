"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getDashboardUrl } from "@/lib/dashboard-url";
import {
	panelHomePath,
	writePanelAuthSession,
	type PanelUser,
} from "@/lib/panel-session";

export default function SignInClient() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [message, setMessage] = useState("Entrando…");

	useEffect(() => {
		const token = searchParams.get("token");
		if (!token) {
			router.replace("/login");
			return;
		}

		let cancelled = false;
		void (async () => {
			try {
				const response = await fetch("/api/panel/session", {
					headers: { authorization: `Bearer ${token}` },
				});
				const body = (await response.json().catch(() => null)) as {
					user?: PanelUser;
					message?: string;
				} | null;
				if (!response.ok || !body?.user) {
					throw new Error(body?.message || "Sesión inválida");
				}

				writePanelAuthSession({ token, user: body.user });

				const dashboard = getDashboardUrl();
				const home = searchParams.get("next") || panelHomePath(body.user);
				let dashboardOrigin = "";
				try {
					dashboardOrigin = new URL(dashboard).origin;
				} catch {
					dashboardOrigin = "";
				}

				if (dashboardOrigin && dashboardOrigin !== window.location.origin) {
					const remote = new URL("/sign-in", dashboard);
					remote.searchParams.set("token", token);
					const next = searchParams.get("next");
					if (next) remote.searchParams.set("next", next);
					window.location.assign(remote.toString());
					return;
				}

				if (!cancelled) router.replace(home);
			} catch {
				if (!cancelled) {
					setMessage("Esa sesión ya no sirve. Entrá de nuevo.");
					window.setTimeout(() => router.replace("/login"), 1600);
				}
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [router, searchParams]);

	return (
		<main className="flex min-h-dvh items-center justify-center bg-[#09090b] px-5 text-white">
			<p className="text-sm text-white/55" role="status" aria-live="polite">
				{message}
			</p>
		</main>
	);
}
