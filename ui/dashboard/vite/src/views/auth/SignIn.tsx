import { useEffect, useId, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { CustomToaster } from "@/components/general/CustomToaster";
import { panelHomePath } from "@/gigblade/panel-session";
import { acceptPanelToken, authClient, useSession } from "@/lib/auth-client";
import { getSafeNextPath } from "@/utils/genUtils";
import { gigbladeMarketingSiteUrl } from "@/gigblade/concept";
import { AuthBackground } from "./components/AuthBackground";

export const emailRegex = /^[^@]+@[^@]+\.[^@]+$/;

const fieldClass =
	"h-10 w-full rounded-md border bg-transparent px-3 text-sm text-white outline-none transition-colors placeholder:text-white/40 focus-visible:border-[#5ba8ff]";

export const SignIn = () => {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const id = useId();
	const { data: session, isPending } = useSession();
	const [email, setEmail] = useState(() => searchParams.get("email") ?? "");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [acceptingToken, setAcceptingToken] = useState(
		() => Boolean(searchParams.get("token")),
	);
	const hintId = `${id}-hint`;
	const defaultPath = getSafeNextPath(searchParams);

	useEffect(() => {
		const token = searchParams.get("token");
		if (!token) {
			setAcceptingToken(false);
			return;
		}
		let cancelled = false;
		setAcceptingToken(true);
		void acceptPanelToken(token)
			.then((next) => {
				if (cancelled) return;
				navigate(
					getSafeNextPath(searchParams) === "/"
						? panelHomePath(next.user)
						: defaultPath,
					{ replace: true },
				);
			})
			.catch(() => {
				if (cancelled) return;
				setError("Esa sesión ya no sirve. Entrá de nuevo.");
				setAcceptingToken(false);
			});
		return () => {
			cancelled = true;
		};
	}, [defaultPath, navigate, searchParams]);

	useEffect(() => {
		if (isPending || acceptingToken || !session) return;
		const user = session.user as { role?: string; slug?: string };
		const home =
			user.role === "dj" && user.slug
				? `/studio?dj=${encodeURIComponent(user.slug)}`
				: defaultPath;
		navigate(home, { replace: true });
	}, [acceptingToken, defaultPath, isPending, navigate, session]);

	const submit = async (event: React.FormEvent) => {
		event.preventDefault();
		if (!email || !emailRegex.test(email)) {
			setError("Escribí un correo válido.");
			return;
		}
		if (!password || password.length < 8) {
			setError("Escribí la contraseña que te pasamos.");
			return;
		}
		setLoading(true);
		setError(null);
		const { data, error: nextError } = await authClient.signIn.email({
			email,
			password,
		});
		setLoading(false);
		if (nextError || !data) {
			setError(nextError?.message || "El correo o la contraseña no coinciden.");
			return;
		}
		const user = data.user as { role?: string; slug?: string };
		navigate(
			user.role === "dj" && user.slug
				? `/studio?dj=${encodeURIComponent(user.slug)}`
				: defaultPath,
			{ replace: true },
		);
	};

	return (
		<AuthBackground>
			<CustomToaster />
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

			{acceptingToken ? (
				<p className="mt-8 text-center text-sm text-white/50">Entrando…</p>
			) : (
				<form
					onSubmit={submit}
					className="mt-8 flex w-full flex-col gap-3"
					noValidate
				>
					<label htmlFor={`${id}-email`} className="sr-only">
						Correo
					</label>
					<input
						id={`${id}-email`}
						type="email"
						name="email"
						placeholder="Correo"
						value={email}
						onChange={(event) => {
							setError(null);
							setEmail(event.target.value);
						}}
						required
						autoComplete="username"
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
						placeholder="Contraseña"
						value={password}
						onChange={(event) => {
							setError(null);
							setPassword(event.target.value);
						}}
						required
						minLength={8}
						autoComplete="current-password"
						aria-invalid={Boolean(error)}
						aria-describedby={hintId}
						className={`${fieldClass} ${
							error ? "border-[#E8A49C]" : "border-white/15"
						}`}
					/>
					<button
						type="submit"
						disabled={loading}
						aria-busy={loading}
						className="mt-1 flex h-10 w-full items-center justify-center rounded-md bg-[#1a56d6] text-sm font-medium text-white transition-colors duration-160 hover:bg-[#1544b0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5ba8ff] disabled:cursor-wait disabled:opacity-50"
					>
						{loading ? "Entrando…" : "Entrar"}
					</button>
				</form>
			)}
			<a
				href={`${gigbladeMarketingSiteUrl()}/acceso`}
				className="mt-6 hidden text-center text-sm text-white/45 transition-colors duration-160 hover:text-white lg:block"
			>
				Creá tu página
			</a>
		</AuthBackground>
	);
};
