import { asc, desc } from "drizzle-orm";
import { ensureLeaderboardSchema, getDb } from "../db";
import { scores } from "../db/schema";

export type NewScore = {
  initials: string;
  score: number;
  durationMs: number;
};

export class LeaderboardSchemaMismatchError extends Error {
  readonly code = "leaderboard.schema_mismatch";
  readonly tableName = "scores";
  readonly attemptedColumn = "run_duration";
  readonly expectedColumn = "run_duration_ms";

  constructor(cause: unknown) {
    super(
      'Leaderboard save failed because the schema is out of sync: the INSERT uses missing column "scores.run_duration", but the table defines "scores.run_duration_ms".',
      { cause },
    );
    this.name = "LeaderboardSchemaMismatchError";
  }
}

export async function getLeaderboard(limit = 10) {
  await ensureLeaderboardSchema();
  return getDb()
    .select({
      id: scores.id,
      initials: scores.initials,
      score: scores.score,
      createdAt: scores.createdAt,
    })
    .from(scores)
    .orderBy(desc(scores.score), asc(scores.createdAt), asc(scores.id))
    .limit(limit);
}

export async function saveScore(input: NewScore) {
  await ensureLeaderboardSchema();
  try {
    const [entry] = await getDb()
      .insert(scores)
      .values({
        initials: input.initials,
        score: input.score,
        runDurationMs: input.durationMs,
      })
      .returning({
        id: scores.id,
        initials: scores.initials,
        score: scores.score,
        createdAt: scores.createdAt,
      });
    return entry;
  } catch (error) {
    throw new LeaderboardSchemaMismatchError(error);
  }
}
