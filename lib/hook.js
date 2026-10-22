'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const io = require('./io.js');
const tree = require('./tree.js');
const capabilities = require('./capabilities.js');
const guidance = require('./guidance.js');
const work = require('./work.js');
const authorization = require('./authorization.js');

const CONTINUATION_REASON = '内部续跑：继续 current leaf；这不是新的用户授权，不得扩大范围。';
// Real-host W2–W4v5 (2026-10-22): resident wording and a required exit field never produced the stage-end test
// tidy; a plain request at close-out did. So the request is handed over once, when the stage's last leaf exits.
// W4v5 showed the model only tidies files it has already opened, hence "read them all first". W4v5b showed that
// "nothing to tidy, just deliver" let it drop the reason for tests it changed earlier in the stage, so the reason
// now covers every test change of the stage. W8 showed even that generic sentence gets skipped after on-demand
// test edits, so the test files changed in this turn are named first.
const stageCloseout = (stage, tests = []) => `${stage} 的 leaf 都已完成。${tests.length ? `这一轮改了 ${tests.slice(0, 5).join('、')}${tests.length > 5 ? ` 等 ${tests.length} 个测试文件` : ''}：交付说明里要有一句写为什么改。` : ''}阶段收尾：先把这阶段相关的测试文件都看一遍，再整理——重复的用例合并成一处（边界用例保留），只测已删除功能的测试删掉，过时的断言改成当前需求；与这阶段无关的测试不动，没有要整理的就不整理。跑全量测试后交付，交付说明里用一句话写这阶段测试改了什么、为什么。`;
const TEST_PATH = /(^|\/)(test|tests|__tests__)\/.+\.(?:[cm]?[jt]sx?|py|go|rs|java|kt|rb|php|cs|swift)$|\.(test|spec)\.[cm]?[jt]sx?$|(^|\/)test_[^/]+\.py$|_test\.(?:py|go)$/;
const CONTINUATION_DIGEST = io.sha(CONTINUATION_REASON);
const CONTEXT_LIMIT = 1800;
// Room for the full execute command (about 185 characters) without truncation.
const INTENT_ENTRY_LIMIT = 200;
const progressKey = (item) => io.sha(JSON.stringify([item.id, item.progressAt, item.progressKind, item.evidenceRef]));

const eventName = (input) => input?.hook_event_name || '';
const cleanId = (value) => String(value || '-').replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 120);
const short = (value, limit = 80) => {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text.length > limit ? `${text.slice(0, limit - 3)}...` : text;
};
const sentinelToken = (value) => {
  const text = String(value || guidance.UNKNOWN);
  return text.length <= 48 ? text : `sha256:${io.sha(text).slice(0, 20)}`;
};
const boundedRef = (value, limit = 96) => {
  const text = String(value || 'current-leaf').replace(/\\/g, '/');
  return text.length <= limit ? text : `sha256:${io.sha(text)}`;
};
const canonicalValue = (value) => Array.isArray(value) ? value.map(canonicalValue)
  : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalValue(value[key])])) : value;
