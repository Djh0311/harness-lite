'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const test = require('node:test');

const capabilities = require('../lib/capabilities.js');
const install = require('../lib/install.js');
const { workUnitDeclarations } = require('./fixtures/work-unit-declarations.js');

const sourceRoot = path.resolve(__dirname, '..');
const gitEnv = { PATH: '/usr/bin:/bin', LANG: 'C', LC_ALL: 'C' };

function tempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'hl-fix03-joined-'));
}

function run(command, args, opts = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', ...opts });
  assert.equal(result.status, 0, `${command} ${args.join(' ')}\n${result.stderr || result.stdout}`);
  return result;
}

function git(root, args) {
  return run('/usr/bin/git', args, { cwd: root, env: gitEnv });
}

function initGitRoot(root) {
  git(root, ['init', '-q']);
  git(root, ['config', 'user.email', 'harness-lite@example.invalid']);
  git(root, ['config', 'user.name', 'Harness Lite Test']);
  fs.writeFileSync(path.join(root, 'README.md'), '# disposable FIX03 joined runtime\n');
  git(root, ['add', 'README.md']);
  git(root, ['commit', '-q', '-m', 'init']);
}

function writeHarnessState(root) {
  fs.mkdirSync(path.join(root, 'docs/harness/stages'), { recursive: true });
  fs.mkdirSync(path.join(root, 'docs/harness/leaves'), { recursive: true });
  fs.writeFileSync(path.join(root, 'docs/harness/plan.md'), '# Plan\n\n目标：FIX03 joined runtime\n');
  fs.writeFileSync(path.join(root, 'docs/harness/stages/stage-fix03.md'), [
    '# Stage FIX03',
    '',
    '目标：joined runtime e2e',
    '',
    '不许动：',
    '',
    '- release',
    '- provider adapter',
  ].join('\n'));
  fs.writeFileSync(path.join(root, 'docs/harness/leaves/FIX03.md'), [
    '# Leaf FIX03',
    '',
    '阶段：stage-fix03',
    '',
    '目标：FIX03 leaf joined runtime',
    '',
    '完成标准：',
    '',
    '- FIX03-LEAF-COMPLETION-SENTINEL',
    '',
    '相关权威设计：',
    '',
    '- FIX03-DESIGN-SENTINEL',
    '',
    '允许动：',
    '',
    '- lib/hook.js',
    '- lib/delegation.js',
    '',
    '不许动：',
    '',
    '- release',
    '- provider adapter',
    '',
    '## Work Unit FIX03 - selected by active ledger',
    '',
    'goal: FIX03-GOAL-SENTINEL',
    '',
    'directAcceptance:',
    '',
    '- FIX03-ACCEPT-SENTINEL',
    '',
    'allowed:',
    '',
    '- lib/hook.js',
    '- lib/delegation.js',
    '',
    'forbidden:',
    '',
    '- provider adapter',
    '- release',
    '',
    'facts:',
    '',
    '- FIX03-FACT-SENTINEL',
    '',
    'entryPoints:',
    '',
    '- hooks/dispatcher.js joined-entry',
    '- lib/delegation.js installed-api',
    '',
    'disprovenRoutes:',
    '',
    '- FIX03-DISPROVEN-SENTINEL',
    '',
    'unknowns:',
    '',
    '- FIX03-UNKNOWN-SENTINEL',
    '',
    'routeBasis: FIX03-ROUTE-SENTINEL',
    '',
    'dependencies:',
    '',
    '- FIX01',
    '- FIX02',
    '',
    'resultContract: FIX03-RESULT-SENTINEL',
    '',
    '## Work Unit FIX04 - must not be selected',
    '',
    'goal: FIX04-NOT-SELECTED-SENTINEL',
    '',
    'directAcceptance:',
    '',
    '- FIX04-NOT-SELECTED-ACCEPTANCE',
    ...workUnitDeclarations(['FIX01', 'FIX02', 'FIX05', 'FIX06', 'FIX07']),
  ].join('\n'));
}

function writeCapabilityManifest(root) {
  fs.mkdirSync(path.join(root, '.codex/harness-lite'), { recursive: true });
  fs.writeFileSync(path.join(root, '.codex/harness-lite/capabilities.json'), `${JSON.stringify({
    schemaVersion: 1,
    kind: capabilities.KIND,
    models: [
      {
        channel: 'codex-direct',
        model: 'gpt-5.5-fix03',
        reasoning: 'xhigh',
        status: 'available',
        capabilities: ['real-agent-tools'],
      },
      {
        channel: 'gemini-ui',
        model: 'gemini-fix03',
        reasoning: 'high',
        family: 'gemini',
        status: 'unavailable',
        capabilities: ['frontend'],
      },
      {
        channel: 'zz-name-check',
        model: 'grok-name-only',
        reasoning: 'xhigh',
        status: 'available',
        capabilities: ['name-is-not-family'],
      },
    ],
  }, null, 2)}\n`);
}
function readCapabilityManifest(root) {
  return JSON.parse(fs.readFileSync(path.join(root, '.codex/harness-lite/capabilities.json'), 'utf8'));
}

