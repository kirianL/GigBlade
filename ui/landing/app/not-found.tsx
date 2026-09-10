"use client";
import { motion } from "motion/react";
import Image from "next/image";
import { IconArrowRightSmall } from "@/app/constant";
import AppLink from "@/components/app-link";
import AppScroll from "@/components/app-scroll";
import SiteFrame from "@/components/site-frame";

export default function NotFound() {
	return (
		<>
			<AppScroll />
			<SiteFrame>
				<div className="relative flex min-h-[calc(100vh-100px)] w-full flex-1 flex-col items-center justify-center">
					<div className="absolute inset-0 z-0 h-full w-full overflow-hidden">
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ duration: 1, ease: "easeOut" }}
							className="absolute inset-0 h-full w-full"
						>
							<Image
								src="/images/404.svg"
								alt="404 Background City Base"
								fill
								sizes="100vw"
								className="object-cover object-center"
								priority
							/>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, display: "none" }}
							animate={{
								opacity: [0, 1, 0.8, 1, 0.6, 0],
								display: ["block", "block", "block", "block", "block", "none"],
								x: [0, -15, 20, -10, 15, 0],
								y: [0, 8, -15, 5, -5, 0],
								filter: [
									"brightness(3) contrast(200%) hue-rotate(90deg)",
									"brightness(2) contrast(300%) invert(30%)",
									"brightness(1.5) contrast(150%) hue-rotate(-45deg)",
									"brightness(3) contrast(200%) hue-rotate(180deg)",
									"brightness(2) contrast(150%)",
									"brightness(1)",
								],
								clipPath: [
									"inset(10% 0% 60% 0%)",
									"inset(20% 0% 30% 0%)",
									"inset(80% 0% 5% 0%)",
									"inset(40% 0% 40% 0%)",
									"inset(5% 0% 80% 0%)",
									"inset(0% 0% 0% 0%)",
								],
							}}
							transition={{
								duration: 0.45,
								ease: "easeInOut",
								delay: 0.1,
								times: [0, 0.2, 0.6, 0.75, 0.9, 1],
							}}
							className="pointer-events-none absolute inset-0 z-10 h-full w-full mix-blend-screen"
						>
							<Image
								src="/images/404.svg"
								alt="404 Background City Glitch"
								fill
								sizes="100vw"
								className="scale-105 object-cover object-center"
								priority
							/>
						</motion.div>
					</div>

					<div className="relative z-10 mt-[-40px] flex w-full flex-col items-center justify-center px-4 text-center">
						<Image
							src="/images/autumn-notfound.svg"
							alt="Autumn Logo"
							width={64}
							height={64}
							sizes="64px"
							className="mb-6 h-[56px] w-[56px] md:h-[64px] md:w-[64px]"
						/>

						<h1 className="mb-3 font-sans text-[48px] leading-[1.1] font-normal tracking-[-3%] text-white md:text-[64px]">
							Page not found
						</h1>

						<p className="mb-8 text-center text-[15px] font-light tracking-[-1%] text-[#FFFFFF99] md:text-[18px]">
							The page you are looking for doesn&apos;t exist or has been moved.
						</p>

						<AppLink href="/">
							<button className="group relative flex h-[48px] w-[200px] items-stretch justify-between border border-brand bg-brand transition-colors duration-300 hover:bg-brand-hover md:h-[54px] md:w-[210px]">
								<span className="flex items-center pl-6 font-sans text-[14px] tracking-[-1%] text-white md:text-[15px]">
									Back to home
								</span>
								<div className="m-1 flex w-[36px] shrink-0 items-center justify-center bg-white text-brand transition-colors duration-300 md:m-1.5 md:w-[40px]">
									<IconArrowRightSmall className="h-4 w-4" />
								</div>
							</button>
						</AppLink>
					</div>
				</div>
			</SiteFrame>
		</>
	);
}
