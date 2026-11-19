"use client";

import { Switch as BaseSwitch } from "@base-ui/react/switch";
import type { ComponentProps, CSSProperties } from "react";
import { cn } from "@/panel/cn";

const Root = ({
	className,
	...props
}: ComponentProps<typeof BaseSwitch.Root>) => (
	<BaseSwitch.Root
		className={cn(
			"relative flex h-4 w-7 cursor-pointer rounded-full border border-grayscale-6 bg-grayscale-5 p-px transition-[background-color,opacity] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] data-[checked]:border-accent-10 data-[checked]:bg-accent-9 dark:border-grayscale-5 dark:bg-grayscale-4 dark:data-[checked]:bg-accent-9",
			typeof className === "string" ? className : undefined,
		)}
		{...props}
	/>
);

const Thumb = ({
	className,
	...props
}: ComponentProps<typeof BaseSwitch.Thumb>) => (
	<BaseSwitch.Thumb
		className={cn(
			"aspect-square h-full rounded-full bg-grayscale-1 shadow-sm transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] data-[checked]:translate-x-3 data-[checked]:bg-accent-4 dark:bg-grayscale-10 dark:data-[checked]:bg-accent-12",
			typeof className === "string" ? className : undefined,
		)}
		{...props}
	/>
);

export const Switch = {
	Composed: ({
		size = 16,
		...props
	}: { size?: number } & ComponentProps<typeof BaseSwitch.Root>) => {
		const thumbSize = size;
		const rootWidth = size * 1.75;
		const difference = rootWidth - thumbSize;

		return (
			<Root {...props} style={{ width: rootWidth, height: thumbSize }}>
				<Thumb
					style={{ "--switch-offset": `${difference}px` } as CSSProperties}
					className="data-[checked]:translate-x-[var(--switch-offset)]"
				/>
			</Root>
		);
	},
	Root,
	Thumb,
};
