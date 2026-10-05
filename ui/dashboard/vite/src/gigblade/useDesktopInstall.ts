import { useEffect, useState } from "react";

type InstallPrompt = Event & {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function standalone() {
	return (
		window.matchMedia("(display-mode: standalone)").matches ||
		("standalone" in navigator &&
			Boolean((navigator as { standalone?: boolean }).standalone))
	);
}

export function useDesktopInstall() {
	const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
	const [installed, setInstalled] = useState(standalone);

	useEffect(() => {
		const onPrompt = (event: Event) => {
			event.preventDefault();
			setPrompt(event as InstallPrompt);
		};
		const onInstalled = () => {
			setInstalled(true);
			setPrompt(null);
		};
		window.addEventListener("beforeinstallprompt", onPrompt);
		window.addEventListener("appinstalled", onInstalled);
		return () => {
			window.removeEventListener("beforeinstallprompt", onPrompt);
			window.removeEventListener("appinstalled", onInstalled);
		};
	}, []);

	const install = async () => {
		if (!prompt) return false;
		await prompt.prompt();
		const choice = await prompt.userChoice;
		setPrompt(null);
		if (choice.outcome === "accepted") setInstalled(true);
		return choice.outcome === "accepted";
	};

	return {
		canInstall: Boolean(prompt) && !installed,
		installed,
		install,
	};
}
