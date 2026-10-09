import { parseSteamInput } from '../shared/input';
import { upstreamFetch } from './http';
import type { Game, Library, Player } from '../shared/types';
export class ApiError extends Error {
  constructor(
    public code: string,
    public status = 502,
  ) {
    super(code);
  }
}
const TTL = 5 * 60_000;
const cache = new Map<string, { value: Library; expires: number }>();
const inflight = new Map<string, Promise<Library>>();
const metadataCache = new Map<number, { genres: string[]; expires: number }>();
const metadataInflight = new Map<number, Promise<string[]>>();
const requests: number[] = [];
export function clearCaches() {
  cache.clear();
  inflight.clear();
  metadataCache.clear();
  metadataInflight.clear();
  requests.length = 0;
}
export async function jsonFetch<T>(url: URL): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await upstreamFetch(url, { signal: controller.signal });
    if (res.status === 401 || res.status === 403)
      throw new ApiError('API_AUTH_FAILED', 503);
    if (!res.ok)
      throw new ApiError(
        res.status === 429 ? 'UPSTREAM_RATE_LIMIT' : 'STEAM_UNAVAILABLE',
        res.status === 429 ? 429 : 502,
      );
    return (await res.json()) as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(
      controller.signal.aborted ? 'TIMEOUT' : 'STEAM_UNAVAILABLE',
    );
  } finally {
    clearTimeout(timer);
  }
}
async function steam<T>(
  path: string,
  params: Record<string, string>,
  key: string,
) {
  const now = Date.now();
  while (requests.length && requests[0] < now - 60_000) requests.shift();
  if (requests.length >= 80) throw new ApiError('RATE_LIMIT', 429);
  requests.push(now);
  const url = new URL(`https://api.steampowered.com/${path}`);
  url.searchParams.set('key', key);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return jsonFetch<T>(url);
}
function normalizeGames(value: unknown): Game[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (g) =>
        g &&
        Number.isSafeInteger(g.appid) &&
        typeof g.name === 'string' &&
        Number.isFinite(g.playtime_forever) &&
        g.playtime_forever >= 0,
    )
    .map((g) => ({
      appid: g.appid,
      name: g.name,
      playtime_forever: g.playtime_forever,
      ...(Number.isFinite(g.playtime_2weeks)
        ? { playtime_2weeks: g.playtime_2weeks }
        : {}),
    }));
}
async function loadLibrary(id: string, key: string): Promise<Library> {
  const summary = await steam<{ response: { players: Player[] } }>(
    'ISteamUser/GetPlayerSummaries/v0002/',
    { steamids: id },
    key,
  );
  const player = summary.response?.players?.[0];
  if (!player) throw new ApiError('PLAYER_NOT_FOUND', 404);
  if (player.communityvisibilitystate !== 3)
    throw new ApiError('PRIVATE_PROFILE', 403);
  const [owned, recent, level] = await Promise.allSettled([
    steam<{ response: { game_count?: number; games?: Game[] } }>(
      'IPlayerService/GetOwnedGames/v0001/',
      { steamid: id, include_appinfo: '1', include_played_free_games: '1' },
      key,
    ),
    steam<{ response: { total_count?: number; games?: Game[] } }>(
      'IPlayerService/GetRecentlyPlayedGames/v0001/',
      { steamid: id },
      key,
    ),
    steam<{ response: { player_level?: number } }>(
      'IPlayerService/GetSteamLevel/v0001/',
      { steamid: id },
      key,
    ),
  ]);
  if (owned.status === 'rejected') throw owned.reason;
  if (typeof owned.value.response?.game_count !== 'number')
    throw new ApiError('PRIVATE_GAMES', 403);
  const warnings: string[] = [];
  if (
    recent.status === 'rejected' ||
    typeof recent.value.response?.total_count !== 'number'
  )
    warnings.push('RECENT_UNAVAILABLE');
  if (
    level.status === 'rejected' ||
    typeof level.value.response?.player_level !== 'number'
  )
    warnings.push('LEVEL_UNAVAILABLE');
  const games = normalizeGames(owned.value.response.games);
  if (owned.value.response.game_count > 0 && !games.length)
    throw new ApiError('PLAYTIME_UNAVAILABLE', 403);
  if (games.length && games.every((g) => g.playtime_forever === 0))
    warnings.push('NO_RECORDED_PLAYTIME');
  if (games.length !== owned.value.response.game_count)
    warnings.push('PARTIAL_LIBRARY');
  return {
    player: {
      steamid: player.steamid,
      personaname: player.personaname,
      avatarfull: player.avatarfull,
      profileurl: player.profileurl,
      communityvisibilitystate: player.communityvisibilitystate,
    },
    games,
    recent:
      recent.status === 'fulfilled'
        ? normalizeGames(recent.value.response.games)
        : [],
    level:
      level.status === 'fulfilled' &&
      typeof level.value.response.player_level === 'number'
        ? level.value.response.player_level
        : null,
    demo: false,
    fetchedAt: new Date().toISOString(),
    warnings,
  };
}
export async function getLibrary(input: string): Promise<Library> {
  const parsed = parseSteamInput(input);
  const key = process.env.STEAM_API_KEY;
  if (!key) throw new ApiError('NOT_CONFIGURED', 503);
  let id = parsed.id;
  if (!id) {
    const resolved = await steam<{
      response: { success: number; steamid?: string };
    }>(
      'ISteamUser/ResolveVanityURL/v0001/',
      { vanityurl: parsed.vanity! },
      key,
    );
    if (resolved.response?.success !== 1 || !resolved.response.steamid)
      throw new ApiError('PLAYER_NOT_FOUND', 404);
    id = resolved.response.steamid;
  }
  const cached = cache.get(id);
  if (cached && cached.expires > Date.now()) return cached.value;
  if (inflight.has(id)) return inflight.get(id)!;
  const pending = loadLibrary(id, key)
    .then((value) => {
      if (cache.size >= 200) cache.delete(cache.keys().next().value!);
      cache.set(id!, { value, expires: Date.now() + TTL });
      return value;
    })
    .finally(() => inflight.delete(id!));
  inflight.set(id, pending);
  return pending;
}
export async function getMetadata(ids: number[]) {
  const now = Date.now();
  while (requests.length && requests[0] < now - 60_000) requests.shift();
  if (requests.length + ids.length > 80) throw new ApiError('RATE_LIMIT', 429);
  // A small, explicit batch. Store categories are supplemental, not Web API data.
  const result: Record<number, string[]> = {};
  for (const id of ids) {
    const cached = metadataCache.get(id);
    if (cached && cached.expires > Date.now()) {
      result[id] = cached.genres;
      continue;
    }
    let pending = metadataInflight.get(id);
    if (!pending) {
      requests.push(Date.now());
      pending = (async () => {
        const url = new URL('https://store.steampowered.com/api/appdetails');
        url.searchParams.set('appids', String(id));
        url.searchParams.set('filters', 'genres');
        url.searchParams.set('l', 'english');
        try {
          const data = await jsonFetch<
            Record<
              string,
              {
                success: boolean;
                data?: { genres?: { description: string }[] };
              }
            >
          >(url);
          const genres = data[id]?.success
            ? (data[id].data?.genres
                ?.map((g) => g.description)
                .filter((g) => typeof g === 'string') ?? [])
            : [];
          if (metadataCache.size >= 1000)
            metadataCache.delete(metadataCache.keys().next().value!);
          metadataCache.set(id, {
            genres,
            expires: Date.now() + 24 * 60 * 60_000,
          });
          return genres;
        } catch {
          return [];
        }
      })().finally(() => metadataInflight.delete(id));
      metadataInflight.set(id, pending);
    }
    result[id] = await pending;
  }
  return result;
}
