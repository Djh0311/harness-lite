'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const test = require('node:test');

const delegation = require('../lib/delegation.js');
const install = require('../lib/install.js');
const { workUnitDeclarations } = require('./fixtures/work-unit-declarations.js');

const sourceRoot = path.resolve(__dirname, '..');
const gitEnv = { HOME: process.env.HOME, PATH: '/usr/bin:/bin', LANG: 'C', LC_ALL: 'C' };

function tempRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hl-fix02-delegation-'));
  fs.mkdirSync(path.join(root, 'docs/harness/leaves'), { recursive: true });
  fs.mkdirSync(path.join(root, 'docs/harness/stages'), { recursive: true });
  fs.writeFileSync(path.join(root, 'docs/harness/plan.md'), '# Plan\n\n目标：FIX02 test\n');
  fs.writeFileSync(path.join(root, 'docs/harness/stages/stage-alpha.md'), [
    '# Stage Alpha',
    '',
    '目标：repair delegation records',
    '',
    '完成标准：',
    '',
    '- delegation records preserve accepted evidence',
    '',
    '不许动：',
    '',
    '- push',
  ].join('\n'));
  fs.writeFileSync(path.join(root, 'docs/harness/leaves/L1.md'), [
    '# Leaf One',
    '',
    '阶段：stage-alpha',
    '',
    '目标：repair delegation records',
    '',
    '完成标准：',
    '',
    '- delegation records preserve accepted evidence',
    '',
    '允许动：',
    '',
    '- lib/delegation.js',
    '- lib/work.js',
    '- test/fix02-delegation-record.test.js',
    '',
    '不许动：',
    '',
    '- provider adapter',
    ...workUnitDeclarations(['FIX00', 'FIX02', 'FIX03']),
  ].join('\n'));
  return root;
}

function at(index) {
  return new Date(Date.UTC(2026, 0, 1, 0, 0, index)).toISOString();
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
  fs.writeFileSync(path.join(root, 'README.md'), '# disposable\n');
  git(root, ['add', 'README.md']);
  git(root, ['commit', '-q', '-m', 'Initialize disposable fixture', '-m', 'Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>']);
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
  ], { cwd: sourceRoot });
  assert.equal(JSON.parse(result.stdout).status, 'INSTALLED');
  assert.equal(install.verify06(root).ok, true);
}

function readLedger(root) {
  const state = delegation.read(root);
  assert.equal(state.live, true, state.reason);
  return state.ledger;
}

function writeLedger(root, ledger) {
  fs.mkdirSync(path.dirname(delegation.ledgerPath(root)), { recursive: true });
  fs.writeFileSync(delegation.ledgerPath(root), `${JSON.stringify(ledger, null, 2)}\n`);
}

function assertAgentFields(value) {
  assert.equal(value.channel, 'codex');
  assert.equal(value.model, 'gpt-5.5');
  assert.equal(value.modelFamily, 'gpt-5.5');
  assert.equal(value.reasoning, 'xhigh');
}

function agentFailure(id, overrides = {}) {
  return {
    id,
    stableWorkUnit: 'FIX02',
    acceptanceGate: 'direct-acceptance',
    stableProblemFingerprint: 'agent-ledger-recording',
    modelFamily: 'gpt-5.5',
    channel: `channel-${id}`,
    model: 'gpt-5.5',
    reasoning: 'xhigh',
    category: 'claimed-complete-acceptance-failure',
    effective: true,
    evidenceRef: `reports/${id}.md`,
    primaryCause: `primary cause ${id}`,
    substantiveKey: `route-${id}`,
    ...overrides,
  };
}

function assertSameRecoveryReport(result, root) {
  const ledger = readLedger(root);
  const fromDisk = delegation.agentLedgerReport(ledger);
  assert.deepEqual(result.report.recoveryLedger, fromDisk.recoveryLedger);
  assert.deepEqual(result.recovery, delegation.recoverySummary(ledger));
}

