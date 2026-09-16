import { Link } from "react-router";
import { useEnv } from "@/utils/envUtils";
import { getRedirectUrl } from "@/utils/genUtils";
import ErrorScreen from "./general/ErrorScreen";

export const DefaultView = () => {
	const env = useEnv();
	return (
		<ErrorScreen>
			<p className="mb-4">Esta página no existe</p>
			<Link
				className="text-tertiary-foreground hover:underline"
				to={getRedirectUrl("/overview", env)}
			>
				Volver al panel
			</Link>
		</ErrorScreen>
	);
};
