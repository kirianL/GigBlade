import { AuroraBackground } from "@/components/background-gradient/aurora-background";
import { AuroraFrame } from "@/components/background-gradient/aurora-frame";

export default function HeroAurora() {
	return (
		<>
			<AuroraBackground className="absolute inset-0 h-full w-full" />
			<AuroraFrame />
		</>
	);
}
