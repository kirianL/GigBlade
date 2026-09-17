import { AutumnProvider } from "autumn-js/react";
import { NuqsAdapter } from "nuqs/adapters/react-router/v7";
import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router";
import { CustomToaster } from "@/components/general/CustomToaster";
import { useGlobalErrorHandler } from "@/hooks/common/useGlobalErrorHandler";
import { useSession } from "@/lib/auth-client";
import LoadingScreen from "@/views/general/LoadingScreen";

export function OnboardingLayout() {
	const { data, isPending } = useSession();
	const { handleApiError } = useGlobalErrorHandler();
	const navigate = useNavigate();

	// Global error handler for API errors
	useEffect(() => {
		const handleGlobalError = (event: ErrorEvent) => {
			if (event.error?.response) {
				handleApiError(event.error);
			}
		};

		window.addEventListener("error", handleGlobalError);
		return () => window.removeEventListener("error", handleGlobalError);
	}, [handleApiError]);

	useEffect(() => {
		if (!isPending && !data) {
			navigate("/sign-in");
		}
	}, [data, isPending, navigate]);

	// 1. If not loaded, show loading screen
	if (isPending) {
		return (
			<AutumnProvider
				backendUrl={`${import.meta.env.VITE_BACKEND_URL}/demo`.replace(
					/([^:]\/)\/+/g,
					"$1",
				)}
				includeCredentials={true}
			>
				<LoadingScreen fullPage />
			</AutumnProvider>
		);
	}

	// 2. If no user, redirect to sign in
	if (!data) {
		return null;
	}

	return (
		<AutumnProvider
			backendUrl={`${import.meta.env.VITE_BACKEND_URL}/demo`.replace(
				/([^:]\/)\/+/g,
				"$1",
			)}
			includeCredentials={true}
		>
			<NuqsAdapter>
				<main className="w-screen h-screen bg-background">
					<CustomToaster />
					<Outlet />
				</main>
			</NuqsAdapter>
		</AutumnProvider>
	);
}
