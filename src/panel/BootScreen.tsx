"use client";

export function BootScreen({ fullPage = true }: { fullPage?: boolean }) {
	return (
		<div
			className={
				fullPage
					? "app-canvas min-h-dvh flex items-center justify-center p-6 text-grayscale-12"
					: "py-16 flex items-center justify-center text-grayscale-12"
			}
		>
			<div className="flex flex-col items-center gap-3">
				<div className="size-8 rounded-lg bg-grayscale-12 text-grayscale-1 flex items-center justify-center font-mono font-bold text-xs shadow-2xs animate-pulse">
					GB
				</div>
				<p className="text-[12px] font-medium text-grayscale-9">
					Cargando espacio de trabajo…
				</p>
			</div>
		</div>
	);
}
