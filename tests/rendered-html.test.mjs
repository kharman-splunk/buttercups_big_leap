import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("builds the Buttercup game shell", async () => {
  const [layout, page, game] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/buttercup-game.tsx", import.meta.url), "utf8"),
    access(new URL("../dist/server/index.js", import.meta.url)),
  ]);

  assert.match(layout, /title: "Buttercup's Big Leap"/);
  assert.match(page, /<ButtercupGame \/>/);
  assert.match(game, /Top Riders/);
  assert.match(game, /Start run/);
  assert.match(game, /Space/);
  assert.doesNotMatch(`${layout}\n${page}\n${game}`, /codex-preview|react-loading-skeleton|Building your site/i);
});

test("ships the game asset and separate leaderboard API", async () => {
  const [route, game, hosting] = await Promise.all([
    readFile(new URL("../app/api/leaderboard/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/buttercup-game.tsx", import.meta.url), "utf8"),
    readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
    access(new URL("../public/buttercup.png", import.meta.url)),
  ]);

  assert.match(route, /export async function GET/);
  assert.match(route, /export async function POST/);
  assert.match(route, /\^\[A-Z\]\{3\}\$/);
  assert.match(game, /\/api\/leaderboard/);
  assert.match(game, /requestAnimationFrame/);
  assert.match(hosting, /"d1": "DB"/);
});
