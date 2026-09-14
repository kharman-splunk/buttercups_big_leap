# Buttercup's Big Leap

A ranch arcade game starring Buttercup.

## Architecture

- `app/buttercup-game.tsx` — client-side canvas game and leaderboard UI
- `app/api/leaderboard/route.ts` — leaderboard HTTP microservice boundary
- `services/leaderboard.ts` — ranking and score persistence service
- `db/` and `drizzle/` — D1 schema, query helper, and migration
- `public/buttercup.png` — game-ready transparent character art derived from the supplied reference


## To launch the game

Requires Node.js 22.13 or newer.

In terminal, run the following commands to perform a clean install, and then launch the game.

```bash
npm ci
npm run dev -- --port 4121
```


Useful checks:

```bash
npm run build
npm test
npm run db:generate
```
