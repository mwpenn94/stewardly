/**
 * scripts/run-seed-formulas.mjs
 * Runs the canonical formulas seed against project DATABASE_URL.
 */
import { config } from "dotenv";
config();
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL not set; aborting");
  process.exit(1);
}
console.log("[run-seed-formulas] running seed-formulas...");
await import("./seed-formulas.mjs");
