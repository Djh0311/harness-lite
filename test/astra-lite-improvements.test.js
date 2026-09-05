'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const test = require('node:test');

const guidance = require('../lib/guidance.js');
const capabilities = require('../lib/capabilities.js');
const delegation = require('../lib/delegation.js');
const hook = require('../lib/hook.js');
const install = require('../lib/install.js');
const builder = require('../scripts/build-candidate.js');

test('Astra guidance names the real reported unit and its actual dependent', () => {
  const chain = { leaf: {
    goal: 'deliver result', completionStandards: ['result exists'], workUnits: [
      { id: 'writer-X', completionStandards: ['X result'], dependencies: [] },
      { id: 'downstream-Y', completionStandards: ['Y result'], dependencies: ['writer-X'] },
    ],
  } };
  const result = guidance.select(chain, { summary: { reported: ['writer-X'], accepted: [], active: [], runnable: [] } }, { intent: 'agent-reported' });
  assert.match(result.decisionQuestion, /writer-X/);
  assert.match(result.decisionQuestion, /downstream-Y/);
  assert.doesNotMatch(result.text, /暂停 B|A 未验收/);
});

test('Astra guidance does not invent a downstream pause when none exists', () => {
  const result = guidance.select({ leaf: { goal: 'g', completionStandards: ['s'], workUnits: [{ id: 'writer-X', completionStandards: ['s'], dependencies: [] }] } }, {
    summary: { reported: ['writer-X'], accepted: [], active: [], runnable: [] },
  }, { intent: 'agent-reported' });
  assert.match(result.nextAction, /writer-X/);
  assert.doesNotMatch(result.text, /暂停 B|A 未验收/);
});

test('Astra is a recognized recovery family and is not routed through Terra or Sol', () => {
  const projection = capabilities.normalizeManifest({ schemaVersion: 1, kind: capabilities.KIND, models: [{ channel: 'codex', model: 'gpt-6-astra', family: 'gpt-6-astra', reasoning: 'xhigh', status: 'available' }] });
  assert.equal(projection.state, 'known');
  assert.equal(projection.models[0].family, 'astra');
  assert.deepEqual(projection.models[0].suitability, ['problem-recovery']);
});

test('0.13 candidate identity is versioned separately from the retained 0.12 artifact', () => {
  const candidate = builder.buildCandidate(path.join(__dirname, '..'));
  const summary = builder.summarize(candidate);
  assert.equal(candidate.package.name, 'harness-lite');
  assert.equal(candidate.package.version, '0.13.0');
  assert.equal(summary.version, '0.13.0');
  const runtime = Buffer.from(candidate.files.find((row) => row.path === 'lib/install.js').contentBase64, 'base64').toString('utf8');
  assert.match(runtime, /const VERSION = '0\.13\.0'/);
  assert.match(runtime, /working-copy:0\.13\.0-candidate/);
});

function recoveryRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hl-astra-recovery-'));
  fs.mkdirSync(path.join(root, 'docs/harness/stages'), { recursive: true });
  fs.mkdirSync(path.join(root, 'docs/harness/leaves'), { recursive: true });
  fs.writeFileSync(path.join(root, 'docs/harness/plan.md'), '# plan\n');
  fs.writeFileSync(path.join(root, 'docs/harness/stages/stage-astra.md'), '# Stage\n\n目标：recovery\n');
  fs.writeFileSync(path.join(root, 'docs/harness/leaves/astra.md'), [
    '# Leaf', '', '阶段：stage-astra', '', '目标：recovery', '', '完成标准：', '', '- result', '',
    '## Work Unit recovery-unit', '', 'goal: recovery', '', 'completionStandards:', '', '- result', '',
    'dependencies:', '', '- 无', '',
  ].join('\n'));
  return root;
}

