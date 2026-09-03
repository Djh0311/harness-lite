'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const test = require('node:test');

const delegation = require('../lib/delegation.js');
const install = require('../lib/install.js');
const tree = require('../lib/tree.js');
const work = require('../lib/work.js');

const sourceRoot = path.resolve(__dirname, '..');

function tempRoot(prefix = 'hl-r2-parallel-') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  fs.mkdirSync(path.join(root, 'docs/harness/leaves'), { recursive: true });
  fs.mkdirSync(path.join(root, 'docs/harness/stages'), { recursive: true });
  fs.writeFileSync(path.join(root, 'docs/harness/plan.md'), '# R2 Plan\n\n目标：parallel context\n');
  fs.writeFileSync(path.join(root, 'docs/harness/stages/stage-r2.md'), [
    '# Stage R2',
    '',
    '目标：repair parallel context',
    '',
    '不许动：',
    '',
    '- push',
    '- release',
  ].join('\n'));
  return root;
}

function workUnitSection(id, goal, allowed, deps = ['R2F00']) {
  return [
    `## Work Unit ${id} - sentinel`,
    '',
    `goal: ${goal}`,
    '',
    'directAcceptance:',
    '',
    `- ${id} direct acceptance one`,
    `- ${id} direct acceptance two`,
    '',
    'allowed:',
    '',
    ...allowed.map((item) => `- ${item}`),
    '',
    'forbidden:',
    '',
    '- lib/hook.js',
    '',
    'facts:',
    '',
    `- ${id} fact`,
    '',
    'entryPoints:',
    '',
    '- lib/tree.js',
    '- lib/work.js',
    '',
    'disprovenRoutes:',
    '',
    '- leaf fallback',
    '',
    'unknowns:',
    '',
    '- installed hook wiring',
    '',
    `routeBasis: ${id} route basis`,
    '',
    'dependencies:',
    '',
    ...(deps.length ? deps.map((item) => `- ${item}`) : ['- 无']),
    '',
    `resultContract: ${id} COMPLETE/PARTIAL/BLOCKED`,
    '',
  ].join('\n');
}

function writeHarnessState(root, units = ['R2F00', 'R2F01', 'R2F02', 'R2F03', 'R2F04', 'R2F05']) {
  const allowedById = {
    R2F00: ['docs/harness/**'],
    R2F01: ['lib/capabilities.js', 'test/r2-capability-visibility.test.js'],
    R2F02: ['lib/tree.js', 'lib/work.js', 'test/r2-parallel-context.test.js'],
    R2F03: ['lib/hook.js'],
    R2F04: ['NEXT-VERSION-DISPATCH-PLAN.md'],
    R2F05: ['docs/harness/reports/**'],
  };
  const depsById = {
    R2F00: [],
    R2F01: ['R2F00'],
    R2F02: ['R2F00'],
    R2F03: ['R2F01', 'R2F02'],
    R2F04: ['R2F03'],
    R2F05: ['R2F04'],
  };
  fs.writeFileSync(path.join(root, 'docs/harness/leaves/R2.md'), [
    '# R2 Leaf',
    '',
    '阶段：stage-r2',
    '',
    '目标：R2 leaf goal',
    '',
    '允许动：',
    '',
    '- lib/tree.js',
    '- lib/work.js',
    '',
    '不许动：',
    '',
    '- push',
    '- release',
    '',
    ...units.map((id) => workUnitSection(id, `${id} goal sentinel`, allowedById[id], depsById[id])),
  ].join('\n'));
}

function record(root, event, at) {
  const result = delegation.recordEvent(root, event, { at });
  assert.equal(result.ok, true, result.reason);
  return result;
}

function recordAcceptedBase(root) {
  record(root, { id: 'evt-r2f00-active', workUnit: 'R2F00', status: 'active', writeScope: ['docs/harness/**'] },
    '2026-01-01T00:00:00.000Z');
  record(root, { id: 'evt-r2f00-accepted', workUnit: 'R2F00', status: 'accepted', evidenceRef: 'reports/r2f00.md' },
    '2026-01-01T00:00:01.000Z');
}

function recordParallelActive(root, scopes = {}) {
  recordAcceptedBase(root);
  record(root, {
    id: 'evt-r2f01-active',
    workUnit: 'R2F01',
    status: 'active',
    dependencies: ['R2F00'],
    writeScope: scopes.R2F01 || ['lib/capabilities.js', 'test/r2-capability-visibility.test.js'],
    channel: 'collaboration.spawn_agent',
    model: 'gpt-5.5',
    modelFamily: 'openai-engineering',
    reasoning: 'xhigh',
  }, '2026-01-01T00:00:02.000Z');
  record(root, {
    id: 'evt-r2f02-active',
    workUnit: 'R2F02',
    status: 'active',
    dependencies: ['R2F00'],
    writeScope: scopes.R2F02 || ['lib/tree.js', 'lib/work.js', 'test/r2-parallel-context.test.js'],
    channel: 'collaboration.spawn_agent',
    model: 'gpt-5.5',
    modelFamily: 'openai-engineering',
    reasoning: 'xhigh',
  }, '2026-01-01T00:00:03.000Z');
}

