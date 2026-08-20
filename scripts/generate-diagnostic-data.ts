import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { diagnosticAreas, scaleOptions } from "../src/lib/diagnostic-questions";
import { diagnosticRules } from "../src/lib/diagnostic-engine/rules";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.resolve(__dirname, "../public/diagnostic-data.json");
const rulesPath = path.resolve(__dirname, "../public/diagnostic-rules.json");

fs.writeFileSync(
  dataPath,
  JSON.stringify({ areas: diagnosticAreas, scale: scaleOptions }, null, 2),
);
console.log(`diagnostic-data.json gerado em ${dataPath}`);

// The rules engine's content (thresholds, conditions, finding/recommendation
// text) lives once in src/lib/diagnostic-engine/rules.ts. This export lets
// the PHP interpreter (public/diagnostic-engine.php) evaluate the exact
// same rule set at runtime, without duplicating any business text in PHP —
// re-run this script whenever rules.ts changes.
fs.writeFileSync(rulesPath, JSON.stringify({ rules: diagnosticRules }, null, 2));
console.log(`diagnostic-rules.json gerado em ${rulesPath}`);
