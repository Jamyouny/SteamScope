import { ApiError } from './steam';
import { upstreamFetch } from './http';
// Only Steam avatar CDN hosts are accepted. Redirects and arbitrary targets are rejected.
const hosts = new Set([
  'avatars.steamstatic.com',
  'avatars.akamai.steamstatic.com',
  'avatars.cloudflare.steamstatic.com',
  'steamcdn-a.akamaihd.net',
]);
export async function avatarResponse(url: URL, method: string) {
  try {
    if (method !== 'GET') throw new ApiError('METHOD_NOT_ALLOWED', 405);
    const raw = url.searchParams.get('url') ?? '';
    let source: URL;
    try {
      source = new URL(raw);
    } catch {
      throw new ApiError('INVALID_INPUT', 400);
    }
    if (
      source.protocol !== 'https:' ||
      !hosts.has(source.hostname) ||
      source.port ||
      source.username ||
      source.password ||
      !/^\/(?:steamcommunity\/public\/images\/avatars\/[a-f0-9]{2}\/)?[a-f0-9]{40}(?:_full|_medium)?\.(jpg|png)$/.test(
        source.pathname,
      ) ||
      source.search
    )
      throw new ApiError('INVALID_INPUT', 400);
    const signal = AbortSignal.timeout(12_000);
    const load = async (target: URL) => {
      const response = await upstreamFetch(target, {
        redirect: 'error',
        signal,
      });
      const type = response.headers.get('content-type')?.split(';')[0];
      if (
        !response.ok ||
        !type ||
        !['image/jpeg', 'image/png'].includes(type)
      ) {
        await response.body?.cancel();
        throw new ApiError('AVATAR_UNAVAILABLE');
      }
      return { response, type };
    };
    let loaded;
    try {
      loaded = await load(source);
    } catch (error) {
      // These official avatar hosts serve the identical hash-addressed asset.
      // Retry once, preserving the path and shared deadline; never follow redirects.
      if (
        signal.aborted ||
        ![
          'avatars.steamstatic.com',
          'avatars.cloudflare.steamstatic.com',
        ].includes(source.hostname)
      )
        throw error;
      const alternate = new URL(source);
      alternate.hostname = 'avatars.akamai.steamstatic.com';
      loaded = await load(alternate);
    }
    const { response, type } = loaded;
    const chunks: Uint8Array[] = [];
    let length = 0;
    if (!response.body) throw new ApiError('AVATAR_UNAVAILABLE');
    const reader = response.body.getReader();
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 2_000_000) {
        await reader.cancel();
        throw new ApiError('AVATAR_TOO_LARGE', 413);
      }
      chunks.push(value);
    }
    return {
      status: 200,
      headers: {
        'Content-Type': type,
        'Cache-Control': 'public, max-age=86400',
        'X-Content-Type-Options': 'nosniff',
      },
      body: Buffer.concat(chunks),
    };
  } catch (e) {
    return {
      status: e instanceof ApiError ? e.status : 502,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
      body: Buffer.from(
        JSON.stringify({
          error: e instanceof ApiError ? e.code : 'AVATAR_UNAVAILABLE',
        }),
      ),
    };
  }
}
