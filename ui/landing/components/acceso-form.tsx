"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { CR, US } from "country-flag-icons/react/3x2";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { slotText } from "slot-text";
import { IconArrowLeft, IconArrowRight } from "@/app/constant";
import AppLink from "./app-link";

type Country = "CR" | "US";
type Step = 0 | 1 | 2 | 3 | 4;

type Fields = {
	artistName: string;
	email: string;
	country: Country;
	city: string;
	instagram: string;
	website: string;
};

const QUESTIONS = [
	"¿Tu nombre artístico?",
	"¿Tu mejor correo?",
	"¿En qué país?",
	"¿En qué provincia?",
	"¿Tu Instagram?",
] as const;

const HINTS = [
	"Tu nombre artístico.",
	"Solo lo usaremos para contactarte.",
	"Empezamos en Costa Rica.",
	"Así organizamos los primeros cupos.",
	"Instagram es opcional.",
] as const;

const PROVINCES = [
	"San José",
	"Alajuela",
	"Cartago",
	"Heredia",
	"Guanacaste",
	"Puntarenas",
	"Limón",
] as const;

const PROVINCE_HINTS: Record<(typeof PROVINCES)[number], string> = {
	"San José": "Tierra de la capital.",
	Alajuela: "Tierra de mangos y volcanes.",
	Cartago: "Tierra de volcanes y agricultura.",
	Heredia: "Tierra de las flores.",
	Guanacaste: "Tierra de la pampa y el sabanero.",
	Puntarenas: "Tierra del Pacífico.",
	Limón: "Tierra del calipso.",
};

const EMPTY: Fields = {
	artistName: "",
	email: "",
	country: "CR",
	city: "",
	instagram: "",
	website: "",
};

const EASE = [0.23, 1, 0.32, 1] as const;

const SLOT = {
	direction: "down",
	rollBy: "word",
	skipUnchanged: false,
	bounce: 0.2,
	stagger: 36,
	duration: 260,
} as const;

const SLOT_BUTTON = {
	direction: "down",
	rollBy: "character",
	skipUnchanged: false,
	interrupt: true,
	bounce: 0.55,
} as const;

const SLOT_PROGRESS = {
	direction: "down",
	rollBy: "character",
	skipUnchanged: false,
	bounce: 0.15,
	stagger: 28,
	duration: 200,
} as const;

function AccessRoll({
	text,
	className,
	hover = false,
	play = false,
	options = SLOT,
}: {
	text: string;
	className?: string;
	hover?: boolean;
	play?: boolean;
	options?: Parameters<typeof slotText>[2];
}) {
	const reduceMotion = useReducedMotion();
	const ref = useRef<HTMLSpanElement>(null);
	const ctrl = useRef<ReturnType<typeof slotText> | null>(null);
	const textRef = useRef(text);
	const optionsRef = useRef(options);
	textRef.current = text;
	optionsRef.current = options;

	useEffect(() => {
		if (reduceMotion) return;
		const el = ref.current;
		if (!el) return;
		ctrl.current = slotText(el, textRef.current, optionsRef.current);
		if (play) {
			ctrl.current.set(textRef.current, optionsRef.current);
		}
		return () => {
			ctrl.current?.destroy();
			ctrl.current = null;
		};
	}, [play, reduceMotion]);

	useEffect(() => {
		if (reduceMotion) return;
		ctrl.current?.set(text, optionsRef.current);
	}, [text, reduceMotion]);

	useEffect(() => {
		if (!hover || reduceMotion) return;
		const el = ref.current;
		if (!el) return;
		const root = el.closest("[data-slot-hover-root]") ?? el;
		const enter = () => {
			ctrl.current?.set(textRef.current, {
				...optionsRef.current,
				skipUnchanged: false,
				interrupt: true,
			});
		};
		root.addEventListener("mouseenter", enter);
		return () => root.removeEventListener("mouseenter", enter);
	}, [hover, reduceMotion]);

	if (reduceMotion) {
		return <span className={className}>{text}</span>;
	}

	return <span ref={ref} className={className} />;
}

