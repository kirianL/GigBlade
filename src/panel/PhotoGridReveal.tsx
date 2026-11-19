"use client";

export function PhotoGridReveal({ src }: { src: string }) {
	return (
		<div
			role="status"
			aria-label="Optimizando y subiendo foto"
			className="relative aspect-4/3 overflow-hidden rounded-xl border border-grayscale-4 bg-grayscale-2"
		>
			<img
				src={src}
				alt=""
				className="h-full w-full object-cover opacity-70"
			/>
			<span className="absolute bottom-2 left-2 rounded-full bg-black/75 px-2.5 py-1 text-[10px] font-semibold text-white">
				Optimizando y subiendo…
			</span>
		</div>
	);
}
