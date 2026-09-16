import analyticsSvg from "./analytics.svg";
import apiKeysSvg from "./api-keys.svg";
import customersSvg from "./customers.svg";
import featuresSvg from "./features.svg";
import plansSvg from "./plans.svg";
import rewardsSvg from "./rewards.svg";

export const EmptyState = ({
	type,
	actionButton,
}: {
	type:
		| "plans"
		| "features"
		| "customers"
		| "api-keys"
		| "rewards"
		| "archived-plans"
		| "no-customers-found"
		| "analytics"
		| "migrations";
	actionButton?: React.ReactNode;
}) => {
	const getEmptyStateContent = () => {
		switch (type) {
			case "plans":
				return {
					title: "Tu plan",
					description:
						"El plan define precio, dominio, hosting y booking para cada DJ.",
					svg: plansSvg,
				};
			case "archived-plans":
				return {
					title: "Sin planes archivados",
					description: "Todavía no archivaste ningún plan.",
					svg: plansSvg,
				};
			case "features":
				return {
					title: "Qué incluye",
					description:
						"Dominio, booking y hosting. Después los empaquetás en el plan.",
					svg: featuresSvg,
				};
			case "customers":
				return {
					title: "DJs",
					description:
						"Cada DJ es una página: dominio propio y formulario de booking.",
					svg: customersSvg,
				};
			case "no-customers-found":
				return {
					title: "Ningún DJ coincide",
					description: "Probá con otro nombre, email o dominio.",
					svg: customersSvg,
				};
			case "rewards":
				return {
					title: "Recompensas",
					description:
						"Descuentos o códigos para DJs. Opcional en este MVP.",
					svg: rewardsSvg,
				};
			case "analytics":
				return {
					title: "Sin métricas todavía",
					description:
						"Cuando haya solicitudes de booking, aparecen acá.",
					svg: analyticsSvg,
				};
			case "api-keys":
				return {
					title: "API Keys",
					description:
						"Creá una clave para autenticar requests a la API.",
					svg: apiKeysSvg,
				};
			case "migrations":
				return {
					title: "Migrations",
					description:
						"Define filters and operations to migrate sets of customers in bulk",
					// Reuses plans illustration for now — replace once we have a dedicated svg.
					svg: plansSvg,
				};
		}
	};

	const { title, description, svg } = getEmptyStateContent();

	return (
		<div className="flex flex-col items-center justify-center gap-4 p-8 text-sm pt-20 animate-in fade-in-0 duration-500 slide-in-from-bottom-1">
			<img src={svg} alt={title} className="h-20" />
			<div className="space-y-1">
				<h2 className="text-muted-foreground font-medium text-center">
					{title}
				</h2>
				<p className="text-subtle w-xs text-wrap text-center">{description}</p>
			</div>
			{actionButton && actionButton}
		</div>
	);
};