test('installed runtime API loads from project root and records agent status', () => {
  const root = tempRoot();
  try {
    initGitRoot(root);
    installProject(root);
    const script = `
const delegation = require("./.claude/harness-lite/lib/delegation.js");
const result = delegation.recordAgentStatus(process.cwd(), {
  id: "installed-fix02-active",
  workUnit: "FIX02",
  status: "active",
  channel: "codex",
  model: "gpt-5.5",
  modelFamily: "gpt-5.5",
  reasoning: "xhigh",
  dependencies: ["FIX00"],
  writeScope: ["lib/delegation.js"]
}, { at: "2026-01-01T00:00:00.000Z" });
const state = delegation.read(process.cwd());
const unit = state.ledger.workUnits.FIX02;
process.stdout.write(JSON.stringify({
  ok: result.ok,
  status: result.status,
  runtime: "./.claude/harness-lite/lib/delegation.js",
  live: state.live,
  channel: unit.channel,
  model: unit.model,
  modelFamily: unit.modelFamily,
  reasoning: unit.reasoning,
  dependencies: unit.dependencies,
  writeScope: unit.writeScope,
  unitStatus: unit.status
}));
`;
    const result = run(process.execPath, ['-e', script], { cwd: root });
    assert.deepEqual(JSON.parse(result.stdout), {
      ok: true,
      status: 'RECORDED',
      runtime: './.claude/harness-lite/lib/delegation.js',
      live: true,
      channel: 'codex',
      model: 'gpt-5.5',
      modelFamily: 'gpt-5.5',
      reasoning: 'xhigh',
      dependencies: ['FIX00'],
      writeScope: ['lib/delegation.js'],
      unitStatus: 'active',
    });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('supported agent API persists and reloads agent fields, observations, status, and dependency locks', () => {
  const root = tempRoot();
  try {
    const active = {
      id: 'fix02-active',
      workUnit: 'FIX02',
      status: 'active',
      dependencies: ['FIX00'],
      writeScope: ['lib/delegation.js', 'lib/work.js'],
      agent: {
        channel: 'codex',
        model: 'gpt-5.5',
        modelFamily: 'gpt-5.5',
        reasoning: 'xhigh',
      },
    };
    let result = delegation.recordAgentStatus(root, active, { at: at(0) });
    assert.equal(result.status, 'RECORDED');
    assert.equal(result.report.unitCount, 1);

    let ledger = readLedger(root);
    let unit = ledger.workUnits.FIX02;
    assertAgentFields(unit);
    assert.deepEqual(unit.dependencies, ['FIX00']);
    assert.deepEqual(unit.writeScope, ['lib/delegation.js', 'lib/work.js']);
    assert.equal(unit.status, 'active');
    assert.equal(ledger.events['fix02-active'].recordVersion, 2);
    assertAgentFields(ledger.events['fix02-active']);

    result = delegation.recordAgentObservation(root, { id: 'fix02-heartbeat', workUnit: 'FIX02', kind: 'heartbeat' }, { at: at(300) });
    assert.equal(result.status, 'RECORDED');
    delegation.recordAgentObservation(root, { id: 'fix02-activity', workUnit: 'FIX02', kind: 'activity', activityKind: 'tool-wait' }, { at: at(301) });
    delegation.recordAgentObservation(root, {
      id: 'fix02-progress',
      workUnit: 'FIX02',
      kind: 'progress',
      progressKind: 'verified-fact',
      evidenceRef: 'reports/fix02-fact.md',
    }, { at: at(302) });
    delegation.recordAgentStatus(root, { id: 'downstream-active', workUnit: 'FIX03', status: 'active', dependencies: ['FIX02'] }, { at: at(303) });
    delegation.recordAgentStatus(root, {
      id: 'fix02-reported',
      workUnit: 'FIX02',
      status: 'reported_complete',
      summary: 'writer reported complete',
      evidenceRef: 'reports/fix02-complete.md',
    }, { at: at(304) });

    ledger = readLedger(root);
    unit = ledger.workUnits.FIX02;
    assertAgentFields(unit);
    assert.equal(unit.heartbeatAt, at(300));
    assert.equal(unit.activityAt, at(301));
    assert.equal(unit.activityKind, 'tool-wait');
    assert.equal(unit.progressAt, at(302));
    assert.equal(unit.progressKind, 'verified-fact');
    assert.equal(unit.evidenceRef, 'reports/fix02-fact.md');
    assert.equal(unit.reportedResult.status, 'reported_complete');
    assert.equal(delegation.dependencyState(ledger, 'FIX03').ready, false);

    delegation.recordAgentStatus(root, { id: 'fix02-accepted', workUnit: 'FIX02', status: 'accepted', evidenceRef: 'reports/fix02-accepted.md' }, { at: at(305) });
    ledger = readLedger(root);
    unit = ledger.workUnits.FIX02;
    assertAgentFields(unit);
    assert.equal(unit.status, 'accepted');
    assert.equal(unit.acceptedAt, at(305));
    assert.equal(delegation.dependencyState(ledger, 'FIX03').ready, true);

    const summaryUnit = delegation.summary(ledger).units.find((row) => row.id === 'FIX02');
    assertAgentFields(summaryUnit);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('agent event replay is idempotent and changed agent metadata fails closed', () => {
  const root = tempRoot();
  try {
    const event = {
      id: 'fix02-active',
      workUnit: 'FIX02',
      status: 'active',
      channel: 'codex',
      model: 'gpt-5.5',
      modelFamily: 'gpt-5.5',
      reasoning: 'xhigh',
    };
    const first = delegation.recordAgentStatus(root, event, { at: at(0) });
    const replay = delegation.recordAgentStatus(root, event, { at: at(1) });
    assert.equal(first.status, 'RECORDED');
    assert.equal(replay.status, 'REPLAY');
    assert.equal(replay.wrote, false);

    const file = delegation.ledgerPath(root);
    let before = fs.readFileSync(file, 'utf8');
    const conflict = delegation.recordAgentStatus(root, { ...event, model: 'gpt-5.5-rewritten' }, { at: at(2) });
    assert.equal(conflict.ok, false);
    assert.equal(conflict.reason, 'event-replay-conflict');
    assert.equal(conflict.wrote, false);
    assert.equal(fs.readFileSync(file, 'utf8'), before);

    const ledger = readLedger(root);
    ledger.events['fix02-active'].model = 'tampered-model';
    writeLedger(root, ledger);
    before = fs.readFileSync(file, 'utf8');
    const state = delegation.read(root);
    assert.equal(state.live, false);
    assert.equal(state.reason, 'shape');
    const denied = delegation.recordAgentStatus(root, { id: 'after-tamper', workUnit: 'FIX02', status: 'active' }, { at: at(3) });
    assert.equal(denied.status, 'STALE');
    assert.equal(denied.wrote, false);
    assert.equal(fs.readFileSync(file, 'utf8'), before);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('agent failure API reports recovery counts from the same ledger and ignores provider faults', () => {
  const root = tempRoot();
  try {
    let result = delegation.recordAgentFailure(root, agentFailure('valid-1', {
      channel: 'codex-a',
      session: 'session-a',
      primaryCause: 'direct acceptance failed route one',
      substantiveKey: 'route-one',
    }), { at: at(1) });
    assert.equal(result.counted, true);
    assertSameRecoveryReport(result, root);

    result = delegation.recordAgentFailure(root, agentFailure('valid-2', {
      channel: 'codex-b',
      session: 'session-b',
      primaryCause: 'direct acceptance failed route two',
      substantiveKey: 'route-two',
    }), { at: at(2) });
    assert.equal(result.counted, true);
    assertSameRecoveryReport(result, root);

    let ledger = readLedger(root);
    let report = delegation.agentLedgerReport(ledger);
    assert.equal(report.recovery.failureCount, 2);
    assert.equal(report.recoveryLedger.effectiveFailureCount, 2);
    assert.equal(report.recoveryLedger.countedFailureEventCount, 2);
    assert.equal(Object.keys(ledger.failures.problems).length, 1);
    assert.equal(Object.values(ledger.failures.events).every((event) => event.leaseKey === Object.values(ledger.failures.problems)[0].leaseKey), true);
    assert.equal(ledger.failures.events['valid-2'].channel, 'codex-b');
    assert.equal(ledger.failures.events['valid-2'].model, 'gpt-5.5');
    assert.equal(ledger.failures.events['valid-2'].reasoning, 'xhigh');

    result = delegation.recordAgentFailure(root, agentFailure('provider-tool', {
      effective: false,
      category: 'provider',
      nonCountingReason: 'provider-transport',
      channel: 'codex-c',
      session: 'session-c',
      primaryCause: 'provider transport unavailable',
      substantiveKey: 'provider-transport',
    }), { at: at(3) });
    assert.equal(result.counted, false);
    assertSameRecoveryReport(result, root);

    ledger = readLedger(root);
    report = delegation.agentLedgerReport(ledger);
    assert.equal(report.recovery.failureCount, 2);
    assert.equal(report.recoveryLedger.failureEventCount, 3);
    assert.equal(report.recoveryLedger.countedFailureEventCount, 2);
    assert.equal(report.recoveryLedger.nonCountingFailureEventCount, 1);
    assert.equal(report.recoveryLedger.effectiveFailureCount, 2);
    assert.equal(delegation.recoverySummary(ledger).tier, 'ordinary');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
