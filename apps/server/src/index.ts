import { settings, root } from './config.js';
import { Store } from './store.js';
import { createApp } from './app.js';
import express from 'express';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
const store = new Store(settings.storage, settings.dataFile);
await store.init(process.env.MONGODB_URI);
const app = createApp(store, settings);
const web = resolve(root, 'apps/web/dist');
if (existsSync(web)) {
  app.use(express.static(web));
  app.get('/{*path}', (_req, res) => res.sendFile(resolve(web, 'index.html')));
}
const server = app.listen(settings.port, settings.host, () =>
  console.log(
    `BharatSkill API http://${settings.host}:${settings.port} · ${settings.storage} · ${settings.payment}`,
  ),
);
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () =>
    server.close(async () => {
      await store.close();
      process.exit(0);
    }),
  );
