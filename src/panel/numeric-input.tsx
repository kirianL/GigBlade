"use client";

import { cn } from "@/panel/cn";

type NumericMode = "int" | "decimal";

function sanitizeNumericInput(raw: string, mode: NumericMode): string | null {
	const next = raw.replace(",", ".").trim();
	if (next === "") return "";
	if (mode === "int") {
		return /^\d*$/.test(next) ? next : null;
	}
	return /^\d*\.?\d*$/.test(next) ? next : null;
}

export function parseNumericField(
	raw: string,
	fallback = 0,
): number {
	if (raw === "" || raw === ".") return fallback;
	const n = Number(raw);
	return Number.isFinite(n) ? n : fallback;
}

type NumericInputProps = {
	value: string;
	onValueChange: (value: string) => void;
	mode?: NumericMode;
	className?: string;
	required?: boolean;
	id?: string;
	"aria-label"?: string;
};

export function NumericInput({
	value,
	onValueChange,
	mode = "decimal",
	className,
	required,
	id,
	"aria-label": ariaLabel,
}: NumericInputProps) {
	return (
		<input
			id={id}
			type="text"
			inputMode={mode === "int" ? "numeric" : "decimal"}
			autoComplete="off"
			aria-label={ariaLabel}
			required={required}
			value={value}
			onChange={(event) => {
				const sanitized = sanitizeNumericInput(event.target.value, mode);
				if (sanitized !== null) onValueChange(sanitized);
			}}
			className={cn(className)}
		/>
	);
}

type FieldNumericInputProps = NumericInputProps & {
	prefix?: string;
	suffix?: string;
	wrapperClassName?: string;
};

/** Input numérico dentro de un contenedor con altura fija y prefijo/sufijo alineados */
export function FieldNumericInput({
	prefix,
	suffix,
	wrapperClassName,
	className,
	...props
}: FieldNumericInputProps) {
	return (
		<div
			className={cn(
				"flex h-9 w-full items-center gap-1.5 rounded-lg border border-grayscale-5 bg-grayscale-1 px-2.5 text-grayscale-12 shadow-xs transition-colors focus-within:border-grayscale-8 focus-within:ring-2 focus-within:ring-grayscale-7/20 dark:border-white/[0.14] dark:bg-[#10100f] dark:focus-within:border-white/35",
				wrapperClassName,
			)}
		>
			{prefix ? (
				<span
					className="shrink-0 text-xs font-semibold tabular-nums text-grayscale-9"
					aria-hidden
				>
					{prefix}
				</span>
			) : null}
			<NumericInput
				{...props}
				className={cn(
					"min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-grayscale-12 placeholder:text-grayscale-8 tabular-nums leading-none shadow-none focus:outline-none focus:ring-0",
					className,
				)}
			/>
			{suffix ? (
				<span
					className="shrink-0 text-xs font-semibold text-grayscale-9"
					aria-hidden
				>
					{suffix}
				</span>
			) : null}
		</div>
	);
}
