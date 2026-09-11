"use client";

import { useState } from "react";
import { faqItems } from "@/lib/faq-items";
import { cn } from "@/lib/utils";

function PlusMinus({ open }: { open: boolean }) {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 16 16"
			fill="none"
			aria-hidden="true"
			className="h-5 w-5"
		>
			<rect x="0" y="0" width="2" height="2" fill="currentColor" />
			<rect x="14" y="0" width="2" height="2" fill="currentColor" />
			<rect x="0" y="14" width="2" height="2" fill="currentColor" />
			<rect x="14" y="14" width="2" height="2" fill="currentColor" />
			<rect x="3" y="7" width="10" height="2" fill="currentColor" />
			<rect
				x="7"
				y="3"
				width="2"
				height="10"
				fill="currentColor"
				className={cn(
					"origin-center transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
					open && "scale-y-0",
				)}
			/>
		</svg>
	);
}

export default function FAQMobile() {
	const [openId, setOpenId] = useState<number | null>(3);

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
			<div className="grid min-h-[500px] w-full grid-cols-1">
				<div className="flex flex-col justify-center border-b border-[#292929] py-12 pr-6 pl-4">
					<h2 className="text-[30px] leading-[1.1] font-normal tracking-[-2%]">
						<span className="font-light text-[#FFFFFF99]">Preguntas</span>
						<br />
						<span className="font-normal text-white">frecuentes</span>
					</h2>
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
								className="group relative flex w-full cursor-pointer flex-col justify-center border-b border-[#292929] bg-transparent text-left last:border-b-0"
							>
								<div
									className={cn(
										"pointer-events-none absolute inset-0 z-0 overflow-hidden transition-opacity duration-500",
										isOpen ? "opacity-100" : "opacity-0",
									)}
								>
									<img
										src="/images/pricing/FAQ/faqbg.svg"
										alt=""
										loading="lazy"
										className="absolute top-0 right-0 h-[400px] w-full border-none object-contain object-top-right opacity-50 hue-rotate-[200deg] saturate-150"
									/>
									<div className="absolute inset-0 bg-linear-to-r from-brand-ink via-brand-ink/88 to-brand/35 mix-blend-multiply" />
								</div>

								<div className="relative z-10 px-4.5 py-[30px]">
									<div className="flex items-center justify-between gap-4">
										<span
											className={cn(
												"text-base tracking-[-2%] transition-colors duration-300",
												isOpen
													? "font-normal text-white"
													: "font-light text-[#FFFFFF80]",
											)}
										>
											{faq.question}
										</span>
										<div
											className={cn(
												"shrink-0 overflow-hidden transition-colors duration-400",
												isOpen ? "text-white" : "text-[#FFFFFF80]",
											)}
										>
											<PlusMinus open={isOpen} />
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
											<div className="flex max-w-[85%] flex-col gap-3.5 pt-5 text-[12px] leading-[16px] font-light tracking-[-0.5%] text-[#ffffff]">
												{faq.answer.split("\n\n").map((paragraph) => (
													<p key={paragraph.slice(0, 24)}>{paragraph}</p>
												))}
											</div>
										</div>
									</div>
								</div>
							</button>
						);
					})}
				</div>
			</div>
		</section>
	);
}
