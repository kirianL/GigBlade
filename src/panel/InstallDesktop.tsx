"use client";

import { Monitor } from "lucide-react";
import { useDesktopInstall } from "@/panel/useDesktopInstall";
import { PanelButton } from "@/panel/ui";

export function InstallDesktopCard() {
	const { canInstall, installed, install } = useDesktopInstall();
	if (installed || !canInstall) return null;

	return (
		<section className="card p-6 shadow-xs flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div className="min-w-0">
				<span className="text-[11px] font-semibold text-grayscale-8 uppercase tracking-wider block">
					Aplicación de escritorio
				</span>
				<p className="mt-1 text-xs text-grayscale-10 leading-relaxed">
					Instalá el panel como aplicación para abrirlo directo, sin buscar el sitio.
				</p>
			</div>
			<PanelButton variant="secondary" onClick={() => void install()}>
				<Monitor size={14} />
				<span>Instalar</span>
			</PanelButton>
		</section>
	);
}