function writeLedger(root, ledger) {
  fs.mkdirSync(path.dirname(delegation.ledgerPath(root)), { recursive: true });
  fs.writeFileSync(delegation.ledgerPath(root), `${JSON.stringify(ledger, null, 2)}\n`);
}

function requireFresh(file) {
  delete require.cache[require.resolve(file)];
  return require(file);
}

test('tree parses R2F work-unit ids and requested packages do not fall back to leaf context', () => {
  const root = tempRoot();
  try {
    writeHarnessState(root);
    const chain = tree.readChain(root);
    assert.deepEqual(chain.leaf.workUnits.map((unit) => unit.id), ['R2F00', 'R2F01', 'R2F02', 'R2F03', 'R2F04', 'R2F05']);
    assert.equal(tree.workUnitId('Work Unit R2F02 - sentinel'), 'R2F02');

    const pkg = tree.workUnitPackage(root, 'R2F02', chain);
    assert.equal(pkg.status, 'work-unit');
    assert.equal(pkg.workUnit, 'R2F02');
    assert.equal(pkg.goal, 'R2F02 goal sentinel');
    assert.deepEqual(pkg.completionStandards, ['R2F02 direct acceptance one', 'R2F02 direct acceptance two']);
    assert.equal(Object.hasOwn(pkg, 'directAcceptance'), false);
    assert.deepEqual(pkg.dependencies, ['R2F00']);
    assert.deepEqual(pkg.writeScope, ['lib/tree.js', 'lib/work.js', 'test/r2-parallel-context.test.js']);

    const list = tree.workUnitPackages(root, ['R2F01', 'R2F02'], chain);
    assert.equal(list.complete, 'complete');
    assert.equal(list.count, 2);
    assert.deepEqual(list.missing, []);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('work parallel context exposes both active units without manual work-unit id', () => {
  const root = tempRoot();
  try {
    writeHarnessState(root);
    recordParallelActive(root);

    const context = work.parallelWorkUnitContext(root, { now: '2026-01-01T00:00:04.000Z' });
    assert.equal(context.kind, 'harness-lite-parallel-work-unit-context');
    assert.equal(context.state, 'known');
    assert.equal(context.status, 'complete');
    assert.equal(context.complete, 'complete');
    assert.deepEqual(context.active, ['R2F01', 'R2F02']);
    assert.deepEqual(context.conflicts, []);
    assert.equal(context.acceptedOnlyUnlock, true);
    assert.equal(context.branchLocalFreeze, true);

    const r2f02 = context.units.find((unit) => unit.id === 'R2F02');
    assert.equal(r2f02.status, 'active');
    assert.equal(r2f02.goal, 'R2F02 goal sentinel');
    assert.deepEqual(r2f02.completionStandards, ['R2F02 direct acceptance one', 'R2F02 direct acceptance two']);
    assert.equal(Object.hasOwn(r2f02, 'directAcceptance'), false);
    assert.deepEqual(r2f02.dependencies, ['R2F00']);
    assert.deepEqual(r2f02.writeScope, ['lib/tree.js', 'lib/work.js', 'test/r2-parallel-context.test.js']);
    assert.equal(r2f02.channel, 'collaboration.spawn_agent');
    assert.equal(r2f02.model, 'gpt-5.5');
    assert.equal(r2f02.modelFamily, 'openai-engineering');
    assert.equal(r2f02.reasoning, 'xhigh');

    const lines = work.parallelWorkUnitLines(context).join('\n');
    assert.ok(lines.includes('ParallelWorkUnits：state=known；status=complete；complete=complete；active=2；units=2；conflicts=0'), lines);
    assert.ok(lines.includes('ParallelUnit：id=R2F01'), lines);
    assert.ok(lines.includes('ParallelUnit：id=R2F02'), lines);
    assert.equal(lines.includes('…+1'), false, lines);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('single active and single leaf work-unit package behavior stays stable', () => {
  const root = tempRoot();
  try {
    writeHarnessState(root, ['R2F02']);
    record(root, {
      id: 'evt-r2f02-active',
      workUnit: 'R2F02',
      status: 'active',
      writeScope: ['lib/tree.js', 'lib/work.js'],
      modelFamily: 'openai-engineering',
    }, '2026-01-01T00:00:00.000Z');

    const pkg = tree.workUnitPackage(root, null);
    assert.equal(pkg.selection, 'single-leaf-work-unit');
    assert.equal(pkg.status, 'work-unit');
    assert.equal(pkg.workUnit, 'R2F02');

    const context = work.parallelWorkUnitContext(root);
    assert.deepEqual(context.active, ['R2F02']);
    assert.equal(context.units[0].goal, pkg.goal);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('overlapping active write scopes remain conflicts while retaining every active unit', () => {
  const root = tempRoot();
  try {
    writeHarnessState(root);
    recordParallelActive(root, { R2F01: ['lib/**'], R2F02: ['lib/work.js'] });

    const context = work.parallelWorkUnitContext(root);
    assert.equal(context.status, 'conflict');
    assert.equal(context.complete, 'complete');
    assert.deepEqual(context.active, ['R2F01', 'R2F02']);
    assert.deepEqual(context.units.map((unit) => unit.id), ['R2F01', 'R2F02']);
    assert.deepEqual(context.conflicts, [{
      units: ['R2F01', 'R2F02'],
      overlap: [['lib/**', 'lib/work.js']],
      action: 'integration-owner-or-split-or-serial',
    }]);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('reported_complete does not unlock dependents, accepted does', () => {
  const root = tempRoot();
  try {
    writeHarnessState(root);
    recordAcceptedBase(root);
    record(root, { id: 'evt-r2f01-active', workUnit: 'R2F01', status: 'active', dependencies: ['R2F00'] },
      '2026-01-01T00:00:02.000Z');
    record(root, { id: 'evt-r2f01-report', workUnit: 'R2F01', status: 'reported_complete', summary: 'writer complete' },
      '2026-01-01T00:00:03.000Z');
    record(root, { id: 'evt-r2f03-waiting', workUnit: 'R2F03', status: 'rejected', dependencies: ['R2F01'] },
      '2026-01-01T00:00:04.000Z');

    let context = work.parallelWorkUnitContext(root);
    assert.deepEqual(context.waiting, [{ id: 'R2F03', blockers: [{ id: 'R2F01', status: 'reported_complete', accepted: false }] }]);
    assert.equal(context.runnable.includes('R2F03'), false);

    record(root, { id: 'evt-r2f01-accepted', workUnit: 'R2F01', status: 'accepted', evidenceRef: 'reports/r2f01.md' },
      '2026-01-01T00:00:05.000Z');
    context = work.parallelWorkUnitContext(root);
    assert.deepEqual(context.waiting, []);
    assert.equal(context.runnable.includes('R2F03'), true);
    assert.deepEqual(context.accepted, ['R2F00', 'R2F01']);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('blocked and partial statuses freeze only dependent branches', () => {
  const root = tempRoot();
  try {
    writeHarnessState(root);
    const ledger = delegation.freshLedger(root, tree.readChain(root));
    ledger.workUnits.R2F01 = { id: 'R2F01', status: 'blocked', dependencies: [], writeScope: [], events: [] };
    ledger.workUnits.R2F02 = { id: 'R2F02', status: delegation.UNKNOWN, dependencies: ['R2F01'], writeScope: [], events: [] };
    ledger.workUnits.R2F03 = { id: 'R2F03', status: delegation.UNKNOWN, dependencies: [], writeScope: [], events: [] };
    ledger.workUnits.R2F04 = { id: 'R2F04', status: 'partial', dependencies: [], writeScope: [], events: [] };
    ledger.workUnits.R2F05 = { id: 'R2F05', status: delegation.UNKNOWN, dependencies: ['R2F04'], writeScope: [], events: [] };
    writeLedger(root, ledger);

    const context = work.parallelWorkUnitContext(root);
    assert.deepEqual(context.runnable, ['R2F03']);
    assert.deepEqual(context.waiting, [
      { id: 'R2F02', blockers: [{ id: 'R2F01', status: 'blocked', accepted: false }] },
      { id: 'R2F05', blockers: [{ id: 'R2F04', status: 'partial', accepted: false }] },
    ]);
    assert.deepEqual(context.blocked, ['R2F01']);
    assert.deepEqual(context.partial, ['R2F04']);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('fresh installed runtime exposes the same tree and work parallel context APIs', () => {
  const root = tempRoot('hl-r2-parallel-installed-');
  try {
    writeHarnessState(root);
    recordParallelActive(root);
    const installed = install.install(root, { write: true, source: sourceRoot });
    assert.equal(installed.status, 'INSTALLED');

    const installedTree = requireFresh(path.join(root, install.RUNTIME, 'lib/tree.js'));
    const installedWork = requireFresh(path.join(root, install.RUNTIME, 'lib/work.js'));
    const pkg = installedTree.workUnitPackage(root, 'R2F02');
    const context = installedWork.parallelWorkUnitContext(root);

    assert.equal(pkg.status, 'work-unit');
    assert.equal(pkg.goal, 'R2F02 goal sentinel');
    assert.equal(context.complete, 'complete');
    assert.deepEqual(context.active, ['R2F01', 'R2F02']);
    assert.equal(context.units.find((unit) => unit.id === 'R2F01').modelFamily, 'openai-engineering');
    assert.equal(context.carrier.readApi, 'work.parallelWorkUnitContext');
    assert.equal(context.carrier.truncated, false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
