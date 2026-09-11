"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { AnimatedPlusMinus } from "@/app/constant";
import { faqItems } from "@/lib/faq-items";
import { cn } from "@/lib/utils";

export default function FAQDesktop() {
	const [openId, setOpenId] = useState<number | null>(3);

	const springConfig = {
		type: "spring" as const,
		stiffness: 380,
		damping: 38,
		mass: 0.7,
		restDelta: 0.0005,
		restSpeed: 0.01,
	};

	return (
		<section
			className="relative overflow-hidden border-b border-[#292929] bg-[#000000] text-white"
			style={{
				width: "calc(100% + var(--page-pad) * 2)",
				marginLeft: "calc(var(--page-pad) * -1)",
				paddingLeft: "var(--page-pad)",
				paddingRight: "var(--page-pad)",
			}}
		>
			<div className="grid min-h-[500px] w-full grid-cols-2">
				<div className="flex flex-col justify-center border-r border-b border-[#292929] py-[60px] pr-12 pl-4 xl:pl-[90px]">
					<h2 className="text-[40px] leading-[1.1] font-normal tracking-[-2%]">
						<span className="font-light text-[#FFFFFF99]">Preguntas</span>
						<br />
						<span className="font-normal text-white">frecuentes</span>
					</h2>
				</div>

				<div className="h-full w-full border-b border-[#292929]" />

				<div className="relative z-0 h-full w-full border-r border-[#292929]">
					<div className="absolute bottom-0 h-full w-full pb-32" />
				</div>

				<div className="relative z-10 flex h-full w-full flex-col">
					{faqItems.map((faq) => {
						const isOpen = openId === faq.id;

						return (
							<button
								key={faq.id}
								type="button"
								onClick={() => setOpenId(isOpen ? null : faq.id)}
								aria-expanded={isOpen}
								className={cn(
									"group relative flex w-full cursor-pointer flex-col justify-center border-b border-[#292929] bg-transparent text-left transition-colors duration-300 last:border-b-0",
									!isOpen && "hover:bg-[#080808]",
								)}
							>
								<div
									className={cn(
										"pointer-events-none absolute inset-0 z-0 overflow-hidden transition-opacity duration-500",
										isOpen ? "opacity-100" : "opacity-0",
									)}
								>
									<div className="absolute inset-0 hidden bg-white/[0.03] md:group-hover:block" />
									<img
										src="/images/pricing/FAQ/faqbg.svg"
										alt=""
										loading="lazy"
										className="absolute top-0 right-0 h-full w-full border-none object-cover object-right opacity-50 hue-rotate-[200deg] saturate-150"
									/>
									<div className="absolute inset-0 bg-linear-to-r from-brand-ink via-brand-ink/88 to-brand/35 mix-blend-multiply" />
								</div>

								<div className="relative z-10 px-4 py-[30px] lg:px-[20px]">
									<div className="flex items-center justify-between gap-4">
										<span
											className={cn(
												"text-base tracking-[-2%] transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:text-[18px]",
												isOpen
													? "font-normal text-white"
													: "font-light text-[#FFFFFF80] md:group-hover:text-white",
											)}
										>
											{faq.question}
										</span>
										<div className="shrink-0 overflow-hidden">
											<AnimatedPlusMinus
												isOpen={isOpen}
												className={cn(
													"h-5 w-5 transition-colors duration-400",
													isOpen
														? "text-white"
														: "text-[#FFFFFF80] md:group-hover:text-white",
												)}
											/>
										</div>
									</div>

									<div
										className={cn(
											"grid transition-[grid-template-rows,opacity] duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]",
											isOpen
												? "grid-rows-[1fr] opacity-100"
												: "grid-rows-[0fr] opacity-0",
										)}
									>
										<div className="overflow-hidden">
											<AnimatePresence initial={false}>
												{isOpen && (
													<motion.div
														initial={{ y: -15, opacity: 0 }}
														animate={{ y: 0, opacity: 1 }}
														exit={{ y: -10, opacity: 0 }}
														transition={{
															opacity: {
																duration: 0.28,
																ease: [0.16, 1, 0.3, 1],
															},
															y: springConfig,
														}}
														className="flex max-w-[85%] flex-col gap-3.5 pt-5 text-[14px] leading-[20px] font-light tracking-[-0.5%] text-[#ffffff]"
													>
														{faq.answer.split("\n\n").map((paragraph) => (
															<p key={paragraph.slice(0, 24)}>{paragraph}</p>
														))}
													</motion.div>
												)}
											</AnimatePresence>
										</div>
									</div>
								</div>
							</button>
						);
					})}

					<div
						className="pointer-events-none relative z-0 px-8 py-[30px] opacity-0 select-none lg:px-[20px]"
						aria-hidden="true"
					>
						<div className="flex items-center justify-between gap-4">
							<h3 className="text-base tracking-[-2%] text-transparent select-none lg:text-[18px]">
								&nbsp;
							</h3>
							<div className="h-5 w-5 shrink-0" />
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
