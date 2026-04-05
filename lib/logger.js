import { config } from './config.js';
const levels = ['error', 'warn', 'info', 'debug'];
const enabled = (l) => levels.indexOf(l) <= levels.indexOf(config.logLevel);
export function log(level, message, meta = {}) {
  if (!enabled(level)) return;
  console.log(JSON.stringify({ level, message, ...meta, ts: new Date().toISOString() }));
}
