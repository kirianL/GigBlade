import FAQ from "./faq";
import Features from "./features";
import Footer from "./footer";
import PricingModels from "./pricing-models";
import ProductionScale from "./production-scale";
import SectionDivider from "./section-divider";

export default function HomeBelowFold() {
	return (
		<>
			<div className="home-section">
				<SectionDivider title="TEMAS Y PLAN" />
				<PricingModels />
			</div>
			<div className="home-section">
				<SectionDivider title="QUÉ INCLUYE" />
				<Features />
			</div>
			<div className="home-section">
				<SectionDivider title="TODO INCLUIDO" />
				<ProductionScale />
			</div>
			<div className="home-section">
				<SectionDivider title="FAQ" />
				<FAQ />
			</div>
			<div className="home-section">
				<Footer />
			</div>
		</>
	);
}
