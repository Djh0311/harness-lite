'use strict';

const assert = require('assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const test = require('node:test');

const builder = require('../scripts/build-candidate.js');
const capabilities = require('../lib/capabilities.js');
const install = require('../lib/install.js');

const sourceRoot = path.resolve(__dirname, '..');
const manifestRel = '.codex/harness-lite/capabilities.json';
const rejectedR2Digest = 'sha256:285fffb4a7f873d0a9959f7a04eabcc2d57c4f6ad5d28894619463da3083e558';
const frozenR01R18Digest = 'sha256:1a69fc8dbbef7304938b9da1f20af9daf47f6b24b131b6d8861c8c906d66a719';

function sha(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function tempRoot(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

// The candidate intentionally excludes mutable local lifecycle documents.  This
// helper creates the smallest self-contained disposable lifecycle tree needed by
// the chain/authority assertions, so source and materialized runs exercise the
// same contract without changing real docs/harness files.
function writeLifecycleFixture(root) {
  const harness = path.join(root, 'docs', 'harness');
  fs.mkdirSync(path.join(harness, 'stages'), { recursive: true });
  fs.mkdirSync(path.join(harness, 'leaves'), { recursive: true });
  fs.mkdirSync(path.join(harness, 'reports'), { recursive: true });
  const nextSource = fs.readFileSync(path.join(sourceRoot, 'NEXT-VERSION-DISPATCH-PLAN.md'), 'utf8');
  const baselineHeading = '## 一、冻结的需求基线';
  const nextInsert = [
    '当前唯一 active stage 是 `stage-hlnext-repair-r3`。',
    'authoritative current leaf 只以 `docs/harness/leaves/HLNEXT-REPAIR-R3.md` 为准。',
    'R3 当前尚未 PASS；不预写 R3 PASS。',
    '',
  ].join('\n');
  const nextAt = nextSource.indexOf(baselineHeading);
  assert.notEqual(nextAt, -1, 'candidate NEXT plan must retain the frozen baseline heading');
  // Keep the candidate's frozen body byte-for-byte unchanged; only the
  // disposable lifecycle preamble supplies the historical R3 top assertions.
  fs.writeFileSync(path.join(root, 'NEXT-VERSION-DISPATCH-PLAN.md'), `${nextSource.slice(0, nextAt)}${nextInsert}${nextSource.slice(nextAt)}`);
  fs.writeFileSync(path.join(harness, 'plan.md'), [
    '# R3 lifecycle fixture',
    '',
    '目标：验证 current lifecycle chain',
    '',
    '<!-- REQUIREMENT-BASELINE:BEGIN -->',
    '确认来源：R38 disposable lifecycle fixture',
    '',
    '- 只验证 current stage、leaf 和 plan review 的绑定。',
    '<!-- REQUIREMENT-BASELINE:END -->',
    '',
    '阶段：',
    '',
    '- [ ] `stage-hlnext-repair-r3` — disposable current stage。',
    '',
    'current leaf `HLNEXT-REPAIR-R3`。',
  ].join('\n') + '\n');
  fs.writeFileSync(path.join(harness, 'stages', 'stage-hlnext-repair-r3.md'), [
    '# R3 disposable stage',
    '',
    '目标：验证 current lifecycle chain',
    '',
    '相关权威设计：',
    '',
    '- R38 lifecycle chain contract',
    '',
    '相关现有实现：',
    '',
    '- tree.readChain',
    '',
    '必须保持的架构边界：',
    '',
    '- disposable root only',
    '',
    '不许动：',
    '',
    '- push',
    '- release',
  ].join('\n') + '\n');
  fs.writeFileSync(path.join(harness, 'leaves', 'HLNEXT-REPAIR-R3.md'), [
    '# R3 disposable current leaf',
    '',
    '阶段：stage-hlnext-repair-r3',
    '目标：验证 current lifecycle chain',
    '来源收据：R38 disposable fixture',
    '产品：lifecycle chain only',
    '证据：tree.readChain and plan review binding',
    '载体：disposable root',
    '',
    '允许动：',
    '',
    '- disposable docs/harness only',
    '',
    '不许动：',
    '',
    '- real docs/harness',
    '- push',
    '',
    '完成标准：',
    '',
    '- current stage and leaf resolve without conflicts',
  ].join('\n') + '\n');
  const tree = require('../lib/tree.js');
  const authority = tree.readChain(root).authority;
  assert.equal(authority.status, 'current');
  fs.writeFileSync(path.join(harness, 'reports', 'plan-review.md'), [
    '# R38 disposable plan review',
    '',
    '复核类型：plan',
    `需求基线摘要：${authority.digest}`,
    `完整计划摘要：${authority.planDigest}`,
    '结论：PASS',
  ].join('\n') + '\n');
}

function run(command, args, opts = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, ...opts });
  assert.equal(result.status, 0, `${command} ${args.join(' ')}\n${result.stderr || result.stdout}`);
  return result;
}

function materializeCandidateSource() {
  const candidate = builder.buildCandidate(sourceRoot);
  const summary = builder.summarize(candidate);
  assert.notEqual(summary.candidateDigest, rejectedR2Digest);

  const root = tempRoot('hl-r3f03-source-');
  for (const row of candidate.files) {
    const target = path.join(root, row.path);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, Buffer.from(row.contentBase64, 'base64'));
    fs.chmodSync(target, parseInt(row.mode, 8));
  }

  const rematerialized = builder.buildCandidate(root);
  assert.equal(builder.artifactText(rematerialized), builder.artifactText(candidate));
  assert.deepEqual(builder.summarize(rematerialized), summary);
  return { root, summary };
}

