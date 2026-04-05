export function classifyInput(text = '', metadata = {}) {
  const lower = `${metadata.fileName || ''} ${text}`.toLowerCase();
  if (lower.includes('pricing') || lower.includes('price')) return 'decision_event';
  if (lower.includes('report') || lower.endsWith('.pdf')) return 'report';
  if (lower.includes('release') || lower.includes('api') || lower.includes('yaml') || lower.includes('json') || lower.includes('sql') || lower.includes('code')) return 'code_drop';
  if (lower.includes('ticket') || lower.includes('incident') || lower.includes('complaint')) return 'support_issue';
  return 'general_request';
}

export function inferLibrary(sourceType) {
  const map = {
    decision_event: ['founder'],
    report: ['founder', 'government'],
    code_drop: ['architecture'],
    support_issue: ['support'],
  };
  return map[sourceType] || ['founder'];
}
