import type { Metadata } from "next";
import LoginForm from "@/components/login-form";

export const metadata: Metadata = {
	title: "Entrar",
	description: "Entrá al panel de GigBlade con tu correo y contraseña.",
	alternates: { canonical: "/login" },
};

export default function LoginPage() {
	return <LoginForm />;
}