function installFreshProject(source, prefix = 'hl-r3f03-project-') {
  const root = tempRoot(prefix);
  writeHarnessState(root, [{ id: 'R3F30', goal: 'dispatch current capability', writeScope: ['lib/capabilities.js'] }]);
  const result = install.install(root, { write: true, source });
  assert.equal(result.status, 'INSTALLED', JSON.stringify(result.differences || []));
  const checked = require(path.join(root, install.RUNTIME, 'lib/install.js')).verify06(root);
  assert.equal(checked.ok, true, JSON.stringify(checked.differences || []));
  return root;
}

function writeProjectManifest(root, models = threeProjectModels()) {
  const file = path.join(root, manifestRel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify({ schemaVersion: 1, kind: capabilities.KIND, models }, null, 2)}\n`);
}

function threeProjectModels() {
  return [
    { channel: 'project-cursor', model: 'Project Grok', reasoning: 'high', family: 'grok', status: 'available' },
    { channel: 'project-antigravity', model: 'Project Gemini', reasoning: 'high', family: 'gemini', status: 'available' },
    { channel: 'project-codex', model: 'Project Terra', reasoning: 'xhigh', family: 'terra', status: 'unavailable' },
  ];
}

function exactFiveModels() {
  return [
    { channel: 'cursor', model: 'Grok 4.6 High', reasoning: 'high', family: 'grok', status: 'available', capabilities: ['engineering'] },
    { channel: 'grokbuild', model: 'Grok 4.6 High', reasoning: 'high', family: 'grok', status: 'available', capabilities: ['build'] },
    { channel: 'antigravity', model: 'Gemini 3.7 Flash High', reasoning: 'high', family: 'gemini', status: 'available', capabilities: ['frontend'] },
    { channel: 'codex', model: 'gpt-5.6-terra', reasoning: 'xhigh', family: 'terra', status: 'available', capabilities: ['recovery'] },
    { channel: 'codex', model: 'gpt-5.6-sol', reasoning: 'xhigh', family: 'sol', status: 'available', capabilities: ['recovery'] },
  ];
}

function manyModels(count) {
  const families = ['grok', 'gemini', 'terra', 'sol'];
  return Array.from({ length: count }, (_, index) => ({
    channel: `channel-${String(index).padStart(2, '0')}`,
    model: `Model ${String(index).padStart(2, '0')}`,
    reasoning: index % 2 === 0 ? 'high' : 'xhigh',
    family: families[index % families.length],
    status: index % 5 === 0 ? 'unavailable' : 'available',
    capabilities: [`cap-${index}`],
  }));
}

function hookManifest(models, extra = {}) {
  return { schemaVersion: 1, kind: capabilities.KIND, ...extra, models };
}

function dispatchInstalled(root, input) {
  for (const key of ['work_unit', 'workUnit', 'work_unit_id', 'workUnitId', 'harness_lite_work_unit']) {
    assert.equal(Object.hasOwn(input, key), false, key);
  }
  const result = run(process.execPath, [path.join(root, install.RUNTIME, 'hooks/dispatcher.js')], {
    cwd: root,
    input: `${JSON.stringify(input)}\n`,
  });
  return JSON.parse(result.stdout).hookSpecificOutput.additionalContext;
}

function carrierRel(context) {
  const line = String(context).split('\n').find((row) => row.startsWith('CapabilityCarrier：') && row.includes('read=project-relative-json'));
  assert.ok(line, context);
  return line.split('path=')[1].split('；')[0];
}

function readCarrierInFreshProcess(root, rel) {
  const script = `
const fs = require("fs");
const path = require("path");
const rel = process.argv[1];
if (path.isAbsolute(rel) || rel.split(/[\\\\/]/).includes("..")) throw new Error("unsafe rel");
const value = JSON.parse(fs.readFileSync(path.join(process.cwd(), rel), "utf8"));
process.stdout.write(JSON.stringify({
  schemaVersion: value.schemaVersion,
  kind: value.kind,
  source: value.source,
  sourceType: value.sourceType,
  eventName: value.eventName,
  sessionId: value.sessionId,
  turnId: value.turnId,
  modelCount: value.modelCount,
  modelFields: value.modelFields,
  sourceDigest: value.sourceDigest,
  sourceBytes: value.sourceBytes,
  projectionDigest: value.projectionDigest,
  freshness: value.freshness,
  models: value.projection.models.map((model) => ({
    channel: model.channel,
    model: model.model,
    reasoning: model.reasoning,
    family: model.family,
    status: model.status,
    availability: model.availability.status,
    capabilities: model.capabilities,
    suitability: model.suitability
  }))
}));
`;
  return JSON.parse(run(process.execPath, ['-e', script, rel], { cwd: root }).stdout);
}

function assertHookCarrierContext(context, count) {
  assert.equal(context.length <= 1800, true, context.length);
  assert.ok(context.includes('Capabilities：state=known'), context);
  assert.ok(context.includes(`modelsComplete=true；modelCount=${count}；source=hook-input；carrier=project-relative-json:`), context);
  assert.ok(context.includes(`CapabilityModelsCarrier：carrierBacked=${count}/${count}；carrier=project-relative-json:`), context);
  assert.ok(context.includes(`CapabilityCarrier：complete=true；modelsComplete=true；modelCount=${count}；incomplete=none`), context);
  assert.equal(context.includes(`shown=0/${count}`), false, context);
  assert.equal(context.includes('embedded-projection:embedded'), false, context);
  assert.equal(context.includes('CapabilityModelsInline'), false, context);
}

function assertCarrier(carrier, models, eventName) {
  assert.equal(carrier.schemaVersion, 1);
  assert.equal(carrier.kind, capabilities.CARRIER_KIND);
  assert.equal(carrier.source, 'hook-input');
  assert.equal(carrier.sourceType, 'hook-input');
  assert.equal(carrier.eventName, eventName);
  assert.equal(carrier.modelCount, models.length);
  assert.deepEqual(carrier.modelFields, capabilities.MODEL_FIELDS);
  assert.equal(carrier.sourceDigest, `sha256:${sha(JSON.stringify(hookManifest(models)))}`);
  assert.match(carrier.projectionDigest, /^sha256:[0-9a-f]{64}$/);
  assert.equal(carrier.freshness.status, 'fresh');
  assert.equal(carrier.freshness.ttlMs, capabilities.DYNAMIC_CARRIER_TTL_MS);
  assert.equal(Date.parse(carrier.freshness.expiresAt) > Date.parse(carrier.freshness.createdAt), true);
  assert.equal(carrier.models.length, models.length);
}

function workUnitSection(id, goal, writeScope, dependencies = []) {
  return [
    `## Work Unit ${id}`,
    '',
    `goal: ${goal}`,
    '',
    'directAcceptance:',
    '',
    `- ${id}-direct-acceptance`,
    '',
    'allowed:',
    '',
    ...writeScope.map((item) => `- ${item}`),
    '',
    'forbidden:',
    '',
    '- push',
    '- release',
    '',
    'facts:',
    '',
    `- ${id}-fact`,
    '',
    'entryPoints:',
    '',
    '- installed dispatcher',
    '- installed work.parallelWorkUnitContext',
    '',
    'disprovenRoutes:',
    '',
    '- helper-only',
    '',
    'unknowns:',
    '',
    '- none',
    '',
    `routeBasis: ${id}-route-basis`,
    '',
    'dependencies:',
    '',
    ...(dependencies.length ? dependencies.map((item) => `- ${item}`) : ['- 无']),
    '',
    `resultContract: ${id}-COMPLETE-PARTIAL-BLOCKED`,
    '',
  ].join('\n');
}

