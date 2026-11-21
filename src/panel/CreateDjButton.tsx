"use client";

import { Plus } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { readPanelAuthSession } from "@/panel/panel-session";
import { createDj, type PlatformSite } from "@/panel/site-api";
import { CopyButton, PanelButton, PanelInput, PanelModal } from "@/panel/ui";

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
	const nameId = useId();
	const emailId = useId();
	const slugId = useId();
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

	const close = () => {
		if (loading) return;
		setOpen(false);
		resetForm();
	};

	const submit = async (event: React.FormEvent) => {
		event.preventDefault();
		const session = readPanelAuthSession();
		if (!session) {
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
			<PanelButton
				variant="primary"
				onClick={() => {
					resetForm();
					setOpen(true);
				}}
			>
				<Plus size={14} />
				<span>Agregar DJ</span>
			</PanelButton>

			<PanelModal
				open={open}
				onClose={close}
				title={created ? `Acceso para ${created.name}` : "Agregar DJ"}
				description={
					created
						? "Pasale estos datos. La contraseña no se vuelve a mostrar."
						: "Se crea la página y un acceso al panel. El dominio propio se asigna después."
				}
			>
				{created ? (
					<div className="space-y-4">
						<div className="p-4 surface-soft space-y-3">
							<div>
								<span className="text-[11px] font-semibold text-grayscale-8 uppercase tracking-wider block">
									Correo
								</span>
								<div className="mt-1 flex items-center justify-between gap-2">
									<p className="font-mono text-xs font-semibold text-grayscale-12 break-all">
										{created.email}
									</p>
									<CopyButton text={created.email} label="Copiar" />
								</div>
							</div>
							<div className="pt-3 border-t border-grayscale-3/80">
								<span className="text-[11px] font-semibold text-grayscale-8 uppercase tracking-wider block">
									Contraseña
								</span>
								<div className="mt-1 flex items-center justify-between gap-2">
									<p className="font-mono text-xs font-semibold text-grayscale-12 break-all">
										{created.password}
									</p>
									<CopyButton text={created.password} label="Copiar" />
								</div>
							</div>
						</div>
						<div className="flex justify-end pt-2">
							<PanelButton variant="primary" onClick={close}>
								Listo
							</PanelButton>
						</div>
					</div>
				) : (
					<form onSubmit={(event) => void submit(event)} className="space-y-4">
						{error ? (
							<div className="p-3.5 bg-red-3/60 border border-red-6/60 text-red-11 text-xs rounded-xl">
								{error}
							</div>
						) : null}

						<div>
							<label
								htmlFor={nameId}
								className="block text-xs font-semibold text-grayscale-11 mb-1.5"
							>
								Nombre *
							</label>
							<PanelInput
								id={nameId}
								value={name}
								onChange={(event) => {
									const next = event.target.value;
									setName(next);
									if (!slugTouched) setSlug(slugFromName(next));
								}}
								placeholder="Ej. DJ Marco"
								autoComplete="off"
								required
								minLength={2}
								maxLength={80}
							/>
						</div>

						<div>
							<label
								htmlFor={emailId}
								className="block text-xs font-semibold text-grayscale-11 mb-1.5"
							>
								Correo *
							</label>
							<PanelInput
								id={emailId}
								type="email"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								placeholder="dj@correo.com"
								autoComplete="off"
								required
							/>
						</div>

						<div>
							<label
								htmlFor={slugId}
								className="block text-xs font-semibold text-grayscale-11 mb-1.5"
							>
								Identificador (slug) *
							</label>
							<PanelInput
								id={slugId}
								value={slug}
								onChange={(event) => {
									setSlugTouched(true);
									setSlug(event.target.value.toLowerCase());
								}}
								placeholder="dj-marco"
								autoComplete="off"
								required
								pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
								title="Letras minúsculas, números y guiones"
							/>
							<p className="text-[11px] text-grayscale-9 mt-1">
								Letras minúsculas, números y guiones. Sirve para reconocer la
								página en el panel.
							</p>
						</div>

						<div className="pt-3 border-t border-grayscale-3/70 dark:border-white/[0.08] flex items-center justify-end gap-2">
							<PanelButton
								variant="ghost"
								onClick={close}
								disabled={loading}
							>
								Cancelar
							</PanelButton>
							<PanelButton type="submit" disabled={loading}>
								{loading ? "Creando…" : "Crear DJ"}
							</PanelButton>
						</div>
					</form>
				)}
			</PanelModal>
		</>
	);
}
