import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] || path.join(import.meta.dirname, "..", "out"));
const base = (process.env.PAGES_BASE_PATH || "/GigBlade").replace(/\/$/, "");
const escaped = base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const re = new RegExp(
	`(?<!${escaped})(/(?:images|animation)/|/favicon\\.ico|/favicon-48x48\\.png|/icon-192\\.png|/apple-touch-icon\\.png)`,
	"g",
);

const TEXT = new Set([
	".html",
	".js",
	".css",
	".txt",
	".json",
	".xml",
	".map",
	".md",
	".webmanifest",
]);

function walk(dir, files = []) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) walk(full, files);
		else files.push(full);
	}
	return files;
}

let changed = 0;
for (const file of walk(root)) {
	if (!TEXT.has(path.extname(file).toLowerCase())) continue;
	const before = fs.readFileSync(file, "utf8");
	const after = before.replace(re, `${base}$1`);
	if (after !== before) {
		fs.writeFileSync(file, after);
		changed += 1;
	}
}

console.log(`Prefixed ${changed} files in ${root} with ${base}`);
