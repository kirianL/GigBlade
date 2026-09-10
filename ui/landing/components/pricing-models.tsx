"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { CTALines, IconCTAStart } from "@/app/constant";
import { cn } from "@/lib/utils";
import AppLink from "./app-link";
import SlotLabel from "./slot-label";

const sidebarItems = [
	{
		id: "credits",
		label: "Plan todo incluido",
		desc: "Una suscripción mensual cubre hosting, seguridad y tu página. Sin armar infraestructura por tu cuenta.",
	},
	{
		id: "free-trials",
		label: "Dominio propio",
		desc: "Elegís un dominio como djmarco.com. Lo registramos y administramos nosotros. La renovación anual se cobra al costo, sin margen.",
	},
	{
		id: "subscriptions",
		label: "Plantillas para DJs",
		desc: "Un catálogo de temas pensado para DJs y eventos. No es un constructor genérico: la estética ya está resuelta.",
	},
	{
		id: "usage",
		label: "Tu contenido",
		desc: "Cargás biografía, fotos, redes y un mix o video destacado. Tu página queda con tu imagen, no con la de una red social.",
	},
	{
		id: "seat",
		label: "Formulario de booking",
		desc: "Un canal formal para productoras y clubes. Las solicitudes llegan a tu panel, no a un DM suelto.",
	},
	{
		id: "hybrid",
		label: "Panel del DJ",
		desc: "Gestionás contenido y ves las solicitudes de booking en un solo lugar. Sin tocar hosting ni DNS.",
	},
	{
		id: "rollovers",
		label: "Hosting en cache",
		desc: "La página carga desde cache la mayor parte del tiempo. Rápida para quien te busca desde el celular.",
	},
	{
		id: "enterprise",
		label: "Seguridad de plataforma",
		desc: "Protección anti-spam, aislamiento de datos entre DJs y el mismo estándar para todos. Vos no tenés que configurarlo.",
	},
] as const;

export default function PricingModels() {
	const [activeTab, setActiveTab] = useState<(typeof sidebarItems)[number]>(
		sidebarItems[0],
	);

	return (
		<section id="temas" className="bg-[#000000] w-full overflow-hidden flex flex-col">
			<div className="hidden lg:flex w-full items-center justify-between py-12 xl:py-24 relative z-10 px-4 xl:px-22.75">
				<div className="flex w-full">
					<div>
						<h2 className="text-[40px] leading-[1.1] font-sans tracking-[-2%] font-normal">
							<span className="text-[#FFFFFF99]">Un solo plan.</span>{" "}
							<span className="text-white">Todo técnico resuelto.</span>
						</h2>
						<div className="mt-4 text-[16px] font-sans leading-relaxed tracking-[-1%] font-light">
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
							<div className="relative overflow-hidden flex items-center cursor-pointer justify-between px-4 py-3.5 md:w-50 font-sans bg-brand hover:bg-brand-hover active:bg-brand-hover transition-colors duration-300 whitespace-nowrap" data-slot-hover-root>
								<CTALines />
								<SlotLabel
									text="Ver temas"
									hover
									hoverTint={false}
									className="relative z-10 tracking-tight text-white font-medium"
								/>
								<span className="relative z-10">
									<IconCTAStart />
								</span>
							</div>
						</motion.div>
					</AppLink>
				</div>
			</div>

			<div className="flex lg:hidden flex-col px-4 py-12 relative z-10">
				<h2 className="text-[28px] sm:text-[32px] leading-[1.1] font-sans tracking-[-2%] font-normal">
					<span className="text-[#FFFFFF99]">Un solo plan.</span>{" "}
					<span className="text-white">Todo técnico resuelto.</span>
				</h2>
				<div className="mt-4 text-[15px] font-sans leading-relaxed tracking-[-1%] font-light">
					<span className="text-[#FFFFFF99]">
						Elegís dominio y plantilla.
					</span>{" "}
					<span className="text-[#FFFFFF99]">
						Cargás tu contenido y tu página queda lista para recibir bookings.
					</span>
				</div>
			</div>

			<div className="border-t-0 lg:border-t border-[#292929] w-full relative grid grid-cols-1 lg:grid-cols-[90px_minmax(280px,380px)_1fr]">
				<div className="hidden lg:block border-l border-r border-[#292929]" />

				<div className="relative z-10 flex flex-col border-r border-[#292929] bg-[#000000] py-0 lg:py-8">
					<ul className="flex flex-col">
						{sidebarItems.map((item) => {
							const isActive = activeTab.id === item.id;
							return (
								<li
									key={item.id}
									onClick={() => setActiveTab(item)}
									data-slot-hover-root
									className={cn(
										"flex cursor-pointer flex-col border-b border-[#292929] transition-colors last:border-b-0 lg:border-none",
										isActive && "bg-[#0f0f0f] lg:bg-transparent",
									)}
								>
									<div
										className={cn(
											"flex items-center gap-2 px-4 py-5 font-sans text-[20px] leading-none tracking-[-5%] lg:px-[14px] lg:py-2 lg:text-[20px] lg:leading-[20px]",
											isActive
												? "text-white lg:text-[#FFFFFF99]"
												: "text-[#FFFFFF99] lg:opacity-50",
										)}
									>
										<div className="w-[3px] h-[24px] hidden lg:block">
											{isActive && (
												<motion.div
													layoutId="activeTabIndicator"
													className="w-[3px] h-[24px] bg-brand-glow"
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

									<AnimatePresence>
										{isActive && (
											<motion.div
												initial={{ height: 0, opacity: 0 }}
												animate={{ height: "auto", opacity: 1 }}
												exit={{ height: 0, opacity: 0 }}
												transition={{
													duration: 0.32,
													ease: [0.16, 1, 0.3, 1],
												}}
												className="lg:hidden px-4 border-b border-brand-accent overflow-hidden text-[#FFFFFF99] text-[14px] md:text-[16px] leading-[1.4] tracking-[-2%] font-light text-pretty"
											>
												<div className="pb-6">{item.desc}</div>
											</motion.div>
										)}
									</AnimatePresence>
								</li>
							);
						})}
					</ul>
				</div>

				<div className="hidden lg:flex bg-[#0F0F0F] border-r border-[#292929] items-end p-8 xl:p-12">
					<div className="max-w-xl text-[#FFFFFF99] text-[16px] xl:text-[18px] font-sans leading-relaxed tracking-[-2%] font-light text-pretty">
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
