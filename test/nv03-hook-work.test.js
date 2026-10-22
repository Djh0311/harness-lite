'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const test = require('node:test');

const delegation = require('../lib/delegation.js');
const hook = require('../lib/hook.js');
const tree = require('../lib/tree.js');
const work = require('../lib/work.js');
const { workUnitDeclarations } = require('./fixtures/work-unit-declarations.js');

function tempRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hl-nv03-hook-'));
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
    '产品：test product',
    '',
    '完成标准：',
    '',
    '- event guidance projects the relevant live state',
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
    ...workUnitDeclarations(['A', 'B', 'C', 'D', 'E', ...stressWorkUnitIds()]),
  ].join('\n'));
  return root;
}

function authTurn(root, session = 's', turn = 't') {
  const now = Date.now();
  const startedAt = new Date(now - 5000).toISOString();
  const expiresAt = new Date(now + 60000).toISOString();
  const receiptId = 'u-0123456789abcdef0123';
  const input = { hook_event_name: 'Stop', session_id: session, turn_id: turn, stop_hook_active: true };
  const state = {
    startedAt,
    receipt: { receiptId, project: root, thread: session, turn },
    userPromptSubmit: { origin: 'user-prompt-submit', receiptId, project: root, session, turn },
    intent: { action: 'execute', sourceReceipt: receiptId, leaf: 'docs/harness/leaves/L1.md', stage: 'stage-alpha' },
    baseline: work.snapshot(root),
    events: ['UserPromptSubmit'],
  };
  hook.writeTurn(root, input, state);
  fs.writeFileSync(path.join(root, 'docs/harness/authorization.json'), `${JSON.stringify({
    schemaVersion: 1,
    authorized: true,
    leaf: 'docs/harness/leaves/L1.md',
    stage: 'stage-alpha',
    executionReceipt: receiptId,
    expiresAt,
  }, null, 2)}\n`);
  return { input, state };
}

function writeMalformedDelegation(root) {
  const chain = tree.readChain(root);
  const ledger = delegation.freshLedger(root, chain);
  ledger.workUnits.A = {
    id: 'A',
    status: 'active',
    dependencies: 'B',
    writeScope: [],
    events: [],
  };
  fs.mkdirSync(path.dirname(delegation.ledgerPath(root)), { recursive: true });
  fs.writeFileSync(delegation.ledgerPath(root), `${JSON.stringify(ledger, null, 2)}\n`);
}

function stressId(kind, index) {
  return `${kind}-LONG-${String(index).padStart(2, '0')}-ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZ`;
}
function stressWorkUnitIds() {
  return ['ACTIVE', 'REPORTED', 'ACCEPTED', 'BLOCKED', 'PARTIAL', 'WAITING']
    .flatMap((kind) => Array.from({ length: 8 }, (_, index) => stressId(kind, index)));
}

function writeStressDelegation(root) {
  const at = '2000-01-01T00:00:00.000Z';
  for (let i = 0; i < 8; i++) {
    const id = stressId('ACTIVE', i);
    delegation.recordEvent(root, {
      id: `evt-active-${i}`,
      workUnit: id,
      status: 'active',
      writeScope: [`lib/${id}/**`],
    }, { at });
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
    delegation.recordEvent(root, { id: `evt-reported-${i}`, workUnit: stressId('REPORTED', i), status: 'reported_complete' }, { at });
    delegation.recordEvent(root, { id: `evt-accepted-${i}`, workUnit: stressId('ACCEPTED', i), status: 'accepted', evidenceRef: `reports/accepted-${i}.md` }, { at });
    delegation.recordEvent(root, { id: `evt-blocked-${i}`, workUnit: stressId('BLOCKED', i), status: 'blocked' }, { at });
    delegation.recordEvent(root, { id: `evt-partial-${i}`, workUnit: stressId('PARTIAL', i), status: 'partial' }, { at });
    delegation.recordEvent(root, {
      id: `evt-waiting-${i}`,
      workUnit: stressId('WAITING', i),
      status: 'rejected',
      dependencies: [stressId('ACTIVE', i)],
    }, { at });
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
    '- event guidance remains bounded under stress',
    '',
    '允许动：',
    '',
    ...longItems.map((item) => `- allowed/${item}`),
    '',
    '不许动：',
    '',
    ...longItems.map((item) => `- local-forbidden/${item}`),
    ...workUnitDeclarations(['A', 'B', 'C', 'D', 'E', ...stressWorkUnitIds()]),
  ].join('\n'));
}

