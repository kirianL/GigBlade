"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useId, useState, type FormEvent, type HTMLAttributes } from "react";
import {
	CTALines,
	IconArrowLeft,
	IconCTAStart,
	IconTick,
} from "@/app/constant";
import SlotLabel from "@/components/slot-label";
import { cn } from "@/lib/utils";

const EVENT_TYPES = [
	{ id: "club", label: "Club" },
	{ id: "festival", label: "Festival" },
	{ id: "private", label: "Privado" },
	{ id: "wedding", label: "Boda" },
	{ id: "corporate", label: "Corporativo" },
	{ id: "other", label: "Otro" },
] as const;

type EventTypeId = (typeof EVENT_TYPES)[number]["id"];

type Fields = {
	name: string;
	email: string;
	eventType: EventTypeId | "";
	city: string;
	eventDate: string;
	note: string;
	website: string;
};

type Step = 0 | 1 | 2;

const STEPS = [
	{ title: "Quién sos", hint: "Para devolverte la fecha." },
	{ title: "El evento", hint: "Contexto mínimo, sin un brief eterno." },
	{ title: "La nota", hint: "Opcional. Un renglón alcanza." },
] as const;

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const EMPTY: Fields = {
	name: "",
	email: "",
	eventType: "",
	city: "",
	eventDate: "",
	note: "",
	website: "",
};

