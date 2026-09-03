'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const test = require('node:test');

const originalHome = process.env.HOME;
const originalUserProfile = process.env.USERPROFILE;
const originalCodexHome = process.env.CODEX_HOME;
const syntheticHome = fs.mkdtempSync(path.join(os.tmpdir(), 'hl12-f03-home-'));
process.env.HOME = syntheticHome;
process.env.USERPROFILE = syntheticHome;
process.env.CODEX_HOME = path.join(syntheticHome, '.codex');
fs.mkdirSync(process.env.CODEX_HOME, { recursive: true });

const delegation = require('../lib/delegation.js');
const hook = require('../lib/hook.js');
const tree = require('../lib/tree.js');
const work = require('../lib/work.js');

test.after(() => {
  if (originalHome === undefined) delete process.env.HOME; else process.env.HOME = originalHome;
  if (originalUserProfile === undefined) delete process.env.USERPROFILE; else process.env.USERPROFILE = originalUserProfile;
  if (originalCodexHome === undefined) delete process.env.CODEX_HOME; else process.env.CODEX_HOME = originalCodexHome;
  const stat = fs.lstatSync(syntheticHome);
  assert.equal(stat.isDirectory() && !stat.isSymbolicLink(), true, syntheticHome);
  fs.rmSync(syntheticHome, { recursive: true, force: false });
  assert.equal(fs.existsSync(syntheticHome), false, syntheticHome);
});

function disposable(t, label) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `hl12-f03-${label}-`));
  const resolved = fs.realpathSync(root);
  assert.ok(resolved.startsWith(`${path.resolve(os.tmpdir())}${path.sep}hl12-f03-`), resolved);
  t.after(() => {
    const stat = fs.lstatSync(root);
    assert.equal(stat.isDirectory() && !stat.isSymbolicLink(), true, root);
    fs.rmSync(root, { recursive: true, force: false });
    assert.equal(fs.existsSync(root), false, root);
  });
  return root;
}

function unitSection(unit) {
  const id = unit.id;
  return [
    `## Work Unit ${id}`,
    '',
    `goal: ${unit.goal || `${id}-GOAL`}`,
    '',
    'completionStandards:',
    '',
    ...[].concat(unit.completionStandards || `${id}-STANDARD`).map((item) => `- ${item}`),
    '',
    'allowed:',
    '',
    ...[].concat(unit.allowed || `test/${id}.test.js`).map((item) => `- ${item}`),
    '',
    'forbidden:',
    '',
    ...[].concat(unit.forbidden || `${id}-FORBIDDEN`).map((item) => `- ${item}`),
    '',
    'authorityDesign:',
    '',
    ...[].concat(unit.authorityDesign || `${id}-DESIGN`).map((item) => `- ${item}`),
    '',
    'facts:',
    '',
    ...[].concat(unit.facts || `${id}-FACT`).map((item) => `- ${item}`),
    '',
    'entryPoints:',
    '',
    ...[].concat(unit.entryPoints || `${id}-ENTRY`).map((item) => `- ${item}`),
    '',
    'disprovenRoutes:',
    '',
    ...[].concat(unit.disprovenRoutes || `${id}-DISPROVEN`).map((item) => `- ${item}`),
    '',
    'unknowns:',
    '',
    ...[].concat(unit.unknowns || `${id}-UNKNOWN`).map((item) => `- ${item}`),
    '',
    `routeBasis: ${unit.routeBasis || `${id}-ROUTE`}`,
    '',
    'dependencies:',
    '',
    ...(unit.dependencies?.length ? unit.dependencies.map((item) => `- ${item}`) : ['- 无']),
    '',
    `resultContract: ${unit.resultContract || `${id}-RESULT`}`,
    '',
  ].join('\n');
}

