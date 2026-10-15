import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuPortal,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
	Sheet,
	SheetContent,
	SheetTitle,
} from "@autumn/ui";
import {
	BooksIcon,
	CalendarCheckIcon,
	ChartBarIcon,
	CubeIcon,
	CurrencyDollarIcon,
	EnvelopeSimpleIcon,
	GearIcon,
	GlobeIcon,
	HouseIcon,
	IdentificationCardIcon,
	ShareNetworkIcon,
	ShieldCheckIcon,
	UserCircleIcon,
} from "@phosphor-icons/react";
import { useMemo } from "react";
import { Check, ChevronDown, Monitor, Moon, PanelLeft, Sun } from "lucide-react";
import { useHotkeys } from "react-hotkeys-hook";
import { NavLink, useLocation } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { gigbladeMarketingSiteUrl } from "@/gigblade/concept";
import { InstallDesktopMenuItem } from "@/gigblade/InstallDesktop";
import { prefetchPanelRoute } from "@/gigblade/prefetch";
import { DashboardSwitcher } from "@/gigblade/DashboardSwitcher";
import { useLocalStorage } from "@/hooks/common/useLocalStorage";
import { authClient, useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeProvider";
import { useLanguage } from "@/contexts/LanguageProvider";
import {
	SidebarContext,
	useSidebarContext,
} from "@/views/main-sidebar/SidebarContext";
import { SidebarRail } from "@/views/main-sidebar/SidebarRail";



export function GigbladeSidebar({
	onNavigate,
}: {
	onNavigate?: () => void;
} = {}) {
	const { pathname, search } = useLocation();
	const isDjStudio = pathname.startsWith("/studio");
	const [storedExpanded, setExpanded] = useLocalStorage<boolean>(
		"sidebar.expanded",
		true,
	);
	const { t } = useLanguage();

	const platformLinks = useMemo(
		() => [
			{ to: "/overview", title: t("nav.overview", "Resumen"), icon: HouseIcon },
			{ to: "/djs", title: t("nav.djs", "DJs"), icon: UserCircleIcon },
			{ to: "/referidos", title: t("nav.referrals", "Referidos & Comisiones"), icon: ShareNetworkIcon },
			{ to: "/distribucion", title: t("nav.finance", "Finanzas & Reparto"), icon: CurrencyDollarIcon },
			{ to: "/bookings", title: t("nav.bookings", "Contrataciones"), icon: CalendarCheckIcon },
			{ to: "/lista", title: t("nav.waitlist", "Lista de espera"), icon: EnvelopeSimpleIcon },
			{ to: "/domains", title: t("nav.domains", "Dominios"), icon: GlobeIcon },
			{ to: "/health", title: t("nav.health", "Estado de páginas"), icon: ShieldCheckIcon },
			{ to: "/plan", title: t("plan.title", "Plan"), icon: CubeIcon },
			{ to: "/settings", title: t("nav.settings", "Ajustes"), icon: GearIcon },
		],
		[t],
	);

	const studioLinks = useMemo(
		() => [
			{ to: "/studio", title: t("nav.myPage", "Mi página"), icon: HouseIcon, end: true },
			{ to: "/studio/domains", title: t("nav.domain", "Dominio propio"), icon: GlobeIcon },
			{ to: "/studio/bookings", title: t("nav.bookings", "Contrataciones"), icon: CalendarCheckIcon },
			{ to: "/studio/content", title: t("nav.content", "Contenido"), icon: IdentificationCardIcon },
			{ to: "/studio/visitas", title: t("nav.visits", "Visitas"), icon: ChartBarIcon },
		],
		[t],
	);

	const isMobileSheet = !!onNavigate;
	const expanded = isMobileSheet ? true : storedExpanded;
	const links = isDjStudio ? studioLinks : platformLinks;
	const queryClient = useQueryClient();
	const prefetch = (to: string) => prefetchPanelRoute(to, queryClient);

	useHotkeys(["meta+b", "ctrl+b"], () => {
		setExpanded((prev) => !prev);
	});

	return (
		<SidebarContext.Provider value={{ expanded, setExpanded, onNavigate }}>
			<div
				data-slot="main-sidebar"
				className={cn(
					"h-full py-4 flex flex-col justify-between relative transition-[min-width,max-width] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
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
								"absolute top-1 right-4 text-tertiary-foreground hover:bg-stone-200 dark:hover:bg-stone-800 w-5 h-5 p-0 border-none border-0 shadow-none !bg-transparent",
								expanded
									? "opacity-100 transition-opacity duration-100"
									: "opacity-0 transition-opacity duration-100",
							)}
						>
							<PanelLeft size={14} aria-hidden />
						</Button>
					)}
					<GigbladeAccountMenu />
					<DashboardSwitcher />
					<nav className="flex flex-col px-2 gap-1" aria-label="Principal">
						{links.map((link) => {
							const Icon = link.icon;
							return (
								<NavLink
									key={link.to}
									to={{ pathname: link.to, search }}
									end={"end" in link ? link.end : false}
									onClick={() => onNavigate?.()}
									onMouseEnter={() => prefetch(link.to)}
									onFocus={() => prefetch(link.to)}
									onTouchStart={() => prefetch(link.to)}
									className={({ isActive }) =>
										cn(
											"group cursor-pointer font-medium text-sm flex items-center text-muted-foreground px-2 h-7 rounded-lg w-full border border-transparent transition-colors hover:text-foreground hover:bg-interactive-secondary/60",
											isActive &&
												"border border-border/80 !text-foreground bg-interactive-secondary shadow-2xs font-semibold",
										)
									}
								>
									<div className="flex items-center gap-2">
										<div
											className="flex justify-center !w-4 !h-4 items-center rounded-sm shrink-0 text-muted-foreground group-hover:text-foreground"
											aria-hidden
										>
											<Icon
												size={16}
												weight="fill"
											/>
										</div>
										<span
											className={cn(
												"whitespace-nowrap transition-colors duration-150 group-hover:text-foreground",
												expanded
													? "opacity-100 translate-x-0"
													: "opacity-0 -translate-x-2 pointer-events-none w-0 m-0 p-0",
											)}
										>
											{link.title}
										</span>
									</div>
								</NavLink>
							);
						})}
					</nav>
				</div>

				<div className="px-2 flex flex-col gap-1 mb-2">
					<a
						href={gigbladeMarketingSiteUrl()}
						target="_blank"
						rel="noreferrer"
						className="group cursor-pointer font-medium text-sm flex items-center text-muted-foreground px-2 h-7 rounded-lg w-full hover:text-foreground hover:bg-interactive-secondary/60 border border-transparent transition-colors"
					>
						<div className="flex items-center gap-2">
							<div
								className="flex justify-center !w-4 !h-4 items-center rounded-sm shrink-0 text-muted-foreground group-hover:text-foreground"
								aria-hidden
							>
								<BooksIcon
									size={16}
									weight="duotone"
								/>
							</div>
							<span
								className={cn(
									"whitespace-nowrap transition-colors duration-150 group-hover:text-foreground",
									expanded
										? "opacity-100 translate-x-0"
										: "opacity-0 -translate-x-2 pointer-events-none w-0 m-0 p-0",
								)}
							>
								{t("nav.site", "Sitio")}
							</span>
						</div>
					</a>
				</div>
				{!isMobileSheet && <SidebarRail />}
			</div>
		</SidebarContext.Provider>
	);
}

