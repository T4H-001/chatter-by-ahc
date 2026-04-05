import { processTranslation } from '../../lib/processor.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  try {
    const result = await processTranslation({
      inputText: req.body.input_text || '',
      sourceType: req.body.source_type,
      authorityMode: req.body.authority_mode || 'prepare_only',
      metadata: req.body.context || {},
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message, data: err.data || null });
  }
}
