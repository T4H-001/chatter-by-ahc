import crypto from 'crypto';
import { config } from './config.js';
import { httpJson } from './http.js';

const BRIDGE = config.bridgeUrl;
const API_KEY = config.bridgeApiKey;

function bridge(fn, payload) {
  return httpJson(BRIDGE, {
    method: 'POST',
    headers: { 'x-api-key': API_KEY },
    body: JSON.stringify({ fn, payload }),
  });
}

function inferFunctionName(route) {
  const map = {
    bridge: config.bridgeDefaultFunction,
    gmail_drafts: 'troy-email-send',
    supabase: 'troy-sql-executor',
  };
  return route.function_name || map[route.connector_key] || config.bridgeDefaultFunction;
}

export async function invokeBridge(route, session = {}) {
  if (!BRIDGE || !API_KEY) return { skipped: true, reason: 'bridge_not_configured', route };
  return bridge(inferFunctionName(route), {
    route,
    session,
    metadata: {
      request_id: crypto.randomUUID(),
      source: 'chatter-by-ahc',
      timestamp_utc: new Date().toISOString(),
      auth_context: 'service',
    },
  });
}

// Pull a secret value from cap_secrets via bridge
export async function getSecret(key) {
  if (!BRIDGE || !API_KEY) return null;
  const result = await bridge('troy-sql-executor', {
    sql: `SELECT value FROM cap_secrets WHERE key = '${key}' AND is_deprecated = false LIMIT 1`,
  });
  return result?.rows?.[0]?.value || null;
}
