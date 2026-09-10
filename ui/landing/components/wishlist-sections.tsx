"use client";

import SlotLabel from "@/components/slot-label";
import WishlistForm from "@/components/wishlist-form";

type WishlistSectionsProps = {
	artistName: string;
	tagline: string;
	city: string;
};

export default function WishlistSections({
	artistName,
	tagline,
	city,
}: WishlistSectionsProps) {
	const place = city ? ` · ${city}` : "";

	return (
		<div className="flex w-full flex-col border-b border-[#292929]">
			<div className="flex w-full border-b border-[#292929]">
				<div className="hidden w-1/8 border-r border-[#292929] bg-[#0F0F0F] md:block lg:w-1/6" />
				<div className="flex-1 bg-[#0F0F0F] px-4 py-10 sm:px-8 md:py-16">
					<p className="mb-4 font-mono text-[12px] uppercase tracking-widest text-brand">
						Lista de espera
					</p>
					<h1 className="max-w-xl font-sans text-[40px] leading-[42px] tracking-[-3%] text-white uppercase md:text-[56px] md:leading-[58px]">
						Solicitar a{" "}
						<SlotLabel
							text={artistName}
							options={{ rollBy: "word" }}
							className="text-white"
						/>
					</h1>
					<p className="mt-5 max-w-xl text-[14px] font-light leading-5 tracking-[-2%] text-[#FFFFFF99] md:text-[16px] md:leading-6">
						Cuando empiecen las solicitudes, este es el canal. {tagline}
						{place}. Sin DMs sueltos: un formulario, un panel.
					</p>
				</div>
				<div className="hidden w-1/8 border-l border-[#292929] bg-[#0F0F0F] md:block lg:w-1/6" />
			</div>

			<div className="flex w-full">
				<div className="hidden w-1/8 border-r border-[#292929] md:block lg:w-1/6" />
				<div className="flex-1 px-4 py-10 sm:px-8 md:py-16">
					<WishlistForm artistName={artistName} />
				</div>
				<div className="hidden w-1/8 border-l border-[#292929] md:block lg:w-1/6" />
			</div>
		</div>
	);
}
