'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const test = require('node:test');

const hook = require('../lib/hook.js');
const delegation = require('../lib/delegation.js');
const io = require('../lib/io.js');
const work = require('../lib/work.js');
const tree = require('../lib/tree.js');

function project(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hl14-correction-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'docs/harness/leaves'), { recursive: true });
  fs.mkdirSync(path.join(root, 'docs/harness/stages'), { recursive: true });
  fs.writeFileSync(path.join(root, 'docs/harness/plan.md'), '# Plan\n目标：deliver a result\n');
  fs.writeFileSync(path.join(root, 'docs/harness/stages/stage-one.md'), '# Stage\n不许动：\n- release\n');
  fs.writeFileSync(path.join(root, 'docs/harness/leaves/L1.md'), [
    '# Leaf', '阶段：stage-one', '目标：deliver a result',
    '完成标准：', '- the result is usable', '',
    '允许动：', '- src', '', '不许动：', '- private', '',
    '## Work Unit A', '目标：deliver a result', '完成标准：', '- the result is usable', '',
    '允许动：', '- src', '', '依赖：无', '路线依据：direct evidence', '',
  ].join('\n'));
  return root;
}

function checks(root, entries) {
  fs.writeFileSync(path.join(root, 'docs/harness/checks.json'), JSON.stringify({ version: 1, checks: entries }));
}

test('empty verify records not-run instead of successful verification', (t) => {
  const root = project(t);
  const result = work.verify(root, { run: true });
  assert.equal(result.ran, false);
  assert.equal(result.ok, null);
  assert.equal(result.status, 'not-run');
  assert.match(result.summary, /未执行/);
  const receipt = work.latestVerify(root);
  assert.equal(receipt.ok, null);
  assert.equal(receipt.ran, false);
  const report = work.report(root, { verification: receipt }, { write: false });
  assert.match(report.text, /未执行/);
  assert.doesNotMatch(report.text, /证据：通过|证据：失败/);
});

test('latest empty verification does not resurrect an older successful receipt', (t) => {
  const root = project(t);
  fs.writeFileSync(path.join(root, 'docs/harness/verify.jsonl'), [
    { at: '2026-10-07T01:00:00.000Z', ok: true, ids: ['check'], results: [{ id: 'check', ok: true, status: 0 }], summary: 'check:pass' },
    { at: '2026-10-07T02:00:00.000Z', ok: true, ids: [], results: [], summary: 'no checks' },
  ].map((row) => JSON.stringify(row)).join('\n') + '\n');
  const before = fs.readFileSync(path.join(root, 'docs/harness/verify.jsonl'));
  const receipt = work.latestVerify(root);
  assert.equal(receipt.at, '2026-10-07T02:00:00.000Z');
  assert.equal(receipt.ran, false);
  assert.equal(receipt.ok, null);
  assert.equal(receipt.status, 'not-run');
  assert.deepEqual(fs.readFileSync(path.join(root, 'docs/harness/verify.jsonl')), before);
  assert.doesNotMatch(work.report(root, { verification: receipt }, { write: false }).text, /证据：通过/);
});

test('registered checks still distinguish actual passing and failing execution', (t) => {
  const root = project(t);
  for (const code of [0, 1]) {
    checks(root, [{ id: `check-${code}`, profile: 'task', paths: ['src'], argv: [process.execPath, '-e', `process.exit(${code})`], timeoutMs: 1000 }]);
    const result = work.verify(root, { run: true, files: ['src/a.js'] });
    assert.equal(result.ran, true);
    assert.equal(result.ok, code === 0);
    assert.equal(result.results[0].status, code);
    assert.equal(work.latestVerify(root).ok, code === 0);
  }
});

test('manual verification stays a plan and does not create a successful receipt', (t) => {
  const root = project(t);
  checks(root, [{ id: 'visual', profile: 'manual', note: 'Read the exported result' }]);
  const result = work.verify(root, { run: true, profile: 'manual' });
  assert.equal(result.ran, false);
  assert.equal(result.notes[0].id, 'visual');
  assert.equal(work.latestVerify(root), null);
});

test('stage and leaf forbidden paths both reach the current boundary', (t) => {
  const root = project(t);
  assert.deepEqual(tree.readChain(root).forbidden, ['release', 'private']);
});

test('an explicitly forbidden child of an allowed path is reported as a violation', (t) => {
  const root = project(t), chain = tree.readChain(root);
  chain.forbidden = ['src/private'];
  const result = work.report(root, { chain, delta: {
    changed: ['src/private/data.json', 'src/public.js'], inherited: [], unknown: [],
  } }, { write: false });
  assert.equal(result.outOfScope, 1);
  assert.match(result.text, /范围外：1（src\/private\/data\.json）/);
});

