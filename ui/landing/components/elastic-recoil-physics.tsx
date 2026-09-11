"use client";

import { useMotionValue, useSpring, useTransform } from "motion/react";
import { useEffect, useState, type RefObject } from "react";
import AnimatedFooterImage from "./animated-footer-image";

export default function ElasticRecoilPhysics({
	targetRef,
}: {
	targetRef: RefObject<HTMLDivElement | null>;
}) {
	const liftAmount = useMotionValue(0);
	const [showFooter, setShowFooter] = useState(false);

	const animatedLift = useSpring(liftAmount, {
		stiffness: 170,
		damping: 28,
		mass: 0.75,
		restDelta: 0.0005,
		restSpeed: 0.01,
	});
	const y = useTransform(animatedLift, [0, 400], [0, -580]);

	useEffect(() => {
		const unsubY = y.on("change", (value) => {
			const node = targetRef.current;
			if (node) node.style.transform = `translateY(${value}px)`;
		});
		const unsubLift = animatedLift.on("change", (value) => {
			setShowFooter(value > 1);
		});
		return () => {
			unsubY();
			unsubLift();
			if (targetRef.current) targetRef.current.style.transform = "";
		};
	}, [animatedLift, targetRef, y]);

	useEffect(() => {
		let timeout: ReturnType<typeof setTimeout> | null = null;
		let recoilFired = false;
		let isTouching = false;

		const triggerRebound = () => {
			liftAmount.set(0);
			if (!recoilFired) {
				recoilFired = true;
				window.dispatchEvent(new CustomEvent("elastic-recoil"));
			}
		};

		const handleWheel = (e: WheelEvent) => {
			const isAtBottom =
				window.innerHeight + window.pageYOffset >=
				document.documentElement.scrollHeight - 5;

			if (isAtBottom && e.deltaY > 0) {
				const normalizedDelta =
					e.deltaMode === 1
						? e.deltaY * 20
						: e.deltaMode === 2
							? e.deltaY * 300
							: e.deltaY;
				liftAmount.set(Math.min(liftAmount.get() + normalizedDelta * 0.5, 400));
				recoilFired = false;

				if (timeout) clearTimeout(timeout);
				timeout = setTimeout(() => {
					if (!isTouching) {
						triggerRebound();
					}
				}, 1500);
			} else if (e.deltaY < 0) {
				if (!isTouching) {
					liftAmount.set(0);
					recoilFired = false;
				}
			}
		};

		let lastTouchY = 0;
		let atBottomOnStart = false;
		const handleTouchStart = (e: TouchEvent) => {
			isTouching = true;
			lastTouchY = e.touches[0].clientY;
			atBottomOnStart =
				window.innerHeight + window.pageYOffset >=
				document.documentElement.scrollHeight - 5;
			recoilFired = false;
			if (timeout) clearTimeout(timeout);
		};

		const handleTouchMove = (e: TouchEvent) => {
			const currentY = e.touches[0].clientY;
			const delta = lastTouchY - currentY;
			lastTouchY = currentY;

			if (!atBottomOnStart) {
				atBottomOnStart =
					window.innerHeight + window.pageYOffset >=
					document.documentElement.scrollHeight - 5;
				return;
			}

			if (delta > 0) {
				liftAmount.set(Math.min(liftAmount.get() + delta * 4, 400));
				recoilFired = false;
			} else if (liftAmount.get() > 0) {
				liftAmount.set(Math.max(0, liftAmount.get() + delta * 4));
			}
		};

		const handleTouchEnd = () => {
			isTouching = false;
			atBottomOnStart = false;
			if (liftAmount.get() > 0) {
				if (timeout) clearTimeout(timeout);
				timeout = setTimeout(() => {
					triggerRebound();
				}, 1500);
			}
		};

		window.addEventListener("wheel", handleWheel, { passive: true });
		window.addEventListener("touchstart", handleTouchStart, { passive: true });
		window.addEventListener("touchmove", handleTouchMove, { passive: true });
		window.addEventListener("touchend", handleTouchEnd, { passive: true });
		window.addEventListener("touchcancel", handleTouchEnd, { passive: true });

		return () => {
			if (timeout) clearTimeout(timeout);
			window.removeEventListener("wheel", handleWheel);
			window.removeEventListener("touchstart", handleTouchStart);
			window.removeEventListener("touchmove", handleTouchMove);
			window.removeEventListener("touchend", handleTouchEnd);
			window.removeEventListener("touchcancel", handleTouchEnd);
		};
	}, [liftAmount]);

	return showFooter ? <AnimatedFooterImage /> : null;
}
