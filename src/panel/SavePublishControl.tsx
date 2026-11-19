"use client";

import { CheckCircle2 } from "lucide-react";
import { PanelButton } from "@/panel/ui";

export function SavePublishControl({
	saving,
	saved,
	live,
	error,
}: {
	saving: boolean;
	saved: boolean;
	live: boolean;
	error?: string;
	saveTick?: number;
}) {
	const published = saved && live && !error;

	return (
		<div className="flex flex-wrap items-center gap-3">
			<PanelButton type="submit" variant="primary" disabled={saving}>
				{saving ? "Guardando…" : "Guardar y publicar"}
			</PanelButton>

			<p className="text-xs" aria-live="polite">
				{error ? (
					<span className="text-red-600 font-medium">{error}</span>
				) : published ? (
					<span className="inline-flex items-center gap-1.5 text-green-11 font-semibold">
						<CheckCircle2 size={14} className="text-emerald-600" />
						<span>Publicado en tu página</span>
					</span>
				) : null}
			</p>
		</div>
	);
}
