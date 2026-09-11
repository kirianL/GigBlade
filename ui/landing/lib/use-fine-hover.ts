"use client";

import { useEffect, useState } from "react";

const FINE_HOVER_QUERY = "(hover: hover) and (pointer: fine)";

export function useFineHover() {
	const [matches, setMatches] = useState(false);

	useEffect(() => {
		const media = window.matchMedia(FINE_HOVER_QUERY);
		const update = () => setMatches(media.matches);
		update();
		media.addEventListener("change", update);
		return () => media.removeEventListener("change", update);
	}, []);

	return matches;
}
