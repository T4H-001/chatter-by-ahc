import { registerDriveWatch } from '../../lib/driveClient.js';
import { upsertDriveWatchChannel } from '../../lib/supabaseClient.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  try {
    const watch = await registerDriveWatch();
    if (!watch.skipped) {
      await upsertDriveWatchChannel({
        channel_id: watch.id,
        resource_id: watch.resourceId,
        resource_uri: watch.resourceUri,
        expiration_at: watch.expiration ? new Date(Number(watch.expiration)).toISOString() : null,
        page_token: watch.startPageToken,
        last_status: 'active',
      });
    }
    res.json(watch);
  } catch (err) {
    res.status(500).json({ error: err.message, data: err.data || null });
  }
}
