import type { Metadata } from "next";
import LoginForm from "@/components/login-form";
import { pageSeo } from "@/lib/seo";

export const metadata: Metadata = {
	...pageSeo({
		title: "Entrar",
		description: "Entrá al panel de GigBlade con tu correo y contraseña.",
		path: "/login",
	}),
	robots: { index: false, follow: false },
};

export default function LoginPage() {
	return <LoginForm />;
}
