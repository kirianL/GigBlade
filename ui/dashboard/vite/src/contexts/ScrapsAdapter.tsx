import { useEffect } from "react";
import { type ScrapAdaptMap, useScraps } from "scraps-ui/react";
import "scraps-ui/scraps.css";

const SCRAPS_COMPONENTS = {
	'[data-slot="card"]': "card",
	'[data-slot="table-container"]': "card",
	'[data-slot="dialog-content"]': { type: "dialog", rot: 0 },
	'[data-slot="sheet-content"]': { type: "panel", rot: 0 },
	'[data-slot="popover-content"]': { type: "popover", rot: 0 },
	'[data-slot="dropdown-menu-content"]': { type: "menu", rot: 0 },
	'[data-slot="select-content"]': { type: "menu", rot: 0 },
	'[data-slot="tooltip-content"]': { type: "popover", rot: 0 },
	'[data-slot="button"]:not([data-slot="main-sidebar"] *)': "button",
	'button[data-slot$="-trigger"]:not([data-slot="main-sidebar"] *):not([data-slot="table-container"] *)':
		"button",
	'button[class~="bg-primary"]:not([data-slot="main-sidebar"] *)': {
		type: "button",
		color: "coral",
		ink: false,
	},
	'button[class~="bg-destructive"]:not([data-slot="main-sidebar"] *)': {
		type: "button",
		color: "coral",
		ink: false,
	},
	'[data-slot="input"]': "input",
	'[data-slot="textarea"]': "input",
	'[data-slot="select-trigger"]': "field",
	'[data-slot="input-group"]': "field",
	'[data-slot="badge"]:not([data-slot="main-sidebar"] *)': "badge",
	'[data-slot="checkbox"]': "checkbox",
	'[data-slot="switch"]': "switch",
	'[data-slot="switch-thumb"]': "thumb",
	'[data-slot="separator-root"]': "separator",
	'[data-slot="dropdown-menu-separator"]': "separator",
	'[data-slot="select-separator"]': "separator",
	'[data-slot="command-separator"]': "separator",
} satisfies ScrapAdaptMap;

export default function ScrapsAdapter() {
	useScraps(SCRAPS_COMPONENTS, { enabled: true });
	useEffect(() => {
		document.documentElement.dataset.scrapsReady = "true";
		return () => {
			delete document.documentElement.dataset.scrapsReady;
		};
	}, []);
	return null;
}