function writeHarnessState(root, units) {
  fs.mkdirSync(path.join(root, 'docs/harness/stages'), { recursive: true });
  fs.mkdirSync(path.join(root, 'docs/harness/leaves'), { recursive: true });
  fs.writeFileSync(path.join(root, 'docs/harness/plan.md'), '# R3F03 Plan\n\n目标：joined runtime acceptance\n');
  fs.writeFileSync(path.join(root, 'docs/harness/stages/stage-r3f03.md'), [
    '# Stage R3F03',
    '',
    '目标：joined runtime acceptance',
    '',
    '不许动：',
    '',
    '- push',
    '- release',
    '- provider adapter',
  ].join('\n'));
  fs.writeFileSync(path.join(root, 'docs/harness/leaves/R3F03.md'), [
    '# R3F03 Leaf',
    '',
    '阶段：stage-r3f03',
    '',
    '目标：fresh project joined runtime',
    '',
    '完成标准：',
    '',
    '- joined runtime projects only event-relevant state',
    '',
    '相关权威设计：',
    '',
    '- dynamic capability and parallel work contract',
    '',
    '允许动：',
    '',
    '- lib/hook.js',
    '- lib/work.js',
    '- test/r3-joined-runtime.test.js',
    '',
    '不许动：',
    '',
    '- push',
    '- release',
    '- provider adapter',
    '',
    ...units.map((unit) => workUnitSection(unit.id, unit.goal, unit.writeScope, unit.dependencies || [])),
  ].join('\n'));
}

