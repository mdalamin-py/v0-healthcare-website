// Prints every migration in order (and optionally the seed) as one SQL script,
// ready to paste into the Supabase SQL Editor.
//   node scripts/bundle-sql.mjs > setup.sql          migrations only
//   node scripts/bundle-sql.mjs --seed > setup.sql   migrations + sample data
import { readdirSync, readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("../supabase/", import.meta.url))
const parts = readdirSync(`${root}migrations`)
  .filter((file) => file.endsWith(".sql"))
  .sort()
  .map((file) => `-- >>> ${file}\n${readFileSync(`${root}migrations/${file}`, "utf8")}`)

if (process.argv.includes("--seed")) parts.push(`-- >>> seed.sql\n${readFileSync(`${root}seed.sql`, "utf8")}`)

process.stdout.write(parts.join("\n\n"))
