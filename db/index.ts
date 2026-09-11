import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

let schemaReady: Promise<unknown> | null = null;

export function getD1() {
  if (!env.DB) {
    throw new Error("Cloudflare D1 binding `DB` is unavailable.");
  }
  return env.DB;
}

export function getDb() {
  return drizzle(getD1(), { schema });
}

export async function ensureLeaderboardSchema() {
  if (!schemaReady) {
    const d1 = getD1();
    schemaReady = d1.batch([
      d1.prepare(`CREATE TABLE IF NOT EXISTS scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        initials TEXT NOT NULL,
        score INTEGER NOT NULL,
        run_duration_ms INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`),
      d1.prepare(`CREATE INDEX IF NOT EXISTS idx_scores_rank
        ON scores (score DESC, created_at ASC)`),
      d1.prepare("PRAGMA optimize"),
    ]);
  }
  await schemaReady;
}
