"use client";

import { motion } from "motion/react";
import AppLink from "./app-link";
import { useEffect, useState } from "react";
import { CTALines, IconCTADocs, IconCTAStart } from "@/app/constant";
import SlotLabel from "./slot-label";
import { useFineHover } from "@/lib/use-fine-hover";
import { AuroraBackground } from "@/components/background-gradient/aurora-background";
import { AuroraFrame } from "@/components/background-gradient/aurora-frame";

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
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const canHover = useFineHover();

	// Read the hint cookie after mount to avoid SSR/CSR hydration mismatch.
	useEffect(() => {
		setIsLoggedIn(getLoggedInHintCookie() === true);
	}, []);

	return (
		<div>
			<div className="relative mb-0 flex flex-col items-stretch bg-[#0F0F0F] pb-0">
				<div className="flex justify-between">
					<div className="mt-26 flex flex-col gap-6 bg-[#0F0F0F] px-4 py-8 xl:px-22.75">
						<div className="flex w-full flex-col gap-6 px-0 lg:px-0">
							<h1 className="hero-enter w-full max-w-sm font-sans text-[44px] leading-[44px] tracking-[-4%] sm:max-w-[480px] md:max-w-xl md:text-[56px] md:leading-14">
								<span className="font-normal text-[#FFFFFF99]">
									Tu página de DJ,&nbsp;con
								</span>{" "}
								<span className="block text-white md:inline">
									<SlotLabel
										text="dominio propio"
										options={{ rollBy: "word" }}
									/>
								</span>
							</h1>
							<p
								className="hero-enter w-full max-w-xs font-sans text-[14px] leading-5 font-light tracking-[-2%] text-[#FFFFFF99] sm:max-w-[480px] md:max-w-xl md:text-[16px]"
								style={{ ["--enter" as string]: 1 }}
							>
								Presencia digital lista para bookings. Elegís plantilla,
								cargás tu contenido y{" "}
								<span className="font-light text-white">
									nosotros nos ocupamos del resto
								</span>
								: hosting, seguridad y dominio.
							</p>
						</div>
					</div>
					<div
						className="hero-enter pointer-events-none relative hidden min-h-[525px] w-[50vw] max-w-[720px] overflow-hidden border-l border-[#292929] xl:pointer-events-auto xl:block"
						style={{ ["--enter" as string]: 1 }}
					>
						<AuroraBackground className="absolute inset-0 h-full w-full" />
						<AuroraFrame />
					</div>
				</div>
				<div className="border-t border-[#292929]" />
				<div
					className="hero-enter flex w-full flex-nowrap items-center overflow-hidden bg-[#0F0F0F] px-4 xl:px-22.75"
					style={{ ["--enter" as string]: 2 }}
				>
					<div className="w-full md:w-fit md:flex-shrink-0">
						<AppLink href={isLoggedIn ? "/dashboard" : "/acceso"}>
							<motion.div
								initial="initial"
								whileHover={canHover ? "hover" : undefined}
								className="relative"
							>
								<div
									className="relative flex min-h-12 touch-manipulation cursor-pointer items-center justify-between gap-1.5 overflow-hidden bg-brand px-3 py-2 font-sans transition-colors duration-300 md:min-h-0 md:w-50 md:gap-2.5 md:px-4 md:py-3.5 [@media(hover:hover)_and_(pointer:fine)]:hover:bg-brand-hover active:bg-brand-hover"
									data-slot-hover-root
								>
									<CTALines />
									<SlotLabel
										text={isLoggedIn ? "Panel" : "Creá tu página"}
										hover
										hoverTint={false}
										className="relative z-10 whitespace-nowrap text-[12px] font-medium tracking-[-2%] text-white uppercase md:text-base md:normal-case"
									/>
									<span className="relative z-10 scale-95 md:scale-100">
										<IconCTAStart />
									</span>
								</div>
							</motion.div>
						</AppLink>
					</div>

					<div className="w-full md:w-fit md:flex-shrink-0">
						<AppLink href="/#ejemplos">
							<motion.div
								initial="initial"
								whileHover={canHover ? "hover" : undefined}
								className="relative"
							>
								<div
									className="relative flex min-h-12 touch-manipulation cursor-pointer items-center justify-between gap-1.5 overflow-hidden border-r border-[#292929] bg-[#0F0F0F] px-3 py-2 font-sans text-white transition-colors duration-300 md:min-h-0 md:w-50 md:gap-2.5 md:px-4 md:py-3.5 [@media(hover:hover)_and_(pointer:fine)]:hover:bg-[#FFFFFF1F] active:bg-[#FFFFFF1F]"
									data-slot-hover-root
								>
									<CTALines />
									<SlotLabel
										text="Ver ejemplos"
										hover
										className="relative z-10 text-[12px] tracking-[-2%] uppercase whitespace-nowrap md:text-[16px] md:normal-case"
									/>
									<span className="relative z-10 scale-100">
										<IconCTADocs />
									</span>
								</div>
							</motion.div>
						</AppLink>
					</div>

					<div className="ml-2 hidden h-10.5 flex-1 flex-nowrap gap-2 md:ml-3 md:flex md:h-12.5 md:gap-3">
						<div className="hidden h-full border-r border-[#292929] md:block" />
						<div className="hidden h-full border-r border-[#292929] md:block" />
						<div className="hidden h-full border-r border-[#292929] md:block" />
						<div className="hidden h-full border-r border-[#292929] md:block" />
						<div className="hidden h-full border-r border-[#292929] md:block" />
						<div className="hidden h-full border-r border-[#292929] md:block" />
						<div className="hidden h-full border-r border-[#292929] md:block" />
						<div className="hidden h-full border-r border-[#292929] md:block" />
						<div className="hidden h-full border-r border-[#292929] md:block" />
					</div>
				</div>
				<div className="border-b border-[#292929]" />
			</div>
		</div>
	);
}
