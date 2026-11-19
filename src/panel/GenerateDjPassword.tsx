"use client";

import { KeyRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { readPanelAuthSession } from "@/panel/panel-session";
import { generateDjPassword } from "@/panel/site-api";
import { CopyButton, PanelButton, PanelModal } from "@/panel/ui";

export function GenerateDjPasswordButton({
	slug,
	email,
	name,
	className,
}: {
	slug: string;
	email: string;
	name: string;
	className?: string;
}) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [generated, setGenerated] = useState<{
		email: string;
		password: string;
	} | null>(null);

	const generate = async () => {
		const session = readPanelAuthSession();
		if (!session?.token) {
			toast.error("Entrá de nuevo para generar una contraseña.");
			return;
		}
		setLoading(true);
		try {
			const next = await generateDjPassword({
				slug,
				email,
				name,
				token: session.token,
			});
			setGenerated({ email: next.email, password: next.password });
			setOpen(true);
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "No se pudo generar la contraseña.",
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
				onClick={() => void generate()}
				disabled={loading}
			>
				<KeyRound size={13} />
				<span>{loading ? "Generando…" : "Generar contraseña"}</span>
			</PanelButton>

			<PanelModal
				open={open}
				onClose={() => {
					setOpen(false);
					setGenerated(null);
				}}
				title={`Contraseña para ${name}`}
				description="Pasale estos datos. La contraseña anterior deja de servir y no se vuelve a mostrar."
			>
				{generated ? (
					<div className="space-y-4">
						<div className="p-4 surface-soft space-y-3">
							<div>
								<span className="text-[11px] font-semibold text-grayscale-8 uppercase tracking-wider block">
									Correo
								</span>
								<div className="mt-1 flex items-center justify-between gap-2">
									<p className="font-mono text-xs font-semibold text-grayscale-12 break-all">
										{generated.email}
									</p>
									<CopyButton text={generated.email} label="Copiar" />
								</div>
							</div>
							<div className="pt-3 border-t border-grayscale-3/80">
								<span className="text-[11px] font-semibold text-grayscale-8 uppercase tracking-wider block">
									Contraseña
								</span>
								<div className="mt-1 flex items-center justify-between gap-2">
									<p className="font-mono text-xs font-semibold text-grayscale-12 break-all">
										{generated.password}
									</p>
									<CopyButton text={generated.password} label="Copiar" />
								</div>
							</div>
						</div>
						<div className="flex justify-end pt-2">
							<PanelButton
								variant="primary"
								onClick={() => {
									setOpen(false);
									setGenerated(null);
								}}
							>
								Listo
							</PanelButton>
						</div>
					</div>
				) : null}
			</PanelModal>
		</>
	);
}