const fadeUp = {
	hidden: { opacity: 0, transform: "translateY(4px)" },
	show: {
		opacity: 1,
		transform: "translateY(0px)",
		transition: { duration: 0.7, ease: EASE },
	},
};

const fadeOnly = {
	hidden: { opacity: 0 },
	show: { opacity: 1, transition: { duration: 0.5 } },
};

const fadeArt = {
	hidden: { opacity: 0, transform: "translateY(6px)" },
	show: {
		opacity: 1,
		transform: "translateY(0px)",
		transition: { duration: 0.9, ease: EASE },
	},
};

export default function AccesoForm() {
	const id = useId();
	const reduceMotion = useReducedMotion();
	const [step, setStep] = useState<Step>(0);
	const [fields, setFields] = useState<Fields>(EMPTY);
	const [error, setError] = useState<string | null>(null);
	const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
	const [alreadyJoined, setAlreadyJoined] = useState(false);
	const formRef = useRef<HTMLFormElement>(null);
	const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const moveTo = (next: Step) => {
		if (advanceTimer.current) {
			clearTimeout(advanceTimer.current);
			advanceTimer.current = null;
		}
		setStep(next);
		setError(null);
	};

	const advanceAfterHint = (next: Step) => {
		if (
			typeof window !== "undefined" &&
			window.matchMedia("(pointer: fine)").matches
		) {
			return;
		}
		if (advanceTimer.current) clearTimeout(advanceTimer.current);
		advanceTimer.current = setTimeout(() => {
			advanceTimer.current = null;
			setStep(next);
			setError(null);
		}, reduceMotion ? 0 : 700);
	};

	const validate = () => {
		if (step === 0) {
			const name = fields.artistName.trim();
			if (name.length === 0) {
				setError("El nombre artístico está vacío.");
				return false;
			}
			if (name.length < 2) {
				setError("El nombre artístico necesita al menos 2 caracteres.");
				return false;
			}
		}
		if (step === 1) {
			const email = fields.email.trim();
			if (email.length === 0) {
				setError("El correo está vacío.");
				return false;
			}
			if (email.includes(" ")) {
				setError("El correo no puede tener espacios.");
				return false;
			}
			if (!email.includes("@")) {
				setError("Al correo le falta el @.");
				return false;
			}
			const [local, domain] = email.split("@");
			if (!local) {
				setError("Escribí algo antes del @.");
				return false;
			}
			if (!domain) {
				setError("Falta el dominio después del @.");
				return false;
			}
			if (!domain.includes(".") || domain.endsWith(".")) {
				setError("Al dominio le falta la extensión, por ejemplo .com");
				return false;
			}
			if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
				setError("El correo no tiene un formato válido.");
				return false;
			}
		}
		if (step === 2 && fields.country !== "CR") {
			setError("De momento no estamos ahí.");
			return false;
		}
		if (step === 3 && !PROVINCES.includes(fields.city as (typeof PROVINCES)[number])) {
			setError("Elegí una provincia.");
			return false;
		}
		if (step === 4 && fields.instagram.trim()) {
			const handle = fields.instagram.trim().replace(/^@+/, "").toLowerCase();
			if (!/^[a-z0-9._]{1,30}$/.test(handle)) {
				setError("El Instagram no es válido.");
				return false;
			}
		}
		return true;
	};

	const joinWaitlist = async (instagram: string) => {
		setStatus("submitting");
		setError(null);
		try {
			const response = await fetch("/api/waitlist", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					artistName: fields.artistName.trim(),
					email: fields.email.trim(),
					country: fields.country,
					city: fields.city.trim(),
					instagram: instagram.trim() || undefined,
					website: fields.website,
				}),
			});
			const payload = (await response.json()) as {
				alreadyJoined?: boolean;
				message?: string;
			};
			if (!response.ok) {
				setStatus("idle");
				setError(payload.message ?? "No pudimos anotarte. Intentá de nuevo.");
				return;
			}
			setAlreadyJoined(Boolean(payload.alreadyJoined));
			setStatus("done");
		} catch {
			setStatus("idle");
			setError("No hay conexión. Intentá de nuevo.");
		}
	};

	const submit = async (event: FormEvent) => {
		event.preventDefault();
		if (!validate()) return;

		if (step < 4) {
			moveTo((step + 1) as Step);
			return;
		}

		await joinWaitlist(fields.instagram.replace(/^@+/, ""));
	};

	const skipFocusDelay = useRef(true);

	useEffect(() => {
		if (status === "done") return;
		const wait = skipFocusDelay.current || reduceMotion ? 0 : 140;
		skipFocusDelay.current = false;
		const timer = window.setTimeout(() => {
			const root = formRef.current;
			if (!root) return;
			const input = root.querySelector<HTMLInputElement>("[data-access-input]");
			if (input) {
				input.focus({ preventScroll: true });
				if (window.matchMedia("(pointer: fine)").matches) {
					input.select();
				}
				return;
			}
			(
				root.querySelector<HTMLElement>("[data-access-field][data-checked]") ??
				root.querySelector<HTMLElement>("[data-access-field]")
			)?.focus({ preventScroll: true });
		}, wait);
		return () => clearTimeout(timer);
	}, [step, status, reduceMotion]);

	useEffect(
		() => () => {
			if (advanceTimer.current) clearTimeout(advanceTimer.current);
		},
		[],
	);

	const onFormKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
		if (event.key !== "Tab" || status !== "idle") return;
		if (typeof window !== "undefined" && !window.matchMedia("(pointer: fine)").matches) {
			return;
		}

		if (event.shiftKey) {
			if (step === 0) return;
			event.preventDefault();
			moveTo((step - 1) as Step);
			return;
		}

		event.preventDefault();
		if (!validate()) return;
		if (step < 4) {
			moveTo((step + 1) as Step);
			return;
		}
		formRef.current?.requestSubmit();
	};

	const provinceHint =
		step === 3 && PROVINCES.includes(fields.city as (typeof PROVINCES)[number])
			? PROVINCE_HINTS[fields.city as (typeof PROVINCES)[number]]
			: HINTS[step];

	return (
		<div className="relative flex min-h-dvh flex-col overflow-hidden bg-[#090A09]">
			<StepBlade step={step} reduceMotion={Boolean(reduceMotion)} />

			<header className="relative z-10 flex h-14 shrink-0 items-center justify-between px-4 pt-[env(safe-area-inset-top)] sm:h-16 sm:px-8">
				<AppLink
					href="/"
					aria-label="Volver a GigBlade"
					className="access-logo access-press cursor-pointer"
				>
					<Image
						src="/images/navbar/autumnlogo.svg"
						width={114}
						height={28}
						alt="GigBlade"
						priority
						sizes="114px"
						className="access-logo-mark h-auto w-24"
					/>
				</AppLink>
				<Progress step={step} done={status === "done"} reduceMotion={Boolean(reduceMotion)} />
			</header>

			<div className="relative z-10 h-px bg-white/8">
				<motion.div
					className="h-full origin-left bg-brand-accent"
					animate={{
						transform: `scaleX(${
							status === "done" ? 1 : (step + 1) / QUESTIONS.length
						})`,
					}}
					transition={{ duration: reduceMotion ? 0 : 0.22, ease: EASE }}
				/>
			</div>

			<main
				className={`relative z-10 flex min-h-0 min-w-0 flex-1 justify-center overflow-y-auto px-5 py-8 sm:px-8 sm:py-10 ${
					status === "done" ? "items-center" : "items-start sm:items-center"
				}`}
			>
				<AnimatePresence initial={false}>
					{status === "done" ? (
						<Success
							alreadyJoined={alreadyJoined}
							country={fields.country}
							reduceMotion={Boolean(reduceMotion)}
						/>
					) : (
						<motion.form
							key="form"
							ref={formRef}
							onSubmit={submit}
							onKeyDown={onFormKeyDown}
							noValidate
							className="min-w-0 w-full max-w-2xl py-2 sm:py-0"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: reduceMotion ? 0 : 0.4, ease: EASE }}
						>
							<h1 className="min-h-12 max-w-full text-[clamp(28px,8.5vw,32px)] leading-[1.3] tracking-[-0.04em] text-[#F5F7F5] sm:min-h-20 sm:max-w-xl sm:text-[clamp(2.25rem,5.5vw,3.75rem)] sm:tracking-[-0.055em]">
								<AccessRoll text={QUESTIONS[step]} />
							</h1>

							<p
								id={`${id}-hint`}
								className={`mt-3 min-h-10 text-sm leading-6 transition-colors duration-200 sm:min-h-11 sm:text-[15px] ${
									error ? "text-[#E8A49C]" : "text-[#9CA19D]"
								}`}
								aria-live="polite"
							>
								{error ? (
									<span className="access-error-copy">{error}</span>
								) : (
									<AccessRoll text={provinceHint} />
								)}
							</p>

							<div className="relative mt-8 sm:mt-10">
								<AnimatePresence initial={false} mode="popLayout">
									<motion.div
										key={step}
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										exit={{ opacity: 0 }}
										transition={{ duration: reduceMotion ? 0 : 0.12, ease: EASE }}
									>
										{step === 0 && (
											<LineInput
												id={`${id}-artist`}
												value={fields.artistName}
												placeholder="Nombre de DJ"
												autoComplete="nickname"
												invalid={Boolean(error)}
												describedBy={`${id}-hint`}
												onChange={(artistName) => {
													setError(null);
													setFields((current) => ({ ...current, artistName }));
												}}
											/>
										)}
										{step === 1 && (
											<LineInput
												id={`${id}-email`}
												value={fields.email}
												placeholder="nombre@correo.com"
												type="email"
												autoComplete="email"
												invalid={Boolean(error)}
												describedBy={`${id}-hint`}
												onChange={(email) => {
													setError(null);
													setFields((current) => ({ ...current, email }));
												}}
											/>
										)}
										{step === 2 && (
											<CountrySelect
												value={fields.country}
												onChange={(country) => {
													setFields((current) => ({ ...current, country }));
													setError(null);
												}}
												onConfirm={() => advanceAfterHint(3)}
												onUnavailable={() =>
													setError("De momento no estamos ahí.")
												}
											/>
										)}
										{step === 3 && (
											<ProvinceSelect
												value={fields.city}
												onChange={(city) => {
													setError(null);
													setFields((current) => ({ ...current, city }));
													advanceAfterHint(4);
												}}
											/>
										)}
										{step === 4 && (
											<InstagramInput
												id={`${id}-instagram`}
												value={fields.instagram}
												describedBy={`${id}-hint`}
												invalid={Boolean(error)}
												onChange={(instagram) =>
													setFields((current) => ({ ...current, instagram }))
												}
											/>
										)}
									</motion.div>
								</AnimatePresence>
							</div>

							<div className="mt-6 flex w-full items-center gap-2 sm:mt-7 sm:w-auto">
								<AnimatePresence initial={false}>
									{step > 0 && (
										<motion.button
											key="back"
											type="button"
											onClick={() => moveTo((step - 1) as Step)}
											aria-label="Volver"
											initial={{
												opacity: 0,
												transform: reduceMotion ? "none" : "translateX(-6px)",
											}}
											animate={{ opacity: 1, transform: "translateX(0px)" }}
											exit={{
												opacity: 0,
												transform: reduceMotion ? "none" : "translateX(-6px)",
											}}
											transition={{ duration: reduceMotion ? 0 : 0.12, ease: EASE }}
											className="access-back access-press flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center border border-[#343734] bg-[#101210] text-white/70 transition-[transform,border-color,color,background-color] duration-160 hover:border-white/30 hover:bg-[#151815] hover:text-white"
										>
											<span className="access-back-icon">
												<IconArrowLeft className="h-5 w-5" />
											</span>
										</motion.button>
									)}
								</AnimatePresence>
								<button
									type="submit"
									disabled={status === "submitting"}
									data-slot-hover-root
									className="access-primary access-press flex h-12 min-w-0 flex-1 cursor-pointer items-center justify-between gap-4 overflow-visible bg-brand px-5 text-sm font-medium text-white transition-[background-color] duration-160 hover:bg-brand-hover disabled:cursor-wait disabled:opacity-50 sm:min-w-44 sm:flex-none"
								>
									<AccessRoll
										hover
										options={SLOT_BUTTON}
										text={
											status === "submitting"
												? "Enviando…"
												: step === 4
													? "Anotarme"
													: "Continuar"
										}
										className="whitespace-nowrap"
									/>
									<span className="access-next-icon shrink-0">
										<IconArrowRight className="h-5 w-5" />
									</span>
								</button>
							</div>
							{step === 4 && (
								<button
									type="button"
									onClick={() => {
										if (status !== "idle") return;
										void joinWaitlist("");
									}}
									className="access-press mt-3 cursor-pointer text-sm text-white/40 transition-colors duration-160 hover:text-white"
								>
									Saltar
								</button>
							)}

							<input
								tabIndex={-1}
								autoComplete="off"
								aria-hidden="true"
								className="absolute left-[-9999px]"
								value={fields.website}
								onChange={(event) =>
									setFields((current) => ({
										...current,
										website: event.target.value,
									}))
								}
							/>
						</motion.form>
					)}
				</AnimatePresence>
			</main>
		</div>
	);
}