test('missing current leaf reports unknown scope rather than declaring all changes forbidden', (t) => {
  const root = project(t);
  fs.unlinkSync(path.join(root, 'docs/harness/leaves/L1.md'));
  const report = work.report(root, {
    delta: { changed: ['src/a.js'], inherited: [], unknown: [], headChanged: false },
  }, { write: false });
  assert.equal(report.outOfScope, null);
  assert.match(report.text, /范围外：UNKNOWN/);
  assert.doesNotMatch(report.text, /范围外：1/);
});

function executingTurn(root) {
  const input = { hook_event_name: 'UserPromptSubmit', session_id: 's1', turn_id: 't1', prompt: 'Fix the result within the current scope' };
  const submitted = hook.userPrompt(root, input);
  const state = hook.readTurn(root, input);
  assert.equal(hook.preTool(root, { ...input, hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: {
    command: hook.intentCommand({ sourceReceipt: submitted.receipt.receiptId, action: 'execute' }),
  } }).hookSpecificOutput.permissionDecision, 'allow');
  delegation.recordEvent(root, { id: 'active-a', workUnit: 'A', status: 'active' });
  delegation.recordEvent(root, {
    id: 'progress-a', workUnit: 'A', kind: 'progress', progressKind: 'verified-fact', evidenceRef: 'reports/fact.md',
  });
  return { input: { ...input, hook_event_name: 'Stop', stop_hook_active: false }, state };
}

function observed(root) {
  return io.read(path.join(root, 'docs/harness/usage/.observed.jsonl'), '').trim().split('\n').filter(Boolean).map(JSON.parse);
}

test('unrelated old push pending cannot suppress evidence-bound ordinary continuation', (t) => {
  const root = project(t);
  const { input } = executingTurn(root);
  io.atomic(path.join(hook.turnDir(root), '.push.json'), JSON.stringify({
    pending: { session: 'old-session', turn: 'old-turn', createdAt: '2020-01-01T00:00:00.000Z' },
  }));
  const result = hook.stop(root, input);
  assert.equal(result.output.decision, 'block');
  assert.equal(hook.readPush(root).pending.session, 'old-session');
  const rows = observed(root).filter((row) => row.event === 'Stop');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].decision, 'continued');
  assert.equal(rows[0].reason, 'semantic-progress');
});

test('non-continuing Stop leaves its final reason after temporary turn deletion', (t) => {
  const root = project(t);
  const input = { hook_event_name: 'UserPromptSubmit', session_id: 's1', turn_id: 't1', prompt: 'Review only' };
  hook.userPrompt(root, input);
  const result = hook.stop(root, { ...input, hook_event_name: 'Stop', stop_hook_active: false });
  assert.deepEqual(result.output, {});
  assert.equal(fs.existsSync(hook.turnFile(root, input)), false);
  const rows = observed(root).filter((row) => row.event === 'Stop');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].decision, 'not-continued');
  assert.equal(rows[0].reason, 'authorization:missing');
  const status = work.status(root, { session: 's1', turn: 't1' });
  assert.equal(status.decisions.Stop.reason, 'authorization:missing');
});

test('push denial leaves one final permission result without raw command contents', (t) => {
  const root = project(t);
  const input = {
    hook_event_name: 'PreToolUse', session_id: 's1', turn_id: 't1', tool_name: 'Bash',
    tool_input: { command: 'git push --all origin' },
  };
  assert.equal(hook.preTool(root, input).hookSpecificOutput.permissionDecision, 'deny');
  const rows = observed(root).filter((row) => row.event === 'PreToolUse');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].decision, 'denied');
  assert.equal(rows[0].reason, 'push:inexact');
  assert.equal(JSON.stringify(rows[0]).includes(input.tool_input.command), false);
});

test('status does not attribute a different session decision to the requested session', (t) => {
  const root = project(t);
  hook.observe(root, { hook_event_name: 'Stop', session_id: 'foreign', turn_id: 'old' }, { decision: 'not-continued', reason: 'no-semantic-progress' });
  assert.equal(work.status(root, { session: 'current', turn: 'now' }).decisions.Stop, undefined);
});

test('leaf forbidden changes prevent the related continuation and are explained', (t) => {
  const root = project(t);
  const { input } = executingTurn(root);
  const state = hook.readTurn(root, input);
  state.baseline = { repo: true, head: null, files: {}, tree: {}, unknown: [] };
  hook.writeTurn(root, input, state);
  const beforeSnapshot = work.snapshot;
  work.snapshot = () => ({ repo: true, head: null, files: { 'private/data.txt': { digest: 'changed' } }, tree: {}, unknown: [] });
  t.after(() => { work.snapshot = beforeSnapshot; });
  const result = hook.stop(root, input);
  assert.deepEqual(result.output, {});
  assert.equal(observed(root).filter((row) => row.event === 'Stop').at(-1).reason, 'forbidden-change');
});