function emailLooksValid(value: string) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function WishlistForm({ artistName }: { artistName: string }) {
	const formId = useId();
	const reduceMotion = useReducedMotion();
	const [step, setStep] = useState<Step>(0);
	const [direction, setDirection] = useState(1);
	const [fields, setFields] = useState<Fields>(EMPTY);
	const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>(
		{},
	);
	const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
	const [duplicate, setDuplicate] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);

	const goTo = (next: Step) => {
		setDirection(next > step ? 1 : -1);
		setStep(next);
		setFormError(null);
	};

	const validateStep = (current: Step) => {
		const nextErrors: Partial<Record<keyof Fields, string>> = {};

		if (current === 0) {
			if (fields.name.trim().length < 2) nextErrors.name = "Escribí tu nombre";
			if (!emailLooksValid(fields.email)) nextErrors.email = "Correo inválido";
		}

		if (current === 1) {
			if (!fields.eventType) nextErrors.eventType = "Elegí un tipo";
			if (fields.city.trim().length < 2) nextErrors.city = "¿En qué ciudad?";
		}

		setErrors(nextErrors);
		return Object.keys(nextErrors).length === 0;
	};

	const onSubmit = async (event: FormEvent) => {
		event.preventDefault();
		if (step < 2) {
			if (validateStep(step)) goTo((step + 1) as Step);
			return;
		}

		if (!validateStep(1) || !validateStep(0)) {
			goTo(0);
			return;
		}

		setStatus("submitting");
		setFormError(null);

		try {
			const response = await fetch("/api/wishlist", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: fields.name.trim(),
					email: fields.email.trim(),
					eventType: fields.eventType,
					city: fields.city.trim(),
					eventDate: fields.eventDate || undefined,
					note: fields.note.trim() || undefined,
					website: fields.website,
				}),
			});

			const payload = (await response.json()) as {
				duplicate?: boolean;
				message?: string;
			};

			if (!response.ok) {
				setStatus("idle");
				setFormError(payload.message ?? "No se pudo enviar. Probá de nuevo.");
				return;
			}

			setDuplicate(Boolean(payload.duplicate));
			setStatus("done");
		} catch {
			setStatus("idle");
			setFormError("No hay conexión. Intentá otra vez.");
		}
	};

	const offset = reduceMotion ? 0 : 12;

	return (
		<AnimatePresence mode="wait" initial={false}>
			{status === "done" ? (
				<motion.div
					key="done"
					initial={{
						opacity: 0,
						transform: reduceMotion ? "none" : "scale(0.97)",
					}}
					animate={{ opacity: 1, transform: "scale(1)" }}
					transition={{ duration: 0.22, ease: EASE_OUT }}
					className="flex flex-col gap-5 py-4"
				>
					<div className="flex h-11 w-11 items-center justify-center bg-brand text-white">
						<IconTick />
					</div>
					<div>
						<p className="font-sans text-[28px] leading-[32px] tracking-[-3%] text-white md:text-[32px] md:leading-[36px]">
							{duplicate ? "Ya estabas en la lista" : "Solicitud anotada"}
						</p>
						<p className="mt-3 max-w-md text-[14px] font-light leading-5 tracking-[-2%] text-[#FFFFFF99] md:text-[16px] md:leading-6">
							{artistName} va a ver esto en el panel. Te escribimos cuando haya
							fecha, no por un hilo de Instagram.
						</p>
					</div>
				</motion.div>
			) : (
				<motion.form
					key="form"
					onSubmit={onSubmit}
					className="flex flex-col"
					noValidate
				>
					<ol className="mb-8 grid grid-cols-3 gap-2" aria-label="Progreso">
						{STEPS.map((item, index) => {
							const active = index <= step;
							return (
								<li key={item.title} className="flex flex-col gap-2">
									<div className="h-[2px] overflow-hidden bg-[#292929]">
										<span
											className="block h-full origin-left bg-brand transition-transform duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
											style={{
												transform: active ? "scaleX(1)" : "scaleX(0)",
											}}
										/>
									</div>
									<p
										className={cn(
											"font-mono text-[11px] uppercase tracking-widest",
											active ? "text-white" : "text-[#FFFFFF66]",
										)}
									>
										{item.title}
									</p>
								</li>
							);
						})}
					</ol>

					<div className="relative min-h-[280px] overflow-hidden">
						<AnimatePresence mode="wait" custom={direction}>
							<motion.div
								key={step}
								initial={{
									opacity: 0,
									transform: `translateX(${direction * offset}%)`,
								}}
								animate={{ opacity: 1, transform: "translateX(0%)" }}
								exit={{
									opacity: 0,
									transform: `translateX(${direction * -offset}%)`,
								}}
								transition={{ duration: 0.22, ease: EASE_OUT }}
								className="wishlist-stack flex flex-col gap-5"
							>
								<p className="text-[14px] font-light tracking-[-2%] text-[#FFFFFF99]">
									{STEPS[step].hint}
								</p>

								{step === 0 && (
									<>
										<Field
											id={`${formId}-name`}
											label="Nombre"
											autoComplete="name"
											value={fields.name}
											error={errors.name}
											onChange={(name) =>
												setFields((current) => ({ ...current, name }))
											}
										/>
										<Field
											id={`${formId}-email`}
											label="Correo"
											type="email"
											autoComplete="email"
											inputMode="email"
											value={fields.email}
											error={errors.email}
											onChange={(email) =>
												setFields((current) => ({ ...current, email }))
											}
										/>
									</>
								)}

								{step === 1 && (
									<>
										<fieldset>
											<legend className="mb-3 font-mono text-[11px] uppercase tracking-widest text-[#FFFFFF99]">
												Tipo de evento
											</legend>
											<div className="flex flex-wrap gap-2">
												{EVENT_TYPES.map((option) => {
													const selected = fields.eventType === option.id;
													return (
														<button
															key={option.id}
															type="button"
															onClick={() => {
																setFields((current) => ({
																	...current,
																	eventType: option.id,
																}));
																setErrors((current) => ({
																	...current,
																	eventType: undefined,
																}));
															}}
															className={cn(
																"wishlist-press wishlist-chip min-h-11 px-3.5 font-mono text-[12px] uppercase tracking-widest transition-[transform,background-color,color,border-color] duration-200 ease-in-out",
																selected
																	? "bg-brand text-white"
																	: "border border-[#292929] bg-[#0F0F0F] text-[#FFFFFFCC]",
															)}
															aria-pressed={selected}
														>
															{option.label}
														</button>
													);
												})}
											</div>
											{errors.eventType && (
												<p className="mt-2 text-[13px] text-[#f87171]">
													{errors.eventType}
												</p>
											)}
										</fieldset>
										<Field
											id={`${formId}-city`}
											label="Ciudad"
											autoComplete="address-level2"
											value={fields.city}
											error={errors.city}
											onChange={(city) =>
												setFields((current) => ({ ...current, city }))
											}
										/>
										<Field
											id={`${formId}-date`}
											label="Fecha (opcional)"
											type="date"
											value={fields.eventDate}
											onChange={(eventDate) =>
												setFields((current) => ({ ...current, eventDate }))
											}
										/>
									</>
								)}

								{step === 2 && (
									<>
										<Field
											id={`${formId}-note`}
											label="Nota"
											multiline
											value={fields.note}
											onChange={(note) =>
												setFields((current) => ({ ...current, note }))
											}
										/>
										<div className="sr-only" aria-hidden="true">
											<label htmlFor={`${formId}-website`}>Sitio</label>
											<input
												id={`${formId}-website`}
												tabIndex={-1}
												autoComplete="off"
												value={fields.website}
												onChange={(event) =>
													setFields((current) => ({
														...current,
														website: event.target.value,
													}))
												}
											/>
										</div>
									</>
								)}
							</motion.div>
						</AnimatePresence>
					</div>

					{formError && (
						<p className="mt-4 text-[13px] text-[#f87171]" role="alert">
							{formError}
						</p>
					)}

					<div className="wishlist-dock sticky bottom-0 z-20 -mx-4 mt-8 flex gap-2 bg-[#0F0F0F]/92 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl md:static md:mx-0 md:bg-transparent md:px-0 md:pt-6 md:pb-0 md:backdrop-blur-none">
						{step > 0 && (
							<button
								type="button"
								onClick={() => goTo((step - 1) as Step)}
								className="wishlist-press flex h-12 w-12 shrink-0 items-center justify-center border border-[#292929] text-white"
								aria-label="Paso anterior"
							>
								<IconArrowLeft className="h-5 w-5" />
							</button>
						)}
						<button
							type="submit"
							disabled={status === "submitting"}
							className="wishlist-press relative flex h-12 min-w-0 flex-1 items-center justify-between overflow-hidden bg-brand px-4 text-white transition-[transform,background-color] duration-200 ease-in-out hover:bg-brand-hover disabled:opacity-70"
							data-slot-hover-root
						>
							<CTALines />
							<span className="relative z-10 flex w-full items-center justify-between gap-3">
								<SlotLabel
									text={
										status === "submitting"
											? "Enviando"
											: step === 2
												? "Enviar solicitud"
												: "Continuar"
									}
									hover
									hoverTint={false}
									className="font-sans text-[14px] font-medium tracking-[-2%] uppercase md:normal-case"
								/>
								<IconCTAStart className="h-3.5 w-3.5" />
							</span>
						</button>
					</div>
				</motion.form>
			)}
		</AnimatePresence>
	);
}

