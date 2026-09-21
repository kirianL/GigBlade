import { Suspense, useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { Toaster } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
	GigbladeMobileSidebar,
	GigbladeSidebar,
} from "@/gigblade/GigbladeSidebar";
import { useSession } from "@/lib/auth-client";
import { ScreenReaderLoading } from "@/components/general/ScreenReaderLoading";
import { AppErrorBoundary } from "@/gigblade/AppErrorBoundary";
import { djPreviewOrigin } from "@/gigblade/concept";
import { prefetchAllPanelRoutes } from "@/gigblade/prefetch";
import { MobileTopBar } from "@/views/main-sidebar/MobileTopBar";
import type { QueryClient } from "@tanstack/react-query";

function schedule(work: () => void) {
	const idle =
		(window as typeof window & {
			requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => number;
		}).requestIdleCallback;
	if (idle) idle(work, { timeout: 1500 });
	else window.setTimeout(work, 200);
}

function warmPanel(
	role: string | undefined,
	slug: string | undefined,
	queryClient: QueryClient,
) {
	prefetchAllPanelRoutes(role, queryClient);
	if (role !== "dj" || !slug) return;
	// Calienta el route handler de Next para que fetchPublicSite responda al toque.
	const controller = new AbortController();
	window.setTimeout(() => controller.abort(), 6000);
	void fetch(`${djPreviewOrigin(slug)}/api/tenant`, {
		signal: controller.signal,
		cache: "no-store",
	}).catch(() => {});
}

export function GigbladeLayout() {
	const { pathname, search } = useLocation();
	const { data: session, isPending: sessionLoading } = useSession();
	const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
	const panelUser = session?.user as
		| { role?: string; slug?: string }
		| undefined;

	const queryClient = useQueryClient();
	useEffect(() => {
		if (sessionLoading || !session) return;
		schedule(() => warmPanel(panelUser?.role, panelUser?.slug, queryClient));
	}, [sessionLoading, session, panelUser?.role, panelUser?.slug, queryClient]);

	if (sessionLoading) {
		return <ScreenReaderLoading label="Abriendo panel" />;
	}

	if (!session) {
		const destination = `${pathname}${search}`;
		const next =
			destination !== "/" ? `?next=${encodeURIComponent(destination)}` : "";
		return <Navigate to={`/sign-in${next}`} replace />;
	}

	if (!sessionLoading && panelUser?.role === "dj") {
		const studio = panelUser.slug
			? `/studio?dj=${encodeURIComponent(panelUser.slug)}`
			: "/studio";
		if (!pathname.startsWith("/studio")) {
			return <Navigate to={studio} replace />;
		}
	}

	return (
		<div className="w-screen h-screen flex bg-outer-background">
			<Toaster position="top-center" duration={6000} />
			<div className="hidden sm:flex">
				<GigbladeSidebar />
			</div>
			<GigbladeMobileSidebar
				open={mobileSidebarOpen}
				onOpenChange={setMobileSidebarOpen}
			/>
			<main className="w-full h-screen flex flex-col justify-center overflow-hidden sm:py-3 sm:pr-3 relative font-normal">
				<div className="w-full h-full flex flex-col overflow-hidden sm:rounded-xl sm:border relative">
					<MobileTopBar onMenuClick={() => setMobileSidebarOpen(true)} />
					<div
						data-main-content
						className="w-full h-full overflow-auto flex justify-center bg-background relative"
					>
						<div className="w-full min-h-full justify-center">
							<AppErrorBoundary
								pathname={pathname}
								message="No se pudo abrir esta página. Probá otra del menú."
							>
								<Suspense fallback={<ScreenReaderLoading />}>
									<Outlet />
								</Suspense>
							</AppErrorBoundary>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
