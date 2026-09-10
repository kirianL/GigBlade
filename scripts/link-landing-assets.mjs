import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const linkType = process.platform === "win32" ? "junction" : "dir";

const links = [
  ["public", "ui/landing/public"],
  ["content", "ui/landing/content"],
];

for (const [destName, srcName] of links) {
  const dest = path.join(root, destName);
  const src = path.join(root, srcName);

  if (!fs.existsSync(src)) {
    throw new Error(`Falta el origen de la landing: ${src}`);
  }

  if (fs.existsSync(dest)) {
    continue;
  }

  fs.symlinkSync(src, dest, linkType);
}