function writeHarness(root, units = []) {
  const harness = path.join(root, 'docs', 'harness');
  fs.mkdirSync(path.join(harness, 'stages'), { recursive: true });
  fs.mkdirSync(path.join(harness, 'leaves'), { recursive: true });
  fs.writeFileSync(path.join(harness, 'plan.md'), '# HL12 F03 fixture\n\n目标：work-unit truth\n');
  fs.writeFileSync(path.join(harness, 'stages', 'stage-f03.md'), [
    '# Stage F03',
    '',
    '目标：work-unit truth',
    '',
    '不许动：',
    '',
    '- push',
  ].join('\n'));
  fs.writeFileSync(path.join(harness, 'leaves', 'F03.md'), [
    '# F03 Leaf',
    '',
    '阶段：stage-f03',
    '',
    '目标：F03-LEAF-GOAL',
    '',
    '完成标准：',
    '',
    '- F03-LEAF-STANDARD',
    '',
    '允许动：',
    '',
    '- test/**',
    '',
    '不许动：',
    '',
    '- push',
    '',
    ...units.map(unitSection),
  ].join('\n'));
}

function record(root, event, at) {
  const result = delegation.recordEvent(root, event, { at });
  assert.equal(result.ok, true, result.reason);
  return result;
}

function writeLedger(root, ledger) {
  fs.mkdirSync(path.dirname(delegation.ledgerPath(root)), { recursive: true });
  fs.writeFileSync(delegation.ledgerPath(root), `${JSON.stringify(ledger, null, 2)}\n`);
}

test('ordinary leaf fallback remains usable while every explicit undeclared unit operation HOLDs without a ledger write', (t) => {
  const root = disposable(t, 'leaf-fallback');
  writeHarness(root);

  const fallback = tree.workUnitPackage(root, null);
  assert.equal(fallback.status, 'leaf-fallback');
  assert.equal(fallback.selection, 'leaf-fallback');
  assert.equal(fallback.dispatchReady, true);
  assert.equal(fallback.goal, 'F03-LEAF-GOAL');

  const ghost = tree.workUnitPackage(root, 'A');
  assert.equal(ghost.status, 'UNKNOWN');
  assert.equal(ghost.selection, 'undeclared-work-unit');
  assert.equal(ghost.dispatchReady, false);
  assert.equal(ghost.readiness, 'undeclared-work-unit');
  assert.equal(ghost.goal, 'UNKNOWN');
  assert.deepEqual(ghost.allowed, ['UNKNOWN']);
  assert.deepEqual(ghost.completionStandards, ['UNKNOWN']);
  assert.deepEqual(ghost.unknowns, ['work-unit-not-declared-in-current-leaf']);

  const ledgerFile = delegation.ledgerPath(root);
  for (const event of [
    { id: 'ghost-active', workUnit: 'A', status: 'active' },
    { id: 'ghost-reported', workUnit: 'A', status: 'reported_complete' },
    { id: 'ghost-accepted', workUnit: 'A', status: 'accepted', evidenceRef: 'reports/ghost.md' },
    { id: 'ghost-heartbeat', workUnit: 'A', kind: 'heartbeat' },
  ]) {
    const result = delegation.recordEvent(root, event, { at: '2026-09-02T00:00:00.000Z' });
    assert.equal(result.ok, false, event.id);
    assert.equal(result.status, 'HOLD', event.id);
    assert.equal(result.reason, 'undeclared-work-unit', event.id);
    assert.equal(result.wrote, false, event.id);
    assert.equal(fs.existsSync(ledgerFile), false, event.id);
  }
  assert.deepEqual(delegation.dependencyState(delegation.freshLedger(root), 'A'), {
    workUnit: 'A', ready: false, dependencies: [], accepted: false,
  });
});