function StepBlade({
	step,
	reduceMotion,
}: {
	step: Step;
	reduceMotion: boolean;
}) {
	const shift = step * 1.6;
	const scale = 0.9 + step * 0.025;

	return (
		<div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
			<div className="absolute right-[-18%] bottom-[15%] h-px w-[82vw] origin-right rotate-[-18deg] bg-white/4 sm:right-[-8%] sm:bottom-[18%] sm:w-[48vw]" />
			<div className="absolute right-[-16%] bottom-[12%] h-px w-[70vw] origin-right rotate-[-18deg] bg-white/3 sm:right-[-6%] sm:bottom-[14%] sm:w-[42vw]" />
			<motion.div
				className="absolute right-[-14%] bottom-[18%] h-px w-[76vw] origin-right bg-linear-to-l from-brand-accent/70 via-brand/28 to-transparent sm:right-[-4%] sm:bottom-[22%] sm:w-[44vw]"
				initial={false}
				animate={{
					opacity: 0.55 + step * 0.09,
					transform: reduceMotion
						? "rotate(-18deg)"
						: `translate3d(${shift}%, 0, 0) rotate(-18deg) scaleX(${scale})`,
				}}
				transition={{ duration: reduceMotion ? 0.16 : 0.28, ease: EASE }}
			/>
		</div>
	);
}

