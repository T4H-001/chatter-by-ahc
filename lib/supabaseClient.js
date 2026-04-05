import { config } from './config.js';
import { httpJson } from './http.js';

function headers(prefer = 'return=representation') {
  return {
    apikey: config.supabaseServiceRoleKey,
    Authorization: `Bearer ${config.supabaseServiceRoleKey}`,
    Prefer: prefer,
    'Content-Type': 'application/json',
  };
}

function url(path, query = '') {
  return `${config.supabaseUrl}/rest/v1/${path}${query}`;
}

const configured = () => config.supabaseUrl && config.supabaseServiceRoleKey;

export async function getTenantIdByKey(tenantKey = config.tenantKey) {
  if (!configured()) return null;
  const rows = await httpJson(url(`chat_tenant?tenant_key=eq.${encodeURIComponent(tenantKey)}&select=id&limit=1`), { method: 'GET', headers: headers() });
  return rows?.[0]?.id || null;
}

export async function saveSession(session) {
  if (!configured()) return { skipped: true, reason: 'supabase_not_configured' };
  return httpJson(url('chat_translation_session'), { method: 'POST', headers: headers(), body: JSON.stringify(session) });
}

export async function saveOutput(output) {
  if (!configured()) return { skipped: true, reason: 'supabase_not_configured' };
  return httpJson(url('chat_translation_output'), { method: 'POST', headers: headers(), body: JSON.stringify(output) });
}

export async function saveRoute(route) {
  if (!configured()) return { skipped: true, reason: 'supabase_not_configured' };
  return httpJson(url('chat_translation_route'), { method: 'POST', headers: headers(), body: JSON.stringify(route) });
}

export async function saveEvent(event) {
  if (!configured()) return { skipped: true, reason: 'supabase_not_configured' };
  return httpJson(url('chat_event_log'), { method: 'POST', headers: headers(), body: JSON.stringify(event) });
}

export async function getDriveState(fileId) {
  if (!configured()) return null;
  const rows = await httpJson(url(`chat_drive_ingest_state?file_id=eq.${encodeURIComponent(fileId)}&select=*`), { method: 'GET', headers: headers() });
  return rows?.[0] || null;
}

export async function upsertDriveState(state) {
  if (!configured()) return { skipped: true, reason: 'supabase_not_configured' };
  return httpJson(url('chat_drive_ingest_state'), {
    method: 'POST',
    headers: headers('resolution=merge-duplicates,return=representation'),
    body: JSON.stringify({ ...state, updated_at: new Date().toISOString() }),
  });
}

export async function upsertDriveWatchChannel(channel) {
  if (!configured()) return { skipped: true, reason: 'supabase_not_configured' };
  return httpJson(url('chat_drive_watch_channel'), {
    method: 'POST',
    headers: headers('resolution=merge-duplicates,return=representation'),
    body: JSON.stringify({ ...channel, updated_at: new Date().toISOString() }),
  });
}