function assertLifecycleVisible(context) {
  assert.equal(context.length <= 1800, true, context.length);
  for (const needle of [
    'Harness：stage=',
    'ParallelWorkUnitsCarrier：complete=',
    'ref=docs/harness/leaves/',
    'readApi=tree.workUnitPackages',
    'digest=sha256:',
    'Heartbeat：read-only',
    'Decision：focus=',
    'CompletionCarrier：',
  ]) {
    assert.ok(context.includes(needle), `${needle}\n${context}`);
  }
}

test('work status and report expose delegation state as separate fields', () => {
  const root = tempRoot();
  try {
    let status = work.status(root, { now: '2026-01-01T00:05:00.000Z' });
    assert.equal(status.delegation.state.live, false);
    assert.deepEqual(status.guidance.events, []);
    assert.equal(status.text.includes('Heartbeat：'), false);
    assert.equal(status.text.includes('Recovery：'), false);

    delegation.recordEvent(root, { id: 'evt-a-active', workUnit: 'A', status: 'active', writeScope: ['lib/work.js'] }, { at: '2026-01-01T00:00:00.000Z' });
    delegation.recordEvent(root, { id: 'evt-a-activity', workUnit: 'A', kind: 'activity', activityKind: 'tool-wait' }, { at: '2026-01-01T00:01:00.000Z' });
    delegation.recordEvent(root, { id: 'evt-a-progress', workUnit: 'A', kind: 'progress', progressKind: 'verified-fact', evidenceRef: 'reports/fact.md' }, { at: '2026-01-01T00:02:00.000Z' });
    delegation.recordEvent(root, { id: 'evt-b-report', workUnit: 'B', status: 'reported_complete', dependencies: ['A'] }, { at: '2026-01-01T00:03:00.000Z' });
    delegation.recordEvent(root, { id: 'evt-c-block', workUnit: 'C', status: 'blocked', dependencies: ['B'] }, { at: '2026-01-01T00:04:00.000Z' });
    delegation.recordEvent(root, { id: 'evt-d-accept', workUnit: 'D', status: 'accepted', evidenceRef: 'reports/d.md' }, { at: '2026-01-01T00:05:00.000Z' });

    status = work.status(root, { now: '2026-01-01T00:06:00.000Z' });
    assert.equal(status.delegation.state.live, true);
    assert.deepEqual(status.guidance.events, ['agent-active', 'agent-reported']);
    assert.deepEqual(status.guidance.active, ['A']);
    assert.deepEqual(status.guidance.reported, ['B']);
    assert.equal(status.guidance.heartbeat.intervalMs, 300000);
    assert.ok(status.text.includes('GuidanceEvents：agent-active、agent-reported'));
    assert.equal(status.text.includes('Recovery：'), false);

    const report = work.report(root, {
      chain: status.chain,
      delta: { changed: [], inherited: [], unknown: [], headChanged: false },
      verification: null,
    }, { write: false, now: '2026-01-01T00:06:00.000Z' });
    assert.ok(report.text.includes('Activity：A:tool-wait'));
    assert.ok(report.text.includes('Recovery：tier=ordinary'));
    assert.ok(report.text.includes('Progress：A:verified-fact'));
    assert.ok(report.text.includes('Reported：B'));
    assert.ok(report.text.includes('Accepted：D'));
    assert.ok(report.text.includes('Blocked：C'));
    assert.ok(report.text.includes('Dependencies：B<-A:active、C<-B:reported_complete'));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('work and hook projections fail closed without crashing on malformed nested delegation ledger', () => {
  const root = tempRoot();
  try {
    writeMalformedDelegation(root);
    const before = fs.readFileSync(delegation.ledgerPath(root), 'utf8');
    const status = work.status(root);
    assert.equal(status.delegation.state.live, false);
    assert.equal(status.delegation.state.reason, 'shape');
    assert.deepEqual(status.guidance.events, []);
    assert.equal(status.text.includes('Delegation：'), false);

    const start = hook.sessionStart(root, { hook_event_name: 'SessionStart', session_id: 's', turn_id: 't' });
    assert.equal(start.hookSpecificOutput.additionalContext.includes('Delegation：'), false);
    assert.equal(start.hookSpecificOutput.additionalContext.includes('Recovery：'), false);

    const prompt = hook.userPrompt(root, {
      hook_event_name: 'UserPromptSubmit',
      session_id: 's',
      turn_id: 'u',
      prompt: 'malformed carrier should not be stored',
    });
    assert.equal(prompt.kind, 'receipt');
    assert.equal(prompt.context.includes('Delegation：'), false);
    assert.equal(fs.readFileSync(delegation.ledgerPath(root), 'utf8'), before);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('SessionStart and UserPromptSubmit include read-only delegation context', () => {
  const root = tempRoot();
  try {
    delegation.recordEvent(root, { id: 'evt-a-active', workUnit: 'A', status: 'active' }, { at: '2026-01-01T00:00:00.000Z' });
    delegation.recordEvent(root, { id: 'evt-b-report', workUnit: 'B', status: 'reported_complete', dependencies: ['A'] }, { at: '2026-01-01T00:00:01.000Z' });
    delegation.recordEvent(root, { id: 'evt-c-block', workUnit: 'C', status: 'blocked', dependencies: ['B'] }, { at: '2026-01-01T00:00:02.000Z' });
    delegation.recordEvent(root, { id: 'evt-d-partial', workUnit: 'D', status: 'partial' }, { at: '2026-01-01T00:00:03.000Z' });
    delegation.recordEvent(root, { id: 'evt-e-accepted', workUnit: 'E', status: 'accepted', evidenceRef: 'reports/e.md' }, { at: '2026-01-01T00:00:04.000Z' });
    const start = hook.sessionStart(root, { hook_event_name: 'SessionStart', session_id: 's', turn_id: 't' });
    assert.ok(start.hookSpecificOutput.additionalContext.includes('Delegation：live=true'));
    assert.ok(start.hookSpecificOutput.additionalContext.includes('Activity：'));
    assert.ok(start.hookSpecificOutput.additionalContext.includes('Progress：'));
    assert.ok(start.hookSpecificOutput.additionalContext.includes('Reported：B'));
    assert.ok(start.hookSpecificOutput.additionalContext.includes('Accepted：E'));
    assert.ok(start.hookSpecificOutput.additionalContext.includes('Dependencies：B<-A:active、C<-B:reported_complete'));
    assert.ok(start.hookSpecificOutput.additionalContext.includes('Heartbeat：read-only'));
    assert.equal(start.hookSpecificOutput.additionalContext.includes('Recovery：'), false);

    const prompt = hook.userPrompt(root, {
      hook_event_name: 'UserPromptSubmit',
      session_id: 's',
      turn_id: 'u',
      prompt: 'continue',
    });
    assert.equal(prompt.kind, 'receipt');
    assert.ok(prompt.context.includes('Delegation：live=true'));
    assert.ok(prompt.context.includes('Activity：'));
    assert.ok(prompt.context.includes('Progress：'));
    assert.ok(prompt.context.includes('Reported：B'));
    assert.ok(prompt.context.includes('Accepted：E'));
    assert.ok(prompt.context.includes('Dependencies：B<-A:active、C<-B:reported_complete'));
    assert.ok(prompt.context.includes('Heartbeat：read-only'));
    assert.ok(prompt.context.includes('due=A'));
    assert.equal(prompt.context.includes('Recovery：'), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('bounded SessionStart and UserPromptSubmit contexts keep all lifecycle categories visible within 1800 chars under stress', () => {
  const root = tempRoot();
  try {
    writeStressDelegation(root);
    const start = hook.sessionStart(root, { hook_event_name: 'SessionStart', session_id: 's', turn_id: 't' }).hookSpecificOutput.additionalContext;
    const prompt = hook.userPrompt(root, {
      hook_event_name: 'UserPromptSubmit',
      session_id: 's',
      turn_id: 'u',
      prompt: 'stress context without storing prompt text',
    }).context;
    for (const context of [start, prompt.slice(0, 1800)]) {
      for (const needle of [
        'Harness：stage=',
        'ParallelWorkUnitsCarrier：complete=',
        'ref=docs/harness/leaves/',
        'readApi=tree.workUnitPackages',
        'digest=sha256:',
        'Heartbeat：read-only',
        'due=ACTIVE-LONG',
      ]) {
        assert.ok(context.includes(needle), `${needle}\n${context}`);
      }
    }
    assert.equal(start.length <= 1800, true);
    assert.equal(prompt.length <= 1800, true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('long provenance metadata and multi-category ledger cannot tail-cut lifecycle rows', () => {
  const root = tempRoot();
  try {
    writeHeavyMetadata(root);
    writeStressDelegation(root);
    const start = hook.sessionStart(root, { hook_event_name: 'SessionStart', session_id: 's', turn_id: 't' }).hookSpecificOutput.additionalContext;
    const prompt = hook.userPrompt(root, {
      hook_event_name: 'UserPromptSubmit',
      session_id: 's',
      turn_id: 'u',
      prompt: 'long provenance must not be stored or visible',
    }).context;
    for (const context of [start, prompt]) {
      assertLifecycleVisible(context);
      for (const needle of [
        'ParallelWorkUnitsCarrier：complete=',
        'count=8',
        'due=ACTIVE-LONG',
      ]) {
        assert.ok(context.includes(needle), `${needle}\n${context}`);
      }
      assert.equal(context.includes('X'.repeat(500)), false);
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('long metadata contexts omit unrelated lifecycle placeholders for stale and UNKNOWN delegation states', () => {
  for (const [name, setup] of [
    ['stale-shape', (root) => writeMalformedDelegation(root)],
    ['unknown-conflict', (root) => fs.writeFileSync(path.join(root, 'docs/harness/leaves/L2.md'), '# L2\n\n阶段：stage-alpha\n')],
  ]) {
    const root = tempRoot();
    try {
      writeHeavyMetadata(root);
      setup(root);
      const start = hook.sessionStart(root, { hook_event_name: 'SessionStart', session_id: `s-${name}`, turn_id: 't' }).hookSpecificOutput.additionalContext;
      const prompt = hook.userPrompt(root, {
        hook_event_name: 'UserPromptSubmit',
        session_id: `s-${name}`,
        turn_id: 'u',
        prompt: `context ${name}`,
      }).context;
      for (const context of [start, prompt]) {
        assert.equal(context.length <= 1800, true);
        assert.ok(context.includes('Harness：stage='), context);
        assert.equal(context.includes('Delegation：'), false, context);
        assert.equal(context.includes('Heartbeat：'), false, context);
        assert.equal(context.includes('Recovery：'), false, context);
      }
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }
});

test('Stop does not treat verify file or head activity as semantic progress', () => {
  const root = tempRoot();
  try {
    const { input, state } = authTurn(root);
    fs.mkdirSync(path.join(root, 'docs/harness'), { recursive: true });
    fs.appendFileSync(path.join(root, 'docs/harness/verify.jsonl'), `${JSON.stringify({
      at: new Date(Date.now() - 1000).toISOString(),
      profile: 'task',
      ok: false,
      ids: ['failing-check'],
      summary: 'failing-check:fail',
      results: [{ id: 'failing-check', status: 1 }],
    })}\n`);
    const result = hook.stop(root, input, { write: false });
    assert.equal(result.output.decision, undefined);
    assert.equal(result.state.lastStopToken.length, 64);
    assert.equal(result.state[['fail', 'ures'].join('')], undefined);
    assert.ok(result.report.text.includes('verify/file/head 只作为 activity/report，不冒充 semantic progress'));

    const source = fs.readFileSync(path.resolve(__dirname, '../lib/hook.js'), 'utf8');
    assert.equal(source.includes(['failures', '[failure] < 3'].join('')), false);
    assert.equal(source.includes('同处失败'), false);
    assert.equal(source.includes(['state', 'failures'].join('.')), false);
    assert.equal(state.receipt.receiptId, 'u-0123456789abcdef0123');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('Stop continuation is based on evidence-bound semantic progress only', () => {
  const root = tempRoot();
  try {
    const { input, state } = authTurn(root, 's2', 't2');
    delegation.recordEvent(root, { id: 'evt-a-active', workUnit: 'A', status: 'active' }, { at: state.startedAt });
    delegation.recordEvent(root, {
      id: 'evt-a-progress',
      workUnit: 'A',
      kind: 'progress',
      progressKind: 'verified-fact',
      evidenceRef: 'reports/fact.md',
    }, { at: new Date(Date.now() - 1000).toISOString() });
    const result = hook.stop(root, input, { write: false });
    assert.equal(result.output.decision, 'block');
    assert.equal(result.output.reason, hook.CONTINUATION_REASON);
    assert.equal(result.delegation.summary.semanticProgress.length, 1);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('heartbeat-only Stop projects read-only due without continuation or ledger mutation', () => {
  const root = tempRoot();
  try {
    const { input } = authTurn(root, 'heartbeat', 'turn-1');
    delegation.recordEvent(root, { id: 'evt-a-active', workUnit: 'A', status: 'active' }, { at: '2030-01-01T00:00:00.000Z' });
    const before = fs.readFileSync(delegation.ledgerPath(root), 'utf8');
    const result = hook.stop(root, input, { write: false, now: '2030-01-01T00:05:00.000Z' });
    assert.equal(result.output.decision, undefined);
    assert.deepEqual(result.heartbeatDue, ['A']);
    assert.deepEqual(result.delegation.summary.heartbeat.due, ['A']);
    assert.equal(result.delegation.summary.semanticProgress.length, 0);
    assert.ok(result.report.text.includes('Heartbeat：read-only'));
    assert.ok(result.report.text.includes('due=A'));
    assert.ok(result.report.text.includes('heartbeat due：只读提醒 A'));
    assert.equal(fs.readFileSync(delegation.ledgerPath(root), 'utf8'), before);
    const unit = delegation.read(root).ledger.workUnits.A;
    assert.equal(unit.heartbeatAt, undefined);
    assert.equal(unit.progressAt, undefined);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('dispatch Stop heartbeat-only path remains non-blocking while stop result carries due', () => {
  const root = tempRoot();
  try {
    const { input } = authTurn(root, 'heartbeat-dispatch', 'turn-1');
    delegation.recordEvent(root, { id: 'evt-a-active', workUnit: 'A', status: 'active' }, { at: '2030-01-01T00:00:00.000Z' });
    const wire = hook.dispatch(root, input, { write: false, now: '2030-01-01T00:05:00.000Z' });
    assert.deepEqual(wire, {});

    const root2 = tempRoot();
    try {
      const { input: input2 } = authTurn(root2, 'heartbeat-stop', 'turn-1');
      delegation.recordEvent(root2, { id: 'evt-a-active', workUnit: 'A', status: 'active' }, { at: '2030-01-01T00:00:00.000Z' });
      const result = hook.stop(root2, input2, { write: false, now: '2030-01-01T00:05:00.000Z' });
      assert.deepEqual(result.heartbeatDue, ['A']);
      assert.ok(result.report.text.includes('due=A'));
    } finally {
      fs.rmSync(root2, { recursive: true, force: true });
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('heartbeat-only Stop persists a read-only due report when writing is enabled', () => {
  const root = tempRoot();
  try {
    const { input } = authTurn(root, 'heartbeat-write', 'turn-1');
    delegation.recordEvent(root, { id: 'evt-a-active', workUnit: 'A', status: 'active' }, { at: '2030-01-01T00:00:00.000Z' });
    const before = fs.readFileSync(delegation.ledgerPath(root), 'utf8');
    const result = hook.stop(root, input, { now: '2030-01-01T00:05:00.000Z' });
    assert.equal(result.output.decision, undefined);
    assert.deepEqual(result.heartbeatDue, ['A']);
    assert.ok(fs.existsSync(result.report.file));
    const text = fs.readFileSync(result.report.file, 'utf8');
    assert.ok(text.includes('Heartbeat：read-only'));
    assert.ok(text.includes('due=A'));
    assert.ok(text.includes('heartbeat due：只读提醒 A'));
    assert.equal(fs.readFileSync(delegation.ledgerPath(root), 'utf8'), before);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('same semantic progress is consumed once and verify or activity changes do not re-block the same turn', () => {
  const root = tempRoot();
  try {
    const { input, state } = authTurn(root, 'same-progress', 'turn-1');
    delegation.recordEvent(root, { id: 'evt-a-active', workUnit: 'A', status: 'active' }, { at: state.startedAt });
    delegation.recordEvent(root, {
      id: 'evt-a-progress',
      workUnit: 'A',
      kind: 'progress',
      progressKind: 'verified-fact',
      evidenceRef: 'reports/fact.md',
    }, { at: new Date(Date.now() - 3000).toISOString() });

    const first = hook.stop(root, input);
    assert.equal(first.output.decision, 'block');
    assert.equal(first.state.consumedSemanticProgress.length, 1);
    assert.equal(first.delegation.summary.semanticProgress.length, 1);

    delegation.recordEvent(root, {
      id: 'evt-a-activity',
      workUnit: 'A',
      kind: 'activity',
      activityKind: 'verify-ran',
    }, { at: new Date(Date.now() - 1000).toISOString() });
    fs.appendFileSync(path.join(root, 'docs/harness/verify.jsonl'), `${JSON.stringify({
      at: new Date().toISOString(),
      profile: 'task',
      ok: false,
      ids: ['failing-check'],
      summary: 'failing-check:fail',
      results: [{ id: 'failing-check', status: 1 }],
    })}\n`);

    const second = hook.stop(root, input);
    assert.equal(second.output.decision, undefined);
    assert.deepEqual(second.state.consumedSemanticProgress, first.state.consumedSemanticProgress);
    assert.equal(second.state.consumedSemanticProgress.length, 1);
    assert.ok(second.report.text.includes('Activity：A:verify-ran'));
    assert.ok(second.report.text.includes('Progress：A:verified-fact'));
    assert.ok(second.report.text.includes('Heartbeat：read-only'));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
