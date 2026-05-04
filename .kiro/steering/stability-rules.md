# Atlas Stability Rules

These rules exist because specific bugs have caused production outages. Follow them on every change.

## Backend: never call process.exit() outside of intentional shutdown

`process.exit(1)` in a module that gets `require()`'d (like firebaseAdmin.js or seed.js) kills the entire server process, not just the failing module. The only acceptable places for `process.exit` are:

- `server.js` shutdown handlers (SIGTERM/SIGINT)
- `server.js` startup validation for truly unrecoverable config (missing JWT_SECRET)
- Top-level CLI scripts that are never `require()`'d by the server

For everything else, throw an Error or log a warning and continue.

## Backend: seed must run as a child process, not require()

`seed.js` calls `prisma.$disconnect()` at the end. If you `require('./prisma/seed')` from server.js, it disconnects the shared Prisma client and breaks all subsequent DB queries. Always spawn seed as a child process:

```js
const { spawn } = require('child_process');
spawn(process.execPath, [seedPath], { stdio: 'inherit', env: process.env });
```

## Backend: parse all JSON fields before sending to frontend

Business fields stored as JSON strings in the DB (`peakHours`, `revenueSeries`, `ordersSeries`, `customerGrowth`, `topMovers`, `spendingMix`, `goals`) must be parsed via `parseBizJsonFields()` in `businessController.js` before the response is sent. Never send raw JSON strings to the frontend — the frontend expects parsed arrays/objects.

## Backend: DB-dependent startup tasks must wait for DB readiness

Never run DB queries immediately on server start. Use `waitForDb()` in server.js which retries with exponential backoff. This prevents ECONNREFUSED errors during Render cold starts where the DB takes a few seconds to accept connections.

`waitForDb()` probes with `$queryRawUnsafe('SELECT 1')` — not `$connect()`. `$connect()` only establishes the TCP socket; the connection pool may still refuse queries immediately after. A real query confirms the pool is actually ready.

The Prisma client is initialized with `log: []` in production so probe failures don't spam `prisma:error` to the console. Errors from the probe are caught silently and retried.

## Frontend: always default arrays before calling array methods

Any value that comes from an API response, a prop, or state that was initialized from an API response must be defaulted before calling `.map()`, `.filter()`, `.reduce()`, `.at()`, etc.

```jsx
// Wrong — crashes if customerGrowth is undefined
customerGrowth.at(-1)?.v

// Right
(customerGrowth || []).at(-1)?.v
```

State initialized from props is safe at init time but can become undefined if a parent re-renders with a different shape. Always use `|| []` or `|| {}` as fallbacks.

## Frontend: buildDemoData must return all series the caller destructures

If `pages.jsx` or `overview.jsx` destructures `{ series, customerSeries, metrics }` from `buildDemoData()`, then `buildDemoData()` must return all three. Missing return values silently become `undefined` and crash on first array method call. When adding a new series to either caller, add it to `buildDemoData`'s return value at the same time.

## Frontend: period keys must be consistent

The overview period picker uses `['7D', '1M', '3M', '6M', '1Y']`. The `PERIOD_DAYS` map in `mockData.js` must have entries for all of these. Currently `'7D'` and `'1W'` both map to 7 days. Do not add new period options to the UI without adding them to `PERIOD_DAYS`.

## Frontend: data.jsx and seed.js must stay in sync

The `location` field in `data.jsx` (frontend demo data) and `seed.js` (backend DB seed) must match for each business. The environmental context cards in `overview.jsx` reference specific cities — if you change a location in one place, change it in all three.

Current locations:
- baker: Pune, Maharashtra
- retail: Surat, Gujarat
- pharmacy: Ahmedabad, Gujarat
- cafe: Bengaluru, Karnataka
- trade: Mumbai, Maharashtra
- service: Manali, Himachal Pradesh
