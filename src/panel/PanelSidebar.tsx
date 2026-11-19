"use client";

import { Dialog } from "@base-ui/react/dialog";
import {
	CalendarCheckIcon,
	CaretRightIcon,
	ChartLineIcon,
	CheckIcon,
	ClockIcon,
	CubeIcon,
	CurrencyDollarIcon,
	DesktopIcon,
	DiscIcon,
	GearIcon,
	GlobeIcon,
	IdentificationCardIcon,
	ListIcon,
	ShareNetworkIcon,
	ShieldCheckIcon,
	SidebarSimpleIcon,
	SignOutIcon,
	SquaresFourIcon,
	UsersIcon,
	XIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { gigbladeMarketingSiteUrl } from "@/panel/concept";
import { authClient, useSession } from "@/panel/auth-client";
import { useLanguage } from "@/panel/LanguageProvider";
import { prefetchPanelRoute } from "@/panel/prefetch";
import { useDesktopInstall } from "@/panel/useDesktopInstall";
import { usePlatformDjs } from "@/panel/usePlatformDjs";
import { ThemeToggle } from "@/panel/ThemeToggle";
import { SlotNumber } from "@/panel/SlotNumber";
import { cn } from "@/panel/cn";

type NavItem = {
	href: string;
	label: string;
	icon: typeof SquaresFourIcon;
	exact?: boolean;
	count?: number;
};

function SidebarNavContent({
	onNavigate,
	onToggle,
	colapsado = false,
	ocultarMarca = false,
}: {
	onNavigate?: () => void;
	onToggle?: () => void;
	colapsado?: boolean;
	ocultarMarca?: boolean;
}) {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const router = useRouter();
	const queryClient = useQueryClient();
	const { data: session } = useSession();
	const { language, setLanguage, t } = useLanguage();
	const { canInstall, install } = useDesktopInstall();
	const { djs } = usePlatformDjs();

	const [menuOpen, setMenuOpen] = useState(false);

	useEffect(() => {
		if (!menuOpen) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") setMenuOpen(false);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [menuOpen]);

	const user = session?.user as
		| { name?: string; email?: string; role?: string; slug?: string }
		| undefined;
	const isPlatformAccount = user?.role === "platform";
	const isDjStudio = pathname.startsWith("/studio");
	const displayName = user?.name || "GigBlades";
	const initials = displayName
		.split(" ")
		.map((part) => part[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();

	const search = searchParams.toString();
	const withSearch = (href: string) =>
		href.startsWith("/studio") && search ? `${href}?${search}` : href;

	const platformPrincipales: NavItem[] = useMemo(
		() => [
			{ href: "/overview", label: t("nav.overview", "Resumen"), icon: SquaresFourIcon },
			{ href: "/djs", label: t("nav.djs", "DJs"), icon: UsersIcon, count: djs.length },
			{ href: "/bookings", label: t("nav.bookings", "Contrataciones"), icon: CalendarCheckIcon },
			{ href: "/lista", label: t("nav.waitlist", "Lista de espera"), icon: ClockIcon },
		],
		[t, djs.length],
	);

	const platformOperacion: NavItem[] = useMemo(
		() => [
			{ href: "/referidos", label: t("nav.referrals", "Referidos"), icon: ShareNetworkIcon },
			{ href: "/distribucion", label: t("nav.finance", "Finanzas"), icon: CurrencyDollarIcon },
			{ href: "/domains", label: t("nav.domains", "Dominios"), icon: GlobeIcon },
			{ href: "/health", label: t("nav.health", "Estado de páginas"), icon: ShieldCheckIcon },
			{ href: "/plan", label: t("plan.title", "Plan"), icon: CubeIcon },
		],
		[t],
	);

	const studioLinks: NavItem[] = useMemo(
		() => [
			{ href: "/studio", label: t("nav.myPage", "Mi página"), icon: SquaresFourIcon, exact: true },
			{ href: "/studio/content", label: t("nav.content", "Contenido"), icon: IdentificationCardIcon },
			{ href: "/studio/domains", label: t("nav.domain", "Dominio propio"), icon: GlobeIcon },
			{ href: "/studio/bookings", label: t("nav.bookings", "Contrataciones"), icon: CalendarCheckIcon },
			{ href: "/studio/visitas", label: t("nav.visits", "Visitas"), icon: ChartLineIcon },
		],
		[t],
	);

	const handleSignOut = async () => {
		setMenuOpen(false);
		onNavigate?.();
		await authClient.signOut();
		router.replace("/sign-in");
	};

	const renderNavLink = (item: NavItem) => {
		const activo = item.exact
			? pathname === item.href
			: pathname === item.href || pathname.startsWith(`${item.href}/`);
		const IconComp = item.icon;

		return (
			<Link
				key={item.href}
				href={withSearch(item.href)}
				prefetch
				onClick={() => onNavigate?.()}
				onMouseEnter={() => prefetchPanelRoute(item.href, queryClient)}
				aria-current={activo ? "page" : undefined}
				title={colapsado ? item.label : undefined}
				className={cn(
					"group flex items-center rounded-[10px] text-[13px] outline-none transition-[background-color,color,box-shadow,border-color,transform] duration-150 ease-[var(--ease-out-soft)] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-grayscale-7/40",
					colapsado ? "mx-auto size-9 justify-center px-0" : "gap-2.5 px-3 py-2",
					activo
						? "border border-black/[0.08] bg-white font-medium text-grayscale-12 shadow-[0_1px_2px_rgba(28,22,16,0.06)] dark:border-white/[0.11] dark:bg-[#191917] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
						: "border border-transparent text-grayscale-10 hover:bg-black/[0.05] hover:text-grayscale-12 dark:hover:bg-white/[0.06]",
				)}
			>
				<IconComp
					size={16}
					weight={activo ? "fill" : "regular"}
					className={cn(
						"shrink-0 transition-[color,transform] duration-150 ease-[var(--ease-out-soft)] group-hover:scale-[1.06]",
						activo
							? "text-grayscale-12"
							: "text-grayscale-9 group-hover:text-grayscale-12",
					)}
				/>
				{!colapsado ? <span className="truncate">{item.label}</span> : null}
				{!colapsado && typeof item.count === "number" ? (
					<SlotNumber
						value={item.count}
						duration={260}
						className={cn(
							"ml-auto rounded-full px-1.5 py-0.5 font-mono text-[10.5px] transition-colors duration-150",
							activo
								? "bg-grayscale-2 text-grayscale-11 dark:bg-white/[0.08]"
								: "bg-black/[0.055] text-grayscale-10 group-hover:bg-black/[0.08] group-hover:text-grayscale-12 dark:bg-white/[0.08]",
						)}
					/>
				) : null}
			</Link>
		);
	};

	return (
		<div className="flex h-full flex-col gap-4">
			{/* Cabecera del sidebar: Marca + Colapsar (identico a base-main) */}
			{!ocultarMarca ? (
				<div
					className={cn(
						"flex pt-0.5",
						colapsado
							? "flex-col items-center gap-2.5 px-0"
							: "items-center justify-between gap-2 px-1",
					)}
				>
					<Link
						href={isDjStudio ? "/studio" : "/overview"}
						prefetch
						onClick={onNavigate}
						title={colapsado ? "GigBlades" : undefined}
						className="group flex min-w-0 items-center gap-2.5"
					>
						<span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-grayscale-12 text-grayscale-1 shadow-2xs transition-transform duration-150 ease-[var(--ease-out-soft)] group-hover:-rotate-3">
							<DiscIcon size={14} weight="fill" />
						</span>
						{!colapsado ? (
							<span className="truncate text-[14px] font-semibold tracking-[-0.02em] text-grayscale-12">
								GigBlades
							</span>
						) : null}
					</Link>

					{onToggle ? (
						<button
							type="button"
							onClick={onToggle}
							aria-label={
								colapsado ? "Expandir barra lateral" : "Colapsar barra lateral"
							}
							title={
								colapsado
									? "Expandir barra lateral (Ctrl+B)"
									: "Colapsar barra lateral (Ctrl+B)"
							}
							className={cn(
								"flex shrink-0 cursor-pointer items-center justify-center rounded-lg text-grayscale-9 transition-[background-color,color,transform] duration-150 ease-[var(--ease-out-soft)] hover:bg-black/[0.06] hover:text-grayscale-12 active:scale-[0.94] dark:hover:bg-white/[0.08]",
								colapsado
									? "size-8 border border-grayscale-4/70 bg-white/70 dark:border-white/[0.10] dark:bg-white/[0.04]"
									: "size-7",
							)}
						>
							<SidebarSimpleIcon size={16} />
						</button>
					) : null}
				</div>
			) : null}

			{/* Navegación agrupada (identico a base-main) */}
			<nav className={cn("mt-1 flex flex-col", colapsado ? "gap-3.5" : "gap-5")}>
				{isDjStudio ? (
					<div className="flex flex-col gap-1.5">
						{!colapsado ? (
							<div className="section-label px-3 pb-0.5">Estudio DJ</div>
						) : null}
						{studioLinks.map(renderNavLink)}
					</div>
				) : (
					<>
						<div className="flex flex-col gap-1.5">
							{platformPrincipales.map(renderNavLink)}
						</div>

						<div className="flex flex-col gap-1.5">
							{colapsado ? (
								<div className="mx-auto my-0.5 h-px w-6 bg-grayscale-4/70 dark:bg-white/[0.10]" />
							) : (
								<div className="section-label px-3 pb-0.5">Operación</div>
							)}
							{platformOperacion.map(renderNavLink)}
						</div>
					</>
				)}

				<div className="flex flex-col gap-1.5">
					{colapsado ? (
						<div className="mx-auto my-0.5 h-px w-6 bg-grayscale-4/70 dark:bg-white/[0.10]" />
					) : (
						<div className="section-label px-3 pb-0.5">Cuenta</div>
					)}
					{renderNavLink({
						href: "/settings",
						label: t("nav.settings", "Ajustes"),
						icon: GearIcon,
					})}
					<button
						type="button"
						onClick={() => void handleSignOut()}
						title={colapsado ? "Cerrar sesión" : undefined}
						className={cn(
							"group flex cursor-pointer items-center rounded-[10px] border border-transparent text-[13px] text-grayscale-10 outline-none transition-[background-color,color,transform] duration-150 ease-[var(--ease-out-soft)] hover:bg-black/[0.05] hover:text-grayscale-12 active:scale-[0.98] dark:hover:bg-white/[0.06]",
							colapsado
								? "mx-auto size-9 justify-center px-0"
								: "gap-2.5 px-3 py-2",
						)}
					>
						<SignOutIcon
							size={16}
							className="shrink-0 text-grayscale-9 transition-[color,transform] duration-150 ease-[var(--ease-out-soft)] group-hover:scale-[1.06] group-hover:text-grayscale-12"
						/>
						{!colapsado ? (
							<span className="truncate">{t("auth.signOut", "Cerrar sesión")}</span>
						) : null}
					</button>
				</div>
			</nav>

			{/* Pie del sidebar: Apariencia + RoleSelector abajo (identico a base-main) */}
			<div className="mt-auto flex flex-col gap-3 pt-2">
				{!colapsado ? (
					<div className="flex items-center justify-between gap-2 px-1.5">
						<span className="text-[11px] font-medium text-grayscale-9">
							Apariencia
						</span>
						<ThemeToggle />
					</div>
				) : (
					<div className="flex justify-center">
						<ThemeToggle />
					</div>
				)}

				{/* Account / Workspace switcher (RoleSelector de base-main) */}
				<div className="relative w-full">
					<button
						type="button"
						onClick={() => setMenuOpen((v) => !v)}
						aria-haspopup="listbox"
						aria-expanded={menuOpen}
						className={cn(
							"group flex cursor-pointer items-center rounded-xl border border-grayscale-3/80 bg-grayscale-1 text-left transition-[border-color,background-color,box-shadow,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-grayscale-4 hover:shadow-[0_1px_2px_rgba(28,22,16,0.04)] active:scale-[0.985] dark:border-white/[0.11] dark:bg-[#161614] dark:hover:border-white/[0.2] dark:hover:bg-[#1b1b19]",
							colapsado
								? "mx-auto size-10 justify-center p-0"
								: "w-full justify-between gap-2 p-2",
						)}
					>
						<div className={cn("flex min-w-0 items-center", !colapsado && "gap-2.5")}>
							<span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-grayscale-3 font-mono text-[11px] font-semibold text-grayscale-12 ring-1 ring-black/10 dark:ring-white/20">
								{initials || "GB"}
							</span>
							{!colapsado ? (
								<div className="flex min-w-0 flex-col leading-none">
									<span className="truncate text-[12.5px] font-semibold text-grayscale-12">
										{displayName}
									</span>
									<span className="mt-1 truncate text-[10.5px] text-grayscale-9">
										{isPlatformAccount
											? isDjStudio
												? "plataforma | estudio dj"
												: "plataforma | admin"
											: "dj | estudio"}
									</span>
								</div>
							) : null}
						</div>
						{!colapsado ? (
							<CaretRightIcon
								size={13}
								className={cn(
									"shrink-0 text-grayscale-8 transition-transform duration-150",
									menuOpen && "rotate-90",
								)}
							/>
						) : null}
					</button>

					{menuOpen ? (
						<>
							<div
								aria-hidden="true"
								className="fixed inset-0 z-40"
								onClick={() => setMenuOpen(false)}
							/>
							<div
								role="listbox"
								aria-label="Opciones de cuenta"
								className={cn(
									"menu-pop absolute bottom-full left-0 z-50 mb-1.5 flex origin-bottom flex-col rounded-xl border border-grayscale-3 bg-grayscale-1 p-1.5 shadow-[0_18px_40px_-16px_rgba(28,22,16,0.35)] dark:border-white/[0.14] dark:bg-[#181816] dark:shadow-[0_20px_44px_-14px_rgba(0,0,0,0.85)]",
									colapsado ? "w-60" : "right-0",
								)}
							>
								{isPlatformAccount ? (
									<>
										<div className="section-label px-2 py-1.5">Cambiar vista</div>
										<button
											type="button"
											onClick={() => {
												setMenuOpen(false);
												onNavigate?.();
												router.push("/overview");
											}}
											className={cn(
												"flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-[12px] transition-colors",
												!isDjStudio
													? "bg-grayscale-2 font-medium text-grayscale-12 dark:bg-grayscale-3"
													: "text-grayscale-11 hover:bg-grayscale-2 dark:hover:bg-grayscale-3/70",
											)}
										>
											<span>Plataforma</span>
											{!isDjStudio ? <CheckIcon size={13} weight="bold" /> : null}
										</button>
										<button
											type="button"
											onClick={() => {
												setMenuOpen(false);
												onNavigate?.();
												router.push("/studio");
											}}
											className={cn(
												"flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-[12px] transition-colors",
												isDjStudio
													? "bg-grayscale-2 font-medium text-grayscale-12 dark:bg-grayscale-3"
													: "text-grayscale-11 hover:bg-grayscale-2 dark:hover:bg-grayscale-3/70",
											)}
										>
											<span>DJ Studio</span>
											{isDjStudio ? <CheckIcon size={13} weight="bold" /> : null}
										</button>
										<div className="my-1 border-t border-grayscale-3/70 dark:border-white/[0.11]" />
									</>
								) : null}

								<div className="section-label px-2 py-1">Idioma</div>
								<div className="grid grid-cols-2 gap-1 px-1 pb-1">
									{(["es", "en"] as const).map((lang) => (
										<button
											key={lang}
											type="button"
											onClick={() => setLanguage(lang)}
											className={cn(
												"flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 text-[11.5px] transition-colors",
												language === lang
													? "bg-grayscale-2 font-medium text-grayscale-12 dark:bg-grayscale-3"
													: "text-grayscale-10 hover:bg-grayscale-2",
											)}
										>
											<span>{lang === "es" ? "Español" : "English"}</span>
											{language === lang ? <CheckIcon size={11} weight="bold" /> : null}
										</button>
									))}
								</div>

								{canInstall ? (
									<button
										type="button"
										onClick={() => {
											setMenuOpen(false);
											void install();
										}}
										className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-[12px] text-grayscale-11 hover:bg-grayscale-2"
									>
										<DesktopIcon size={14} className="text-grayscale-9" />
										<span>Instalar app</span>
									</button>
								) : null}

								<a
									href={gigbladeMarketingSiteUrl()}
									target="_blank"
									rel="noreferrer"
									className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-[12px] text-grayscale-11 hover:bg-grayscale-2"
								>
									<GlobeIcon size={14} className="text-grayscale-9" />
									<span>Abrir gigblades.com</span>
								</a>

								<div className="mt-1 border-t border-grayscale-3/70 pt-1 dark:border-white/[0.11]">
									<button
										type="button"
										onClick={() => void handleSignOut()}
										className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-[12px] font-medium text-red-11 transition-colors hover:bg-red-3/60"
									>
										<SignOutIcon size={14} className="shrink-0" />
										<span>Cerrar sesión</span>
									</button>
								</div>
							</div>
						</>
					) : null}
				</div>
			</div>
		</div>
	);
}

export function PanelSidebar({
	abierto = true,
	onToggle,
}: {
	abierto?: boolean;
	onToggle?: () => void;
}) {
	return (
		<aside
			className={cn(
				"no-scrollbar fixed left-0 top-0 z-40 hidden h-full shrink-0 flex-col overflow-y-auto overflow-x-hidden bg-[#ECEBE7] transition-[width,padding] duration-250 ease-[var(--ease-out-soft)] xl:flex dark:bg-[#090908]",
				abierto ? "w-64 p-4 2xl:w-72" : "w-[68px] px-2.5 py-4",
			)}
		>
			<SidebarNavContent onToggle={onToggle} colapsado={!abierto} />
		</aside>
	);
}

export function PanelMobileHeader() {
	const [open, setOpen] = useState(false);

	return (
		<Dialog.Root open={open} onOpenChange={(nextOpen) => setOpen(nextOpen)}>
			<header className="pointer-events-none fixed inset-x-0 top-0 z-50 border-b border-grayscale-3/70 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur-md xl:hidden dark:border-white/[0.09] dark:bg-[#131312]/95">
				<div className="pointer-events-auto relative mx-auto flex h-14 w-full items-center justify-between px-4">
					<Dialog.Trigger
						aria-label="Abrir navegación"
						className="flex size-10 cursor-pointer items-center justify-center rounded-lg border border-grayscale-3/80 bg-grayscale-1 text-grayscale-11 transition-[background-color,transform] duration-150 hover:bg-grayscale-2 active:scale-[0.95] dark:border-white/[0.12] dark:bg-[#191917] dark:hover:bg-[#222220]"
					>
						<ListIcon size={18} weight="bold" />
					</Dialog.Trigger>
					<Link href="/overview" className="flex items-center gap-2">
						<span className="flex size-7 items-center justify-center rounded-lg bg-grayscale-12 text-grayscale-1">
							<DiscIcon size={14} weight="fill" />
						</span>
						<span className="text-[13px] font-semibold tracking-[-0.01em] text-grayscale-12">
							GigBlades
						</span>
					</Link>
					<div className="flex items-center gap-2 text-grayscale-10">
						<ThemeToggle size={16} />
					</div>
				</div>
			</header>

			<Dialog.Portal>
				<Dialog.Backdrop className="drawer-backdrop fixed inset-0 z-50 bg-black/50 backdrop-blur-xs xl:hidden" />
				<Dialog.Popup className="drawer-panel fixed inset-y-0 left-0 z-50 flex h-dvh w-72 max-w-[calc(100vw-2rem)] flex-col overflow-y-auto overscroll-contain border-r border-grayscale-3 bg-grayscale-1 p-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-xl outline-none xl:hidden dark:border-white/[0.1] dark:bg-[#0e0e0d]">
					<div className="mb-4 flex items-center justify-between border-b border-grayscale-3/80 pb-3 dark:border-white/[0.08]">
						<Dialog.Title className="sr-only">Navegación</Dialog.Title>
						<div className="flex items-center gap-2">
							<span className="flex size-7 items-center justify-center rounded-lg bg-grayscale-12 text-grayscale-1">
								<DiscIcon size={14} weight="fill" />
							</span>
							<span className="text-[13px] font-semibold text-grayscale-12">
								GigBlades
							</span>
						</div>
						<Dialog.Close
							aria-label="Cerrar navegación"
							className="flex size-9 cursor-pointer items-center justify-center rounded-lg border border-grayscale-3 bg-grayscale-1 text-grayscale-11 transition-[background-color,transform] duration-150 hover:bg-grayscale-2 active:scale-[0.95] dark:bg-grayscale-3"
						>
							<XIcon size={15} weight="bold" />
						</Dialog.Close>
					</div>
					<SidebarNavContent onNavigate={() => setOpen(false)} ocultarMarca />
				</Dialog.Popup>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
