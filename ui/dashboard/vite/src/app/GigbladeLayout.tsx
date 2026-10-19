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
		<div className="flex min-h-dvh w-full max-w-full overflow-x-hidden bg-background sm:h-dvh sm:overflow-hidden sm:bg-outer-background">
			<Toaster
				position="top-center"
				duration={4200}
				visibleToasts={3}
				mobileOffset={{ top: "calc(env(safe-area-inset-top, 0px) + 12px)" }}
				offset={{ top: "calc(env(safe-area-inset-top, 0px) + 12px)" }}
				toastOptions={{
					className:
						"w-[min(24rem,calc(100vw-1.5rem))] rounded-2xl border bg-card px-3.5 py-3 text-sm text-foreground shadow-lg",
				}}
			/>
			<div className="hidden sm:flex">
				<GigbladeSidebar />
			</div>
			<GigbladeMobileSidebar
				open={mobileSidebarOpen}
				onOpenChange={setMobileSidebarOpen}
			/>
			<main className="relative flex min-h-dvh min-w-0 flex-1 flex-col font-normal sm:h-full sm:min-h-0 sm:overflow-hidden sm:py-3 sm:pr-3">
				<div className="relative flex min-h-dvh min-w-0 w-full flex-1 flex-col sm:h-full sm:min-h-0 sm:overflow-hidden sm:rounded-xl sm:border">
					<MobileTopBar onMenuClick={() => setMobileSidebarOpen(true)} />
					<div
						data-main-content
						className="gigblade-safe-bottom relative flex min-h-0 min-w-0 w-full flex-1 justify-center overflow-x-hidden bg-background sm:overflow-y-auto"
					>
						<div className="min-w-0 w-full max-w-full justify-center">
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
