// Read-only. Regenerates lib/table-links.ts from the Airtable Meta API:
// which tables link to which (both directions), used to scope cache
// invalidation after writes. Run: node scripts/generate-table-links.mjs
import fs from "node:fs";

const env = fs.readFileSync(".env.local", "utf8");
const tok = env.match(/^AIRTABLE_TOKEN=["']?([^"'\n]+)/m)[1];
const base = env.match(/^AIRTABLE_BASE_ID=["']?([^"'\n]+)/m)?.[1] ?? "app4vhhWMbRFOloOU";

const r = await fetch(`https://api.airtable.com/v0/meta/bases/${base}/tables`, {
  headers: { Authorization: `Bearer ${tok}` },
});
if (!r.ok) throw new Error(`Meta API ${r.status}: ${await r.text()}`);
const { tables } = await r.json();

const names = {};
const links = {};
for (const t of tables) {
  names[t.id] = t.name;
  links[t.id] ??= new Set();
}
for (const t of tables) {
  for (const f of t.fields) {
    const target = f.type === "multipleRecordLinks" ? f.options?.linkedTableId : null;
    if (!target) continue;
    links[t.id].add(target);
    (links[target] ??= new Set()).add(t.id);
  }
}
const sorted = Object.fromEntries(Object.entries(links).map(([k, v]) => [k, [...v].sort()]));

fs.writeFileSync(
  "lib/table-links.ts",
  [
    `// GENERATED from the Airtable Meta API (base ${base}) — do not hand-edit.`,
    "// Which tables link to which, both directions. A write to one table can change",
    "// lookup/rollup values in its linked tables, so cache invalidation after a write",
    "// clears the written table and these neighbours (see invalidateTable in lib/airtable.ts).",
    "// Regenerate when link fields are added: node scripts/generate-table-links.mjs",
    "",
    `export const TABLE_NAMES: Record<string, string> = ${JSON.stringify(names, null, 2)};`,
    "",
    `export const TABLE_LINKS: Record<string, string[]> = ${JSON.stringify(sorted, null, 2)};`,
    "",
  ].join("\n"),
);
console.log(`wrote lib/table-links.ts (${tables.length} tables)`);
