import type { Metadata } from "next";
import AccesoForm from "@/components/acceso-form";

export const metadata: Metadata = {
	title: "Acceso para DJs",
	description:
		"Anotate en la lista de GigBlade. Te avisamos cuando haya cupo para armar tu página con dominio propio.",
	alternates: { canonical: "/acceso" },
};

export default function AccesoPage() {
	return (
		<main className="min-h-dvh overflow-hidden bg-[#080908] text-white">
			<AccesoForm />
		</main>
	);
}
