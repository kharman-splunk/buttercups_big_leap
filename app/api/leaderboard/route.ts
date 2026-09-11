import {
  getLeaderboard,
  saveScore,
} from "../../../services/leaderboard";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const scores = await getLeaderboard(10);
    return Response.json({ scores }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("leaderboard:get", error);
    return Response.json({ error: "Leaderboard unavailable" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      initials?: unknown;
      score?: unknown;
      durationMs?: unknown;
    };
    const initials = typeof payload.initials === "string" ? payload.initials.trim().toUpperCase() : "";
    const score = typeof payload.score === "number" ? payload.score : NaN;
    const durationMs = typeof payload.durationMs === "number" ? payload.durationMs : NaN;

    if (!/^[A-Z]{3}$/.test(initials)) {
      return Response.json({ error: "Initials must be exactly three letters" }, { status: 400 });
    }
    if (!Number.isInteger(score) || score < 0 || score > 999_999) {
      return Response.json({ error: "Score is invalid" }, { status: 400 });
    }
    if (!Number.isInteger(durationMs) || durationMs < 0 || durationMs > 86_400_000) {
      return Response.json({ error: "Run duration is invalid" }, { status: 400 });
    }

    const entry = await saveScore({ initials, score, durationMs });
    return Response.json({ score: entry }, { status: 201 });
  } catch (error) {
    console.error("leaderboard:post", error);
    return Response.json({ error: "Could not save score" }, { status: 503 });
  }
}
