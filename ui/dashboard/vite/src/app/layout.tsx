import { AppEnv } from "@autumn/shared";
import { IconButton, SandboxBanner } from "@autumn/ui";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { AutumnProvider } from "autumn-js/react";
import { NuqsAdapter } from "nuqs/adapters/react-router/v7";
import { Suspense, useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router";
import { CustomToaster } from "@/components/general/CustomToaster";
import { SandboxFavicon } from "@/components/general/SandboxFavicon";
import { PortalContainerContext } from "@/contexts/PortalContainerContext";
import { useAutumnFlags } from "@/hooks/common/useAutumnFlags";
import { useGlobalErrorHandler } from "@/hooks/common/useGlobalErrorHandler";
import { useOrg } from "@/hooks/common/useOrg";
import { useDevQuery } from "@/hooks/queries/useDevQuery";
import { useFeaturesQuery } from "@/hooks/queries/useFeaturesQuery";
import { useRewardsQuery } from "@/hooks/queries/useRewardsQuery";
import { useSyncSandboxFromUrl } from "@/hooks/sandbox/useSyncSandboxFromUrl";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { cn } from "@/lib/utils";
import { useEnv } from "@/utils/envUtils";
import { LeafPanel } from "@/views/chat/LeafPanel";
import CommandBar from "@/views/command-bar/CommandBar";
import { useEventNames } from "@/views/customers/customer/analytics/hooks/useEventNames";
import LoadingScreen from "@/views/general/LoadingScreen";
import { InviteNotifications } from "@/views/general/notifications/InviteNotifications";
import { DeployToProdDialog } from "@/views/main-sidebar/components/deploy-button/DeployToProdDialog";
import { MainSidebar } from "@/views/main-sidebar/MainSidebar";
import { MobileSidebar } from "@/views/main-sidebar/MobileSidebar";
import { MobileTopBar } from "@/views/main-sidebar/MobileTopBar";
import { AppContext } from "./AppContext";

function isGigbladePath(pathname: string) {
	return (
		pathname.startsWith("/studio") ||
		pathname === "/overview" ||
		pathname.startsWith("/djs") ||
		pathname.startsWith("/domains") ||
		pathname === "/plan"
	);
}

export function MainLayout() {
	const { pathname } = useLocation();
	const gigblade = isGigbladePath(pathname);
	const { handleApiError } = useGlobalErrorHandler();
	const containerRef = useRef<HTMLDivElement>(null);
	const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

	useEffect(() => {
		const handleGlobalError = (event: ErrorEvent) => {
			if (event.error?.response) {
				handleApiError(event.error);
			}
		};

		window.addEventListener("error", handleGlobalError);
		return () => window.removeEventListener("error", handleGlobalError);
	}, [handleApiError]);

	const shell = (
		<NuqsAdapter>
			<PortalContainerContext.Provider value={containerRef}>
				<div className="w-screen h-screen flex bg-outer-background">
					<CustomToaster />
					{gigblade ? (
						<GigbladeShell
							containerRef={containerRef}
							mobileSidebarOpen={mobileSidebarOpen}
							onMobileSidebarOpenChange={setMobileSidebarOpen}
						/>
					) : (
						<DashboardShell
							containerRef={containerRef}
							mobileSidebarOpen={mobileSidebarOpen}
							onMobileSidebarOpenChange={setMobileSidebarOpen}
						/>
					)}
				</div>
			</PortalContainerContext.Provider>
		</NuqsAdapter>
	);

	if (gigblade) return shell;

	return (
		<AutumnProvider
			backendUrl={import.meta.env.VITE_BACKEND_URL}
			includeCredentials={true}
		>
			{shell}
		</AutumnProvider>
	);
}

const chrome = (
	containerRef: React.RefObject<HTMLDivElement>,
	mobileSidebarOpen: boolean,
	onMobileSidebarOpenChange: (open: boolean) => void,
	content: React.ReactNode,
	extras?: React.ReactNode,
) => (
	<>
		<div className="hidden sm:flex">
			<MainSidebar />
		</div>
		<MobileSidebar
			open={mobileSidebarOpen}
			onOpenChange={onMobileSidebarOpenChange}
		/>
		{content}
		{extras}
	</>
);

const GigbladeShell = ({
	containerRef,
	mobileSidebarOpen,
	onMobileSidebarOpenChange,
}: {
	containerRef: React.RefObject<HTMLDivElement>;
	mobileSidebarOpen: boolean;
	onMobileSidebarOpenChange: (open: boolean) => void;
}) =>
	chrome(
		containerRef,
		mobileSidebarOpen,
		onMobileSidebarOpenChange,
		<GigbladeMainContent
			containerRef={containerRef}
			onOpenMobileSidebar={() => onMobileSidebarOpenChange(true)}
		/>,
	);

const DashboardShell = ({
	containerRef,
	mobileSidebarOpen,
	onMobileSidebarOpenChange,
}: {
	containerRef: React.RefObject<HTMLDivElement>;
	mobileSidebarOpen: boolean;
	onMobileSidebarOpenChange: (open: boolean) => void;
}) => {
	const { sandboxUrlResolved } = useSyncSandboxFromUrl();

	if (!sandboxUrlResolved) {
		return <LoadingScreen fullPage />;
	}

	return (
		<>
			<SandboxFavicon />
			{chrome(
				containerRef,
				mobileSidebarOpen,
				onMobileSidebarOpenChange,
				<AutumnMainContent
					containerRef={containerRef}
					onOpenMobileSidebar={() => onMobileSidebarOpenChange(true)}
				/>,
				<>
					<InviteNotifications />
					<CommandBar />
					<LeafPanel />
				</>,
			)}
		</>
	);
};

const GigbladeMainContent = ({
	containerRef,
	onOpenMobileSidebar,
}: {
	containerRef: React.RefObject<HTMLDivElement>;
	onOpenMobileSidebar: () => void;
}) => (
	<AppContext.Provider value={{}}>
		<main className="w-full h-screen flex flex-col justify-center overflow-hidden sm:py-3 sm:pr-3 relative font-normal">
			<div
				ref={containerRef}
				className="w-full h-full flex flex-col overflow-hidden sm:rounded-xl sm:border relative"
			>
				<MobileTopBar onMenuClick={onOpenMobileSidebar} />
				<div
					data-main-content
					className="w-full h-full overflow-auto flex justify-center bg-background relative"
				>
					<div className="w-full min-h-full justify-center">
						<Suspense fallback={<LoadingScreen />}>
							<Outlet />
						</Suspense>
					</div>
				</div>
			</div>
		</main>
	</AppContext.Provider>
);

const AutumnMainContent = ({
	containerRef,
	onOpenMobileSidebar,
}: {
	containerRef: React.RefObject<HTMLDivElement>;
	onOpenMobileSidebar: () => void;
}) => {
	const env = useEnv();
	const { org, isLoading: orgLoading } = useOrg();
	const [showDeployDialog, setShowDeployDialog] = useState(false);
	const isCapyDev = import.meta.env.VITE_CAPY_DEV === "1";

	useDevQuery();
	useAutumnFlags();
	useFeatureFlags();
	useFeaturesQuery();
	useRewardsQuery();
	useEventNames({ enabled: !isCapyDev });

	const showLoading = orgLoading || !org;

	return (
		<AppContext.Provider value={{}}>
			<main
				className={cn(
					"w-full h-screen flex flex-col justify-center overflow-hidden sm:py-3 sm:pr-3 relative",
					"font-normal",
				)}
			>
				<div
					ref={containerRef}
					className="w-full h-full flex flex-col overflow-hidden sm:rounded-xl sm:border relative"
				>
					{env === AppEnv.Sandbox && (
						<SandboxBanner>
							{!org?.deployed && (
								<IconButton
									variant="secondary"
									size="sm"
									icon={<ArrowRightIcon />}
									iconOrientation="right"
									onClick={() => setShowDeployDialog(true)}
									className="border-sandbox/50 animate-in fade-in-0 duration-300 slide-in-from-right-2"
								>
									Deploy to Production
								</IconButton>
							)}
						</SandboxBanner>
					)}
					<DeployToProdDialog
						open={showDeployDialog}
						onOpenChange={setShowDeployDialog}
					/>
					<MobileTopBar onMenuClick={onOpenMobileSidebar} />
					<div
						data-main-content
						className="w-full h-full overflow-auto flex justify-center bg-background relative"
					>
						<div className="w-full min-h-full justify-center">
							{showLoading ? (
								<LoadingScreen />
							) : (
								<Suspense fallback={<LoadingScreen />}>
									<Outlet />
								</Suspense>
							)}
						</div>
					</div>
				</div>
			</main>
		</AppContext.Provider>
	);
};