function installProject(root) {
  const installed = run(process.execPath, [
    path.join(sourceRoot, 'bin/hl.js'),
    'install',
    '--target',
    root,
    '--write',
    '--source',
    sourceRoot,
    '--json',
  ], { cwd: root });
  assert.equal(JSON.parse(installed.stdout).status, 'INSTALLED');
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
  assert.equal(Object.hasOwn(input, 'work_unit'), false);
  assert.equal(Object.hasOwn(input, 'workUnit'), false);
  assert.equal(Object.hasOwn(input, 'work_unit_id'), false);
  assert.equal(Object.hasOwn(input, 'workUnitId'), false);
  assert.equal(Object.hasOwn(input, 'harness_lite_work_unit'), false);
  const result = run(process.execPath, [path.join(root, install.RUNTIME, 'hooks/dispatcher.js')], {
    cwd: root,
    input: `${JSON.stringify(input)}\n`,
  });
  return JSON.parse(result.stdout).hookSpecificOutput.additionalContext;
}

function phaseA(root) {
  return runInstalledJson(root, `
const delegation = require("./.claude/harness-lite/lib/delegation.js");
const root = process.cwd();
const at = (s) => new Date(Date.UTC(2026, 0, 1, 0, 0, s)).toISOString();
const active = delegation.recordAgentStatus(root, {
  id: "fix03-active",
  workUnit: "FIX03",
  status: "active",
  channel: "codex-direct",
  model: "gpt-5.5-fix03",
  modelFamily: "gpt-5.5",
  reasoning: "xhigh",
  dependencies: ["FIX01", "FIX02"],
  writeScope: ["lib/hook.js", "lib/delegation.js"]
}, { at: at(0) });
const heartbeat = delegation.recordAgentObservation(root, {
  id: "fix03-heartbeat",
  workUnit: "FIX03",
  kind: "heartbeat"
}, { at: at(300) });
delegation.recordAgentObservation(root, {
  id: "fix03-activity",
  workUnit: "FIX03",
  kind: "activity",
  activityKind: "joined-runtime"
}, { at: at(301) });
delegation.recordAgentObservation(root, {
  id: "fix03-progress",
  workUnit: "FIX03",
  kind: "progress",
  progressKind: "verified-fact",
  evidenceRef: "reports/fix03-joined.md"
}, { at: at(302) });
const ledger = delegation.read(root).ledger;
const summary = delegation.summary(ledger, { now: at(602) });
const capabilityManifest = JSON.parse(require("fs").readFileSync(require("path").join(root, ".codex/harness-lite/capabilities.json"), "utf8"));
const caps = require("./.claude/harness-lite/lib/capabilities.js").project(root, {
  manifest: capabilityManifest, eventName: "UserPromptSubmit", sessionId: "fix03-session", turnId: "fix03-turn", writeDynamicCarrier: false, now: at(602)
});
process.stdout.write(JSON.stringify({
  runtime: "./.claude/harness-lite/lib/delegation.js",
  activeOk: active.ok,
  heartbeatOk: heartbeat.ok,
  heartbeatMs: delegation.HEARTBEAT_MS,
  unit: ledger.workUnits.FIX03,
  active: summary.active,
  due: summary.heartbeat.due,
  capabilityProjection: caps
}));
`);
}