test('Astra recovery starts after five effective failures and has a bounded local lease', () => {
  const root = recoveryRoot();
  try {
    for (let i = 0; i < 5; i += 1) {
      const result = delegation.recordAgentFailure(root, {
        id: `ordinary-${i}`, stableWorkUnit: 'recovery-unit', acceptanceGate: 'direct',
        stableProblemFingerprint: 'astra-problem', modelFamily: 'astra', channel: 'codex',
        model: 'gpt-6-astra', reasoning: 'xhigh', category: 'claimed-complete-acceptance-failure',
        effective: true, completeRecovery: false, evidenceRef: `evidence/${i}`,
        primaryCause: `cause-${i}`, substantiveKey: `route-${i}`,
      }, { at: `2026-01-01T00:00:0${i}.000Z` });
      assert.equal(result.counted, true, result.reason);
    }
    const summary = delegation.recoverySummary(delegation.read(root).ledger);
    assert.equal(summary.tier, 'astra');
    assert.match(summary.nextTier, /Astra/);
    assert.equal(summary.leases[0].tier, 'astra');
    assert.equal(summary.leases[0].solAttemptLimit, 3);
    const context = hook.sessionStart(root, { hook_event_name: 'SessionStart', session_id: 'astra', turn_id: 'recovery' }).hookSpecificOutput.additionalContext;
    assert.match(context, /Recovery：tier=astra/);
    assert.match(context, /next=astra-xhigh/);
    assert.match(context, /recoveryLimit=/);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('Astra counts ordinary failures across worker families and exhausts only its own recovery lease', () => {
  const root = recoveryRoot();
  try {
    for (let i = 0; i < 5; i += 1) {
      const result = delegation.recordAgentFailure(root, {
        id: `mixed-ordinary-${i}`, stableWorkUnit: 'recovery-unit', acceptanceGate: 'direct',
        stableProblemFingerprint: 'mixed-problem', modelFamily: i % 2 ? 'gemini' : 'grok', channel: 'worker',
        model: i % 2 ? 'gemini-model' : 'grok-model', reasoning: 'high', category: 'claimed-complete-acceptance-failure',
        effective: true, completeRecovery: false, evidenceRef: `mixed/${i}`,
        primaryCause: `cause-${i}`, substantiveKey: `mixed-route-${i}`,
      }, { at: `2026-01-01T00:00:1${i}.000Z` });
      assert.equal(result.counted, true, result.reason);
    }
    for (let i = 0; i < 3; i += 1) {
      const result = delegation.recordAgentFailure(root, {
        id: `astra-recovery-${i}`, stableWorkUnit: 'recovery-unit', acceptanceGate: 'direct',
        stableProblemFingerprint: 'mixed-problem', modelFamily: 'gpt-6-astra', channel: 'codex',
        model: 'gpt-6-astra', reasoning: 'xhigh', recoveryRole: 'recovery', category: 'disproven-diagnosis',
        effective: true, completeRecovery: true, evidenceRef: `astra/${i}`,
        primaryCause: `astra-cause-${i}`, substantiveKey: `astra-route-${i}`,
      }, { at: `2026-01-01T00:00:2${i}.000Z` });
      assert.equal(result.counted, true, result.reason);
    }
    const state = delegation.read(root);
    assert.equal(state.live, true, state.reason);
    const summary = delegation.recoverySummary(state.ledger);
    assert.equal(summary.tier, 'exhausted');
    assert.equal(summary.blocked.length, 1);
    assert.match(summary.nextTier, /blocked/);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('Astra recovery limits 1 through 5 bind before the lease and reject forged counts', () => {
  for (const limit of [1, 2, 3, 4, 5]) {
    const root = recoveryRoot();
    try {
      for (let i = 0; i < 5; i += 1) {
        const result = delegation.recordAgentFailure(root, {
          id: `configured-ordinary-${limit}-${i}`, stableWorkUnit: 'recovery-unit', acceptanceGate: 'direct',
          stableProblemFingerprint: `configured-${limit}`, modelFamily: i % 2 ? 'gemini' : 'grok', channel: 'worker',
          model: 'worker', reasoning: 'high', category: 'claimed-complete-acceptance-failure', effective: true,
          completeRecovery: false, recoveryAttemptLimit: limit, evidenceRef: `configured/${limit}/${i}`,
          primaryCause: `configured-cause-${limit}-${i}`, substantiveKey: `configured-route-${limit}-${i}`,
        }, { at: `2025-01-01T00:00:0${i}.000Z` });
        assert.equal(result.ok, true, result.reason);
      }
      for (let i = 0; i < limit; i += 1) {
        const result = delegation.recordAgentFailure(root, {
          id: `configured-astra-${limit}-${i}`, stableWorkUnit: 'recovery-unit', acceptanceGate: 'direct',
          stableProblemFingerprint: `configured-${limit}`, modelFamily: 'gpt-6-astra', channel: 'codex',
          model: 'gpt-6-astra', reasoning: 'xhigh', recoveryRole: 'recovery', category: 'disproven-diagnosis', effective: true,
          completeRecovery: true, recoveryAttemptLimit: limit, evidenceRef: `configured-astra/${limit}/${i}`,
          primaryCause: `configured-astra-cause-${limit}-${i}`, substantiveKey: `configured-astra-route-${limit}-${i}`,
        }, { at: `2025-01-01T00:00:1${i}.000Z` });
        assert.equal(result.ok, true, result.reason);
      }
      const lease = delegation.recoverySummary(delegation.read(root).ledger).leases[0];
      assert.equal(lease.tier, 'exhausted');
      assert.equal(lease.solAttemptLimit, limit);
      const tampered = JSON.parse(fs.readFileSync(delegation.ledgerPath(root), 'utf8'));
      const leaseKey = Object.keys(tampered.failures.leases)[0];
      tampered.failures.leases[leaseKey].effectiveCount = 999;
      fs.writeFileSync(delegation.ledgerPath(root), `${JSON.stringify(tampered)}\n`);
      assert.equal(delegation.read(root).live, false);
      assert.equal(delegation.read(root).reason, 'shape');
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  }
});

test('legacy Terra/Sol leases are projected as UNKNOWN and cannot be resumed by Astra', () => {
  const key = `sha256:${'a'.repeat(64)}`;
  const ledger = { failures: {
    schemaVersion: 1, events: {},
    problems: { legacy: { key: 'legacy', leaseKey: key, leaf: 'docs/harness/leaves/legacy.md', stableWorkUnit: 'recovery-unit', acceptanceGate: 'direct', stableProblemFingerprint: 'legacy-problem', modelFamily: 'sol', effectiveCount: 1, policy: null } },
    leases: { [key]: { leaseKey: key, leaf: 'docs/harness/leaves/legacy.md', stableWorkUnit: 'recovery-unit', acceptanceGate: 'direct', stableProblemFingerprint: 'legacy-problem', tier: 'sol', status: 'active', reason: 'sol-effective-semantic-failure', effectiveCount: 1, solAttemptLimit: 3, recoveryAttemptLimit: 3, updatedAt: '2025-01-01T00:00:00.000Z', triggerEvent: 'legacy' } },
  } };
  const summary = delegation.recoverySummary(ledger);
  assert.equal(summary.tier, 'legacy');
  assert.match(summary.nextTier, /explicit migration/);
});

test('combined Astra work, capability, recovery, and push context stays within 1800 characters', () => {
  const root = recoveryRoot();
  try {
    const leaf = path.join(root, 'docs/harness/leaves/astra.md');
    const units = Array.from({ length: 7 }, (_, i) => `\n## Work Unit U${i + 2}\n\ngoal: long-${i}\n\ncompletionStandards:\n\n- ${'x'.repeat(180)}\n- ${'y'.repeat(180)}\n\ndependencies:\n\n- 无\n`).join('');
    fs.appendFileSync(leaf, units);
    for (let i = 1; i <= 8; i += 1) {
      const result = delegation.recordEvent(root, { id: `status-${i}`, workUnit: i === 1 ? 'recovery-unit' : `U${i}`, status: i <= 2 ? 'active' : 'rejected' }, { at: `2025-01-01T00:00:0${i}.000Z` });
      assert.equal(result.ok, true, result.reason);
    }
    for (let i = 0; i < 5; i += 1) {
      const result = delegation.recordAgentFailure(root, {
        id: `pressure-failure-${i}`, stableWorkUnit: 'recovery-unit', acceptanceGate: 'direct', stableProblemFingerprint: 'pressure',
        modelFamily: i % 2 ? 'gemini' : 'grok', channel: 'worker', model: 'worker', reasoning: 'high',
        category: 'claimed-complete-acceptance-failure', effective: true, completeRecovery: false,
        evidenceRef: `pressure/${i}`, primaryCause: `pressure-cause-${i}`, substantiveKey: `pressure-route-${i}`,
      }, { at: `2025-01-01T00:01:0${i}.000Z` });
      assert.equal(result.ok, true, result.reason);
    }
    const models = ['gpt-6-astra', 'grok', 'gemini', 'ordinary'].map((model, i) => ({ channel: model, model, reasoning: i === 0 ? 'xhigh' : 'high', family: i === 0 ? 'gpt-6-astra' : model, status: 'available' }));
    const context = hook.sessionStart(root, { hook_event_name: 'SessionStart', session_id: 's', turn_id: 't', capability_manifest: {
      schemaVersion: 1, kind: capabilities.KIND, binding: { project: root, session: 's', turn: 't', event: 'SessionStart', source: 'hook-input' },
      freshness: { status: 'fresh', createdAt: '2025-01-01T00:00:00.000Z', expiresAt: '2025-01-01T00:20:00.000Z', ttlMs: 1200000 }, models,
    } }, { write: false, now: '2025-01-01T00:01:00.000Z', pushGate: { action: 'git push', target: `remote/${'x'.repeat(1200)}`, boundary: `main${'b'.repeat(700)}`, risk: `destructive${'r'.repeat(700)}`, userDecision: `confirm${'u'.repeat(700)}` } }).hookSpecificOutput.additionalContext;
    assert.equal(context.length <= 1800, true, context.length);
    assert.match(context, /ParallelWorkUnitsCarrier：/);
    assert.match(context, /Decision：focus=/);
    assert.match(context, /CompletionCarrier：/);
    assert.match(context, /Recovery：/);
    assert.match(context, /PushGate：complete=false/);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('Astra instruction and skills keep recovery and testing behavior-focused', () => {
  assert.match(install.INSTRUCTION, /GPT-6 Astra|Astra/);
  assert.doesNotMatch(install.INSTRUCTION, /Terra xhigh|Sol xhigh|暂停 B/);
  assert.doesNotMatch(fs.readFileSync(path.join(__dirname, '..', 'skills', 'root-cause.md'), 'utf8'), /Terra xhigh|Sol xhigh/);
  assert.match(fs.readFileSync(path.join(__dirname, '..', 'skills', 'test-first.md'), 'utf8'), /配置.*验证|实际行为/);
});

test('retained 0.12 installation can be explicitly upgraded and uninstalled', { timeout: 120000 }, () => {
  const artifact = path.join(__dirname, '..', 'docs', 'harness', 'artifacts', 'harness-lite-0.12.0-ef33cf10d2f28ed57be76d22994cbe701cc81b69927f582773ed4e8dc0122db3.json');
  assert.equal(fs.existsSync(artifact), true, 'retained 0.12 artifact is required');
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'hl-astra-upgrade-'));
  try {
    const source = path.join(parent, 'retained-12'), project = path.join(parent, 'project');
    const data = JSON.parse(fs.readFileSync(artifact, 'utf8'));
    fs.mkdirSync(source, { recursive: true }); fs.mkdirSync(project);
    for (const row of data.files) {
      const file = path.join(source, row.path);
      fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, Buffer.from(row.contentBase64, 'base64')); fs.chmodSync(file, parseInt(row.mode, 8));
    }
    const retainedApi = require(path.join(source, 'lib', 'install.js'));
    assert.equal(retainedApi.install(project, { write: true, source }).status, 'INSTALLED');
    assert.equal(install.inspect(project).kind, 'previous-12-snapshot');
    assert.equal(install.install(project, { write: false, upgrade: false }).status, 'HOLD');
    assert.equal(install.install(project, { write: false, upgrade: true }).status, 'READY');
    assert.equal(install.install(project, { write: true, upgrade: true }).status, 'INSTALLED');
    assert.equal(install.verify06(project).ok, true);
    assert.equal(install.uninstall(project, { write: true }).status, 'UNINSTALLED');
  } finally { fs.rmSync(parent, { recursive: true, force: true }); }
});
