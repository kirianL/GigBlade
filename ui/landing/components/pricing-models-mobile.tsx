"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import { planItems } from "@/lib/plan-items";

export default function PricingModelsMobile() {
	const [activeId, setActiveId] = useState<(typeof planItems)[number]["id"]>(
		planItems[0].id,
	);
	const panelId = useId();

	return (
		<section className="flex w-full flex-col [overflow-anchor:none] bg-[#000000]">
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
						const itemPanelId = `${panelId}-${item.id}`;
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
									aria-controls={isActive ? itemPanelId : undefined}
									className="w-full bg-transparent text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white"
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
								{isActive ? (
									<div
										id={itemPanelId}
										className="border-b border-brand-accent px-4 text-[14px] leading-[1.4] font-light tracking-[-2%] text-pretty text-[#FFFFFF99] md:text-[16px]"
									>
										<div className="grid pb-6">
											{planItems.map((sizer) => (
												<p
													key={sizer.id}
													className="col-start-1 row-start-1 invisible"
													aria-hidden="true"
												>
													{sizer.desc}
												</p>
											))}
											<p className="col-start-1 row-start-1">{item.desc}</p>
										</div>
									</div>
								) : null}
							</li>
						);
					})}
				</ul>
			</div>
		</section>
	);
}
