import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	MiniCopyButton,
} from "@autumn/ui";
import { PlusIcon } from "@phosphor-icons/react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { readPanelAuthSession } from "@/gigblade/panel-session";
import { createDj, type PlatformSite } from "@/gigblade/site-api";

function slugFromName(name: string) {
	return name
		.normalize("NFD")
		.replace(/\p{M}/gu, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 48);
}

export function CreateDjButton({
	onCreated,
}: {
	onCreated?: (site: PlatformSite) => void;
}) {
	const titleId = useId();
	const descId = useId();
	const errorId = useId();
	const nameId = useId();
	const emailId = useId();
	const slugId = useId();
	const slugHelpId = useId();
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [slug, setSlug] = useState("");
	const [slugTouched, setSlugTouched] = useState(false);
	const [created, setCreated] = useState<{
		email: string;
		password: string;
		name: string;
	} | null>(null);

	const resetForm = () => {
		setName("");
		setEmail("");
		setSlug("");
		setSlugTouched(false);
		setError(null);
		setCreated(null);
	};

	const submit = async (event: React.FormEvent) => {
		event.preventDefault();
		const session = readPanelAuthSession();
		if (!session?.token) {
			setError("Entrá de nuevo para agregar un DJ.");
			return;
		}
		setLoading(true);
		setError(null);
		try {
			const next = await createDj({
				name: name.trim(),
				email: email.trim(),
				slug: slug.trim(),
				token: session.token,
			});
			onCreated?.(next.site);
			setCreated({
				email: next.email,
				password: next.password,
				name: next.name,
			});
			toast.success(`Se creó la página de ${next.name}.`);
		} catch (caught) {
			setError(
				caught instanceof Error ? caught.message : "No se pudo crear el DJ.",
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
				onClick={() => {
					resetForm();
					setOpen(true);
				}}
			>
				<PlusIcon size={16} aria-hidden />
				Agregar DJ
			</Button>
			<Dialog
				open={open}
				onOpenChange={(next) => {
					if (loading) return;
					setOpen(next);
					if (!next) resetForm();
				}}
			>
				<DialogContent
					aria-labelledby={titleId}
					aria-describedby={descId}
					onClick={(event) => event.stopPropagation()}
				>
					{created ? (
						<>
							<DialogHeader>
								<DialogTitle id={titleId}>
									Acceso para {created.name}
								</DialogTitle>
								<DialogDescription id={descId}>
									Pasale estos datos. La contraseña no se vuelve a mostrar.
								</DialogDescription>
							</DialogHeader>
							<div className="flex flex-col gap-3">
								<div>
									<p className="text-xs text-tertiary-foreground">Correo</p>
									<div className="mt-1 flex items-center justify-between gap-2">
										<p className="font-mono text-sm break-all">{created.email}</p>
										<MiniCopyButton text={created.email} />
									</div>
								</div>
								<div>
									<p className="text-xs text-tertiary-foreground">Contraseña</p>
									<div className="mt-1 flex items-center justify-between gap-2">
										<p className="font-mono text-sm break-all">
											{created.password}
										</p>
										<MiniCopyButton text={created.password} />
									</div>
								</div>
							</div>
							<DialogFooter>
								<Button
									variant="secondary"
									type="button"
									onClick={() => {
										setOpen(false);
										resetForm();
									}}
								>
									Listo
								</Button>
							</DialogFooter>
						</>
					) : (
						<form onSubmit={(event) => void submit(event)}>
							<DialogHeader>
								<DialogTitle id={titleId}>Agregar DJ</DialogTitle>
								<DialogDescription id={descId}>
									Se crea la página y un acceso al panel. El dominio propio se
									asigna después.
								</DialogDescription>
							</DialogHeader>
							<div className="flex flex-col gap-3 py-2">
								<div className="flex flex-col gap-1">
									<label htmlFor={nameId} className="text-xs text-subtle">
										Nombre
									</label>
									<Input
										id={nameId}
										value={name}
										onChange={(event) => {
											const next = event.target.value;
											setName(next);
											if (!slugTouched) setSlug(slugFromName(next));
										}}
										autoComplete="off"
										required
										minLength={2}
										maxLength={80}
									/>
								</div>
								<div className="flex flex-col gap-1">
									<label htmlFor={emailId} className="text-xs text-subtle">
										Correo
									</label>
									<Input
										id={emailId}
										type="email"
										value={email}
										onChange={(event) => setEmail(event.target.value)}
										autoComplete="off"
										required
									/>
								</div>
								<div className="flex flex-col gap-1">
									<label htmlFor={slugId} className="text-xs text-subtle">
										Identificador
									</label>
									<Input
										id={slugId}
										value={slug}
										onChange={(event) => {
											setSlugTouched(true);
											setSlug(event.target.value.toLowerCase());
										}}
										autoComplete="off"
										required
										pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
										title="Letras minúsculas, números y guiones"
										aria-describedby={
											error ? `${slugHelpId} ${errorId}` : slugHelpId
										}
										aria-invalid={Boolean(error)}
									/>
									<p id={slugHelpId} className="text-xs text-tertiary-foreground">
										Letras minúsculas, números y guiones. Sirve para reconocer
										la página en el panel.
									</p>
								</div>
								{error ? (
									<p
										id={errorId}
										role="alert"
										className="text-sm text-destructive"
									>
										{error}
									</p>
								) : null}
							</div>
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
									type="submit"
									disabled={loading}
									aria-busy={loading}
									aria-describedby={error ? errorId : undefined}
								>
									{loading ? "Creando…" : "Crear DJ"}
								</Button>
							</DialogFooter>
						</form>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}