function Progress({
	step,
	done,
	reduceMotion,
}: {
	step: Step;
	done: boolean;
	reduceMotion: boolean;
}) {
	return (
		<div className="flex items-center gap-3" aria-label={done ? "Completado" : `Paso ${step + 1} de 5`}>
			<div className="flex gap-1" aria-hidden="true">
				{QUESTIONS.map((question, index) => {
					const active = done || index <= step;
					return (
						<motion.span
							key={question}
							className="h-1 w-1 bg-brand-accent"
							animate={{ opacity: active ? 1 : 0.2 }}
							transition={{ duration: reduceMotion ? 0 : 0.16, ease: EASE }}
						/>
					);
				})}
			</div>
			<span className="font-mono text-[10px] tabular-nums tracking-[0.12em] text-white/45">
				<AccessRoll
					text={done ? "LISTO" : `0${step + 1}`}
					options={SLOT_PROGRESS}
				/>
			</span>
		</div>
	);
}

function Success({
	alreadyJoined,
	country,
	reduceMotion,
}: {
	alreadyJoined: boolean;
	country: Country;
	reduceMotion: boolean;
}) {
	const place = country === "US" ? "Estados Unidos" : "Costa Rica";

	return (
		<motion.section
			key="success"
			initial="hidden"
			animate="show"
			className="absolute inset-0 flex w-full flex-col items-center justify-center text-center"
			aria-live="polite"
			variants={{
				hidden: { opacity: 0 },
				show: {
					opacity: 1,
					transition: {
						duration: reduceMotion ? 0.2 : 0.5,
						ease: EASE,
						staggerChildren: reduceMotion ? 0 : 0.18,
						delayChildren: reduceMotion ? 0 : 0.16,
					},
				},
			}}
		>
			<motion.h1
				variants={reduceMotion ? fadeOnly : fadeUp}
				className="max-w-[14ch] text-[clamp(2.15rem,8vw,3.75rem)] leading-[1.08] tracking-[-0.045em] text-[#F5F7F5] sm:tracking-[-0.055em]"
			>
				{alreadyJoined ? "Ya estabas en la lista." : "Estás en la lista."}
			</motion.h1>
			<motion.p
				variants={reduceMotion ? fadeOnly : fadeUp}
				className="mt-4 max-w-sm text-[15px] leading-6 text-white/50"
			>
				{alreadyJoined
					? `Cuando abramos el próximo cupo en ${place}, te escribimos.`
					: `Te escribiremos cuando abramos el próximo cupo en ${place}.`}
			</motion.p>
			<motion.div
				variants={reduceMotion ? fadeOnly : fadeArt}
				className="mx-auto mt-8 w-[min(100%,18rem)] sm:mt-10 sm:w-[min(100%,20rem)]"
			>
				<div className="access-success-art">
					<Image
						src="/images/gigblade-access-signpost-arm.png"
						width={706}
						height={706}
						alt="Un DJ en un cruce de caminos elige la flecha verde"
						className="mx-auto h-auto w-full"
						sizes="(max-width: 768px) 100vw, 706px"
						priority
					/>
				</div>
			</motion.div>
			<motion.div variants={reduceMotion ? fadeOnly : fadeUp}>
				<AppLink
					href="/"
					className="mt-8 inline-block text-sm text-white/40 transition-colors duration-160 hover:text-white"
				>
					Volver a GigBlade
				</AppLink>
			</motion.div>
		</motion.section>
	);
}

