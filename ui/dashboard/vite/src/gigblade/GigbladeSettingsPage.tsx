import { Button, PageContainer, PageHeader } from "@autumn/ui";
import { GearIcon } from "@phosphor-icons/react";
import { Monitor, Moon, Sun } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useTheme, type ThemeMode } from "@/contexts/ThemeProvider";
import { authClient, useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const ROLE_LABEL: Record<string, string> = {
	platform: "Plataforma",
	dj: "DJ",
};

const THEME_OPTIONS: Array<{
	id: ThemeMode;
	label: string;
	icon: typeof Sun;
}> = [
	{ id: "light", label: "Claro", icon: Sun },
	{ id: "dark", label: "Oscuro", icon: Moon },
	{ id: "system", label: "Sistema", icon: Monitor },
];

export default function GigbladeSettingsPage() {
	const navigate = useNavigate();
	const { data: session } = useSession();
	const { mode, setMode } = useTheme();
	const user = session?.user as
		| { name?: string; email?: string; role?: string; slug?: string }
		| undefined;

	const signOut = async () => {
		try {
			await authClient.signOut();
		} finally {
			navigate("/sign-in", { replace: true });
		}
	};

	return (
		<PageContainer>
			<PageHeader
				icon={
					<GearIcon
						size={16}
						weight="fill"
						className="text-subtle"
						aria-hidden
					/>
				}
				title="Ajustes"
			/>
			<p className="text-sm text-tertiary-foreground leading-6 -mt-2 max-w-3xl">
				Cuenta, apariencia y sesión de este panel.
			</p>

			<section className="rounded-lg border bg-interactive-secondary p-5 flex flex-col gap-4">
				<div>
					<h2 className="text-sm font-medium text-foreground">Cuenta</h2>
					<p className="mt-1 text-sm text-tertiary-foreground">
						Los datos de la sesión activa en este navegador.
					</p>
				</div>
				<dl className="grid gap-3 sm:grid-cols-2">
					<div>
						<dt className="text-xs text-subtle">Nombre</dt>
						<dd className="mt-1 text-sm text-foreground">
							{user?.name || "GigBlade"}
						</dd>
					</div>
					<div>
						<dt className="text-xs text-subtle">Correo</dt>
						<dd className="mt-1 text-sm text-foreground break-all">
							{user?.email || "—"}
						</dd>
					</div>
					<div>
						<dt className="text-xs text-subtle">Rol</dt>
						<dd className="mt-1 text-sm text-foreground">
							{ROLE_LABEL[user?.role ?? ""] ?? user?.role ?? "—"}
						</dd>
					</div>
					{user?.slug ? (
						<div>
							<dt className="text-xs text-subtle">Página</dt>
							<dd className="mt-1 text-sm font-mono text-foreground">
								{user.slug}
							</dd>
						</div>
					) : null}
				</dl>
			</section>

			<section className="rounded-lg border bg-interactive-secondary p-5 flex flex-col gap-4">
				<div>
					<h2 className="text-sm font-medium text-foreground">Apariencia</h2>
					<p className="mt-1 text-sm text-tertiary-foreground">
						Se guarda en este navegador y se aplica a todo el panel.
					</p>
				</div>
				<div
					role="radiogroup"
					aria-label="Tema"
					className="flex flex-wrap gap-2"
				>
					{THEME_OPTIONS.map((option) => {
						const Icon = option.icon;
						const selected = mode === option.id;
						return (
							<button
								key={option.id}
								type="button"
								role="radio"
								aria-checked={selected}
								onClick={() => setMode(option.id)}
								className={cn(
									"inline-flex items-center gap-2 rounded-lg border px-3 h-9 text-sm cursor-pointer",
									selected
										? "border-border bg-background text-foreground"
										: "border-transparent text-tertiary-foreground hover:text-foreground hover:bg-interactive-secondary-hover",
								)}
							>
								<Icon size={14} aria-hidden />
								{option.label}
							</button>
						);
					})}
				</div>
			</section>

			<section className="rounded-lg border bg-interactive-secondary p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-sm font-medium text-foreground">Plan</h2>
					<p className="mt-1 text-sm text-tertiary-foreground">
						El plan de GigBlade y los DJs activos están en Plan.
					</p>
				</div>
				<Button variant="secondary" size="sm" asChild>
					<Link to="/plan">Ver plan</Link>
				</Button>
			</section>

			<section className="rounded-lg border bg-interactive-secondary p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-sm font-medium text-foreground">Sesión</h2>
					<p className="mt-1 text-sm text-tertiary-foreground">
						Cerrar sesión en este navegador. Las páginas quedan como están.
					</p>
				</div>
				<Button variant="secondary" size="sm" onClick={() => void signOut()}>
					Salir
				</Button>
			</section>
		</PageContainer>
	);
}
