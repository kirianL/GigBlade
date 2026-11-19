import { Suspense } from "react";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/panel/ThemeProvider";
import SignInClient from "./sign-in-client";

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
	title: "Iniciar sesión",
	robots: { index: false, follow: false },
};

export default function SignInPage() {
	return (
		<div
			className={`${inter.variable} ${jetbrainsMono.variable} app-canvas min-h-dvh text-grayscale-12 antialiased`}
		>
			<ThemeProvider>
				<Suspense
					fallback={
						<main className="app-canvas flex min-h-dvh items-center justify-center p-6">
							<div className="size-8 rounded-lg bg-grayscale-12 text-grayscale-1 flex items-center justify-center font-mono font-bold text-xs animate-pulse">
								GB
							</div>
						</main>
					}
				>
					<SignInClient />
				</Suspense>
			</ThemeProvider>
		</div>
	);
}
