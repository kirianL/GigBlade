"use client";

import PanelShell from "@/components/panel-shell";

export default function OverviewPage() {
	return (
		<PanelShell title="Plataforma">
			{(session) =>
				session.user.role === "dj" ? (
					<p className="text-sm text-white/60">
						Este usuario es DJ. Andá a su estudio desde el login.
					</p>
				) : (
					<p className="text-sm leading-6 text-white/70">
						Sesión de plataforma activa. El editor completo de DJs vive en el
						dashboard local (`localhost:3001`). Acá ya estás autenticado en
						producción.
					</p>
				)
			}
		</PanelShell>
	);
}
