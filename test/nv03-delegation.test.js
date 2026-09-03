'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const test = require('node:test');

const tree = require('../lib/tree.js');
const delegation = require('../lib/delegation.js');
const { workUnitDeclarations } = require('./fixtures/work-unit-declarations.js');

function tempRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hl-nv03-delegation-'));
  fs.mkdirSync(path.join(root, 'docs/harness/leaves'), { recursive: true });
  fs.mkdirSync(path.join(root, 'docs/harness/stages'), { recursive: true });
  fs.writeFileSync(path.join(root, 'docs/harness/plan.md'), '# Plan\n\n目标：test NV03\n');
  fs.writeFileSync(path.join(root, 'docs/harness/stages/stage-alpha.md'), [
    '# Stage Alpha',
    '',
    '目标：stage',
    '',
    '不许动：',
    '',
    '- release',
  ].join('\n'));
  fs.writeFileSync(path.join(root, 'docs/harness/leaves/L1.md'), [
    '# Leaf One',
    '',
    '阶段：stage-alpha',
    '',
    '目标：leaf',
    '',
    '完成标准：',
    '',
    '- delegation state transitions remain correct',
    '',
    '允许动：',
    '',
    '- lib/delegation.js',
    '- lib/hook.js',
    '',
    '不许动：',
    '',
    '- push',
    ...workUnitDeclarations(['A', 'B', 'C', 'D', 'E']),
  ].join('\n'));
  return root;
}

function record(root, event, at) {
  const result = delegation.recordEvent(root, event, { at });
  assert.equal(result.ok, true, result.reason);
  return result;
}

function liveSummary(root, now = '2026-01-01T00:00:00.000Z') {
  const state = delegation.read(root);
  assert.equal(state.live, true, state.reason);
  return delegation.summary(state.ledger, { now });
}

