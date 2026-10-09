import { ApiError, getLibrary, getMetadata } from './steam';
import { InputError } from '../shared/input';
export async function handleApi(url: URL, method: string) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  };
  try {
    if (method !== 'GET') throw new ApiError('METHOD_NOT_ALLOWED', 405);
    if (url.pathname.endsWith('/library')) {
      const input = url.searchParams.get('input');
      if (!input || input.length > 250) throw new InputError('INVALID_INPUT');
      return { status: 200, headers, body: await getLibrary(input) };
    }
    if (url.pathname.endsWith('/metadata')) {
      const raw = url.searchParams.get('ids') ?? '';
      if (!/^\d+(,\d+){0,2}$/.test(raw)) throw new InputError('INVALID_INPUT');
      const ids = [...new Set(raw.split(',').map(Number))];
      if (
        ids.some(
          (id) => !Number.isSafeInteger(id) || id <= 0 || id > 100_000_000,
        )
      )
        throw new InputError('INVALID_INPUT');
      return { status: 200, headers, body: await getMetadata(ids) };
    }
    throw new ApiError('NOT_FOUND', 404);
  } catch (e) {
    return {
      status:
        e instanceof InputError ? 400 : e instanceof ApiError ? e.status : 500,
      headers,
      body: {
        error:
          e instanceof InputError
            ? 'INVALID_INPUT'
            : e instanceof ApiError
              ? e.code
              : 'INTERNAL_ERROR',
      },
    };
  }
}
