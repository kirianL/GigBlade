import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@autumn/ui";
import { TrashIcon } from "@phosphor-icons/react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { readPanelAuthSession } from "@/gigblade/panel-session";
import { deleteDj } from "@/gigblade/site-api";

export function DeleteDjButton({
	slug,
	name,
	onDeleted,
}: {
	slug: string;
	name: string;
	onDeleted?: (slug: string) => void;
}) {
	const titleId = useId();
	const descId = useId();
	const errorId = useId();
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
			<Button
				variant="secondary"
				size="sm"
				type="button"
				onClick={(event) => {
					event.preventDefault();
					event.stopPropagation();
					setError(null);
					setOpen(true);
				}}
			>
				<TrashIcon size={16} aria-hidden />
				Eliminar
			</Button>
			<Dialog
				open={open}
				onOpenChange={(next) => {
					if (loading) return;
					setOpen(next);
					if (!next) setError(null);
				}}
			>
				<DialogContent
					aria-labelledby={titleId}
					aria-describedby={descId}
					onClick={(event) => event.stopPropagation()}
				>
					<DialogHeader>
						<DialogTitle id={titleId}>Eliminar a {name}</DialogTitle>
						<DialogDescription id={descId}>
							Se borra la página, el acceso al panel y las fotos. No se puede
							deshacer.
						</DialogDescription>
					</DialogHeader>
					{error ? (
						<p id={errorId} role="alert" className="text-sm text-destructive">
							{error}
						</p>
					) : null}
					<DialogFooter>
						<Button
							variant="secondary"
							type="button"
							onClick={() => setOpen(false)}
							disabled={loading}
						>
							Cancelar
						</Button>
						<Button
							variant="destructive"
							type="button"
							onClick={remove}
							disabled={loading}
							aria-busy={loading}
							aria-describedby={error ? errorId : undefined}
						>
							{loading ? "Eliminando…" : "Eliminar DJ"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
