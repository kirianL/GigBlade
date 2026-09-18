import { Suspense, useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { Toaster } from "sonner";
import {
	GigbladeMobileSidebar,
	GigbladeSidebar,
} from "@/gigblade/GigbladeSidebar";
import { useSession } from "@/lib/auth-client";
import { BootScreen } from "@/gigblade/BootScreen";
import { djPreviewOrigin } from "@/gigblade/concept";
import { MobileTopBar } from "@/views/main-sidebar/MobileTopBar";

function schedule(work: () => void) {
	const idle =
		(window as typeof window & {
			requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => number;
		}).requestIdleCallback;
	if (idle) idle(work, { timeout: 1500 });
	else window.setTimeout(work, 200);
}

function warmPanel(slug: string | undefined) {
	// Precompila los routes pesados del panel en Vite dev cache.
	void import("@/gigblade/DjStudioPage");
	void import("@/gigblade/DjContentPage");
	void import("@/gigblade/DjVisitsPage");
	if (!slug) return;
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

	useEffect(() => {
		if (sessionLoading || !session) return;
		schedule(() => warmPanel(panelUser?.slug));
	}, [sessionLoading, session, panelUser?.slug]);

	if (!sessionLoading && !session) {
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
							<Suspense fallback={<BootScreen />}>
								<Outlet />
							</Suspense>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