function recordInstalled(root, event, at) {
  const script = `
const fs = require("fs");
const delegation = require("./.claude/harness-lite/lib/delegation.js");
const event = JSON.parse(fs.readFileSync(0, "utf8"));
const result = delegation.recordAgentStatus(process.cwd(), event, { at: process.argv[1] });
process.stdout.write(JSON.stringify(result));
process.exit(result.ok ? 0 : 1);
`;
  return JSON.parse(run(process.execPath, ['-e', script, at], { cwd: root, input: JSON.stringify(event) }).stdout);
}

function recordRecoveryInstalled(root, method, event, at) {
  assert.ok(['recordAgentFailure', 'recordAgentRecovery'].includes(method), method);
  const script = `
const fs = require("fs");
const delegation = require("./.claude/harness-lite/lib/delegation.js");
const event = JSON.parse(fs.readFileSync(0, "utf8"));
const result = delegation[process.argv[1]](process.cwd(), event, { at: process.argv[2] });
process.stdout.write(JSON.stringify(result));
process.exit(result.ok ? 0 : 1);
`;
  return JSON.parse(run(process.execPath, ['-e', script, method, at], { cwd: root, input: JSON.stringify(event) }).stdout);
}

function readParallelContextInFreshProcess(root, now = '2026-01-01T00:00:00.000Z') {
  const script = `
const work = require("./.claude/harness-lite/lib/work.js");
process.stdout.write(JSON.stringify(work.parallelWorkUnitContext(process.cwd(), { now: process.argv[1] })));
`;
  return JSON.parse(run(process.execPath, ['-e', script, now], { cwd: root }).stdout);
}

function scanInstalledRuntimeForForbiddenSurface(root) {
  const runtime = path.join(root, install.RUNTIME);
  return install.CURRENT_REQUIRED_RUNTIME_PATHS.filter((rel) => rel.endsWith('.js'))
    .map((rel) => fs.readFileSync(path.join(runtime, rel), 'utf8')
      .replace(/const (?:PREVIOUS_10_)?INSTRUCTION = `<!-- HARNESS-LITE:BEGIN -->[\s\S]*?<!-- HARNESS-LITE:END -->`;/g,
        'const INSTRUCTION = "<policy text omitted>";')).join('\n');
}

test('R3F03 candidate artifact fresh source and installed dispatcher preserve exact five Hook-input models', () => {
  const source = materializeCandidateSource();
  const project = installFreshProject(source.root);
  try {
    writeProjectManifest(project);
    const manifest = hookManifest(exactFiveModels());
    const contexts = [
      ['SessionStart', dispatchInstalled(project, {
        hook_event_name: 'SessionStart',
        cwd: project,
        session_id: 'r3f03-five-session',
        capability_manifest: manifest,
      })],
      ['UserPromptSubmit', dispatchInstalled(project, {
        hook_event_name: 'UserPromptSubmit',
        cwd: project,
        session_id: 'r3f03-five-session',
        turn_id: 'r3f03-five-turn',
        prompt: 'R3F03 exact five model carrier',
        capability_manifest: manifest,
      })],
    ];

    for (const [eventName, context] of contexts) {
      assertHookCarrierContext(context, 5);
      assert.equal(context.includes('modelCount=3；source=.codex/harness-lite/capabilities.json'), false, context);

      const carrier = readCarrierInFreshProcess(project, carrierRel(context));
      assertCarrier(carrier, exactFiveModels(), eventName);
      assert.deepEqual(carrier.models, [
        { channel: 'antigravity', model: 'Gemini 3.7 Flash High', reasoning: 'high', family: 'gemini', status: 'available', availability: 'available', capabilities: ['frontend'], suitability: ['frontend'] },
        { channel: 'codex', model: 'gpt-5.6-sol', reasoning: 'xhigh', family: 'sol', status: 'available', availability: 'available', capabilities: ['recovery'], suitability: ['problem-recovery'] },
        { channel: 'codex', model: 'gpt-5.6-terra', reasoning: 'xhigh', family: 'terra', status: 'available', availability: 'available', capabilities: ['recovery'], suitability: ['problem-recovery'] },
        { channel: 'cursor', model: 'Grok 4.6 High', reasoning: 'high', family: 'grok', status: 'available', availability: 'available', capabilities: ['engineering'], suitability: ['engineering'] },
        { channel: 'grokbuild', model: 'Grok 4.6 High', reasoning: 'high', family: 'grok', status: 'available', availability: 'available', capabilities: ['build'], suitability: ['engineering'] },
      ]);
    }
  } finally {
    fs.rmSync(project, { recursive: true, force: true });
    fs.rmSync(source.root, { recursive: true, force: true });
  }
});

