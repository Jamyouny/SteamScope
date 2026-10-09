import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleApi } from '../server/handler';
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const result = await handleApi(
    new URL(req.url ?? '/', 'http://localhost'),
    req.method ?? 'GET',
  );
  for (const [key, value] of Object.entries(result.headers))
    res.setHeader(key, value);
  res.status(result.status).json(result.body);
}
