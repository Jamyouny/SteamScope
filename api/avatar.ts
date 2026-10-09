import type { VercelRequest, VercelResponse } from '@vercel/node';
import { avatarResponse } from '../server/avatar';
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const result = await avatarResponse(
    new URL(req.url ?? '/', 'http://localhost'),
    req.method ?? 'GET',
  );
  for (const [key, value] of Object.entries(result.headers))
    res.setHeader(key, value);
  res.status(result.status).send(result.body);
}
