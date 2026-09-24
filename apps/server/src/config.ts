import { config } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
// Works in both tsx development and compiled monorepo output.
const base = dirname(fileURLToPath(import.meta.url));
export const root = resolve(
  base,
  base.includes(`${String.raw`dist`}`) ? '../../../../../..' : '../../..',
);
config({ path: resolve(root, '.env'), quiet: true });
export const settings = {
  adminEmails: (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
  trustProxy: Number(process.env.TRUST_PROXY_HOPS || 0),
  port: Number(process.env.PORT || 4000),
  host: process.env.HOST || '127.0.0.1',
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  demo: process.env.DEMO_MODE !== 'false',
  storage: process.env.STORAGE || 'file',
  payment: process.env.PAYMENT_MODE || 'sandbox',
  secret: process.env.JWT_SECRET || 'local-demo-only-change-before-deployment',
  dataFile: resolve(root, process.env.DATA_FILE || 'data/nexus.json'),
};
if (!['file', 'mongo'].includes(settings.storage)) throw Error('STORAGE must be file or mongo');
if (!['sandbox', 'testnet', 'disabled'].includes(settings.payment))
  throw Error('PAYMENT_MODE must be sandbox, testnet or disabled');
if (!settings.demo && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32))
  throw Error('Set JWT_SECRET to at least 32 random characters');
if (!settings.demo && settings.payment === 'sandbox')
  throw Error('Sandbox payments require DEMO_MODE=true');

if (!Number.isInteger(settings.trustProxy) || settings.trustProxy < 0 || settings.trustProxy > 5)
  throw Error('TRUST_PROXY_HOPS must be an integer from 0 to 5');