test('R3F03 installed dispatcher keeps twenty-four-model carriers complete and fails oversized Hook input closed', () => {
  const source = materializeCandidateSource();
  const project = installFreshProject(source.root, 'hl-r3f03-24-project-');
  try {
    const models24 = manyModels(24);
    const manifest24 = hookManifest(models24);
    const start24 = dispatchInstalled(project, {
      hook_event_name: 'SessionStart',
      cwd: project,
      session_id: 'r3f03-24-session',
      capability_manifest: manifest24,
    });
    const prompt24 = dispatchInstalled(project, {
      hook_event_name: 'UserPromptSubmit',
      cwd: project,
      session_id: 'r3f03-24-session',
      turn_id: 'r3f03-24-turn',
      prompt: 'R3F03 twenty-four model carrier',
      capability_manifest: manifest24,
    });

    for (const [eventName, context] of [['SessionStart', start24], ['UserPromptSubmit', prompt24]]) {
      assertHookCarrierContext(context, 24);
      const carrier = readCarrierInFreshProcess(project, carrierRel(context));
      assertCarrier(carrier, models24, eventName);
      assert.equal(carrier.models.length, 24);
    }

    const rel24 = carrierRel(start24);
    const carrier24 = readCarrierInFreshProcess(project, rel24);
    const models25 = [...models24, {
      channel: 'channel-24',
      model: 'Model 24',
      reasoning: 'xhigh',
      family: 'sol',
      status: 'available',
      capabilities: ['cap-24'],
    }];
    const changedContext = dispatchInstalled(project, {
      hook_event_name: 'SessionStart',
      cwd: project,
      session_id: 'r3f03-24-session',
      capability_manifest: hookManifest(models25),
    });
    const changedCarrier = readCarrierInFreshProcess(project, carrierRel(changedContext));
    assert.notEqual(carrierRel(changedContext), rel24);
    assert.notEqual(changedCarrier.sourceDigest, carrier24.sourceDigest);
    assert.notEqual(changedCarrier.projectionDigest, carrier24.projectionDigest);
    assert.equal(changedCarrier.modelCount, 25);

    const shrunkContext = dispatchInstalled(project, {
      hook_event_name: 'SessionStart',
      cwd: project,
      session_id: 'r3f03-24-session',
      capability_manifest: hookManifest(models25.slice(1)),
    });
    const shrunkCarrier = readCarrierInFreshProcess(project, carrierRel(shrunkContext));
    assert.notEqual(carrierRel(shrunkContext), carrierRel(changedContext));
    assert.notEqual(shrunkCarrier.sourceDigest, changedCarrier.sourceDigest);
    assert.notEqual(shrunkCarrier.projectionDigest, changedCarrier.projectionDigest);
    assert.equal(shrunkCarrier.modelCount, 24);

    const oversize = dispatchInstalled(project, {
      hook_event_name: 'UserPromptSubmit',
      cwd: project,
      session_id: 'r3f03-oversize-session',
      turn_id: 'r3f03-oversize-turn',
      prompt: 'R3F03 oversize fail closed',
      capability_manifest: hookManifest(exactFiveModels(), { padding: 'x'.repeat(capabilities.MAX_HOOK_INPUT_BYTES) }),
    });
    assert.equal(oversize.length <= 1800, true, oversize.length);
    assert.ok(oversize.includes('Capabilities：state=UNKNOWN'), oversize);
    assert.ok(oversize.includes('source=hook-input'), oversize);
    assert.ok(oversize.includes('complete=false；modelsComplete=false；modelCount=0；incomplete=hook-input-manifest-too-large'), oversize);
    assert.equal(oversize.includes('CapabilityCarrier：complete=true'), false, oversize);
    assert.equal(oversize.includes('read=project-relative-json'), false, oversize);
  } finally {
    fs.rmSync(project, { recursive: true, force: true });
    fs.rmSync(source.root, { recursive: true, force: true });
  }
});

