"use client";
import { useEffect, useRef, useState } from "react";
import { featuresData } from "@/app/constant";
import type { PixelAnimationHandle } from "@/lib/types";
import { FeatureIconAnimation } from "./feature-icon-animation";
import SlotLabel from "./slot-label";

export default function FeatureCardDesktop({
	feature,
}: {
	feature: (typeof featuresData)[number];
}) {
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
			className="group relative flex min-h-[280px] cursor-pointer flex-col justify-between overflow-hidden border-r border-b border-[#292929] bg-[#0F0F0F] p-6 px-4"
			data-slot-hover-root
		>
			{isHoverDevice && (
				<div className="pointer-events-none absolute inset-0 z-0 translate-y-4 opacity-0 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[opacity,transform] group-hover:translate-y-0 group-hover:opacity-100">
					<video
						ref={videoRef}
						src="/images/features/pixel effect.webm"
						preload="none"
						loop
						muted
						playsInline
						className="h-full w-full object-cover hue-rotate-[-115deg] saturate-125"
					/>
				</div>
			)}
			<div className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%] bg-[linear-gradient(to_bottom,rgba(10,10,10,0)_0%,rgba(26,86,214,0.15)_40%,rgba(26,86,214,0.45)_70%,rgba(26,86,214,0.85)_90%)] opacity-0 transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:opacity-100" />

			<div className="relative z-10 flex h-full flex-col gap-24.5">
				<FeatureIconAnimation Icon={feature.Icon} ref={iconRef} />
				<div className="flex flex-col gap-4.5">
					<h3 className="font-sans text-[24px] leading-6 font-normal tracking-[-5%] text-white">
						<SlotLabel
							text={feature.title}
							hover
							options={{ rollBy: "word" }}
						/>
					</h3>
					<p className="w-full pr-4 font-sans text-[16px] leading-[20px] font-light tracking-[-2%] text-pretty text-[#FFFFFF99]">
						{feature.description}
					</p>
				</div>
			</div>
		</div>
	);
}
