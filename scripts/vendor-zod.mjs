#!/usr/bin/env node
// Le frontend est servi tel quel par un serveur statique (voir start.sh),
// sans bundler. Les navigateurs ne savent pas résoudre l'import nu "zod"
// utilisé par les schémas ; ce script copie le build ESM de zod déjà
// installé dans node_modules vers public/dist/vendor/zod, pour que
// l'import map de public/index.html puisse le résoudre en local.
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const zodPackageDir = join(projectRoot, "node_modules", "zod");
const destDir = join(projectRoot, "public", "dist", "vendor", "zod");

function isJsFileOrDir(src) {
  return !src.includes(".") || src.endsWith(".js");
}

rmSync(destDir, { recursive: true, force: true });
mkdirSync(destDir, { recursive: true });

cpSync(join(zodPackageDir, "index.js"), join(destDir, "index.js"));
cpSync(join(zodPackageDir, "v4"), join(destDir, "v4"), {
  recursive: true,
  filter: isJsFileOrDir,
});

console.log("zod vendored into public/dist/vendor/zod/");
