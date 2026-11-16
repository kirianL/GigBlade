"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { CR, US } from "country-flag-icons/react/3x2";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { slotText } from "slot-text";
import { IconArrowLeft, IconArrowRight } from "@/app/constant";
import {
	TurnstileWidget,
	configuredTurnstileSiteKey,
} from "@/lib/tenant/templates/turnstile-widget";
import AppLink from "./app-link";

type Country = "CR" | "US";
type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6;

type Fields = {
	artistName: string;
	email: string;
	phone: string;
	country: Country;
	city: string;
	instagram: string;
	meetingAt: string;
	website: string;
	referralCode: string;
};

const QUESTIONS = [
	"¿Tu nombre artístico?",
	"¿Tu mejor correo?",
	"¿Tu número?",
	"¿En qué país?",
	"¿En qué provincia?",
	"¿Tu Instagram?",
	"¿Cuándo nos reunimos?",
] as const;

const HINTS = [
	"Tu nombre artístico.",
	"Solo lo usaremos para contactarte.",
	"Opcional. Para avisarte por WhatsApp.",
	"Empezamos en Costa Rica.",
	"Así organizamos los primeros cupos.",
	"Instagram es opcional.",
	"Elegí día y hora para ver tu página en vivo (15 min · Hora CR).",
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
	phone: "",
	country: "CR",
	city: "",
	instagram: "",
	meetingAt: "",
	website: "",
	referralCode: "",
};

const MEETING_HOURS = [
	"09:00",
	"10:00",
	"11:00",
	"13:00",
	"14:00",
	"15:00",
	"16:00",
	"17:00",
	"18:00",
	"19:00",
] as const;

function formatMeetingSummary(iso: string): string {
	if (!iso) return "";
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return "";
	const dayStr = new Intl.DateTimeFormat("es-CR", {
		weekday: "long",
		day: "numeric",
		month: "long",
		timeZone: "America/Costa_Rica",
	}).format(date);
	const timeStr = new Intl.DateTimeFormat("es-CR", {
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
		timeZone: "America/Costa_Rica",
	}).format(date);
	const cap = dayStr.charAt(0).toUpperCase() + dayStr.slice(1);
	return `${cap} · ${timeStr} (Hora CR)`;
}

