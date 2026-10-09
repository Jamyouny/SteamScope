import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { closeProxyAgent, upstreamFetch } from '../server/http';

beforeEach(() => {
  vi.stubEnv('STEAM_PROXY_URL', '');
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => Response.json({ ok: true })),
  );
});
afterEach(async () => {
  await closeProxyAgent();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('server HTTP proxy selection', () => {
  it('uses ordinary fetch when no server proxy is configured', async () => {
    const url = new URL('https://api.steampowered.com/');
    await upstreamFetch(url);
    expect(fetch).toHaveBeenCalledWith(url, {});
  });
  it('attaches a reusable proxy dispatcher while preserving abort and redirect options', async () => {
    vi.stubEnv('STEAM_PROXY_URL', 'http://127.0.0.1:7897');
    const url = new URL('https://api.steampowered.com/');
    const signal = new AbortController().signal;
    await upstreamFetch(url, { signal, redirect: 'error' });
    await upstreamFetch(url);
    const calls = vi.mocked(fetch).mock.calls;
    const first = calls[0][1] as RequestInit & { dispatcher: unknown };
    const second = calls[1][1] as RequestInit & { dispatcher: unknown };
    expect(first.signal).toBe(signal);
    expect(first.redirect).toBe('error');
    expect(first.dispatcher).toBeDefined();
    expect(second.dispatcher).toBe(first.dispatcher);
  });
  it('rejects unsupported proxy protocols before fetching', () => {
    vi.stubEnv('STEAM_PROXY_URL', 'file:///tmp/proxy');
    expect(() =>
      upstreamFetch(new URL('https://api.steampowered.com/')),
    ).toThrow('INVALID_PROXY_URL');
    expect(fetch).not.toHaveBeenCalled();
  });
});
