export function PhotoGridReveal({ src }: { src: string }) {
	return (
		<div
			role="status"
			aria-label="Optimizando y subiendo foto"
			className="relative aspect-4/3 overflow-hidden rounded-lg border bg-muted"
		>
			<img
				src={src}
				alt=""
				className="h-full w-full object-cover opacity-70"
			/>
			<div aria-hidden="true" className="absolute inset-0 grid grid-cols-6 grid-rows-4">
				{Array.from({ length: 24 }, (_, index) => (
					<span
						key={index}
						className="gigblade-grid-reveal-cell border-[0.5px] border-white/30 bg-black/35"
						style={{ animationDelay: `${(index % 8) * 90}ms` }}
					/>
				))}
			</div>
			<span className="absolute bottom-2 left-2 rounded-full bg-black/65 px-2.5 py-1 text-[10px] font-medium text-white">
				Optimizando y subiendo…
			</span>
		</div>
	);
}