function ProvinceSelect({
	value,
	onChange,
}: {
	value: string;
	onChange: (value: string) => void;
}) {
	return (
		<RadioGroup
			aria-label="Provincia"
			value={value || null}
			onValueChange={(next) => next && onChange(next)}
			className="grid w-full grid-cols-2 gap-x-4"
		>
			{PROVINCES.map((province) => (
				<div key={province} className="min-w-0">
					<Radio.Root
						value={province}
						data-access-field
						className="access-country relative flex min-h-12 w-full cursor-pointer items-center border-b border-white/20 bg-transparent text-left text-[17px] tracking-[-0.03em] text-white/45 outline-none transition-colors duration-200 data-checked:text-white sm:min-h-14 sm:text-xl"
					>
						{province}
					</Radio.Root>
				</div>
			))}
		</RadioGroup>
	);
}

const COUNTRIES = [
	{ value: "CR" as const, name: "Costa Rica", Flag: CR, disabled: false },
	{ value: "US" as const, name: "Estados Unidos", Flag: US, disabled: true },
] as const;

function CountrySelect({
	value,
	onChange,
	onConfirm,
	onUnavailable,
}: {
	value: Country;
	onChange: (value: Country) => void;
	onConfirm: () => void;
	onUnavailable: () => void;
}) {
	return (
		<RadioGroup
			aria-label="País"
			value={value}
			onValueChange={(next) => next && onChange(next as Country)}
			className="flex w-full flex-col"
		>
			{COUNTRIES.map((country) => {
				const Flag = country.Flag;
				const rowClass =
					"access-country relative flex h-16 w-full items-center gap-3 border-b border-white/20 bg-transparent text-left outline-none transition-[border-color,color] duration-200";

				if (country.disabled) {
					return (
						<button
							key={country.value}
							type="button"
							onClick={onUnavailable}
							className={`${rowClass} cursor-pointer`}
						>
							<Flag
								title={country.name}
								className="h-3.5 w-5 shrink-0 opacity-35 sm:h-4 sm:w-6"
							/>
							<span className="min-w-0 flex-1 text-2xl tracking-[-0.03em] text-white/30 sm:text-[28px]">
								{country.name}
							</span>
							<span className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/30">
								Soon
							</span>
						</button>
					);
				}

				return (
					<Radio.Root
						key={country.value}
						value={country.value}
						data-access-field
						onClick={onConfirm}
						className={`${rowClass} cursor-pointer text-white`}
					>
						<Flag
							title={country.name}
							className="h-3.5 w-5 shrink-0 sm:h-4 sm:w-6"
						/>
						<span className="min-w-0 flex-1 text-2xl tracking-[-0.03em] sm:text-[28px]">
							{country.name}
						</span>
					</Radio.Root>
				);
			})}
		</RadioGroup>
	);
}

