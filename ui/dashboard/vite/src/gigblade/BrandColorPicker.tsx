import { Input } from "@autumn/ui";
import { useEffect, useId, useState } from "react";

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
	const [hexDraft, setHexDraft] = useState(current.toUpperCase());

	useEffect(() => {
		setHexDraft(current.toUpperCase());
	}, [current]);

	return (
		<div className="flex flex-col gap-3">
			<p className="text-sm font-medium text-foreground">Color del sitio</p>
			<div
				role="radiogroup"
				aria-label="Colores sugeridos"
				className="flex flex-wrap gap-2"
			>
				{BRAND_COLOR_PRESETS.map((preset) => {
					const selected = current === preset.hex;
					const optionId = `${colorId}-${preset.hex.slice(1)}`;
					return (
						<label
							key={preset.hex}
							htmlFor={optionId}
							className={`relative size-10 rounded-full border shrink-0 cursor-pointer transition-transform duration-150 ease-[cubic-bezier(0.2,0,0,1)] active:scale-[0.96] ${
								selected
									? "ring-2 ring-foreground ring-offset-2 ring-offset-background border-transparent"
									: "border-border hover:border-foreground/40"
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
				<label htmlFor={colorId} className="sr-only">
					Elegir color
				</label>
				<input
					id={colorId}
					type="color"
					value={current}
					onChange={(event) => onChange(event.target.value.toLowerCase())}
					className="size-9 rounded-lg border border-border bg-input-background cursor-pointer p-0.5"
				/>
				<Input
					id={hexId}
					value={hexDraft}
					onChange={(event) => {
						const nextValue = event.target.value;
						setHexDraft(nextValue);
						const next = normalizeHex(nextValue);
						if (next) onChange(next);
					}}
					aria-label="Color hexadecimal"
					spellCheck={false}
					className="max-w-32 font-mono uppercase"
				/>
			</div>
			<p className="text-xs text-tertiary-foreground">
				Cambia el fondo y el velo de la portada.
			</p>
		</div>
	);
}
