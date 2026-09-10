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

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		ctrl.current = slotText(el, textRef.current, optionsRef.current);
		return () => {
			ctrl.current?.destroy();
			ctrl.current = null;
		};
	}, []);

	useEffect(() => {
		ctrl.current?.set(text, optionsRef.current);
	}, [text]);

	useEffect(() => {
		if (!playOnView) return;
		const el = ref.current;
		if (!el) return;

		const io = new IntersectionObserver(
			([entry]) => {
				if (!entry.isIntersecting) return;
				ctrl.current?.set(textRef.current, {
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
		const root = el.closest("[data-slot-hover-root]") ?? el;

		const enter = () => {
			ctrl.current?.set(textRef.current, {
				skipUnchanged: false,
				interrupt: true,
				direction: "down",
				...optionsRef.current,
			});
		};

		root.addEventListener("mouseenter", enter);
		return () => {
			root.removeEventListener("mouseenter", enter);
		};
	}, [hover, hoverTint]);

	return <span ref={ref} className={`origin-left transform-gpu ${className ?? ""}`} />;
}
