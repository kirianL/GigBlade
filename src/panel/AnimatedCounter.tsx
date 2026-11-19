"use client";

export function AnimatedCounter({ value }: { value: number }) {
	return <span className="tabular-nums">{value.toLocaleString("es-CR")}</span>;
}