function phaseB(root) {
  return runInstalledJson(root, `
const delegation = require("./.claude/harness-lite/lib/delegation.js");
const root = process.cwd();
const at = (s) => new Date(Date.UTC(2026, 0, 1, 0, 0, s)).toISOString();
delegation.recordAgentStatus(root, { id: "fix01-accepted", workUnit: "FIX01", status: "accepted", evidenceRef: "reports/fix01-accepted.md" }, { at: at(303) });
delegation.recordAgentStatus(root, { id: "fix02-accepted", workUnit: "FIX02", status: "accepted", evidenceRef: "reports/fix02-accepted.md" }, { at: at(304) });
delegation.recordAgentStatus(root, { id: "fix05-reported", workUnit: "FIX05", status: "reported_complete", dependencies: ["FIX03"], evidenceRef: "reports/fix05-reported.md" }, { at: at(305) });
delegation.recordAgentStatus(root, { id: "fix06-blocked", workUnit: "FIX06", status: "blocked", evidenceRef: "reports/fix06-blocked.md" }, { at: at(306) });
delegation.recordAgentStatus(root, { id: "fix07-partial", workUnit: "FIX07", status: "partial", evidenceRef: "reports/fix07-partial.md" }, { at: at(307) });
delegation.recordAgentStatus(root, { id: "fix04-active", workUnit: "FIX04", status: "active", dependencies: ["FIX03"], writeScope: ["lib/work.js"] }, { at: at(308) });
const readyAfterReported = delegation.dependencyState(delegation.read(root).ledger, "FIX04").ready;
delegation.recordAgentStatus(root, { id: "fix04-paused", workUnit: "FIX04", status: "blocked", evidenceRef: "reports/fix04-paused.md" }, { at: at(309) });
delegation.recordAgentStatus(root, { id: "fix03-reported", workUnit: "FIX03", status: "reported_complete", evidenceRef: "reports/fix03-reported.md" }, { at: at(310) });
const downstream = delegation.recordAgentStatus(root, { id: "fix04-active-after-report", workUnit: "FIX04", status: "active", dependencies: ["FIX03"], writeScope: ["lib/work.js"] }, { at: at(311) });
const readyAfterOwnReported = delegation.dependencyState(downstream.ledger, "FIX04").ready;
process.stdout.write(JSON.stringify({
  readyAfterReported,
  readyAfterOwnReported
}));
`);
}

function phaseC(root) {
  return runInstalledJson(root, `
const delegation = require("./.claude/harness-lite/lib/delegation.js");
const root = process.cwd();
const at = (s) => new Date(Date.UTC(2026, 0, 1, 0, 0, s)).toISOString();
delegation.recordAgentStatus(root, {
  id: "fix03-accepted",
  workUnit: "FIX03",
  status: "accepted",
  channel: "codex-direct",
  model: "gpt-5.5-fix03",
  modelFamily: "gpt-5.5",
  reasoning: "xhigh",
  evidenceRef: "reports/fix03-accepted.md"
}, { at: at(312) });
const readyAfterAccepted = delegation.dependencyState(delegation.read(root).ledger, "FIX04").ready;
const failureOne = delegation.recordAgentFailure(root, {
  id: "fix03-fail-one",
  stableWorkUnit: "FIX03",
  acceptanceGate: "direct-acceptance",
  stableProblemFingerprint: "joined-runtime-direct-acceptance",
  modelFamily: "gpt-5.5",
  channel: "codex-direct",
  model: "gpt-5.5-fix03",
  reasoning: "xhigh",
  category: "claimed-complete-acceptance-failure",
  effective: true,
  evidenceRef: "reports/fix03-fail-one.md",
  primaryCause: "claimed complete failed direct acceptance one",
  substantiveKey: "route-one"
}, { at: at(313) });
const countAfterEffective = delegation.recoverySummary(delegation.read(root).ledger).failureCount;
const providerFault = delegation.recordAgentFailure(root, {
  id: "fix03-provider-tool-auth",
  stableWorkUnit: "FIX03",
  acceptanceGate: "direct-acceptance",
  stableProblemFingerprint: "joined-runtime-direct-acceptance",
  modelFamily: "gpt-5.5",
  channel: "changed-provider-channel",
  model: "transport-auth-model",
  reasoning: "xhigh",
  category: "provider",
  effective: false,
  nonCountingReason: "provider-transport-auth-permission-quota-host",
  evidenceRef: "reports/fix03-provider-tool-auth.md",
  primaryCause: "provider tool auth ordinary fault",
  substantiveKey: "provider-tool-auth"
}, { at: at(314) });
const countAfterProvider = delegation.recoverySummary(delegation.read(root).ledger).failureCount;
const failureTwo = delegation.recordAgentFailure(root, {
  id: "fix03-fail-two",
  stableWorkUnit: "FIX03",
  acceptanceGate: "direct-acceptance",
  stableProblemFingerprint: "joined-runtime-direct-acceptance",
  modelFamily: "gpt-5.5",
  channel: "changed-session-channel",
  model: "gpt-5.5-fix03-second",
  reasoning: "xhigh",
  category: "claimed-complete-acceptance-failure",
  effective: true,
  evidenceRef: "reports/fix03-fail-two.md",
  primaryCause: "claimed complete failed direct acceptance two",
  substantiveKey: "route-two"
}, { at: at(315) });
const ledger = delegation.read(root).ledger;
const report = delegation.agentLedgerReport(ledger);
const problems = Object.values(ledger.failures.problems);
const events = Object.values(ledger.failures.events);
process.stdout.write(JSON.stringify({
  readyAfterAccepted,
  failureOneCounted: failureOne.counted,
  failureOneReportCount: failureOne.report.recoveryLedger.effectiveFailureCount,
  diskReportCountAfterOne: failureOne.report.recovery.failureCount,
  countAfterEffective,
  providerCounted: providerFault.counted,
  countAfterProvider,
  failureTwoCounted: failureTwo.counted,
  finalReport: report,
  problemCount: problems.length,
  problem: problems[0],
  eventLeaseKeys: [...new Set(events.map((event) => event.leaseKey))],
  eventChannels: events.map((event) => event.channel || null),
  events,
  fix03: ledger.workUnits.FIX03,
  fix04: ledger.workUnits.FIX04
}));
`);
}

