"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { useRef } from "react";
import SlotLabel from "./slot-label";

// ScrollTrigger touches `window` on import, so defer plugin registration to
// the client. Doing this at module scope breaks SSR.
if (typeof window !== "undefined") {
	gsap.registerPlugin(ScrollTrigger);
}

const cards = [
	{
		tint: "bg-brand-tint-1",
		icon: "/images/production/uptime2.svg",
		metric: "$65",
		label: "Al mes, todo incluido",
		description:
			"Hosting, seguridad, página y dominio propio en una sola suscripción.",
		clipart: true,
	},
	{
		tint: "bg-brand-tint-2",
		icon: "/images/production/latency.svg",
		metric: "Cache",
		label: "Carga rápida",
		description:
			"Tu página se sirve desde cache la mayor parte del tiempo. Quien te busca no espera.",
		clipart: true,
	},
	{
		tint: "bg-brand-tint-3",
		icon: "/images/production/uptiime.svg",
		metric: "Al costo",
		label: "Dominio anual",
		description:
			"La renovación del dominio se cobra transparente, al costo real, sin margen.",
		clipart: true,
	},
	{
		tint: "bg-brand-tint-4",
		icon: "/images/production/churn.svg",
		metric: "Aislado",
		label: "Tus datos",
		description:
			"Cada DJ tiene sus datos separados. El mismo estándar de seguridad protege a todos.",
		clipart: true,
	},
];

export default function ProductionScale() {
	const containerRef = useRef<HTMLDivElement | null>(null);

	useGSAP(
		() => {
			// Skip the entrance animation on non-desktop viewports, or when
			// hydration landed well after first paint. The cards are server-
			// rendered visible; hiding them via `gsap.set({ opacity: 0 })`
			// after the user may have already scrolled to/past the section
			// would cause a visible flash.
			if (window.matchMedia("(max-width: 1023px)").matches) {
				return;
			}

			const isMobile = window.innerWidth < 768;
			const cardY = isMobile ? 16 : 30;

			gsap.set(".ps-card", { opacity: 0, y: cardY, scale: 0.985, force3D: true });

			const tl = gsap.timeline({
				scrollTrigger: {
					trigger: ".ps-section",
					start: "top 75%",
					once: true,
				},
				defaults: { overwrite: "auto", force3D: true },
			});

			const cardEls = gsap.utils.toArray<HTMLElement>(".ps-card");
			cardEls.forEach((card, i) => {
				tl.to(
					card,
					{
						opacity: 1,
						y: 0,
						scale: 1,
						duration: 0.78,
						ease: "expo.out",
					},
					0.22 + i * 0.1,
				);
			});
		},
		{ scope: containerRef },
	);

	return (
		<div ref={containerRef} className="overflow-hidden">
			<section className="ps-section flex flex-col lg:flex-row items-start justify-between py-12 lg:py-16 gap-12 lg:gap-0 bg-[#0F0F0F]">
				<div className="flex px-4 xl:pl-22.5 lg:pr-0 flex-col my-auto gap-4 lg:gap-6 pt-2 w-full lg:w-auto">
					<div className="leading-none lg:leading-10">
						<p className="text-[#FFFFFF99] tracking-[-4%] text-[30px] lg:text-[40px] font-normal">
							Estás en
						</p>
						<h2 className="text-white tracking-[-4%] text-[30px] lg:text-[40px] font-normal mt-1 lg:mt-0">
							buenas manos
						</h2>
					</div>
					<p className="text-[#FFFFFF99] font-light text-[16px] lg:text-sm lg:w-sm leading-[20px] lg:leading-5">
						Un motor compartido, el mismo estándar de seguridad para cada DJ.{" "}
						<span className="text-white">
							Vos te ocupás de tu set
							<br className="hidden lg:block" /> y de tu imagen. Lo técnico
							queda de este lado.
						</span>
					</p>
				</div>

				<div className="flex flex-col items-end gap-3 lg:gap-4 w-full pl-6 lg:pl-0 lg:w-[50%] [--card-step:24px] lg:[--card-step:52px]">
					{cards.map((card, i) => (
						<div
							key={card.metric}
							className={`ps-card relative flex items-center justify-between pl-4 pr-3 py-4 lg:pl-6 lg:pr-10 lg:py-3.5 gap-2 lg:gap-6 ${card.tint}`}
							style={{
								width: `calc(100% - (var(--card-step) * ${i}))`,
							}}
						>
							<div className="flex flex-col gap-1 min-w-[95px] lg:min-w-auto shrink-0">
								<div className="flex items-center gap-1.5 lg:gap-2">
									<Image
										src={card.icon}
										width={18}
										height={18}
										alt={card.label}
										className="h-[14px] w-[14px] lg:h-[18px] lg:w-[18px]"
										sizes="18px"
									/>
									<span className="ps-metric text-xl lg:text-2xl font-medium tracking-[-5%] text-brand-ink">
										<SlotLabel text={card.metric} playOnView />
									</span>
								</div>
								<span className="text-[11px] lg:text-[14px] leading-[1] lg:leading-4.5 tracking-[-2%] font-normal text-brand-ink/60">
									{card.label}
								</span>
							</div>

							<p className="text-[10.5px] lg:text-[14px] text-brand-ink/80 font-normal leading-[1.3] lg:leading-4.5 tracking-[0] lg:tracking-[-2%] flex-1 lg:flex-none lg:w-66 lg:shrink-0 text-left">
								{card.description}
							</p>

							{card.clipart && (
								<Image
									src="/images/production/clipart.svg"
									width={12}
									height={12}
									alt="clipart"
									className="absolute right-0 bottom-0 max-lg:h-[8px] max-lg:w-[8px]"
									sizes="12px"
								/>
							)}
						</div>
					))}
				</div>
			</section>
		</div>
	);
}
