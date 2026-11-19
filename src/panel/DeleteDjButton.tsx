"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { readPanelAuthSession } from "@/panel/panel-session";
import { deleteDj } from "@/panel/site-api";
import { PanelButton, PanelModal } from "@/panel/ui";

export function DeleteDjButton({
	slug,
	name,
	onDeleted,
	className,
}: {
	slug: string;
	name: string;
	onDeleted?: (slug: string) => void;
	className?: string;
}) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const remove = async () => {
		const session = readPanelAuthSession();
		if (!session?.token) {
			setError("Entrá de nuevo para eliminar un DJ.");
			return;
		}
		setLoading(true);
		setError(null);
		try {
			await deleteDj({ slug, token: session.token });
			setOpen(false);
			toast.success(`Se eliminó a ${name}.`);
			onDeleted?.(slug);
		} catch (caught) {
			setError(
				caught instanceof Error
					? caught.message
					: "No se pudo eliminar el DJ.",
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<PanelButton
				variant="secondary"
				size="sm"
				className={className}
				onClick={(event) => {
					event.preventDefault();
					event.stopPropagation();
					setError(null);
					setOpen(true);
				}}
			>
				<Trash2 size={13} className="text-red-500" />
				<span>Eliminar</span>
			</PanelButton>

			<PanelModal
				open={open}
				onClose={() => {
					if (!loading) setOpen(false);
				}}
				title={`Eliminar a ${name}`}
				description="Se borra la página, el acceso al panel y las fotos. Esta acción no se puede deshacer."
			>
				<div className="space-y-4">
					{error ? (
						<div className="p-3.5 bg-red-3/60 border border-red-6/60 text-red-11 text-xs rounded-xl">
							{error}
						</div>
					) : null}
					<div className="flex items-center justify-end gap-2 pt-2">
						<PanelButton
							variant="ghost"
							onClick={() => setOpen(false)}
							disabled={loading}
						>
							Cancelar
						</PanelButton>
						<PanelButton
							variant="danger"
							onClick={() => void remove()}
							disabled={loading}
						>
							{loading ? "Eliminando…" : "Eliminar DJ"}
						</PanelButton>
					</div>
				</div>
			</PanelModal>
		</>
	);
}
