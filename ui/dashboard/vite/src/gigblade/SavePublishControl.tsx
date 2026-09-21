import { Button } from "@autumn/ui";
import { CheckCircleIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

const SPRING = { type: "spring", stiffness: 520, damping: 28 } as const;
const SNAP = { duration: 0.55, ease: [0.22, 1, 0.36, 1] } as const;

const SPARKS = [
	{ x: -22, y: -16, delay: 0 },
	{ x: 18, y: -20, delay: 0.04 },
	{ x: 24, y: 10, delay: 0.08 },
	{ x: -18, y: 16, delay: 0.05 },
	{ x: 4, y: -26, delay: 0.02 },
	{ x: 10, y: 22, delay: 0.07 },
] as const;

export function SavePublishControl({
	saving,
	saved,
	live,
	error,
	saveTick,
}: {
	saving: boolean;
	saved: boolean;
	live: boolean;
	error?: string;
	saveTick: number;
}) {
	const reduce = useReducedMotion();
	const published = saved && live && !error;
	const status = error
		? { key: "error", text: error, tone: "error" as const }
		: saved && live
			? {
					key: "live",
					text: "Publicado en tu página.",
					tone: "ok" as const,
				}
			: null;

	return (
		<div className="flex items-center gap-3 min-h-8">
			<motion.div
				className="relative isolate"
				initial="rest"
				animate={saving ? "saving" : "rest"}
				whileHover={reduce || saving ? undefined : "hover"}
				whileTap={reduce || saving ? undefined : "press"}
				variants={{
					rest: { scale: 1 },
					hover: { scale: 1.06 },
					press: { scale: 0.96 },
					saving: { scale: 1 },
				}}
				transition={reduce ? { duration: 0 } : SPRING}
			>
				<Button
					type="submit"
					variant="primary"
					size="sm"
					isLoading={saving}
					disabled={saving}
					aria-busy={saving}
					className="min-w-23"
				>
					Guardar
				</Button>

				<motion.span
					aria-hidden
					className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg"
				>
					<motion.span
						className="absolute inset-y-0 w-10 -skew-x-12 bg-linear-to-r from-transparent via-white/55 to-transparent"
						variants={{
							rest: { x: "-160%", opacity: 0 },
							hover: { x: "220%", opacity: 1 },
							press: { x: "220%", opacity: 0.35 },
							saving: { x: ["-160%", "220%"], opacity: 0.7 },
						}}
						transition={
							saving && !reduce
								? { repeat: Number.POSITIVE_INFINITY, duration: 0.85, ease: "linear" }
								: reduce
									? { duration: 0 }
									: { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
						}
					/>
				</motion.span>

				<AnimatePresence>
					{published && !reduce ? (
						<motion.span
							key={`ring-${saveTick}`}
							aria-hidden
							className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-white/80"
							initial={{ opacity: 0.9, scale: 1 }}
							animate={{ opacity: 0, scale: 1.55 }}
							exit={{ opacity: 0 }}
							transition={SNAP}
						/>
					) : null}
				</AnimatePresence>

				<AnimatePresence>
					{published && !reduce
						? SPARKS.map((spark, index) => (
								<motion.span
									key={`${saveTick}-${index}`}
									aria-hidden
									className="pointer-events-none absolute left-1/2 top-1/2 size-1 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]"
									initial={{ opacity: 1, x: 0, y: 0, scale: 0.4 }}
									animate={{
										opacity: 0,
										x: spark.x,
										y: spark.y,
										scale: 1.15,
									}}
									exit={{ opacity: 0 }}
									transition={{ ...SNAP, delay: spark.delay }}
								/>
							))
						: null}
				</AnimatePresence>
			</motion.div>

			<p className="text-xs min-h-4" aria-live="polite">
				<AnimatePresence mode="wait">
					{status ? (
						<motion.span
							key={status.key}
							className={`inline-flex items-center gap-1.5 ${
								status.tone === "error"
									? "text-destructive"
									: "text-foreground"
							}`}
							initial={
								reduce ? { opacity: 0 } : { opacity: 0, x: -10, filter: "blur(4px)" }
							}
							animate={
								reduce ? { opacity: 1 } : { opacity: 1, x: 0, filter: "blur(0px)" }
							}
							exit={
								reduce ? { opacity: 0 } : { opacity: 0, y: 4, filter: "blur(4px)" }
							}
							transition={reduce ? { duration: 0.12 } : { duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
						>
							{status.tone === "ok" ? (
								<motion.span
									initial={reduce ? { opacity: 0 } : { scale: 0.2, rotate: -50 }}
									animate={reduce ? { opacity: 1 } : { scale: 1, rotate: 0 }}
									transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 640, damping: 16 }}
								>
									<CheckCircleIcon
										size={14}
										weight="fill"
										className="text-primary"
										aria-hidden
									/>
								</motion.span>
							) : null}
							{status.text}
						</motion.span>
					) : null}
				</AnimatePresence>
			</p>
		</div>
	);
}