test('declared lifecycle stays healthy, ghost events are byte-zero-write, and only accepted unlocks a dependent', (t) => {
  const root = disposable(t, 'declared-flow');
  writeHarness(root, [
    { id: 'GOOD1' },
    { id: 'DEP1', dependencies: ['GOOD1'] },
  ]);
  record(root, { id: 'good-active', workUnit: 'good1', status: 'active' }, '2026-09-02T00:00:00.000Z');
  record(root, {
    id: 'dep-pending', workUnit: 'DEP1', status: 'rejected', dependencies: ['GOOD1'],
  }, '2026-09-02T00:00:01.000Z');

  const ledgerFile = delegation.ledgerPath(root);
  assert.deepEqual(Object.keys(delegation.read(root).ledger.workUnits).sort(), ['DEP1', 'GOOD1']);
  const beforeGhost = fs.readFileSync(ledgerFile);
  const ghostPackage = tree.workUnitPackage(root, 'GHOST99');
  assert.equal(ghostPackage.status, 'UNKNOWN');
  assert.equal(ghostPackage.dispatchReady, false);
  for (const event of [
    { id: 'ghost-active', workUnit: 'GHOST99', status: 'active' },
    { id: 'ghost-reported', workUnit: 'GHOST99', status: 'reported_complete' },
    { id: 'ghost-accepted', workUnit: 'GHOST99', status: 'accepted', evidenceRef: 'reports/ghost.md' },
  ]) {
    const result = delegation.recordEvent(root, event, { at: '2026-09-02T00:00:02.000Z' });
    assert.equal(result.ok, false, event.id);
    assert.equal(result.reason, 'undeclared-work-unit', event.id);
    assert.equal(result.wrote, false, event.id);
    assert.equal(fs.readFileSync(ledgerFile).equals(beforeGhost), true, event.id);
  }

  record(root, {
    id: 'good-reported', workUnit: 'GOOD1', status: 'reported_complete', evidenceRef: 'reports/writer.md',
  }, '2026-09-02T00:00:03.000Z');
  let state = delegation.read(root);
  assert.equal(delegation.dependencyState(state.ledger, 'DEP1').ready, false);
  assert.deepEqual(delegation.summary(state.ledger).accepted, []);

  record(root, {
    id: 'good-accepted', workUnit: 'GOOD1', status: 'accepted', evidenceRef: 'reports/supervisor.md',
  }, '2026-09-02T00:00:04.000Z');
  state = delegation.read(root);
  assert.equal(delegation.dependencyState(state.ledger, 'DEP1').ready, true);
  assert.deepEqual(delegation.summary(state.ledger).accepted, ['GOOD1']);
  assert.equal(Object.hasOwn(state.ledger.workUnits, 'GHOST99'), false);
});

test('legacy ledger bytes remain readable but an undeclared accepted row is ineffective and cannot receive new writes', (t) => {
  const root = disposable(t, 'legacy-ghost');
  writeHarness(root, [
    { id: 'GOOD1' },
    { id: 'DEP1', dependencies: ['GHOST99'] },
  ]);
  const chain = tree.readChain(root);
  const ledger = delegation.freshLedger(root, chain);
  ledger.workUnits.GHOST99 = {
    id: 'GHOST99', status: 'accepted', dependencies: [], writeScope: [], events: ['old-ghost-accepted'],
    acceptedAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z',
  };
  ledger.events['old-ghost-accepted'] = {
    digest: `sha256:${'a'.repeat(64)}`, workUnit: 'GHOST99', status: 'accepted', at: '2026-09-01T00:00:00.000Z',
  };
  ledger.workUnits.DEP1 = {
    id: 'DEP1', status: 'rejected', dependencies: ['GHOST99'], writeScope: [], events: ['old-dep-pending'],
    updatedAt: '2026-09-01T00:00:01.000Z',
  };
  ledger.events['old-dep-pending'] = {
    digest: `sha256:${'b'.repeat(64)}`, workUnit: 'DEP1', status: 'rejected', at: '2026-09-01T00:00:01.000Z',
  };
  writeLedger(root, ledger);

  const before = fs.readFileSync(delegation.ledgerPath(root));
  const state = delegation.read(root);
  assert.equal(state.live, true, state.reason);
  assert.deepEqual(delegation.summary(state.ledger).accepted, []);
  assert.deepEqual(delegation.summary(state.ledger).units.map((unit) => unit.id), ['DEP1']);
  assert.deepEqual(delegation.dependencyState(state.ledger, 'DEP1'), {
    workUnit: 'DEP1',
    ready: false,
    dependencies: [{ id: 'GHOST99', status: 'UNKNOWN', accepted: false }],
    accepted: false,
  });
  const unbound = JSON.parse(JSON.stringify(state.ledger));
  assert.equal(delegation.dependencyState(unbound, 'DEP1').ready, false);
  assert.deepEqual(delegation.summary(unbound).units, []);

  const result = delegation.recordEvent(root, {
    id: 'new-ghost-accepted', workUnit: 'GHOST99', status: 'accepted', evidenceRef: 'reports/new-ghost.md',
  }, { at: '2026-09-02T00:00:00.000Z' });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'undeclared-work-unit');
  assert.equal(result.wrote, false);
  assert.equal(fs.readFileSync(delegation.ledgerPath(root)).equals(before), true);
});

