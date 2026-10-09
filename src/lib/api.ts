import type { Library } from '../../shared/types';
export async function request<T>(path: string, timeout = 50_000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(path, { signal: controller.signal });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? 'STEAM_UNAVAILABLE');
    return data as T;
  } catch (e) {
    if (controller.signal.aborted) throw new Error('TIMEOUT');
    if (e instanceof TypeError) throw new Error('NETWORK_ERROR');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
const cache = new Map<string, { value: Library; expires: number }>();
export async function fetchLibrary(input: string) {
  const cached = cache.get(input);
  if (cached && cached.expires > Date.now()) return cached.value;
  const value = await request<Library>(
    `/api/library?input=${encodeURIComponent(input)}`,
  );
  if (cache.size >= 20) cache.delete(cache.keys().next().value!);
  cache.set(input, { value, expires: Date.now() + 300_000 });
  return value;
}
