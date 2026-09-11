"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { CTALines, IconCTAStart } from "@/app/constant";
import { planItems } from "@/lib/plan-items";
import { cn } from "@/lib/utils";
import AppLink from "./app-link";
import SlotLabel from "./slot-label";

export default function PricingModelsDesktop() {
	const [activeTab, setActiveTab] = useState<(typeof planItems)[number]>(
		planItems[0],
	);

	return (
		<section className="flex w-full flex-col overflow-hidden bg-[#000000]">
			<div className="relative z-10 flex w-full items-center justify-between px-4 py-12 xl:px-22.75 xl:py-24">
				<div className="flex w-full">
					<div>
						<h2 className="font-sans text-[40px] leading-[1.1] font-normal tracking-[-2%]">
							<span className="text-[#FFFFFF99]">Un solo plan.</span>{" "}
							<span className="text-white">Todo técnico resuelto.</span>
						</h2>
						<div className="mt-4 font-sans text-[16px] leading-relaxed font-light tracking-[-1%]">
							<span className="text-[#FFFFFF99]">
								Elegís dominio y plantilla.
							</span>{" "}
							<span className="text-[#FFFFFF99]">
								Cargás tu contenido y tu página queda lista para recibir
								bookings.
							</span>
						</div>
					</div>
				</div>
				<div className="hero-cta shrink-0">
					<AppLink href="/pricing">
						<motion.div
							initial="initial"
							whileHover="hover"
							whileTap="tap"
							className="relative"
						>
							<div
								className="relative flex cursor-pointer items-center justify-between overflow-hidden bg-brand px-4 py-3.5 font-sans whitespace-nowrap transition-colors duration-300 hover:bg-brand-hover active:bg-brand-hover md:w-50"
								data-slot-hover-root
							>
								<CTALines />
								<SlotLabel
									text="Ver temas"
									hover
									hoverTint={false}
									className="relative z-10 font-medium tracking-tight text-white"
								/>
								<span className="relative z-10">
									<IconCTAStart />
								</span>
							</div>
						</motion.div>
					</AppLink>
				</div>
			</div>

			<div className="relative grid w-full grid-cols-[90px_minmax(280px,380px)_1fr] border-t border-[#292929]">
				<div className="border-l border-r border-[#292929]" />

				<div className="relative z-10 flex flex-col border-r border-[#292929] bg-[#000000] py-8">
					<ul className="flex flex-col">
						{planItems.map((item) => {
							const isActive = activeTab.id === item.id;
							return (
								<li key={item.id} className="flex flex-col">
									<button
										type="button"
										onClick={() => setActiveTab(item)}
										aria-pressed={isActive}
										data-slot-hover-root
										className="w-full bg-transparent text-left"
									>
										<div
											className={cn(
												"flex items-center gap-2 px-[14px] py-2 font-sans text-[20px] leading-[20px] tracking-[-5%]",
												isActive
													? "text-[#FFFFFF99]"
													: "text-[#FFFFFF99] opacity-50",
											)}
										>
											<div className="h-[24px] w-[3px]">
												{isActive && (
													<motion.div
														layoutId="activeTabIndicator"
														className="h-[24px] w-[3px] bg-brand-glow"
														transition={{
															type: "spring",
															stiffness: 420,
															damping: 40,
															mass: 0.55,
														}}
													/>
												)}
											</div>
											<SlotLabel
												text={item.label}
												hover
												options={{
													rollBy: "word",
													duration: 520,
													stagger: 70,
													bounce: 0.06,
												}}
											/>
										</div>
									</button>
								</li>
							);
						})}
					</ul>
				</div>

				<div className="flex items-end border-r border-[#292929] bg-[#0F0F0F] p-8 xl:p-12">
					<div className="max-w-xl font-sans text-[16px] leading-relaxed font-light tracking-[-2%] text-pretty text-[#FFFFFF99] xl:text-[18px]">
						<AnimatePresence mode="wait">
							<motion.div
								key={activeTab.id}
								initial={{ opacity: 0, y: 5 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -5 }}
								transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
							>
								{activeTab.desc}
							</motion.div>
						</AnimatePresence>
					</div>
				</div>
			</div>
		</section>
	);
}
