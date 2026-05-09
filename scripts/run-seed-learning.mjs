/**
 * scripts/run-seed-learning.mjs
 *
 * Wrapper that runs the canonical learning content seed against the
 * project's DATABASE_URL. Uses dotenv to load .env and then dynamically
 * imports the seed module, which is co-located in this scripts dir.
 */
import { config } from "dotenv";
config();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL not set; aborting");
  process.exit(1);
}

console.log("[run-seed-learning] DATABASE_URL detected, running seed-learning-content...");
await import("./seed-learning-content.mjs");
