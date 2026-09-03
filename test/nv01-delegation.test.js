'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const test = require('node:test');

const tree = require('../lib/tree.js');
const delegation = require('../lib/delegation.js');

function tempRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hl-nv01-'));
  fs.mkdirSync(path.join(root, 'docs/harness/leaves'), { recursive: true });
  fs.mkdirSync(path.join(root, 'docs/harness/stages'), { recursive: true });
  fs.writeFileSync(path.join(root, 'docs/harness/stages/stage-alpha.md'), [
    '# Stage Alpha',
    '',
    '目标：ship alpha',
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
    '目标：ship one leaf',
    '',
    '允许动：',
    '',
    '- lib/tree.js',
    '',
    '不许动：',
    '',
    '- release',
    '',
    '## Work Unit NV01 - minimal context',
    '',
    'goal: build minimal package',
    '',
    'directAcceptance:',
    '',
    '- package has goal',
    '- package has result contract',
    '',
    'allowed:',
    '',
    '- lib/tree.js',
    '- lib/delegation.js',
    '',
    'forbidden:',
    '',
    '- provider calls',
    '',
    'facts:',
    '',
    '- NV00 accepted',
    '',
    'entryPoints:',
    '',
    '- lib/tree.js parse/readChain',
    '',
    'disprovenRoutes:',
    '',
    '- full repo summary',
    '',
    'unknowns:',
    '',
    '- markdown variants',
    '',
    'routeBasis: parse a single leaf section and keep missing fields explicit',
    '',
    'dependencies:',
    '',
    '- NV00',
    '',
    'resultContract: report COMPLETE/PARTIAL/BLOCKED with evidence',
    '',
    '## Work Unit NV02 - sparse',
    '',
    'goal: sparse package',
  ].join('\n'));
  return root;
}
function writeValidLedger(root) {
  fs.mkdirSync(path.join(root, 'docs/harness'), { recursive: true });
  const chain = tree.readChain(root);
  const ledger = delegation.freshLedger(root, chain);
  fs.writeFileSync(delegation.ledgerPath(root), `${JSON.stringify(ledger, null, 2)}\n`);
  return ledger;
}

