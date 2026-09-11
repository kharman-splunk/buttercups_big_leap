# Buttercup's Big Leap

A ranch arcade game starring Buttercup.

## Architecture

- `app/buttercup-game.tsx` — client-side canvas game and leaderboard UI
- `app/api/leaderboard/route.ts` — leaderboard HTTP microservice boundary
- `services/leaderboard.ts` — ranking and score persistence service
- `db/` and `drizzle/` — D1 schema, query helper, and migration
- `public/buttercup.png` — game-ready transparent character art derived from the supplied reference

The browser only communicates with the leaderboard through its JSON API. Scores are stored in Cloudflare D1 so the top ten are shared across users and devices.

## To launch the game

Requires Node.js 22.13 or newer.

```bash
npm ci
npm run dev -- --port 4121
```

The `.openai/hosting.json` file is committed because `vite.config.ts` uses it
to define the local Cloudflare bindings. The `.vinext/`, `.wrangler/`, and
`.next/` directories are generated locally by vinext/Wrangler and should not
be copied between clones; the startup and build commands recreate them.

Useful checks:

```bash
npm run build
npm test
npm run db:generate
```
