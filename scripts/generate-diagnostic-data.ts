import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { diagnosticAreas, scaleOptions } from "../src/lib/diagnostic-questions";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.resolve(__dirname, "../public/diagnostic-data.json");

fs.writeFileSync(
  outPath,
  JSON.stringify({ areas: diagnosticAreas, scale: scaleOptions }, null, 2),
);

console.log(`diagnostic-data.json gerado em ${outPath}`);
