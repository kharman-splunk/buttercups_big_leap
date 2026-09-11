"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

type GameStatus = "ready" | "running" | "gameover";
type ScoreEntry = {
  id: number;
  initials: string;
  score: number;
  createdAt: string;
};

type Obstacle = {
  x: number;
  gapY: number;
  passed: boolean;
};

const WORLD_WIDTH = 840;
const WORLD_HEIGHT = 520;
const PLAYER_X = 155;
const PLAYER_W = 104;
const PLAYER_H = 67;
const GROUND_Y = 474;
const OBSTACLE_W = 74;
const GAP_SIZE = 164;
const GRAVITY = 1150;
const FLAP_VELOCITY = -410;
const SCROLL_SPEED = 190;

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  ctx.save();
  ctx.globalAlpha = 0.58;
  ctx.fillStyle = "#fff9df";
  ctx.beginPath();
  ctx.arc(x, y, 18 * scale, 0, Math.PI * 2);
  ctx.arc(x + 22 * scale, y - 9 * scale, 25 * scale, 0, Math.PI * 2);
  ctx.arc(x + 48 * scale, y, 19 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFence(ctx: CanvasRenderingContext2D, obstacle: Obstacle) {
  const topEnd = obstacle.gapY - GAP_SIZE / 2;
  const bottomStart = obstacle.gapY + GAP_SIZE / 2;
  const x = obstacle.x;

  ctx.save();
  ctx.fillStyle = "#5b2a20";
  ctx.strokeStyle = "#311018";
  ctx.lineWidth = 5;

  const drawPost = (top: number, height: number, capAtBottom: boolean) => {
    ctx.beginPath();
    ctx.roundRect(x, top, OBSTACLE_W, height, 9);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffb02e";
    const capY = capAtBottom ? top + height - 18 : top;
    ctx.beginPath();
    ctx.roundRect(x - 8, capY, OBSTACLE_W + 16, 18, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#5b2a20";

    for (let y = top + 28; y < top + height - 20; y += 43) {
      ctx.fillStyle = "#87412b";
      ctx.fillRect(x + 7, y, OBSTACLE_W - 14, 12);
      ctx.strokeRect(x + 7, y, OBSTACLE_W - 14, 12);
    }
  };

  if (topEnd > 0) drawPost(-9, topEnd + 9, true);
  if (bottomStart < GROUND_Y) drawPost(bottomStart, GROUND_Y - bottomStart + 15, false);
  ctx.restore();
}

function drawWorld(
  ctx: CanvasRenderingContext2D,
  obstacles: Obstacle[],
  playerY: number,
  velocity: number,
  image: HTMLImageElement | null,
  time: number,
) {
  const sky = ctx.createLinearGradient(0, 0, 0, WORLD_HEIGHT);
  sky.addColorStop(0, "#ee6e91");
  sky.addColorStop(0.5, "#f7a450");
  sky.addColorStop(1, "#ffd86e");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  ctx.fillStyle = "rgba(255, 238, 149, 0.7)";
  ctx.beginPath();
  ctx.arc(700, 92, 56, 0, Math.PI * 2);
  ctx.fill();
  drawCloud(ctx, 70 - ((time * 9) % 940), 90, 0.8);
  drawCloud(ctx, 500 - ((time * 5) % 1050), 155, 0.58);
  drawCloud(ctx, 820 - ((time * 12) % 1020), 72, 0.68);

  ctx.fillStyle = "#8d3c8e";
  ctx.beginPath();
  ctx.moveTo(0, 335);
  ctx.quadraticCurveTo(120, 245, 245, 330);
  ctx.quadraticCurveTo(380, 230, 515, 323);
  ctx.quadraticCurveTo(670, 225, 840, 320);
  ctx.lineTo(840, 474);
  ctx.lineTo(0, 474);
  ctx.fill();

  ctx.fillStyle = "#4e2367";
  ctx.beginPath();
  ctx.moveTo(0, 390);
  ctx.quadraticCurveTo(160, 308, 320, 386);
  ctx.quadraticCurveTo(490, 300, 665, 382);
  ctx.quadraticCurveTo(755, 342, 840, 366);
  ctx.lineTo(840, 474);
  ctx.lineTo(0, 474);
  ctx.fill();

  ctx.fillStyle = "#e8537e";
  for (let i = 0; i < 12; i++) {
    const x = ((i * 87 - time * 42) % 930) - 45;
    ctx.beginPath();
    ctx.arc(x, 429 + (i % 3) * 9, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  obstacles.forEach((obstacle) => drawFence(ctx, obstacle));

  ctx.fillStyle = "#38203f";
  ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, WORLD_HEIGHT - GROUND_Y);
  ctx.fillStyle = "#f7bf2a";
  ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, 8);
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 3;
  for (let x = -50; x < WORLD_WIDTH + 70; x += 70) {
    const shifted = x - ((time * SCROLL_SPEED * 0.38) % 70);
    ctx.beginPath();
    ctx.moveTo(shifted, 497);
    ctx.lineTo(shifted + 34, 497);
    ctx.stroke();
  }

  ctx.save();
  const tilt = Math.max(-0.25, Math.min(0.35, velocity / 1100));
  const bob = velocity === 0 ? Math.sin(time * 4) * 5 : 0;
  ctx.translate(PLAYER_X + PLAYER_W / 2, playerY + bob + PLAYER_H / 2);
  ctx.rotate(tilt);
  if (image?.complete && image.naturalWidth > 0) {
    ctx.drawImage(image, 115, 65, 1230, 860, -PLAYER_W / 2, -PLAYER_H / 2, PLAYER_W, PLAYER_H);
  } else {
    ctx.fillStyle = "#f20b72";
    ctx.beginPath();
    ctx.ellipse(0, 0, PLAYER_W / 2, PLAYER_H / 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function ButtercupGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef({
    status: "ready" as GameStatus,
    y: 228,
    velocity: 0,
    score: 0,
    obstacles: [
      { x: 650, gapY: 245, passed: false },
      { x: 930, gapY: 330, passed: false },
      { x: 1210, gapY: 215, passed: false },
    ] as Obstacle[],
    lastFrame: 0,
    startedAt: 0,
  });
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [status, setStatus] = useState<GameStatus>("ready");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [initials, setInitials] = useState("AAA");
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [boardState, setBoardState] = useState<"loading" | "ready" | "error">("loading");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const loadScores = useCallback(async () => {
    try {
      const response = await fetch("/api/leaderboard", { cache: "no-store" });
      if (!response.ok) throw new Error("Leaderboard unavailable");
      const data = (await response.json()) as { scores: ScoreEntry[] };
      setScores(data.scores);
      setBoardState("ready");
    } catch {
      setBoardState("error");
    }
  }, []);

  useEffect(() => {
    void loadScores();
    const rememberedBest = Number(window.localStorage.getItem("buttercup-best") ?? 0);
    if (Number.isFinite(rememberedBest)) setBest(rememberedBest);

    const image = new Image();
    image.src = "/buttercup.png";
    imageRef.current = image;
  }, [loadScores]);

  const endRun = useCallback(() => {
    const game = gameRef.current;
    if (game.status !== "running") return;
    game.status = "gameover";
    const runDuration = Math.round(performance.now() - game.startedAt);
    setDurationMs(runDuration);
    setStatus("gameover");
    setScore(game.score);
    setSubmitError("");
    setBest((current) => {
      const next = Math.max(current, game.score);
      window.localStorage.setItem("buttercup-best", String(next));
      return next;
    });
  }, []);

  const flap = useCallback(() => {
    const game = gameRef.current;
    if (game.status === "ready") {
      game.status = "running";
      game.startedAt = performance.now();
      setStatus("running");
    }
    if (game.status === "running") game.velocity = FLAP_VELOCITY;
  }, []);

  const resetGame = useCallback(() => {
    gameRef.current = {
      status: "ready",
      y: 228,
      velocity: 0,
      score: 0,
      obstacles: [
        { x: 650, gapY: 245, passed: false },
        { x: 930, gapY: 330, passed: false },
        { x: 1210, gapY: 215, passed: false },
      ],
      lastFrame: performance.now(),
      startedAt: 0,
    };
    setScore(0);
    setStatus("ready");
    setSubmitError("");
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = WORLD_WIDTH * ratio;
    canvas.height = WORLD_HEIGHT * ratio;
    ctx.scale(ratio, ratio);
    let frame = 0;

    const animate = (now: number) => {
      const game = gameRef.current;
      const dt = Math.min((now - (game.lastFrame || now)) / 1000, 0.032);
      game.lastFrame = now;

      if (game.status === "running") {
        game.velocity += GRAVITY * dt;
        game.y += game.velocity * dt;
        game.obstacles.forEach((obstacle) => {
          obstacle.x -= SCROLL_SPEED * dt;
          if (!obstacle.passed && obstacle.x + OBSTACLE_W < PLAYER_X) {
            obstacle.passed = true;
            game.score += 1;
            setScore(game.score);
          }
        });

        const front = game.obstacles[0];
        if (front && front.x < -OBSTACLE_W - 20) {
          game.obstacles.shift();
          const last = game.obstacles.at(-1);
          const seed = Math.sin((game.score + 3) * 2.17) * 0.5 + 0.5;
          game.obstacles.push({
            x: (last?.x ?? 720) + 280,
            gapY: 195 + seed * 155,
            passed: false,
          });
        }

        const hitGround = game.y + PLAYER_H * 0.72 >= GROUND_Y;
        const hitCeiling = game.y + PLAYER_H * 0.2 <= 0;
        const hitObstacle = game.obstacles.some((obstacle) => {
          const overlapsX =
            PLAYER_X + PLAYER_W * 0.84 > obstacle.x &&
            PLAYER_X + PLAYER_W * 0.12 < obstacle.x + OBSTACLE_W;
          const gapTop = obstacle.gapY - GAP_SIZE / 2;
          const gapBottom = obstacle.gapY + GAP_SIZE / 2;
          const outsideGap =
            game.y + PLAYER_H * 0.2 < gapTop ||
            game.y + PLAYER_H * 0.8 > gapBottom;
          return overlapsX && outsideGap;
        });

        if (hitGround || hitCeiling || hitObstacle) endRun();
      }

      drawWorld(ctx, game.obstacles, game.y, game.velocity, imageRef.current, now / 1000);
      frame = window.requestAnimationFrame(animate);
    };

    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [endRun]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.code === "Space" || event.code === "ArrowUp") && status !== "gameover") {
        event.preventDefault();
        flap();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [flap, status]);

  const submitScore = async (event: FormEvent) => {
    event.preventDefault();
    const clean = initials.toUpperCase().replace(/[^A-Z]/g, "");
    if (clean.length !== 3) {
      setSubmitError("Enter exactly three letters.");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      const response = await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ initials: clean, score, durationMs }),
      });
      if (!response.ok) throw new Error("Could not save score");
      await loadScores();
      resetGame();
    } catch {
      setSubmitError("Couldn’t reach the leaderboard. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStageInput = () => {
    if (status !== "gameover") flap();
  };

  return (
    <main className="site-shell">
      <header className="topbar">
        <div>
          <p className="brand-kicker">Sunset Ranch Arcade</p>
          <h1 className="brand-title">
            Buttercup&apos;s <span>Big Leap</span>
          </h1>
        </div>
        <p className="tagline">Leap · Dodge · Gallop to glory</p>
      </header>

      <section className="content-grid" aria-label="Buttercup's Big Leap game and leaderboard">
        <article className="game-card">
          <div
            className="game-stage"
            onPointerDown={handleStageInput}
            role="application"
            aria-label="Game area. Press space, up arrow, or tap to make Buttercup leap."
          >
            <canvas ref={canvasRef} aria-hidden="true" />
            <div className="hud" aria-live="polite">
              <div className="score-chip">
                <small>Score</small>
                <strong>{score}</strong>
              </div>
              <div className="score-chip best-chip">
                <small>Best</small>
                <strong>{best}</strong>
              </div>
            </div>

            {status === "ready" && (
              <div className="start-panel">
                <div className="start-card">
                  <p className="eyebrow">The trail is open</p>
                  <h2>Ready to leap?</h2>
                  <p>Guide Buttercup between the ranch gates. Every clean pass earns a point.</p>
                  <button className="primary-button" type="button" onPointerDown={(event) => event.stopPropagation()} onClick={flap}>
                    Start run
                  </button>
                </div>
              </div>
            )}

            {status === "gameover" && (
              <div className="gameover-panel" role="dialog" aria-modal="true" aria-labelledby="gameover-title">
                <form className="gameover-card" onSubmit={submitScore} onPointerDown={(event) => event.stopPropagation()}>
                  <p className="eyebrow">Run complete</p>
                  <h2 id="gameover-title">Nice riding!</h2>
                  <div className="final-score">
                    <strong>{score}</strong>
                    <span>gates<br />cleared</span>
                  </div>
                  <label className="initials-label" htmlFor="initials">Add your initials</label>
                  <input
                    className="initials-input"
                    id="initials"
                    value={initials}
                    onChange={(event) => setInitials(event.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3))}
                    maxLength={3}
                    pattern="[A-Za-z]{3}"
                    autoComplete="off"
                    autoFocus
                    aria-describedby={submitError ? "submit-error" : undefined}
                  />
                  <div className="form-actions">
                    <button className="primary-button" disabled={submitting} type="submit">
                      {submitting ? "Saving…" : "Save score"}
                    </button>
                    <button className="secondary-button" disabled={submitting} type="button" onClick={resetGame}>
                      Skip
                    </button>
                  </div>
                  {submitError && <p className="submit-error" id="submit-error">{submitError}</p>}
                </form>
              </div>
            )}
          </div>
          <div className="game-instructions">
            <span className="keycap">Space</span>
            <span className="keycap">↑</span>
            <p>or tap anywhere to leap</p>
          </div>
        </article>

        <aside className="leaderboard-card" aria-labelledby="leaderboard-title">
          <div className="leaderboard-head">
            <p className="eyebrow">Ranch legends</p>
            <h2 id="leaderboard-title">Top Riders</h2>
          </div>
          {boardState === "loading" && <p className="board-message">Rounding up the scores…</p>}
          {boardState === "error" && <p className="board-message">The leaderboard is off trail. Your run is still playable.</p>}
          {boardState === "ready" && scores.length === 0 && (
            <p className="board-message">No ranch legends yet. Be the first on the board!</p>
          )}
          {boardState === "ready" && scores.length > 0 && (
            <ol className="leaderboard-list">
              {scores.map((entry, index) => (
                <li className={`leaderboard-row ${index < 3 ? "top-three" : ""}`} key={entry.id}>
                  <span className="rank">{String(index + 1).padStart(2, "0")}</span>
                  <span className="initials">{entry.initials}</span>
                  <span className="row-score">{entry.score}</span>
                </li>
              ))}
            </ol>
          )}
          <div className="board-foot">Shared live · Top 10 all time</div>
        </aside>
      </section>
      <p className="footer-note">Made for fast hooves and faster reflexes</p>
    </main>
  );
}
