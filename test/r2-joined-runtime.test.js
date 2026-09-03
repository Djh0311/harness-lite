'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const test = require('node:test');

const capabilities = require('../lib/capabilities.js');
const install = require('../lib/install.js');

const sourceRoot = path.resolve(__dirname, '..');
const manifestRel = '.codex/harness-lite/capabilities.json';

function tempRoot(prefix = 'hl-r2-joined-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function run(command, args, opts = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', ...opts });
  assert.equal(result.status, 0, `${command} ${args.join(' ')}\n${result.stderr || result.stdout}`);
  return result;
}

function installProject(root) {
  const result = run(process.execPath, [
    path.join(sourceRoot, 'bin/hl.js'),
    'install',
    '--target',
    root,
    '--write',
    '--source',
    sourceRoot,
    '--json',
  ], { cwd: root });
  assert.equal(JSON.parse(result.stdout).status, 'INSTALLED');

  const verify = runInstalledJson(root, `
const install = require("./.claude/harness-lite/lib/install.js");
process.stdout.write(JSON.stringify(install.verify06(process.cwd())));
`);
  assert.equal(verify.ok, true, JSON.stringify(verify.differences || []));
}

function runInstalledJson(root, script) {
  const result = run(process.execPath, ['-e', script], { cwd: root });
  return JSON.parse(result.stdout);
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

function writeHarnessState(root) {
  fs.mkdirSync(path.join(root, 'docs/harness/stages'), { recursive: true });
  fs.mkdirSync(path.join(root, 'docs/harness/leaves'), { recursive: true });
  fs.writeFileSync(path.join(root, 'docs/harness/plan.md'), '# R2 Plan\n\n目标：R2 joined runtime\n');
  fs.writeFileSync(path.join(root, 'docs/harness/stages/stage-r2.md'), [
    '# Stage R2',
    '',
    '目标：R2 joined dispatcher coverage',
    '',
    '不许动：',
    '',
    '- push',
    '- release',
    '- provider adapter',
  ].join('\n'));
  fs.writeFileSync(path.join(root, 'docs/harness/leaves/R2.md'), [
    '# R2 Leaf',
    '',
    '阶段：stage-r2',
    '',
    '目标：R2 leaf joined runtime',
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
    '- test/r2-joined-runtime.test.js',
    '',
    '不许动：',
    '',
    '- push',
    '- release',
    '- provider adapter',
    '',
    workUnitSection('R2F31', 'R2F31-GOAL', ['lib/capabilities.js']),
    workUnitSection('R2F32', 'R2F32-GOAL', ['lib/work.js']),
    workUnitSection('R2F33', 'R2F33-UPSTREAM', ['docs/harness/reports/**']),
    workUnitSection('R2F34', 'R2F34-WAITING', ['lib/tree.js'], ['R2F33']),
  ].join('\n'));
}

function workUnitSection(id, goal, allowed, dependencies = []) {
  return [
    `## Work Unit ${id}`,
    '',
    `goal: ${goal}`,
    '',
    'directAcceptance:',
    '',
    `- ${id}-ACCEPT`,
    '',
    'allowed:',
    '',
    ...allowed.map((item) => `- ${item}`),
    '',
    'forbidden:',
    '',
    '- push',
    '- release',
    '',
    'facts:',
    '',
    `- ${id}-FACT`,
    '',
    'entryPoints:',
    '',
    '- installed dispatcher',
    '',
    'disprovenRoutes:',
    '',
    '- helper-only',
    '',
    'unknowns:',
    '',
    '- none',
    '',
    `routeBasis: ${id}-ROUTE`,
    '',
    'dependencies:',
    '',
    ...(dependencies.length ? dependencies.map((item) => `- ${item}`) : ['- 无']),
    '',
    `resultContract: ${id}-RESULT`,
    '',
  ].join('\n');
}

function writeCapabilityManifest(root, models = threeModelManifest()) {
  const file = path.join(root, manifestRel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify({
    schemaVersion: 1,
    kind: capabilities.KIND,
    models,
  }, null, 2)}\n`);
}

function threeModelManifest() {
  return [
    {
      channel: 'Cursor',
      model: 'Grok 4.6 High',
      reasoning: 'high',
      family: 'grok',
      status: 'available',
      capabilities: ['agent-writer'],
    },
    {
      channel: 'GrokBuild',
      model: 'Grok 4.6 High',
      reasoning: 'high',
      family: 'grok',
      status: 'available',
      capabilities: ['build-writer'],
    },
    {
      channel: 'Antigravity',
      model: 'Gemini 3.7 Flash High',
      reasoning: 'high',
      family: 'gemini',
      status: 'available',
      capabilities: ['frontend'],
    },
  ];
}

function recordJoinedState(root) {
  return runInstalledJson(root, `
const delegation = require("./.claude/harness-lite/lib/delegation.js");
const root = process.cwd();
const at = (s) => new Date(Date.UTC(2026, 0, 1, 0, 0, s)).toISOString();
const events = [
  { id: "r2f31-active", workUnit: "R2F31", status: "active", dependencies: [], writeScope: ["lib/capabilities.js"], channel: "Cursor", model: "Grok 4.6 High", modelFamily: "grok", reasoning: "high" },
  { id: "r2f32-active", workUnit: "R2F32", status: "active", dependencies: [], writeScope: ["lib/work.js"], channel: "Antigravity", model: "Gemini 3.7 Flash High", modelFamily: "gemini", reasoning: "high" },
  { id: "r2f33-reported", workUnit: "R2F33", status: "reported_complete", dependencies: [], writeScope: ["docs/harness/reports/**"], evidenceRef: "reports/r2f33-reported.md" },
  { id: "r2f34-rejected", workUnit: "R2F34", status: "rejected", dependencies: ["R2F33"], writeScope: ["lib/tree.js"] }
];
events.forEach((event, index) => {
  const result = delegation.recordAgentStatus(root, event, { at: at(index) });
  if (!result.ok) throw new Error(JSON.stringify(result));
});
const ledger = delegation.read(root).ledger;
process.stdout.write(JSON.stringify({
  active: delegation.summary(ledger, { now: at(10) }).active,
  waiting: delegation.summary(ledger, { now: at(10) }).waiting,
  readyBeforeAccepted: delegation.dependencyState(ledger, "R2F34").ready
}));
`);
}

function acceptUpstream(root) {
  return runInstalledJson(root, `
const delegation = require("./.claude/harness-lite/lib/delegation.js");
const root = process.cwd();
const result = delegation.recordAgentStatus(root, {
  id: "r2f33-accepted",
  workUnit: "R2F33",
  status: "accepted",
  evidenceRef: "reports/r2f33-accepted.md"
}, { at: "2026-01-01T00:00:20.000Z" });
if (!result.ok) throw new Error(JSON.stringify(result));
const ledger = delegation.read(root).ledger;
process.stdout.write(JSON.stringify({
  readyAfterAccepted: delegation.dependencyState(ledger, "R2F34").ready,
  waiting: delegation.summary(ledger, { now: "2026-01-01T00:00:21.000Z" }).waiting,
  accepted: delegation.summary(ledger, { now: "2026-01-01T00:00:21.000Z" }).accepted
}));
`);
}

function assertMainContext(context) {
  assert.equal(context.length <= 1800, true, context.length);
  for (const needle of [
    'ParallelWorkUnits：state=known；status=complete；complete=complete；active=2；units=2；conflicts=0；acceptedOnlyUnlock=true',
    'ParallelWorkUnitsCarrier：complete=complete；inline=false；truncated=false；count=2；ids=R2F31,R2F32；',
    'readApi=tree.workUnitPackages',
    'Dependencies：R2F34<-R2F33:reported_complete',
    'Heartbeat：read-only；intervalMs=300000',
  ]) {
    assert.ok(context.includes(needle), `${needle}\n${context}`);
  }
  assert.equal(context.includes('…+2'), false, context);
  assert.equal(context.includes('Capabilities：'), false, context);
  assert.equal(context.includes('WorkUnit：id=UNKNOWN'), false, context);
  assert.equal(context.includes('leaf-fallback'), false, context);
}

function assertMissingContext(context) {
  assert.equal(context.length <= 1800, true, context.length);
  assert.equal(context.includes('Capabilities：'), false, context);
}

function assertLargeContext(context, count) {
  assert.equal(context.length <= 1800, true, context.length);
  assert.equal(context.includes('Capabilities：'), false, context);
}

function assertOversizeContext(context) {
  assert.equal(context.length <= 1800, true, context.length);
  assert.equal(context.includes('Capabilities：'), false, context);
}

function assertNoAgentProviderProductSurface(root) {
  const runtime = path.join(root, install.RUNTIME);
  const joined = install.CURRENT_REQUIRED_RUNTIME_PATHS.filter((rel) => rel.endsWith('.js'))
    .map((rel) => fs.readFileSync(path.join(runtime, rel), 'utf8')
      .replace(/const (?:PREVIOUS_10_)?INSTRUCTION = `<!-- HARNESS-LITE:BEGIN -->[\s\S]*?<!-- HARNESS-LITE:END -->`;/g,
        'const INSTRUCTION = "<policy text omitted>";')).join('\n');
  assert.equal(/\b(?:spawn_agent|wait_agent|followup_task|send_message|interrupt_agent)\s*\(/.test(joined), false);
  assert.equal(/providerAdapter|staticModelCatalog|modelCatalog\s*=/.test(joined), false);
  assert.equal(/\bsetInterval\s*\(/.test(joined), false);
  assert.equal(/\bdaemon\b.*\bspawn\b|\bspawn\b.*\bdaemon\b/i.test(joined), false);
  assert.equal(/writeFileSync\([^)]*(?:credential|token|password)/i.test(joined), false);
  assert.equal(/(?:transcript_path|transcriptPath)|readFileSync\([^)]*transcript/i.test(joined), false);
}

test('R2 joined installed dispatcher exposes all capability models and both active work units without manual work-unit id', () => {
  const root = tempRoot();
  try {
    writeHarnessState(root);
    writeCapabilityManifest(root);
    installProject(root);

    const setup = recordJoinedState(root);
    assert.deepEqual(setup.active, ['R2F31', 'R2F32']);
    assert.deepEqual(setup.waiting, [{ id: 'R2F34', blockers: [{ id: 'R2F33', status: 'reported_complete', accepted: false }] }]);
    assert.equal(setup.readyBeforeAccepted, false);

    const start = dispatchInstalled(root, { hook_event_name: 'SessionStart', cwd: root, session_id: 'r2-main-session' });
    const prompt = dispatchInstalled(root, {
      hook_event_name: 'UserPromptSubmit',
      cwd: root,
      session_id: 'r2-main-session',
      turn_id: 'r2-main-turn',
      prompt: 'R2 joined runtime direct acceptance',
    });
    assertMainContext(start);
    assertMainContext(prompt);

    const accepted = acceptUpstream(root);
    assert.equal(accepted.readyAfterAccepted, true);
    assert.deepEqual(accepted.waiting, []);
    assert.equal(accepted.accepted.includes('R2F33'), true);
    const afterAccepted = dispatchInstalled(root, { hook_event_name: 'SessionStart', cwd: root, session_id: 'r2-after-accepted' });
    assert.equal(afterAccepted.includes('Accepted：R2F33'), false, afterAccepted);
    assert.ok(afterAccepted.includes('Decision：focus='), afterAccepted);
    assert.equal(afterAccepted.includes('R2F34<-R2F33:reported_complete'), false, afterAccepted);

    assertNoAgentProviderProductSurface(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('R2 joined installed dispatcher exposes missing, large, and oversize capability carriers within budget', () => {
  const root = tempRoot('hl-r2-joined-carrier-');
  try {
    writeHarnessState(root);
    installProject(root);
    recordJoinedState(root);

    const missing = dispatchInstalled(root, { hook_event_name: 'SessionStart', cwd: root, session_id: 'r2-missing' });
    assertMissingContext(missing);

    const largeModels = Array.from({ length: 24 }, (_, index) => ({
      channel: `channel-${String(index).padStart(2, '0')}`,
      model: `Model ${String(index).padStart(2, '0')}`,
      reasoning: index % 2 === 0 ? 'high' : 'xhigh',
      family: index % 3 === 0 ? 'grok' : index % 3 === 1 ? 'gemini' : 'terra',
      status: index % 5 === 0 ? 'unavailable' : 'available',
      capabilities: [`cap-${index}`],
    }));
    writeCapabilityManifest(root, largeModels);
    const large = dispatchInstalled(root, { hook_event_name: 'UserPromptSubmit', cwd: root, session_id: 'r2-large', turn_id: 'r2-large-turn', prompt: 'large manifest' });
    assertLargeContext(large, 24);

    const file = path.join(root, manifestRel);
    fs.writeFileSync(file, JSON.stringify({
      schemaVersion: 1,
      kind: capabilities.KIND,
      padding: 'x'.repeat(capabilities.MAX_MANIFEST_BYTES),
      models: threeModelManifest(),
    }));
    const oversize = dispatchInstalled(root, { hook_event_name: 'SessionStart', cwd: root, session_id: 'r2-oversize' });
    assertOversizeContext(oversize);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
