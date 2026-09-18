import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export function AnimatedCounter({ value }: { value: number }) {
	const previous = useRef(value);
	const reduceMotion = useReducedMotion();
	const direction = value >= previous.current ? 1 : -1;
	const formatted = new Intl.NumberFormat("es-CR").format(value);

	useEffect(() => {
		previous.current = value;
	}, [value]);

	return (
		<span
			aria-label={formatted}
			className="relative top-0.5 inline-flex items-baseline leading-none tabular-nums"
		>
			{Array.from(formatted).map((character, index) =>
				/\d/.test(character) ? (
					<span
						key={`slot-${index}`}
						aria-hidden="true"
						className="relative inline-grid h-[1em] min-w-[0.58em] place-items-center overflow-hidden align-baseline"
					>
						<AnimatePresence initial={false} mode="popLayout">
							<motion.span
								key={`${index}-${character}`}
								initial={
									reduceMotion
										? { opacity: 1 }
										: {
												opacity: 0,
												transform: `translateY(${direction * 70}%)`,
											}
								}
								animate={{ opacity: 1, transform: "translateY(0%)" }}
								exit={
									reduceMotion
										? { opacity: 0 }
										: {
												opacity: 0,
												transform: `translateY(${-direction * 70}%)`,
											}
								}
								transition={{ duration: 0.32, ease: EASE_OUT }}
								className="absolute inset-0 grid place-items-center leading-none"
							>
								{character}
							</motion.span>
						</AnimatePresence>
					</span>
				) : (
					<span key={`mark-${index}`} aria-hidden="true">
						{character}
					</span>
				),
			)}
		</span>
	);
}
