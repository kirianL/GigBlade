"use client";

import { useId, useState } from "react";
import { PanelInput } from "@/panel/ui";

export const BRAND_COLOR_PRESETS = [
	{ hex: "#e52b20", label: "Rojo" },
	{ hex: "#ff4d00", label: "Naranja" },
	{ hex: "#f6339a", label: "Rosa" },
	{ hex: "#6d28d9", label: "Violeta" },
	{ hex: "#1d4ed8", label: "Azul" },
	{ hex: "#0f766e", label: "Verde" },
	{ hex: "#111111", label: "Negro" },
	{ hex: "#f5f5f5", label: "Blanco" },
] as const;

function normalizeHex(value: string): string | null {
	const hex = value.trim();
	if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return null;
	return `#${hex.slice(1).toLowerCase()}`;
}

export function BrandColorPicker({
	value,
	onChange,
}: {
	value: string;
	onChange: (hex: string) => void;
}) {
	const colorId = useId();
	const hexId = useId();
	const current = normalizeHex(value) ?? "#e52b20";
	const [hexEdit, setHexEdit] = useState<{ base: string; text: string } | null>(
		null,
	);
	const hexDraft =
		hexEdit?.base === current ? hexEdit.text : current.toUpperCase();

	return (
		<div className="space-y-3">
			<span className="block text-xs font-semibold text-grayscale-11">
				Color del sitio
			</span>
			<div
				role="radiogroup"
				aria-label="Colores sugeridos"
				className="flex flex-wrap gap-2.5"
			>
				{BRAND_COLOR_PRESETS.map((preset) => {
					const selected = current === preset.hex;
					const optionId = `${colorId}-${preset.hex.slice(1)}`;
					return (
						<label
							key={preset.hex}
							htmlFor={optionId}
							className={`relative size-9 rounded-full border shrink-0 cursor-pointer transition-transform active:scale-95 ${
								selected
									? "ring-2 ring-grayscale-12 ring-offset-2 ring-offset-grayscale-1 border-transparent"
									: "border-grayscale-4 hover:border-grayscale-7"
							}`}
							style={{ backgroundColor: preset.hex }}
						>
							<input
								id={optionId}
								type="radio"
								name={`${colorId}-preset`}
								value={preset.hex}
								checked={selected}
								onChange={() => onChange(preset.hex)}
								className="sr-only"
							/>
							<span className="sr-only">{preset.label}</span>
						</label>
					);
				})}
			</div>
			<div className="flex items-center gap-2">
				<input
					id={colorId}
					type="color"
					value={current}
					onChange={(event) => onChange(event.target.value.toLowerCase())}
					className="size-9 rounded-xl border border-grayscale-4 bg-grayscale-1 dark:bg-[#1b1b1a] cursor-pointer p-0.5"
				/>
				<PanelInput
					id={hexId}
					value={hexDraft}
					onChange={(event) => {
						const nextValue = event.target.value;
						const next = normalizeHex(nextValue);
						if (next) {
							setHexEdit(null);
							onChange(next);
						} else {
							setHexEdit({ base: current, text: nextValue });
						}
					}}
					aria-label="Color hexadecimal"
					spellCheck={false}
					className="max-w-32 font-mono uppercase"
				/>
			</div>
			<p className="text-[11px] text-grayscale-9">
				Cambia el fondo y el acento visual de la portada pública.
			</p>
		</div>
	);
}