function oldStyleValidLedger(root) {
  const chain = tree.readChain(root);
  const ledger = delegation.freshLedger(root, chain);
  ledger.workUnits.A = {
    id: 'A',
    status: 'active',
    dependencies: [],
    writeScope: ['lib/**'],
    events: ['evt-a'],
    activeAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
  ledger.events['evt-a'] = {
    digest: `sha256:${'a'.repeat(64)}`,
    workUnit: 'A',
    status: 'active',
    at: '2026-01-01T00:00:00.000Z',
  };
  return ledger;
}

function writeLedger(root, ledger) {
  fs.mkdirSync(path.dirname(delegation.ledgerPath(root)), { recursive: true });
  fs.writeFileSync(delegation.ledgerPath(root), `${JSON.stringify(ledger, null, 2)}\n`);
}

test('independent disjoint work units can be active without a fixed global concurrency limit', () => {
  const root = tempRoot();
  try {
    record(root, { id: 'evt-a', workUnit: 'A', status: 'active', writeScope: ['lib/delegation.js'] }, '2026-01-01T00:00:00.000Z');
    record(root, { id: 'evt-b', workUnit: 'B', status: 'active', writeScope: ['test/nv03-delegation.test.js'] }, '2026-01-01T00:00:01.000Z');
    const summary = liveSummary(root);
    assert.deepEqual(summary.active, ['A', 'B']);
    assert.deepEqual(summary.conflicts, []);
    assert.equal(summary.concurrencyLimit, null);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('reported_complete does not unlock dependencies, accepted does', () => {
  const root = tempRoot();
  try {
    record(root, { id: 'evt-a-active', workUnit: 'A', status: 'active' }, '2026-01-01T00:00:00.000Z');
    record(root, { id: 'evt-b-pending', workUnit: 'B', status: 'rejected', dependencies: ['A'] }, '2026-01-01T00:00:01.000Z');
    record(root, { id: 'evt-a-report', workUnit: 'A', status: 'reported_complete', summary: 'writer done' }, '2026-01-01T00:00:02.000Z');
    let state = delegation.read(root);
    assert.equal(delegation.dependencyState(state.ledger, 'B').ready, false);
    assert.deepEqual(delegation.summary(state.ledger).waiting, [{ id: 'B', blockers: [{ id: 'A', status: 'reported_complete', accepted: false }] }]);

    record(root, { id: 'evt-a-accepted', workUnit: 'A', status: 'accepted', evidenceRef: 'reports/a.md' }, '2026-01-01T00:00:03.000Z');
    state = delegation.read(root);
    assert.equal(delegation.dependencyState(state.ledger, 'B').ready, true);
    assert.deepEqual(delegation.summary(state.ledger).accepted, ['A']);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('legal old-style status-only ledger events remain readable', () => {
  const root = tempRoot();
  try {
    writeLedger(root, oldStyleValidLedger(root));
    const state = delegation.read(root);
    assert.equal(state.live, true);
    assert.deepEqual(delegation.summary(state.ledger, { now: '2026-01-01T00:05:00.000Z' }).heartbeat.due, ['A']);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('nested malformed ledger shapes fail closed at read boundary and preserve bytes', () => {
  for (const [name, mutate] of [
    ['unit-non-object', (ledger) => { ledger.workUnits.A = null; }],
    ['dependencies-not-array', (ledger) => { ledger.workUnits.A.dependencies = 'B'; }],
    ['writeScope-not-array', (ledger) => { ledger.workUnits.A.writeScope = 'lib/**'; }],
    ['events-not-array', (ledger) => { ledger.workUnits.A.events = 'evt-a'; }],
    ['unit-time-invalid', (ledger) => { ledger.workUnits.A.activeAt = 'not-a-time'; }],
    ['progress-missing-evidence', (ledger) => { ledger.workUnits.A.progressAt = '2026-01-01T00:01:00.000Z'; ledger.workUnits.A.progressKind = 'verified-fact'; }],
    ['reported-result-not-object', (ledger) => { ledger.workUnits.A.reportedResult = []; }],
    ['event-non-object', (ledger) => { ledger.events['evt-a'] = null; }],
    ['event-missing-workUnit', (ledger) => { delete ledger.events['evt-a'].workUnit; }],
    ['event-missing-at', (ledger) => { delete ledger.events['evt-a'].at; }],
    ['event-orphan', (ledger) => { ledger.events['evt-orphan'] = { digest: `sha256:${'b'.repeat(64)}`, workUnit: 'A', status: 'active', at: '2026-01-01T00:00:01.000Z' }; }],
    ['unit-event-missing', (ledger) => { ledger.workUnits.A.events = ['missing-event']; }],
    ['event-workUnit-mismatch', (ledger) => { ledger.workUnits.B = { id: 'B', status: 'active', dependencies: [], writeScope: [], events: [] }; ledger.events['evt-a'].workUnit = 'B'; }],
  ]) {
    const root = tempRoot();
    try {
      const ledger = oldStyleValidLedger(root);
      mutate(ledger);
      writeLedger(root, ledger);
      const before = fs.readFileSync(delegation.ledgerPath(root), 'utf8');
      const state = delegation.read(root);
      assert.equal(state.live, false, name);
      assert.equal(state.state, 'stale', name);
      assert.equal(state.status, 'UNKNOWN', name);
      assert.equal(state.reason, 'shape', name);
      assert.doesNotThrow(() => delegation.summary(state.live ? state.ledger : null), name);
      const record = delegation.recordEvent(root, { id: `evt-new-${name}`, workUnit: 'A', status: 'active' }, { at: '2026-01-01T00:01:00.000Z' });
      assert.equal(record.status, 'STALE', name);
      assert.equal(record.wrote, false, name);
      assert.equal(fs.readFileSync(delegation.ledgerPath(root), 'utf8'), before, name);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }
});

test('active work units with overlapping write-scope prefixes and trailing directory globs are explicit conflicts', () => {
  const root = tempRoot();
  try {
    record(root, { id: 'evt-a', workUnit: 'A', status: 'active', writeScope: ['lib/**'] }, '2026-01-01T00:00:00.000Z');
    record(root, { id: 'evt-b', workUnit: 'B', status: 'active', writeScope: ['lib/work.js'] }, '2026-01-01T00:00:01.000Z');
    assert.deepEqual(liveSummary(root).conflicts, [{
      units: ['A', 'B'],
      overlap: [['lib/**', 'lib/work.js']],
      action: 'integration-owner-or-split-or-serial',
    }]);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('invalid mid-scope wildcards fail closed as write-scope conflicts', () => {
  const root = tempRoot();
  try {
    record(root, { id: 'evt-a', workUnit: 'A', status: 'active', writeScope: ['lib/**/work.js'] }, '2026-01-01T00:00:00.000Z');
    record(root, { id: 'evt-b', workUnit: 'B', status: 'active', writeScope: ['test/nv03-delegation.test.js'] }, '2026-01-01T00:00:01.000Z');
    assert.deepEqual(liveSummary(root).conflicts, [{
      units: ['A', 'B'],
      overlap: [['lib/**/work.js', 'test/nv03-delegation.test.js']],
      action: 'integration-owner-or-split-or-serial',
    }]);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('blocked and partial freeze only dependent branches', () => {
  const root = tempRoot();
  try {
    const chain = tree.readChain(root);
    const ledger = delegation.freshLedger(root, chain);
    ledger.workUnits.A = { id: 'A', status: 'blocked', dependencies: [], writeScope: [], events: [] };
    ledger.workUnits.B = { id: 'B', status: 'UNKNOWN', dependencies: ['A'], writeScope: [], events: [] };
    ledger.workUnits.C = { id: 'C', status: 'UNKNOWN', dependencies: [], writeScope: [], events: [] };
    ledger.workUnits.D = { id: 'D', status: 'UNKNOWN', dependencies: ['E'], writeScope: [], events: [] };
    ledger.workUnits.E = { id: 'E', status: 'partial', dependencies: [], writeScope: [], events: [] };
    fs.mkdirSync(path.dirname(delegation.ledgerPath(root)), { recursive: true });
    fs.writeFileSync(delegation.ledgerPath(root), `${JSON.stringify(ledger, null, 2)}\n`);

    const summary = liveSummary(root);
    assert.deepEqual(summary.runnable, ['C']);
    assert.deepEqual(summary.waiting, [
      { id: 'B', blockers: [{ id: 'A', status: 'blocked', accepted: false }] },
      { id: 'D', blockers: [{ id: 'E', status: 'partial', accepted: false }] },
    ]);
    assert.deepEqual(summary.blocked, ['A']);
    assert.deepEqual(summary.partial, ['E']);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('heartbeat reminder is read-only, summarized once, and stops after reported or accepted', () => {
  const root = tempRoot();
  try {
    record(root, { id: 'evt-a', workUnit: 'A', status: 'active' }, '2026-01-01T00:00:00.000Z');
    record(root, { id: 'evt-b', workUnit: 'B', status: 'active' }, '2026-01-01T00:00:00.000Z');
    assert.deepEqual(liveSummary(root, '2026-01-01T00:04:59.999Z').heartbeat.due, []);
    let heartbeat = liveSummary(root, '2026-01-01T00:05:00.000Z').heartbeat;
    assert.equal(heartbeat.readOnly, true);
    assert.equal(heartbeat.mode, 'single-summary');
    assert.equal(heartbeat.intervalMs, 300000);
    assert.deepEqual(heartbeat.due, ['A', 'B']);

    record(root, { id: 'evt-a-report', workUnit: 'A', status: 'reported_complete' }, '2026-01-01T00:05:01.000Z');
    record(root, { id: 'evt-b-accept', workUnit: 'B', status: 'accepted', evidenceRef: 'reports/b.md' }, '2026-01-01T00:05:01.000Z');
    heartbeat = liveSummary(root, '2026-01-01T00:20:00.000Z').heartbeat;
    assert.deepEqual(heartbeat.due, []);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('heartbeat activity and semantic progress update separate timestamps only', () => {
  const root = tempRoot();
  try {
    record(root, { id: 'evt-a', workUnit: 'A', status: 'active' }, '2026-01-01T00:00:00.000Z');
    record(root, { id: 'evt-heartbeat', workUnit: 'A', kind: 'heartbeat' }, '2026-01-01T00:05:00.000Z');
    let unit = delegation.read(root).ledger.workUnits.A;
    assert.equal(unit.heartbeatAt, '2026-01-01T00:05:00.000Z');
    assert.equal(unit.activityAt, undefined);
    assert.equal(unit.progressAt, undefined);
    assert.equal(unit.updatedAt, '2026-01-01T00:00:00.000Z');

    record(root, { id: 'evt-activity', workUnit: 'A', kind: 'activity', activityKind: 'tool-wait' }, '2026-01-01T00:06:00.000Z');
    unit = delegation.read(root).ledger.workUnits.A;
    assert.equal(unit.activityAt, '2026-01-01T00:06:00.000Z');
    assert.equal(unit.activityKind, 'tool-wait');
    assert.equal(unit.progressAt, undefined);
    assert.equal(unit.heartbeatAt, '2026-01-01T00:05:00.000Z');

    record(root, { id: 'evt-progress', workUnit: 'A', kind: 'progress', progressKind: 'verified-fact', evidenceRef: 'reports/fact.md' }, '2026-01-01T00:07:00.000Z');
    unit = delegation.read(root).ledger.workUnits.A;
    assert.equal(unit.progressAt, '2026-01-01T00:07:00.000Z');
    assert.equal(unit.progressKind, 'verified-fact');
    assert.equal(unit.evidenceRef, 'reports/fact.md');
    assert.equal(unit.activityAt, '2026-01-01T00:06:00.000Z');

    assert.throws(() => delegation.recordEvent(root, {
      id: 'evt-progress-no-evidence',
      workUnit: 'A',
      kind: 'progress',
      progressKind: 'verified-fact',
    }, { at: '2026-01-01T00:08:00.000Z' }), /progress requires/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('invalid event times are HOLD zero-write and cannot suppress later heartbeat due checks', () => {
  const invalidActiveRoot = tempRoot();
  try {
    const file = delegation.ledgerPath(invalidActiveRoot);
    const invalid = delegation.recordEvent(invalidActiveRoot, {
      id: 'evt-invalid',
      workUnit: 'A',
      status: 'active',
      at: 'not-a-time',
    }, { at: '2030-01-01T00:00:00.000Z' });
    assert.equal(invalid.ok, false);
    assert.equal(invalid.status, 'HOLD');
    assert.equal(invalid.reason, 'time');
    assert.equal(invalid.wrote, false);
    assert.equal(fs.existsSync(file), false);

    const invalidOptsTime = delegation.recordEvent(invalidActiveRoot, {
      id: 'evt-invalid-opts',
      workUnit: 'A',
      status: 'active',
    }, { at: 'not-a-time' });
    assert.equal(invalidOptsTime.ok, false);
    assert.equal(invalidOptsTime.reason, 'time');
    assert.equal(invalidOptsTime.wrote, false);
    assert.equal(fs.existsSync(file), false);

    record(invalidActiveRoot, { id: 'evt-valid', workUnit: 'A', status: 'active' }, '2030-01-01T00:00:00.000Z');
    assert.deepEqual(liveSummary(invalidActiveRoot, '2030-01-01T00:05:00.000Z').heartbeat.due, ['A']);
  } finally {
    fs.rmSync(invalidActiveRoot, { recursive: true, force: true });
  }
});

test('heartbeat activity and progress observations cannot create UNKNOWN work units', () => {
  const root = tempRoot();
  try {
    for (const [id, event, reason] of [
      ['heartbeat', { id: 'evt-heartbeat', workUnit: 'A', kind: 'heartbeat' }, 'heartbeat-non-active'],
      ['activity', { id: 'evt-activity', workUnit: 'A', kind: 'activity', activityKind: 'tool-wait' }, 'activity-non-active'],
      ['progress', { id: 'evt-progress', workUnit: 'A', kind: 'progress', progressKind: 'verified-fact', evidenceRef: 'reports/fact.md' }, 'progress-non-active'],
    ]) {
      const result = delegation.recordEvent(root, event, { at: '2026-01-01T00:00:00.000Z' });
      assert.equal(result.ok, false, id);
      assert.equal(result.status, 'HOLD', id);
      assert.equal(result.reason, reason, id);
      assert.equal(result.wrote, false, id);
      assert.equal(fs.existsSync(delegation.ledgerPath(root)), false, id);
    }

    record(root, { id: 'evt-active', workUnit: 'A', status: 'active' }, '2026-01-01T00:00:00.000Z');
    record(root, { id: 'evt-report', workUnit: 'A', status: 'reported_complete' }, '2026-01-01T00:00:01.000Z');
    const nonActive = delegation.recordEvent(root, {
      id: 'evt-late-activity',
      workUnit: 'A',
      kind: 'activity',
      activityKind: 'after-report',
    }, { at: '2026-01-01T00:00:02.000Z' });
    assert.equal(nonActive.ok, false);
    assert.equal(nonActive.reason, 'activity-non-active');
    assert.equal(nonActive.wrote, false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('passive observations do not trigger intervention; direct live evidence can suggest it', () => {
  assert.deepEqual(delegation.interventionAdvice([
    'silence',
    'thinking',
    'long-tool',
    'tool-wait',
    'provider-delay',
    'heartbeat-overdue',
  ]), {
    intervene: false,
    reasons: [],
    passive: ['silence', 'thinking', 'long-tool', 'tool-wait', 'provider-delay', 'heartbeat-overdue'],
    allowedActions: [],
  });
  assert.deepEqual(delegation.interventionAdvice([
    'stopped',
    'stall',
    'actual-blocker',
    'drift',
    'repeated-disproven-route',
    'forbidden-scope',
    'write-scope-overlap',
  ]), {
    intervene: true,
    reasons: ['stopped', 'stall', 'actual-blocker', 'drift', 'repeated-disproven-route', 'forbidden-scope', 'write-scope-overlap'],
    passive: [],
    allowedActions: ['message', 'interrupt', 'takeover'],
  });
});

test('out-of-order events fail closed and preserve the ledger bytes', () => {
  const root = tempRoot();
  try {
    record(root, { id: 'evt-a', workUnit: 'A', status: 'active' }, '2026-01-01T00:10:00.000Z');
    const file = delegation.ledgerPath(root);
    const before = fs.readFileSync(file, 'utf8');
    const stale = delegation.recordEvent(root, {
      id: 'evt-stale',
      workUnit: 'A',
      kind: 'activity',
      activityKind: 'late-log',
    }, { at: '2026-01-01T00:09:59.999Z' });
    assert.equal(stale.ok, false);
    assert.equal(stale.status, 'HOLD');
    assert.equal(stale.reason, 'stale-event');
    assert.equal(stale.wrote, false);
    assert.equal(fs.readFileSync(file, 'utf8'), before);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
