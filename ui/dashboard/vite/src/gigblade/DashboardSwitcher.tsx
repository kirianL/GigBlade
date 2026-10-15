import { NavLink, useLocation } from "react-router";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useSidebarContext } from "@/views/main-sidebar/SidebarContext";
import { useLanguage } from "@/contexts/LanguageProvider";

export function DashboardSwitcher() {
	const { pathname } = useLocation();
	const { expanded } = useSidebarContext();
	const { data: session } = useSession();
	const { t } = useLanguage();
	const isDj = pathname.startsWith("/studio");
	const isDjAccount =
		(session?.user as { role?: string } | undefined)?.role === "dj";

	if (!expanded || isDjAccount) return null;

	return (
		<nav aria-label={t("nav.panelType", "Tipo de panel")} className="mx-2 flex flex-col gap-1">
			<NavLink
				to="/overview"
				className={cn(
					"cursor-pointer font-medium text-sm flex items-center justify-center text-muted-foreground px-2 h-7 rounded-lg w-full border border-transparent transition-all duration-200 ease-out active:scale-[0.97] hover:text-foreground hover:bg-interactive-secondary/60",
					!isDj
						? "border-border/80 !text-foreground bg-interactive-secondary shadow-2xs font-semibold"
						: "",
				)}
			>
				{t("nav.platform", "Plataforma")}
			</NavLink>
			<NavLink
				to="/studio"
				className={cn(
					"cursor-pointer font-medium text-sm flex items-center justify-center text-muted-foreground px-2 h-7 rounded-lg w-full border border-transparent transition-all duration-200 ease-out active:scale-[0.97] hover:text-foreground hover:bg-interactive-secondary/60",
					isDj
						? "border-border/80 !text-foreground bg-interactive-secondary shadow-2xs font-semibold"
						: "",
				)}
			>
				DJ
			</NavLink>
		</nav>
	);
}
