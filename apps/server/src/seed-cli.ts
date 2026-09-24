import { settings } from './config.js';
import { Store } from './store.js';
const store = new Store(settings.storage, settings.dataFile);
await store.init(process.env.MONGODB_URI);
await store.seedCatalog();
console.log(
  'Catalog ready. Each demo login creates an isolated seeded learner. Existing progress was preserved.',
);
await store.close();
