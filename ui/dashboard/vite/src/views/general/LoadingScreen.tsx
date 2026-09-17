"use client";

import { Skeleton } from "@autumn/ui";
import { cn } from "@/lib/utils";

function PageSkeleton() {
	return (
		<div className="flex flex-col gap-4 w-full h-full pb-8 max-w-5xl mx-auto pt-4 sm:pt-8 px-4 sm:px-10">
			<div className="flex items-center justify-between gap-4">
				<Skeleton className="h-4 w-36" />
				<div className="flex gap-2">
					<Skeleton className="h-7 w-36 rounded-lg" />
					<Skeleton className="h-7 w-24 rounded-lg" />
				</div>
			</div>
			<Skeleton className="h-7 w-44" />
			<Skeleton className="h-40 w-full rounded-lg" />
			<Skeleton className="h-28 w-full rounded-lg" />
			<div className="grid gap-4 sm:grid-cols-2">
				<Skeleton className="h-24 w-full rounded-lg" />
				<Skeleton className="h-24 w-full rounded-lg" />
			</div>
		</div>
	);
}

function AppShellSkeleton() {
	return (
		<div className="w-screen min-h-screen flex bg-outer-background">
			<div className="hidden sm:flex h-screen py-4 min-w-[200px] max-w-[200px] flex-col gap-6 px-3">
				<div className="flex items-center gap-2 px-1">
					<Skeleton className="size-7 rounded-md shrink-0" />
					<Skeleton className="h-4 w-24" />
				</div>
				<div className="flex flex-col gap-2 px-1">
					<Skeleton className="h-8 w-full rounded-lg" />
					<Skeleton className="h-8 w-full rounded-lg" />
					<Skeleton className="h-8 w-3/4 rounded-lg" />
				</div>
			</div>
			<main className="w-full min-h-screen flex flex-col overflow-hidden sm:py-3 sm:pr-3">
				<div className="w-full h-full overflow-hidden sm:rounded-xl sm:border bg-background">
					<PageSkeleton />
				</div>
			</main>
		</div>
	);
}

function LoadingScreen({ fullPage = false }: { fullPage?: boolean }) {
	return (
		<div
			role="status"
			aria-label="Cargando"
			className={cn(
				"w-full",
				fullPage ? "min-h-screen" : "h-full min-h-80",
			)}
		>
			<span className="sr-only">Cargando</span>
			{fullPage ? <AppShellSkeleton /> : <PageSkeleton />}
		</div>
	);
}

export default LoadingScreen;
