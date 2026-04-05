import { config } from '../../lib/config.js';
import { getChangedFilesFromWebhook } from '../../lib/driveClient.js';
import { processDriveFile } from '../../lib/processor.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  try {
    if (config.driveWebhookToken && req.headers['x-goog-channel-token'] !== config.driveWebhookToken) {
      return res.status(403).json({ error: 'invalid_webhook_token' });
    }
    const pageToken = config.drivePageToken;
    const files = await getChangedFilesFromWebhook(pageToken);
    const results = [];
    for (const file of files) results.push(await processDriveFile(file));
    res.json({ ok: true, processed: results.filter((x) => !x.skipped).length, totalSeen: results.length });
  } catch (err) {
    res.status(500).json({ error: err.message, data: err.data || null });
  }
}
