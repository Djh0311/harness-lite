'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const test = require('node:test');

const tree = require('../lib/tree.js');
const delegation = require('../lib/delegation.js');
const hook = require('../lib/hook.js');
const work = require('../lib/work.js');
const { workUnitDeclarations } = require('./fixtures/work-unit-declarations.js');

function tempRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hl-nv04-recovery-'));
  fs.mkdirSync(path.join(root, 'docs/harness/leaves'), { recursive: true });
  fs.mkdirSync(path.join(root, 'docs/harness/stages'), { recursive: true });
  fs.writeFileSync(path.join(root, 'docs/harness/plan.md'), '# Plan\n\n目标：test NV04\n');
  fs.writeFileSync(path.join(root, 'docs/harness/stages/stage-alpha.md'), '# Stage Alpha\n\n目标：stage\n');
  fs.writeFileSync(path.join(root, 'docs/harness/leaves/L1.md'), [
    '# Leaf One',
    '',
    '阶段：stage-alpha',
    '',
    '目标：leaf',
    '',
    '完成标准：',
    '',
    '- recovery behavior remains problem-scoped and evidence-bound',
    '',
    '允许动：',
    '',
    '- lib/delegation.js',
    '- lib/hook.js',
    '- lib/work.js',
    '- test',
    '',
    '不许动：',
    '',
    '- push',
    ...workUnitDeclarations(['A', 'ACCEPTED', ...stressWorkUnitIds()]),
  ].join('\n'));
  return root;
}

function at(index) {
  return new Date(Date.UTC(2026, 0, 1, 0, 0, index)).toISOString();
}

function failure(id, overrides = {}) {
  return {
    id,
    kind: 'failure',
    workUnit: `display-${id}`,
    stableWorkUnit: 'WU-STABLE',
    acceptanceGate: 'directAcceptance',
    stableProblemFingerprint: 'problem-fp',
    modelFamily: 'grok-engineering',
    category: 'claimed-complete-acceptance-failure',
    effective: true,
    evidenceRef: `reports/${id}.md`,
    primaryCause: `primary cause ${id}`,
    substantiveKey: `route-${id}`,
    ...overrides,
  };
}

function recordFailure(root, event, index) {
  const result = delegation.recordFailure(root, event, { at: at(index) });
  assert.equal(result.ok, true, result.reason);
  return result;
}

