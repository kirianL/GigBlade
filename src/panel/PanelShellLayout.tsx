"use client";

import {
  CaretRightIcon,
  DiscIcon,
  SidebarSimpleIcon,
} from "@phosphor-icons/react";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/panel/auth-client";
import { BootScreen } from "@/panel/BootScreen";
import { AppErrorBoundary } from "@/panel/AppErrorBoundary";
import { PanelMobileHeader, PanelSidebar } from "@/panel/PanelSidebar";
import { prefetchHomePanelRoute } from "@/panel/prefetch";
import { cn } from "@/panel/cn";

function getRouteLabel(pathname: string): string {
  if (pathname === "/overview") return "Resumen";
  if (pathname === "/djs") return "DJs";
  if (pathname === "/referidos") return "Referidos y comisiones";
  if (pathname === "/distribucion") return "Finanzas y reparto";
  if (pathname === "/bookings" || pathname === "/studio/bookings")
    return "Contrataciones";
  if (pathname === "/lista") return "Lista de espera";
  if (pathname === "/domains") return "Dominios";
  if (pathname === "/health") return "Estado de páginas";
  if (pathname === "/plan") return "Plan";
  if (pathname === "/settings") return "Ajustes";
  if (pathname === "/studio") return "Mi página";
  if (pathname === "/studio/content") return "Contenido y diseño";
  if (pathname === "/studio/domains") return "Dominio propio";
  if (pathname === "/studio/visitas") return "Visitas";
  return "Espacio de trabajo";
}

function PanelGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session, isPending: sessionLoading } = useSession();
  const [sidebarAbierto, setSidebarAbierto] = useState(true);

  const panelUser = session?.user as
    | { role?: string; slug?: string }
    | undefined;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b") {
        event.preventDefault();
        setSidebarAbierto((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (sessionLoading || !session) return;
    const timer = window.setTimeout(() => {
      prefetchHomePanelRoute(panelUser?.role, queryClient);
    }, 150);
    return () => window.clearTimeout(timer);
  }, [sessionLoading, session, panelUser?.role, queryClient]);

  useEffect(() => {
    if (sessionLoading) return;
    if (!session) {
      const qs = searchParams.toString();
      const destination = qs ? `${pathname}?${qs}` : pathname;
      const next =
        destination && destination !== "/"
          ? `?next=${encodeURIComponent(destination)}`
          : "";
      router.replace(`/sign-in${next}`);
      return;
    }
    if (panelUser?.role === "dj" && !pathname.startsWith("/studio")) {
      const studio = panelUser.slug
        ? `/studio?dj=${encodeURIComponent(panelUser.slug)}`
        : "/studio";
      router.replace(studio);
    }
  }, [
    sessionLoading,
    session,
    panelUser?.role,
    panelUser?.slug,
    pathname,
    searchParams,
    router,
  ]);

  if (sessionLoading && !session) return <BootScreen />;
  if (!session) return <BootScreen />;
  if (panelUser?.role === "dj" && !pathname.startsWith("/studio")) {
    return <BootScreen />;
  }

  const seccionActual = getRouteLabel(pathname);

	return (
		<div className="flex min-h-dvh w-full overflow-x-hidden bg-white text-grayscale-12 xl:h-dvh xl:overflow-hidden xl:bg-[#ECEBE7] dark:bg-[#181817] dark:xl:bg-[#090908]">
			<PanelSidebar
				abierto={sidebarAbierto}
				onToggle={() => setSidebarAbierto((prev) => !prev)}
			/>
			<PanelMobileHeader />

			<main
				className={cn(
					"flex min-h-dvh w-full min-w-0 flex-1 flex-col pt-[calc(3.5rem+env(safe-area-inset-top))] transition-[padding-left] duration-250 ease-[var(--ease-out-soft)] xl:h-dvh xl:min-h-0 xl:overflow-hidden xl:pt-0",
					sidebarAbierto ? "xl:pl-64 2xl:pl-72" : "xl:pl-[68px]",
				)}
			>
				{/* Franja superior fija conectada al sidebar (identico a base-main AppLayout.tsx) */}
				<div className="hidden h-12 shrink-0 items-center gap-2 px-5 text-[12px] text-grayscale-9 xl:flex">
					{!sidebarAbierto ? (
						<button
							type="button"
							onClick={() => setSidebarAbierto(true)}
							aria-label="Expandir barra lateral"
							title="Expandir barra lateral (Ctrl+B)"
							className="flex size-7 cursor-pointer items-center justify-center rounded-lg text-grayscale-10 transition-[background-color,color,transform] duration-150 ease-[var(--ease-out-soft)] hover:bg-black/[0.06] hover:text-grayscale-12 active:scale-[0.94] dark:hover:bg-white/[0.08]"
						>
							<SidebarSimpleIcon size={16} />
						</button>
					) : null}

          <div className="flex items-center gap-1.5">
            <DiscIcon size={13} className="text-grayscale-8" />
            <span className="font-medium text-grayscale-10">GigBlades</span>
            <CaretRightIcon size={11} className="text-grayscale-7" />
            <span className="font-medium text-grayscale-12">
              {seccionActual}
            </span>
          </div>
        </div>

        {/* Marco redondeado fijo con scroll interno (identico a base-main) */}
        <div className="flex flex-1 flex-col bg-white xl:min-h-0 xl:overflow-hidden xl:rounded-tl-[20px] xl:border-l xl:border-t xl:border-[#DAD8D2] dark:bg-[#181817] dark:xl:border-white/[0.1]">
          <div className="no-scrollbar flex flex-1 flex-col overscroll-y-contain xl:overflow-y-auto">
            <div className="mx-auto flex w-full max-w-[84rem] flex-1 flex-col px-4 pb-[calc(2.5rem+env(safe-area-inset-bottom))] pt-4 md:px-8 md:pb-[calc(2.5rem+env(safe-area-inset-bottom))] md:pt-8 xl:px-10 xl:py-8 2xl:px-12 2xl:py-10">
              <AppErrorBoundary
                pathname={pathname}
                message="No se pudo abrir esta página. Probá otra del menú."
              >
                <Suspense fallback={<BootScreen fullPage={false} />}>
                  {children}
                </Suspense>
              </AppErrorBoundary>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export function PanelShellLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<BootScreen />}>
      <PanelGuard>{children}</PanelGuard>
    </Suspense>
  );
}
