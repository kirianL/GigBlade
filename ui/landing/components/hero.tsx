"use client";

import { motion } from "motion/react";
import AppLink from "./app-link";
import { useEffect, useRef, useState } from "react";
import { CTALines, IconCTADocs, IconCTAStart } from "@/app/constant";
import { getGsap } from "@/lib/lazyGsap";
import SlotLabel from "./slot-label";

const getLoggedInHintCookie = () => {
	if (typeof window === "undefined") return null;
	return (
		document.cookie
			.split("; ")
			.find((row) => row.startsWith("logged_in_hint="))
			?.split("=")[1] === "1"
	);
};

export default function Hero() {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	// Gate the xl-only hero video behind a viewport check so mobile never
	// downloads the looping webm that `hidden xl:block` would still fetch.
	const [isXl, setIsXl] = useState(false);

	// Read the hint cookie after mount to avoid SSR/CSR hydration mismatch.
	useEffect(() => {
		setIsLoggedIn(getLoggedInHintCookie() === true);
	}, []);

	useEffect(() => {
		const mq = window.matchMedia("(min-width: 1280px)");
		const update = () => setIsXl(mq.matches);
		update();
		mq.addEventListener("change", update);
		return () => mq.removeEventListener("change", update);
	}, []);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		let ctx: { revert: () => void } | null = null;
		let cancelled = false;
		const root = container.querySelector(".hero-root");

		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			root?.classList.add("is-ready");
			return;
		}

		if (window.innerWidth < 1024) {
			const id = requestAnimationFrame(() => {
				if (!cancelled) root?.classList.add("is-ready");
			});
			return () => {
				cancelled = true;
				cancelAnimationFrame(id);
			};
		}

		getGsap().then((gsap) => {
			if (cancelled) return;
			ctx = gsap.context(() => {
				gsap.set(".hero-copy", {
					opacity: 0,
					y: 16,
					force3D: true,
				});
				gsap.set(".hero-visual", {
					opacity: 0,
					y: 16,
					force3D: true,
				});
				gsap.set(".hero-cta", { opacity: 0, y: 10, force3D: true });

				const tl = gsap.timeline({
					defaults: { overwrite: "auto", force3D: true, ease: "expo.out" },
				});

				tl.to(".hero-copy", {
					opacity: 1,
					y: 0,
					duration: 0.7,
					stagger: 0.05,
				})
					.to(
						".hero-visual",
						{
							opacity: 1,
							y: 0,
							duration: 0.7,
						},
						"-=0.58",
					)
					.to(
						".hero-cta",
						{
							opacity: 1,
							y: 0,
							duration: 0.5,
							stagger: 0.04,
						},
						"-=0.52",
					);
			}, container);
		});

		return () => {
			cancelled = true;
			ctx?.revert();
		};
	}, []);

	return (
		<div ref={containerRef}>
			<div className="relative hero-root flex flex-col items-stretch pb-0 mb-0 bg-[#0F0F0F]">
				<div className="flex justify-between">
					<div className="flex flex-col gap-6 px-4 xl:px-22.75 py-8 bg-[#0F0F0F] mt-26">
						<div className="flex flex-col gap-6 w-full px-0 lg:px-0">
							<h1
								className="hero-copy text-[44px] md:text-[56px] w-full max-w-sm sm:max-w-[480px] md:max-w-xl leading-[44px] tracking-[-4%] md:leading-14 font-sans"
								style={{ ["--enter" as string]: 0 }}
							>
								<span className="text-[#FFFFFF99] font-normal">
									Tu página de DJ,&nbsp;con
								</span>{" "}
								<span className="text-white block md:inline">
									<SlotLabel
										text="dominio propio"
										options={{ rollBy: "word" }}
									/>
								</span>
							</h1>
							<p
								className="hero-copy tracking-[-2%] w-full max-w-xs sm:max-w-[480px] md:max-w-xl text-[#FFFFFF99] md:text-[16px] text-[14px] font-light leading-5 font-sans"
								style={{ ["--enter" as string]: 0.4 }}
							>
								Presencia digital lista para bookings. Elegís plantilla,
								cargás tu contenido y{" "}
								<span className="text-white font-light">
									nosotros nos ocupamos del resto
								</span>
								: hosting, seguridad y dominio.
							</p>
						</div>
					</div>
					{/*
					  Keep the wrapper itself in the SSR HTML with `hidden xl:block`
					  so desktop gets the correct half-width hero layout from the
					  first paint. The video is client-gated on `isXl` so mobile
					  never downloads it.
					*/}
					<div
						className="hero-visual relative w-[50vw] max-w-[720px] min-h-[525px] p-16 py-0 mx-auto hidden xl:block"
						style={{ ["--enter" as string]: 1 }}
					>
						{isXl && (
							<div className="absolute inset-0 z-0 pointer-events-none">
								<video
									src="/images/pricing-models/pricingbg.webm"
									autoPlay
									loop
									muted
									playsInline
									className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-100"
								/>
							</div>
						)}
					</div>
				</div>
				<div className="border-t border-[#292929]" />
				<div className="flex flex-nowrap items-center xl:px-22.75 px-4 bg-[#0F0F0F] w-full overflow-hidden">
					{/* Primary CTA */}
					<div
						className="hero-cta w-full md:w-fit md:flex-shrink-0"
						style={{ ["--enter" as string]: 1.5 }}
					>
						<AppLink
							href={isLoggedIn ? "/dashboard" : "/acceso"}
						>
							<motion.div
								initial="initial"
								whileHover="hover"
								whileTap="hover"
								className="relative"
							>
								{/* Adjusted px-3 for mobile, md:px-4 for desktop */}
								<div className="relative overflow-hidden flex items-center gap-1.5 md:gap-2.5 cursor-pointer justify-between py-2 px-3 md:px-4 md:py-3.5 md:w-50 font-sans bg-brand hover:bg-brand-hover transition-colors duration-300" data-slot-hover-root>
									<CTALines />
									<SlotLabel
										text={isLoggedIn ? "Panel" : "Creá tu página"}
										hover
										hoverTint={false}
										className="relative z-10 tracking-[-2%] uppercase md:normal-case text-white font-medium text-[12px] md:text-base whitespace-nowrap"
									/>
									<span className="relative z-10 scale-95 md:scale-100">
										<IconCTAStart />
									</span>
								</div>
							</motion.div>
						</AppLink>
					</div>

					{/* Secondary CTA */}
					<div
						className="hero-cta w-full md:w-fit md:flex-shrink-0"
						style={{ ["--enter" as string]: 2 }}
					>
						<AppLink href="/#ejemplos">
							<motion.div
								initial="initial"
								whileHover="hover"
								whileTap="hover"
								className="relative"
							>
								<div className="relative overflow-hidden flex items-center gap-1.5 md:gap-2.5 border-r border-[#292929] text-white cursor-pointer justify-between py-2 px-3 md:px-4 md:py-3.5 md:w-50 font-sans bg-[#0F0F0F] hover:bg-[#FFFFFF1F] transition-colors duration-300" data-slot-hover-root>
									<CTALines />
									<SlotLabel
										text="Ver ejemplos"
										hover
										className="relative z-10 tracking-[-2%] text-[12px] uppercase md:normal-case md:text-[16px] whitespace-nowrap"
									/>
									<span className="relative z-10 scale-100">
										<IconCTADocs />
									</span>
								</div>
							</motion.div>
						</AppLink>
					</div>

					<div
						className="hero-cta hidden md:flex flex-nowrap gap-2 md:gap-3 ml-2 md:ml-3 h-10.5 md:h-12.5 flex-1"
						style={{ ["--enter" as string]: 2.2 }}
					>
						<div className="border-r border-[#292929] h-full hidden md:block" />
						<div className="border-r border-[#292929] h-full hidden md:block" />
						<div className="border-r border-[#292929] h-full hidden md:block" />

						<div className="border-r border-[#292929] h-full hidden md:block" />
						<div className="border-r border-[#292929] h-full hidden md:block" />
						<div className="border-r border-[#292929] h-full hidden md:block" />
						<div className="border-r border-[#292929] h-full hidden md:block" />
						<div className="border-r border-[#292929] h-full hidden md:block" />
						<div className="border-r border-[#292929] h-full hidden md:block" />
					</div>
				</div>
				<div className="border-b border-[#292929]" />
			</div>
		</div>
	);
}
