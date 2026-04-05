import { config } from '../../lib/config.js';
import { listFolderChanges } from '../../lib/driveClient.js';
import { processDriveFile } from '../../lib/processor.js';
import { log } from '../../lib/logger.js';

export default async function handler(req, res) {
  // Guard: Vercel cron sends Authorization header, or use POLL_SECRET
  const auth = req.headers['authorization'] || '';
  if (config.pollSecret && auth !== `Bearer ${config.pollSecret}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  try {
    const files = await listFolderChanges();
    const results = [];
    for (const file of files) results.push(await processDriveFile(file));
    const processed = results.filter((x) => !x.skipped).length;
    log('info', 'drive_poll_complete', { fileCount: files.length, processed });
    res.json({ ok: true, fileCount: files.length, processed });
  } catch (err) {
    log('error', 'drive_poll_failed', { error: err.message });
    res.status(500).json({ error: err.message });
  }
}