test('two runnable units expose every complete structured package and the formal SessionStart carrier', (t) => {
  const root = disposable(t, 'multi-runnable');
  writeHarness(root, [
    { id: 'RUN1', allowed: ['lib/tree.js'], forbidden: ['push'], entryPoints: ['tree.workUnitPackage'] },
    { id: 'RUN2', allowed: ['lib/work.js'], forbidden: ['release'], entryPoints: ['work.parallelWorkUnitContext'] },
  ]);
  record(root, { id: 'run1-ready', workUnit: 'RUN1', status: 'rejected' }, '2026-09-02T00:00:00.000Z');
  record(root, { id: 'run2-ready', workUnit: 'RUN2', status: 'rejected' }, '2026-09-02T00:00:01.000Z');

  const context = work.parallelWorkUnitContext(root, { now: '2026-09-02T00:00:02.000Z' });
  assert.equal(context.state, 'known');
  assert.equal(context.status, 'complete');
  assert.equal(context.complete, 'complete');
  assert.deepEqual(context.active, []);
  assert.equal(context.runningCount, 0);
  assert.deepEqual(context.runnable, ['RUN1', 'RUN2']);
  assert.deepEqual(context.packageIds, ['RUN1', 'RUN2']);
  assert.equal(context.packageCount, 2);
  assert.equal(context.activeCount, 2);
  assert.equal(context.selection, 'runnable');
  assert.deepEqual(context.packageList, { complete: 'complete', missing: [], count: 2 });

  const fields = [
    'schemaVersion', 'kind', 'workUnit', 'stage', 'leaf', 'goal', 'completionStandards', 'readiness',
    'allowed', 'forbidden', 'authorityDesign', 'facts', 'entryPoints',
    'disprovenRoutes', 'unknowns', 'routeBasis', 'dependencies', 'writeScope', 'resultContract', 'source',
    'package',
  ];
  for (const unit of context.units) {
    assert.equal(unit.packageStatus, 'work-unit', unit.id);
    assert.equal(unit.selection, 'requested', unit.id);
    assert.equal(unit.dispatchReady, true, unit.id);
    for (const field of fields) assert.equal(Object.hasOwn(unit, field), true, `${unit.id}.${field}`);
    assert.deepEqual(unit.completionStandards, [`${unit.id}-STANDARD`]);
    assert.deepEqual(unit.authorityDesign, [`${unit.id}-DESIGN`]);
    assert.deepEqual(unit.facts, [`${unit.id}-FACT`]);
    assert.deepEqual(unit.disprovenRoutes, [`${unit.id}-DISPROVEN`]);
    assert.deepEqual(unit.unknowns, [`${unit.id}-UNKNOWN`]);
    assert.equal(unit.routeBasis, `${unit.id}-ROUTE`);
    assert.equal(unit.resultContract, `${unit.id}-RESULT`);
    assert.equal(unit.source.leaf, path.join(root, 'docs', 'harness', 'leaves', 'F03.md'));
    assert.deepEqual(unit.package, tree.workUnitPackage(root, unit.id));
    assert.notEqual(unit.packageStatus, 'leaf-fallback');
  }
  assert.deepEqual(context.units[0].allowed, ['lib/tree.js']);
  assert.deepEqual(context.units[0].entryPoints, ['tree.workUnitPackage']);
  assert.deepEqual(context.units[1].allowed, ['lib/work.js']);
  assert.deepEqual(context.units[1].entryPoints, ['work.parallelWorkUnitContext']);

  const lines = work.parallelWorkUnitLines(context).join('\n');
  for (const needle of ['RUN1-GOAL', 'RUN1-STANDARD', 'RUN2-GOAL', 'RUN2-STANDARD']) assert.ok(lines.includes(needle), lines);
  assert.equal(/id=UNKNOWN|status=leaf-fallback/.test(lines), false, lines);

  const formal = hook.sessionStart(root, {
    hook_event_name: 'SessionStart', cwd: root, session_id: 'f03-session', turn_id: 'f03-turn',
  }, { now: '2026-09-02T00:00:02.000Z' }).hookSpecificOutput.additionalContext;
  for (const needle of ['ParallelWorkUnitsCarrier：complete=', 'count=2', 'ids=RUN1,RUN2', 'readApi=tree.workUnitPackages', 'digest=sha256:', 'sentinelStart=', 'sentinelMiddle=', 'sentinelEnd=']) assert.ok(formal.includes(needle), formal);
  assert.equal(/id=UNKNOWN|status=leaf-fallback/.test(formal), false, formal);
});

