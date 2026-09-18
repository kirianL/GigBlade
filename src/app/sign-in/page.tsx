import { Suspense } from "react";
import type { Metadata } from "next";
import SignInClient from "./sign-in-client";

export const metadata: Metadata = {
	title: "Entrando",
	robots: { index: false, follow: false },
};

export default function SignInPage() {
	return (
		<Suspense
			fallback={
				<main className="flex min-h-dvh items-center justify-center bg-[#09090b] text-sm text-white/55">
					Entrando…
				</main>
			}
		>
			<SignInClient />
		</Suspense>
	);
}
