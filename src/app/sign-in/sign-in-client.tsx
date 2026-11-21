"use client";

import {
	ArrowRightIcon,
	DiscIcon,
	EyeIcon,
	EyeSlashIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { authClient, useSession } from "@/panel/auth-client";
import { ThemeToggle } from "@/panel/ThemeToggle";
import { cn } from "@/panel/cn";

const emailRegex = /^[^@]+@[^@]+\.[^@]+$/;

function getSafeNext(raw: string | null): string {
	if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
	return raw;
}

export default function SignInClient() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const id = useId();
	const { data: session, isPending } = useSession();

	const [email, setEmail] = useState(() => searchParams.get("email") ?? "");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [errorField, setErrorField] = useState<"email" | "password" | "both" | null>(null);
	const [shaking, setShaking] = useState(false);
	const [loading, setLoading] = useState(false);

	const emailInvalid = errorField === "email" || errorField === "both";
	const passwordInvalid = errorField === "password" || errorField === "both";
	const defaultPath = getSafeNext(searchParams.get("next"));

	const triggerError = (
		message: string,
		field: "email" | "password" | "both",
	) => {
		setError(message);
		setErrorField(field);
		setShaking(false);
		requestAnimationFrame(() => {
			setShaking(true);
		});
		window.setTimeout(() => {
			setShaking(false);
		}, 380);
	};

	useEffect(() => {
		if (isPending || !session) return;
		const user = session.user as { role?: string; slug?: string };
		const home =
			user.role === "dj" && user.slug
				? `/studio?dj=${encodeURIComponent(user.slug)}`
				: defaultPath === "/"
					? "/overview"
					: defaultPath;
		router.replace(home);
	}, [defaultPath, isPending, router, session]);

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		if (!email.trim() || !emailRegex.test(email.trim())) {
			triggerError("Ingresá una dirección de correo válida.", "email");
			return;
		}
		if (!password || password.length < 8) {
			triggerError("Escribí la contraseña que te pasamos.", "password");
			return;
		}
		setLoading(true);
		setError(null);
		setErrorField(null);
		const { data, error: nextError } = await authClient.signIn.email({
			email: email.trim(),
			password,
		});
		setLoading(false);
		if (nextError || !data) {
			triggerError(
				nextError?.message || "El correo o la contraseña no coinciden.",
				"both",
			);
			return;
		}
		const user = data.user as { role?: string; slug?: string };
		const destination =
			user.role === "dj" && user.slug
				? `/studio?dj=${encodeURIComponent(user.slug)}`
				: defaultPath === "/"
					? "/overview"
					: defaultPath;
		router.replace(destination);
	};

	return (
		<div className="app-canvas relative flex min-h-dvh w-full flex-col justify-between overflow-hidden px-5 py-4 text-grayscale-12 sm:px-8 sm:py-8">
			{/* Auroras ambientales arriba y abajo estilo base-main */}
			<div
				aria-hidden
				className="aurora-wrapper pointer-events-none fixed inset-0 overflow-hidden"
			>
				<div className="aurora-top" />
				<div className="aurora-bottom" />
			</div>

			{/* Barra superior minimalista */}
			<header className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between">
				<Link
					href="/"
					className="group inline-flex items-center gap-2 text-grayscale-12 transition-opacity duration-150 hover:opacity-80"
				>
					<span className="icon-tile flex size-7 items-center justify-center rounded-lg">
						<DiscIcon size={14} weight="bold" />
					</span>
					<span className="text-[13.5px] font-semibold tracking-[-0.02em]">
						GigBlades
					</span>
				</Link>

				<ThemeToggle />
			</header>

			{/* Bloque central abierto (identico a base-main/app/(app)/login/page.tsx) */}
			<main
				className={cn(
					"login-enter relative z-10 mx-auto my-auto w-full max-w-[400px] py-4 sm:py-8 transition-[opacity,transform] duration-150 ease-out",
					loading && "scale-[0.992] opacity-75",
				)}
			>
				<div className="space-y-6">
					<div className="space-y-1.5 text-center">
						<h1 className="text-[26px] font-semibold tracking-[-0.03em] text-grayscale-12 sm:text-[28px]">
							Iniciar sesión
						</h1>
						<p className="text-[13px] leading-relaxed text-grayscale-9">
							Ingresá con tu cuenta de GigBlades para administrar la plataforma
							o tu página DJ.
						</p>
					</div>

					{
						<form onSubmit={handleSubmit} noValidate className="space-y-3.5">
							<div className="space-y-1.5">
								<label
									htmlFor={`${id}-email`}
									className={cn(
										"block text-[12px] font-medium transition-colors duration-150",
										emailInvalid
											? "text-red-11"
											: "text-grayscale-11",
									)}
								>
									Correo electrónico
								</label>
								<input
									id={`${id}-email`}
									type="email"
									autoComplete="username"
									aria-invalid={emailInvalid}
									value={email}
									onChange={(e) => {
										setEmail(e.target.value);
										if (error) {
											setError(null);
											setErrorField(null);
										}
									}}
									placeholder="nombre@gigblades.com"
									className={cn(
										"campo w-full px-3.5 py-2.5 text-[16px] shadow-[0_1px_2px_rgba(28,22,16,0.03)] sm:text-[13.5px]",
										shaking && emailInvalid && "shake",
									)}
								/>
								{error && errorField === "email" ? (
									<p className="text-[11.5px] font-medium text-red-11">
										{error}
									</p>
								) : null}
							</div>

							<div className="space-y-1.5">
								<label
									htmlFor={`${id}-password`}
									className={cn(
										"block text-[12px] font-medium transition-colors duration-150",
										passwordInvalid
											? "text-red-11"
											: "text-grayscale-11",
									)}
								>
									Contraseña
								</label>
								<div className={cn("relative", shaking && passwordInvalid && "shake")}>
									<input
										id={`${id}-password`}
										type={showPassword ? "text" : "password"}
										autoComplete="current-password"
										aria-invalid={passwordInvalid}
										value={password}
										onChange={(e) => {
											setPassword(e.target.value);
											if (error) {
												setError(null);
												setErrorField(null);
											}
										}}
										placeholder="••••••••••••"
										className="campo w-full py-2.5 pl-3.5 pr-10 text-[16px] shadow-[0_1px_2px_rgba(28,22,16,0.03)] sm:text-[13.5px]"
									/>
									<button
										type="button"
										onClick={() => setShowPassword(!showPassword)}
										aria-label={showPassword ? "Ocultar" : "Mostrar"}
										className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-grayscale-8 transition-colors duration-150 hover:text-grayscale-12"
									>
										{showPassword ? (
											<EyeSlashIcon size={15} />
										) : (
											<EyeIcon size={15} />
										)}
									</button>
								</div>
								{error && (errorField === "password" || errorField === "both") ? (
									<p className="text-[11.5px] font-medium text-red-11">
										{error}
									</p>
								) : null}
							</div>

							<button
								type="submit"
								disabled={loading}
								className="group mt-1 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-grayscale-4 bg-grayscale-1 px-4 py-2.5 text-[13.5px] font-medium text-grayscale-12 shadow-[0_1px_2px_rgba(28,22,16,0.05)] transition-[background-color,border-color,transform] duration-150 ease-out hover:border-grayscale-5 hover:bg-grayscale-2 active:scale-[0.985] disabled:pointer-events-none disabled:opacity-55 dark:border-grayscale-4 dark:bg-grayscale-2 dark:hover:bg-grayscale-3"
							>
								<span>{loading ? "Ingresando…" : "Continuar con correo"}</span>
								<ArrowRightIcon
									size={13.5}
									weight="bold"
									className="text-grayscale-9 transition-transform duration-150 ease-out group-hover:translate-x-0.5 group-hover:text-grayscale-12"
								/>
							</button>
						</form>
					}

					<div className="flex items-center gap-3">
						<span className="h-px flex-1 bg-grayscale-4/70 dark:bg-grayscale-4/45" />
						<span className="shrink-0 whitespace-nowrap font-mono text-[10.5px] text-grayscale-8">
							GigBlades
						</span>
						<span className="h-px flex-1 bg-grayscale-4/70 dark:bg-grayscale-4/45" />
					</div>

					<div className="flex items-center justify-between text-[12.5px] text-grayscale-10">
						<Link
							href="/"
							className="transition-colors hover:text-grayscale-12"
						>
							← Volver al sitio
						</Link>
						<Link
							href="/acceso"
							className="font-medium text-grayscale-12 transition-opacity hover:opacity-80"
						>
							Creá tu página →
						</Link>
					</div>
				</div>
			</main>

			<div aria-hidden className="h-4" />
		</div>
	);
}
