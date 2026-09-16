import { motion } from "motion/react";

export function WelcomeHeader() {
	return (
		<motion.div
			initial={{ opacity: 0, y: -20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -20 }}
			transition={{ duration: 0.5, ease: "easeOut" }}
			className="text-center mb-8"
		>
			<h1 className="text-2xl font-semibold text-foreground mb-1">
				Bienvenido a GigBlade
			</h1>
			<p className="text-md text-tertiary-foreground font-normal">
				Armá el plan de la página: dominio, booking y hosting.
			</p>
		</motion.div>
	);
}
