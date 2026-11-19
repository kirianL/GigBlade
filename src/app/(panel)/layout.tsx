import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { PanelProviders } from "@/panel/PanelProviders";
import { PanelShellLayout } from "@/panel/PanelShellLayout";

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

export const metadata: Metadata = {
	title: {
		default: "GigBlades | Panel de gestión",
		template: "%s | GigBlades",
	},
	description: "Gestión de plataforma y estudio de DJs de GigBlades",
	robots: { index: false, follow: false },
};

export default function PanelGroupLayout({
	children,
}: {
	children: ReactNode;
}) {
	return (
		<div
			className={`${inter.variable} ${jetbrainsMono.variable} app-canvas min-h-dvh text-grayscale-12 antialiased`}
		>
			<PanelProviders>
				<PanelShellLayout>{children}</PanelShellLayout>
			</PanelProviders>
		</div>
	);
}
