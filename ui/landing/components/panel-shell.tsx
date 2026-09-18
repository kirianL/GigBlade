"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import AppLink from "@/components/app-link";
import {
	clearPanelAuthSession,
	readPanelAuthSession,
	type PanelAuthSession,
} from "@/lib/panel-session";

export default function PanelShell({
	title,
	children,
}: {
	title: string;
	children: (session: PanelAuthSession) => ReactNode;
}) {
	const router = useRouter();
	const [session, setSession] = useState<PanelAuthSession | null>(null);

	useEffect(() => {
		const stored = readPanelAuthSession();
		if (!stored) {
			router.replace("/login");
			return;
		}
		setSession(stored);
	}, [router]);

	if (!session) {
		return (
			<main className="flex min-h-dvh items-center justify-center bg-[#09090b] text-sm text-white/55">
				Cargando…
			</main>
		);
	}

	return (
		<div className="min-h-dvh bg-[#09090b] text-white">
			<header className="flex h-14 items-center justify-between border-b border-white/10 px-5">
				<p className="font-sans text-[18px] font-medium tracking-[-0.03em]">
					GigBlade
				</p>
				<div className="flex items-center gap-4 text-sm text-white/55">
					<span>{session.user.email}</span>
					<button
						type="button"
						className="text-white/80 underline-offset-4 hover:text-white hover:underline"
						onClick={() => {
							clearPanelAuthSession();
							router.replace("/login");
						}}
					>
						Salir
					</button>
				</div>
			</header>
			<main className="mx-auto w-full max-w-3xl px-5 py-10">
				<h1 className="font-sans text-2xl tracking-[-0.03em]">{title}</h1>
				<div className="mt-6">{children(session)}</div>
				<p className="mt-10 text-sm text-white/40">
					<AppLink href="/" className="underline-offset-4 hover:underline">
						Volver al sitio
					</AppLink>
				</p>
			</main>
		</div>
	);
}
