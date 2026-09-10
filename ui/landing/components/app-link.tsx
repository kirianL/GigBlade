"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";
import { scrollToHash } from "@/lib/smooth-scroll";

type AppLinkProps = ComponentProps<typeof Link>;

function hashFromHref(href: AppLinkProps["href"]) {
	if (typeof href !== "string") return null;
	if (href.startsWith("#")) return href;
	if (href.startsWith("/#")) return href.slice(1);
	return null;
}

export default function AppLink({
	prefetch = true,
	scroll = false,
	onClick,
	href,
	...props
}: AppLinkProps) {
	const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
		onClick?.(event);
		if (event.defaultPrevented) return;
		const hash = hashFromHref(href);
		if (!hash) return;
		if (!document.querySelector(hash)) return;
		event.preventDefault();
		scrollToHash(hash);
	};

	return (
		<Link
			href={href}
			prefetch={prefetch}
			scroll={scroll}
			onClick={handleClick}
			{...props}
		/>
	);
}