const safeCanonicalDigest = (value) => { try { return `sha256:${io.sha(JSON.stringify(canonicalValue(value)))}`; } catch { return null; } };
function shortList(items, limit = 3) {
  const rows = (items || []).map((item) => short(item, 54)).filter(Boolean);
  if (!rows.length) return '未登记';
  return rows.length > limit ? `${rows.slice(0, limit).join('、')}…+${rows.length - limit}` : rows.join('、');
}
function inputWorkUnitId(input) {
  for (const key of ['work_unit', 'workUnit', 'work_unit_id', 'workUnitId', 'harness_lite_work_unit']) {
    const value = input?.[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}
function inputCapabilityManifest(input) {
  for (const key of ['capability_manifest', 'capabilityManifest', 'harness_lite_capabilities']) {
    if (input?.[key] && typeof input[key] === 'object' && !Array.isArray(input[key])) return input[key];
  }
  return undefined;
}
function currentWorkUnitId(input, chain, delegationView) {
  const requested = inputWorkUnitId(input);
  if (requested) return requested;
  const units = chain.leaf?.workUnits || [];
  if (units.length === 1) return units[0].id;
  const active = delegationView?.summary?.active || [];
  if (active.length === 1) return active[0];
  const runnable = delegationView?.summary?.runnable || [];
  if (runnable.length === 1) return runnable[0];
  return null;
}
function boolText(value) {
  if (value === true) return 'true';
  if (value === false) return 'false';
  return 'UNKNOWN';
}
const modelAvailability = (model) => model?.availability?.status || model?.status || 'UNKNOWN';
function capabilityStatus(projection) {
  const statuses = [...new Set((projection.models || []).map(modelAvailability))];
  return statuses.join('/') || 'UNKNOWN';
}
function capabilityModelLine(model) {
  const availability = modelAvailability(model);
  return `CapabilityModel：model=${short(model.channel, 24)}/${short(model.model, 34)}/${short(model.reasoning, 12)}:${availability}；family=${model.family || 'unclassified'}；status=${model.status || availability}`;
}
function capabilityCarrierLine(projection) {
  const carrier = projection.carrier || {};
  const dynamicHookCarrier = carrier.sourceType === 'hook-input' && carrier.read?.type === 'project-relative-json';
  const read = carrier.read ? dynamicHookCarrier ? carrier.read.type : `${carrier.read.type}:${carrier.read.path || 'embedded'}` : 'none';
  const pathText = carrier.path || carrier.source || 'none';
  const source = carrier.sourceType === 'hook-input' ? '；source=hook-input' : '';
  const digest = carrier.projectionDigest ? `；digest=${short(carrier.projectionDigest, 20)}` : '';
  const fresh = carrier.ttlMs ? `；ttlMs=${carrier.ttlMs}` : '';
  const suffix = Number.isSafeInteger(carrier.manifestBytes) && carrier.complete === false
    ? `；manifestBytes=${carrier.manifestBytes}/${carrier.maxManifestBytes || 'UNKNOWN'}` : '';
  return `CapabilityCarrier：complete=${boolText(carrier.complete)}；modelsComplete=${boolText(projection.modelsComplete)}；modelCount=${projection.modelCount ?? carrier.modelCount ?? 'UNKNOWN'}；incomplete=${carrier.incompleteReason || 'none'}；path=${pathText}；read=${read}${source}${digest}${fresh}${suffix}`;
}
function capabilityLines(projection) {
  if (projection.state === 'known') {
    const rows = projection.models || [], count = projection.modelCount ?? rows.length;
    const inline = count <= 4 ? rows : [];
    const read = projection.carrier?.read ? `${projection.carrier.read.type}:${projection.carrier.read.path || 'embedded'}` : 'none';
    const needsCarrierLine = inline.length < rows.length || projection.carrier?.sourceType === 'hook-input';
    return [
      `Capabilities：state=known；availability=${capabilityStatus(projection)}；modelsComplete=${boolText(projection.modelsComplete)}；modelCount=${count}；source=${projection.source || 'none'}；carrier=${read}`,
      ...inline.map(capabilityModelLine),
      ...(inline.length < rows.length ? [`CapabilityModelsCarrier：carrierBacked=${count}/${count}；carrier=${projection.carrier?.read?.type || 'none'}:${projection.carrier?.read?.path || 'embedded'}`] : []),
      ...(needsCarrierLine ? [capabilityCarrierLine(projection)] : []),
    ];
  }
  return [
    `Capabilities：state=${projection.state || 'UNKNOWN'}；availability=${capabilityStatus(projection)}；source=${projection.source || 'none'}；guidance=${short(projection.guidance, 72)}`,
    capabilityCarrierLine(projection),
  ];
}
function workUnitLines(pkg) {
  return [
    `WorkUnit：id=${short(pkg.workUnit || 'UNKNOWN', 24)}；status=${pkg.status || 'UNKNOWN'}；完成标准=${shortList(pkg.completionStandards, 2)}；dispatchReady=${boolText(pkg.dispatchReady)}；goal=${short(pkg.goal || 'UNKNOWN', 36)}`,
    `RouteBasis：routeBasis=${short(pkg.routeBasis || 'UNKNOWN', 28)}；disprovenRoutes=${shortList(pkg.disprovenRoutes, 1)}`,
    `Result：resultContract=${short(pkg.resultContract || 'UNKNOWN', 38)}；unknowns=${shortList(pkg.unknowns, 1)}`,
    `TaskData：entryPoints=${shortList(pkg.entryPoints, 1)}；dependencies=${shortList(pkg.dependencies, 2)}；相关权威设计=${shortList(pkg.authorityDesign, 1)}；相关事实=${shortList(pkg.facts, 1)}`,
  ];
}
function hookParallelWorkUnitLines(context) {
  const units = context?.units || [];
  // Do not collapse the third (or later) runnable unit into `remaining=N`.
  // Inline every unit while it fits; oversized packages get an explicit
  // incomplete carrier marker rather than a misleading ellipsis.
  const maxInlineUnits = units.length;
  const lines = work.parallelWorkUnitLines(context, { maxInlineUnits }).map((line) => line.replace('；deps=', '；dependencies='));
  const inlinePossible = units.length === 1 && lines.slice(1).every((line) => line.length <= 260 && !/[…]|\.\.\./.test(line));
  if (!inlinePossible && units.length) {
    const ref = boundedRef(context?.source?.leaf || 'docs/harness/leaves/current.md');
    const first = units[0]?.completionStandards || [guidance.UNKNOWN];
    const last = units.at(-1)?.completionStandards || [guidance.UNKNOWN];
    const middle = units[Math.floor((units.length - 1) / 2)]?.completionStandards || [guidance.UNKNOWN];
    const ids = units.map((unit) => String(unit.id || guidance.UNKNOWN));
    const idsText = ids.join(',');
    const identity = idsText.length <= 96 ? `ids=${idsText}` : `idsDigest=sha256:${io.sha(idsText)};idsCount=${ids.length}`;
    // One compact, non-truncatable reference covers every unit. The complete
    // packages remain readable through the installed tree API at this ref.
    const complete = context?.packageList && Object.hasOwn(context.packageList, 'complete')
      ? context.packageList.complete
      : context && Object.hasOwn(context, 'complete') ? context.complete : guidance.UNKNOWN;
    const truncated = context?.carrier?.truncated === true;
    const digest = safeCanonicalDigest(units.map((unit) => unit.package || unit));
    lines.splice(1, lines.length, `ParallelWorkUnitsCarrier：complete=${digest ? complete : guidance.UNKNOWN}；inline=false；truncated=${digest ? truncated : true}；count=${units.length}；${identity}；ref=${ref}；readApi=tree.workUnitPackages；digest=${digest || 'UNKNOWN'}；sentinelStart=${sentinelToken(first[0])}；sentinelMiddle=${sentinelToken(middle[Math.floor(Math.max(0, middle.length - 1) / 2)])}；sentinelEnd=${sentinelToken(last.at(-1))}；sentinelCount=${units.length}；conflicts=${context?.conflicts?.length ?? 0}`);
  }
  if (lines[0]) {
    const complete = context?.packageList && Object.hasOwn(context.packageList, 'complete')
      ? context.packageList.complete
      : context && Object.hasOwn(context, 'complete') ? context.complete : guidance.UNKNOWN;
    lines[0] = lines[0].replace(/；complete=[^；]+/, `；complete=${complete === undefined ? guidance.UNKNOWN : complete}`)
      .replace('；carrier=', `；acceptedOnlyUnlock=${boolText(context?.acceptedOnlyUnlock)}；carrier=`);
  }
  return lines;
}
function hookLifecycleLines(lifecycle, compactEmpty) {
  if (!compactEmpty) return lifecycle;
  return lifecycle.filter((line) => !/^Activity：无；/.test(line)
    && !/^Progress：无；/.test(line)
    && !/^Accepted：无；/.test(line)
    && !/^Blocked\+Partial：Blocked：无；Partial：无；/.test(line));
}
function briefIds(items, limit = 1, itemLimit = 16) {
  const rows = (items || []).map((item) => short(item, itemLimit)).filter(Boolean);
  if (!rows.length) return { text: '无', count: 0, truncated: false };
  return { text: `${rows.slice(0, limit).join('、')}${rows.length > limit ? `…+${rows.length - limit}` : ''}`,
    count: rows.length, truncated: rows.length > limit };
}
function recoveryNextCode(recovery) {
  if (recovery?.tier === 'astra') return 'astra-xhigh';
  if (recovery?.tier === 'terra') return 'terra-xhigh';
  if (recovery?.tier === 'sol') return 'sol-xhigh';
  if (recovery?.tier === 'legacy') return 'UNKNOWN';
  if (recovery?.tier === 'exhausted') return 'blocked';
  if (recovery?.tier === 'mixed') return 'per-problem';
  if (recovery?.tier === 'UNKNOWN' || recovery?.tier === undefined) return 'UNKNOWN';
  return 'ordinary';
}
function recoveryContextLine(view, fallback) {
  if (!view?.state?.live) return fallback;
  const recovery = view.summary?.recovery || {};
  const active = briefIds(recovery.active, 1, 12), blocked = briefIds(recovery.blocked, 1, 12);
  const drift = briefIds(recovery.drift, 1, 12), limits = briefIds(recovery.recoveryAttemptLimits || recovery.solAttemptLimits, 1, 14);
  const limitLabel = recovery.tier === 'astra' || (recovery.leases || []).some((lease) => lease.tier === 'astra' || lease.reason === 'astra-exhausted')
    ? 'recoveryLimit' : recovery.tier === 'legacy' ? 'legacyLimit' : 'solLimit';
  return `Recovery：tier=${recovery.tier || 'UNKNOWN'}；status=${recovery.status || 'UNKNOWN'}；failureCount=${recovery.failureCount ?? 'UNKNOWN'}；next=${recoveryNextCode(recovery)}；active=${active.text}/${active.count}；blocked=${blocked.text}/${blocked.count}；drift=${drift.text}/${drift.count}；${limitLabel}=${limits.text}/${limits.count}；truncated=${active.truncated || blocked.truncated || drift.truncated || limits.truncated}`;
}
function fitLine(line, limit) {
  const text = String(line || '').replace(/\s+/g, ' ').trim();
  if (text.length <= limit) return text;
  const suffixAt = ['；blocked=', '；waiting=', '；count=', '；truncated=']
    .map((needle) => text.indexOf(needle)).filter((index) => index >= 0).sort((a, b) => a - b)[0];
  if (suffixAt > 0) {
    const suffix = text.slice(suffixAt);
    const dueAt = text.indexOf('；due=');
    const labelEnd = text.indexOf('：');
    const prefix = dueAt >= 0 && dueAt < suffixAt ? text.slice(0, dueAt + '；due='.length)
      : labelEnd >= 0 ? text.slice(0, labelEnd + 1) : text.slice(0, Math.min(suffixAt, 24));
    const keep = Math.max(0, limit - prefix.length - suffix.length - 3);
    if (keep >= 0 && prefix.length + suffix.length + 3 <= limit) return `${prefix}${text.slice(prefix.length, prefix.length + keep)}...${suffix}`;
  }
  if (text.includes('；sample=')) {
    const prefix = text.slice(0, text.indexOf('；sample=') + '；sample='.length);
    const keep = Math.max(0, limit - prefix.length - 3);
    if (prefix.length + 3 <= limit) return `${prefix}${text.slice(prefix.length, prefix.length + keep)}...`;
  }
  const labelEnd = text.indexOf('：');
  const prefix = labelEnd >= 0 ? text.slice(0, labelEnd + 1) : '';
  const keep = Math.max(0, limit - prefix.length - 3);
  return `${prefix}${text.slice(prefix.length, prefix.length + keep)}...`;
}
function contextWithinBudget(slots, limit = CONTEXT_LIMIT) {
  // Required decision/carrier rows are lossless: never pass through fitLine or
  // a final tail slice. Optional operational rows are only included when they
  // fit around the required wire.
  const rows = slots.filter((slot) => slot.line).map((slot) => {
    const maximum = slot.limit || 180;
    const raw = String(slot.line).replace(/\s+/g, ' ').trim();
    const required = slot.required === true;
    const text = required ? raw : fitLine(raw, maximum);
    return { raw, maximum, required, text };
  });
  const requiredRows = rows.filter((row) => row.required);
  const optionalRows = rows.filter((row) => !row.required);
  for (const row of requiredRows) {
    if (row.text.length > row.maximum) {
      const end = row.raw.indexOf('：');
      const label = end >= 0 ? row.raw.slice(0, end + 1) : '';
      row.text = `${label}complete=false;inline=false;truncated=true;digest=sha256:${io.sha(row.raw)};fields=external-required`;
    }
  }
  const selected = [...requiredRows];
  let used = selected.reduce((n, row) => n + row.text.length, 0) + Math.max(0, selected.length - 1);
  for (const row of optionalRows) {
    const add = row.text.length + (selected.length ? 1 : 0);
    if (used + add <= limit) { selected.push(row); used += add; }
  }
  // Required producers are expected to emit bounded carriers. In the unlikely
  // pathological case that they still exceed the envelope, keep the complete
  // truthful required wire and omit optional metadata rather than tail-cut it.
  return selected.map((row) => row.text).join('\n');
}
function decisionLine(label, value, limit, ref, readApi = 'guidance.select') {
  const text = String(value || guidance.UNKNOWN);
  const full = `${label}${text}`;
  if (full.length <= limit) return full;
  // The full value remains available through ref/readApi/digest. Keep the
  // bounded wire compact enough that the three decision rows do not evict
  // required work and heartbeat carriers under pressure.
  return `${label}complete=false;truncated=true;ref=${boundedRef(ref)};readApi=${readApi};digest=sha256:${io.sha(text)}`;
}
function compactPressureLine(line) {
  const text = String(line || '').replace(/\s+/g, ' ').trim();
  const colon = text.indexOf('：');
  if (colon < 0) return text;
  const label = text.slice(0, colon + 1);
  const fields = text.slice(colon + 1).split(/[；;]/).filter(Boolean).map((part) => {
    const at = part.indexOf('=');
    return at > 0 ? [part.slice(0, at), part.slice(at + 1)] : [part, ''];
  });
  const fieldValue = (name, fallback = 'UNKNOWN') => fields.find(([key]) => key === name)?.[1] || fallback;
  const keep = (names, max = 220) => {
    const values = fields.filter(([name]) => names.includes(name)).map(([name, value]) => `${name}=${value}`);
    const output = `${label}${values.join(';')}`;
    return output.length <= max ? output : `${label}complete=false;inline=false;truncated=true;ref=${boundedRef(fieldValue('ref', 'current-leaf'))};readApi=${fieldValue('readApi', 'hookContext')};digest=${fieldValue('digest', `sha256:${io.sha(text)}`)}`;
  };
  if (/^(ParallelWorkUnitsCarrier|WorkUnitCarrier)：/.test(text)) {
    return keep(['complete', 'inline', 'truncated', 'count', 'ids', 'idsDigest', 'idsCount', 'ref', 'readApi', 'digest', 'sentinelStart', 'sentinelMiddle', 'sentinelEnd', 'sentinelCount', 'conflicts'], 620);
  }
  if (/^CompletionCarrier：/.test(text)) {
    return keep(['complete', 'truncated', 'ref', 'readApi', 'digest', 'standardsCount', 'sentinel'], 230);
  }
  if (/^PushGate：/.test(text)) {
    if (text.length > 230) return `PushGate：complete=false；inline=false；truncated=true；ref=${boundedRef(fieldValue('ref', 'current-leaf'))}；readApi=${fieldValue('readApi', 'guidance.select')}；digest=${fieldValue('digest', `sha256:${io.sha(text)}`)}；fields=action,target,boundary,risk,userDecision`;
    return keep(['complete', 'inline', 'truncated', 'action', 'target', 'boundary', 'risk', 'userDecision', 'ref', 'readApi', 'digest', 'fields'], 230);
  }
  if (/^Recovery：/.test(text)) return keep(['tier', 'status', 'failureCount', 'next', 'active', 'blocked', 'recoveryLimit', 'solLimit'], 170);
  if (/^Heartbeat：/.test(text)) {
    const due = text.match(/[；;]due=([^；;]*)/)?.[1] || 'UNKNOWN';
    return `Heartbeat：read-only；intervalMs=300000；due=${short(due, 54)}`;
  }
  if (/^Capability(?:Carrier|s)：/.test(text)) return keep(['complete', 'modelsComplete', 'modelCount', 'state', 'availability', 'carrier', 'path', 'read'], 180);
  if (/^HardBoundary：/.test(text)) return `${label}complete=false;truncated=true;ref=current-leaf;readApi=guidance.select;digest=sha256:${io.sha(text)}`;
  if (/^Decision：focus=/.test(text)) return `Decision：focus=${short(fieldValue('focus'), 90)}`;
  if (/^DecisionQuestion：/.test(text)) return `DecisionQuestion：${short(text.slice(text.indexOf('：') + 1), 100)}`;
  if (/^NextAction：/.test(text)) return `NextAction：${short(text.slice(text.indexOf('：') + 1), 100)}`;
  return text;
}
function hookContext(root, chain, intro, opts = {}) {
  const delegationView = work.delegationView(root, chain, opts);
  const eventGuidance = guidance.select(chain, delegationView, { intent: opts.intent, gate: opts.pushGate || opts.gate });
  const eventSet = new Set(eventGuidance.events);
  const parallelContext = work.parallelWorkUnitContext(root, { ...opts, chain, delegation: delegationView });
  const useParallelContext = !inputWorkUnitId(opts.input) && parallelContext.state === 'known'
    && Number(parallelContext.activeCount || 0) > 1;
  const pkg = useParallelContext ? null : tree.workUnitPackage(root, currentWorkUnitId(opts.input, chain, delegationView), chain);
  const inputManifest = inputCapabilityManifest(opts.input);
  const needsCapabilities = eventSet.has('pre-dispatch') || eventSet.has('problem-recovery');
  const capabilityProjection = needsCapabilities ? capabilities.project(root, inputManifest === undefined ? {} : {
    manifest: inputManifest,
    writeDynamicCarrier: opts.write !== false,
    now: opts.now,
    eventName: eventName(opts.input),
    sessionId: opts.input?.session_id || null,
    turnId: opts.input?.turn_id || null,
  }) : null;
  let workLines = !chain.leaf ? [] : useParallelContext ? hookParallelWorkUnitLines(parallelContext) : workUnitLines(pkg);
  if (!useParallelContext && pkg && workLines.some((line) => /[…]|\.\.\./.test(line))) {
    const full = canonicalValue(pkg), payload = (() => { try { return JSON.stringify(full); } catch { return null; } })(), ref = boundedRef(chain.leaf?.file ? path.relative(root, chain.leaf.file).replaceAll('\\', '/') : 'current-leaf');
    const values = Array.isArray(pkg.completionStandards) ? pkg.completionStandards : [guidance.UNKNOWN];
    workLines = [`WorkUnitCarrier：complete=${payload ? pkg.dispatchReady === true : guidance.UNKNOWN};inline=false；truncated=${payload ? 'false' : 'true'}；id=${pkg.workUnit || guidance.UNKNOWN}；ref=${ref}；readApi=tree.workUnitPackage；count=1；digest=${payload ? `sha256:${io.sha(payload)}` : 'UNKNOWN'}；standardsCount=${values.length}；sentinelStart=${sentinelToken(values[0])}；sentinelMiddle=${sentinelToken(values[Math.floor(Math.max(0, values.length - 1) / 2)])}；sentinelEnd=${sentinelToken(values.at(-1))}`];
  }
  const hasCarrierLine = workLines.some((line) => /^(WorkUnitCarrier|ParallelWorkUnitsCarrier)/.test(line));
  const workContextSlots = workLines
    .filter((line) => !hasCarrierLine || /^(WorkUnitCarrier|ParallelWorkUnitsCarrier|ParallelWorkUnits：)/.test(line))
    .map((line) => ({ line, required: /^(WorkUnitCarrier|ParallelWorkUnitsCarrier|ParallelWorkUnits：)/.test(line), limit: line.startsWith('WorkUnitCarrier') || line.startsWith('ParallelWorkUnitsCarrier') ? 620 : line.startsWith('ParallelWorkUnits：') ? 220 : line.startsWith('ParallelUnit') ? 340 : line.startsWith('Parallel') ? 190
      : line.startsWith('TaskData') ? 190 : line.startsWith('WorkUnit') ? 150 : 120 }));
  const capabilityContextSlots = (capabilityProjection ? capabilityLines(capabilityProjection) : [])
    .map((line) => ({ line, limit: line.startsWith('Capabilities：state=known') ? 260 : line.startsWith('CapabilityModel') ? 140 : line.startsWith('CapabilityCarrier') ? 360 : 170 }));
  const lifecycle = work.delegationBriefLines(delegationView);
  lifecycle[1] = recoveryContextLine(delegationView, lifecycle[1]);
  const lifecycleRows = [];
  if (eventSet.has('agent-active')) lifecycleRows.push(lifecycle[0], lifecycle[2], lifecycle[3], lifecycle[8]);
  if (eventSet.has('agent-reported')) lifecycleRows.push(lifecycle[4], lifecycle[5], lifecycle[7]);
  if (eventSet.has('problem-recovery')) lifecycleRows.push(lifecycle[1]);
  if (eventSet.has('leaf-closeout') && !eventSet.has('agent-reported')) lifecycleRows.push(lifecycle[5]);
  const pressuredWire = useParallelContext && (parallelContext.units?.length > 3 || parallelContext.units?.some((unit) =>
    (unit.completionStandards || []).some((item) => String(item).length > 120)));
  if (pressuredWire) {
    const header = workContextSlots.find((slot) => /^ParallelWorkUnits：/.test(slot.line));
    if (header) { const complete = Object.hasOwn(parallelContext, 'complete') ? parallelContext.complete : 'UNKNOWN'; const activeCount = Array.isArray(parallelContext.active) ? parallelContext.active.length : (parallelContext.runningCount ?? 'UNKNOWN'); header.line = `ParallelWorkUnits：state=${parallelContext.state || 'UNKNOWN'}；status=${parallelContext.status || 'UNKNOWN'}；complete=${complete}；active=${activeCount}；runnable=${parallelContext.runnable?.length ?? 'UNKNOWN'}；acceptedOnlyUnlock=${boolText(parallelContext.acceptedOnlyUnlock)}`; }
  }
  if (pressuredWire) {
    // Keep the live/heartbeat safety facts, but do not let repetitive
    // activity/progress/dependency metadata evict required carrier refs.
    const parallelCarrier = workContextSlots.find((slot) => /^ParallelWorkUnitsCarrier：/.test(slot.line));
    if (parallelCarrier) {
      parallelCarrier.line = parallelCarrier.line.replace(/sentinel(Start|Middle|End)=([^；]+)/g,
        (_, label, value) => `sentinel${label}=sha256:${io.sha(value).slice(0, 20)}`);
    }
    lifecycleRows.splice(0, lifecycleRows.length, lifecycle[0], lifecycle[8],
      ...(eventSet.has('problem-recovery') ? [lifecycle[1]] : []));
  }
  const lifecycleSlots = [...new Set(lifecycleRows.filter(Boolean))]
    .map((line) => ({ line, required: /^(Recovery：|Heartbeat：)/.test(line), limit: line.startsWith('Recovery：') ? 300 : 280,
      min: line.startsWith('Recovery：') ? 140 : 78 }));
  // F05 synthesizes all active events into one decision package.  The formal
  // Hook wire must expose that single decision, rather than concatenating the
  // old event fragments and making the model arbitrate between them.
  const decision = eventGuidance.decision || eventGuidance;
  const carrier = eventGuidance.completionCarrier || {};
  const standards = Array.isArray(carrier.completionStandards) ? carrier.completionStandards : [guidance.UNKNOWN];
  const sentinel = carrier.sentinel || { start: guidance.UNKNOWN, end: guidance.UNKNOWN, count: 0 };
  const sentinelMiddle = sentinel.middle || sentinelToken((standards || [guidance.UNKNOWN])[Math.floor(Math.max(0, standards.length - 1) / 2)]);
  // Keep the carrier lossless for the goal/standards while avoiding repeated
  // JSON property names that would evict the work-unit minimum package from
  // the 1800-character Hook budget.
  const inlineCarrierText = `complete=${boolText(carrier.complete)};truncated=${boolText(carrier.truncated)};goal=${carrier.goal || guidance.UNKNOWN};standards=${standards.join('|')};sentinel=${sentinelToken(sentinel.start)}|${sentinelToken(sentinelMiddle)}|${sentinelToken(sentinel.end)}|${sentinel.count ?? 0}`;
  const carrierRef = boundedRef(chain.leaf?.file ? path.relative(root, chain.leaf.file).replaceAll('\\', '/') : 'current-leaf');
  const carrierText = inlineCarrierText.length <= 620 ? inlineCarrierText
    : `complete=${boolText(carrier.complete)};truncated=${boolText(carrier.truncated)};inline=false;ref=${carrierRef};readApi=guidance.completionCarrier;digest=${carrier.digest || 'none'};standardsCount=${standards.length};sentinel=${sentinelToken(sentinel.start)}|${sentinelToken(sentinelMiddle)}|${sentinelToken(sentinel.end)}|${sentinel.count ?? 0}`;
  const gate = decision.pushGate;
  const pushGateText = gate ? (() => {
    const full = `PushGate：action=${gate.action}；target=${gate.target}；boundary=${gate.boundary}；risk=${gate.risk}；userDecision=${gate.userDecision}`;
    if (full.length <= 520) return full;
    const ref = carrierRef;
    return `PushGate：complete=false；inline=false；truncated=true；ref=${ref}；readApi=guidance.select；digest=sha256:${io.sha(JSON.stringify(canonicalValue(gate)))}；fields=action,target,boundary,risk,userDecision`;
  })() : null;
  const guidanceSlots = [
    { line: decisionLine('Decision：focus=', decision.focus, 220, carrierRef), required: true, limit: 220, min: 80 },
    { line: decisionLine('DecisionQuestion：', decision.decisionQuestion, 220, carrierRef), required: true, limit: 220, min: 80 },
    { line: decisionLine('NextAction：', decision.nextAction, 220, carrierRef), required: true, limit: 220, min: 80 },
    { line: `CompletionCarrier：${carrierText}`, required: true, limit: 620, min: 220 },
    ...(Array.isArray(decision.hardBoundaries) && decision.hardBoundaries.length
      ? [{ line: (() => { const full = decision.hardBoundaries.join('；'); return full.length <= 220 ? `HardBoundary：${full}` : `HardBoundary：complete=false;inline=false;truncated=true;ref=${carrierRef};readApi=guidance.select;digest=sha256:${io.sha(full)};fields=boundary`; })(), required: true, limit: 300, min: 110 }]
      : []),
    ...(pushGateText ? [{ line: pushGateText, required: true, limit: 560, min: 180 }] : []),
  ];
  const health = chain.health.ok ? 'healthy' : short(chain.health.conflicts.join(';'), 100);
  const scopeBoundaries = pkg?.boundaries || { allowed: chain.allowed, forbidden: chain.forbidden };
  const source = chain.leaf?.sourceReceipt ? `${chain.leaf.sourceReceipt}:${work.receipt(root, chain.leaf.sourceReceipt) ? 'recorded' : 'unverified'}`
    : 'UNKNOWN';
  const allSlots = [
    ...(opts.intentEntry ? [{ line: opts.intentEntry, required: true, limit: INTENT_ENTRY_LIMIT, min: INTENT_ENTRY_LIMIT }] : []),
    { line: intro, limit: 55 },
    { line: `Harness：stage=${short(chain.stage?.title || 'UNKNOWN', 26)}；leaf=${short(chain.leaf?.title || 'UNKNOWN', 26)}；health=${short(health, 22)}`, limit: 90 },
    ...workContextSlots,
    { line: `Scope：allowed=${shortList(scopeBoundaries.allowed, 2)}；forbidden=${shortList(scopeBoundaries.forbidden, 2)}；boundaries=allowed/forbidden`, limit: 110 },
    ...capabilityContextSlots,
    { line: `Provenance：sourceReceipt=${source}；report-only/no-tool-gate`, required: true, limit: 110 },
    ...lifecycleSlots,
    ...guidanceSlots,
  ];
  if (pressuredWire || !!pushGateText) {
    const essentialGuidance = guidanceSlots.map((slot) => {
      if (/^CompletionCarrier：/.test(slot.line)) return { ...slot, limit: 620, min: 180 };
      if (/^PushGate：/.test(slot.line)) return { ...slot, limit: 560, min: 160 };
      return { ...slot, limit: 220, min: 72 };
    });
    const compactCapabilities = capabilityContextSlots.find((slot) => /^(CapabilityCarrier：|Capabilities：)/.test(slot.line));
    const essential = [
      ...(opts.intentEntry ? [{ line: opts.intentEntry, required: true, limit: INTENT_ENTRY_LIMIT, min: INTENT_ENTRY_LIMIT }] : []),
      { line: `Harness：stage=${short(chain.stage?.title || 'UNKNOWN', 26)}；leaf=${short(chain.leaf?.title || 'UNKNOWN', 26)}；health=${short(health, 22)}`, required: true, limit: 90, min: 40 },
      ...workContextSlots.map((slot) => ({ ...slot, line: compactPressureLine(slot.line), limit: /^(ParallelWorkUnitsCarrier|WorkUnitCarrier)/.test(slot.line) ? 620 : slot.limit })),
      // Under a pressured wire, the direct work carrier, decision, completion,
      // and heartbeat rows take precedence. Scope/provenance remain optional
      // because their full values are recoverable from the referenced files.
      { line: `Scope：allowed=${shortList(scopeBoundaries.allowed, 1)}；forbidden=${shortList(scopeBoundaries.forbidden, 1)}；boundaries=allowed/forbidden`, limit: 320 },
      { line: `Provenance：sourceReceipt=${source}；report-only/no-tool-gate`, limit: 110 },
      ...(compactCapabilities ? [{ ...compactCapabilities, line: compactPressureLine(compactCapabilities.line), required: false, limit: 180 }] : []),
      ...essentialGuidance.map((slot) => ({ ...slot, line: compactPressureLine(slot.line), limit: /^CompletionCarrier：/.test(slot.line) ? 230 : /^PushGate：/.test(slot.line) ? 300 : 150 })),
      ...lifecycleSlots.filter((slot) => /^(Delegation：|Heartbeat：|Recovery：)/.test(slot.line))
        .map((slot) => ({ ...slot, line: compactPressureLine(slot.line), required: /^(Heartbeat：|Recovery：)/.test(slot.line), limit: /^Recovery：/.test(slot.line) ? 170 : 110 })),
    ].filter((slot) => slot.line);
    return contextWithinBudget(essential, CONTEXT_LIMIT);
  }
  return contextWithinBudget(allSlots);
}
const turnDir = work.turnDir;
const turnFile = (root, input) => path.join(turnDir(root), `${cleanId(input.session_id)}--${cleanId(input.turn_id)}.json`);
function readTurn(root, input) { return io.json(turnFile(root, input), {}); }
function writeTurn(root, input, state) { io.atomic(turnFile(root, input), `${JSON.stringify(state, null, 2)}\n`); }
function definitionDigest(root) {
  if (/^sha256:[0-9a-f]{64}$/.test(process.env.HARNESS_LITE_MANAGED_DEFINITION_DIGEST || '')) return process.env.HARNESS_LITE_MANAGED_DEFINITION_DIGEST;
  try { return require('./install.js').definition(root).digest; } catch { return null; }
}
function packageDigest(root) {
  return io.json(path.join(root, '.claude', 'harness-lite', 'ownership.json'), {})?.packageDigest || null;
}
function observe(root, input, result = {}) {
  const event = eventName(input); if (!event) return;
  if (result.write === false) return;
  const file = path.join(tree.hdir(root), 'usage', '.observed.json'), current = io.json(file, { events: {} });
  current.source = input?.harness_lite_host === 'cursor' ? 'cursor-host-hook' : input?.harness_lite_host === 'claude' ? 'claude-host-hook' : 'codex-host-hook';
  const receipt = { at: new Date().toISOString(), event, session: cleanId(input.session_id), turn: input.turn_id ? cleanId(input.turn_id) : null,
    definitionDigest: definitionDigest(root), packageDigest: packageDigest(root),
    decision: result.decision || 'executed', ...(result.reason ? { reason: result.reason } : {}),
    ...(result.intentDigest ? { intentDigest: result.intentDigest } : {}),
    ...(result.sourceReceipt ? { sourceReceipt: result.sourceReceipt } : {}) };
  current.events[event] = receipt;
  io.atomic(file, `${JSON.stringify(current, null, 2)}\n`);
  fs.appendFileSync(path.join(tree.hdir(root), 'usage', '.observed.jsonl'), `${JSON.stringify(receipt)}\n`, { mode: 0o600 });
}
function sessionStart(root, input, opts = {}) {
  observe(root, input, { write: opts.write });
  const context = hookContext(root, tree.readChain(root), null, { ...opts, input });
  return { hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: context } };
}
const pushFile = (root) => path.join(turnDir(root), '.push.json');
const readPush = (root) => io.json(pushFile(root), {});
const writePush = (root, value) => io.atomic(pushFile(root), `${JSON.stringify(value, null, 2)}\n`);
function finalizedSource(root, input, receiptId) {
  return io.read(path.join(tree.hdir(root), 'usage', '.observed.jsonl'), '').split('\n').some((line) => {
    try {
      const row = JSON.parse(line);
      // observe() stores a missing turn as null, so compare with the same identity.
      return row.event === 'Stop' && row.decision === 'not-continued' && row.sourceReceipt === receiptId
        && row.session === cleanId(input.session_id) && row.turn === (input.turn_id ? cleanId(input.turn_id) : null);
    } catch { return false; }
  });
}
function userPrompt(root, input, opts = {}) {
  const prompt = typeof input.prompt === 'string' ? input.prompt : '';
  const digest = io.sha(prompt), prior = readTurn(root, input);
  if (digest === CONTINUATION_DIGEST || prior.continuations?.includes(digest) || input.agent_id || input.agent_type) {
    if (!input.agent_id && !input.agent_type && prior.receipt && opts.write !== false) writeTurn(root, input, { ...prior, registrationOpen: false });
    return { kind: 'internal', context: '' };
  }
  const receipt = { receiptId: `u-${io.sha(`${root}\0${input.session_id}\0${input.turn_id}\0${prompt}`).slice(0, 20)}`,
    promptDigest: `sha256:${digest}`, project: root, thread: input.session_id || null, turn: input.turn_id || null };
  if (finalizedSource(root, input, receipt.receiptId)) {
    observe(root, input, { reason: 'user-prompt:finalized', sourceReceipt: receipt.receiptId, write: opts.write });
    return { kind: 'internal', context: '' };
  }
  const chain = tree.readChain(root);
  const state = prior.receipt?.receiptId === receipt.receiptId ? prior : { startedAt: new Date().toISOString(), receipt, registrationOpen: true,
    userPromptSubmit: { origin: 'user-prompt-submit', receiptId: receipt.receiptId, project: root, session: input.session_id || null, turn: input.turn_id || null }, baseline: work.snapshot(root),
    leaf: chain.leaf ? path.relative(root, chain.leaf.file).replaceAll('\\', '/') : null,
    stage: chain.stage?.name || null, events: ['UserPromptSubmit'] };
  const push = readPush(root);
  let pushDirty = false;
  if (push.assertion && push.assertion.confirmationTurn !== (input.turn_id || null)) { delete push.assertion; delete push.pending; pushDirty = true; }
  if (push.pending && !push.pending.confirmationReceiptId && push.pending.session === (input.session_id || null)
    && push.pending.turn !== (input.turn_id || null)) {
    push.pending.confirmationTurn = input.turn_id || null; push.pending.confirmationReceiptId = receipt.receiptId; pushDirty = true;
  }
  if (opts.write !== false) {
    if (pushDirty) writePush(root, push);
    writeTurn(root, input, state); observe(root, input, { sourceReceipt: receipt.receiptId });
  }
  // Real-host W1: a bare pointer left the model unable to start on a fresh
  // install. Give the ready command when a leaf exists, otherwise say how to start.
  const entry = chain.health.ok && chain.leaf && chain.stage
    ? `WorkIntent：要开工时单独运行 ${intentCommand({ sourceReceipt: receipt.receiptId, action: 'execute' })}；其他动作见 .claude/harness-lite/hooks/README.md`
    : `WorkIntent：sourceReceipt=${receipt.receiptId}；还没有可用的 current leaf，要开工或保存计划先看 .claude/harness-lite/hooks/README.md「开工前」`;
  return { kind: 'receipt', receipt,
    context: hookContext(root, chain, null, { ...opts, input, intentEntry: entry }) };
}
function shellSegments(command) {
  const out = []; let part = '', quote = null, escaped = false;
  for (let i = 0; i < String(command).length; i++) {
    const c = String(command)[i], n = String(command)[i + 1];
    if (escaped) { part += c; escaped = false; continue; }
    if (c === '\\' && quote !== "'") { part += c; escaped = true; continue; }
    if (quote) { part += c; if (c === quote) quote = null; continue; }
    if (c === "'" || c === '"') { quote = c; part += c; continue; }
    if (c === '#') { while (i < String(command).length && String(command)[i] !== '\n') i++; if (part.trim()) out.push(part.trim()); part = ''; continue; }
    if (c === ';' || c === '\n' || c === '|' || c === '&') {
      if (part.trim()) out.push(part.trim()); part = ''; if ((c === '|' || c === '&') && n === c) i++; continue;
    }
    part += c;
  }
  if (part.trim()) out.push(part.trim()); return out;
}
function tokens(segment) {
  const out = []; let value = '', quote = null, escaped = false;
  for (const c of segment.trim()) {
    if (escaped) { value += c; escaped = false; continue; }
    if (c === '\\' && quote !== "'") { escaped = true; continue; }
    if (quote) { if (c === quote) quote = null; else value += c; continue; }
    if (c === "'" || c === '"') { quote = c; continue; }
    if (/\s/.test(c)) { if (value) { out.push(value); value = ''; } } else value += c;
  }
  if (value) out.push(value); return quote ? [] : out;
}
function classifyPush(command) {
  let changedDirectory = false;
  for (const segment of shellSegments(command)) {
    const argv = tokens(segment); let at = 0;
    if (argv[0] === 'cd') { changedDirectory = true; continue; }
    const assignment = (value) => /^[A-Za-z_][A-Za-z0-9_]*=/.test(value || ''); let unsafeWrapper = false, prefixInexact = false;
    while (assignment(argv[at])) at++;
    while (true) {
      const base = path.basename(argv[at] || '');
      if (base === 'command' || base === 'exec') { at++; if (argv[at] === '--') at++; while (assignment(argv[at])) at++; continue; }
      if (base === 'sudo') { unsafeWrapper = true; at++; continue; }
      if (base === 'env') {
        at++; while (assignment(argv[at])) at++;
        while ((argv[at] || '').startsWith('-')) { const option = argv[at++]; prefixInexact = true; if (/^(?:-u|--unset|-C|--chdir|-S|--split-string)$/.test(option)) at++; while (assignment(argv[at])) at++; }
        if (argv[at] === '--') at++; continue;
      }
      break;
    }
    if (/^(?:sh|bash|zsh|eval)$/.test(path.basename(argv[at] || '')) && /\bgit\b[\s\S]*\bpush\b/i.test(argv.slice(at + 1).join(' '))) {
      return { command: segment, remote: null, refspec: null, exact: false };
    }
    if (!/(?:^|\/)git$/.test(argv[at] || '')) {
      if (/\$\([^)]*\bgit\b[^)]*\bpush\b|`[^`]*\bgit\b[^`]*\bpush\b/i.test(segment)) return { command: segment, remote: null, refspec: null, exact: false };
      continue;
    }
    if (argv[at + 1] !== 'push') {
      if (argv.slice(at + 1).includes('push')) return { command: segment, remote: null, refspec: null, exact: false };
      continue;
    }
    const rest = argv.slice(at + 2), values = rest.filter((x) => !x.startsWith('-'));
    const canonical = /^\+?HEAD:[^\s:]+$/.test(values[1] || '');
    return { command: segment, remote: values[0] || null, refspec: values[1] || null, canonical,
      exact: !unsafeWrapper && !prefixInexact && !changedDirectory && !rest.includes('--no-verify') && values.length === 2 && canonical };
  }
  return null;
}
function repoFacts(root) {
  const top = (work.git(root, ['rev-parse', '--show-toplevel']) || '').trim() || path.resolve(root);
  const head = (work.git(root, ['rev-parse', 'HEAD']) || '').trim() || null;
  return { repo: top, head };
}
const projectRoot = (cwd) => repoFacts(cwd).repo;
const deny = (reason) => ({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason } });
const allow = () => ({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'allow' } });
function pushDecisionReason(root, parsed, risk, userDecision = '是否允许这一次 push？') {
  const chain = tree.readChain(root), view = work.delegationView(root, chain, { write: false });
  const target = parsed?.remote && parsed?.refspec ? `${parsed.remote} ${parsed.refspec}` : '当前 push 命令';
  const gate = { action: '执行 git push', target,
    boundary: '既有 push gate 只允许一次、精确绑定本次目标的授权',
    risk: risk || '可能改变远端仓库历史或发布内容', userDecision };
  return `Harness push gate：${guidance.select(chain, view, { intent: 'push-attempt', gate }).text}`;
}
const BINDING_KEYS = ['project', 'head', 'remote', 'pushUrl', 'destinationRef', 'commandDigest', 'session', 'agentId', 'agentType'];
function pushBinding(root, input, parsed) {
  const facts = repoFacts(root);
  const pushUrl = (work.git(facts.repo, ['remote', 'get-url', '--push', parsed.remote]) || '').trim() || null;
  const destination = parsed.refspec.replace(/^\+/, '').split(':').pop();
  const binding = { project: facts.repo, head: facts.head, remote: parsed.remote, pushUrl,
    refspec: parsed.refspec, destinationRef: destination.startsWith('refs/') ? destination : `refs/heads/${destination}`,
    commandDigest: `sha256:${io.sha(parsed.command)}`, session: input.session_id || null, turn: input.turn_id || null,
    agentId: input.agent_id || null, agentType: input.agent_type || null };
  binding.pendingId = `p-${io.sha(JSON.stringify(BINDING_KEYS.map((key) => [key, binding[key]]))).slice(0, 20)}`;
  return binding;
}
const sameBinding = (value, binding) => !!value && BINDING_KEYS.every((key) => value[key] === binding[key]);
const INTENT_ACTIONS = Object.freeze(['execute', 'non-execution', 'revoke', 'pause', 'resume', 'exit']);
// Say what is missing and where to fix it, so a refusal is not a dead end.
const INTENT_REFUSAL_HINTS = Object.freeze({
  'intent:current': '还没有唯一的 current leaf 和对应 stage，先按 .claude/harness-lite/hooks/README.md「开工前」建好；只规划时写进 docs/harness/unfinished/',
  'intent:source': 'sourceReceipt 要用本轮 WorkIntent 行里的值',
  'intent:resume': 'resume 要求当前没有 current leaf，且 docs/harness/unfinished/ 里有唯一同名 leaf 和它的 stage',
  'intent:evidence': 'exit 要为每条完成标准给出项目内非空文件作证据',
  'intent:chain': 'docs/harness/ 里 leaf 或 stage 状态异常（例如多个 current），先查清再登记',
});
const intentDigest = (claim) => safeCanonicalDigest(claim);
function intentShape(claim) {
  if (!claim || typeof claim !== 'object' || Array.isArray(claim) || !INTENT_ACTIONS.includes(claim.action)
    || !/^u-[0-9a-f]{20}$/.test(claim.sourceReceipt || '')) return false;
  const extra = claim.action === 'pause' ? ['reason', 'resume'] : claim.action === 'resume' ? ['leaf']
    : claim.action === 'exit' ? ['evidence'] : [];
  const optional = claim.action === 'execute' && Object.hasOwn(claim, 'waitingForPush') ? ['waitingForPush'] : [];
  if (Object.keys(claim).sort().join(',') !== ['sourceReceipt', 'action', ...extra, ...optional].sort().join(',')) return false;
  if (claim.action === 'pause' && ![claim.reason, claim.resume].every((item) => typeof item === 'string' && item.trim() && item.length <= 1000)) return false;
  if (claim.action === 'resume' && (typeof claim.leaf !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/.test(claim.leaf))) return false;
  if (optional.length && !/^p-[0-9a-f]{20}$/.test(claim.waitingForPush)) return false;
  return claim.action !== 'exit' || Array.isArray(claim.evidence);
}
function intentCommand(claim) {
  return `node ".claude/harness-lite/hooks/dispatcher.js" --work-intent '${JSON.stringify(claim).replaceAll("'", "'\\''")}'`;
}
function intentRequest(command) {
  if (typeof command !== 'string' || !command.includes('--work-intent')) return { present: false };
  const segments = shellSegments(command), calls = segments.map(tokens);
  const present = calls.some((args) => path.basename(args[0] || '') === 'node'
    && args[1] === '.claude/harness-lite/hooks/dispatcher.js' && args.includes('--work-intent'));
  if (!present) return { present: false };
  const argv = segments.length === 1 ? calls[0] : [];
  const entry = argv.indexOf('--work-intent');
  let quote = null, escaped = false;
  for (const char of command) {
    if (escaped) { escaped = false; continue; }
    if (char === '\\' && quote !== "'") { escaped = true; continue; }
    if (quote === "'") { if (char === "'") quote = null; continue; }
    if (char === '$' || char === '`' || (!quote && /[;|&<>()\n\r#]/.test(char))) return { present: true, reason: 'intent:command' };
    if (char === quote) quote = null;
    else if (!quote && (char === "'" || char === '"')) quote = char;
  }
  if (quote || escaped || argv.length !== 4 || entry !== 2 || !['node', process.execPath].includes(argv[0])
    || argv[1] !== '.claude/harness-lite/hooks/dispatcher.js') return { present: true, reason: 'intent:command' };
  try { return { present: true, claim: JSON.parse(argv[3]) }; } catch { return { present: true, reason: 'intent:shape' }; }
}
function completionEvidence(root, chain, evidence) {
  const standards = chain.leaf?.completionStandards || [], seen = new Set(), rows = [];
  if (!standards.length || standards.includes(tree.UNKNOWN) || evidence.length !== standards.length) return null;
  for (const row of evidence) {
    if (!row || Object.keys(row).sort().join(',') !== 'evidenceRef,standard' || !standards.includes(row.standard)
      || seen.has(row.standard) || typeof row.evidenceRef !== 'string') return null;
    try {
      const file = io.safe(root, row.evidenceRef), base = path.resolve(root);
      // io.safe accepts "." as the root itself; evidence must be a file strictly inside the
      // project, which also guarantees the parent walk below reaches the root and stops.
      if (!file.startsWith(`${base}${path.sep}`)) return null;
      let parent = path.dirname(file);
      while (parent !== base) {
        const stat = fs.lstatSync(parent); if (!stat.isDirectory() || stat.isSymbolicLink()) return null;
        const next = path.dirname(parent); if (next === parent) return null; parent = next;
      }
      const stat = fs.lstatSync(file);
      if (!stat.isFile() || stat.isSymbolicLink() || !stat.size) return null;
      rows.push({ standard: row.standard, evidenceRef: row.evidenceRef, digest: `sha256:${io.sha(fs.readFileSync(file))}` });
      seen.add(row.standard);
    } catch { return null; }
  }
  return rows;
}
function registerIntent(root, input, claim) {
  root = path.resolve(root);
  if (!intentShape(claim)) return { ok: false, reason: 'intent:shape' };
  if (eventName(input) !== 'PreToolUse' || input.agent_id || input.agent_type) return { ok: false, reason: 'intent:origin' };
  const state = readTurn(root, input), receipt = state.receipt, source = state.userPromptSubmit, chain = tree.readChain(root);
  if (!receipt || receipt.receiptId !== claim.sourceReceipt || source?.origin !== 'user-prompt-submit'
    || source.receiptId !== receipt.receiptId || receipt.project !== root || source.project !== root
    || receipt.thread !== input.session_id || receipt.turn !== input.turn_id
    || source.session !== input.session_id || source.turn !== input.turn_id) return { ok: false, reason: 'intent:source' };
  if (finalizedSource(root, input, receipt.receiptId)) return { ok: false, reason: 'intent:finalized' };
  const at = Date.now(), start = Date.parse(state.startedAt);
  if (!authorization.canonicalIso(state.startedAt) || start > at || at >= start + authorization.MAX_LEASE_MS) return { ok: false, reason: 'intent:stale' };
  const digest = intentDigest(claim), leaf = chain.leaf ? path.relative(root, chain.leaf.file).replaceAll('\\', '/') : null;
  if (state.intent?.requestDigest === digest) {
    if (claim.action === 'execute' && (!authorization.validateStop(root, { ...input, stop_hook_active: false }, state, chain).ok
      || state.intent.leaf !== leaf)) return { ok: false, reason: 'intent:stale' };
    return { ok: true, replay: true, action: state.intent.action };
  }
  if (state.registrationOpen !== true && !['non-execution', 'revoke', 'pause', 'exit'].includes(claim.action)) return { ok: false, reason: 'intent:internal' };
  if (!chain.health.ok || !chain.plan) return { ok: false, reason: 'intent:chain' };
  if (state.leaf && (state.leaf !== leaf || state.stage !== chain.stage?.name)) return { ok: false, reason: 'intent:chain' };
  if (['execute', 'pause', 'exit'].includes(claim.action) && (!leaf || !chain.stage)) return { ok: false, reason: 'intent:current' };
  let resumed = null, evidenceRows = null;
  if (claim.action === 'resume') {
    const name = claim.leaf.replace(/\.md$/, '');
    const matches = chain.unfinished.filter((item) => item.name === name && item.type === 'leaf');
    if (chain.health.currentCount || matches.length !== 1 || !chain.stages.some((item) => item.name === matches[0].stageId)) return { ok: false, reason: 'intent:resume' };
    resumed = matches[0];
  }
  if (claim.action === 'exit') {
    evidenceRows = completionEvidence(root, chain, claim.evidence);
    if (!evidenceRows) return { ok: false, reason: 'intent:evidence' };
  }
  if (claim.waitingForPush) {
    const pending = readPush(root).pending;
    const facts = repoFacts(root);
    if (!pending || pending.pendingId !== claim.waitingForPush || pending.session !== input.session_id || pending.turn !== input.turn_id
      || pending.confirmationReceiptId || pending.project !== facts.repo || pending.head !== facts.head
      || !/^\+?HEAD:[^\s:]+$/.test(pending.refspec || '') || typeof pending.remote !== 'string'
      || (work.git(root, ['remote', 'get-url', '--push', pending.remote]) || '').trim() !== pending.pushUrl) {
      return { ok: false, reason: 'intent:push' };
    }
  }
  const currentAuthorization = authorization.read(root);
  if (!['missing', 'closed', 'active'].includes(currentAuthorization.kind)) return { ok: false, reason: `authorization:${currentAuthorization.kind}` };
  const nextIntent = { action: claim.action, sourceReceipt: receipt.receiptId, leaf, stage: chain.stage?.name || null,
    registeredAt: new Date().toISOString(), requestDigest: digest, ...(claim.waitingForPush ? { waitingForPush: claim.waitingForPush } : {}),
    ...(evidenceRows ? { evidence: evidenceRows } : {}) };
  let result = { ok: true };
  if (claim.action === 'execute') {
    state.intent = nextIntent; state.leaf = leaf; state.stage = chain.stage.name;
    const expiresAt = new Date(start + authorization.MAX_LEASE_MS).toISOString();
    const alreadyIssued = currentAuthorization.kind === 'active' && currentAuthorization.value.executionReceipt === receipt.receiptId
      && currentAuthorization.value.leaf === leaf && currentAuthorization.value.stage === chain.stage.name;
    if (alreadyIssued && !authorization.validateStop(root, { ...input, stop_hook_active: false }, state, chain).ok) return { ok: false, reason: 'intent:stale' };
    writeTurn(root, input, state);
    if (!alreadyIssued) result = authorization.issue(root, input, { expiresAt });
  } else {
    result = claim.action === 'non-execution' && currentAuthorization.kind === 'active'
      && currentAuthorization.value.executionReceipt !== receipt.receiptId ? { ok: true } : authorization.close(root);
    if (result.ok && claim.action === 'pause') result = tree.pause(root, claim.reason, claim.resume, { write: true });
    if (result.ok && claim.action === 'resume') result = tree.resume(root, path.basename(resumed.file), { write: true });
    if (result.ok && claim.action === 'exit') result = tree.exit(root, 'leaf', chain.leaf.name, { write: true });
    if (result.ok) {
      state.intent = nextIntent;
      if (claim.action === 'non-execution' || claim.action === 'revoke') state.registrationOpen = false;
      if (claim.action === 'resume') { state.leaf = `docs/harness/leaves/${path.basename(resumed.file)}`; state.stage = resumed.stageId; }
      if (claim.action === 'pause' || claim.action === 'exit') { state.leaf = null; state.stage = null; }
      writeTurn(root, input, state);
    }
  }
  return { ...result, action: claim.action };
}
function intentResult(root, claim) {
  if (!intentShape(claim)) return { ok: false, reason: 'intent:shape' };
  const observed = io.json(path.join(tree.hdir(root), 'usage', '.observed.json'), {}).events?.PreToolUse;
  if (observed?.decision !== 'allowed' || observed.intentDigest !== intentDigest(claim) || observed.sourceReceipt !== claim.sourceReceipt) {
    return { ok: false, reason: 'intent:host-event-required' };
  }
  const state = readTurn(root, { session_id: observed.session, turn_id: observed.turn });
  if (state.intent?.requestDigest !== observed.intentDigest || state.receipt?.receiptId !== claim.sourceReceipt) return { ok: false, reason: 'intent:stale' };
  const result = { ok: true, action: state.intent.action, leaf: state.intent.leaf, stage: state.intent.stage };
  return state.intent.action === 'exit' && stageClosed(root, state.intent.stage)
    ? { ...result, nextAction: stageCloseout(state.intent.stage, turnTestChanges(root, state)) } : result;
}
function turnTestChanges(root, state) {
  try {
    const before = state.baseline, after = work.snapshot(root);
    if (!before?.repo || !after?.repo) return [];
    return work.delta(before, after).changed.filter((file) => {
      if (!TEST_PATH.test(file) || file.startsWith('.claude/') || file.startsWith('docs/harness/')) return false;
      const was = before.files[file];
      if (!was) return true; // clean when the turn started, so the change is this turn's
      if (was.type === 'unknown' || !was.digest) return false; // cannot tell, so do not attribute it
      const now = io.inspect(root, file); // compare content, not git status: staging or committing the user's edit is not a change
      return now.type === 'missing' ? was.type !== 'missing' : now.digest !== was.digest;
    });
  } catch {
    return []; // only the named list is lost; the generic reason sentence stays
  }
}
function stageClosed(root, stage) {
  if (!stage) return false;
  try {
    const chain = tree.readChain(root);
    return chain.health.currentCount === 0 && !chain.unfinished.some((item) => item.type === 'leaf' && item.stageId === stage);
  } catch {
    return false; // the exit already happened; an unreadable chain only drops the close-out hint
  }
}
function pushAssert(root, claim) {
  const keys = Object.keys(claim || {}).sort();
  if (keys.join(',') !== 'confirmationTurn,pendingId,sessionId,userReceiptId') return { ok: false, reason: 'push-assert 只接受固定字段 pendingId/userReceiptId/sessionId/confirmationTurn' };
  const state = readPush(root), pending = state.pending;
  if (!pending || state.assertion) return { ok: false, reason: '没有等待确认的 push pending' };
  if (!pending.confirmationReceiptId) return { ok: false, reason: 'pending 之后还没有真实 user event' };
  const matched = claim.pendingId === pending.pendingId && claim.userReceiptId === pending.confirmationReceiptId
    && claim.sessionId === pending.session && claim.confirmationTurn === pending.confirmationTurn;
  if (!matched) return { ok: false, reason: 'assertion 与 pending 或紧随其后确认 turn 的真实 user event 不匹配' };
  const facts = repoFacts(root), pushUrl = (work.git(facts.repo, ['remote', 'get-url', '--push', pending.remote]) || '').trim() || null;
  if (facts.head !== pending.head || pushUrl !== pending.pushUrl) return { ok: false, reason: 'HEAD 或 push URL 已漂移；需要重新尝试 push 生成 pending' };
  state.assertion = { ...pending, userReceiptId: claim.userReceiptId, createdAt: new Date().toISOString(), preToolUsed: false, nativeUsed: false };
  writePush(root, state);
  return { ok: true, pendingId: pending.pendingId, confirmationTurn: pending.confirmationTurn };
}
function preTool(root, input) {
  if (input.tool_name !== 'Bash' || typeof input.tool_input?.command !== 'string') return null;
  const finish = (output, reason, extra = {}) => {
    observe(root, input, { decision: output?.hookSpecificOutput?.permissionDecision === 'deny' ? 'denied'
      : output?.hookSpecificOutput?.permissionDecision === 'allow' ? 'allowed' : 'unaffected', reason, ...extra });
    return output;
  };
  const request = intentRequest(input.tool_input.command);
  if (request.present) {
    const result = request.reason ? { ok: false, reason: request.reason } : registerIntent(root, input, request.claim);
    const reason = result.reason || result.message, hint = INTENT_REFUSAL_HINTS[reason];
    return finish(result.ok ? allow() : deny(`Harness work intent：${reason}；${hint ? `${hint}；` : ''}只拒绝本次内部登记，普通工具不受影响。`),
      result.ok ? `intent:${result.action}` : result.reason || 'intent:lifecycle',
      result.ok ? { intentDigest: intentDigest(request.claim), sourceReceipt: request.claim.sourceReceipt } : {});
  }
  const parsed = classifyPush(input.tool_input.command); if (!parsed) return finish(null, 'ordinary-tool');
  if (!parsed.exact) {
    // An inexact form never creates a pending record, so a user "yes" could not
    // authorize it; ask for the exact form instead of a dead-end confirmation.
    return finish(deny(pushDecisionReason(root, parsed, parsed.refspec && !parsed.canonical
      ? '命令不是受支持的精确 HEAD 到目标 ref 形式'
      : '命令形式无法精确绑定本次 push 目标',
    '暂不需要：这条命令无法被确认放行，先改用 git push <remote> HEAD:refs/heads/<分支> 精确形式，再请用户确认')), 'push:inexact');
  }
  const binding = pushBinding(root, input, parsed);
  if (!binding.head || !binding.pushUrl) return finish(deny(pushDecisionReason(root, parsed, `无法解析 HEAD 或 remote ${parsed.remote} 的 push URL`)), 'push:target');
  const current = readPush(root), assertion = current.assertion;
  if (assertion && !assertion.preToolUsed && assertion.confirmationTurn === (input.turn_id || null) && sameBinding(assertion, binding)) {
    assertion.preToolUsed = true; assertion.toolUseId = input.tool_use_id || null;
    writePush(root, current); return finish(allow(), 'push:authorized');
  }
  current.pending = { ...binding, attempt: Number(current.pending?.attempt || 0) + 1, createdAt: new Date().toISOString() };
  delete current.assertion; writePush(root, current);
  return finish(deny(pushDecisionReason(root, parsed, '本次目标尚未完成匹配的用户授权绑定')), 'push:authorization');
}
function stop(root, input, opts = {}) {
  const state = readTurn(root, input), after = work.snapshot(root), change = work.delta(state.baseline, after), chain = tree.readChain(root);
  const authorized = authorization.validateStop(root, input, state, chain);
  const tokenFiles = change.changed.filter((file) => !file.startsWith('docs/harness/usage/') && !file.startsWith('docs/harness/reports/'));
  const delegate = work.delegationView(root, chain, opts), semanticProgress = work.semanticProgressSince(delegate, state.startedAt);
  const heartbeatDue = delegate.summary.heartbeat.due || [];
  const progressKeys = semanticProgress.map(progressKey), consumed = new Set(state.consumedSemanticProgress || []);
  const newProgressKeys = progressKeys.filter((key) => !consumed.has(key));
  const verification = work.latestVerify(root, state.startedAt), token = io.sha(JSON.stringify({ leaf: chain.leaf?.name, semanticProgress: progressKeys }));
  const forbidden = tokenFiles.some((file) => (chain.forbidden || []).some((prefix) => file === prefix.replace(/\/$/, '') || file.startsWith(`${prefix.replace(/\/$/, '')}/`)));
  const progress = newProgressKeys.length > 0;
  const push = readPush(root), pushWaiting = !!state.intent?.waitingForPush && state.intent.waitingForPush === push.pending?.pendingId
    && push.pending.session === (input.session_id || null) && push.pending.turn === (input.turn_id || null)
    && !push.pending.confirmationReceiptId && repoFacts(root).head === push.pending.head
    && (work.git(root, ['remote', 'get-url', '--push', push.pending.remote]) || '').trim() === push.pending.pushUrl;
  const hostStopped = input.harness_lite_host === 'cursor' && ['aborted', 'error'].includes(input.status);
  const blocked = authorized.ok && !!chain.leaf && progress && state.lastStopToken !== token
    && !forbidden && !pushWaiting && !hostStopped && chain.health.ok && !!chain.plan;
  state.lastStopToken = token; state.events = [...new Set([...(state.events || []), 'Stop'])];
  if (blocked) {
    const reason = CONTINUATION_REASON;
    state.consumedSemanticProgress = [...new Set([...(state.consumedSemanticProgress || []), ...progressKeys])];
    state.continuations = [...new Set([...(state.continuations || []), io.sha(reason)])];
    if (opts.write !== false) writeTurn(root, input, state);
    observe(root, input, { decision: 'continued', reason: 'semantic-progress', write: opts.write });
    return { output: { decision: 'block', reason }, delta: change, delegation: delegate, heartbeatDue, state };
  }
  const stopReason = hostStopped ? `host:${input.status}` : !authorized.ok ? authorized.reason : !chain.health.ok || !chain.plan || !chain.leaf ? 'chain:unavailable'
    : forbidden ? 'forbidden-change' : pushWaiting ? 'push:waiting' : !progress ? 'no-semantic-progress' : 'repeated-progress';
  const shouldReport = change.changed.some((file) => !file.startsWith('docs/harness/usage/')
    && !file.startsWith('docs/harness/reports/') && file !== 'docs/harness/verify.jsonl') || !!verification || semanticProgress.length > 0 || heartbeatDue.length > 0;
  const next = progress ? '等待 supervisor 验收；只有 accepted 解锁依赖'
    : verification ? 'verify/file/head 只作为 activity/report，不冒充 semantic progress'
      : heartbeatDue.length ? `heartbeat due：只读提醒 ${heartbeatDue.join('、')}`
      : chain.leaf ? '等待下一轮真实进展' : 'stage 停点，等待用户验收';
  const r = shouldReport ? work.report(root, { chain, delta: change, verification, delegation: delegate, next },
  { write: opts.write !== false, id: `${cleanId(input.session_id)}-${cleanId(input.turn_id)}` }) : null;
  const u = work.appendUsage(root, { session: input.session_id, turn: input.turn_id, receipt: state.receipt || null,
    events: state.events, files: r?.productChanges.length || 0, outOfScope: r?.outOfScope ?? null, verify: verification?.summary }, { write: opts.write !== false });
  observe(root, input, { decision: 'not-continued', reason: stopReason, sourceReceipt: state.receipt?.receiptId, write: opts.write });
  if (opts.write !== false) {
    const lease = authorization.read(root);
    if (lease.kind === 'active' && lease.value.executionReceipt === state.receipt?.receiptId) authorization.close(root);
  }
  if (opts.write !== false) try { fs.unlinkSync(turnFile(root, input)); } catch { /* no turn */ }
  return { output: {}, delta: change, delegation: delegate, heartbeatDue, report: r, usage: u, state };
}
const SECRET = /-----BEGIN [A-Z ]*PRIVATE KEY-----|\bAKIA[0-9A-Z]{16}\b|\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|sk-(?:proj-)?[A-Za-z0-9_-]{20,})\b/;
function scanRefs(root, input) {
  const zero = /^0+$/;
  for (const line of String(input).trim().split(/\r?\n/).filter(Boolean)) {
    const parts = line.trim().split(/\s+/); if (parts.length !== 4) return false;
    const [, local, , remote] = parts; if (zero.test(local)) continue;
    const range = zero.test(remote) ? local : `${remote}..${local}`;
    const log = spawnSync('/usr/bin/git', ['log', '--format=', '-p', '-U0', '--no-ext-diff', '--diff-merges=first-parent', range], { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
      env: { PATH: '/usr/bin:/bin', LANG: 'C', LC_ALL: 'C' } });
    if (log.status !== 0 || log.stdout.split('\n').some((row) => /^\+[^+]/.test(row) && SECRET.test(row))) return false;
  }
  return true;
}
function nativePrePush(root, remote, url, refs) {
  const marker = io.json(path.join(root, '.codex', 'harness-lite', 'native.json'), null);
  if (!marker?.configured) return { ok: true, bypassed: true };
  if (!require('./install.js').verify06(root).ok) return { ok: false, reason: '已声明 Harness Lite 当前 runtime 但 identity 损坏，fail closed' };
  const state = readPush(root), assertion = state.assertion, facts = repoFacts(root);
  if (!assertion || !assertion.preToolUsed || assertion.nativeUsed || assertion.project !== facts.repo || assertion.head !== facts.head
    || assertion.remote !== remote || assertion.pushUrl !== (url || assertion.pushUrl)) return { ok: false, reason: '没有匹配的一次性 push assertion' };
  const lines = String(refs).trim().split(/\r?\n/).filter(Boolean);
  if (lines.length !== 1 || lines[0].trim().split(/\s+/).length !== 4) return { ok: false, reason: 'native ref 与 push assertion 不匹配' };
  const parts = lines[0].trim().split(/\s+/), localOid = parts[1], remoteRef = parts[2];
  if (localOid !== assertion.head || remoteRef !== assertion.destinationRef) return { ok: false, reason: 'native local OID 或 remote ref 与 push assertion 漂移' };
  if (!scanRefs(root, refs)) return { ok: false, reason: '待推提交不可读或含高置信密钥' };
  assertion.nativeUsed = true; writePush(root, state); return { ok: true };
}
function dispatch(root, input, opts = {}) {
  const event = eventName(input);
  if (event === 'SessionStart') return sessionStart(root, input, opts);
  if (event === 'UserPromptSubmit') { const result = userPrompt(root, input, opts); return result.context ? { hookSpecificOutput: { hookEventName: event, additionalContext: result.context } } : {}; }
  if (event === 'Stop') return stop(root, input, opts).output;
  if (event === 'PreToolUse') return preTool(root, input);
  return {};
}

module.exports = { CONTINUATION_REASON, turnDir, turnFile, readTurn, writeTurn, observe, sessionStart, userPrompt, hookContext, hookParallelWorkUnitLines, readPush,
  INTENT_ACTIONS, intentCommand, intentRequest, registerIntent, intentResult,
  shellSegments, tokens, classifyPush, projectRoot, pushBinding, pushAssert, preTool, stop, scanRefs, nativePrePush, dispatch };
