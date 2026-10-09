# Data contracts and analysis / 数据说明

## Official Steam Web API

- `ISteamUser/ResolveVanityURL/v0001`: custom profile slug → SteamID64.
- `ISteamUser/GetPlayerSummaries/v0002`: avatar, nickname, profile URL and visibility.
- `IPlayerService/GetOwnedGames/v0001`: `include_appinfo=1`, `include_played_free_games=1`.
- `IPlayerService/GetRecentlyPlayedGames/v0001`: two-week records; optional endpoint.
- `IPlayerService/GetSteamLevel/v0001`: level; optional endpoint.

Keys are added only by server code. No upstream response logs or credentials are sent to the browser. Every upstream JSON request has a 12-second timeout. Browser library requests have a 50-second timeout. Player summary lookup precedes parallel game/recent/level calls. Missing `game_count` is treated as unavailable/private game details; `game_count=0` is a readable empty library. Partial entries are explicitly flagged.

Sources: [IPlayerService](https://partner.steamgames.com/doc/webapi/IPlayerService), [ISteamUser](https://partner.steamgames.com/doc/webapi/ISteamUser). Endpoint names and input flags were checked against these pages during development.

## Supplemental genres

`https://store.steampowered.com/api/appdetails?appids=APPID&filters=genres&l=english`

This public Steam Store JSON interface was checked with app 730. It is not an officially documented Web API contract. Do not scrape store HTML. Up to 3 app IDs per server function request; no arbitrary upstream URL. On-demand UI loading stops after at most 60 games. Returned descriptions are counted as labels, deduplicated within each game. Metadata failure means unknown, never invented.

Genres reflect the known subset and game counts, not playtime-weighted preferences. Show ≥60% coverage and at least `min(10, library size)` known games; hide distribution otherwise. Demo labels are fixtures.

## Computation

`hours = playtime_forever / 60`; displayed hours rounded to one decimal, calculations use unrounded values. Share-card total hours are rounded to the nearest integer and labeled as hours. Median includes every fetched game, including zeros. Top 3 concentration is the fraction of total minutes spent in the first three sorted games. Empty sums, averages, medians, percentages and concentration are zero. No most-played title is chosen without nonzero playtime.

Bins: zero, >0 and <1, ≥1 and <10, ≥10 and <50, ≥50 and ≤100, >100 hours. Short pool: <2 hours including zero. Range pool: inclusive lower/upper hours. Random selection is uniform over eligible entries with `Math.random` (not a security mechanism).

## Ordered portraits

First matching rule wins, in this order. These titles are playful labels, not psychological assessments.

1. Collector / 收藏家: ≥30 games and <40% played.
2. Loyalist / 专一型: ≥100 total hours and top-three share ≥65%.
3. Veteran / 硬核: ≥5 games over 100 hours.
4. Explorer / 探索型: ≥30 games, ≥60% played and top-three share <50%.
5. Casual / 休闲: <100 total hours.
6. Free Spirit / 自在型: fallback.

## Privacy, caching and deployment limits

Personal profiles and game details are separate privacy gates. “Always keep my total playtime private” can prevent usable playtime data. Zero recorded time is not proof of a never-launched game. Total games means entries fetched from Steam, including played free games, not every license or DLC on an account.

No database or authentication. Preferences only in localStorage. Library cache and duplicate-call coalescing exist in server memory; cold starts or different function instances do not share them. Caches are bounded. Do not claim distributed rate limiting. Use platform controls for large deployments and comply with Steam's terms.

Safe error codes identify input, privacy, upstream rate limits, timeout, missing configuration and partial optional data. Raw upstream URLs containing keys are not logged or returned. Real requests never silently return fixtures.

Avatar exports use a separate bounded image proxy with exact CDN allowlisting, HTTPS only, hash-path validation, redirect rejection and 2MB response limit. If the default or Cloudflare avatar host fails, it retries the identical hash path once on Steam’s official Akamai host within the same 12-second deadline. Share generation fails explicitly if a real avatar cannot be loaded.
