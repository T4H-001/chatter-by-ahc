import { config } from '../lib/config.js';

export default function handler(req, res) {
  res.json({ status: 'ok', app: 'chatter-by-ahc', tenant: config.tenantKey, ts: new Date().toISOString() });
}
