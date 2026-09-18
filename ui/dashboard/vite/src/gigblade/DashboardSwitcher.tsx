import { NavLink, useLocation } from "react-router";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useSidebarContext } from "@/views/main-sidebar/SidebarContext";

export function DashboardSwitcher() {
	const { pathname } = useLocation();
	const { expanded } = useSidebarContext();
	const { data: session } = useSession();
	const isDj = pathname.startsWith("/studio");
	const isDjAccount =
		(session?.user as { role?: string } | undefined)?.role === "dj";

	if (!expanded || isDjAccount) return null;

	return (
		<nav aria-label="Tipo de panel" className="mx-2 flex flex-col gap-1">
			<NavLink
				to="/overview"
				className={cn(
					"cursor-pointer font-medium text-sm flex items-center justify-center text-muted-foreground px-2 h-7 rounded-lg w-full border border-transparent transition-transform duration-150 ease-out active:scale-[0.96]",
					!isDj
						? "border-border !text-foreground bg-interactive-secondary"
						: "hover:text-foreground",
				)}
			>
				Plataforma
			</NavLink>
			<NavLink
				to="/studio"
				className={cn(
					"cursor-pointer font-medium text-sm flex items-center justify-center text-muted-foreground px-2 h-7 rounded-lg w-full border border-transparent transition-transform duration-150 ease-out active:scale-[0.96]",
					isDj
						? "border-border !text-foreground bg-interactive-secondary"
						: "hover:text-foreground",
				)}
			>
				DJ
			</NavLink>
		</nav>
	);
}
