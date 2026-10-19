import { ListIcon } from "@phosphor-icons/react";
import { useLocation } from "react-router";
import { useLanguage } from "@/contexts/LanguageProvider";

function useMobileTitle() {
	const { pathname } = useLocation();
	const { t } = useLanguage();

	if (pathname.startsWith("/studio/domains")) return t("nav.domain", "Dominio");
	if (pathname.startsWith("/studio/bookings")) return t("nav.bookings", "Contrataciones");
	if (pathname.startsWith("/studio/content")) return t("nav.content", "Contenido");
	if (pathname.startsWith("/studio/visitas")) return t("nav.visits", "Visitas");
	if (pathname.startsWith("/studio")) return t("nav.myPage", "Mi página");
	if (pathname.startsWith("/djs")) return t("nav.djs", "DJs");
	if (pathname.startsWith("/referidos")) return t("nav.referrals", "Referidos");
	if (pathname.startsWith("/distribucion")) return t("nav.finance", "Finanzas");
	if (pathname.startsWith("/bookings")) return t("nav.bookings", "Contrataciones");
	if (pathname.startsWith("/lista")) return t("nav.waitlist", "Lista de espera");
	if (pathname.startsWith("/domains")) return t("nav.domains", "Dominios");
	if (pathname.startsWith("/health")) return t("nav.health", "Estado");
	if (pathname.startsWith("/plan")) return t("plan.title", "Plan");
	if (pathname.startsWith("/settings")) return t("nav.settings", "Ajustes");
	return t("nav.overview", "Resumen");
}

/** Barra superior del panel en móvil, con menú y título de la sección. */
export function MobileTopBar({ onMenuClick }: { onMenuClick: () => void }) {
	const title = useMobileTitle();

	return (
		<div className="gigblade-safe-bar sticky top-0 z-50 grid shrink-0 grid-cols-[2.75rem_1fr_2.75rem] items-center border-b border-border/60 bg-background px-2 sm:hidden">
			<button
				type="button"
				onClick={onMenuClick}
				className="flex size-11 items-center justify-center rounded-xl text-foreground active:bg-accent/70"
				aria-label="Abrir menú"
			>
				<ListIcon size={22} weight="bold" aria-hidden />
			</button>
			<h1 className="truncate text-center text-[15px] font-semibold tracking-tight text-foreground">
				{title}
			</h1>
			<span aria-hidden className="size-11" />
		</div>
	);
}
