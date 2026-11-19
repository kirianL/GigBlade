import { Inter, JetBrains_Mono } from "next/font/google";
import AccesoForm from "@/components/acceso-form";
import { pageSeo } from "@/lib/seo";
import { ThemeProvider } from "@/panel/ThemeProvider";

const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
	display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
	variable: "--font-jetbrains-mono",
	subsets: ["latin"],
	display: "swap",
});

export const metadata = pageSeo({
	title: "Acceso para DJs",
	description:
		"Anotate en la lista de GigBlades. Reservá tu sesión y confirmá tu lugar.",
	path: "/acceso",
});

export default function AccesoPage() {
	return (
		<ThemeProvider>
			<div
				className={`${inter.variable} ${jetbrainsMono.variable} app-canvas min-h-dvh overflow-x-hidden text-grayscale-12`}
			>
				<AccesoForm />
			</div>
		</ThemeProvider>
	);
}
