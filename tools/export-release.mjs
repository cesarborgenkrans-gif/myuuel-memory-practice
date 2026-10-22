// Export the web teaser for the SparkleSnap portal.
//
//   node tools/export-release.mjs
//
// Copies the files listed in release.json into release/dist/, adds only the approved motion-kit sheets named in
// "sheets" (never the whole kit), and writes release/dist/release-stamp.json, which the portal's
// scripts/import-products.mjs checks before it copies the folder into products/<route>/.
// Made by Cezar Borgkrans (Cesar Borgenkrans) for SparkleSnap.
import { promises as fs } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const release = JSON.parse(await fs.readFile(path.join(root, "release.json"), "utf8"));
const dist = path.join(root, "release", "dist");
await fs.rm(dist, { recursive: true, force: true });

let files = 0, bytes = 0;
async function put(to, data) {
  const file = path.join(dist, to);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, data);
  files++; bytes += data.length;
}
for (const [to, from] of Object.entries(release.files)) await put(to, await fs.readFile(path.join(root, from)));

// The motion kit's sheet list, trimmed to the sheets this page uses, and those sheets' images.
const kit = path.join(root, "assets", "myuuel", "motion-kit");
const sheets = JSON.parse(await fs.readFile(path.join(kit, "approved-sheets.json"), "utf8")).filter((s) => release.sheets.includes(s.id));
if (sheets.length !== release.sheets.length) throw new Error("release.json names a sheet the motion kit does not have");
await put("kit/approved-sheets.json", Buffer.from(`${JSON.stringify(sheets, null, 2)}\n`));
for (const s of sheets) await put(path.join("kit", s.image), await fs.readFile(path.join(kit, s.image)));

let source = "unknown";
try {
  source = execFileSync("git", ["rev-parse", "--short", "HEAD"], { cwd: root }).toString().trim();
  if (execFileSync("git", ["status", "--porcelain"], { cwd: root }).toString().trim()) source += "-dirty";
} catch {}
const stamp = { product: release.product, route: release.route, source, exportedAt: new Date().toISOString(), files, bytes };
await fs.writeFile(path.join(dist, "release-stamp.json"), `${JSON.stringify(stamp, null, 2)}\n`);
console.log(`Exported ${release.product} ${source}: ${files} files, ${(bytes / 1024).toFixed(0)} KB -> release/dist/`);