test('tree workUnitPackage exposes the full minimal dispatch contract', () => {
  const root = tempRoot();
  try {
    const pkg = tree.workUnitPackage(root, 'NV01');
    assert.equal(pkg.kind, 'harness-lite-work-unit-package');
    assert.equal(pkg.status, 'work-unit');
    assert.equal(pkg.stage, 'stage-alpha');
    assert.equal(pkg.leaf, 'docs/harness/leaves/L1.md');
    assert.equal(pkg.workUnit, 'NV01');
    assert.equal(pkg.goal, 'build minimal package');
    assert.deepEqual(pkg.completionStandards, ['package has goal', 'package has result contract']);
    assert.equal(Object.hasOwn(pkg, 'directAcceptance'), false);
    assert.deepEqual(pkg.allowed, ['lib/tree.js', 'lib/delegation.js']);
    assert.deepEqual(pkg.forbidden, ['provider calls']);
    assert.deepEqual(pkg.facts, ['NV00 accepted']);
    assert.deepEqual(pkg.entryPoints, ['lib/tree.js parse/readChain']);
    assert.deepEqual(pkg.disprovenRoutes, ['full repo summary']);
    assert.deepEqual(pkg.unknowns, ['markdown variants']);
    assert.equal(pkg.routeBasis, 'parse a single leaf section and keep missing fields explicit');
    assert.deepEqual(pkg.dependencies, ['NV00']);
    assert.equal(pkg.resultContract, 'report COMPLETE/PARTIAL/BLOCKED with evidence');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('tree workUnitPackage makes missing fields explicit UNKNOWN', () => {
  const root = tempRoot();
  try {
    const pkg = tree.workUnitPackage(root, 'NV02');
    assert.equal(pkg.goal, 'sparse package');
    assert.deepEqual(pkg.completionStandards, ['UNKNOWN']);
    assert.equal(pkg.dispatchReady, false);
    assert.deepEqual(pkg.facts, ['UNKNOWN']);
    assert.deepEqual(pkg.entryPoints, ['UNKNOWN']);
    assert.deepEqual(pkg.disprovenRoutes, ['UNKNOWN']);
    assert.deepEqual(pkg.unknowns, ['UNKNOWN']);
    assert.equal(pkg.routeBasis, 'UNKNOWN');
    assert.deepEqual(pkg.dependencies, ['UNKNOWN']);
    assert.equal(pkg.resultContract, 'UNKNOWN');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('delegation ledger binds schema, project, stage, and leaf', () => {
  const root = tempRoot();
  try {
    const first = delegation.recordEvent(root, {
      id: 'evt-1',
      workUnit: 'NV01',
      status: 'active',
      dependencies: ['NV00'],
      writeScope: ['lib/tree.js'],
      summary: 'started',
    }, { at: '2026-01-01T00:00:00.000Z' });
    assert.equal(first.status, 'RECORDED');
    const state = delegation.read(root);
    assert.equal(state.live, true);
    assert.equal(state.ledger.schemaVersion, 1);
    assert.equal(state.ledger.stage, 'stage-alpha');
    assert.equal(state.ledger.leaf, 'docs/harness/leaves/L1.md');
    assert.match(state.ledger.project, /^sha256:[0-9a-f]{64}$/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('delegation ledger mismatch is stale and never live', () => {
  const root = tempRoot();
  try {
    delegation.recordEvent(root, { id: 'evt-1', workUnit: 'NV01', status: 'active' }, { at: '2026-01-01T00:00:00.000Z' });
    const chain = tree.readChain(root);
    const state = delegation.read(root, { ...chain, leaf: { ...chain.leaf, file: path.join(root, 'docs/harness/leaves/L2.md') } });
    assert.equal(state.live, false);
    assert.equal(state.state, 'stale');
    assert.equal(state.status, 'UNKNOWN');
    assert.equal(state.reason, 'leaf');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('delegation refuses to record without a healthy current leaf and stage', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hl-nv01-empty-'));
  try {
    const readState = delegation.read(root);
    const record = delegation.recordEvent(root, { id: 'evt-1', workUnit: 'NV01', status: 'active' });
    assert.equal(readState.live, false);
    assert.equal(readState.state, 'UNKNOWN');
    assert.equal(record.ok, false);
    assert.equal(record.status, 'HOLD');
    assert.equal(record.state, 'UNKNOWN');
    assert.equal(record.wrote, false);
    assert.equal(fs.existsSync(delegation.ledgerPath(root)), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('delegation refuses orphan and conflicting current leaf chains', () => {
  const orphan = fs.mkdtempSync(path.join(os.tmpdir(), 'hl-nv01-orphan-'));
  const conflict = fs.mkdtempSync(path.join(os.tmpdir(), 'hl-nv01-conflict-'));
  try {
    fs.mkdirSync(path.join(orphan, 'docs/harness/leaves'), { recursive: true });
    fs.writeFileSync(path.join(orphan, 'docs/harness/leaves/L1.md'), '# L1\n\n阶段：missing-stage\n');
    const orphanRecord = delegation.recordEvent(orphan, { id: 'evt-1', workUnit: 'NV01', status: 'active' });
    assert.equal(orphanRecord.status, 'HOLD');
    assert.equal(orphanRecord.state, 'UNKNOWN');
    assert.equal(fs.existsSync(delegation.ledgerPath(orphan)), false);

    fs.mkdirSync(path.join(conflict, 'docs/harness/leaves'), { recursive: true });
    fs.mkdirSync(path.join(conflict, 'docs/harness/stages'), { recursive: true });
    fs.writeFileSync(path.join(conflict, 'docs/harness/stages/stage-alpha.md'), '# Stage Alpha\n');
    fs.writeFileSync(path.join(conflict, 'docs/harness/leaves/L1.md'), '# L1\n\n阶段：stage-alpha\n');
    fs.writeFileSync(path.join(conflict, 'docs/harness/leaves/L2.md'), '# L2\n\n阶段：stage-alpha\n');
    const conflictRecord = delegation.recordEvent(conflict, { id: 'evt-1', workUnit: 'NV01', status: 'active' });
    assert.equal(conflictRecord.status, 'HOLD');
    assert.equal(conflictRecord.state, 'UNKNOWN');
    assert.equal(fs.existsSync(delegation.ledgerPath(conflict)), false);
  } finally {
    fs.rmSync(orphan, { recursive: true, force: true });
    fs.rmSync(conflict, { recursive: true, force: true });
  }
});

test('delegation read is never live when the chain is no longer healthy', () => {
  const root = tempRoot();
  try {
    writeValidLedger(root);
    fs.writeFileSync(path.join(root, 'docs/harness/leaves/L2.md'), '# L2\n\n阶段：stage-alpha\n');
    const state = delegation.read(root);
    assert.equal(state.live, false);
    assert.equal(state.state, 'UNKNOWN');
    assert.equal(state.status, 'UNKNOWN');
    assert.equal(state.reason, 'chain');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('delegation preserves malformed JSON and records zero writes', () => {
  const root = tempRoot();
  try {
    const file = delegation.ledgerPath(root);
    fs.writeFileSync(file, '{broken');
    const before = fs.readFileSync(file, 'utf8');
    const state = delegation.read(root);
    const record = delegation.recordEvent(root, { id: 'evt-1', workUnit: 'NV01', status: 'active' });
    assert.equal(state.live, false);
    assert.equal(state.state, 'stale');
    assert.equal(state.status, 'UNKNOWN');
    assert.equal(state.reason, 'malformed-json');
    assert.equal(record.status, 'STALE');
    assert.equal(record.wrote, false);
    assert.equal(fs.readFileSync(file, 'utf8'), before);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('delegation treats non-file and symlink carriers as stale zero-write', () => {
  const directoryRoot = tempRoot();
  const symlinkRoot = tempRoot();
  try {
    fs.mkdirSync(delegation.ledgerPath(directoryRoot), { recursive: true });
    const directoryState = delegation.read(directoryRoot);
    const directoryRecord = delegation.recordEvent(directoryRoot, { id: 'evt-1', workUnit: 'NV01', status: 'active' });
    assert.equal(directoryState.state, 'stale');
    assert.equal(directoryState.reason, 'unsafe-carrier');
    assert.equal(directoryRecord.status, 'STALE');
    assert.equal(directoryRecord.wrote, false);

    const target = path.join(symlinkRoot, 'docs/harness/foreign.json');
    fs.writeFileSync(target, '{}');
    fs.symlinkSync(target, delegation.ledgerPath(symlinkRoot));
    const symlinkState = delegation.read(symlinkRoot);
    const symlinkRecord = delegation.recordEvent(symlinkRoot, { id: 'evt-1', workUnit: 'NV01', status: 'active' });
    assert.equal(symlinkState.state, 'stale');
    assert.equal(symlinkState.reason, 'unsafe-carrier');
    assert.equal(symlinkRecord.status, 'STALE');
    assert.equal(symlinkRecord.wrote, false);
    assert.equal(fs.readFileSync(target, 'utf8'), '{}');
  } finally {
    fs.rmSync(directoryRoot, { recursive: true, force: true });
    fs.rmSync(symlinkRoot, { recursive: true, force: true });
  }
});

test('delegation unknown schema and malformed shape are stale zero-write', () => {
  const schemaRoot = tempRoot();
  const shapeRoot = tempRoot();
  try {
    const schemaFile = delegation.ledgerPath(schemaRoot);
    fs.writeFileSync(schemaFile, `${JSON.stringify({ schemaVersion: 2, kind: delegation.KIND })}\n`);
    const schemaState = delegation.read(schemaRoot);
    const schemaRecord = delegation.recordEvent(schemaRoot, { id: 'evt-1', workUnit: 'NV01', status: 'active' });
    assert.equal(schemaState.state, 'stale');
    assert.equal(schemaState.reason, 'schema');
    assert.equal(schemaRecord.status, 'STALE');
    assert.equal(schemaRecord.wrote, false);

    const shapeFile = delegation.ledgerPath(shapeRoot);
    const ledger = delegation.freshLedger(shapeRoot, tree.readChain(shapeRoot));
    fs.writeFileSync(shapeFile, `${JSON.stringify({ ...ledger, workUnits: [] })}\n`);
    const shapeState = delegation.read(shapeRoot);
    const shapeRecord = delegation.recordEvent(shapeRoot, { id: 'evt-1', workUnit: 'NV01', status: 'active' });
    assert.equal(shapeState.state, 'stale');
    assert.equal(shapeState.reason, 'shape');
    assert.equal(shapeRecord.status, 'STALE');
    assert.equal(shapeRecord.wrote, false);
  } finally {
    fs.rmSync(schemaRoot, { recursive: true, force: true });
    fs.rmSync(shapeRoot, { recursive: true, force: true });
  }
});

test('delegation parsed non-object JSON carriers are stale zero-write', () => {
  for (const [name, body] of [['null', 'null\n'], ['array', '[]\n'], ['string', '"ledger"\n'], ['number', '7\n']]) {
    const root = tempRoot();
    try {
      const file = delegation.ledgerPath(root);
      fs.writeFileSync(file, body);
      const before = fs.readFileSync(file);
      const state = delegation.read(root);
      const record = delegation.recordEvent(root, { id: `evt-${name}`, workUnit: 'NV01', status: 'active' });
      assert.equal(state.live, false, name);
      assert.equal(state.state, 'stale', name);
      assert.equal(state.status, 'UNKNOWN', name);
      assert.equal(state.reason, 'shape', name);
      assert.equal(record.status, 'STALE', name);
      assert.equal(record.wrote, false, name);
      assert.deepEqual(fs.readFileSync(file), before, name);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }
});

test('delegation event replay is idempotent', () => {
  const root = tempRoot();
  try {
    const event = { id: 'evt-1', workUnit: 'NV01', status: 'active', dependencies: ['NV00'] };
    const first = delegation.recordEvent(root, event, { at: '2026-01-01T00:00:00.000Z' });
    const replay = delegation.recordEvent(root, event, { at: '2026-01-01T00:00:01.000Z' });
    assert.equal(first.status, 'RECORDED');
    assert.equal(replay.status, 'REPLAY');
    const state = delegation.read(root);
    assert.deepEqual(state.ledger.workUnits.NV01.events, ['evt-1']);
    assert.equal(Object.keys(state.ledger.events).length, 1);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('reported_complete does not unlock dependencies until accepted', () => {
  const root = tempRoot();
  try {
    delegation.recordEvent(root, { id: 'evt-a', workUnit: 'NV01', status: 'reported_complete', summary: 'done' }, { at: '2026-01-01T00:00:00.000Z' });
    delegation.recordEvent(root, { id: 'evt-b', workUnit: 'NV02', status: 'active', dependencies: ['NV01'] }, { at: '2026-01-01T00:00:01.000Z' });
    let state = delegation.read(root);
    assert.equal(state.ledger.workUnits.NV01.status, 'reported_complete');
    assert.equal(state.ledger.workUnits.NV01.acceptedAt, undefined);
    assert.equal(delegation.dependencyState(state.ledger, 'NV02').ready, false);

    delegation.recordEvent(root, { id: 'evt-c', workUnit: 'NV01', status: 'accepted', evidenceRef: 'report.md' }, { at: '2026-01-01T00:00:02.000Z' });
    state = delegation.read(root);
    assert.equal(state.ledger.workUnits.NV01.status, 'accepted');
    assert.equal(state.ledger.workUnits.NV01.acceptedAt, '2026-01-01T00:00:02.000Z');
    assert.equal(delegation.dependencyState(state.ledger, 'NV02').ready, true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('delegation ledger rejects prompt transcript code and credential payloads', () => {
  const root = tempRoot();
  try {
    assert.throws(() => delegation.recordEvent(root, {
      id: 'evt-secret',
      workUnit: 'NV01',
      status: 'active',
      credential: 'do-not-store',
    }), /cannot persist/);
    const file = delegation.ledgerPath(root);
    assert.equal(fs.existsSync(file), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
