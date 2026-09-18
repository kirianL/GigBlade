import * as React from "react";
import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { GigbladeLayout } from "./app/GigbladeLayout";
import { BootScreen } from "./gigblade/BootScreen";
import { useSession } from "./lib/auth-client";
import { SignIn } from "./views/auth/SignIn";

const AcceptInvitation = React.lazy(() =>
	import("./views/auth/AcceptInvitation").then(({ AcceptInvitation }) => ({
		default: AcceptInvitation,
	})),
);
const PasswordSignIn = React.lazy(() =>
	import("./views/auth/components/PasswordSignIn").then(
		({ PasswordSignIn }) => ({ default: PasswordSignIn }),
	),
);
const CloseScreen = React.lazy(() =>
	import("./views/general/CloseScreen").then(({ CloseScreen }) => ({
		default: CloseScreen,
	})),
);
const PlatformOverview = React.lazy(
	() => import("./gigblade/PlatformOverview"),
);
const PlatformDjs = React.lazy(() => import("./gigblade/PlatformDjs"));
const PlatformDomains = React.lazy(() => import("./gigblade/PlatformDomains"));
const PlatformPlan = React.lazy(() => import("./gigblade/PlatformPlan"));
const DjStudioPage = React.lazy(() => import("./gigblade/DjStudioPage"));
const DjContentPage = React.lazy(() => import("./gigblade/DjContentPage"));
const DjVisitsPage = React.lazy(() => import("./gigblade/DjVisitsPage"));
const SettingsView = React.lazy(() =>
	import("./views/settings/SettingsView").then(({ SettingsView }) => ({
		default: SettingsView,
	})),
);

export default function App() {
	const { data } = useSession();

	useEffect(() => {
		if (!data?.user) return;

		void import("./utils/posthogTracking").then(({ identifyUser }) => {
			identifyUser({
				email: data.user.email,
				name: data.user.name,
			});
		});

		if (!import.meta.env.VITE_SENTRY_DSN) return;
		void import("@sentry/react").then((Sentry) => {
			Sentry.setUser({
				email: data.user.email ?? "unknown_email",
				name: data.user.name ?? "unknown_name",
				id: data.user.id ?? "unknown_user",
			});
			Sentry.setTags({
				org_id: data.session.activeOrganizationId ?? "unknown_org",
			});
		});
	}, [data]);

	return (
		<BrowserRouter>
			<Routes>
				<Route path="/sign-in" element={<SignIn />} />
				<Route
					path="/pw-sign-in"
					element={
						<React.Suspense fallback={<BootScreen />}>
							<PasswordSignIn />
						</React.Suspense>
					}
				/>
				<Route
					path="/accept"
					element={
						<React.Suspense fallback={<BootScreen />}>
							<AcceptInvitation />
						</React.Suspense>
					}
				/>
				<Route
					path="/close"
					element={
						<React.Suspense fallback={<BootScreen />}>
							<CloseScreen />
						</React.Suspense>
					}
				/>

				<Route element={<GigbladeLayout />}>
					<Route path="/" element={<Navigate to="/overview" replace />} />
					<Route path="/overview" element={<PlatformOverview />} />
					<Route path="/djs" element={<PlatformDjs />} />
					<Route path="/domains" element={<PlatformDomains />} />
					<Route path="/plan" element={<PlatformPlan />} />
					<Route
						path="/bookings"
						element={<Navigate to="/overview" replace />}
					/>
					<Route path="/studio" element={<DjStudioPage />} />
					<Route
						path="/studio/bookings"
						element={<Navigate to="/studio" replace />}
					/>
					<Route path="/studio/content" element={<DjContentPage />} />
					<Route path="/studio/visitas" element={<DjVisitsPage />} />
					<Route path="/settings" element={<SettingsView />} />
				</Route>

				<Route path="*" element={<Navigate to="/overview" replace />} />
			</Routes>
		</BrowserRouter>
	);
}
