import { Suspense, useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { Toaster } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
	GigbladeMobileSidebar,
	GigbladeSidebar,
} from "@/gigblade/GigbladeSidebar";
import { useSession } from "@/lib/auth-client";
import { AppErrorBoundary } from "@/gigblade/AppErrorBoundary";
import { BootScreen } from "@/gigblade/BootScreen";
import { prefetchHomePanelRoute } from "@/gigblade/prefetch";
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
	queryClient: QueryClient,
) {
	prefetchHomePanelRoute(role, queryClient);
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
		schedule(() => warmPanel(panelUser?.role, queryClient));
	}, [sessionLoading, session, panelUser?.role, queryClient]);

	if (sessionLoading && !session) {
		return <BootScreen />;
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
		<div className="flex h-dvh w-screen bg-outer-background">
			<Toaster position="top-center" duration={6000} />
			<div className="hidden sm:flex">
				<GigbladeSidebar />
			</div>
			<GigbladeMobileSidebar
				open={mobileSidebarOpen}
				onOpenChange={setMobileSidebarOpen}
			/>
			<main className="relative flex h-full min-h-0 w-full flex-col overflow-hidden font-normal sm:py-3 sm:pr-3">
				<div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden sm:rounded-xl sm:border">
					<MobileTopBar onMenuClick={() => setMobileSidebarOpen(true)} />
					<div
						data-main-content
						className="gigblade-safe-bottom relative flex min-h-0 w-full flex-1 justify-center overflow-auto bg-background"
					>
						<div className="w-full min-h-full justify-center">
							<AppErrorBoundary
								pathname={pathname}
								message="No se pudo abrir esta página. Probá otra del menú."
							>
								<Suspense fallback={<BootScreen fullPage={false} />}>
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
