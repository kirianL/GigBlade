import { Button } from "@autumn/ui";
import {
	CubeIcon,
	GearIcon,
	GlobeIcon,
	HouseIcon,
	IdentificationCardIcon,
	UserCircleIcon,
} from "@phosphor-icons/react";
import { PanelLeft } from "lucide-react";
import { useHotkeys } from "react-hotkeys-hook";
import { useLocation } from "react-router";
import { DashboardSwitcher } from "@/gigblade/DashboardSwitcher";
import { useLocalStorage } from "@/hooks/common/useLocalStorage";
import { cn } from "@/lib/utils";
import { useEnv } from "@/utils/envUtils";
import { OrgDropdown } from "./components/OrgDropdown";
import { NavButton } from "./NavButton";
import SidebarBottom from "./SidebarBottom";
import { SidebarContext } from "./SidebarContext";
import { SidebarRail } from "./SidebarRail";

export const MainSidebar = ({
	onNavigate,
}: {
	onNavigate?: () => void;
} = {}) => {
	const env = useEnv();
	const { pathname } = useLocation();
	const isDjStudio = pathname.startsWith("/studio");

	const [storedExpanded, setExpanded] = useLocalStorage<boolean>(
		"sidebar.expanded",
		true,
	);

	const isMobileSheet = !!onNavigate;
	const expanded = isMobileSheet ? true : storedExpanded;

	useHotkeys(["meta+b", "ctrl+b"], () => {
		setExpanded((prev) => !prev);
	});

	return (
		<SidebarContext.Provider value={{ expanded, setExpanded, onNavigate }}>
			<div
				data-slot="main-sidebar"
				className={cn(
					`h-full py-4 flex flex-col justify-between relative transition-[min-width,max-width] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]`,
					isMobileSheet
						? "min-w-[200px]"
						: expanded
							? "min-w-[200px] max-w-[200px]"
							: "min-w-[50px] max-w-[50px]",
				)}
			>
				<div className="flex flex-col gap-6 relative min-h-0 flex-1 overflow-y-auto">
					{!isMobileSheet && (
						<Button
							variant="secondary"
							size="sm"
							aria-label={expanded ? "Contraer menú" : "Expandir menú"}
							onClick={() => {
								setExpanded((prev) => !prev);
							}}
							className={cn(
								"absolute top-1 right-4 text-tertiary-foreground hover:bg-stone-200 w-5 h-5 p-0 border-none border-0 shadow-none !bg-transparent",
								expanded
									? "opacity-100 transition-opacity duration-100"
									: "opacity-0 transition-opacity duration-100",
							)}
						>
							<PanelLeft size={14} aria-hidden />
						</Button>
					)}
					<OrgDropdown />
					<DashboardSwitcher />
					<nav className="flex flex-col px-2 gap-1" aria-label="Principal">
						{isDjStudio ? (
							<>
								<NavButton
									value="studio"
									icon={<HouseIcon size={16} weight="fill" />}
									title="Mi página"
									env={env}
								/>
								<NavButton
									value="studio/content"
									icon={<IdentificationCardIcon size={16} weight="fill" />}
									title="Contenido"
									env={env}
								/>
							</>
						) : (
							<>
								<NavButton
									value="overview"
									icon={<HouseIcon size={16} weight="fill" />}
									title="Resumen"
									env={env}
								/>
								<NavButton
									value="djs"
									icon={<UserCircleIcon size={16} weight="fill" />}
									title="DJs"
									env={env}
								/>
								<NavButton
									value="domains"
									icon={<GlobeIcon size={16} weight="fill" />}
									title="Dominios"
									env={env}
								/>
								<NavButton
									value="plan"
									icon={<CubeIcon size={16} weight="fill" />}
									title="Plan"
									env={env}
								/>
								<NavButton
									value="settings"
									icon={<GearIcon size={16} weight="fill" />}
									title="Ajustes"
									env={env}
								/>
							</>
						)}
					</nav>
				</div>

				<SidebarBottom />
				{!isMobileSheet && <SidebarRail />}
			</div>
		</SidebarContext.Provider>
	);
};