test('formal SessionStart projects declared independent units before and after a rejected ledger record', (t) => {
  const root = disposable(t, 'formal-no-ledger');
  writeHarness(root, [
    { id: 'NLEDGER1', goal: 'NLEDGER1-GOAL', completionStandards: ['NLEDGER1-STANDARD'], dependencies: [] },
    { id: 'NLEDGER2', goal: 'NLEDGER2-GOAL', completionStandards: ['NLEDGER2-STANDARD'], dependencies: [] },
  ]);

  // This is the original R44 shape: a current leaf declares two independent
  // runnable units, but no delegation ledger has been created yet.
  const noLedger = hook.sessionStart(root, {
    hook_event_name: 'SessionStart', cwd: root, session_id: 'r44-no-ledger', turn_id: 'turn-1',
  }, { now: '2026-09-03T00:00:00.000Z' }).hookSpecificOutput.additionalContext;
  assert.ok(noLedger.includes('ParallelWorkUnitsCarrier：'), noLedger);
  assert.ok(noLedger.includes('count=2；ids=NLEDGER1,NLEDGER2；'), noLedger);
  const noLedgerContext = work.parallelWorkUnitContext(root);
  assert.deepEqual(noLedgerContext.units.map((unit) => unit.id), ['NLEDGER1', 'NLEDGER2']);
  assert.deepEqual(noLedgerContext.units.map((unit) => unit.goal), ['NLEDGER1-GOAL', 'NLEDGER2-GOAL']);
  assert.deepEqual(noLedgerContext.units.map((unit) => unit.completionStandards), [['NLEDGER1-STANDARD'], ['NLEDGER2-STANDARD']]);
  assert.equal(/id=UNKNOWN|status=leaf-fallback/.test(noLedger), false, noLedger);

  // A rejected (non-accepted) writer record makes the ledger live.  The
  // projection must remain complete for both independently declared units;
  // rejected/unrelated lifecycle facts must not erase the leaf packages.
  record(root, { id: 'nledger1-rejected', workUnit: 'NLEDGER1', status: 'rejected' }, '2026-09-03T00:00:01.000Z');
  const ledgerBacked = hook.sessionStart(root, {
    hook_event_name: 'SessionStart', cwd: root, session_id: 'r44-ledger', turn_id: 'turn-2',
  }, { now: '2026-09-03T00:00:02.000Z' }).hookSpecificOutput.additionalContext;
  assert.ok(ledgerBacked.includes('ParallelWorkUnitsCarrier：'), ledgerBacked);
  assert.ok(ledgerBacked.includes('count=2；ids=NLEDGER1,NLEDGER2；'), ledgerBacked);
  const ledgerContext = work.parallelWorkUnitContext(root);
  assert.deepEqual(ledgerContext.units.map((unit) => unit.id), ['NLEDGER1', 'NLEDGER2']);
  assert.deepEqual(ledgerContext.units.map((unit) => unit.goal), ['NLEDGER1-GOAL', 'NLEDGER2-GOAL']);
  assert.deepEqual(ledgerContext.units.map((unit) => unit.completionStandards), [['NLEDGER1-STANDARD'], ['NLEDGER2-STANDARD']]);
  assert.equal(/id=UNKNOWN|status=leaf-fallback/.test(ledgerBacked), false, ledgerBacked);
});

