/**
 * SVG の印を、スマホ用の PNG に変換します。
 * 実行例: node scripts/render-icons.mjs
 * @resvg/resvg-js は RESVG_DIR にある node_modules から読みます。
 */
import { createRequire } from "node:module";
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(process.env.RESVG_DIR, "package.json"));
const { Resvg } = require("@resvg/resvg-js");

const jobs = [
  ["public/icons/mark.svg", "public/icons/icon-512.png", 512],
  ["public/icons/mark.svg", "public/icons/icon-192.png", 192],
  ["public/icons/mark.svg", "public/apple-touch-icon.png", 180],
  ["public/icons/mark.svg", "public/icons/icon-32.png", 32],
  ["public/icons/mark-maskable.svg", "public/icons/icon-maskable-512.png", 512],
  ["public/icons/mark-maskable.svg", "public/icons/icon-maskable-192.png", 192],
];

mkdirSync(path.join(root, "public", "icons"), { recursive: true });

for (const [source, target, size] of jobs) {
  const svg = readFileSync(path.join(root, source));
  const image = new Resvg(svg, {
    fitTo: { mode: "width", value: size },
    background: "#146B43",
  })
    .render()
    .asPng();
  const output = path.join(root, target);
  writeFileSync(output, image);
  console.log(`${target} ${image.length} bytes`);
}
