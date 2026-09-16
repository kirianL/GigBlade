"use client";

import SlotLabel from "@/components/slot-label";

type WishlistSectionsProps = {
	artistName: string;
	tagline: string;
	city: string;
};

function contactFor(artistName: string) {
	const key = artistName.trim().toLowerCase();
	const map: Record<string, { handle: string; email: string }> = {
		nox: { handle: "nox", email: "nox@gigblade.com" },
		marco: { handle: "djmarco", email: "marco@djmarco.com" },
		"dj marco": { handle: "djmarco", email: "marco@djmarco.com" },
		luna: { handle: "lunaset", email: "hola@lunaset.cr" },
		"luna set": { handle: "lunaset", email: "hola@lunaset.cr" },
	};

	return map[key] ?? { handle: "gigblade", email: "hola@gigblade.com" };
}

export default function WishlistSections({
	artistName,
	tagline,
	city,
}: WishlistSectionsProps) {
	const place = city ? ` · ${city}` : "";
	const contact = contactFor(artistName);
	const instagramUrl = `https://instagram.com/${contact.handle}`;
	const mailUrl = `mailto:${contact.email}`;

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
						El formulario de solicitudes no está abierto. {tagline}
						{place}. El canal es Instagram o mail.
					</p>
				</div>
				<div className="hidden w-1/8 border-l border-[#292929] bg-[#0F0F0F] md:block lg:w-1/6" />
			</div>

			<div className="flex w-full">
				<div className="hidden w-1/8 border-r border-[#292929] md:block lg:w-1/6" />
				<div className="flex-1 px-4 py-10 sm:px-8 md:py-16">
					<div className="flex max-w-md flex-col gap-4">
						<p className="text-[14px] font-light leading-5 tracking-[-2%] text-[#FFFFFF99] md:text-[16px] md:leading-6">
							Próximamente puede volver un formulario con protección de borde.
							Hoy, escribile directo.
						</p>
						<div className="flex flex-col gap-2 sm:flex-row">
							<a
								href={instagramUrl}
								target="_blank"
								rel="noreferrer"
								className="wishlist-press flex h-12 min-w-0 flex-1 items-center justify-center border border-[#292929] px-4 text-[13px] font-medium tracking-wide text-white transition-[transform,background-color,border-color] duration-200 ease-out hover:border-white"
							>
								Instagram @{contact.handle}
							</a>
							<a
								href={mailUrl}
								className="wishlist-press relative flex h-12 min-w-0 flex-1 items-center justify-center overflow-hidden bg-brand px-4 text-[13px] font-medium tracking-wide text-white transition-[transform,background-color] duration-200 ease-out hover:bg-brand-hover"
							>
								{contact.email}
							</a>
						</div>
					</div>
				</div>
				<div className="hidden w-1/8 border-l border-[#292929] md:block lg:w-1/6" />
			</div>
		</div>
	);
}
