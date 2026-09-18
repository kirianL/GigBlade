import { AppEnv } from "@autumn/shared";
import { init } from "@squircle/core";
import * as React from "react";
import { Navigate, Route, Routes } from "react-router";
import { DashboardGate } from "./DashboardGate";
import { MainLayout } from "./layout";
import { OnboardingLayout } from "./OnboardingLayout";

const AdminView = React.lazy(() =>
	import("@/views/admin/AdminView").then(({ AdminView }) => ({
		default: AdminView,
	})),
);
const EdgeConfigView = React.lazy(() =>
	import("@/views/admin/edge-config/EdgeConfigView").then(
		({ EdgeConfigView }) => ({ default: EdgeConfigView }),
	),
);
const ImpersonateRedirect = React.lazy(() =>
	import("@/views/admin/ImpersonateRedirect").then(
		({ ImpersonateRedirect }) => ({ default: ImpersonateRedirect }),
	),
);
const OAuthClientsView = React.lazy(() =>
	import("@/views/admin/oauth/OAuthClientsView").then(
		({ OAuthClientsView }) => ({ default: OAuthClientsView }),
	),
);
const AnalyticsView = React.lazy(() =>
	import("@/views/customers/customer/analytics/AnalyticsView").then(
		({ AnalyticsView }) => ({ default: AnalyticsView }),
	),
);
const CustomerView2 = React.lazy(
	() => import("@/views/customers2/customer/CustomerView2"),
);
const CustomerPlanEditor = React.lazy(
	() => import("@/views/customers2/customer-plan/CustomerPlanEditor"),
);
const DefaultView = React.lazy(() =>
	import("@/views/DefaultView").then(({ DefaultView }) => ({
		default: DefaultView,
	})),
);
const DevScreen = React.lazy(() => import("@/views/developer/DevView"));
const MigrationsView = React.lazy(() =>
	import("@/views/migrations/MigrationsView").then(({ MigrationsView }) => ({
		default: MigrationsView,
	})),
);
const MigrationView = React.lazy(() =>
	import("@/views/migrations/migration/MigrationView").then(
		({ MigrationView }) => ({
			default: MigrationView,
		}),
	),
);
const QuickstartView = React.lazy(
	() => import("@/views/onboarding4/QuickstartView"),
);
const ProductsView = React.lazy(() => import("@/views/products/ProductsView"));
const PlanEditorView = React.lazy(
	() => import("@/views/products/plan/PlanEditorView"),
);
const SettingsView = React.lazy(() =>
	import("@/views/settings/SettingsView").then(({ SettingsView }) => ({
		default: SettingsView,
	})),
);
const TerminalView = React.lazy(() =>
	import("@/views/TerminalView").then(({ TerminalView }) => ({
		default: TerminalView,
	})),
);

function SquircleProvider({ children }: { children: React.ReactNode }) {
	React.useEffect(() => void init(), []);
	return children;
}

const envRoutes = (
	path: string,
	element: React.ReactNode,
	sandboxElement = element,
) => [
	<Route key={path} path={`/${path}`} element={element} />,
	<Route
		key={`sandbox-${path}`}
		path={`/sandbox/${path}`}
		element={sandboxElement}
	/>,
	<Route
		key={`sandbox-named-${path}`}
		path={`/sandbox/:sandboxSlug/${path}`}
		element={sandboxElement}
	/>,
];

export default function AutumnApp() {
	return (
		<Routes>
			<Route
				path="/sandbox/:sandboxSlug"
				element={<Navigate replace to="products" />}
			/>

			<Route element={<OnboardingLayout />}>
				<Route path="/sandbox/quickstart" element={<QuickstartView />} />
			</Route>

			<Route element={<DashboardGate />}>
				<Route element={<MainLayout />}>
					{envRoutes("settings", <SettingsView />)}
					{envRoutes("admin", <AdminView />)}
					{envRoutes("admin/oauth", <OAuthClientsView />)}
					{envRoutes("admin/edge-config", <EdgeConfigView />)}
					{envRoutes("impersonate-redirect", <ImpersonateRedirect />)}
					<Route path="/trmnl" element={<TerminalView />} />
					{envRoutes(
						"products",
						<ProductsView env={AppEnv.Live} />,
						<ProductsView env={AppEnv.Sandbox} />,
					)}
					{envRoutes("migrations", <MigrationsView />)}
					{envRoutes("migrations/:migration_id", <MigrationView />)}
					{envRoutes(
						"products/:product_id",
						<SquircleProvider>
							<PlanEditorView />
						</SquircleProvider>,
					)}
					{envRoutes("customers", <Navigate to="/djs" replace />)}
					{envRoutes("customers/:customer_id", <CustomerView2 />)}
					{envRoutes(
						"customers/:customer_id/:product_id",
						<CustomerPlanEditor />,
					)}
					{envRoutes("dev", <DevScreen />)}
					{envRoutes("analytics", <AnalyticsView />)}
					<Route path="*" element={<DefaultView />} />
				</Route>
			</Route>
		</Routes>
	);
}