function buildGoogleCalendarUrl(iso: string, artistName: string): string | null {
	if (!iso) return null;
	const start = new Date(iso);
	if (Number.isNaN(start.getTime())) return null;
	const end = new Date(start.getTime() + 15 * 60 * 1000);
	const fmt = (d: Date) =>
		d
			.toISOString()
			.replace(/[-:]/g, "")
			.replace(/\.\d{3}Z$/, "Z");
	const title = encodeURIComponent(
		`Reunión GigBlades × ${artistName.trim() || "DJ"}`,
	);
	const details = encodeURIComponent(
		"Reunión de bienvenida (15 min) con el equipo de GigBlades para ver tu página web oficial de DJ y activar tu cupo.",
	);
	return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fmt(start)}/${fmt(end)}&details=${details}`;
}

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
	live = true,
	options = SLOT,
}: {
	text: string;
	className?: string;
	hover?: boolean;
	play?: boolean;
	live?: boolean;
	options?: Parameters<typeof slotText>[2];
}) {
	const reduceMotion = useReducedMotion();
	const ref = useRef<HTMLSpanElement>(null);
	const ctrl = useRef<ReturnType<typeof slotText> | null>(null);
	const textRef = useRef(text);
	const optionsRef = useRef(options);
	const lastText = useRef(text);
	const played = useRef(false);

	useEffect(() => {
		textRef.current = text;
		optionsRef.current = options;
	});

	useEffect(() => {
		if (reduceMotion) return;
		const el = ref.current;
		if (!el) return;
		ctrl.current = slotText(el, textRef.current, optionsRef.current);
		return () => {
			ctrl.current?.destroy();
			ctrl.current = null;
		};
	}, [reduceMotion]);

	useEffect(() => {
		if (reduceMotion || !live) return;
		const textChanged = lastText.current !== text;
		lastText.current = text;
		if (textChanged) {
			ctrl.current?.set(text, optionsRef.current);
			return;
		}
		if (play && !played.current) {
			played.current = true;
			ctrl.current?.set(text, optionsRef.current);
		}
	}, [text, live, play, reduceMotion]);

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

const pageEnter = {
	hidden: { opacity: 0, transform: "translateY(10px)" },
	show: {
		opacity: 1,
		transform: "translateY(0px)",
		transition: { duration: 0.72, ease: EASE },
	},
};

const pageEnterStill = {
	hidden: { opacity: 0 },
	show: { opacity: 1, transition: { duration: 0.35 } },
};

export default function AccesoForm() {
	const id = useId();
	const reduceMotion = useReducedMotion();
	const [step, setStep] = useState<Step>(0);
	const [fields, setFields] = useState<Fields>(EMPTY);
	const [error, setError] = useState<string | null>(null);
	const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
	const [alreadyJoined, setAlreadyJoined] = useState(false);
	const [introReady, setIntroReady] = useState(false);
	const [direction, setDirection] = useState(1);
	const [bookedSlots, setBookedSlots] = useState<string[]>([]);
	const [turnstileToken, setTurnstileToken] = useState<string>("");
	const [turnstileResetKey, setTurnstileResetKey] = useState(0);
	const formStartedAtRef = useRef<number>(Date.now());
	const formRef = useRef<HTMLFormElement>(null);
	const turnstileSiteKey = configuredTurnstileSiteKey();

	useEffect(() => {
		formStartedAtRef.current = Date.now();
		const timer = window.setTimeout(() => setIntroReady(true), 900);
		return () => window.clearTimeout(timer);
	}, []);

	// Fetch already-booked meeting slots from the platform when approaching Step 6
	useEffect(() => {
		if (step < 4) return;
		let active = true;
		fetch("/api/waitlist", { cache: "no-store" })
			.then((res) => (res.ok ? res.json() : null))
			.then((data: { bookedSlots?: string[] } | null) => {
				if (active && Array.isArray(data?.bookedSlots)) {
					setBookedSlots(data.bookedSlots);
				}
			})
			.catch(() => {
				// Ignore network error, slots remain open
			});
		return () => {
			active = false;
		};
	}, [step]);

	useEffect(() => {
		if (typeof window === "undefined") return;
		try {
			const params = new URLSearchParams(window.location.search);
			const ref = params.get("ref") || params.get("referral") || params.get("r");
			if (ref) {
				const clean = ref.trim().toUpperCase();
				setFields((current) => ({ ...current, referralCode: clean }));
			} else {
				// Solo sale en el form si tiene el link de referido; si entra normal desde la página no debe salir
				try {
					localStorage.removeItem("gb_ref");
					document.cookie = "gb_ref=; path=/; max-age=0;";
				} catch {}
				setFields((current) => ({ ...current, referralCode: "" }));
			}
		} catch {
			// Ignorar si hay error leyendo search params
		}
	}, []);

	const moveTo = (next: Step) => {
		setDirection(next > step ? 1 : -1);
		setStep(next);
		setError(null);
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
		if (step === 2 && fields.phone.trim()) {
			const phone = fields.phone.trim();
			const digits = phone.replace(/\D/g, "").length;
			if (
				phone.length > 30 ||
				digits < 7 ||
				digits > 15 ||
				!/^\+?[\d\s().-]+$/.test(phone)
			) {
				setError("El número no es válido.");
				return false;
			}
		}
		if (step === 3 && fields.country !== "CR") {
			setError("De momento no estamos ahí.");
			return false;
		}
		if (step === 4 && !PROVINCES.includes(fields.city as (typeof PROVINCES)[number])) {
			setError("Elegí una provincia.");
			return false;
		}
		if (step === 5 && fields.instagram.trim()) {
			const handle = fields.instagram.trim().replace(/^@+/, "").toLowerCase();
			if (!/^[a-z0-9._]{1,30}$/.test(handle)) {
				setError("El Instagram no es válido.");
				return false;
			}
		}
		if (step === 6) {
			if (!fields.meetingAt.trim()) {
				setError("Seleccioná un día y una hora para nuestra reunión.");
				return false;
			}
			if (turnstileSiteKey && !turnstileToken) {
				setError("Completá la verificación de seguridad de Cloudflare.");
				return false;
			}
		}
		return true;
	};

	const joinWaitlist = async (instagram: string, meetingAtOverride?: string) => {
		if (turnstileSiteKey && !turnstileToken) {
			setError("Completá la verificación de seguridad de Cloudflare.");
			return;
		}
		setStatus("submitting");
		setError(null);
		const controller = new AbortController();
		const timer = window.setTimeout(() => controller.abort(), 45_000);
		const finalMeetingAt =
			meetingAtOverride !== undefined ? meetingAtOverride : fields.meetingAt.trim();
		try {
			const response = await fetch("/api/waitlist", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					artistName: fields.artistName.trim(),
					email: fields.email.trim(),
					phone: fields.phone.trim() || undefined,
					country: fields.country,
					city: fields.city.trim(),
					instagram: instagram.trim() || undefined,
					meetingAt: finalMeetingAt || undefined,
					website: fields.website,
					referralCode: fields.referralCode.trim() || undefined,
					packageId: "all_inclusive",
					turnstileToken: turnstileToken || undefined,
					formStartedAt: formStartedAtRef.current,
				}),
				signal: controller.signal,
			});
			const payload = (await response.json().catch(() => null)) as {
				alreadyJoined?: boolean;
				meetingAt?: string | null;
				message?: string;
			} | null;
			if (!response.ok) {
				setStatus("idle");
				setError(payload?.message ?? "No pudimos anotarte. Intentá de nuevo.");
				if (turnstileSiteKey) {
					setTurnstileToken("");
					setTurnstileResetKey((k) => k + 1);
				}
				return;
			}
			try {
				localStorage.removeItem("gb_ref");
				document.cookie = "gb_ref=; path=/; max-age=0;";
			} catch {}
			setFields((current) => ({
				...current,
				referralCode: "",
				meetingAt: finalMeetingAt,
			}));
			setAlreadyJoined(Boolean(payload?.alreadyJoined));
			setStatus("done");
		} catch (error) {
			setStatus("idle");
			setError(
				error instanceof DOMException && error.name === "AbortError"
					? "La solicitud tardó demasiado. Intentá de nuevo."
					: "No hay conexión. Intentá de nuevo.",
			);
		} finally {
			window.clearTimeout(timer);
		}
	};

	const submit = async (event: FormEvent) => {
		event.preventDefault();
		if (!validate()) return;

		if (step < 6) {
			moveTo((step + 1) as Step);
			return;
		}

		await joinWaitlist(fields.instagram.replace(/^@+/, ""));
	};

	const skipFocusDelay = useRef(true);

	useEffect(() => {
		if (status === "done") return;
		if (!introReady) return;
		const wait = skipFocusDelay.current || reduceMotion ? 0 : 240;
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
	}, [step, status, reduceMotion, introReady]);

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
		if (step < 6) {
			moveTo((step + 1) as Step);
			return;
		}
		formRef.current?.requestSubmit();
	};

	const activeHint =
		step === 4 && PROVINCES.includes(fields.city as (typeof PROVINCES)[number])
			? PROVINCE_HINTS[fields.city as (typeof PROVINCES)[number]]
			: step === 6 && fields.meetingAt
				? `Reunión: ${formatMeetingSummary(fields.meetingAt)}`
				: HINTS[step];

	return (
		<div className="relative flex min-h-dvh flex-col overflow-hidden bg-[#090A09]">
			<StepBlade step={step} reduceMotion={Boolean(reduceMotion)} />
			<Image
				src="/images/gigblade-access-signpost-blue.png"
				width={706}
				height={706}
				alt=""
				priority
				aria-hidden="true"
				className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0"
			/>

			<motion.div
				className="relative z-10 flex min-h-0 flex-1 flex-col"
				initial={reduceMotion ? "show" : "hidden"}
				animate="show"
				variants={reduceMotion ? pageEnterStill : pageEnter}
				onAnimationComplete={() => setIntroReady(true)}
			>
			<header className="flex h-14 shrink-0 items-center justify-between px-4 pt-[env(safe-area-inset-top)] sm:h-16 sm:px-8 gap-3">
				<AppLink
					href="/"
					className="access-logo access-press cursor-pointer font-sans text-[18px] font-medium tracking-[-3%] text-white"
				>
					<span className="access-logo-mark">GigBlades</span>
				</AppLink>
				<div className="flex items-center gap-2.5 sm:gap-3.5">
					{fields.referralCode && (
						<div className="flex items-center gap-1.5 text-xs text-white/40 select-none">
							<span className="hidden sm:inline">Recomendado por código:</span>
							<span className="sm:hidden">Código:</span>
							<span className="font-mono text-xs font-semibold tracking-wider text-white/90">
								{fields.referralCode}
							</span>
						</div>
					)}
					<Progress
						step={step}
						done={status === "done"}
						reduceMotion={Boolean(reduceMotion)}
						live={introReady}
					/>
				</div>
			</header>

			<div className="relative z-10 h-px bg-white/8">
				<motion.div
					className="h-full origin-left bg-brand-accent"
					animate={{
						transform: `scaleX(${
							status === "done" ? 1 : (step + 1) / QUESTIONS.length
						})`,
					}}
					transition={{ duration: reduceMotion ? 0 : 0.28, ease: EASE }}
				/>
			</div>

			<main
				className={`flex min-h-0 min-w-0 flex-1 justify-center overflow-y-auto px-5 py-8 sm:px-8 sm:py-10 ${
					status === "done" ? "items-center" : "items-start sm:items-center"
				}`}
			>
				<AnimatePresence initial={false}>
					{status === "done" ? (
						<Success
							alreadyJoined={alreadyJoined}
							country={fields.country}
							artistName={fields.artistName}
							meetingAt={fields.meetingAt}
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
							initial={false}
							exit={{ opacity: 0 }}
							transition={{ duration: reduceMotion ? 0 : 0.35, ease: EASE }}
						>
							<h1 className="min-h-12 max-w-full text-[clamp(28px,8.5vw,32px)] leading-[1.3] tracking-[-0.04em] text-[#F5F7F5] sm:min-h-20 sm:max-w-xl sm:text-[clamp(2.25rem,5.5vw,3.75rem)] sm:tracking-[-0.055em]">
								<AccessRoll text={QUESTIONS[step]} live={introReady} />
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
									<AccessRoll text={activeHint} live={introReady} />
								)}
							</p>

							<motion.div
								layout="size"
								className={`relative overflow-hidden ${
									step === 6 ? "mt-4 sm:mt-6" : "mt-8 sm:mt-10"
								}`}
								transition={{ duration: reduceMotion ? 0 : 0.28, ease: EASE }}
							>
								<AnimatePresence
									initial={false}
									mode="popLayout"
									custom={direction}
								>
									<motion.div
										key={step}
										custom={direction}
										variants={{
											enter: (dir: number) =>
												reduceMotion
													? { opacity: 0 }
													: { opacity: 0, y: dir * 12 },
											center: { opacity: 1, y: 0 },
											exit: (dir: number) =>
												reduceMotion
													? { opacity: 0 }
													: { opacity: 0, y: dir * -10 },
										}}
										initial="enter"
										animate="center"
										exit="exit"
										transition={{
											duration: reduceMotion ? 0 : 0.28,
											ease: EASE,
										}}
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
											<LineInput
												id={`${id}-phone`}
												value={fields.phone}
												placeholder="+506 8888 0000"
												ariaLabel="Número de teléfono"
												type="tel"
												inputMode="tel"
												autoComplete="tel"
												invalid={Boolean(error)}
												describedBy={`${id}-hint`}
												onChange={(phone) => {
													setError(null);
													setFields((current) => ({ ...current, phone }));
												}}
											/>
										)}
										{step === 2 && (
											<button
												type="button"
												onClick={() => {
													if (status !== "idle") return;
													setError(null);
													setFields((current) => ({ ...current, phone: "" }));
													moveTo(3);
												}}
												className="access-press mt-3 cursor-pointer text-sm text-white/40 transition-colors duration-160 hover:text-white"
											>
												Saltar
											</button>
										)}
										{step === 3 && (
											<CountrySelect
												value={fields.country}
												onChange={(country) => {
													setFields((current) => ({ ...current, country }));
													setError(null);
												}}
												onUnavailable={() =>
													setError("De momento no estamos ahí.")
												}
											/>
										)}
										{step === 4 && (
											<ProvinceSelect
												value={fields.city}
												onChange={(city) => {
													setError(null);
													setFields((current) => ({ ...current, city }));
												}}
											/>
										)}
										{step === 5 && (
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
										{step === 5 && (
											<button
												type="button"
												onClick={() => {
													if (status !== "idle") return;
													setError(null);
													setFields((current) => ({ ...current, instagram: "" }));
													moveTo(6);
												}}
												className="access-press mt-3 cursor-pointer text-sm text-white/40 transition-colors duration-160 hover:text-white"
											>
												Saltar
											</button>
										)}
										{step === 6 && (
											<div className="flex flex-col gap-3">
												<MeetingScheduler
													value={fields.meetingAt}
													bookedSlots={bookedSlots}
													reduceMotion={Boolean(reduceMotion)}
													onChange={(meetingAt) => {
														setError(null);
														setFields((current) => ({ ...current, meetingAt }));
													}}
												/>
												{turnstileSiteKey ? (
													<div className="border border-white/10 bg-[#0D100D] px-3 py-2">
														<TurnstileWidget
															key={turnstileResetKey}
															theme="dark"
															bare
															onSuccess={(token) => {
																setTurnstileToken(token);
																setError(null);
															}}
															onExpire={() => setTurnstileToken("")}
															onError={() =>
																setError(
																	"La verificación de Cloudflare falló. Intentá de nuevo.",
																)
															}
														/>
													</div>
												) : null}
												<div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
													<button
														type="button"
														onClick={() => {
															if (status !== "idle") return;
															void joinWaitlist(
																fields.instagram.replace(/^@+/, ""),
																"",
															);
														}}
														className="access-press cursor-pointer text-xs text-white/40 transition-colors duration-160 hover:text-white sm:text-sm"
													>
														Prefiero coordinar la hora luego por WhatsApp
													</button>
													<span className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.06em] text-white/35">
														<span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
														Protegido con Cloudflare
													</span>
												</div>
											</div>
										)}
									</motion.div>
								</AnimatePresence>
							</motion.div>

							<motion.div
								className="mt-6 flex w-full items-center gap-2 sm:mt-7 sm:w-auto"
								transition={{ duration: reduceMotion ? 0 : 0.28, ease: EASE }}
							>
								<AnimatePresence initial={false}>
									{step > 0 && (
										<motion.button
											key="back"
											type="button"
											onClick={() => moveTo((step - 1) as Step)}
											aria-label="Volver"
											initial={{
												opacity: 0,
												transform: reduceMotion ? "none" : "translateX(-8px)",
											}}
											animate={{
												opacity: 1,
												transform: "translateX(0px)",
											}}
											exit={{
												opacity: 0,
												transform: reduceMotion
													? "none"
													: "translateX(-8px)",
											}}
											transition={{
												duration: reduceMotion ? 0 : 0.28,
												ease: EASE,
											}}
											className="access-back access-press flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center overflow-hidden border border-[#343734] bg-[#101210] text-white/70 transition-[border-color,color,background-color] duration-160 hover:border-white/30 hover:bg-[#151815] hover:text-white"
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
									className="access-primary access-press flex h-12 min-w-0 flex-1 cursor-pointer items-center justify-between gap-4 overflow-visible bg-brand px-5 text-sm font-medium text-white transition-[background-color] duration-160 hover:bg-brand-hover disabled:cursor-wait disabled:opacity-50 sm:min-w-52 sm:flex-none"
								>
									<AccessRoll
										hover
										play={introReady}
										options={SLOT_BUTTON}
										text={
											status === "submitting"
												? "Enviando…"
												: step === 6
													? "Agendar y anotarme"
													: "Continuar"
										}
										className="whitespace-nowrap"
									/>
									<span className="access-next-icon shrink-0">
										<IconArrowRight className="h-5 w-5" />
									</span>
								</button>
							</motion.div>

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
			</motion.div>
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
	live = true,
}: {
	step: Step;
	done: boolean;
	reduceMotion: boolean;
	live?: boolean;
}) {
	return (
		<div className="flex items-center gap-3" aria-label={done ? "Completado" : `Paso ${step + 1} de ${QUESTIONS.length}`}>
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
					live={live}
					options={SLOT_PROGRESS}
				/>
			</span>
		</div>
	);
}

function Success({
	alreadyJoined,
	country,
	artistName,
	meetingAt,
	reduceMotion,
}: {
	alreadyJoined: boolean;
	country: Country;
	artistName: string;
	meetingAt: string;
	reduceMotion: boolean;
}) {
	const place = country === "US" ? "Estados Unidos" : "Costa Rica";
	const meetingSummary = formatMeetingSummary(meetingAt);
	const gcalUrl = buildGoogleCalendarUrl(meetingAt, artistName);

	return (
		<motion.section
			key="success"
			initial={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: "translateY(12px)" }}
			animate={{ opacity: 1, transform: "translateY(0px)" }}
			transition={{ duration: reduceMotion ? 0.25 : 0.7, ease: EASE }}
			className="absolute inset-0 flex w-full flex-col items-center justify-center px-5 text-center"
			aria-live="polite"
		>
			<h1 className="max-w-[14ch] text-[clamp(2.15rem,8vw,3.75rem)] leading-[1.08] tracking-[-0.045em] text-[#F5F7F5] sm:tracking-[-0.055em]">
				{alreadyJoined ? "Ya estabas en la lista." : "Estás en la lista."}
			</h1>
			<p className="mt-4 max-w-sm text-[15px] leading-6 text-white/50">
				{alreadyJoined
					? `Cuando abramos el próximo cupo en ${place}, te escribimos.`
					: meetingSummary
						? "Tu reunión quedó agendada directamente en nuestra plataforma."
						: `Te escribiremos cuando abramos el próximo cupo en ${place}.`}
			</p>
			{meetingSummary ? (
				<div className="mt-5 flex w-full max-w-sm flex-col items-center gap-2.5 border border-white/15 bg-[#101310] px-4 py-3.5 text-left">
					<div className="flex w-full items-center justify-between gap-2">
						<span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-brand-accent">
							<span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
							Reunión 1:1 confirmada
						</span>
						<span className="font-mono text-[10px] text-white/40">15 MIN</span>
					</div>
					<p className="w-full text-sm font-medium text-white">
						{meetingSummary}
					</p>
					{gcalUrl ? (
						<a
							href={gcalUrl}
							target="_blank"
							rel="noreferrer"
							className="access-press mt-0.5 inline-flex w-full items-center justify-center border border-white/15 bg-white/5 px-3 py-2 font-mono text-[11px] text-white/85 transition-colors hover:border-white/30 hover:bg-white/10 hover:text-white"
						>
							+ Agregar a Google Calendar
						</a>
					) : null}
				</div>
			) : null}
			<div className="mx-auto mt-6 w-[min(100%,15rem)] sm:mt-8 sm:w-[min(100%,18rem)]">
				<div className="access-success-art">
					<Image
						src="/images/gigblade-access-signpost-blue.png"
						width={706}
						height={706}
						alt="Un DJ en un cruce de caminos elige la flecha azul"
						className="mx-auto h-auto w-full"
						sizes="(max-width: 768px) 100vw, 706px"
						priority
					/>
				</div>
			</div>
			<div>
				<AppLink
					href="/"
					onClick={() => {
						try {
							localStorage.removeItem("gb_ref");
							document.cookie = "gb_ref=; path=/; max-age=0;";
						} catch {}
					}}
					className="mt-6 inline-block text-sm text-white/40 transition-colors duration-160 hover:text-white"
				>
					Volver a GigBlades
				</AppLink>
			</div>
		</motion.section>
	);
}

const WEEKDAYS_SHORT = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"] as const;

function toCrDateKey(date: Date): string {
	const parts = new Intl.DateTimeFormat("en-CA", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		timeZone: "America/Costa_Rica",
	}).formatToParts(date);
	const y = parts.find((p) => p.type === "year")?.value ?? "2026";
	const m = parts.find((p) => p.type === "month")?.value ?? "01";
	const d = parts.find((p) => p.type === "day")?.value ?? "01";
	return `${y}-${m}-${d}`;
}

function buildSlotIso(dateKey: string, hour24: string): string {
	return new Date(`${dateKey}T${hour24}:00-06:00`).toISOString();
}

function formatHourLabel(hour24: string, use24h: boolean): string {
	if (use24h) return hour24;
	const [hStr, mStr] = hour24.split(":");
	const h = Number(hStr);
	const suffix = h >= 12 ? "PM" : "AM";
	const h12 = h % 12 === 0 ? 12 : h % 12;
	return `${h12}:${mStr} ${suffix}`;
}

function isDayAvailable(dateKey: string, todayKey: string): boolean {
	if (dateKey < todayKey) return false;
	const d = new Date(`${dateKey}T12:00:00-06:00`);
	// Sundays (0) closed
	return d.getUTCDay() !== 0;
}

function getNextAvailableDateKeys(todayKey: string, count: number): string[] {
	const result: string[] = [];
	const cursor = new Date(`${todayKey}T12:00:00-06:00`);
	for (let i = 0; i < 45 && result.length < count; i++) {
		const key = toCrDateKey(cursor);
		if (isDayAvailable(key, todayKey)) {
			result.push(key);
		}
		cursor.setUTCDate(cursor.getUTCDate() + 1);
	}
	return result;
}

function MeetingScheduler({
	value,
	bookedSlots,
	reduceMotion,
	onChange,
}: {
	value: string;
	bookedSlots: string[];
	reduceMotion: boolean;
	onChange: (iso: string) => void;
}) {
	const todayKey = useMemo(() => toCrDateKey(new Date()), []);
	const quickDays = useMemo(
		() => getNextAvailableDateKeys(todayKey, 6),
		[todayKey],
	);

	const initialDateKey = useMemo(() => {
		if (value) {
			const parsed = new Date(value);
			if (!Number.isNaN(parsed.getTime())) {
				return toCrDateKey(parsed);
			}
		}
		return quickDays[0] ?? todayKey;
	}, [value, quickDays, todayKey]);

	const [selectedDateKey, setSelectedDateKey] = useState<string>(initialDateKey);
	const [use24h, setUse24h] = useState<boolean>(false);
	const [monthOffset, setMonthOffset] = useState<number>(0);
	const [monthDir, setMonthDir] = useState<number>(1);
	const slotsContainerRef = useRef<HTMLDivElement>(null);

	const baseYearMonth = useMemo(() => {
		const [y, m] = todayKey.split("-").map(Number);
		return { year: y, month: m - 1 };
	}, [todayKey]);

	const activeMonthDate = useMemo(() => {
		return new Date(Date.UTC(baseYearMonth.year, baseYearMonth.month + monthOffset, 1, 12, 0, 0));
	}, [baseYearMonth, monthOffset]);

	const monthLabel = useMemo(() => {
		const raw = new Intl.DateTimeFormat("es-CR", {
			month: "long",
			year: "numeric",
			timeZone: "UTC",
		}).format(activeMonthDate);
		return raw.charAt(0).toUpperCase() + raw.slice(1);
	}, [activeMonthDate]);

	const calendarDays = useMemo(() => {
		const year = activeMonthDate.getUTCFullYear();
		const month = activeMonthDate.getUTCMonth();
		const firstDay = new Date(Date.UTC(year, month, 1, 12, 0, 0));
		// Convert Sunday=0..Saturday=6 into Monday=0..Sunday=6
		const startPad = (firstDay.getUTCDay() + 6) % 7;
		const daysInMonth = new Date(Date.UTC(year, month + 1, 0, 12, 0, 0)).getUTCDate();

		const cells: Array<{ key: string; dayNumber: number; available: boolean; isToday: boolean } | null> = [];
		for (let i = 0; i < startPad; i++) {
			cells.push(null);
		}
		for (let d = 1; d <= daysInMonth; d++) {
			const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
			cells.push({
				key,
				dayNumber: d,
				available: isDayAvailable(key, todayKey),
				isToday: key === todayKey,
			});
		}
		return cells;
	}, [activeMonthDate, todayKey]);

	const bookedTimestamps = useMemo(() => {
		return bookedSlots
			.map((iso) => new Date(iso).getTime())
			.filter((t) => !Number.isNaN(t));
	}, [bookedSlots]);

	const slotsForSelectedDay = useMemo(() => {
		const nowPlusBuffer = Date.now() + 30 * 60 * 1000;
		return MEETING_HOURS.map((hour24) => {
			const iso = buildSlotIso(selectedDateKey, hour24);
			const slotMs = new Date(iso).getTime();
			const isPast = slotMs < nowPlusBuffer;
			const isBooked = bookedTimestamps.some(
				(bookedMs) => Math.abs(bookedMs - slotMs) < 25 * 60 * 1000,
			);
			return {
				hour24,
				iso,
				disabled: isPast || isBooked,
				isBooked,
			};
		});
	}, [selectedDateKey, bookedTimestamps]);

	const selectedDayHeaderLabel = useMemo(() => {
		const d = new Date(`${selectedDateKey}T12:00:00-06:00`);
		const formatted = new Intl.DateTimeFormat("es-CR", {
			weekday: "short",
			day: "numeric",
			month: "short",
			timeZone: "America/Costa_Rica",
		}).format(d);
		return formatted.replace(/\./g, "").toUpperCase();
	}, [selectedDateKey]);

	const handleSelectDay = (dateKey: string) => {
		setSelectedDateKey(dateKey);
		// If a slot was already selected at a specific hour, try to keep that hour on the new day if available
		if (value) {
			const prevDate = new Date(value);
			if (!Number.isNaN(prevDate.getTime())) {
				const crHour = new Intl.DateTimeFormat("en-GB", {
					hour: "2-digit",
					minute: "2-digit",
					hour12: false,
					timeZone: "America/Costa_Rica",
				}).format(prevDate);
				const candidateIso = buildSlotIso(dateKey, crHour);
				const candidateMs = new Date(candidateIso).getTime();
				const isBooked = bookedTimestamps.some(
					(b) => Math.abs(b - candidateMs) < 25 * 60 * 1000,
				);
				if (candidateMs > Date.now() + 30 * 60 * 1000 && !isBooked) {
					onChange(candidateIso);
					return;
				}
			}
			onChange("");
		}
	};

	const changeMonth = (delta: number) => {
		const next = monthOffset + delta;
		if (next < 0 || next > 3) return;
		setMonthDir(delta);
		setMonthOffset(next);
	};

	const availableCount = slotsForSelectedDay.filter((s) => !s.disabled).length;

	return (
		<div
			data-access-field
			tabIndex={-1}
			className="w-full overflow-hidden border border-white/14 bg-[#0C0E0C]/95 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85)] outline-none"
		>
			{/* Cal.com-style Top Header Bar */}
			<div className="flex items-center justify-between gap-2 border-b border-white/10 bg-[#101310] px-3.5 py-2.5 sm:px-4 sm:py-3">
				<div className="flex min-w-0 items-center gap-2">
					<span className="relative flex h-2 w-2 shrink-0">
						<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-accent opacity-75" />
						<span className="relative inline-flex h-2 w-2 rounded-full bg-brand-accent" />
					</span>
					<span className="truncate text-xs font-medium text-white/90 sm:text-[13px]">
						Demo 1:1 · GigBlades
					</span>
					<span className="shrink-0 border border-white/12 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-white/65">
						15 min
					</span>
					<span className="hidden font-mono text-[10px] text-white/35 md:inline">
						· GMT-6 (Costa Rica)
					</span>
				</div>

				{/* 12h / 24h Segmented Toggle */}
				<div
					role="group"
					aria-label="Formato de hora"
					className="flex shrink-0 items-center border border-white/12 bg-[#080908] p-0.5 font-mono text-[10px]"
				>
					<button
						type="button"
						onClick={() => setUse24h(false)}
						className={`cursor-pointer px-2 py-0.5 transition-colors ${
							!use24h
								? "bg-white/15 font-semibold text-white"
								: "text-white/40 hover:text-white/75"
						}`}
					>
						12h
					</button>
					<button
						type="button"
						onClick={() => setUse24h(true)}
						className={`cursor-pointer px-2 py-0.5 transition-colors ${
							use24h
								? "bg-white/15 font-semibold text-white"
								: "text-white/40 hover:text-white/75"
						}`}
					>
						24h
					</button>
				</div>
			</div>

			{/* Mobile-First Quick Day Pills */}
			<div className="flex items-center gap-1.5 overflow-x-auto border-b border-white/8 bg-[#0A0C0A] px-3.5 py-2 sm:px-4">
				{quickDays.map((dayKey, idx) => {
					const d = new Date(`${dayKey}T12:00:00-06:00`);
					const isSelected = dayKey === selectedDateKey;
					const shortLabel =
						dayKey === todayKey
							? "Hoy"
							: idx === 1 &&
								  new Date(`${todayKey}T12:00:00-06:00`).getTime() +
										86_400_000 ===
										d.getTime()
								? "Mañana"
								: new Intl.DateTimeFormat("es-CR", {
										weekday: "short",
										day: "numeric",
										timeZone: "America/Costa_Rica",
									})
										.format(d)
										.replace(/\./g, "");
					return (
						<button
							key={dayKey}
							type="button"
							onClick={() => {
								const [y, m] = dayKey.split("-").map(Number);
								const targetOffset =
									(y - baseYearMonth.year) * 12 + (m - 1 - baseYearMonth.month);
								if (targetOffset >= 0 && targetOffset <= 3) {
									setMonthOffset(targetOffset);
								}
								handleSelectDay(dayKey);
							}}
							className={`access-press shrink-0 cursor-pointer border px-2.5 py-1 font-mono text-[11px] capitalize transition-all duration-160 ${
								isSelected
									? "border-brand-accent bg-brand/25 font-semibold text-white"
									: "border-white/10 bg-[#111411] text-white/55 hover:border-white/25 hover:text-white/90"
							}`}
						>
							{shortLabel}
						</button>
					);
				})}
			</div>

			{/* Main Cal.com Split View: Month Calendar + Time Slots */}
			<div className="grid grid-cols-1 divide-y divide-white/10 sm:grid-cols-[1.15fr_0.85fr] sm:divide-x sm:divide-y-0">
				{/* Left Column: Calendar Grid */}
				<div className="p-3.5 sm:p-4">
					<div className="mb-3 flex items-center justify-between">
						<span className="text-sm font-medium tracking-[-0.02em] text-white">
							{monthLabel}
						</span>
						<div className="flex items-center gap-1">
							<button
								type="button"
								onClick={() => changeMonth(-1)}
								disabled={monthOffset <= 0}
								aria-label="Mes anterior"
								className="access-press flex h-7 w-7 cursor-pointer items-center justify-center border border-white/12 bg-[#121512] text-white/70 transition-colors hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
							>
								<IconArrowLeft className="h-3.5 w-3.5" />
							</button>
							<button
								type="button"
								onClick={() => changeMonth(1)}
								disabled={monthOffset >= 3}
								aria-label="Mes siguiente"
								className="access-press flex h-7 w-7 cursor-pointer items-center justify-center border border-white/12 bg-[#121512] text-white/70 transition-colors hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
							>
								<IconArrowRight className="h-3.5 w-3.5" />
							</button>
						</div>
					</div>

					<div className="mb-1.5 grid grid-cols-7 gap-1 text-center">
						{WEEKDAYS_SHORT.map((wd) => (
							<span
								key={wd}
								className="font-mono text-[10px] tracking-[0.08em] text-white/35"
							>
								{wd}
							</span>
						))}
					</div>

					<AnimatePresence mode="wait" initial={false} custom={monthDir}>
						<motion.div
							key={monthLabel}
							custom={monthDir}
							variants={{
								enter: (dir: number) =>
									reduceMotion ? { opacity: 0 } : { opacity: 0, x: dir * 10 },
								center: { opacity: 1, x: 0 },
								exit: (dir: number) =>
									reduceMotion ? { opacity: 0 } : { opacity: 0, x: dir * -10 },
							}}
							initial="enter"
							animate="center"
							exit="exit"
							transition={{ duration: reduceMotion ? 0 : 0.2, ease: EASE }}
							className="grid grid-cols-7 gap-1"
						>
							{calendarDays.map((cell, index) => {
								if (!cell) {
									return <span key={`empty-${index}`} className="h-9 sm:h-9" />;
								}
								const isSelected = cell.key === selectedDateKey;
								return (
									<button
										key={cell.key}
										type="button"
										disabled={!cell.available}
										onClick={() => handleSelectDay(cell.key)}
										aria-label={cell.key}
										aria-pressed={isSelected}
										className={`access-press relative flex h-9 w-full flex-col items-center justify-center font-mono text-xs tabular-nums transition-all duration-160 ${
											!cell.available
												? "cursor-not-allowed text-white/18"
												: isSelected
													? "bg-brand font-semibold text-white shadow-[0_0_20px_rgba(29,78,216,0.45)] ring-1 ring-brand-accent"
													: "border border-white/6 bg-[#131713] text-white/85 hover:border-white/25 hover:bg-[#1A201A] hover:text-white"
										}`}
									>
										<span>{cell.dayNumber}</span>
										{cell.isToday && (
											<span
												className={`absolute bottom-1 h-1 w-1 rounded-full ${
													isSelected ? "bg-white" : "bg-brand-accent"
												}`}
											/>
										)}
									</button>
								);
							})}
						</motion.div>
					</AnimatePresence>
				</div>

				{/* Right Column: Time Slots Panel */}
				<div
					ref={slotsContainerRef}
					className="flex flex-col justify-between p-3.5 sm:p-4"
				>
					<div>
						<div className="mb-3 flex items-center justify-between gap-2">
							<span className="font-mono text-xs font-semibold tracking-[0.08em] text-white/90">
								{selectedDayHeaderLabel}
							</span>
							<span className="font-mono text-[10px] text-white/40">
								{availableCount} disp.
							</span>
						</div>

						<AnimatePresence mode="wait" initial={false}>
							<motion.div
								key={selectedDateKey}
								initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
								animate={{ opacity: 1, y: 0 }}
								exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
								transition={{ duration: reduceMotion ? 0 : 0.2, ease: EASE }}
								className="grid max-h-48 grid-cols-2 gap-1.5 overflow-y-auto pr-0.5 sm:max-h-56"
							>
								{slotsForSelectedDay.map((slot) => {
									const isSelected = value === slot.iso;
									return (
										<button
											key={slot.hour24}
											type="button"
											disabled={slot.disabled}
											onClick={() => onChange(slot.iso)}
											aria-pressed={isSelected}
											className={`access-press flex h-9 items-center justify-between border px-2.5 font-mono text-xs tabular-nums transition-all duration-160 ${
												slot.disabled
													? "cursor-not-allowed border-white/5 bg-white/[0.02] text-white/20 line-through"
													: isSelected
														? "border-brand-accent bg-brand font-semibold text-white shadow-[0_0_16px_rgba(29,78,216,0.4)]"
														: "border-white/12 bg-[#121612] text-white/85 hover:border-brand-accent/60 hover:bg-[#171D17] hover:text-white"
											}`}
										>
											<span>{formatHourLabel(slot.hour24, use24h)}</span>
											{slot.isBooked ? (
												<span className="text-[9px] uppercase no-underline opacity-60">
													Ocupado
												</span>
											) : isSelected ? (
												<span className="h-1.5 w-1.5 rounded-full bg-white" />
											) : (
												<span className="h-1.5 w-1.5 rounded-full bg-emerald-400/70" />
											)}
										</button>
									);
								})}
							</motion.div>
						</AnimatePresence>
					</div>

					{/* Selected Slot Summary Footer */}
					<div className="mt-3 border-t border-white/8 pt-2.5">
						{value ? (
							<div className="flex items-center justify-between gap-2 text-xs">
								<span className="truncate font-medium text-brand-accent">
									✓ {formatMeetingSummary(value)}
								</span>
								<button
									type="button"
									onClick={() => onChange("")}
									className="shrink-0 cursor-pointer font-mono text-[10px] text-white/40 hover:text-white"
								>
									Cambiar
								</button>
							</div>
						) : (
							<p className="font-mono text-[11px] text-white/40">
								Tocá una hora disponible para confirmar tu espacio.
							</p>
						)}
					</div>
				</div>
			</div>
		</div>
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
	onUnavailable,
}: {
	value: Country;
	onChange: (value: Country) => void;
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
	inputMode,
	autoComplete,
	ariaLabel,
	invalid = false,
	describedBy,
}: {
	id: string;
	value: string;
	onChange: (value: string) => void;
	placeholder: string;
	type?: string;
	inputMode?: "text" | "tel" | "email";
	autoComplete?: string;
	ariaLabel?: string;
	invalid?: boolean;
	describedBy?: string;
}) {
	return (
		<input
			id={id}
			type={type}
			inputMode={inputMode}
			value={value}
			onChange={(event) => onChange(event.target.value)}
			placeholder={placeholder}
			autoComplete={autoComplete}
			data-access-input
			aria-label={ariaLabel ?? placeholder}
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
