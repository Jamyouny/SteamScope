import { ProxyAgent } from 'undici';

let proxy: { url: string; agent: ProxyAgent } | undefined;

// Explicit server-only proxy configuration. The browser never receives this URL.
export function upstreamFetch(url: URL, init: RequestInit = {}) {
  const configured = process.env.STEAM_PROXY_URL?.trim();
  if (!configured) return fetch(url, init);
  const parsed = new URL(configured);
  if (!['http:', 'https:'].includes(parsed.protocol))
    throw new Error('INVALID_PROXY_URL');
  if (proxy?.url !== configured) {
    if (proxy) void proxy.agent.close().catch(() => {});
    proxy = { url: configured, agent: new ProxyAgent(configured) };
  }
  const options: RequestInit & { dispatcher: ProxyAgent } = {
    ...init,
    dispatcher: proxy.agent,
  };
  return fetch(url, options);
}

export async function closeProxyAgent() {
  const current = proxy;
  proxy = undefined;
  await current?.agent.close();
}
