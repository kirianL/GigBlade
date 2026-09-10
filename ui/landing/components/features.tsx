"use client";
import { useEffect, useRef, useState } from "react";
import { featuresData } from "@/app/constant";
import type { PixelAnimationHandle } from "@/lib/types";
import { FeatureIconAnimation } from "./feature-icon-animation";
import SlotLabel from "./slot-label";

function FeatureCard({ feature }: { feature: (typeof featuresData)[number] }) {
	// Only mount the hover-effect video on pointer:hover devices. The video is
	// already CSS-hidden on mobile via `hidden md:block`, but CSS `display:none`
	// does NOT stop `<video autoPlay>` from fetching, so without this every
	// mobile visitor downloads one copy per feature card (≈ 9 × the file).
	const [isHoverDevice, setIsHoverDevice] = useState(false);
	useEffect(() => {
		setIsHoverDevice(window.matchMedia("(hover: hover)").matches);
	}, []);

	const iconRef = useRef<PixelAnimationHandle | null>(null);
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const hoveringRef = useRef(false);
	const playPromiseRef = useRef<Promise<void> | null>(null);

	const playHover = () => {
		if (!isHoverDevice) return;
		hoveringRef.current = true;
		iconRef.current?.play();
		const video = videoRef.current;
		if (!video) return;
		playPromiseRef.current = video.play().catch(() => undefined);
	};

	const stopHover = () => {
		if (!isHoverDevice) return;
		hoveringRef.current = false;
		iconRef.current?.reverse();
		const video = videoRef.current;
		if (!video) return;
		const pending = playPromiseRef.current;
		const halt = () => {
			if (!hoveringRef.current) video.pause();
		};
		if (pending) {
			void pending.then(halt);
			return;
		}
		halt();
	};

	return (
		<div
			onMouseEnter={playHover}
			onMouseLeave={stopHover}
			className="group relative flex px-4 md:px-4 flex-col justify-between p-6 bg-[#0F0F0F] min-h-[200px] md:min-h-[280px] border-r border-b border-[#292929] overflow-hidden cursor-pointer"
			data-slot-hover-root
		>
			{isHoverDevice && (
				<div className="absolute inset-0 opacity-0 translate-y-4 md:group-hover:opacity-100 md:group-hover:translate-y-0 pointer-events-none z-0 hidden md:block transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[opacity,transform]">
					<video
						ref={videoRef}
						src="/images/features/pixel effect.webm"
						preload="none"
						loop
						muted
						playsInline
						className="w-full h-full object-cover hue-rotate-[-115deg] saturate-125"
					/>
				</div>
			)}
			{/* Hover Gradient Overlay */}
			<div className="absolute inset-x-0 bottom-0 h-[70%] bg-[linear-gradient(to_bottom,rgba(10,10,10,0)_0%,rgba(26,86,214,0.15)_40%,rgba(26,86,214,0.45)_70%,rgba(26,86,214,0.85)_90%)] opacity-0 md:group-hover:opacity-100 transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none" />

			<div className="relative z-10 flex flex-col h-full gap-[42px] md:gap-24.5">
				<feature.Icon className="w-6 h-6 text-white md:hidden" />
				<div className="hidden md:block">
					<FeatureIconAnimation Icon={feature.Icon} ref={iconRef} />
				</div>
				<div className="flex flex-col gap-2 md:gap-4.5">
					<h3 className="text-white font-normal tracking-[-5%] leading-6 text-[20px] md:text-[24px] font-sans">
						<SlotLabel text={feature.title} hover options={{ rollBy: "word" }} />
					</h3>
					<p className="text-[#FFFFFF99] w-full font-light tracking-[-2%] text-[14px] md:text-[16px] font-sans leading-[18px] md:leading-[20px] pr-2 md:pr-4 text-pretty">
						{feature.description}
					</p>
				</div>
			</div>
		</div>
	);
}

export default function Features() {
	return (
		<section className="bg-[#000000] w-full">
			<div className="flex flex-col px-4 md:px-4 sm:px-8 py-12 md:py-16 xl:px-22.75 items-start">
				<h2 className="text-[30px] md:text-[40px] leading-[32px] md:leading-[44px] font-sans tracking-[-4%]">
					<div className="text-[#FFFFFF99]">Todo lo que necesitás</div>
					<div className="text-white">para verte profesional.</div>
				</h2>
				<div className="mt-4 text-[16px] tracking-[-2%] font-sans font-light text-[#FFFFFF99] leading-[20px] max-w-[420px]">
					Página, dominio y booking,{" "}
					<span className="text-white">sin tocar lo técnico.</span>
				</div>
			</div>

			<div className="border-t border-[#292929] w-full" />
			<div className="grid grid-cols-1 gap-[-3px]  md:grid-cols-2 lg:grid-cols-3 xl:px-22.75 border-[#292929] [&>*:last-child]:border-b-0 md:[&>*:nth-last-child(-n+2)]:border-b-0 lg:[&>*:nth-last-child(-n+3)]:border-b-0 *:border-l md:[&>*:nth-child(2n)]:border-l-0 lg:[&>*:nth-child(3n+1)]:border-l lg:[&>*:nth-child(3n+2)]:border-l-0 lg:[&>*:nth-child(3n)]:border-l-0">
				{featuresData.map((feature, i) => (
					<FeatureCard key={i} feature={feature} />
				))}
				{/* <div className="bg-[#0f0f0f] w-full h-full min-h-[280px] hidden lg:block border-r border-b border-[#292929]" /> */}
			</div>
		</section>
	);
}