function assertGuidanceBlock(text) {
  for (const needle of [
    'Harness Lite 0.12 内部核心',
    '当前用户明确要求决定目标、范围、取舍和权限',
    '相关的权威产品设计',
    '最短直接证据',
    '工作事件变化时读取当次 guidance',
  ]) assert.ok(text.includes(needle), needle);
}

function assertRuntimeContext(context, opts) {
  assert.equal(context.length <= 1800, true, context.length);
  for (const needle of [
    'WorkUnitCarrier：complete=',
    'id=FIX03',
    'readApi=tree.workUnitPackage',
    'digest=sha256:',
    'standardsCount=1',
    'sentinelStart=FIX03-ACCEPT-SENTINEL',
    'sentinelEnd=FIX03-ACCEPT-SENTINEL',
    'Decision：focus=',
    'DecisionQuestion：',
    'NextAction：',
    'CompletionCarrier：complete=',
    'Scope：allowed=lib/hook.js、lib/delegation.js',
    'boundaries=allowed/forbidden',
    'Delegation：live=true',
    'Activity：FIX03:joined-runtime',
    'Progress：FIX03:verified-fact',
    'Heartbeat：read-only；intervalMs=300000',
  ]) assert.ok(context.includes(needle), `${needle}\n${context}`);
  assert.equal(context.includes('FIX04-NOT-SELECTED-SENTINEL'), false, context);
  assert.equal(context.includes('Capabilities：'), false, context);
  assert.equal(context.includes('Recovery：'), false, context);
}

function assertLifecycleCategories(context) {
  for (const needle of [
    'Activity：FIX03:joined-runtime',
    'Progress：FIX03:verified-fact',
    'Reported：FIX03',
    'Accepted：FIX01',
    'Dependencies：FIX04<-FIX03:reported_complete、FIX05<-FIX03:reported_complete',
    'Heartbeat：read-only；intervalMs=300000',
  ]) assert.ok(context.includes(needle), `${needle}\n${context}`);
  assert.equal(context.length <= 1800, true, context.length);
}

