import AccesoForm from "@/components/acceso-form";
import { pageSeo } from "@/lib/seo";

export const metadata = pageSeo({
	title: "Acceso para DJs",
	description:
		"Anotate en la lista de GigBlade. Te avisamos cuando haya cupo para armar tu página con dominio propio.",
	path: "/acceso",
});

export default function AccesoPage() {
	return (
		<main className="min-h-dvh overflow-hidden bg-[#080908] text-white">
			<AccesoForm />
		</main>
	);
}
