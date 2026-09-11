"use client";

import { motion } from "motion/react";
import Image from "next/image";
import AppLink from "./app-link";
import {
	forwardRef,
	type MouseEvent,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from "react";
import {
	CTALines,
	IconBlog,
	IconCTAStart,
	IconDashboard,
	IconDiscord,
	IconDocs,
	IconPricing,
	MenuGridIcon,
} from "@/app/constant";
import { getGsap } from "@/lib/lazyGsap";
import { getLenis, scrollToHash, scrollToHashWhenReady } from "@/lib/smooth-scroll";
import SlotLabel from "./slot-label";
import type {
	PageStyle,
	PixelHoverHandle,
	PixelIconComponent,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { DashboardIconPixel } from "./dashboard-icon-pixel";

const NAV_LINKS = [
	{ label: "Temas", href: "/#temas", Icon: IconDocs },
	{ label: "Ejemplos", href: "/#ejemplos", Icon: IconBlog },
	{ label: "Precios", href: "/pricing", Icon: IconPricing },
	{ label: "Acceso", href: "/acceso", Icon: IconDiscord },
];

type GSAPTimeline = {
	play: () => GSAPTimeline;
	reverse: () => GSAPTimeline;
	kill: () => void;
	// biome-ignore lint/suspicious/noExplicitAny: structural shim for GSAP's overloaded .to() signature
	to: (...args: any[]) => GSAPTimeline;
};

const NavIconPixel = forwardRef<PixelHoverHandle, { Icon: PixelIconComponent }>(
	function NavIconPixel({ Icon }, ref) {
		const iconRef = useRef<SVGSVGElement | null>(null);
		const tlRef = useRef<GSAPTimeline | null>(null);

		useImperativeHandle(ref, () => ({
			restart: () => tlRef.current?.play(),
			reverse: () => tlRef.current?.reverse(),
		}));

		useEffect(() => {
			const el = iconRef.current;
			if (!el) return;
			if (window.matchMedia("(max-width: 1023px)").matches) return;
			let cancelled = false;

			getGsap().then((gsap) => {
				if (cancelled) return;
				const pixelEls =
					el.querySelectorAll<SVGPathElement>(".icon-pixel-path");
				if (!pixelEls.length) return;

				const pixels = Array.from(pixelEls).sort((a, b) => {
					const aBox = a.getBBox();
					const bBox = b.getBBox();
					return (
						aBox.x +
						aBox.width / 2 -
						(aBox.y + aBox.height / 2) -
						(bBox.x + bBox.width / 2 - (bBox.y + bBox.height / 2))
					);
				});

				gsap.set(pixels, {
					opacity: 1,
					scale: 1,
					transformOrigin: "left bottom",
					fill: "currentColor",
				});

				tlRef.current = gsap.timeline({ paused: true });
				tlRef
					.current!.to(pixels, {
						opacity: 1,
						scale: 1.08,
						fill: "#FFFFFF",
						duration: 0.12,
						stagger: 0.014,
						ease: "expo.out",
						force3D: true,
					})
					.to(pixels, { scale: 1, duration: 0.16, ease: "expo.out" });
			});

			return () => {
				cancelled = true;
				tlRef.current?.kill();
			};
		}, []);

		return (
			<span className="group/icon relative inline-flex h-8 w-8 items-center justify-center">
				<div className="relative flex h-[16px] w-[16px] items-center justify-center">
					<Icon ref={iconRef} className="h-full w-full text-white" />
				</div>
			</span>
		);
	},
);
NavIconPixel.displayName = "NavIconPixel";

function NavLinkItem({ item }: { item: (typeof NAV_LINKS)[number] }) {
	const iconRef = useRef<PixelHoverHandle | null>(null);
	const isAnchor = item.href.startsWith("#") || item.href.startsWith("/#");

	const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
		if (!isAnchor) return;
		const hash = item.href.startsWith("/#") ? item.href.slice(1) : item.href;
		const el = document.querySelector(hash);
		if (el) {
			e.preventDefault();
			scrollToHash(hash);
		}
	};

	return (
		<div className="nav-link">
			<AppLink
				href={item.href}
				onClick={handleClick}
				data-slot-hover-root
				className="group inline-flex items-center py-2.5 text-[#FFFFFF99] hover:text-white transition-colors duration-200"
				onMouseEnter={() => iconRef.current?.restart()}
				onMouseLeave={() => iconRef.current?.reverse()}
			>
				<NavIconPixel Icon={item.Icon} ref={iconRef} />
				<SlotLabel
					text={item.label}
					hover
					className="font-mono text-[14px] uppercase tracking-widest overflow-hidden"
				/>
			</AppLink>
		</div>
	);
}

export default function Navbar({
	animateIntro: _animateIntro = true,
}: {
	animateIntro?: boolean;
}) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const dashboardIconRef = useRef<PixelHoverHandle | null>(null);
	const barRef = useRef<HTMLDivElement | null>(null);
	const [menuOpen, setMenuOpen] = useState(false);
	const [isLoggedIn, setIsLoggedIn] = useState(false);

	useEffect(() => {
		setIsLoggedIn(
			document.cookie
				.split("; ")
				.find((row) => row.startsWith("logged_in_hint="))
				?.split("=")[1] === "1",
		);
	}, []);

	useEffect(() => {
		if (!menuOpen) return;

		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") setMenuOpen(false);
		};
		const onResize = () => {
			if (window.matchMedia("(min-width: 1024px)").matches) {
				setMenuOpen(false);
			}
		};

		const scrollY = window.scrollY;
		const { body, documentElement } = document;
		const prev = {
			overflow: body.style.overflow,
			position: body.style.position,
			top: body.style.top,
			left: body.style.left,
			right: body.style.right,
			width: body.style.width,
		};

		body.style.overflow = "hidden";
		body.style.position = "fixed";
		body.style.top = `-${scrollY}px`;
		body.style.left = "0";
		body.style.right = "0";
		body.style.width = "100%";
		documentElement.style.overflow = "hidden";

		window.addEventListener("keydown", onKey);
		window.addEventListener("resize", onResize);
		getLenis()?.stop();

		return () => {
			window.removeEventListener("keydown", onKey);
			window.removeEventListener("resize", onResize);
			getLenis()?.start();
			body.style.overflow = prev.overflow;
			body.style.position = prev.position;
			body.style.top = prev.top;
			body.style.left = prev.left;
			body.style.right = prev.right;
			body.style.width = prev.width;
			documentElement.style.overflow = "";
			window.scrollTo(0, scrollY);
		};
	}, [menuOpen]);

	return (
		<div
			style={
				{ "--page-pad": "max(2.5rem, calc((100vw - 1440px) / 2))" } as PageStyle
			}
			ref={containerRef}
			className="relative"
		>
			<div
				ref={barRef}
				className="site-nav fixed top-0 right-0 left-0 z-80 border-t border-b border-[#292929] bg-[#0F0F0F] px-4 md:px-(--page-pad)"
			>
				<div className="pointer-events-none absolute top-0 bottom-0 left-4 md:left-(--page-pad) border-l border-[#292929]" />
				<div className="pointer-events-none absolute top-0 bottom-0 right-4 md:right-(--page-pad) border-r border-[#292929]" />
				<nav className="nav-root flex h-14 items-center justify-between bg-[#0F0F0F] px-3 font-mono text-xs uppercase md:px-1">
					<AppLink href="/" className="shrink-0">
						<Image
							src="/images/navbar/autumnlogo.svg"
							width={114}
							height={28}
							alt="GigBlade"
							unoptimized
							priority
							className="nav-logo ml-1 block h-auto w-[90px] sm:w-[110px] lg:w-[114px]"
							sizes="114px"
						/>
					</AppLink>

					<div className="hidden items-center gap-8 lg:flex">
						{NAV_LINKS.map((item) => (
							<NavLinkItem key={item.label} item={item} />
						))}
					</div>

					<div className="nav-dashboard hidden lg:block">
						<motion.div
							initial="initial"
							whileHover="hover"
							whileTap={{ scale: 0.97 }}
							className="relative"
						>
							<AppLink
								href={isLoggedIn ? "/dashboard" : "/acceso"}
								data-slot-hover-root
								className="relative inline-flex cursor-pointer items-center gap-2 overflow-hidden whitespace-nowrap bg-brand px-4 py-3.5 text-white transition-colors duration-300 hover:bg-brand-hover active:bg-brand-hover"
								onMouseEnter={() => dashboardIconRef.current?.restart()}
								onMouseLeave={() => dashboardIconRef.current?.reverse()}
							>
								<CTALines />
								<div className="relative z-10 flex items-center gap-2">
									<DashboardIconPixel
										Icon={IconDashboard}
										ref={dashboardIconRef}
									/>
									<SlotLabel
										text="Panel"
										hover
										hoverTint={false}
										className="font-sans font-medium tracking-tight"
									/>
								</div>
							</AppLink>
						</motion.div>
					</div>

					<button
						type="button"
						className="mr-0 flex h-14 w-12 shrink-0 cursor-pointer items-center justify-center text-[#FFFFFF99] transition-colors duration-300 active:text-white lg:hidden"
						onClick={() => setMenuOpen((open) => !open)}
						aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
						aria-expanded={menuOpen}
					>
						<MenuGridIcon isOpen={menuOpen} />
					</button>
				</nav>
			</div>
			<div className="h-14" aria-hidden="true" />

			<div
				className={cn(
					"fixed inset-x-0 top-14 bottom-0 z-[70] flex flex-col overflow-x-hidden overflow-y-auto overscroll-contain bg-black px-4 pb-[max(2rem,env(safe-area-inset-bottom))] font-mono uppercase md:px-(--page-pad) lg:hidden",
					"transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
					menuOpen
						? "pointer-events-auto opacity-100"
						: "pointer-events-none opacity-0",
				)}
				aria-hidden={!menuOpen}
				inert={!menuOpen ? true : undefined}
			>
				<div className="flex flex-col">
					{NAV_LINKS.map((item) => {
						const isAnchor =
							item.href.startsWith("#") || item.href.startsWith("/#");
						const isExternal = item.href.startsWith("http");
						return (
							<AppLink
								key={item.label}
								href={item.href}
								target={isExternal ? "_blank" : undefined}
								onClick={
									isAnchor
										? (e) => {
												const hash = item.href.startsWith("/#")
													? item.href.slice(1)
													: item.href;
												setMenuOpen(false);
												e.preventDefault();
												scrollToHashWhenReady(hash);
											}
										: () => setMenuOpen(false)
								}
								className="flex min-h-14 items-center gap-4 border-b border-[#292929] px-2 py-4 text-sm tracking-[-1%] text-[#ffffff99] transition-colors duration-200 active:bg-[#141414] active:text-white"
							>
								<item.Icon className="h-3.5 w-3.5 shrink-0" />
								<span>{item.label}</span>
							</AppLink>
						);
					})}
				</div>
				<div className="mt-auto flex flex-col">
					<div className="border-t border-[#292929] py-1.5" />
					<AppLink
						href="/acceso"
						onClick={() => setMenuOpen(false)}
						className="flex min-h-12 items-center justify-between gap-4 bg-brand px-4 py-3 text-sm tracking-widest text-white transition-colors duration-300 active:bg-brand-hover"
					>
						<span className="text-sm tracking-[-2%]">Creá tu página</span>
						<IconCTAStart className="h-3.5 w-3.5" />
					</AppLink>
					<div className="border-b border-[#292929] py-1.5" />
					<div className="border-b border-[#292929] py-1.5" />
					<div className="border-b border-[#292929] py-1.5" />
				</div>
			</div>
		</div>
	);
}
