import { processDriveFile } from '../../lib/processor.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  try {
    const result = await processDriveFile(req.body.file);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message, data: err.data || null });
  }
}