function assertNoAgentProviderProductSurface() {
  const files = install.CURRENT_REQUIRED_RUNTIME_PATHS.filter((rel) => rel.endsWith('.js'));
  const joined = files.map((rel) => fs.readFileSync(path.join(sourceRoot, rel), 'utf8')
    .replace(/const (?:PREVIOUS_10_)?INSTRUCTION = `<!-- HARNESS-LITE:BEGIN -->[\s\S]*?<!-- HARNESS-LITE:END -->`;/g,
      'const INSTRUCTION = "<policy text omitted>";')).join('\n');
  assert.equal(/\b(?:spawn_agent|wait_agent|followup_task|send_message|interrupt_agent)\s*\(/.test(joined), false);
  assert.equal(/providerAdapter|staticModelCatalog|modelCatalog\s*=/.test(joined), false);
  assert.equal(/\bsetInterval\s*\(/.test(joined), false);
  assert.equal(/\bdaemon\b.*\bspawn\b|\bspawn\b.*\bdaemon\b/i.test(joined), false);
  assert.equal(/writeFileSync\([^)]*(?:credential|token|password)/i.test(joined), false);
  assert.equal(/(?:transcript_path|transcriptPath)|readFileSync\([^)]*transcript/i.test(joined), false);
}

test('FIX03 joined install runtime projects guidance, delegation, dependency locks, and effective failures', () => {
  const root = tempRoot();
  try {
    initGitRoot(root);
    writeHarnessState(root);
    writeCapabilityManifest(root);
    installProject(root);
    const staleCapabilities = require(path.join(root, install.RUNTIME, 'lib/capabilities.js')).project(root);
    assert.equal(staleCapabilities.state, capabilities.UNKNOWN);
    assert.equal(staleCapabilities.modelsComplete, false);

    assertGuidanceBlock(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'));
    assertGuidanceBlock(fs.readFileSync(path.join(root, 'CLAUDE.md'), 'utf8'));

    const phaseAResult = phaseA(root);
    assert.equal(phaseAResult.runtime, './.claude/harness-lite/lib/delegation.js');
    assert.equal(phaseAResult.activeOk, true);
    assert.equal(phaseAResult.heartbeatOk, true);
    assert.equal(phaseAResult.heartbeatMs, 300000);
    assert.deepEqual(phaseAResult.active, ['FIX03']);
    assert.deepEqual(phaseAResult.due, ['FIX03']);
    assert.equal(phaseAResult.unit.channel, 'codex-direct');
    assert.equal(phaseAResult.unit.model, 'gpt-5.5-fix03');
    assert.equal(phaseAResult.unit.modelFamily, 'gpt-5.5');
    assert.equal(phaseAResult.unit.reasoning, 'xhigh');
    assert.equal(phaseAResult.unit.heartbeatAt, '2026-01-01T00:05:00.000Z');
    assert.equal(phaseAResult.unit.activityKind, 'joined-runtime');
    assert.equal(phaseAResult.unit.progressKind, 'verified-fact');
    assert.equal(phaseAResult.capabilityProjection.state, 'known');
    assert.equal(phaseAResult.capabilityProjection.models.find((model) => model.model === 'grok-name-only').family, 'unclassified');

    const dynamicManifest = readCapabilityManifest(root);
    const start = dispatchInstalled(root, { hook_event_name: 'SessionStart', cwd: root, session_id: 'fix03-session', capability_manifest: dynamicManifest });
    const prompt = dispatchInstalled(root, {
      hook_event_name: 'UserPromptSubmit',
      cwd: root,
      session_id: 'fix03-session',
      turn_id: 'fix03-turn',
      prompt: 'FIX03 joined runtime sentinel prompt',
      capability_manifest: dynamicManifest,
    });
    assertRuntimeContext(start, { manifest: true });
    assertRuntimeContext(prompt, { manifest: true });

    fs.unlinkSync(path.join(root, '.codex/harness-lite/capabilities.json'));
    const missing = dispatchInstalled(root, { hook_event_name: 'SessionStart', cwd: root, session_id: 'fix03-missing-manifest' });
    assertRuntimeContext(missing, { manifest: false });

    const phaseBResult = phaseB(root);
    assert.equal(phaseBResult.readyAfterReported, false);
    assert.equal(phaseBResult.readyAfterOwnReported, false);

    const beforeFailure = dispatchInstalled(root, {
      hook_event_name: 'SessionStart',
      cwd: root,
      session_id: 'fix03-lifecycle-before-failure',
    });
    assertLifecycleCategories(beforeFailure);

    const phaseCResult = phaseC(root);
    assert.equal(phaseCResult.readyAfterAccepted, true);
    assert.equal(phaseCResult.fix03.status, 'accepted');
    assert.equal(phaseCResult.fix03.channel, 'codex-direct');
    assert.equal(phaseCResult.fix03.modelFamily, 'gpt-5.5');
    assert.equal(phaseCResult.fix04.status, 'active');
    assert.equal(phaseCResult.failureOneCounted, true);
    assert.equal(phaseCResult.failureOneReportCount, 1);
    assert.equal(phaseCResult.diskReportCountAfterOne, 1);
    assert.equal(phaseCResult.countAfterEffective, 1);
    assert.equal(phaseCResult.providerCounted, false);
    assert.equal(phaseCResult.countAfterProvider, 1);
    assert.equal(phaseCResult.failureTwoCounted, true);
    assert.equal(phaseCResult.finalReport.recovery.failureCount, 2);
    assert.equal(phaseCResult.finalReport.recoveryLedger.effectiveFailureCount, 2);
    assert.equal(phaseCResult.finalReport.recoveryLedger.failureEventCount, 3);
    assert.equal(phaseCResult.finalReport.recoveryLedger.nonCountingFailureEventCount, 1);
    assert.equal(phaseCResult.problemCount, 1);
    assert.deepEqual(phaseCResult.problem.countedSubstantiveKeys.sort(), ['route-one', 'route-two']);
    assert.equal(phaseCResult.eventLeaseKeys.length, 1);
    assert.deepEqual(phaseCResult.eventChannels.sort(), ['changed-provider-channel', 'changed-session-channel', 'codex-direct']);
    assert.equal(phaseCResult.events.every((event) => event.evidenceRef && !event.modelFamily?.includes('grok')), true);
    assertNoAgentProviderProductSurface();
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
