import { readFile } from "node:fs/promises";

const [before, after = "catalog/review.json"] = process.argv.slice(2);
if (!before) {
  console.error("Usage: npm run catalog:diff -- previous.json [current.json]");
  process.exit(1);
}
const key = ({ brand, family, year, trim }) =>
  [brand, family, year, trim].join(" / ");
const index = async (path) => {
  const rows = JSON.parse(await readFile(path, "utf8"));
  const entries = new Map(rows.map((row) => [key(row), row]));
  if (entries.size !== rows.length)
    throw new Error("Duplicate catalog identity");
  return entries;
};
const [oldRows, newRows] = await Promise.all([index(before), index(after)]);
for (const [id, row] of newRows) {
  const previous = oldRows.get(id);
  if (!previous) {
    console.log("Added", id);
    continue;
  }
  const changed = [
    ...new Set([...Object.keys(previous), ...Object.keys(row)]),
  ].filter(
    (field) => JSON.stringify(previous[field]) !== JSON.stringify(row[field]),
  );
  if (changed.length) console.log("Changed", id, changed.join(", "));
}
for (const id of oldRows.keys())
  if (!newRows.has(id)) console.log("Removed", id);
