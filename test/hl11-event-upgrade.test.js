'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const test = require('node:test');

const delegation = require('../lib/delegation.js');
const guidance = require('../lib/guidance.js');
const install = require('../lib/install.js');
const io = require('../lib/io.js');
const tree = require('../lib/tree.js');
const work = require('../lib/work.js');

const sourceRoot = path.resolve(__dirname, '..');
const retained10 = path.join(sourceRoot, 'docs', 'harness', 'artifacts',
  'harness-lite-0.10.0-d73f4b4f83e6034e33168995c24ca4514d69bcd70ccc19f8aa255da42d218daa.json');

function temp(prefix = 'hl11-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function writeChain(root, opts = {}) {
  const stageDir = path.join(root, 'docs', 'harness', 'stages');
  const leafDir = path.join(root, 'docs', 'harness', 'leaves');
  fs.mkdirSync(stageDir, { recursive: true });
  fs.mkdirSync(leafDir, { recursive: true });
  fs.writeFileSync(path.join(stageDir, 'stage-hl11.md'), [
    '# Stage HL11',
    '',
    '相关权威设计：',
    '',
    '- HL11-DESIGN-SENTINEL',
    '',
    '相关现有实现：',
    '',
    '- lib/tree.js',
    '',
    '必须保持的架构边界：',
    '',
    '- no release',
    '',
    '不许动：',
    '',
    '- push',
  ].join('\n'));
  const standardLines = opts.missingStandards ? [] : [
    '完成标准：',
    '',
    '- HL11-USER-RESULT-SENTINEL',
    '',
  ];
  fs.writeFileSync(path.join(leafDir, 'HL11.md'), [
    '# HL11 Leaf',
    '',
    '阶段：stage-hl11',
    '目标：HL11-USER-GOAL-SENTINEL',
    '',
    '相关权威设计：',
    '',
    '- HL11-DESIGN-SENTINEL',
    '',
    '相关事实：',
    '',
    '- HL11-FACT-SENTINEL',
    '',
    ...standardLines,
    '允许动：',
    '',
    '- lib/',
    '',
    '不许动：',
    '',
    '- push',
    '',
    'routeBasis：shortest-direct-evidence',
    '',
    '## HL11F01',
    '',
    '目标：HL11-UNIT-GOAL',
    ...(opts.missingStandards ? [] : ['completionStandards：HL11-UNIT-RESULT']),
    'authorityDesign：HL11-UNIT-DESIGN',
    'facts：HL11-UNIT-FACT',
    'entryPoints：lib/tree.js',
    'dependencies：无',
    'resultContract：supervisor evidence',
  ].join('\n'));
}

function materializeCandidate(file) {
  const root = temp('hl11-prev10-source-');
  const candidate = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const row of candidate.files) {
    const target = path.join(root, row.path);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, Buffer.from(row.contentBase64, 'base64'));
    fs.chmodSync(target, parseInt(row.mode, 8));
  }
  return root;
}

function fingerprint(root) {
  return io.list(path.join(root, '.claude', 'harness-lite'), true).map((file) => {
    const rel = path.relative(root, file).replaceAll('\\', '/');
    const stat = fs.statSync(file);
    return [rel, stat.mode & 0o777, fs.readFileSync(file).length, io.sha(fs.readFileSync(file))];
  });
}

