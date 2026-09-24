import type { Request, Response, Express } from 'express';
import { createApp } from '../apps/server/dist/apps/server/src/app.js';
import { Store } from '../apps/server/dist/apps/server/src/store.js';
import { settings } from '../apps/server/dist/apps/server/src/config.js';
let ready: Promise<Express> | undefined;
function initialize() {
  if (!ready) ready = (async () => {
    if (settings.storage !== 'mongo' || !process.env.MONGODB_URI) throw Error('Vercel requires MongoDB storage');
    if (settings.demo || settings.payment !== 'disabled') throw Error('Public preview requires demo off and payments disabled');
    if (!settings.origin.startsWith('https://')) throw Error('Public preview requires an HTTPS origin');
    const store = new Store('mongo');
    await store.init(process.env.MONGODB_URI);
    // Vercel overwrites X-Forwarded-For with the client address at its edge.
    return createApp(store, { ...settings, trustProxy: 1 });
  })().catch(error => { ready = undefined; throw error; });
  return ready;
}
export default async function handler(req: Request, res: Response) {
  try {
    // Express uses X-Forwarded-For; avoid conflicting RFC Forwarded input.
    delete req.headers.forwarded;
    const app = await initialize(); app(req, res);
  }
  catch { res.status(503).json({error:{message:'The service is not configured yet. Please try again later.'}}); }
}
