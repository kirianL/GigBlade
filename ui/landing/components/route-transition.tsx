"use client";

import { ViewTransition } from "react";
import type { PropsWithChildren } from "react";

export default function RouteTransition({ children }: PropsWithChildren) {
	return <ViewTransition>{children}</ViewTransition>;
}
