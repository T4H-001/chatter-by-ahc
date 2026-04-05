import crypto from 'crypto';
import { google } from 'googleapis';
import { config } from './config.js';
import { getSecret } from './bridgeClient.js';

const MOCK_FEED = [
  { id: 'mock-001', name: 'mock-doc.txt', mimeType: 'text/plain', modifiedTime: new Date().toISOString(), content: 'Mock drive file for local dev', source: 'mock' },
];

let _saJson = null;

async function getSaJson() {
  if (_saJson) return _saJson;
  // 1. Env var (Vercel project setting)
  if (config.googleSaJson) {
    try { _saJson = JSON.parse(config.googleSaJson); return _saJson; } catch { /* fall through */ }
  }
  // 2. cap_secrets via bridge
  const raw = await getSecret('GOOGLE_SA_JSON');
  if (raw) {
    try { _saJson = JSON.parse(raw); return _saJson; } catch { /* fall through */ }
  }
  return null;
}

async function authClient() {
  const sa = await getSaJson();
  if (!sa) return null;
  return new google.auth.JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
}

async function drive() {
  const auth = await authClient();
  if (!auth) return null;
  return google.drive({ version: 'v3', auth });
}

export async function listFolderChanges() {
  const api = await drive();
  if (!api || !config.driveFolderId) return MOCK_FEED;
  const q = `'${config.driveFolderId}' in parents and trashed = false`;
  const { data } = await api.files.list({
    q,
    fields: 'files(id,name,mimeType,modifiedTime,createdTime,webViewLink,description,properties,size)',
    orderBy: 'modifiedTime desc',
    pageSize: 100,
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
  });
  return (data.files || []).map((f) => ({ ...f, content: '', source: 'drive_files_list' }));
}

export async function getFileContent(fileId, mimeType) {
  const api = await drive();
  if (!api) return '';
  const exportable = [
    'application/vnd.google-apps.document',
    'application/vnd.google-apps.spreadsheet',
    'application/vnd.google-apps.presentation',
  ];
  if (exportable.includes(mimeType)) {
    const exportMime = mimeType === 'application/vnd.google-apps.spreadsheet' ? 'text/csv' : 'text/plain';
    const { data } = await api.files.export({ fileId, mimeType: exportMime }, { responseType: 'text' });
    return typeof data === 'string' ? data : '';
  }
  const { data } = await api.files.get({ fileId, alt: 'media' }, { responseType: 'text' });
  return typeof data === 'string' ? data : '';
}

export async function getStartPageToken() {
  const api = await drive();
  if (!api) return null;
  const { data } = await api.changes.getStartPageToken({ supportsAllDrives: true });
  return data.startPageToken || null;
}

export async function listChanges(pageToken) {
  const api = await drive();
  if (!api || !pageToken) return null;
  const { data } = await api.changes.list({
    pageToken,
    fields: 'newStartPageToken,changes(fileId,file(id,name,mimeType,modifiedTime,createdTime,webViewLink,description,properties,size),removed,time)',
    spaces: 'drive',
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
  });
  return data;
}

export async function getChangedFilesFromWebhook(pageToken) {
  const data = await listChanges(pageToken || config.drivePageToken);
  if (!data?.changes) return listFolderChanges();
  return data.changes
    .filter((c) => !c.removed && c.file)
    .map((c) => ({ ...c.file, source: 'drive_changes_list', pageToken: data.newStartPageToken || pageToken }));
}

export async function registerDriveWatch() {
  const api = await drive();
  if (!api || !config.driveWebhookAddress) return { skipped: true, reason: 'drive_watch_not_configured' };
  const startPageToken = await getStartPageToken();
  const channelId = config.driveWatchChannelId || crypto.randomUUID();
  const { data } = await api.changes.watch({
    pageToken: startPageToken,
    requestBody: {
      id: channelId,
      type: 'web_hook',
      address: config.driveWebhookAddress,
      token: config.driveWebhookToken || undefined,
    },
    supportsAllDrives: true,
  });
  return { ...data, startPageToken };
}
