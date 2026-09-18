"use client";

import PanelShell from "@/components/panel-shell";

export default function StudioPage() {
	return (
		<PanelShell title="Estudio">
			{(session) => (
				<div className="space-y-3 text-sm leading-6 text-white/70">
					<p>
						Hola {session.user.name}. Rol: {session.user.role}
						{session.user.slug ? ` · ${session.user.slug}` : ""}.
					</p>
					<p>
						El editor de contenido (fotos, mixes, plantilla) corre en el
						dashboard Vite. En local:{" "}
						<code className="text-white">http://localhost:3001/studio</code>
					</p>
				</div>
			)}
		</PanelShell>
	);
}
