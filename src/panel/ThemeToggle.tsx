"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "@/panel/ThemeProvider";
import { Switch } from "@/panel/Switch";

const emptySubscribe = () => () => {};

export function ThemeToggle({ size = 16 }: { size?: number }) {
	const { resolvedTheme, setTheme } = useTheme();
	const mounted = useSyncExternalStore(
		emptySubscribe,
		() => true,
		() => false,
	);

	const checked = mounted && resolvedTheme === "dark";

	return (
		<Switch.Composed
			aria-label="Cambiar tema claro/oscuro"
			checked={checked}
			disabled={!mounted}
			onCheckedChange={(isDark) => setTheme(isDark ? "dark" : "light")}
			size={size}
		/>
	);
}
