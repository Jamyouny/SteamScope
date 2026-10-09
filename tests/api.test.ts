import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import {
  clearCaches,
  getLibrary,
  getMetadata,
  jsonFetch,
} from '../server/steam';
import { handleApi } from '../server/handler';
import { avatarResponse } from '../server/avatar';
const id = '76561198000000000';
function mockSteam(
  options: {
    private?: boolean;
    hidden?: boolean;
    empty?: boolean;
    partial?: boolean;
    recentFail?: boolean;
  } = {},
) {
  return vi.fn(async (input: URL) => {
    const path = input.pathname;
    if (path.includes('Summaries'))
      return Response.json({
        response: {
          players: [
            {
              steamid: id,
              personaname: 'Real Player',
              avatarfull:
                'https://avatars.steamstatic.com/' +
                'a'.repeat(40) +
                '_full.jpg',
              profileurl: `https://steamcommunity.com/profiles/${id}/`,
              communityvisibilitystate: options.private ? 1 : 3,
            },
          ],
        },
      });
    if (path.includes('ResolveVanity'))
      return Response.json({ response: { success: 1, steamid: id } });
    if (path.includes('OwnedGames'))
      return Response.json({
        response: options.hidden
          ? {}
          : {
              game_count: options.empty ? 0 : options.partial ? 2 : 1,
              games: options.empty
                ? undefined
                : [
                    {
                      appid: 730,
                      name: 'Counter-Strike 2',
                      playtime_forever: 120,
                    },
                  ],
            },
      });
    if (path.includes('Recently'))
      return options.recentFail
        ? new Response('', { status: 429 })
        : Response.json({ response: { total_count: 0, games: [] } });
    return Response.json({ response: { player_level: 12 } });
  });
}
beforeEach(() => {
  clearCaches();
  vi.stubEnv('STEAM_API_KEY', 'test-key-never-real');
  vi.stubEnv('STEAM_PROXY_URL', '');
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});
describe('Steam API boundary', () => {
  it('returns explicit missing key without demo fallback', async () => {
    vi.stubEnv('STEAM_API_KEY', '');
    const result = await handleApi(
      new URL(`http://localhost/library?input=${id}`),
      'GET',
    );
    expect(result.status).toBe(503);
    expect(result.body).toEqual({ error: 'NOT_CONFIGURED' });
  });
  it('keeps credentials server-side and caches duplicate requests', async () => {
    const mock = mockSteam();
    vi.stubGlobal('fetch', mock);
    const first = await getLibrary(id);
    const second = await getLibrary(id);
    expect(first.demo).toBe(false);
    expect(first.games[0].playtime_forever).toBe(120);
    expect(second).toBe(first);
    expect(mock).toHaveBeenCalledTimes(4);
    expect(JSON.stringify(first)).not.toContain('test-key');
  });
  it('coalesces concurrent lookups', async () => {
    const mock = mockSteam();
    vi.stubGlobal('fetch', mock);
    await Promise.all([getLibrary(id), getLibrary(id)]);
    expect(mock).toHaveBeenCalledTimes(4);
  });
  it('resolves custom URLs using official API', async () => {
    const mock = mockSteam();
    vi.stubGlobal('fetch', mock);
    expect(
      (await getLibrary('https://steamcommunity.com/id/alex')).player.steamid,
    ).toBe(id);
    expect(mock).toHaveBeenCalledTimes(5);
  });
  it('detects private profile and private game details', async () => {
    vi.stubGlobal('fetch', mockSteam({ private: true }));
    await expect(getLibrary(id)).rejects.toMatchObject({
      code: 'PRIVATE_PROFILE',
      status: 403,
    });
    clearCaches();
    vi.stubGlobal('fetch', mockSteam({ hidden: true }));
    await expect(getLibrary(id)).rejects.toMatchObject({
      code: 'PRIVATE_GAMES',
      status: 403,
    });
  });
  it('accepts an explicitly empty library', async () => {
    vi.stubGlobal('fetch', mockSteam({ empty: true }));
    expect((await getLibrary(id)).games).toEqual([]);
  });
  it('preserves owned data when optional recent API fails', async () => {
    vi.stubGlobal('fetch', mockSteam({ recentFail: true, partial: true }));
    const data = await getLibrary(id);
    expect(data.warnings).toEqual(['RECENT_UNAVAILABLE', 'PARTIAL_LIBRARY']);
    expect(data.games).toHaveLength(1);
  });
  it('identifies rejected API credentials without exposing them', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 403 })),
    );
    const result = await handleApi(
      new URL(`http://localhost/library?input=${id}`),
      'GET',
    );
    expect(result.status).toBe(503);
    expect(result.body).toEqual({ error: 'API_AUTH_FAILED' });
  });
  it('converts upstream failures into safe errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 429 })),
    );
    const response = await handleApi(
      new URL(`http://localhost/library?input=${id}`),
      'GET',
    );
    expect(response.status).toBe(429);
    expect(response.body).toEqual({ error: 'UPSTREAM_RATE_LIMIT' });
  });
  it('aborts slow API requests', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      (_url: URL, { signal }: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) =>
          signal.addEventListener('abort', () => reject(new Error('abort'))),
        ),
    );
    const pending = expect(
      jsonFetch(new URL('https://api.steampowered.com/')),
    ).rejects.toMatchObject({ code: 'TIMEOUT' });
    await vi.advanceTimersByTimeAsync(12_001);
    await pending;
  });
  it('reports inaccessible playtime instead of making up zero statistics', async () => {
    const base = mockSteam();
    vi.stubGlobal('fetch', async (url: URL) =>
      url.pathname.includes('OwnedGames')
        ? Response.json({
            response: {
              game_count: 1,
              games: [{ appid: 730, name: 'Counter-Strike 2' }],
            },
          })
        : base(url),
    );
    await expect(getLibrary(id)).rejects.toMatchObject({
      code: 'PLAYTIME_UNAVAILABLE',
      status: 403,
    });
  });
  it('warns when every returned playtime is zero', async () => {
    const base = mockSteam();
    vi.stubGlobal('fetch', async (url: URL) =>
      url.pathname.includes('OwnedGames')
        ? Response.json({
            response: {
              game_count: 1,
              games: [
                { appid: 730, name: 'Counter-Strike 2', playtime_forever: 0 },
              ],
            },
          })
        : base(url),
    );
    expect((await getLibrary(id)).warnings).toContain('NO_RECORDED_PLAYTIME');
  });
  it('expires the library cache after five minutes', async () => {
    vi.useFakeTimers();
    const mock = mockSteam();
    vi.stubGlobal('fetch', mock);
    await getLibrary(id);
    await vi.advanceTimersByTimeAsync(300_001);
    await getLibrary(id);
    expect(mock).toHaveBeenCalledTimes(8);
  });
  it('loads authentic metadata and reuses its cache', async () => {
    const mock = vi.fn(async () =>
      Response.json({
        '730': { success: true, data: { genres: [{ description: 'Action' }] } },
      }),
    );
    vi.stubGlobal('fetch', mock);
    expect(await getMetadata([730])).toEqual({ '730': ['Action'] });
    await getMetadata([730]);
    expect(mock).toHaveBeenCalledTimes(1);
  });
  it('keeps missing metadata unknown', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network');
      }),
    );
    expect(await getMetadata([730])).toEqual({ '730': [] });
  });
  it('applies the warm-instance upstream rate guard', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({})),
    );
    await getMetadata(Array.from({ length: 80 }, (_, i) => i + 1));
    await expect(getMetadata([1001])).rejects.toMatchObject({
      code: 'RATE_LIMIT',
      status: 429,
    });
  });
  it('returns a real avatar image with safe response headers', async () => {
    const source =
      'https://avatars.steamstatic.com/' + 'a'.repeat(40) + '_full.jpg';
    const mock = vi.fn(
      async () =>
        new Response(new Uint8Array([255, 216, 255]), {
          headers: { 'content-type': 'image/jpeg' },
        }),
    );
    vi.stubGlobal('fetch', mock);
    const response = await avatarResponse(
      new URL(`http://localhost/avatar?url=${encodeURIComponent(source)}`),
      'GET',
    );
    expect(response.status).toBe(200);
    expect(response.headers['Content-Type']).toBe('image/jpeg');
    expect(response.body.length).toBe(3);
    expect(mock.mock.calls).toHaveLength(1);
  });
  it('retries the identical hash on the official Akamai avatar host after a network failure', async () => {
    const path = '/' + 'a'.repeat(40) + '_full.jpg';
    const mock = vi
      .fn()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(
        new Response(new Uint8Array([255, 216, 255]), {
          headers: { 'content-type': 'image/jpeg' },
        }),
      );
    vi.stubGlobal('fetch', mock);
    const result = await avatarResponse(
      new URL(
        `http://localhost/avatar?url=${encodeURIComponent('https://avatars.steamstatic.com' + path)}`,
      ),
      'GET',
    );
    expect(result.status).toBe(200);
    expect(mock.mock.calls[1][0].href).toBe(
      'https://avatars.akamai.steamstatic.com' + path,
    );
    expect(mock.mock.calls[1][1].redirect).toBe('error');
    expect(mock.mock.calls[0][1].signal).toBe(mock.mock.calls[1][1].signal);
  });
  it('stops after one alternate CDN attempt and never follows its redirect', async () => {
    const mock = vi
      .fn()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(
        new Response(null, {
          status: 302,
          headers: { location: 'https://evil.com/avatar.jpg' },
        }),
      );
    vi.stubGlobal('fetch', mock);
    const source =
      'https://avatars.steamstatic.com/' + 'a'.repeat(40) + '_full.jpg';
    const result = await avatarResponse(
      new URL(`http://localhost/avatar?url=${encodeURIComponent(source)}`),
      'GET',
    );
    expect(result.status).toBe(502);
    expect(mock).toHaveBeenCalledTimes(2);
  });
  it('rejects mutation methods and oversized metadata batches', async () => {
    expect(
      (await handleApi(new URL('http://localhost/library'), 'POST')).status,
    ).toBe(405);
    expect(
      (await handleApi(new URL('http://localhost/metadata?ids=1,2,3,4'), 'GET'))
        .status,
    ).toBe(400);
  });
  it('rejects untrusted avatar URLs before network access', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    for (const url of [
      'http://127.0.0.1/a.jpg',
      'https://evil.com/a.jpg',
      'https://avatars.steamstatic.com/redirect?url=foo',
    ])
      expect(
        (
          await avatarResponse(
            new URL(`http://localhost/avatar?url=${encodeURIComponent(url)}`),
            'GET',
          )
        ).status,
      ).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });
});
