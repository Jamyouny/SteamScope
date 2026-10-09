export class InputError extends Error {}
export function parseSteamInput(raw: string): { id?: string; vanity?: string } {
  const input = raw.trim();
  const validId = (id: string) => /^7656119\d{10}$/.test(id);
  if (validId(input)) return { id: input };
  if (/^\d+$/.test(input)) throw new InputError('INVALID_INPUT');
  if (/^(https?:\/\/)?steamcommunity\.com\//i.test(input)) {
    let url: URL;
    try {
      url = new URL(/^https?:/i.test(input) ? input : `https://${input}`);
    } catch {
      throw new InputError('INVALID_INPUT');
    }
    if (
      url.hostname !== 'steamcommunity.com' ||
      url.port ||
      url.username ||
      url.password
    )
      throw new InputError('INVALID_INPUT');
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length !== 2) throw new InputError('INVALID_INPUT');
    if (parts[0] === 'profiles' && validId(parts[1])) return { id: parts[1] };
    if (parts[0] === 'id' && /^[a-zA-Z0-9_-]{1,64}$/.test(parts[1]))
      return { vanity: parts[1] };
  }
  throw new InputError('INVALID_INPUT');
}