function recordRecovery(root, event, index) {
  const result = delegation.recordRecoveryEvent(root, event, { at: at(index) });
  assert.equal(result.ok, true, result.reason);
  return result;
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

function triggerOrdinaryLease(root, stableWorkUnit = 'WU-STABLE', start = 0) {
  for (let i = 0; i < 5; i++) {
    recordFailure(root, failure(`ordinary-${stableWorkUnit}-${i}`, {
      workUnit: `renamed-display-${i}`,
      stableWorkUnit,
      channel: `channel-${i}`,
      session: `session-${i}`,
      model: `model-name-${i}`,
      primaryCause: `ordinary cause ${stableWorkUnit} ${i}`,
      substantiveKey: `ordinary-route-${stableWorkUnit}-${i}`,
    }), start + i);
  }
}

function triggerSolLease(root, stableWorkUnit = 'WU-STABLE', start = 1) {
  triggerOrdinaryLease(root, stableWorkUnit, start);
  recordFailure(root, failure(`terra-complete-${stableWorkUnit}`, {
    stableWorkUnit,
    modelFamily: 'terra',
    category: 'rejected-implementation-route',
    primaryCause: `terra complete failed ${stableWorkUnit}`,
    substantiveKey: `terra-route-${stableWorkUnit}`,
    completeRecovery: true,
  }), start + 6);
}

function exhaustBranch(root, stableWorkUnit = 'WU-STABLE', start = 1) {
  triggerSolLease(root, stableWorkUnit, start);
  for (let i = 0; i < 3; i++) {
    recordFailure(root, failure(`sol-complete-${stableWorkUnit}-${i}`, {
      stableWorkUnit,
      modelFamily: 'sol',
      category: 'claimed-complete-acceptance-failure',
      primaryCause: `sol complete failed ${stableWorkUnit} ${i}`,
      substantiveKey: `sol-route-${stableWorkUnit}-${i}`,
      completeRecovery: true,
    }), start + 7 + i);
  }
}

function stressId(kind, index) {
  return `${kind}-LONG-${String(index).padStart(2, '0')}-ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZ`;
}
function stressWorkUnitIds() {
  return ['ACTIVE', 'REPORTED', 'ACCEPTED', 'BLOCKED', 'PARTIAL', 'WAITING']
    .flatMap((kind) => Array.from({ length: 8 }, (_, index) => stressId(kind, index)));
}

function writeStressDelegation(root) {
  const activeAt = '2000-01-01T00:00:00.000Z';
  for (let i = 0; i < 8; i++) {
    const id = stressId('ACTIVE', i);
    delegation.recordEvent(root, {
      id: `evt-active-${i}`,
      workUnit: id,
      status: 'active',
      writeScope: [`lib/${id}/**`],
    }, { at: activeAt });
    delegation.recordEvent(root, {
      id: `evt-activity-${i}`,
      workUnit: id,
      kind: 'activity',
      activityKind: `long-tool-wait-${id}`,
    }, { at: '2000-01-01T00:01:00.000Z' });
    delegation.recordEvent(root, {
      id: `evt-progress-${i}`,
      workUnit: id,
      kind: 'progress',
      progressKind: 'verified-fact',
      evidenceRef: `reports/${id}-evidence-${'x'.repeat(120)}.md`,
    }, { at: '2000-01-01T00:02:00.000Z' });
  }
  for (let i = 0; i < 8; i++) {
    delegation.recordEvent(root, { id: `evt-reported-${i}`, workUnit: stressId('REPORTED', i), status: 'reported_complete' }, { at: activeAt });
    delegation.recordEvent(root, { id: `evt-accepted-${i}`, workUnit: stressId('ACCEPTED', i), status: 'accepted', evidenceRef: `reports/accepted-${i}.md` }, { at: activeAt });
    delegation.recordEvent(root, { id: `evt-blocked-${i}`, workUnit: stressId('BLOCKED', i), status: 'blocked' }, { at: activeAt });
    delegation.recordEvent(root, { id: `evt-partial-${i}`, workUnit: stressId('PARTIAL', i), status: 'partial' }, { at: activeAt });
    delegation.recordEvent(root, {
      id: `evt-waiting-${i}`,
      workUnit: stressId('WAITING', i),
      status: 'rejected',
      dependencies: [stressId('ACTIVE', i)],
    }, { at: activeAt });
  }
}

function writeHeavyMetadata(root) {
  const long = 'X'.repeat(4000);
  const longItems = Array.from({ length: 20 }, (_, index) => `very-long-path-${index}-${'Y'.repeat(240)}`);
  fs.writeFileSync(path.join(root, 'docs/harness/stages/stage-alpha.md'), [
    `# Stage ${long}`,
    '',
    `目标：${long}`,
    '',
    '完成标准：',
    '',
    '- mixed recovery state remains observable under context pressure',
    '',
    '不许动：',
    '',
    ...longItems.map((item) => `- forbidden/${item}`),
  ].join('\n'));
  fs.writeFileSync(path.join(root, 'docs/harness/leaves/L1.md'), [
    `# Leaf ${long}`,
    '',
    '阶段：stage-alpha',
    '',
    `目标：${long}`,
    '',
    `来源收据：${long}`,
    '',
    '产品：test product',
    '',
    '完成标准：',
    '',
    '- mixed recovery state remains observable under context pressure',
    '',
    '允许动：',
    '',
    ...longItems.map((item) => `- allowed/${item}`),
    '',
    '不许动：',
    '',
    ...longItems.map((item) => `- local-forbidden/${item}`),
    ...workUnitDeclarations(['A', 'ACCEPTED', ...stressWorkUnitIds()]),
  ].join('\n'));
}

function assertRecoveryCarrierStale(name, build, mutate) {
  const root = tempRoot();
  try {
    build(root);
    const ledger = readLedger(root);
    mutate(ledger);
    writeLedger(root, ledger);
    const before = fs.readFileSync(delegation.ledgerPath(root), 'utf8');
    const state = delegation.read(root);
    assert.equal(state.live, false, name);
    assert.equal(state.reason, 'shape', name);
    assert.doesNotThrow(() => delegation.summary(state.live ? state.ledger : null), name);
    const record = delegation.recordFailure(root, failure(`after-bad-${name}`, {
      primaryCause: `after bad ${name}`,
      substantiveKey: `after-bad-${name}`,
    }), { at: at(80) });
    assert.equal(record.status, 'STALE', name);
    assert.equal(record.wrote, false, name);
    assert.equal(fs.readFileSync(delegation.ledgerPath(root), 'utf8'), before, name);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function assertLive(root, label) {
  const state = delegation.read(root);
  assert.equal(state.live, true, label);
  assert.doesNotThrow(() => delegation.summary(state.ledger), label);
  return state.ledger;
}

test('problem key uses stable work-unit identity and explicit family while lease omits family', () => {
  const root = tempRoot();
  try {
    const hold = delegation.recordFailure(root, failure('missing-stable', { stableWorkUnit: undefined }), { at: at(0) });
    assert.equal(hold.ok, false);
    assert.equal(hold.status, 'HOLD');
    assert.match(hold.reason, /stableWorkUnit/);
    assert.equal(fs.existsSync(delegation.ledgerPath(root)), false);

    triggerOrdinaryLease(root, 'WU-STABLE', 1);
    const ledger = readLedger(root);
    const recovery = delegation.recoverySummary(ledger);
    assert.equal(recovery.tier, 'terra');
    assert.equal(recovery.nextTier, 'Terra xhigh complete recovery');
    assert.deepEqual(recovery.active, ['WU-STABLE']);
    assert.equal(Object.keys(ledger.failures.leases).length, 1);
    assert.equal(Object.keys(ledger.failures.problems).length, 1);
    const [lease] = Object.values(ledger.failures.leases);
    assert.deepEqual(Object.keys(lease).filter((key) => /family/i.test(key)), []);
    assert.equal(JSON.stringify(lease).includes('grok-engineering'), false);
    assert.equal(lease.stableWorkUnit, 'WU-STABLE');
    assert.equal(lease.acceptanceGate, 'directAcceptance');
    assert.equal(lease.stableProblemFingerprint, 'problem-fp');

    let before = fs.readFileSync(delegation.ledgerPath(root), 'utf8');
    let denied = delegation.recordFailure(root, failure('ordinary-sixth-after-lease', {
      primaryCause: 'ordinary sixth after lease',
      substantiveKey: 'ordinary-route-sixth',
    }), { at: at(10) });
    assert.equal(denied.ok, false);
    assert.equal(denied.reason, 'recovery-tier-gate');
    assert.equal(denied.wrote, false);
    assert.equal(fs.readFileSync(delegation.ledgerPath(root), 'utf8'), before);

    before = fs.readFileSync(delegation.ledgerPath(root), 'utf8');
    denied = delegation.recordFailure(root, failure('same-problem-other-family', {
      modelFamily: 'gemini-frontend',
      primaryCause: 'separate ordinary family cause',
      substantiveKey: 'gemini-route-1',
    }), { at: at(11) });
    assert.equal(denied.ok, false);
    assert.equal(denied.reason, 'recovery-tier-gate');
    assert.equal(denied.wrote, false);
    assert.equal(fs.readFileSync(delegation.ledgerPath(root), 'utf8'), before);

    recordFailure(root, failure('isolated-gate', {
      acceptanceGate: 'selfcheck',
      primaryCause: 'gate-specific cause',
      substantiveKey: 'gate-route',
    }), 12);
    assert.equal(Object.keys(readLedger(root).failures.problems).length, 2);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('different explicit ordinary families count separately only before a lease exists', () => {
  const root = tempRoot();
  try {
    recordFailure(root, failure('grok-before-lease', {
      modelFamily: 'grok-engineering',
      primaryCause: 'grok family cause',
      substantiveKey: 'grok-family-route',
    }), 1);
    recordFailure(root, failure('gemini-before-lease', {
      modelFamily: 'gemini-frontend',
      primaryCause: 'gemini family cause',
      substantiveKey: 'gemini-family-route',
    }), 2);
    const summary = delegation.recoverySummary(readLedger(root));
    assert.equal(summary.tier, 'ordinary');
    assert.equal(summary.failureCount, 2);
    assert.equal(Object.keys(readLedger(root).failures.problems).length, 2);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('R3 regression: Sol limit one remains live after Terra transition and exhausts on first Sol attempt', () => {
  const root = tempRoot();
  try {
    triggerOrdinaryLease(root, 'WU-L1', 1);
    let result = recordFailure(root, failure('terra-limit-1-regression', {
      stableWorkUnit: 'WU-L1',
      modelFamily: 'terra',
      category: 'rejected-implementation-route',
      primaryCause: 'terra binds limit one regression',
      substantiveKey: 'terra-limit-one-regression',
      completeRecovery: true,
      solAttemptLimit: 1,
    }), 10);
    assert.equal(result.status, 'RECORDED');
    let ledger = assertLive(root, 'limit one must self-read after Terra transition');
    let lease = delegation.recoverySummary(ledger).leases.find((row) => row.stableWorkUnit === 'WU-L1');
    assert.equal(lease.tier, 'sol');
    assert.equal(lease.status, 'active');
    assert.equal(lease.reason, 'terra-effective-semantic-failure');
    assert.equal(lease.solAttemptLimit, 1);

    result = recordFailure(root, failure('sol-limit-1-first', {
      stableWorkUnit: 'WU-L1',
      modelFamily: 'sol',
      primaryCause: 'sol limit one first and only attempt',
      substantiveKey: 'sol-limit-one-first',
      completeRecovery: true,
    }), 11);
    assert.equal(result.status, 'RECORDED');
    ledger = assertLive(root, 'limit one must self-read after first Sol attempt');
    lease = delegation.recoverySummary(ledger).leases.find((row) => row.stableWorkUnit === 'WU-L1');
    assert.equal(lease.tier, 'exhausted');
    assert.equal(lease.status, 'blocked');
    assert.equal(lease.effectiveCount, 1);
    assert.equal(lease.solAttemptLimit, 1);

    const before = fs.readFileSync(delegation.ledgerPath(root), 'utf8');
    result = delegation.recordFailure(root, failure('sol-limit-1-later', {
      stableWorkUnit: 'WU-L1',
      modelFamily: 'sol',
      primaryCause: 'sol limit one later must hold',
      substantiveKey: 'sol-limit-one-later',
      completeRecovery: true,
    }), { at: at(12) });
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'recovery-exhausted');
    assert.equal(result.wrote, false);
    assert.equal(fs.readFileSync(delegation.ledgerPath(root), 'utf8'), before);
    assertLive(root, 'limit one denied later write keeps ledger live');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('Sol attempt limits 1 through 5 self-read after every write and exhaust exactly at the configured limit', () => {
  for (const solAttemptLimit of [1, 2, 3, 4, 5]) {
    const root = tempRoot();
    const stableWorkUnit = `WU-LIMIT-${solAttemptLimit}`;
    try {
      for (let i = 0; i < 5; i++) {
        recordFailure(root, failure(`self-read-${solAttemptLimit}-ordinary-${i}`, {
          stableWorkUnit,
          primaryCause: `self read ordinary ${solAttemptLimit} ${i}`,
          substantiveKey: `self-read-ordinary-${solAttemptLimit}-${i}`,
        }), 1 + i);
        assertLive(root, `limit ${solAttemptLimit} ordinary write ${i}`);
      }
      recordFailure(root, failure(`self-read-${solAttemptLimit}-terra`, {
        stableWorkUnit,
        modelFamily: 'terra',
        category: 'rejected-implementation-route',
        primaryCause: `self read terra limit ${solAttemptLimit}`,
        substantiveKey: `self-read-terra-${solAttemptLimit}`,
        completeRecovery: true,
        solAttemptLimit,
      }), 10);
      let lease = delegation.recoverySummary(assertLive(root, `limit ${solAttemptLimit} Terra transition`))
        .leases.find((row) => row.stableWorkUnit === stableWorkUnit);
      assert.equal(lease.tier, 'sol');
      assert.equal(lease.status, 'active');
      assert.equal(lease.solAttemptLimit, solAttemptLimit);

      for (let i = 0; i < solAttemptLimit; i++) {
        recordFailure(root, failure(`self-read-${solAttemptLimit}-sol-${i}`, {
          stableWorkUnit,
          modelFamily: 'sol',
          primaryCause: `self read sol ${solAttemptLimit} ${i}`,
          substantiveKey: `self-read-sol-${solAttemptLimit}-${i}`,
          completeRecovery: true,
        }), 11 + i);
        lease = delegation.recoverySummary(assertLive(root, `limit ${solAttemptLimit} Sol write ${i}`))
          .leases.find((row) => row.stableWorkUnit === stableWorkUnit);
        assert.equal(lease.solAttemptLimit, solAttemptLimit);
        assert.equal(lease.effectiveCount, i + 1);
        assert.equal(lease.tier, i + 1 === solAttemptLimit ? 'exhausted' : 'sol');
        assert.equal(lease.status, i + 1 === solAttemptLimit ? 'blocked' : 'active');
      }

      const before = fs.readFileSync(delegation.ledgerPath(root), 'utf8');
      const later = delegation.recordFailure(root, failure(`self-read-${solAttemptLimit}-sol-later`, {
        stableWorkUnit,
        modelFamily: 'sol',
        primaryCause: `self read sol later ${solAttemptLimit}`,
        substantiveKey: `self-read-sol-later-${solAttemptLimit}`,
        completeRecovery: true,
      }), { at: at(30) });
      assert.equal(later.ok, false, `limit ${solAttemptLimit}`);
      assert.equal(later.reason, 'recovery-exhausted', `limit ${solAttemptLimit}`);
      assert.equal(later.wrote, false, `limit ${solAttemptLimit}`);
      assert.equal(fs.readFileSync(delegation.ledgerPath(root), 'utf8'), before, `limit ${solAttemptLimit}`);
      assertLive(root, `limit ${solAttemptLimit} after denied later Sol`);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }
});

test('Sol complete-recovery attempt limit defaults to 3 and can be configured per problem', () => {
  let summary, lease;
  const root = tempRoot();
  try {
    triggerSolLease(root, 'WU-DEFAULT', 1);
    summary = delegation.recoverySummary(readLedger(root));
    lease = summary.leases.find((row) => row.stableWorkUnit === 'WU-DEFAULT');
    assert.equal(lease.solAttemptLimit, delegation.DEFAULT_SOL_ATTEMPT_LIMIT);
    for (let i = 0; i < 2; i++) {
      recordFailure(root, failure(`sol-default-${i}`, {
        stableWorkUnit: 'WU-DEFAULT',
        modelFamily: 'sol',
        primaryCause: `default sol cause ${i}`,
        substantiveKey: `default-sol-route-${i}`,
        completeRecovery: true,
      }), 20 + i);
      summary = delegation.recoverySummary(readLedger(root));
      assert.equal(summary.leases.find((row) => row.stableWorkUnit === 'WU-DEFAULT').tier, 'sol');
    }
    recordFailure(root, failure('sol-default-2', {
      stableWorkUnit: 'WU-DEFAULT',
      modelFamily: 'sol',
      primaryCause: 'default sol cause 2',
      substantiveKey: 'default-sol-route-2',
      completeRecovery: true,
    }), 22);
    summary = delegation.recoverySummary(readLedger(root));
    lease = summary.leases.find((row) => row.stableWorkUnit === 'WU-DEFAULT');
    assert.equal(lease.tier, 'exhausted');
    assert.equal(lease.effectiveCount, 3);
    assert.equal(lease.solAttemptLimit, 3);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }

  const configured = tempRoot();
  try {
    triggerOrdinaryLease(configured, 'WU-L2', 1);
    recordFailure(configured, failure('terra-limit-2', {
      stableWorkUnit: 'WU-L2',
      modelFamily: 'terra',
      category: 'rejected-implementation-route',
      primaryCause: 'terra binds limit two',
      substantiveKey: 'terra-limit-two',
      completeRecovery: true,
      solAttemptLimit: 2,
    }), 10);
    recordFailure(configured, failure('sol-limit-2-first', {
      stableWorkUnit: 'WU-L2',
      modelFamily: 'sol',
      primaryCause: 'sol limit two first',
      substantiveKey: 'sol-limit-two-first',
      completeRecovery: true,
    }), 11);
    summary = delegation.recoverySummary(readLedger(configured));
    lease = summary.leases.find((row) => row.stableWorkUnit === 'WU-L2');
    assert.equal(lease.tier, 'sol');
    assert.equal(lease.effectiveCount, 1);
    assert.equal(lease.solAttemptLimit, 2);
    recordFailure(configured, failure('sol-limit-2-second', {
      stableWorkUnit: 'WU-L2',
      modelFamily: 'sol',
      primaryCause: 'sol limit two second',
      substantiveKey: 'sol-limit-two-second',
      completeRecovery: true,
    }), 12);
    summary = delegation.recoverySummary(readLedger(configured));
    lease = summary.leases.find((row) => row.stableWorkUnit === 'WU-L2');
    assert.equal(lease.tier, 'exhausted');
    assert.equal(lease.effectiveCount, 2);
    assert.equal(lease.solAttemptLimit, 2);
  } finally {
    fs.rmSync(configured, { recursive: true, force: true });
  }

  const higher = tempRoot();
  try {
    triggerOrdinaryLease(higher, 'WU-L4', 1);
    recordFailure(higher, failure('terra-limit-4', {
      stableWorkUnit: 'WU-L4',
      modelFamily: 'terra',
      category: 'rejected-implementation-route',
      primaryCause: 'terra binds limit four',
      substantiveKey: 'terra-limit-four',
      completeRecovery: true,
      solAttemptLimit: 4,
    }), 10);
    for (let i = 0; i < 3; i++) {
      recordFailure(higher, failure(`sol-limit-4-${i}`, {
        stableWorkUnit: 'WU-L4',
        modelFamily: 'sol',
        primaryCause: `sol limit four cause ${i}`,
        substantiveKey: `sol-limit-four-${i}`,
        completeRecovery: true,
      }), 11 + i);
      summary = delegation.recoverySummary(readLedger(higher));
      lease = summary.leases.find((row) => row.stableWorkUnit === 'WU-L4');
      assert.equal(lease.tier, 'sol');
      assert.equal(lease.solAttemptLimit, 4);
      assert.equal(lease.effectiveCount, i + 1);
    }
    recordFailure(higher, failure('sol-limit-4-final', {
      stableWorkUnit: 'WU-L4',
      modelFamily: 'sol',
      primaryCause: 'sol limit four final',
      substantiveKey: 'sol-limit-four-final',
      completeRecovery: true,
    }), 14);
    lease = delegation.recoverySummary(readLedger(higher)).leases.find((row) => row.stableWorkUnit === 'WU-L4');
    assert.equal(lease.tier, 'exhausted');
    assert.equal(lease.effectiveCount, 4);
    assert.equal(lease.solAttemptLimit, 4);
  } finally {
    fs.rmSync(higher, { recursive: true, force: true });
  }
});

test('independent recovery leases keep separate Sol limits and PASS clears only the current lease', () => {
  const root = tempRoot();
  try {
    triggerOrdinaryLease(root, 'WU-L2', 1);
    recordFailure(root, failure('terra-independent-limit-2', {
      stableWorkUnit: 'WU-L2',
      modelFamily: 'terra',
      category: 'rejected-implementation-route',
      primaryCause: 'independent terra limit two',
      substantiveKey: 'independent-terra-limit-two',
      completeRecovery: true,
      solAttemptLimit: 2,
    }), 10);
    for (let i = 0; i < 2; i++) recordFailure(root, failure(`sol-independent-limit-2-${i}`, {
      stableWorkUnit: 'WU-L2',
      modelFamily: 'sol',
      primaryCause: `independent sol limit two ${i}`,
      substantiveKey: `independent-sol-limit-two-${i}`,
      completeRecovery: true,
    }), 11 + i);

    triggerOrdinaryLease(root, 'WU-L4', 20);
    recordFailure(root, failure('terra-independent-limit-4', {
      stableWorkUnit: 'WU-L4',
      modelFamily: 'terra',
      category: 'rejected-implementation-route',
      primaryCause: 'independent terra limit four',
      substantiveKey: 'independent-terra-limit-four',
      completeRecovery: true,
      solAttemptLimit: 4,
    }), 30);
    recordFailure(root, failure('sol-independent-limit-4-first', {
      stableWorkUnit: 'WU-L4',
      modelFamily: 'sol',
      primaryCause: 'independent sol limit four first',
      substantiveKey: 'independent-sol-limit-four-first',
      completeRecovery: true,
    }), 31);

    let summary = delegation.recoverySummary(readLedger(root));
    assert.deepEqual(summary.active, ['WU-L4']);
    assert.deepEqual(summary.blocked, ['WU-L2']);
    assert.ok(summary.solAttemptLimits.includes('WU-L2:2'), summary.solAttemptLimits.join(','));
    assert.ok(summary.solAttemptLimits.includes('WU-L4:4'), summary.solAttemptLimits.join(','));

    recordRecovery(root, {
      id: 'pass-limit-two',
      kind: 'acceptance_pass',
      stableWorkUnit: 'WU-L2',
      acceptanceGate: 'directAcceptance',
      stableProblemFingerprint: 'problem-fp',
      evidenceRef: 'reports/pass-limit-two.md',
    }, 40);
    summary = delegation.recoverySummary(readLedger(root));
    assert.deepEqual(summary.active, ['WU-L4']);
    assert.deepEqual(summary.blocked, []);
    assert.deepEqual(summary.solAttemptLimits, ['WU-L4:4']);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('Sol attempt limit API rejects invalid scope, range, and later conflicting config without writes', () => {
  for (const [name, solAttemptLimit] of [['zero', 0], ['too-high', 6], ['fraction', 2.5], ['string', '4']]) {
    const root = tempRoot();
    try {
      triggerOrdinaryLease(root, `WU-BAD-${name}`, 1);
      const before = fs.readFileSync(delegation.ledgerPath(root), 'utf8');
      const result = delegation.recordFailure(root, failure(`terra-invalid-limit-${name}`, {
        stableWorkUnit: `WU-BAD-${name}`,
        modelFamily: 'terra',
        category: 'rejected-implementation-route',
        primaryCause: `invalid limit ${name}`,
        substantiveKey: `invalid-limit-${name}`,
        completeRecovery: true,
        solAttemptLimit,
      }), { at: at(10) });
      assert.equal(result.ok, false, name);
      assert.equal(result.status, 'HOLD', name);
      assert.equal(result.wrote, false, name);
      assert.equal(fs.readFileSync(delegation.ledgerPath(root), 'utf8'), before, name);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }

  const scoped = tempRoot();
  try {
    triggerOrdinaryLease(scoped, 'WU-SCOPE', 1);
    const before = fs.readFileSync(delegation.ledgerPath(scoped), 'utf8');
    const ordinary = delegation.recordFailure(scoped, failure('ordinary-limit-not-supported', {
      stableWorkUnit: 'WU-SCOPE',
      primaryCause: 'ordinary cannot bind sol limit',
      substantiveKey: 'ordinary-limit-route',
      solAttemptLimit: 2,
    }), { at: at(10) });
    assert.equal(ordinary.ok, false);
    assert.equal(ordinary.reason, 'sol-attempt-limit-scope');
    assert.equal(fs.readFileSync(delegation.ledgerPath(scoped), 'utf8'), before);
  } finally {
    fs.rmSync(scoped, { recursive: true, force: true });
  }

  const conflict = tempRoot();
  try {
    triggerOrdinaryLease(conflict, 'WU-CONFLICT', 1);
    recordFailure(conflict, failure('terra-conflict-limit-4', {
      stableWorkUnit: 'WU-CONFLICT',
      modelFamily: 'terra',
      category: 'rejected-implementation-route',
      primaryCause: 'bind limit four before conflict',
      substantiveKey: 'bind-limit-four-before-conflict',
      completeRecovery: true,
      solAttemptLimit: 4,
    }), 10);
    const before = fs.readFileSync(delegation.ledgerPath(conflict), 'utf8');
    const result = delegation.recordFailure(conflict, failure('sol-conflicting-limit', {
      stableWorkUnit: 'WU-CONFLICT',
      modelFamily: 'sol',
      primaryCause: 'conflicting limit must hold',
      substantiveKey: 'conflicting-limit-route',
      completeRecovery: true,
      solAttemptLimit: 2,
    }), { at: at(11) });
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'sol-attempt-limit-conflict');
    assert.equal(result.wrote, false);
    assert.equal(fs.readFileSync(delegation.ledgerPath(conflict), 'utf8'), before);
  } finally {
    fs.rmSync(conflict, { recursive: true, force: true });
  }
});

test('premature Terra and Sol effective failures are held until the lease tier allows them', () => {
  const root = tempRoot();
  try {
    for (const [modelFamily, reason] of [['terra', 'premature-recovery-tier'], ['sol', 'premature-recovery-tier']]) {
      const before = fs.existsSync(delegation.ledgerPath(root)) ? fs.readFileSync(delegation.ledgerPath(root), 'utf8') : null;
      const result = delegation.recordFailure(root, failure(`premature-${modelFamily}`, {
        modelFamily,
        category: 'rejected-implementation-route',
        primaryCause: `${modelFamily} without ordinary lease`,
        substantiveKey: `${modelFamily}-premature-route`,
        completeRecovery: true,
      }), { at: at(modelFamily === 'terra' ? 1 : 2) });
      assert.equal(result.ok, false);
      assert.equal(result.reason, reason);
      assert.equal(result.wrote, false);
      if (before === null) assert.equal(fs.existsSync(delegation.ledgerPath(root)), false);
      else assert.equal(fs.readFileSync(delegation.ledgerPath(root), 'utf8'), before);
    }

    const nonCounting = delegation.recordFailure(root, failure('premature-terra-provider', {
      modelFamily: 'terra',
      effective: false,
      category: 'provider',
      nonCountingReason: 'provider-transport',
      primaryCause: 'provider issue before lease',
      substantiveKey: 'provider-before-lease',
      completeRecovery: false,
    }), { at: at(3) });
    assert.equal(nonCounting.ok, true);
    assert.equal(nonCounting.counted, false);
    const summary = delegation.recoverySummary(readLedger(root));
    assert.equal(summary.tier, 'ordinary');
    assert.equal(summary.failureCount, 0);
    assert.equal(summary.leases.length, 0);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('only explicit evidence-bound effective semantic failures count and same-root repeats are deduplicated', () => {
  const root = tempRoot();
  try {
    let result = recordFailure(root, failure('disproven-1', {
      category: 'disproven-diagnosis',
      primaryCause: 'bad route reused',
      substantiveKey: 'bad-route',
    }), 1);
    assert.equal(result.counted, true);

    result = delegation.recordFailure(root, failure('disproven-1', {
      category: 'disproven-diagnosis',
      primaryCause: 'bad route reused',
      substantiveKey: 'bad-route',
    }), { at: at(2) });
    assert.equal(result.status, 'REPLAY');
    assert.equal(result.wrote, false);

    result = recordFailure(root, failure('cross-family-disproven-repeat', {
      modelFamily: 'gemini-frontend',
      category: 'disproven-diagnosis',
      primaryCause: 'bad route reused',
      substantiveKey: 'bad-route',
    }), 3);
    assert.equal(result.counted, false);
    assert.equal(result.drift, true);
    assert.equal(result.recovery.drift.includes('WU-STABLE'), true);

    result = delegation.recordFailure(root, failure('disproven-repeat-again', {
      category: 'disproven-diagnosis',
      primaryCause: 'bad route reused',
      substantiveKey: 'bad-route',
    }), { at: at(4) });
    assert.equal(result.status, 'DUPLICATE');
    assert.equal(result.wrote, false);

    result = delegation.recordFailure(root, failure('provider', {
      effective: false,
      category: 'provider',
      nonCountingReason: 'provider-transport',
      primaryCause: 'provider transport failed',
      substantiveKey: 'provider-transport-1',
    }), { at: at(5) });
    assert.equal(result.status, 'RECORDED');
    assert.equal(result.counted, false);

    recordFailure(root, failure('false-pass', {
      category: 'false-pass-evidence',
      primaryCause: 'same evidence root',
      substantiveKey: 'assertion-a',
    }), 6);
    result = delegation.recordFailure(root, failure('same-root-multiple-assertion-cross-family', {
      modelFamily: 'gemini-frontend',
      category: 'false-pass-evidence',
      primaryCause: 'same evidence root',
      substantiveKey: 'assertion-c',
    }), { at: at(7) });
    assert.equal(result.status, 'DUPLICATE');
    assert.equal(result.wrote, false);

    result = delegation.recordFailure(root, failure('same-root-multiple-assertion', {
      category: 'false-pass-evidence',
      primaryCause: 'same evidence root',
      substantiveKey: 'assertion-b',
    }), { at: at(7) });
    assert.equal(result.status, 'DUPLICATE');
    assert.equal(result.wrote, false);

    result = delegation.recordFailure(root, failure('tool-lint', {
      effective: false,
      category: 'lint',
      nonCountingReason: 'tool-test-lint-intermediate',
      primaryCause: 'lint intermediate',
      substantiveKey: 'lint-1',
    }), { at: at(8) });
    assert.equal(result.counted, false);

    result = delegation.recordFailure(root, failure('bad-category', { category: 'random-red', evidenceRef: 'reports/bad.md' }), { at: at(9) });
    assert.equal(result.ok, false);
    assert.equal(result.status, 'HOLD');

    result = delegation.recordFailure(root, failure('missing-evidence', { evidenceRef: undefined }), { at: at(10) });
    assert.equal(result.ok, false);
    assert.equal(result.status, 'HOLD');

    const problem = Object.values(readLedger(root).failures.problems).find((row) => row.modelFamily === 'grok-engineering');
    assert.equal(problem.effectiveCount, 2);
    assert.equal(delegation.recoverySummary(readLedger(root)).drift.includes('WU-STABLE'), true);
    assert.deepEqual(problem.countedSubstantiveKeys.sort(), ['assertion-a', 'bad-route']);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('ordinary five triggers Terra, Terra failure triggers Sol, Sol exhausts at three, and pass clears only that lease', () => {
  const root = tempRoot();
  try {
    triggerOrdinaryLease(root, 'WU-STABLE', 1);
    triggerOrdinaryLease(root, 'WU-OTHER', 10);
    let summary = delegation.recoverySummary(readLedger(root));
    assert.equal(summary.tier, 'terra');
    assert.deepEqual(summary.active.sort(), ['WU-OTHER', 'WU-STABLE']);

    let before = fs.readFileSync(delegation.ledgerPath(root), 'utf8');
    let result = delegation.recordFailure(root, failure('terra-incomplete', {
      modelFamily: 'terra',
      category: 'rejected-implementation-route',
      primaryCause: 'terra partial observation',
      substantiveKey: 'terra-partial',
      completeRecovery: false,
    }), { at: at(20) });
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'recovery-tier-gate');
    assert.equal(result.wrote, false);
    assert.equal(fs.readFileSync(delegation.ledgerPath(root), 'utf8'), before);

    result = recordFailure(root, failure('terra-provider', {
      modelFamily: 'terra',
      effective: false,
      category: 'provider',
      nonCountingReason: 'provider-transport',
      primaryCause: 'terra provider evidence',
      substantiveKey: 'terra-provider-route',
      completeRecovery: false,
    }), 21);
    assert.equal(result.counted, false);
    assert.equal(result.ledger.failures.leases[Object.keys(result.ledger.failures.leases).find((key) => result.ledger.failures.leases[key].stableWorkUnit === 'WU-STABLE')].tier, 'terra');

    before = fs.readFileSync(delegation.ledgerPath(root), 'utf8');
    result = delegation.recordFailure(root, failure('early-sol-under-terra', {
      modelFamily: 'sol',
      category: 'claimed-complete-acceptance-failure',
      primaryCause: 'sol before terra completion',
      substantiveKey: 'early-sol-route',
      completeRecovery: true,
    }), { at: at(22) });
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'recovery-tier-gate');
    assert.equal(result.wrote, false);
    assert.equal(fs.readFileSync(delegation.ledgerPath(root), 'utf8'), before);

    result = recordFailure(root, failure('terra-complete-fail', {
      modelFamily: 'terra',
      category: 'rejected-implementation-route',
      primaryCause: 'terra complete recovery failed',
      substantiveKey: 'terra-route-1',
      completeRecovery: true,
    }), 23);
    assert.equal(result.counted, true);
    summary = delegation.recoverySummary(readLedger(root));
    assert.equal(summary.tier, 'mixed');
    assert.equal(summary.status, 'mixed');
    assert.deepEqual(summary.active.sort(), ['WU-OTHER', 'WU-STABLE']);

    before = fs.readFileSync(delegation.ledgerPath(root), 'utf8');
    result = delegation.recordFailure(root, failure('terra-second-after-sol', {
      modelFamily: 'terra',
      category: 'rejected-implementation-route',
      primaryCause: 'second terra should be denied',
      substantiveKey: 'terra-route-2',
      completeRecovery: true,
    }), { at: at(24) });
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'recovery-tier-gate');
    assert.equal(result.wrote, false);
    assert.equal(fs.readFileSync(delegation.ledgerPath(root), 'utf8'), before);

    before = fs.readFileSync(delegation.ledgerPath(root), 'utf8');
    result = delegation.recordFailure(root, failure('ordinary-under-sol', {
      primaryCause: 'ordinary should not run under sol lease',
      substantiveKey: 'ordinary-under-sol-route',
    }), { at: at(25) });
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'recovery-tier-gate');
    assert.equal(result.wrote, false);
    assert.equal(fs.readFileSync(delegation.ledgerPath(root), 'utf8'), before);

    result = delegation.recordFailure(root, failure('sol-provider', {
      modelFamily: 'sol',
      effective: false,
      category: 'provider',
      nonCountingReason: 'quota',
      primaryCause: 'quota failure',
      substantiveKey: 'quota-1',
      completeRecovery: false,
    }), { at: at(26) });
    assert.equal(result.ok, true);
    assert.equal(result.counted, false);

    for (let i = 0; i < 3; i++) {
      result = recordFailure(root, failure(`sol-complete-${i}`, {
        modelFamily: 'sol',
        category: 'claimed-complete-acceptance-failure',
        primaryCause: `sol recovery cause ${i}`,
        substantiveKey: `sol-route-${i}`,
        completeRecovery: true,
      }), 27 + i);
      assert.equal(result.counted, true);
    }
    summary = delegation.recoverySummary(readLedger(root));
    assert.equal(summary.tier, 'mixed');
    assert.equal(summary.status, 'mixed');
    assert.deepEqual(summary.active, ['WU-OTHER']);
    assert.deepEqual(summary.blocked, ['WU-STABLE']);
    const exhausted = summary.leases.find((lease) => lease.stableWorkUnit === 'WU-STABLE');
    assert.equal(exhausted.status, 'blocked');
    assert.equal(exhausted.tier, 'exhausted');
    assert.equal(exhausted.needed.includes('user decision'), true);

    before = fs.readFileSync(delegation.ledgerPath(root), 'utf8');
    result = delegation.recordFailure(root, failure('sol-fourth', {
      modelFamily: 'sol',
      category: 'claimed-complete-acceptance-failure',
      primaryCause: 'sol fourth must not count',
      substantiveKey: 'sol-route-4',
      completeRecovery: true,
    }), { at: at(30) });
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'recovery-exhausted');
    assert.equal(result.wrote, false);
    assert.equal(fs.readFileSync(delegation.ledgerPath(root), 'utf8'), before);
    assert.equal(Object.values(readLedger(root).failures.problems).find((problem) => problem.modelFamily === 'sol').effectiveCount, 3);

    const replay = delegation.recordFailure(root, failure('sol-complete-2', {
      modelFamily: 'sol',
      category: 'claimed-complete-acceptance-failure',
      primaryCause: 'sol recovery cause 2',
      substantiveKey: 'sol-route-2',
      completeRecovery: true,
    }), { at: at(31) });
    assert.equal(replay.status, 'REPLAY');

    recordRecovery(root, {
      id: 'pass-current-problem',
      kind: 'acceptance_pass',
      stableWorkUnit: 'WU-STABLE',
      acceptanceGate: 'directAcceptance',
      stableProblemFingerprint: 'problem-fp',
      evidenceRef: 'reports/pass.md',
    }, 32);
    summary = delegation.recoverySummary(readLedger(root));
    assert.deepEqual(summary.active, ['WU-OTHER']);
    assert.equal(summary.blocked.includes('WU-STABLE'), false);
    assert.equal(summary.leases.some((lease) => lease.stableWorkUnit === 'WU-STABLE'), false);

    before = fs.readFileSync(delegation.ledgerPath(root), 'utf8');
    result = delegation.recordFailure(root, failure('post-pass-same-problem', {
      primaryCause: 'old accepted problem should not revive',
      substantiveKey: 'post-pass-route',
    }), { at: at(33) });
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'accepted-problem');
    assert.equal(result.wrote, false);
    assert.equal(fs.readFileSync(delegation.ledgerPath(root), 'utf8'), before);

    delegation.recordEvent(root, { id: 'evt-accepted', workUnit: 'ACCEPTED', status: 'accepted', evidenceRef: 'reports/accepted.md' }, { at: at(34) });
    recordFailure(root, failure('accepted-not-polluted', {
      stableWorkUnit: 'ACCEPTED',
      primaryCause: 'post accept failure note',
      substantiveKey: 'accepted-route-1',
    }), 35);
    assert.equal(readLedger(root).workUnits.ACCEPTED.status, 'accepted');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('single exhausted branch reports blocked while mixed exhausted plus active branch reports mixed', () => {
  const root = tempRoot();
  try {
    triggerOrdinaryLease(root, 'WU-STABLE', 1);
    recordFailure(root, failure('terra-complete-single', {
      modelFamily: 'terra',
      category: 'rejected-implementation-route',
      primaryCause: 'terra failed single',
      substantiveKey: 'terra-single',
      completeRecovery: true,
    }), 10);
    for (let i = 0; i < 3; i++) {
      recordFailure(root, failure(`sol-single-${i}`, {
        modelFamily: 'sol',
        primaryCause: `single sol cause ${i}`,
        substantiveKey: `single-sol-route-${i}`,
        completeRecovery: true,
      }), 11 + i);
    }
    let summary = delegation.recoverySummary(readLedger(root));
    assert.equal(summary.tier, 'exhausted');
    assert.equal(summary.status, 'blocked');

    triggerOrdinaryLease(root, 'WU-INDEPENDENT', 20);
    summary = delegation.recoverySummary(readLedger(root));
    assert.equal(summary.tier, 'mixed');
    assert.equal(summary.status, 'mixed');
    assert.deepEqual(summary.active, ['WU-INDEPENDENT']);
    assert.deepEqual(summary.blocked, ['WU-STABLE']);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('recovery ledger shape is nested fail-closed and old ledgers remain compatible', () => {
  const oldRoot = tempRoot();
  try {
    const ledger = delegation.freshLedger(oldRoot, tree.readChain(oldRoot));
    ledger.workUnits.A = { id: 'A', status: 'active', dependencies: [], writeScope: [], events: [] };
    writeLedger(oldRoot, ledger);
    const state = delegation.read(oldRoot);
    assert.equal(state.live, true);
    assert.equal(delegation.recoverySummary(state.ledger).tier, 'ordinary');
  } finally {
    fs.rmSync(oldRoot, { recursive: true, force: true });
  }

  for (const [name, mutate] of [
    ['failures-not-object', (ledger) => { ledger.failures = null; }],
    ['events-not-object', (ledger) => { ledger.failures.events = []; }],
    ['problem-not-object', (ledger) => { ledger.failures.problems[Object.keys(ledger.failures.problems)[0]] = null; }],
    ['problem-arrays-malformed', (ledger) => { ledger.failures.problems[Object.keys(ledger.failures.problems)[0]].countedPrimaryCauses = 'cause'; }],
    ['event-not-object', (ledger) => { ledger.failures.events[Object.keys(ledger.failures.events)[0]] = null; }],
    ['event-missing-problem', (ledger) => { delete ledger.failures.events[Object.keys(ledger.failures.events)[0]].problemKey; }],
    ['event-orphan-problem', (ledger) => { ledger.failures.events[Object.keys(ledger.failures.events)[0]].problemKey = `sha256:${'a'.repeat(64)}`; }],
    ['lease-family-field', (ledger) => { ledger.failures.leases[Object.keys(ledger.failures.leases)[0]].modelFamily = 'grok-engineering'; }],
    ['lease-missing-trigger', (ledger) => { delete ledger.failures.leases[Object.keys(ledger.failures.leases)[0]].triggerEvent; }],
    ['lease-orphan-trigger', (ledger) => { ledger.failures.leases[Object.keys(ledger.failures.leases)[0]].triggerEvent = 'missing-event'; }],
    ['lease-trigger-not-counted', (ledger) => { ledger.failures.events[ledger.failures.leases[Object.keys(ledger.failures.leases)[0]].triggerEvent].counted = false; }],
    ['lease-trigger-wrong-counted-event', (ledger) => {
      const lease = ledger.failures.leases[Object.keys(ledger.failures.leases)[0]];
      lease.triggerEvent = Object.values(ledger.failures.events).find((event) => event.counted && event.tier === 'ordinary').id;
      lease.updatedAt = ledger.failures.events[lease.triggerEvent].at;
    }],
    ['lease-forged-count', (ledger) => { ledger.failures.leases[Object.keys(ledger.failures.leases)[0]].effectiveCount = 6; }],
    ['lease-forged-tier', (ledger) => {
      const lease = ledger.failures.leases[Object.keys(ledger.failures.leases)[0]];
      lease.tier = 'sol'; lease.reason = 'sol-effective-semantic-failure'; lease.needed = 'Sol xhigh complete recovery'; lease.effectiveCount = 1;
    }],
    ['lease-forged-reason', (ledger) => { ledger.failures.leases[Object.keys(ledger.failures.leases)[0]].reason = 'fake-reason'; }],
  ]) {
    const root = tempRoot();
    try {
      triggerOrdinaryLease(root, 'WU-STABLE', 1);
      const ledger = readLedger(root);
      mutate(ledger);
      writeLedger(root, ledger);
      const before = fs.readFileSync(delegation.ledgerPath(root), 'utf8');
      const state = delegation.read(root);
      assert.equal(state.live, false, name);
      assert.equal(state.reason, 'shape', name);
      assert.doesNotThrow(() => delegation.summary(state.live ? state.ledger : null), name);
      const record = delegation.recordFailure(root, failure(`after-bad-${name}`), { at: at(40) });
      assert.equal(record.status, 'STALE', name);
      assert.equal(record.wrote, false, name);
      assert.equal(fs.readFileSync(delegation.ledgerPath(root), 'utf8'), before, name);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }
});

test('recovery lease trigger semantics reject forged Sol transition carriers', () => {
  assertRecoveryCarrierStale('terra-sol-effective-count-two', (root) => {
    triggerSolLease(root, 'WU-STABLE', 1);
  }, (ledger) => {
    const lease = Object.values(ledger.failures.leases)[0];
    assert.equal(lease.tier, 'sol');
    assert.equal(lease.reason, 'terra-effective-semantic-failure');
    lease.effectiveCount = 2;
  });

  assertRecoveryCarrierStale('trigger-effective-false', (root) => {
    triggerSolLease(root, 'WU-STABLE', 1);
  }, (ledger) => {
    const lease = Object.values(ledger.failures.leases)[0];
    ledger.failures.events[lease.triggerEvent].effective = false;
  });

  assertRecoveryCarrierStale('trigger-complete-recovery-false', (root) => {
    triggerSolLease(root, 'WU-STABLE', 1);
  }, (ledger) => {
    const lease = Object.values(ledger.failures.leases)[0];
    ledger.failures.events[lease.triggerEvent].completeRecovery = false;
  });

  assertRecoveryCarrierStale('extra-counted-event-after-active-lease', (root) => {
    triggerSolLease(root, 'WU-STABLE', 1);
  }, (ledger) => {
    const lease = Object.values(ledger.failures.leases)[0];
    const trigger = ledger.failures.events[lease.triggerEvent];
    const problem = ledger.failures.problems[trigger.problemKey];
    const extra = {
      ...trigger,
      id: 'forged-extra-terra',
      at: trigger.at,
      primaryCause: 'forged extra counted recovery event',
      substantiveKey: 'forged-extra-terra-route',
    };
    ledger.failures.events[extra.id] = extra;
    problem.events.push(extra.id);
    problem.effectiveCount += 1;
    problem.countedPrimaryCauses.push(extra.primaryCause);
    problem.countedSubstantiveKeys.push(extra.substantiveKey);
  });

  assertRecoveryCarrierStale('transition-bound-limit-tamper', (root) => {
    triggerOrdinaryLease(root, 'WU-L4', 1);
    recordFailure(root, failure('terra-limit-four-for-tamper', {
      stableWorkUnit: 'WU-L4',
      modelFamily: 'terra',
      category: 'rejected-implementation-route',
      primaryCause: 'bind limit four for tamper',
      substantiveKey: 'bind-limit-four-for-tamper',
      completeRecovery: true,
      solAttemptLimit: 4,
    }), 10);
  }, (ledger) => {
    const lease = Object.values(ledger.failures.leases)[0];
    assert.equal(lease.solAttemptLimit, 4);
    lease.solAttemptLimit = 3;
  });

  assertRecoveryCarrierStale('coherent-forged-limit-count-trigger', (root) => {
    exhaustBranch(root, 'WU-DEFAULT', 1);
  }, (ledger) => {
    const lease = Object.values(ledger.failures.leases)[0];
    assert.equal(lease.tier, 'exhausted');
    assert.equal(lease.solAttemptLimit, 3);
    const trigger = ledger.failures.events[lease.triggerEvent];
    const problem = ledger.failures.problems[trigger.problemKey];
    const extra = {
      ...trigger,
      id: 'forged-extra-sol',
      at: trigger.at,
      primaryCause: 'forged extra sol counted event',
      substantiveKey: 'forged-extra-sol-route',
    };
    ledger.failures.events[extra.id] = extra;
    problem.events.push(extra.id);
    problem.effectiveCount += 1;
    problem.countedPrimaryCauses.push(extra.primaryCause);
    problem.countedSubstantiveKeys.push(extra.substantiveKey);
    lease.solAttemptLimit = 4;
    lease.effectiveCount = 4;
    lease.triggerEvent = extra.id;
    lease.updatedAt = extra.at;
  });
});

test('mixed recovery hook wire preserves compact counts under metadata and lifecycle pressure', () => {
  const root = tempRoot();
  try {
    writeHeavyMetadata(root);
    writeStressDelegation(root);
    exhaustBranch(root, 'WU', 100);
    triggerOrdinaryLease(root, 'WU2', 130);

    const start = hook.sessionStart(root, { hook_event_name: 'SessionStart', session_id: 's-mixed', turn_id: 't-mixed' })
      .hookSpecificOutput.additionalContext;
    const prompt = hook.userPrompt(root, {
      hook_event_name: 'UserPromptSubmit',
      session_id: 's-mixed',
      turn_id: 'u-mixed',
      prompt: 'mixed recovery context check',
    }).context;
    for (const context of [start, prompt]) {
      assert.equal(context.length <= 1800, true, context.length);
      for (const needle of [
        'Harness：stage=',
        'Scope：allowed=',
        'ParallelWorkUnitsCarrier：complete=',
        'readApi=tree.workUnitPackages',
        'digest=sha256:',
        'Decision：focus=',
        'CompletionCarrier：complete=',
        'Heartbeat：',
        'Recovery：tier=mixed',
        'status=mixed',
        'failureCount=14',
        'next=per-problem',
        'active=WU2/1',
        'blocked=WU/1',
        'drift=',
        'solLimit=',
        'truncated=',
      ]) assert.ok(context.includes(needle), `${needle}\n${context}`);
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('status report and hook contexts project recovery tier without dropping lifecycle rows', () => {
  const root = tempRoot();
  try {
    triggerOrdinaryLease(root, 'WU-STABLE', 1);
    delegation.recordEvent(root, { id: 'evt-active', workUnit: 'A', status: 'active' }, { at: at(20) });
    const status = work.status(root, { now: at(321) });
    assert.ok(status.guidance.events.includes('problem-recovery'));
    assert.equal(status.guidance.recovery.tier, 'terra');
    assert.equal(status.guidance.recovery.status, 'active');
    assert.equal(status.guidance.recovery.failureCount, 5);
    assert.deepEqual(status.guidance.recovery.solAttemptLimits, ['WU-STABLE:3']);
    const report = work.report(root, {
      chain: status.chain,
      delta: { changed: [], inherited: [], unknown: [], headChanged: false },
      verification: null,
    }, { write: false, now: at(321) });
    assert.ok(report.text.includes('Recovery：tier=terra'), report.text);

    const start = hook.sessionStart(root, { hook_event_name: 'SessionStart', session_id: 's', turn_id: 't' }).hookSpecificOutput.additionalContext;
    const prompt = hook.userPrompt(root, {
      hook_event_name: 'UserPromptSubmit',
      session_id: 's',
      turn_id: 'u',
      prompt: 'do not persist this prompt',
    }).context;
    for (const context of [start, prompt]) {
      assert.equal(context.length <= 1800, true, context.length);
      for (const needle of [
        'Harness：stage=',
        'Scope：allowed=',
        'Provenance：sourceReceipt=',
        'Delegation：live=true',
        'Recovery：tier=terra',
        'Activity：',
        'Progress：',
        'Heartbeat：read-only',
      ]) assert.ok(context.includes(needle), `${needle}\n${context}`);
      for (const absent of ['Reported：', 'Accepted：', 'Blocked+Partial：', 'Dependencies：']) {
        assert.equal(context.includes(absent), false, `${absent}\n${context}`);
      }
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