function InstagramInput({
	id,
	value,
	onChange,
	invalid = false,
	describedBy,
}: {
	id: string;
	value: string;
	onChange: (value: string) => void;
	invalid?: boolean;
	describedBy?: string;
}) {
	return (
		<label
			htmlFor={id}
			className={`flex h-16 w-full items-center border-b bg-transparent transition-[border-color] duration-200 ${
				invalid
					? "border-[#E8A49C]"
					: "border-white/35 focus-within:border-brand-accent"
			}`}
		>
			<span className="select-none text-2xl text-white/35 sm:text-[28px]">@</span>
			<input
				id={id}
				type="text"
				inputMode="text"
				autoCapitalize="none"
				autoCorrect="off"
				spellCheck={false}
				value={value}
				onChange={(event) =>
					onChange(event.target.value.replace(/^@+/, "").replace(/\s/g, ""))
				}
				placeholder="tuusuario"
				name="dj-instagram"
				autoComplete="off"
				data-access-input
				data-1p-ignore
				data-lpignore="true"
				aria-label="Instagram"
				aria-invalid={invalid}
				aria-describedby={describedBy}
				className="h-16 min-w-0 flex-1 border-0 bg-transparent px-0 text-2xl text-white outline-none placeholder:text-white/35 sm:text-[28px]"
			/>
		</label>
	);
}

function LineInput({
	id,
	value,
	onChange,
	placeholder,
	type = "text",
	autoComplete,
	invalid = false,
	describedBy,
}: {
	id: string;
	value: string;
	onChange: (value: string) => void;
	placeholder: string;
	type?: string;
	autoComplete?: string;
	invalid?: boolean;
	describedBy?: string;
}) {
	return (
		<input
			id={id}
			type={type}
			value={value}
			onChange={(event) => onChange(event.target.value)}
			placeholder={placeholder}
			autoComplete={autoComplete}
			data-access-input
			aria-label={placeholder}
			aria-invalid={invalid}
			aria-describedby={describedBy}
			className={`h-16 w-full border-0 border-b bg-transparent px-0 text-2xl text-white outline-none transition-[border-color] duration-200 placeholder:text-white/35 sm:text-[28px] ${
				invalid
					? "border-[#E8A49C] focus:border-[#E8A49C]"
					: "border-white/35 focus:border-brand-accent"
			}`}
		/>
	);
}
