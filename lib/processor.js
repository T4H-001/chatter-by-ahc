import crypto from 'crypto';
import { translate } from './translationEngine.js';
import { saveSession, saveOutput, saveRoute, saveEvent, upsertDriveState, getDriveState, getTenantIdByKey } from './supabaseClient.js';
import { invokeBridge } from './bridgeClient.js';
import { getFileContent } from './driveClient.js';

export async function processTranslation(input) {
  const sessionId = crypto.randomUUID();
  const tenantId = await getTenantIdByKey();
  const result = translate(input);

  const sessionRecord = {
    id: sessionId,
    tenant_id: tenantId,
    user_ref: input.metadata?.source || 'system',
    source_type: input.sourceType || result.detected_domain,
    input_text: input.inputText,
    detected_domain: result.detected_domain,
    detected_business_key: input.metadata?.business_key || null,
    authority_mode: input.authorityMode || 'prepare_only',
    status: result.status,
    metadata: input.metadata || {},
  };

  await saveSession(sessionRecord);
  await saveEvent({ session_id: sessionId, event_type: 'session_created', event_level: 'info', event_body: sessionRecord });

  for (const h of result.human_outputs) {
    await saveOutput({ session_id: sessionId, audience: 'human', asset_key: h.asset_key, title: h.title, body_text: h.body_text, output_status: 'prepared' });
  }
  for (const m of result.machine_outputs) {
    await saveOutput({ session_id: sessionId, audience: 'machine', asset_key: m.asset_key, structured_payload: m.structured_payload, output_status: 'prepared' });
  }

  const bridgeResults = [];
  for (const route of result.routes) {
    const routeRow = { session_id: sessionId, connector_key: route.connector_key, action_key: route.action_key, mode: route.mode, route_status: 'prepared', route_payload: route.payload };
    await saveRoute(routeRow);
    await saveEvent({ session_id: sessionId, event_type: 'route_prepared', event_level: 'info', event_body: routeRow });
    if (route.mode === 'execute' && ['bridge', 'gmail_drafts'].includes(route.connector_key)) {
      const bridgeResult = await invokeBridge(route, { sessionId, detected_domain: result.detected_domain, metadata: input.metadata || {} });
      bridgeResults.push(bridgeResult);
      await saveEvent({ session_id: sessionId, event_type: 'bridge_invoked', event_level: 'info', event_body: { route, bridgeResult } });
    }
  }

  return { sessionId, ...result, bridgeResults };
}

export async function processDriveFile(file) {
  const previous = await getDriveState(file.id);
  if (previous?.last_seen_modified_time && new Date(previous.last_seen_modified_time).getTime() >= new Date(file.modifiedTime).getTime()) {
    return { skipped: true, reason: 'already_processed', fileId: file.id };
  }
  let content = file.content || '';
  if (!content && file.id && file.mimeType) {
    try { content = await getFileContent(file.id, file.mimeType); } catch { content = ''; }
  }
  const result = await processTranslation({
    inputText: content || file.name,
    sourceType: undefined,
    authorityMode: 'prepare_only',
    metadata: { source: 'google_drive', fileId: file.id, fileName: file.name, mimeType: file.mimeType, webViewLink: file.webViewLink || null },
  });
  await upsertDriveState({ file_id: file.id, file_name: file.name, last_seen_modified_time: file.modifiedTime, last_status: 'processed', last_session_id: result.sessionId });
  return result;
}
