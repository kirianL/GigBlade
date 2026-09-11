"use client";

import { useEffect, useRef } from "react";
import {
	chromatic,
	slotText,
	type SlotOptions,
	type SlotTextController,
} from "slot-text";

export const brandSlotColor = () =>
	chromatic({
		from: 145,
		spread: 48,
		saturation: 72,
		lightness: 58,
	});

type SlotLabelProps = {
	text: string;
	className?: string;
	hover?: boolean;
	hoverTint?: boolean;
	playOnView?: boolean;
	options?: SlotOptions;
};

export default function SlotLabel({
	text,
	className,
	hover = false,
	hoverTint = true,
	playOnView = false,
	options,
}: SlotLabelProps) {
	const ref = useRef<HTMLSpanElement>(null);
	const ctrl = useRef<SlotTextController | null>(null);
	const textRef = useRef(text);
	const optionsRef = useRef(options);
	textRef.current = text;
	optionsRef.current = options;

	const ensure = () => {
		const el = ref.current;
		if (!el) return null;
		if (!ctrl.current) {
			ctrl.current = slotText(el, textRef.current, optionsRef.current);
		}
		return ctrl.current;
	};

	useEffect(() => {
		return () => {
			ctrl.current?.destroy();
			ctrl.current = null;
		};
	}, []);

	useEffect(() => {
		if (!ctrl.current) return;
		if (ctrl.current.value === text) return;
		ctrl.current.set(text, optionsRef.current);
	}, [text]);

	useEffect(() => {
		if (!playOnView) return;
		const el = ref.current;
		if (!el) return;

		let primed = false;
		const io = new IntersectionObserver(
			([entry]) => {
				if (!primed) {
					primed = true;
					if (entry.isIntersecting || entry.intersectionRatio > 0) {
						io.disconnect();
					}
					return;
				}
				if (!entry.isIntersecting) return;
				ensure()?.set(textRef.current, {
					...optionsRef.current,
					skipUnchanged: false,
					direction: "down",
				});
				io.disconnect();
			},
			{ threshold: 0.45 },
		);
		io.observe(el);
		return () => io.disconnect();
	}, [playOnView]);

	useEffect(() => {
		if (!hover) return;
		const el = ref.current;
		if (!el) return;

		const media = window.matchMedia("(hover: hover) and (pointer: fine)");
		const root = el.closest("[data-slot-hover-root]") ?? el;

		const enter = () => {
			ensure()?.set(textRef.current, {
				skipUnchanged: false,
				interrupt: true,
				direction: "down",
				...optionsRef.current,
			});
		};

		const bind = () => {
			if (!media.matches) return;
			root.addEventListener("mouseenter", enter);
		};

		const unbind = () => {
			root.removeEventListener("mouseenter", enter);
		};

		const onChange = () => {
			unbind();
			bind();
		};

		bind();
		media.addEventListener("change", onChange);
		return () => {
			unbind();
			media.removeEventListener("change", onChange);
		};
	}, [hover, hoverTint]);

	return (
		<span
			ref={ref}
			className={`origin-left transform-gpu ${className ?? ""}`}
			suppressHydrationWarning
		>
			{text}
		</span>
	);
}
