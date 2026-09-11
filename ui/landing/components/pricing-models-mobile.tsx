"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { planItems } from "@/lib/plan-items";

export default function PricingModelsMobile() {
	const [activeId, setActiveId] = useState<(typeof planItems)[number]["id"]>(
		planItems[0].id,
	);

	return (
		<section className="flex w-full flex-col overflow-hidden bg-[#000000]">
			<div className="relative z-10 flex flex-col px-4 py-12">
				<h2 className="font-sans text-[28px] leading-[1.1] font-normal tracking-[-2%] sm:text-[32px]">
					<span className="text-[#FFFFFF99]">Un solo plan.</span>{" "}
					<span className="text-white">Todo técnico resuelto.</span>
				</h2>
				<div className="mt-4 font-sans text-[15px] leading-relaxed font-light tracking-[-1%]">
					<span className="text-[#FFFFFF99]">Elegís dominio y plantilla.</span>{" "}
					<span className="text-[#FFFFFF99]">
						Cargás tu contenido y tu página queda lista para recibir bookings.
					</span>
				</div>
			</div>

			<div className="relative w-full border-[#292929]">
				<ul className="flex flex-col">
					{planItems.map((item) => {
						const isActive = activeId === item.id;
						return (
							<li
								key={item.id}
								className={cn(
									"flex flex-col border-b border-[#292929] last:border-b-0",
									isActive && "bg-[#0f0f0f]",
								)}
							>
								<button
									type="button"
									onClick={() => setActiveId(item.id)}
									aria-pressed={isActive}
									aria-expanded={isActive}
									className="w-full bg-transparent text-left"
								>
									<div
										className={cn(
											"px-4 py-5 font-sans text-[20px] leading-none tracking-[-5%]",
											isActive ? "text-white" : "text-[#FFFFFF99]",
										)}
									>
										{item.label}
									</div>
								</button>
								<div
									className={cn(
										"grid overflow-hidden border-b border-brand-accent px-4 text-[14px] leading-[1.4] font-light tracking-[-2%] text-pretty text-[#FFFFFF99] transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:text-[16px]",
										isActive ? "grid-rows-[1fr]" : "grid-rows-[0fr] border-b-0",
									)}
								>
									<div className="overflow-hidden">
										<div className="pb-6">{item.desc}</div>
									</div>
								</div>
							</li>
						);
					})}
				</ul>
			</div>
		</section>
	);
}
