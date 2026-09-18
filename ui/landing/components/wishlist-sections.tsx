"use client";

import SlotLabel from "@/components/slot-label";

type WishlistSectionsProps = {
	artistName: string;
	tagline: string;
	city: string;
};

function handleFor(artistName: string) {
	const key = artistName.trim().toLowerCase();
	const map: Record<string, string> = {
		nox: "nox",
		marco: "djmarco",
		"dj marco": "djmarco",
		luna: "lunaset",
		"luna set": "lunaset",
	};

	return map[key] ?? "gigblade";
}

export default function WishlistSections({
	artistName,
	tagline,
	city,
}: WishlistSectionsProps) {
	const place = city ? ` · ${city}` : "";
	const handle = handleFor(artistName);
	const instagramUrl = `https://instagram.com/${handle}`;

	return (
		<div className="flex w-full flex-col border-b border-[#292929]">
			<div className="flex w-full border-b border-[#292929]">
				<div className="hidden w-1/8 border-r border-[#292929] bg-[#0F0F0F] md:block lg:w-1/6" />
				<div className="flex-1 bg-[#0F0F0F] px-4 py-10 sm:px-8 md:py-16">
					<h1 className="max-w-xl font-sans text-[40px] leading-[42px] tracking-[-3%] text-white uppercase md:text-[56px] md:leading-[58px]">
						Escribir a{" "}
						<SlotLabel
							text={artistName}
							options={{ rollBy: "word" }}
							className="text-white"
						/>
					</h1>
					<p className="mt-5 max-w-xl text-[14px] font-light leading-5 tracking-[-2%] text-[#FFFFFF99] md:text-[16px] md:leading-6">
						{tagline}
						{place}. El canal es Instagram.
					</p>
				</div>
				<div className="hidden w-1/8 border-l border-[#292929] bg-[#0F0F0F] md:block lg:w-1/6" />
			</div>

			<div className="flex w-full">
				<div className="hidden w-1/8 border-r border-[#292929] md:block lg:w-1/6" />
				<div className="flex-1 px-4 py-10 sm:px-8 md:py-16">
					<div className="flex max-w-md flex-col gap-4">
						<p className="text-[14px] font-light leading-5 tracking-[-2%] text-[#FFFFFF99] md:text-[16px] md:leading-6">
							Escribile directo por Instagram.
						</p>
						<div className="flex flex-col gap-2 sm:flex-row">
							<a
								href={instagramUrl}
								target="_blank"
								rel="noreferrer"
								className="wishlist-press relative flex h-12 min-w-0 flex-1 items-center justify-center overflow-hidden bg-brand px-4 text-[13px] font-medium tracking-wide text-white transition-[transform,background-color] duration-200 ease-out hover:bg-brand-hover"
							>
								Instagram @{handle}
							</a>
						</div>
					</div>
				</div>
				<div className="hidden w-1/8 border-l border-[#292929] md:block lg:w-1/6" />
			</div>
		</div>
	);
}