test('0.11 leaf contract reads legacy aliases but only emits completion standards, design, facts, and readiness', () => {
  const root = temp('hl11-tree-');
  try {
    writeChain(root);
    const legacy = path.join(root, 'docs', 'harness', 'leaves', 'HL11.md');
    fs.appendFileSync(legacy, '\n## HL11F02\n\ngoal：legacy goal\ndirectAcceptance：legacy observable result\nauthorityDesign：legacy design\nfacts：legacy fact\ndependencies：HL11F01\n');
    const chain = tree.readChain(root);
    const current = tree.workUnitPackage(root, 'HL11F01', chain);
    const old = tree.workUnitPackage(root, 'HL11F02', chain);
    assert.deepEqual(current.completionStandards, ['HL11-UNIT-RESULT']);
    assert.deepEqual(current.authorityDesign, ['HL11-UNIT-DESIGN']);
    assert.deepEqual(current.facts, ['HL11-UNIT-FACT']);
    assert.equal(current.dispatchReady, true);
    assert.equal(Object.hasOwn(current, 'directAcceptance'), false);
    assert.deepEqual(old.completionStandards, ['legacy observable result']);
    assert.equal(Object.hasOwn(old, 'directAcceptance'), false);
    assert.equal(JSON.stringify([current, old]).includes('directAcceptance'), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('0.11 base instruction is short and event guidance is allowlisted, deterministic, and physically scoped', () => {
  const body = install.INSTRUCTION.replace('<!-- HARNESS-LITE:BEGIN -->', '').replace('<!-- HARNESS-LITE:END -->', '').trim();
  assert.equal(body.length <= 900, true, body.length);
  for (const banned of ['300000', 'Grok', 'Gemini', 'Terra', 'Sol', 'provider', 'reported_complete', 'accepted', '旧系统', 'push']) {
    assert.equal(body.includes(banned), false, banned);
  }
  for (const required of ['用户', '权威产品设计', '事实', '完成标准', '最短', '证据', '产品结果', 'guidance']) {
    assert.ok(body.includes(required), required);
  }
  assert.equal(`sha256:${io.sha(install.PREVIOUS_10_INSTRUCTION)}`,
    'sha256:347f45809f37d6c8d8476d97cc8e32c37eff5fac334f178a770484d838e2c090');

  const chain = { leaf: null };
  const view = { state: { live: false }, summary: {} };
  assert.deepEqual(guidance.select(chain, view).events, []);
  const routeA = guidance.select(chain, view, { intent: 'route-clarification' });
  const routeB = guidance.select(chain, view, { intent: 'route-clarification' });
  assert.deepEqual(routeA, routeB);
  assert.deepEqual(routeA.events, ['route-clarification']);
  assert.equal(Object.hasOwn(routeA, 'capabilities'), false);
  assert.throws(() => guidance.select(chain, view, { intent: 'spawn-now' }), /unknown guidance intent/);

  const active = guidance.select(chain, { state: { live: true }, summary: {
    active: ['HL11F01'], reported: [], runnable: [], accepted: [], recovery: { failureCount: 0 },
  } });
  assert.deepEqual(active.events, ['agent-active']);
  assert.ok(active.text.includes('300000'));
  assert.equal(active.text.includes('Terra'), false);
  const recovery = guidance.select(chain, { state: { live: true }, summary: {
    active: [], reported: [], runnable: [], accepted: [], recovery: { failureCount: 1 },
  } });
  assert.deepEqual(recovery.events, ['problem-recovery']);
  assert.ok(recovery.text.includes('Terra'));
  assert.equal(recovery.text.includes('300000ms 做一次'), false);
});

test('status intent is read-only and only adds fields belonging to current events', () => {
  const root = temp('hl11-status-');
  try {
    writeChain(root);
    const before = fs.existsSync(path.join(root, delegation.RELATIVE_PATH));
    const selected = work.status(root, { intent: 'legacy-fact' }).guidance;
    assert.equal(selected.intent, 'legacy-fact');
    assert.deepEqual(selected.events, ['legacy-fact', 'pre-dispatch']);
    assert.ok(selected.capabilities);
    assert.equal(Object.hasOwn(selected, 'heartbeat'), false);
    assert.equal(Object.hasOwn(selected, 'reported'), false);
    assert.equal(Object.hasOwn(selected, 'recovery'), false);
    assert.equal(Object.hasOwn(selected, 'closeout'), false);
    assert.equal(fs.existsSync(path.join(root, delegation.RELATIVE_PATH)), before);
    assert.throws(() => work.status(root, { intent: 'not-allowlisted' }), /unknown guidance intent/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('accepted requires evidence and known completion standards before any ledger write', () => {
  const root = temp('hl11-accept-');
  const unknownRoot = temp('hl11-accept-unknown-');
  try {
    writeChain(root);
    const ledgerFile = path.join(root, delegation.RELATIVE_PATH);
    const missingEvidence = delegation.recordEvent(root, {
      id: 'hl11-accepted-no-evidence', workUnit: 'HL11F01', status: 'accepted',
    }, { write: true, at: '2026-09-01T00:00:00.000Z' });
    assert.equal(missingEvidence.status, 'HOLD');
    assert.equal(missingEvidence.wrote, false);
    assert.equal(fs.existsSync(ledgerFile), false);

    const accepted = delegation.recordEvent(root, {
      id: 'hl11-accepted-with-evidence', workUnit: 'HL11F01', status: 'accepted', evidenceRef: 'reports/hl11f01.md',
    }, { write: true, at: '2026-09-01T00:00:01.000Z' });
    assert.equal(accepted.ok, true);
    assert.equal(accepted.wrote, true);
    assert.equal(accepted.ledger.workUnits.HL11F01.acceptanceEvidenceRef, 'reports/hl11f01.md');

    writeChain(unknownRoot, { missingStandards: true });
    const unknownLedger = path.join(unknownRoot, delegation.RELATIVE_PATH);
    const unknown = delegation.recordEvent(unknownRoot, {
      id: 'hl11-accepted-unknown-standard', workUnit: 'HL11F01', status: 'accepted', evidenceRef: 'reports/green-tests.md',
    }, { write: true, at: '2026-09-01T00:00:02.000Z' });
    assert.equal(unknown.status, 'HOLD');
    assert.match(unknown.reason, /completion standards are UNKNOWN/);
    assert.equal(fs.existsSync(unknownLedger), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(unknownRoot, { recursive: true, force: true });
  }
});

test('retained 0.10 candidate materializes, requires explicit upgrade, and becomes the current runtime', (t) => {
  if (!fs.existsSync(retained10)) {
    t.skip('retained 0.10 artifact is lifecycle evidence and is intentionally outside candidate inputs');
    return;
  }
  const previousSource = materializeCandidate(retained10);
  const project = temp('hl11-upgrade-');
  try {
    const previousInstall = require(path.join(previousSource, 'lib', 'install.js'));
    const installed10 = previousInstall.install(project, { write: true, source: previousSource });
    assert.equal(installed10.status, 'INSTALLED');
    assert.equal(installed10.manifest.runtimeVersion, '0.10.0');
    assert.equal(installed10.manifest.packageDigest, install.PREVIOUS_10_SNAPSHOT.packageDigest);
    assert.equal(installed10.manifest.instructionBlockDigest, install.PREVIOUS_10_SNAPSHOT.instructionBlockDigest);
    assert.equal(install.inspect(project).kind, 'previous-10-snapshot');

    writeChain(project);
    const leaf = path.join(project, 'docs', 'harness', 'leaves', 'HL11.md');
    fs.appendFileSync(leaf, '\n## HL11F02\n\ngoal：legacy unfinished work\ndirectAcceptance：legacy user result\ndependencies：无\n');
    const before = fingerprint(project);
    const hold = install.install(project, { write: true, source: sourceRoot });
    assert.equal(hold.status, 'HOLD');
    assert.equal(hold.kind, 'previous-10-snapshot');
    assert.equal(hold.written, 0);
    assert.deepEqual(fingerprint(project), before);

    const upgraded = install.install(project, { write: true, upgrade: true, source: sourceRoot });
    assert.equal(upgraded.status, 'INSTALLED', JSON.stringify(upgraded));
    assert.equal(upgraded.kind, 'previous-10-snapshot');
    const checked = install.verify06(project);
    assert.equal(checked.ok, true, checked.differences.join(','));
    assert.equal(checked.manifest.runtimeVersion, install.VERSION);
    assert.ok(checked.manifest.managedPaths.includes('lib/guidance.js'));
    const installedTree = require(path.join(project, install.RUNTIME, 'lib', 'tree.js'));
    const legacyPackage = installedTree.workUnitPackage(project, 'HL11F02');
    assert.deepEqual(legacyPackage.completionStandards, ['legacy user result']);
    assert.equal(Object.hasOwn(legacyPackage, 'directAcceptance'), false);
    assert.ok(fs.readFileSync(path.join(project, 'AGENTS.md'), 'utf8').includes(install.INSTRUCTION));
  } finally {
    fs.rmSync(previousSource, { recursive: true, force: true });
    fs.rmSync(project, { recursive: true, force: true });
  }
});
