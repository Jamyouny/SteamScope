<div align="center">

# ◉ SteamScope

**Your library. A whole new story.**

An open-source Steam library analyzer, player personality generator and backlog companion. No sign-in. No database.

[简体中文](README.md) · [MIT](LICENSE) · [Data & API notes](docs/DATA.md)

</div>

![Dashboard — clearly labeled demo data](docs/screenshots/dashboard.png)

[![CI](https://github.com/Jamyouny/SteamScope/actions/workflows/ci.yml/badge.svg)](https://github.com/Jamyouny/SteamScope/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Features

- Resolve SteamID64, profile URLs and vanity profile URLs with the official Steam Web API.
- Expandable lookup guide for copying profile URLs from browsers or the Steam desktop app, looking up other players and recognizing SteamID64 formats.
- Total games, played/unplayed counts, total/mean/median hours, top 10, playtime distribution and two-week activity.
- Library exploration progress and a backlog report with normal and roast modes.
- Transparent, ordered personality rules: Collector, Loyalist, Veteran, Explorer, Casual and Free Spirit.
- Random picks from unplayed, under-two-hour, all-game and custom inclusive hour pools, with a slot animation.
- Avatar-inclusive 1200×720 PNG cards in Dark, Cyberpunk and Minimal styles; download and clipboard copy.
- Chinese/English, dark/light themes, reduced-motion support and localStorage preferences.
- A separate 50-game demo dataset, always labeled. Real API failures never fall back to demo data.
- Optional genre metadata with visible coverage and an explicit insufficient-data state.

## Screenshots

Screenshots live in [`docs/screenshots/`](docs/screenshots/): `home.png`, `dashboard.png`, `mobile.png`, and three exported `share-card-*.png` files. All use labeled demo fixtures.

![Exported demo card](docs/screenshots/share-card-dark.png)

## Stack

React 19, TypeScript, Vite, Tailwind CSS 4, Framer Motion, Recharts, Lucide React, Node.js, Vercel Serverless Functions, Vitest, ESLint and Prettier.

## Run locally

Install **Node.js 22+** and npm, then run from the repository root:

```bash
git clone https://github.com/Jamyouny/SteamScope.git
cd SteamScope
npm install
cp .env.example .env.local
npm run dev
```

Open the displayed URL (normally `http://127.0.0.1:5173`). Click **Try the demo** without an API key. The Vite development middleware runs the same server handlers as Vercel, so real lookups work under `npm run dev` too.

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run format:check
```

`npm run preview` serves static build output only. For API-backed testing use `npm run dev`, `npx vercel dev`, or a Vercel deployment.

## Configure Steam

Get a key from [Steam Web API Key](https://steamcommunity.com/dev/apikey), following Steam’s requirements. Set this in `.env.local` and restart the server:

```dotenv
STEAM_API_KEY=your_steam_api_key
```

The key is server-only. Never use a `VITE_` prefix or put credentials in frontend code, screenshots or issues. `.env*` is ignored except `.env.example`.

Official references: [ISteamUser](https://partner.steamgames.com/doc/webapi/ISteamUser), [IPlayerService](https://partner.steamgames.com/doc/webapi/IPlayerService), [API terms](https://steamcommunity.com/dev/apiterms).

## Optional local proxy

If your system proxy can reach Steam but Node.js requests time out, set a server-only HTTP CONNECT proxy in `.env.local`, then restart development:

```dotenv
STEAM_PROXY_URL=http://127.0.0.1:your_proxy_port
```

Only SteamScope’s server requests to the Steam API, Store metadata and avatar CDN use this proxy. System proxy settings are unchanged. The default is direct connections. Do not copy a local `127.0.0.1` proxy URL to Vercel; it would point to the deployment server itself. Vercel normally needs no proxy. Keep proxy credentials server-side.

## Deploy on Vercel

1. Push this folder as a GitHub repository root, excluding `.env.local` and `node_modules`.
2. Import the repository into Vercel and select **Vite**.
3. Use Node.js 22+, build command `npm run build` and output directory `dist`.
4. Add server-side `STEAM_API_KEY` for your desired environments.
5. Deploy. The three files under `api/` become serverless functions automatically.
6. Redeploy after environment changes and verify a public library returns real data.

You can also run `npx vercel` followed by `npx vercel --prod`. Demo works without a key. The included configuration handles SPA fallback and function duration.

A live-key Steam library query has been verified locally. The public repository is [Jamyouny/SteamScope](https://github.com/Jamyouny/SteamScope). Vercel deployment has not been executed. Set your own server environment variables when deploying.

## Structure

```text
api/                      Vercel function entry points (library, metadata, avatar)
server/                   Steam client, bounded caches, timeouts, safe errors
shared/                   Types, input parser and pure analysis rules
src/components/           Home, Dashboard, Discover, Share, Ui, ErrorBoundary
src/data/demo.json        Independent sample data
src/lib/                  API requests, preferences, Canvas card renderer
src/App.tsx               Navigation and application state
src/styles.css            Design tokens and responsive layouts
public/                   Favicon and fixture assets
tests/                    Calculations, parser, cache and API boundary tests
docs/                     Data notes, validation record and screenshots
.github/workflows/ci.yml   Install, typecheck, lint, test, build, format
```

## Data accuracy and limitations

All statistics use readable `GetOwnedGames` entries and convert minutes to hours. Average and median include zero-playtime games. Favorite means most-played, and is absent if every game has zero minutes. The bins are non-overlapping: `0`, `(0,1)`, `[1,10)`, `[10,50)`, `[50,100]`, `>100` hours. The backlog’s under-one-hour count excludes zero-time entries.

Steam does not return every licensed product. Played free games are requested with `include_played_free_games`; excluded or inaccessible entries cannot be counted. Zero minutes means **zero recorded by Steam**, not definitive proof a game was never launched.

Genres use Steam Store’s public JSON endpoint, a supplemental interface with **no official Web API stability guarantee**. Up to 60 games in API order are fetched on demand, three per call. Genre display requires ≥60% coverage and ≥10 classified games (all games for libraries smaller than 10). Counts describe the classified subset. Multi-genre counts can sum to more than 100%. Missing metadata is never fabricated.

Warm-instance library cache: 5 minutes, up to 200 players. Metadata cache: 24 hours, up to 1000 games. Browser memory cache: 5 minutes, up to 20 queries. Concurrent identical library calls are coalesced. Serverless cold starts reset these caches. The per-instance guard allows 80 upstream data calls/minute; it is not a distributed rate limiter. Use Vercel platform limits for large public deployments.

The avatar proxy permits only listed Steam HTTPS CDN hosts and hashed avatar paths, rejects redirects, limits data to 2MB, and times out. This allows Canvas exports without tainted cross-origin images. If the default or Cloudflare avatar host fails, the server retries the same hash path once on the official Akamai host within a shared 12-second deadline. An unavailable avatar produces an explicit card-generation error.

## FAQ

**No key configured?** Set `STEAM_API_KEY` server-side and restart/redeploy. Browsers must never receive it.

**Profile public but games inaccessible?** Make Game details public under Steam privacy settings and disable “Always keep my total playtime private.”

**No genre insights?** Load supplemental metadata. Coverage must be sufficient; the Store endpoint may be unavailable. Other analysis continues to work.

**Recent activity or level unavailable?** These endpoints are optional. Successful library data is preserved and a warning identifies unavailable fields.

**Image copy fails?** HTTPS or localhost, `ClipboardItem` support and clipboard permission are required. Download PNG instead.

**What is stored?** The server sends query inputs to Steam. Library data is cached briefly in browser/server memory. Only preferences use localStorage. No accounts, database or analytics tracking.

**GitHub Pages?** Static demo works, but real lookups need serverless APIs. Prefer Vercel. Subdirectory hosting requires adapting Vite `base` and asset paths.

## License and contributions

[MIT License](LICENSE). See [CONTRIBUTING.md](CONTRIBUTING.md). Run checks before a PR and never include keys or private player data.

Steam and game names, avatars and cover art belong to their respective owners. Those assets are not relicensed under MIT. SteamScope is not affiliated with Valve. Comply with Steam API terms when publishing.
