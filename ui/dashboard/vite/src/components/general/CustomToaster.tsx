import {
	CheckCircleIcon,
	InfoIcon,
	SealWarningIcon,
	SpinnerIcon,
} from "@phosphor-icons/react";
import { Toaster as ToasterComponent } from "sonner";
import { useOnboardingStore } from "@/views/onboarding3/store/useOnboardingStore";

export const CustomToaster = () => {
	const isOnboarding = useOnboardingStore((state) => state.isOnboarding);

	return (
		<ToasterComponent
			position={isOnboarding ? "bottom-left" : "top-center"}
			className={isOnboarding ? "" : "flex justify-center"}
			duration={4200}
			mobileOffset={{ top: "calc(env(safe-area-inset-top, 0px) + 12px)" }}
			offset={{ top: "calc(env(safe-area-inset-top, 0px) + 12px)" }}
			toastOptions={{
				duration: 4200,
				className:
					"w-[min(24rem,calc(100vw-1.5rem))] px-3 pt-3 pb-2.5 rounded-2xl shadow-[0_4px_4px_0_rgba(0,0,0,0.02),inset_0_-4px_6px_0_rgba(0,0,0,0.04),0_4px_24px_0_rgba(0,0,0,0.03)] outline outline-16 inline-flex flex-row justify-start items-start gap-3 overflow-hidden !bg-card !text-foreground",
				classNames: {
					description: "!text-muted-foreground",
				},
				style: {
					"--normal-border": "var(--border)",
				} as React.CSSProperties,
			}}
			icons={{
				success: <CheckCircleIcon size={16} weight="fill" color="#00C745" />,
				error: <SealWarningIcon size={16} weight="fill" color="#DE171A" />,
				warning: <SealWarningIcon size={16} weight="fill" color="#DE171A" />,
				info: <InfoIcon size={16} weight="fill" color="#008DF2" />,
				loading: <SpinnerIcon size={16} weight="fill" color="#008DF2" />,
			}}
		></ToasterComponent>
	);
};