test('R3F03 fresh install exposes parallel work-unit context, accepted-only unlock, missing UNKNOWN, and conflicts', () => {
  const source = materializeCandidateSource();
  const project = tempRoot('hl-r3f03-work-project-');
  try {
    writeHarnessState(project, [
      { id: 'R3F31', goal: 'first independent active goal', writeScope: ['src/alpha.js'] },
      { id: 'R3F32', goal: 'second independent active goal', writeScope: ['src/beta.js'] },
      { id: 'R3F33', goal: 'reported upstream gate', writeScope: ['src/gamma.js'] },
      { id: 'R3F34', goal: 'dependent waits for accepted only', writeScope: ['src/delta.js'], dependencies: ['R3F33'] },
      { id: 'R3F35', goal: 'third independent active goal', writeScope: ['src/epsilon.js'] },
    ]);
    const installed = install.install(project, { write: true, source: source.root });
    assert.equal(installed.status, 'INSTALLED', JSON.stringify(installed.differences || []));

    recordInstalled(project, {
      id: 'r3f31-active',
      workUnit: 'R3F31',
      status: 'active',
      writeScope: ['src/alpha.js'],
      channel: 'cursor',
      model: 'Grok 4.6 High',
      modelFamily: 'grok',
      reasoning: 'high',
    }, '2026-01-01T00:00:00.000Z');
    recordInstalled(project, {
      id: 'r3f32-active',
      workUnit: 'R3F32',
      status: 'active',
      writeScope: ['src/beta.js'],
      channel: 'grokbuild',
      model: 'Grok 4.6 High',
      modelFamily: 'grok',
      reasoning: 'high',
    }, '2026-01-01T00:00:01.000Z');
    recordInstalled(project, {
      id: 'r3f31-activity',
      workUnit: 'R3F31',
      kind: 'activity',
      activityKind: 'tool-wait',
    }, '2026-01-01T00:00:02.000Z');
    recordInstalled(project, {
      id: 'r3f31-progress',
      workUnit: 'R3F31',
      kind: 'progress',
      progressKind: 'verified-fact',
      evidenceRef: 'reports/r3f31-fact.md',
    }, '2026-01-01T00:00:03.000Z');
    recordInstalled(project, {
      id: 'r3f33-report',
      workUnit: 'R3F33',
      status: 'reported_complete',
      writeScope: ['src/gamma.js'],
      channel: 'antigravity',
      model: 'Gemini 3.7 Flash High',
      modelFamily: 'gemini',
      reasoning: 'high',
    }, '2026-01-01T00:00:04.000Z');
    recordInstalled(project, {
      id: 'r3f34-waiting',
      workUnit: 'R3F34',
      status: 'rejected',
      dependencies: ['R3F33'],
      writeScope: ['src/delta.js'],
    }, '2026-01-01T00:00:05.000Z');

    const context = dispatchInstalled(project, {
      hook_event_name: 'SessionStart',
      cwd: project,
      session_id: 'r3f03-work-session',
    });
    assert.equal(context.length <= 1800, true, context.length);
    assert.equal(context.includes('Capabilities：'), false, context);
    assert.ok(context.includes('ParallelWorkUnitsCarrier：complete=complete；inline=false；truncated=false；count=2；ids=R3F31,R3F32；'), context);
    assert.ok(context.includes('Heartbeat：read-only；intervalMs=300000'), context);
    assert.ok(context.includes('Dependencies：R3F34<-R3F33:reported_complete'), context);
    assert.ok(context.includes('Heartbeat：read-only；intervalMs=300000'), context);

    let parallel = readParallelContextInFreshProcess(project);
    assert.equal(parallel.acceptedOnlyUnlock, true);
    assert.deepEqual(parallel.waiting, [{ id: 'R3F34', blockers: [{ id: 'R3F33', status: 'reported_complete', accepted: false }] }]);
    assert.equal(parallel.runnable.includes('R3F34'), false);

    recordInstalled(project, {
      id: 'r3f33-accepted',
      workUnit: 'R3F33',
      status: 'accepted',
      evidenceRef: 'reports/r3f33-accepted.md',
    }, '2026-01-01T00:00:06.000Z');
    parallel = readParallelContextInFreshProcess(project);
    assert.deepEqual(parallel.waiting, []);
    assert.equal(parallel.runnable.includes('R3F34'), true);
    assert.equal(parallel.accepted.includes('R3F33'), true);

    recordInstalled(project, {
      id: 'r3f35-active',
      workUnit: 'R3F35',
      status: 'active',
      dependencies: [],
      writeScope: ['src/epsilon.js'],
      channel: 'codex',
      model: 'gpt-5.6-terra',
      modelFamily: 'terra',
      reasoning: 'xhigh',
    }, '2026-01-01T00:00:07.000Z');
    const threeActiveContext = dispatchInstalled(project, {
      hook_event_name: 'UserPromptSubmit',
      cwd: project,
      session_id: 'r3f03-work-session',
      turn_id: 'r3f03-work-turn',
      prompt: 'R3F03 three active units',
    });
    assert.ok(threeActiveContext.includes('ParallelWorkUnitsCarrier：complete=complete；inline=false；truncated=false；count=3；ids=R3F31,R3F32,R3F35；ref='), threeActiveContext);
    const threeActive = readParallelContextInFreshProcess(project);
    assert.deepEqual(threeActive.active, ['R3F31', 'R3F32', 'R3F35']);
    assert.equal(threeActive.units.length, 3);
    assert.equal(threeActive.units.find((unit) => unit.id === 'R3F35').agent.model, 'gpt-5.6-terra');
    assert.equal(threeActive.carrier.readApi, 'work.parallelWorkUnitContext');

    const forbidden = scanInstalledRuntimeForForbiddenSurface(project);
    assert.equal(/\b(?:spawn_agent|wait_agent|followup_task|send_message|interrupt_agent)\s*\(/.test(forbidden), false);
    assert.equal(/providerAdapter|staticModelCatalog|modelCatalog\s*=/.test(forbidden), false);
    assert.equal(/\bsetInterval\s*\(/.test(forbidden), false);
    assert.equal(/\bdaemon\b.*\bspawn\b|\bspawn\b.*\bdaemon\b/i.test(forbidden), false);
    assert.equal(/writeFileSync\([^)]*(?:credential|secret|token|password)/i.test(forbidden), false);
    assert.equal(/(?:transcript_path|transcriptPath)|readFileSync\([^)]*transcript/i.test(forbidden), false);
    assert.equal(/UI scraping|scrape UI/.test(forbidden), false);
  } finally {
    fs.rmSync(project, { recursive: true, force: true });
    fs.rmSync(source.root, { recursive: true, force: true });
  }
});

test('R3F03 installed recovery ledger counts semantic failures, ignores provider faults, and clears the lease on acceptance', () => {
  const source = materializeCandidateSource();
  const project = tempRoot('hl-r3f03-recovery-project-');
  try {
    writeHarnessState(project, [
      { id: 'R3F31', goal: 'recovery ledger goal', writeScope: ['src/recovery.js'] },
    ]);
    assert.equal(install.install(project, { write: true, source: source.root }).status, 'INSTALLED');

    let fifth = null;
    for (let index = 0; index < 5; index++) {
      fifth = recordRecoveryInstalled(project, 'recordAgentFailure', {
        id: `r3f31-effective-${index}`,
        stableWorkUnit: 'R3F31',
        acceptanceGate: 'R3F31-DIRECT',
        stableProblemFingerprint: 'r3f03-recovery-ledger',
        modelFamily: 'grok',
        category: 'claimed-complete-acceptance-failure',
        effective: true,
        completeRecovery: false,
        evidenceRef: `reports/r3f31-failure-${index}.md`,
        primaryCause: `semantic cause ${index}`,
        substantiveKey: `semantic-route-${index}`,
      }, `2026-01-01T00:00:0${index}.000Z`);
    }
    assert.equal(fifth.counted, true);
    assert.equal(fifth.recovery.tier, 'terra');
    assert.equal(fifth.recovery.status, 'active');
    assert.equal(fifth.recovery.failureCount, 5);
    assert.equal(fifth.recovery.leases.length, 1);

    const provider = recordRecoveryInstalled(project, 'recordAgentFailure', {
      id: 'r3f31-provider-fault',
      stableWorkUnit: 'R3F31',
      acceptanceGate: 'R3F31-DIRECT',
      stableProblemFingerprint: 'r3f03-recovery-ledger',
      modelFamily: 'grok',
      category: 'provider-transport',
      effective: false,
      completeRecovery: false,
      nonCountingReason: 'provider-transport',
      evidenceRef: 'reports/r3f31-provider-fault.md',
      primaryCause: 'provider transport fault',
      substantiveKey: 'provider-transport-fault',
    }, '2026-01-01T00:00:05.000Z');
    assert.equal(provider.counted, false);
    assert.equal(provider.report.recoveryLedger.nonCountingFailureEventCount, 1);
    assert.equal(provider.report.recoveryLedger.effectiveFailureCount, 5);

    const accepted = recordRecoveryInstalled(project, 'recordAgentRecovery', {
      id: 'r3f31-acceptance-pass',
      kind: 'acceptance_pass',
      stableWorkUnit: 'R3F31',
      acceptanceGate: 'R3F31-DIRECT',
      stableProblemFingerprint: 'r3f03-recovery-ledger',
      evidenceRef: 'reports/r3f31-accepted.md',
    }, '2026-01-01T00:00:06.000Z');
    assert.equal(accepted.ok, true);
    assert.equal(accepted.report.recoveryLedger.leaseCount, 0);
    assert.equal(accepted.recovery.status, 'ordinary');
    assert.ok(accepted.recovery.problems.every((problem) => problem.status === 'accepted'));
  } finally {
    fs.rmSync(project, { recursive: true, force: true });
    fs.rmSync(source.root, { recursive: true, force: true });
  }
});

test('R3F03 installed parallel context reports overlapping active write scopes as conflicts', () => {
  const source = materializeCandidateSource();
  const project = tempRoot('hl-r3f03-conflict-project-');
  try {
    writeHarnessState(project, [
      { id: 'R3F31', goal: 'first overlap goal', writeScope: ['src/**'] },
      { id: 'R3F32', goal: 'second overlap goal', writeScope: ['src/alpha.js'] },
    ]);
    assert.equal(install.install(project, { write: true, source: source.root }).status, 'INSTALLED');
    recordInstalled(project, { id: 'r3f31-active', workUnit: 'R3F31', status: 'active', writeScope: ['src/**'] }, '2026-01-01T00:00:00.000Z');
    recordInstalled(project, { id: 'r3f32-active', workUnit: 'R3F32', status: 'active', writeScope: ['src/alpha.js'] }, '2026-01-01T00:00:01.000Z');

    const context = dispatchInstalled(project, {
      hook_event_name: 'SessionStart',
      cwd: project,
      session_id: 'r3f03-conflict-session',
    });
    assert.ok(context.includes('ParallelWorkUnitsCarrier：complete=complete；inline=false；truncated=false；count=2；'), context);
    assert.ok(context.includes('conflicts=1'), context);

    const parallel = readParallelContextInFreshProcess(project);
    assert.deepEqual(parallel.conflicts, [{
      units: ['R3F31', 'R3F32'],
      overlap: [['src/**', 'src/alpha.js']],
      action: 'integration-owner-or-split-or-serial',
    }]);
  } finally {
    fs.rmSync(project, { recursive: true, force: true });
    fs.rmSync(source.root, { recursive: true, force: true });
  }
});

test('R3F03 active indexes point to the existing R3 current leaf without changing the frozen R01-R18 body', () => {
  const lifecycleRoot = tempRoot('hl-r3f03-lifecycle-');
  try {
    writeLifecycleFixture(lifecycleRoot);
    const planFile = path.join(lifecycleRoot, 'docs/harness/plan.md');
    const leafFile = path.join(lifecycleRoot, 'docs/harness/leaves/HLNEXT-REPAIR-R3.md');
    const stageFile = path.join(lifecycleRoot, 'docs/harness/stages/stage-hlnext-repair-r3.md');
  const tree = require('../lib/tree.js');
  const chain = tree.readChain(lifecycleRoot);
  assert.equal(chain.health.ok, true, JSON.stringify(chain.health.conflicts));
  assert.equal(chain.stage.name, 'stage-hlnext-repair-r3');
  assert.equal(chain.leaf.name, 'HLNEXT-REPAIR-R3');
  assert.equal(path.resolve(chain.leaf.file), leafFile);
  assert.equal(fs.existsSync(chain.stage.file), true);
  assert.equal(chain.authority.status, 'current');
  assert.equal(chain.authority.review.status, 'current');

  const next = fs.readFileSync(path.join(lifecycleRoot, 'NEXT-VERSION-DISPATCH-PLAN.md'), 'utf8');
  const top = next.slice(0, next.indexOf('## 一、冻结的需求基线'));
  assert.ok(top.includes('当前唯一 active stage 是 `stage-hlnext-repair-r3`'), top);
  assert.ok(top.includes('authoritative current leaf 只以 `docs/harness/leaves/HLNEXT-REPAIR-R3.md` 为准'), top);
  assert.ok(top.includes('R3 当前尚未 PASS'), top);
  assert.equal(top.includes('R2 active/current'), false, top);
  assert.ok(top.includes('不预写 R3 PASS'), top);

  const start = next.indexOf('## 一、冻结的需求基线');
  const end = next.indexOf('## 二、产品边界');
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  assert.equal(`sha256:${sha(next.slice(start, end))}`, frozenR01R18Digest);

  const plan = fs.readFileSync(planFile, 'utf8');
  assert.ok(plan.includes('- [ ] `stage-hlnext-repair-r3`'), plan);
  assert.ok(plan.includes('current leaf `HLNEXT-REPAIR-R3`'), plan);
  assert.equal(fs.existsSync(path.join(lifecycleRoot, 'docs/harness/reports/HLNEXT-REPAIR-R3F05-supervisor-closeout-PASS.md')), false);
  } finally {
    fs.rmSync(lifecycleRoot, { recursive: true, force: true });
  }
});