test('malformed delegation carrier remains fail-closed and does not project static runnable packages', (t) => {
  const root = disposable(t, 'malformed-ledger');
  writeHarness(root, [
    { id: 'MALFORMED1', goal: 'MALFORMED1-GOAL', completionStandards: ['MALFORMED1-STANDARD'], dependencies: [] },
    { id: 'MALFORMED2', goal: 'MALFORMED2-GOAL', completionStandards: ['MALFORMED2-STANDARD'], dependencies: [] },
  ]);
  const ledgerFile = delegation.ledgerPath(root);
  fs.mkdirSync(path.dirname(ledgerFile), { recursive: true });
  fs.writeFileSync(ledgerFile, '{ not-json');

  const state = delegation.read(root);
  assert.equal(state.live, false);
  assert.notEqual(state.reason, 'missing');
  const context = work.parallelWorkUnitContext(root);
  assert.notEqual(context.state, 'known');
  assert.deepEqual(context.units, []);
  const formal = hook.sessionStart(root, {
    hook_event_name: 'SessionStart', cwd: root, session_id: 'malformed-ledger', turn_id: 'turn-1',
  }).hookSpecificOutput.additionalContext;
  assert.equal(/MALFORMED1-GOAL|MALFORMED2-GOAL|ParallelWorkUnitsCarrier：/.test(formal), false, formal);
});

test('two runnable packages remain complete when another unit is already active', (t) => {
  const root = disposable(t, 'active-and-runnable');
  writeHarness(root, [{ id: 'ACTIVE1' }, { id: 'RUN1' }, { id: 'RUN2' }]);
  record(root, { id: 'active1', workUnit: 'ACTIVE1', status: 'active' }, '2026-09-02T00:00:00.000Z');
  record(root, { id: 'run1-ready', workUnit: 'RUN1', status: 'rejected' }, '2026-09-02T00:00:01.000Z');
  record(root, { id: 'run2-ready', workUnit: 'RUN2', status: 'rejected' }, '2026-09-02T00:00:02.000Z');

  const context = work.parallelWorkUnitContext(root, { now: '2026-09-02T00:00:03.000Z' });
  assert.deepEqual(context.active, ['ACTIVE1']);
  assert.equal(context.runningCount, 1);
  assert.deepEqual(context.runnable, ['RUN1', 'RUN2']);
  assert.deepEqual(context.packageIds, ['ACTIVE1', 'RUN1', 'RUN2']);
  assert.equal(context.activeCount, 3);
  assert.equal(context.packageCount, 3);
  assert.equal(context.selection, 'active-and-runnable');
  assert.deepEqual(context.units.map((unit) => unit.id), ['ACTIVE1', 'RUN1', 'RUN2']);
  assert.equal(context.units.every((unit) => unit.packageStatus === 'work-unit' && unit.dispatchReady), true);
});
