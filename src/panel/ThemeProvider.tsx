"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
	theme: Theme;
	resolvedTheme: ResolvedTheme;
	setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
	theme: "light",
	resolvedTheme: "light",
	setTheme: () => {},
});

export function useTheme() {
	return useContext(ThemeContext);
}

function getSystemTheme(): ResolvedTheme {
	if (typeof window === "undefined") return "light";
	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
}

function applyThemeToDom(
	resolved: ResolvedTheme,
	rafRef?: React.MutableRefObject<number | null>,
) {
	const root = document.documentElement;
	if (rafRef) {
		if (rafRef.current !== null) {
			cancelAnimationFrame(rafRef.current);
			rafRef.current = null;
		}
		root.classList.add("theme-switching");
	}

	root.classList.toggle("dark", resolved === "dark");

	if (rafRef) {
		void window.getComputedStyle(document.body).backgroundColor;
		rafRef.current = requestAnimationFrame(() => {
			rafRef.current = requestAnimationFrame(() => {
				root.classList.remove("theme-switching");
				rafRef.current = null;
			});
		});
	}
}

function readInitialTheme(): Theme {
	if (typeof window === "undefined") return "light";
	const stored = window.localStorage.getItem("gigblade.theme");
	return stored === "light" || stored === "dark" || stored === "system"
		? stored
		: "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const [theme, setThemeState] = useState<Theme>(readInitialTheme);
	const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
		const initial = readInitialTheme();
		return initial === "system" ? getSystemTheme() : initial;
	});
	const rafRef = useRef<number | null>(null);

	useEffect(() => {
		applyThemeToDom(resolvedTheme, rafRef);

		return () => {
			if (rafRef.current !== null) {
				cancelAnimationFrame(rafRef.current);
			}
		};
	}, [resolvedTheme]);

	useEffect(() => {
		if (theme !== "system") return;
		const mq = window.matchMedia("(prefers-color-scheme: dark)");
		const onChange = () => {
			const next = mq.matches ? "dark" : "light";
			setResolvedTheme(next);
			applyThemeToDom(next, rafRef);
		};
		mq.addEventListener("change", onChange);
		return () => mq.removeEventListener("change", onChange);
	}, [theme]);

	const setTheme = useCallback((nextTheme: Theme) => {
		window.localStorage.setItem("gigblade.theme", nextTheme);
		const resolved = nextTheme === "system" ? getSystemTheme() : nextTheme;
		setThemeState(nextTheme);
		setResolvedTheme(resolved);
		applyThemeToDom(resolved, rafRef);
	}, []);

	return (
		<ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
			{children}
		</ThemeContext.Provider>
	);
}
