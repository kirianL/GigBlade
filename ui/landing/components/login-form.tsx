"use client";

import Image from "next/image";
import { useId, useState, type FormEvent } from "react";
import AppLink from "./app-link";
import { getDashboardUrl } from "@/lib/dashboard-url";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fieldClass =
	"h-10 w-full rounded-md border bg-transparent px-3 text-base text-white outline-none transition-colors placeholder:text-white/40 focus-visible:border-brand-accent sm:text-sm";

export default function LoginForm() {
	const id = useId();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const hintId = `${id}-hint`;

	const submit = async (event: FormEvent) => {
		event.preventDefault();
		const nextEmail = email.trim();
		if (!nextEmail) {
			setError("El correo está vacío.");
			return;
		}
		if (!EMAIL.test(nextEmail)) {
			setError("El correo no tiene un formato válido.");
			return;
		}
		if (!password) {
			setError("La contraseña está vacía.");
			return;
		}
		if (password.length < 8) {
			setError("La contraseña no es válida.");
			return;
		}
		setSubmitting(true);
		setError(null);
		try {
			const response = await fetch("/api/panel/login", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ email: nextEmail, password }),
			});
			const body = (await response.json().catch(() => null)) as {
				token?: string;
				user?: { role?: string; slug?: string };
				message?: string;
			} | null;
			if (!response.ok || !body?.token) {
				setError(body?.message || "El correo o la contraseña no coinciden.");
				setSubmitting(false);
				return;
			}
			const dashboard = getDashboardUrl();
			const sameOrigin = (() => {
				try {
					return new URL(dashboard).origin === window.location.origin;
				} catch {
					return true;
				}
			})();
			const next = new URL("/sign-in", sameOrigin ? window.location.origin : dashboard);
			next.searchParams.set("token", body.token);
			if (body.user?.role === "dj" && body.user.slug) {
				next.searchParams.set("next", `/studio?dj=${body.user.slug}`);
			}
			window.location.assign(next.toString());
		} catch {
			setError("No se pudo entrar. Intentá de nuevo.");
			setSubmitting(false);
		}
	};

	return (
		<div className="flex min-h-dvh bg-[#09090b] text-white">
			<div className="relative hidden min-h-dvh w-1/2 overflow-hidden lg:block">
				<Image
					src="/images/dj/dj-crowd.jpg"
					alt=""
					fill
					priority
					sizes="50vw"
					className="object-cover"
				/>
				<AppLink
					href="/"
					className="absolute bottom-6 left-6 z-10 font-sans text-[18px] font-medium tracking-[-3%] text-white"
				>
					GigBlade
				</AppLink>
			</div>

			<div className="flex min-h-dvh min-w-0 flex-1 flex-col">
				<header className="flex h-14 shrink-0 items-center justify-between px-5 pt-[env(safe-area-inset-top)] lg:hidden">
					<AppLink
						href="/"
						className="font-sans text-[18px] font-medium tracking-[-3%] text-white"
					>
						GigBlade
					</AppLink>
					<AppLink
						href="/acceso"
						className="text-sm text-white/45 transition-colors duration-160 hover:text-white"
					>
						Creá tu página
					</AppLink>
				</header>

				<main className="flex min-h-0 flex-1 items-start justify-center overflow-y-auto px-5 py-8 sm:items-center sm:px-8 sm:py-10">
					<div className="w-full max-w-[350px]">
						<div className="flex flex-col items-center text-center">
							<h1 className="font-sans text-[20px] font-medium tracking-[-0.03em] text-white">
								GigBlade
							</h1>
							<p
								id={hintId}
								className={`mt-2 text-sm leading-6 ${
									error ? "text-[#E8A49C]" : "text-white/50"
								}`}
								aria-live="polite"
							>
								{error ?? "Entrá para continuar."}
							</p>
						</div>

						<form
							onSubmit={submit}
							noValidate
							className="mt-8 flex w-full flex-col gap-3"
						>
							<label htmlFor={`${id}-email`} className="sr-only">
								Correo
							</label>
							<input
								id={`${id}-email`}
								type="email"
								name="email"
								autoComplete="username"
								inputMode="email"
								value={email}
								onChange={(event) => {
									setError(null);
									setEmail(event.target.value);
								}}
								placeholder="Correo"
								aria-invalid={Boolean(error)}
								aria-describedby={hintId}
								className={`${fieldClass} ${
									error ? "border-[#E8A49C]" : "border-white/15"
								}`}
							/>
							<label htmlFor={`${id}-password`} className="sr-only">
								Contraseña
							</label>
							<input
								id={`${id}-password`}
								type="password"
								name="password"
								autoComplete="current-password"
								value={password}
								onChange={(event) => {
									setError(null);
									setPassword(event.target.value);
								}}
								placeholder="Contraseña"
								aria-invalid={Boolean(error)}
								aria-describedby={hintId}
								className={`${fieldClass} ${
									error ? "border-[#E8A49C]" : "border-white/15"
								}`}
							/>
							<button
								type="submit"
								disabled={submitting}
								aria-busy={submitting}
								className="mt-1 flex h-10 w-full items-center justify-center rounded-md bg-brand text-sm font-medium text-white transition-colors duration-160 hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent disabled:cursor-wait disabled:opacity-50"
							>
								{submitting ? "Entrando…" : "Entrar"}
							</button>
						</form>
						<AppLink
							href="/acceso"
							className="mt-6 hidden text-center text-sm text-white/45 transition-colors duration-160 hover:text-white lg:block"
						>
							Creá tu página
						</AppLink>
					</div>
				</main>
			</div>
		</div>
	);
}