function Field({
	id,
	label,
	value,
	onChange,
	error,
	type = "text",
	autoComplete,
	inputMode,
	multiline = false,
}: {
	id: string;
	label: string;
	value: string;
	onChange: (value: string) => void;
	error?: string;
	type?: string;
	autoComplete?: string;
	inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
	multiline?: boolean;
}) {
	const shared = cn(
		"w-full bg-[#0F0F0F] px-3 py-3 font-sans text-[16px] tracking-[-2%] text-white outline-none",
		"border transition-[border-color,background-color] duration-200 ease-in-out",
		error ? "border-[#f87171]" : "border-[#292929] focus:border-brand",
	);

	return (
		<label
			htmlFor={id}
			className={cn("flex flex-col gap-2", error && "wishlist-invalid")}
		>
			<span className="font-mono text-[11px] uppercase tracking-widest text-[#FFFFFF99]">
				{label}
			</span>
			{multiline ? (
				<textarea
					id={id}
					rows={4}
					value={value}
					onChange={(event) => onChange(event.target.value)}
					className={cn(shared, "min-h-28 resize-none")}
				/>
			) : (
				<input
					id={id}
					type={type}
					autoComplete={autoComplete}
					inputMode={inputMode}
					value={value}
					onChange={(event) => onChange(event.target.value)}
					aria-invalid={Boolean(error)}
					className={shared}
				/>
			)}
			{error && (
				<span className="text-[13px] text-[#f87171]" role="alert">
					{error}
				</span>
			)}
		</label>
	);
}
