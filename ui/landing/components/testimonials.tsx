"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IconArrowLeft, IconArrowRight, IconQuotes } from "@/app/constant";

const testimonialsData = [
	{
		id: 1,
		quote:
			"Quería un sitio propio y no sabía por dónde empezar. GigBlade me dejó la página lista, con dominio y formulario de booking.",
		author: "NOX",
	},
	{
		id: 2,
		quote: "Las productoras por fin tienen un lugar formal donde encontrarme.",
		author: "MARCO",
	},
	{
		id: 3,
		quote:
			"Pago un solo plan y me olvido de hosting, DNS y certificados. Eso era lo que no quería tocar.",
		author: "LUNA",
	},
	{
		id: 4,
		quote: "Dejé de recibir bookings mezclados entre Instagram y WhatsApp.",
		author: "RESIDENTE",
	},
	{
		id: 5,
		quote:
			"No es un constructor genérico. Los temas se sienten de evento, no de cualquier negocio.",
		author: "AFTER HOURS",
	},
	{
		id: 6,
		quote:
			"El dominio se cobra al costo. El resto —página, seguridad y hosting— viene en la suscripción.",
		author: "SELLO",
	},
];

const Testimonials = () => {
	const scrollRef = useRef<HTMLDivElement | null>(null);
	const progressRef = useRef<HTMLDivElement | null>(null);
	const [canScrollLeft, setCanScrollLeft] = useState(false);
	const [canScrollRight, setCanScrollRight] = useState(true);
	// Only mount the hover-effect video on pointer:hover devices. Without this
	// every mobile visitor downloads one copy of the clip per testimonial (6×
	// the file) even though the hover effect they're gated on never triggers.
	const [isHoverDevice, setIsHoverDevice] = useState(false);
	useEffect(() => {
		setIsHoverDevice(window.matchMedia("(hover: hover)").matches);
	}, []);

	const handleScroll = useCallback(() => {
		if (scrollRef.current) {
			const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
			setCanScrollLeft(scrollLeft > 0);
			setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);

			if (progressRef.current) {
				const maxScroll = scrollWidth - clientWidth;
				const progress = maxScroll > 0 ? (scrollLeft / maxScroll) * 100 : 0;
				progressRef.current.style.transform = `translateX(${progress}%)`;
			}
		}
	}, []);

	useEffect(() => {
		handleScroll();
		window.addEventListener("resize", handleScroll);
		return () => window.removeEventListener("resize", handleScroll);
	}, [handleScroll]);

	const scrollByAmount = (amount: number) => {
		if (scrollRef.current) {
			scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
		}
	};

	return (
		<section className="w-full bg-[#000000] text-white overflow-hidden">
			<div className=" mx-auto">
				<div className="px-4 sm:px-6 md:px-4 lg:px-4 xl:px-22.75 pt-[48px] xl:pt-32 pb-[48px] flex flex-row items-start justify-between">
					<h2 className="w-full text-center md:w-auto md:text-left text-[30px] leading-[32px] sm:text-5xl md:text-[40px] font-normal tracking-[-5%]">
						<span className="text-[#FFFFFF99]">Built for </span>
						<span className="text-white">teams</span>
						<br className="sm:hidden" />
						<span className="text-white"> that move fast</span>
					</h2>
					<div className="hidden md:flex items-center space-x-4">
						<button
							onClick={() => scrollByAmount(-400)}
							disabled={!canScrollLeft}
							className="group p-1.5 bg-transparent cursor-pointer flex items-center justify-center transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] border border-[#292929]"
							type="button"
							aria-label="Previous testimonials"
						>
							<IconArrowLeft
								disabled={!canScrollLeft}
								className="w-6 h-6 text-gray-400 hover:text-white"
							/>
						</button>

						<button
							onClick={() => scrollByAmount(400)}
							disabled={!canScrollRight}
							className="group p-1.5 bg-transparent cursor-pointer flex items-center justify-center transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] border border-[#292929]"
							type="button"
							aria-label="Next testimonials"
						>
							<IconArrowRight
								disabled={!canScrollRight}
								className="w-6 h-6 text-gray-400 hover:text-white"
							/>
						</button>
					</div>
				</div>

				<div className="border-t border-[#1A1A1A] w-full" />

				<div className="px-0 xl:pl-22.75">
					<div
						ref={scrollRef}
						onScroll={handleScroll}
						className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar group/track"
						style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
					>
						{testimonialsData.map((testimonial) => (
							<div
								key={testimonial.id}
								className="group cursor-pointer shrink-0 w-[300px] sm:w-[300px] md:w-[360px] snap-start min-h-[360px] flex flex-col justify-between p-4 sm:p-10 border-l border-r border-b border-[#1A1A1A] relative overflow-hidden"
							>
								{isHoverDevice && (
									<div className="absolute inset-x-0 bottom-0 h-[120%] pointer-events-none z-0 overflow-hidden">
										<div className="absolute inset-0 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[opacity,transform] pointer-events-none z-0 hidden md:block">
											<video
												src="/images/testimonials/testimonial section.webm"
												autoPlay
												loop
												muted
												playsInline
												className="w-full h-full object-cover"
											/>
										</div>
									</div>
								)}
								<div className="absolute inset-x-0 bottom-0 h-[70%] bg-[linear-gradient(to_bottom,rgba(10,10,10,0)_0%,rgba(26,86,214,0.15)_40%,rgba(26,86,214,0.45)_70%,rgba(26,86,214,0.85)_90%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0" />
								<div className="relative z-10 flex flex-col h-full justify-start">
									<IconQuotes className="w-8 h-8 text-[#4C4C4C] opacity-60 group-hover:text-brand-glow group-hover:opacity-100 transition-colors duration-500 mb-6" />
									<p className="text-white text-[14px] leading-[18px] sm:text-xl sm:leading-6 font-extralight tracking-[-2%] transition-colors duration-500">
										{testimonial.quote}
									</p>
								</div>
								<div className="relative z-10 font-mono text-sm tracking-[-2%] uppercase text-white opacity-60 group-hover:opacity-100 transition-colors duration-500 mt-33.5">
									{testimonial.author}
								</div>
							</div>
						))}
					</div>
				</div>
				<div className="border-t border-[#1A1A1A] w-full" />

				<div className="flex md:hidden justify-end px-4 mt-6">
					<div className="flex items-center gap-4">
						<button
							onClick={() => scrollByAmount(-400)}
							disabled={!canScrollLeft}
							className="p-1.5 bg-transparent flex items-center justify-center border border-[#292929]"
							type="button"
							aria-label="Previous testimonials"
						>
							<IconArrowLeft
								disabled={!canScrollLeft}
								className="w-6 h-6 text-white"
							/>
						</button>

						<button
							onClick={() => scrollByAmount(400)}
							disabled={!canScrollRight}
							className="p-1.5 bg-transparent flex items-center justify-center border border-[#292929]"
							type="button"
							aria-label="Next testimonials"
						>
							<IconArrowRight
								disabled={!canScrollRight}
								className="w-6 h-6 text-white"
							/>
						</button>
					</div>
				</div>
				<div className="flex justify-center mt-5 md:mt-10 pb-0 md:pb-10">
					<div className="w-[168px] hidden md:block h-1 bg-[#1A1A1A] rounded-full overflow-hidden relative">
						<div
							ref={progressRef}
							className="absolute left-0 top-0 h-full bg-brand-accent w-[84px] rounded-full"
							style={{ transform: "translateX(0%)" }}
						/>
					</div>
				</div>
			</div>

			<style jsx global>{`
				.hide-scrollbar::-webkit-scrollbar {
					display: none;
				}
				.arrow-corners {
					transform-box: fill-box;
					transform-origin: center;
					transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
				}
				.group:hover .arrow-corners {
					transform: scale(1.4);
				}
			`}</style>
		</section>
	);
};

export default Testimonials;
