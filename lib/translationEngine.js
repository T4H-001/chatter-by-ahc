import { classifyInput, inferLibrary } from './classifier.js';

function buildHumanOutputs(sourceType, inputText) {
  switch (sourceType) {
    case 'decision_event':
      return [
        { asset_key: 'decision_memo', title: 'Decision Memo', body_text: `Decision captured:\n\n${inputText}` },
        { asset_key: 'faq', title: 'FAQ Draft', body_text: 'Draft FAQ generated from decision context.' },
        { asset_key: 'stakeholder_note', title: 'Stakeholder Note', body_text: 'Stakeholder-ready summary of the change.' },
      ];
    case 'report':
      return [
        { asset_key: 'board_note', title: 'Board Note', body_text: 'Board-ready summary and implications.' },
        { asset_key: 'release_note', title: 'Action Summary', body_text: 'Key actions extracted from report.' },
      ];
    case 'code_drop':
      return [
        { asset_key: 'release_note', title: 'Release Note', body_text: 'Release summary generated from code/spec input.' },
        { asset_key: 'runbook', title: 'Runbook Delta', body_text: 'Operational changes and checks.' },
      ];
    default:
      return [{ asset_key: 'decision_memo', title: 'Summary', body_text: inputText }];
  }
}

function buildMachineOutputs(sourceType) {
  switch (sourceType) {
    case 'decision_event':
      return [
        { asset_key: 'routing_instruction', structured_payload: { systems_to_read: ['supabase', 'google_drive'], systems_to_write: ['supabase', 'bridge'] } },
        { asset_key: 'validation_checklist', structured_payload: { checks: ['Confirm pages updated', 'Confirm pricing logic updated', 'Confirm notification drafts ready'] } },
      ];
    case 'report':
      return [
        { asset_key: 'workflow_json', structured_payload: { action: 'report_to_action_pack', priority: 'normal' } },
        { asset_key: 'queue_job', structured_payload: { job_type: 'summary_and_actions' } },
      ];
    case 'code_drop':
      return [
        { asset_key: 'deployment_instruction', structured_payload: { action: 'prepare_release', checks: ['qa', 'smoke_test', 'rollback'] } },
        { asset_key: 'validation_checklist', structured_payload: { checks: ['Build passes', 'Env vars present', 'Release note drafted'] } },
      ];
    default:
      return [{ asset_key: 'routing_instruction', structured_payload: { systems_to_read: [], systems_to_write: ['supabase'] } }];
  }
}

export function translate({ inputText, sourceType, authorityMode = 'prepare_only', metadata = {} }) {
  const resolvedType = sourceType || classifyInput(inputText, metadata);
  const libraries = inferLibrary(resolvedType);
  const human_outputs = buildHumanOutputs(resolvedType, inputText);
  const machine_outputs = buildMachineOutputs(resolvedType);
  const routes = machine_outputs.map((m) => ({
    connector_key: m.asset_key === 'deployment_instruction' ? 'bridge' : 'supabase',
    action_key: m.asset_key,
    mode: authorityMode,
    payload: m.structured_payload || {},
  }));
  return { status: 'prepared', detected_domain: resolvedType, libraries, human_outputs, machine_outputs, routes, metadata };
}