function GigbladeAccountMenu() {
	const { expanded, setExpanded } = useSidebarContext();
	const { mode, setMode } = useTheme();
	const { language, setLanguage, t } = useLanguage();
	const { data: session } = useSession();
	const name = session?.user?.name || "GigBlade";
	const email = session?.user?.email || "";

	return (
		<div className={cn("flex", expanded ? "px-3" : "px-2")}>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="skeleton"
						aria-label={t("nav.account", "Cuenta")}
						className={cn(
							"bg-transparent! gap-2 rounded-md items-center transition-all duration-200 cursor-pointer",
							expanded
								? "h-7 min-w-28 p-0.5 justify-start shimmer-hover"
								: "h-7 w-full px-2 justify-center hover:bg-transparent",
						)}
					>
						<span
							aria-hidden
							className="flex size-5 shrink-0 items-center justify-center rounded-md bg-interactive-secondary text-[10px] font-medium text-foreground"
						>
							{name.slice(0, 1).toUpperCase()}
						</span>
						<div
							className={cn(
								"flex items-center gap-1 transition-all duration-200",
								expanded
									? "opacity-100 translate-x-0"
									: "opacity-0 -translate-x-2 pointer-events-none w-0 m-0 p-0",
							)}
						>
							<span className="text-muted-foreground max-w-24 truncate">
								{name}
							</span>
							<ChevronDown size={14} className="text-tertiary-foreground" />
						</div>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start" className="w-48">
					<DropdownMenuItem className="flex justify-between w-full items-center gap-2 text-muted-foreground">
						<div className="flex flex-col">
							<span>{name}</span>
							{email ? (
								<span className="text-xs text-zinc-500 break-all hyphens-auto">
									{email}
								</span>
							) : null}
						</div>
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuGroup>
						{/* Sub-menu Tema */}
						<DropdownMenuSub>
							<DropdownMenuSubTrigger className="text-muted-foreground">
								<div className="flex justify-between w-full items-center gap-2">
									<span>{t("theme.title", "Tema")}</span>
									{mode === "light" && <Sun size={14} />}
									{mode === "dark" && <Moon size={14} />}
									{mode === "system" && <Monitor size={14} />}
								</div>
							</DropdownMenuSubTrigger>
							<DropdownMenuPortal>
								<DropdownMenuSubContent className="w-36">
									<DropdownMenuItem
										onClick={() => setMode("light")}
										className="flex justify-between items-center"
									>
										<span className={cn(mode === "light" ? "text-foreground font-medium" : "text-muted-foreground")}>
											{t("theme.light", "Claro")}
										</span>
										<Sun size={14} />
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() => setMode("dark")}
										className="flex justify-between items-center"
									>
										<span className={cn(mode === "dark" ? "text-foreground font-medium" : "text-muted-foreground")}>
											{t("theme.dark", "Oscuro")}
										</span>
										<Moon size={14} />
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() => setMode("system")}
										className="flex justify-between items-center"
									>
										<span className={cn(mode === "system" ? "text-foreground font-medium" : "text-muted-foreground")}>
											{t("theme.system", "Sistema")}
										</span>
										<Monitor size={14} />
									</DropdownMenuItem>
								</DropdownMenuSubContent>
							</DropdownMenuPortal>
						</DropdownMenuSub>

						{/* Sub-menu Idioma / Language */}
						<DropdownMenuSub>
							<DropdownMenuSubTrigger className="text-muted-foreground">
								<div className="flex justify-between w-full items-center gap-2">
									<span>{t("language.title", "Idioma")}</span>
									<span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-interactive-secondary text-foreground">
										{language}
									</span>
								</div>
							</DropdownMenuSubTrigger>
							<DropdownMenuPortal>
								<DropdownMenuSubContent className="w-36">
									<DropdownMenuItem
										onClick={() => setLanguage("es")}
										className="flex justify-between items-center cursor-pointer"
									>
										<span className={cn(language === "es" ? "text-foreground font-medium" : "text-muted-foreground")}>
											{t("language.es", "Español")}
										</span>
										{language === "es" && <Check size={14} className="text-emerald-500" />}
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() => setLanguage("en")}
										className="flex justify-between items-center cursor-pointer"
									>
										<span className={cn(language === "en" ? "text-foreground font-medium" : "text-muted-foreground")}>
											{t("language.en", "English")}
										</span>
										{language === "en" && <Check size={14} className="text-emerald-500" />}
									</DropdownMenuItem>
								</DropdownMenuSubContent>
							</DropdownMenuPortal>
						</DropdownMenuSub>

						{!expanded && (
							<DropdownMenuItem
								onClick={() => {
									setExpanded(true);
								}}
							>
								<span className="text-muted-foreground">{t("nav.openMenu", "Abrir menú")}</span>
							</DropdownMenuItem>
						)}
					</DropdownMenuGroup>
					<DropdownMenuSeparator />
					<InstallDesktopMenuItem />
					<DropdownMenuItem
						onClick={async () => {
							try {
								await authClient.signOut();
							} finally {
								window.location.href = "/sign-in";
							}
						}}
					>
						<span className="text-muted-foreground">{t("auth.signOut", "Salir")}</span>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}

export function GigbladeMobileSidebar({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const close = () => onOpenChange(false);

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="left"
				hideCloseButton
				portalContainer={document.body}
				className="gigblade-safe-top gigblade-safe-bottom w-[280px] max-w-[80vw] bg-outer-background"
				aria-describedby={undefined}
			>
				<SheetTitle className="sr-only">Navegación</SheetTitle>
				<GigbladeSidebar onNavigate={close} />
			</SheetContent>
		</Sheet>
	);
}
