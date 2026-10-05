import { Button, DropdownMenuItem } from "@autumn/ui";
import { DesktopIcon } from "@phosphor-icons/react";
import { useDesktopInstall } from "@/gigblade/useDesktopInstall";

export function InstallDesktopCard() {
	const { canInstall, installed, install } = useDesktopInstall();
	if (installed || !canInstall) return null;

	return (
		<section className="border rounded-lg p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div className="min-w-0">
				<p className="text-xs text-tertiary-foreground">En el escritorio</p>
				<p className="mt-1 text-sm text-foreground leading-6">
					Instalá el panel como aplicación para abrirlo directo, sin buscar el sitio.
				</p>
			</div>
			<Button type="button" variant="secondary" size="sm" onClick={() => void install()}>
				<DesktopIcon size={16} aria-hidden />
				Instalar
			</Button>
		</section>
	);
}

export function InstallDesktopMenuItem() {
	const { canInstall, install } = useDesktopInstall();
	if (!canInstall) return null;

	return (
		<DropdownMenuItem onClick={() => void install()}>
			<span className="text-muted-foreground">Instalar en el escritorio</span>
		</DropdownMenuItem>
	);
}
