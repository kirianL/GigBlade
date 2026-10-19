import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDashboardSignInUrl } from "@/lib/dashboard-url";
import { pageSeo } from "@/lib/seo";

export const metadata: Metadata = {
	...pageSeo({
		title: "Entrar",
		description: "Entrá al panel de GigBlades con tu correo y contraseña.",
		path: "/login",
	}),
	robots: { index: false, follow: false },
};

export default function LoginPage() {
	redirect(getDashboardSignInUrl());
}
