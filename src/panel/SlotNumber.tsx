"use client";

import { useEffect, useRef } from "react";
import { type SlotTextController, slotText } from "slot-text";
import { cn } from "@/panel/cn";

interface SlotNumberProps {
	value: number | string;
	className?: string;
	duration?: number;
	stagger?: number;
	bounce?: number;
	decimals?: number;
	prefix?: string;
	suffix?: string;
	animateOnMount?: boolean;
}

export function SlotNumber({
	value,
	className,
	duration = 380,
	stagger = 20,
	bounce = 0.22,
	decimals = 0,
	prefix = "",
	suffix = "",
	animateOnMount = true,
}: SlotNumberProps) {
	const ref = useRef<HTMLSpanElement>(null);
	const control = useRef<SlotTextController | null>(null);
	const isMountedRef = useRef(false);

	const formattedBase =
		typeof value === "number"
			? decimals > 0
				? value.toFixed(decimals)
				: Math.round(value).toLocaleString("es-CR")
			: String(value);

	const fullText = `${prefix}${formattedBase}${suffix}`;
	const latestTextRef = useRef(fullText);
	useEffect(() => {
		latestTextRef.current = fullText;
	}, [fullText]);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		// Dentro del ghost invisible de Skullet no dividimos los nodos: así Skullet
		// mide el número completo como un único hueso limpio sin coste adicional.
		if (el.closest("[skullet-ghost], [skullet-loading]")) {
			return;
		}

		if (!animateOnMount) {
			control.current = slotText(el, fullText, {
				rollBy: "character",
				duration,
				stagger,
				bounce,
				skipUnchanged: false,
			});
			isMountedRef.current = true;
			return () => {
				control.current?.destroy();
				control.current = null;
				isMountedRef.current = false;
			};
		}

		control.current = slotText(el, fullText, {
			rollBy: "character",
			duration,
			stagger,
			bounce,
			skipUnchanged: false,
		});

		const timer = setTimeout(() => {
			control.current?.set(latestTextRef.current, {
				duration,
				stagger,
				bounce,
				skipUnchanged: false,
			});
			isMountedRef.current = true;
		}, 35);

		return () => {
			clearTimeout(timer);
			control.current?.destroy();
			control.current = null;
			isMountedRef.current = false;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (!isMountedRef.current || !control.current) return;
		control.current.set(fullText, {
			duration,
			stagger,
			bounce,
			skipUnchanged: false,
		});
	}, [fullText, duration, stagger, bounce]);

	return (
		<span
			ref={ref}
			aria-label={fullText}
			className={cn(
				"num font-mono inline-flex tabular-nums select-none",
				className,
			)}
		>
			{fullText}
		</span>
	);
}
