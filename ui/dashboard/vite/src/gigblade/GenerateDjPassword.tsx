import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	MiniCopyButton,
} from "@autumn/ui";
import { KeyIcon } from "@phosphor-icons/react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { readPanelAuthSession } from "@/gigblade/panel-session";
import { generateDjPassword } from "@/gigblade/site-api";

export function GenerateDjPasswordButton({
	slug,
	email,
	name,
}: {
	slug: string;
	email: string;
	name: string;
}) {
	const titleId = useId();
	const descId = useId();
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
			<Button
				variant="secondary"
				size="sm"
				type="button"
				onClick={generate}
				disabled={loading}
				aria-busy={loading}
			>
				<KeyIcon size={16} aria-hidden />
				{loading ? "Generando…" : "Generar contraseña"}
			</Button>
			<Dialog
				open={open}
				onOpenChange={(next) => {
					setOpen(next);
					if (!next) setGenerated(null);
				}}
			>
				<DialogContent aria-labelledby={titleId} aria-describedby={descId}>
					<DialogHeader>
						<DialogTitle id={titleId}>Contraseña para {name}</DialogTitle>
						<DialogDescription id={descId}>
							Pasale estos datos. La contraseña anterior deja de servir. No se
							vuelve a mostrar.
						</DialogDescription>
					</DialogHeader>
					{generated ? (
						<div className="flex flex-col gap-3">
							<div>
								<p className="text-xs text-tertiary-foreground">Correo</p>
								<div className="mt-1 flex items-center justify-between gap-2">
									<p className="font-mono text-sm break-all">{generated.email}</p>
									<MiniCopyButton text={generated.email} />
								</div>
							</div>
							<div>
								<p className="text-xs text-tertiary-foreground">Contraseña</p>
								<div className="mt-1 flex items-center justify-between gap-2">
									<p className="font-mono text-sm break-all">
										{generated.password}
									</p>
									<MiniCopyButton text={generated.password} />
								</div>
							</div>
						</div>
					) : null}
					<DialogFooter>
						<Button
							variant="secondary"
							onClick={() => {
								setOpen(false);
								setGenerated(null);
							}}
						>
							Listo
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
