"use client";
import { motion } from "motion/react";
import AppLink from "./app-link";
import { IconArrowRightSmall, IconTick } from "@/app/constant";
import { cn } from "@/lib/utils";
import SlotLabel from "./slot-label";

type PlanFeature = { label: string; note?: string };

type Plan = {
	name: string;
	price: string;
	description: string;
	features: PlanFeature[];
	buttonText: string;
	href: string;
};

const plans: Plan[] = [
	{
		name: "PLAN",
		price: "65",
		description: "Todo incluido. Un solo precio, sin armar infraestructura.",
		features: [
			{ label: "Página con dominio personalizado" },
			{ label: "Plantilla del catálogo para DJs" },
			{ label: "Formulario de booking anti-spam" },
			{ label: "Panel de contenido y solicitudes" },
			{ label: "Hosting, seguridad y cache" },
			{ label: "Datos aislados de otros DJs" },
			{
				label: "Renovación de dominio",
				note: "al costo real, sin margen",
			},
			{ label: "Soporte de plataforma" },
		],
		buttonText: "Empezá ahora",
		href: "/acceso",
	},
	{
		name: "CUSTOM",
		price: "Custom",
		description: "Varios DJs, un sello o un roster que necesita el mismo estándar.",
		features: [
			{ label: "Todo lo del plan" },
			{ label: "Varias páginas en el mismo motor" },
			{ label: "Dominios administrados juntos" },
			{ label: "Acompañamiento para el alta" },
			{ label: "Mismo aislamiento por DJ" },
		],
		buttonText: "Hablemos",
		href: "/acceso",
	},
];

export default function Pricing() {
	return (
		<>
			<section id="pricing" className="bg-[#000000] w-full scroll-mt-16">
				<div className="flex flex-col px-4 sm:px-8 py-12 md:py-16 xl:px-22.75">
					<div className="text-white flex flex-col gap-6 lg:gap-0">
						<div className="mx-auto w-full max-w-2xl px-4 lg:px-8 pt-10 lg:pt-8 pb-16 lg:pb-18 text-center">
							<h1 className="text-[30px] leading-[32px] md:leading-[40px] md:text-3xl lg:text-[40px] tracking-[-4%] text-white font-normal font-sans">
								Un plan. Todo incluido.
							</h1>
							<p className="mt-4 md:mt-5 text-[#FFFFFF99] text-pretty font-light leading-[18px] tracking-[-2%] md:font-extralight text-[16px] md:leading-[1.6]">
								US$ 65 al mes cubre hosting, seguridad y dominio. La renovación
								anual del dominio se cobra al costo real, sin margen.
							</p>
						</div>

						{/* Pricing Columns */}
						<div className="grid grid-cols-1 md:grid-cols-2 relative z-60 gap-8 lg:gap-0">
							{plans.map((plan) => {
								const isHighlighted = plan.name === "PLAN";
								const price = plan.price;
								const opensExternally = plan.href.startsWith("http");

								return (
									<div
										key={plan.name}
										className={cn(
											"relative flex flex-col border lg:border-0 transition-colors duration-300",
											isHighlighted ? "border-brand-glow" : "border-[#292929]",
										)}
									>
										{isHighlighted && (
											<div className="hidden lg:block absolute -inset-px z-20 pointer-events-none border border-transparent [border-image:linear-gradient(to_bottom,var(--color-brand-glow),#000000)_1]"></div>
										)}

										{isHighlighted && (
											<div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 bg-black text-[14px] font-mono tracking-[-1%] text-white px-3 py-1.5 md:p-2.5 border border-brand-glow">
												RECOMENDADO
											</div>
										)}

										<div
											className={
												"flex flex-col h-full px-4 md:px-5 lg:px-8 pt-10 md:pt-10 lg:pt-15 pb-6 md:pb-0 relative z-10 w-full overflow-hidden"
											}
										>
											<div className="mb-6">
												<span className="inline-block px-3 py-1 bg-brand-accent/20 text-brand-glow text-[12px] md:text-[13px] lg:text-[16px] font-mono tracking-[-2%] uppercase mb-3 md:mb-2">
													{plan.name}
												</span>
												<div className="flex items-start gap-1 mb-2">
													{price !== "Custom" && (
														<span className="text-sm md:text-base lg:text-xl text-white mt-1.5 md:mt-0">
															$
														</span>
													)}
													<span className="text-[30px] md:text-[40px] leading-[44px] lg:text-5xl text-white font-normal tracking-[-2%] font-sans">
														{price}
													</span>
													{price !== "Custom" && (
														<span className="text-[#FFFFFF99] font-light self-end text-[13px] md:text-sm lg:text-base tracking-[-2%] mb-1.5 md:mb-0">
															/mes
														</span>
													)}
												</div>
												<p className="md:text-white font-light md:font-extralight text-[13px] md:text-[16px] tracking-[-2%] leading-[18px] md:leading-5 w-full md:w-[95%] text-pretty">
													{plan.description}
												</p>
											</div>

											<div className="border-t border-[#27272A] w-full mb-6"></div>

											<ul className="flex flex-col gap-3 md:gap-4 grow mb-10 md:mb-16.5">
												{plan.features.map((feature) => (
													<li
														key={feature.label}
														className="flex items-start gap-3"
													>
														<IconTick className="w-4 h-4 mt-[3px] shrink-0" />
														<span className="md:text-white font-light text-[14px] md:text-[16px]">
															{feature.label}
															{feature.note && (
																<span className="block text-[#FFFFFF99] font-light text-[13px] md:text-[15px]">
																	{feature.note}
																</span>
															)}
														</span>
													</li>
												))}
											</ul>

											<div className="flex w-full mb-0 md:mb-8 mt-auto mx-auto pt-4 md:pt-0">
												<motion.div
													initial="initial"
													whileHover="hover"
													whileTap="hover"
													className="w-full"
												>
													<AppLink
														href={plan.href}
														target={opensExternally ? "_blank" : undefined}
														rel={opensExternally ? "noopener" : undefined}
														data-slot-hover-root
														className="group cursor-pointer w-full min-h-11 flex items-center justify-between transition-colors duration-300 border bg-transparent py-1 md:py-0 hover:bg-brand active:bg-brand border-[#292929]"
													>
														<span className="text-white text-[16px] md:text-[18px] pl-4 flex items-center tracking-[-1%] font-sans">
															<SlotLabel
																text={plan.buttonText}
																hover
																hoverTint={false}
															/>
														</span>
														<div className="flex items-center justify-center w-8 h-8 shrink-0 md:w-[26px] md:h-[26px] transition-colors duration-300 m-1.5 md:m-2.5 bg-[#514D5A] text-white group-hover:bg-white group-hover:text-brand-accent group-active:bg-white group-active:text-brand-accent">
															<IconArrowRightSmall className="w-4 h-4" />
														</div>
													</AppLink>
												</motion.div>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
