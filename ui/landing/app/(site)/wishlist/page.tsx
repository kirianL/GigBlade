import type { Metadata } from "next";
import WishlistSections from "@/components/wishlist-sections";

export const metadata: Metadata = {
	title: "Solicitar fecha",
	description:
		"Dejá tu solicitud de booking en la lista de espera. Un canal formal, sin DMs sueltos.",
	alternates: { canonical: "/wishlist" },
};

type WishlistPageProps = {
	artistName: string;
	tagline: string;
	city: string;
};

export default function WishlistPage({
	artistName = "GigBlade",
	tagline = "Página, dominio y un canal formal para bookings",
	city = "",
}: Partial<WishlistPageProps> = {}) {
	return (
		<>
			<WishlistSections
				artistName={artistName}
				tagline={tagline}
				city={city}
			/>
			<div className="mt-10.5 hidden w-full flex-col gap-2.5 md:flex">
				<div className="w-full border-t border-[#292929]" />
				<div className="w-full border-t border-[#292929]" />
				<div className="w-full border-t border-[#292929]" />
				<div className="w-full border-t border-[#292929]" />
				<div className="w-full border-t border-[#292929]" />
			</div>
		</>
	);
}
