'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const test = require('node:test');
const hook = require('../lib/hook.js');
const install = require('../lib/install.js');
const authorization = require('../lib/authorization.js');
const io = require('../lib/io.js');
const delegation = require('../lib/delegation.js');
const tree = require('../lib/tree.js');

function project(t, current = true) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hl14-intent-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  assert.equal(install.install(root, { write: true }).status, 'INSTALLED');
  fs.writeFileSync(path.join(root, 'docs/harness/plan.md'), '# Plan\n目标：usable result\n');
  fs.writeFileSync(path.join(root, 'docs/harness/stages/stage-one.md'), '# Stage\n目标：usable result\n');
  fs.writeFileSync(path.join(root, `docs/harness/${current ? 'leaves' : 'unfinished'}/L1.md`), [
    '# Leaf', '阶段：stage-one', '目标：usable result', '完成标准：', '- result exists', '- result is usable', '',
    '允许动：', '- src', '', '不许动：', '- private', '',
    '## Work Unit A', '目标：usable result', '完成标准：', '- result exists', '- result is usable', '',
    '允许动：', '- src', '', '依赖：无', '路线依据：direct evidence', '',
  ].join('\n'));
  return root;
}

function event(root, input) {
  const run = spawnSync(process.execPath, [path.join(root, install.RUNTIME, 'hooks/dispatcher.js')], {
    cwd: root, input: JSON.stringify(input), encoding: 'utf8', timeout: 30000,
  });
  assert.equal(run.status, 0, run.stderr);
  return run.stdout.trim() ? JSON.parse(run.stdout) : {};
}

function submit(root, prompt = 'Implement and validate a usable result', turn = 'turn') {
  const input = { hook_event_name: 'UserPromptSubmit', session_id: 'session', turn_id: turn, prompt };
  const output = event(root, input), state = hook.readTurn(root, input);
  return { input, output, receipt: state.receipt.receiptId };
}

function register(root, source, claim) {
  const request = { sourceReceipt: source.receipt, ...claim }, command = hook.intentCommand(request);
  const output = event(root, {
    hook_event_name: 'PreToolUse', session_id: source.input.session_id, turn_id: source.input.turn_id,
    tool_name: 'Bash', tool_input: { command },
  });
  return { request, command, output };
}

test('a real event and model intent reach the issuer without hand-written lease bindings', (t) => {
  const root = project(t), source = submit(root);
  assert.match(source.output.hookSpecificOutput.additionalContext, /--work-intent/);
  assert.ok(source.output.hookSpecificOutput.additionalContext.includes(
    `WorkIntent：要开工时单独运行 ${hook.intentCommand({ sourceReceipt: source.receipt, action: 'execute' })}；其他动作见 .claude/harness-lite/hooks/README.md`));
  assert.ok(source.output.hookSpecificOutput.additionalContext.length <= 1800);
  assert.match(fs.readFileSync(path.join(root, install.RUNTIME, 'hooks/README.md'), 'utf8'),
    /## 0\.14 内部工作意图/);
  assert.equal(authorization.read(root).kind, 'closed');
  const result = register(root, source, { action: 'execute' });
  assert.equal(result.output.hookSpecificOutput.permissionDecision, 'allow');
  const state = hook.readTurn(root, source.input), lease = authorization.read(root).value;
  assert.equal(lease.executionReceipt, source.receipt);
  assert.equal(lease.leaf, 'docs/harness/leaves/L1.md');
  assert.equal(lease.stage, 'stage-one');
  assert.equal(Date.parse(lease.expiresAt), Date.parse(state.startedAt) + authorization.MAX_LEASE_MS);
  const helper = spawnSync(process.execPath, [
    path.join(root, install.RUNTIME, 'hooks/dispatcher.js'), '--work-intent', JSON.stringify(result.request),
  ], { cwd: root, encoding: 'utf8' });
  assert.equal(helper.status, 0, helper.stderr);
  assert.equal(JSON.parse(helper.stdout).ok, true);
  const original = fs.readFileSync(path.join(root, authorization.RELATIVE_PATH));
  register(root, source, { action: 'execute' });
  assert.deepEqual(fs.readFileSync(path.join(root, authorization.RELATIVE_PATH)), original);
});

test('planning review and revoke are explicit non-execution, never prompt keywords', (t) => {
  const root = project(t);
  const source = submit(root, 'Review whether the word fix describes the problem');
  register(root, source, { action: 'non-execution' });
  assert.equal(authorization.read(root).kind, 'closed');
  assert.equal(event(root, { ...source.input, hook_event_name: 'Stop', stop_hook_active: false }).decision, undefined);
  const executing = submit(root, 'Implement the approved result', 'execute-turn');
  register(root, executing, { action: 'execute' });
  assert.equal(authorization.read(root).kind, 'active');
  register(root, executing, { action: 'revoke' });
  assert.equal(authorization.read(root).kind, 'closed');
  assert.equal(register(root, executing, { action: 'execute' }).output.hookSpecificOutput.permissionDecision, 'deny');
  assert.equal(authorization.validateStop(root, { ...executing.input, stop_hook_active: false },
    hook.readTurn(root, executing.input)).ok, false);
});

test('a standalone helper cannot invent registration outside a real host tool event', (t) => {
  const root = project(t), source = submit(root), before = fs.readFileSync(path.join(root, authorization.RELATIVE_PATH));
  const run = spawnSync(process.execPath, [
    path.join(root, install.RUNTIME, 'hooks/dispatcher.js'), '--work-intent',
    JSON.stringify({ sourceReceipt: source.receipt, action: 'execute' }),
  ], { cwd: root, encoding: 'utf8' });
  assert.equal(run.status, 1);
  assert.equal(JSON.parse(run.stdout).ok, false);
  assert.deepEqual(fs.readFileSync(path.join(root, authorization.RELATIVE_PATH)), before);
});

test('replayed user events preserve the original lease window and revoked decision', (t) => {
  const root = project(t), source = submit(root);
  register(root, source, { action: 'execute' });
  const state = hook.readTurn(root, source.input);
  const lease = fs.readFileSync(path.join(root, authorization.RELATIVE_PATH));
  event(root, source.input);
  assert.equal(hook.readTurn(root, source.input).startedAt, state.startedAt);
  assert.deepEqual(fs.readFileSync(path.join(root, authorization.RELATIVE_PATH)), lease);
  register(root, source, { action: 'revoke' });
  event(root, source.input);
  assert.equal(register(root, source, { action: 'execute' }).output.hookSpecificOutput.permissionDecision, 'deny');
});

test('foreign turns agents injected bindings and changed current leaf cannot register authority', (t) => {
  const root = project(t), source = submit(root), before = fs.readFileSync(path.join(root, authorization.RELATIVE_PATH));
  for (const [metadata, extra] of [
    [{ turn_id: 'foreign' }, {}], [{ agent_id: 'worker' }, {}], [{ agent_type: 'worker' }, {}],
    [{}, { expiresAt: '2099-01-01T00:00:00.000Z' }], [{}, { session: 'session', authorized: true }],
  ]) {
    const output = event(root, {
      hook_event_name: 'PreToolUse', session_id: 'session', turn_id: 'turn', tool_name: 'Bash', ...metadata,
      tool_input: { command: hook.intentCommand({ sourceReceipt: source.receipt, action: 'execute', ...extra }) },
    });
    assert.equal(output.hookSpecificOutput.permissionDecision, 'deny');
    assert.deepEqual(fs.readFileSync(path.join(root, authorization.RELATIVE_PATH)), before);
  }
  fs.renameSync(path.join(root, 'docs/harness/leaves/L1.md'), path.join(root, 'docs/harness/leaves/L2.md'));
  assert.equal(register(root, source, { action: 'execute' }).output.hookSpecificOutput.permissionDecision, 'deny');
  assert.deepEqual(fs.readFileSync(path.join(root, authorization.RELATIVE_PATH)), before);
});

test('internal continuation cannot mint or renew execution authority', (t) => {
  const root = project(t), source = submit(root);
  event(root, { ...source.input, prompt: hook.CONTINUATION_REASON });
  assert.equal(register(root, source, { action: 'execute' }).output.hookSpecificOutput.permissionDecision, 'deny');
  const fresh = submit(root, 'Continue the approved result', 'fresh-turn');
  register(root, fresh, { action: 'execute' });
  const before = fs.readFileSync(path.join(root, authorization.RELATIVE_PATH));
  event(root, { ...fresh.input, prompt: hook.CONTINUATION_REASON });
  register(root, fresh, { action: 'execute' });
  assert.deepEqual(fs.readFileSync(path.join(root, authorization.RELATIVE_PATH)), before);
  const state = hook.readTurn(root, fresh.input);
  state.startedAt = new Date(Date.now() - authorization.MAX_LEASE_MS - 1000).toISOString();
  hook.writeTurn(root, fresh.input, state);
  assert.equal(register(root, fresh, { action: 'execute' }).output.hookSpecificOutput.permissionDecision, 'deny');
  assert.deepEqual(fs.readFileSync(path.join(root, authorization.RELATIVE_PATH)), before);
});

test('resume works without current and can execute in the same real user turn', (t) => {
  const root = project(t, false), source = submit(root, 'Resume L1 and deliver the result');
  assert.equal(register(root, source, { action: 'resume', leaf: 'L1.md' }).output.hookSpecificOutput.permissionDecision, 'allow');
  assert.equal(tree.readChain(root).leaf.name, 'L1');
  assert.equal(authorization.read(root).kind, 'closed');
  assert.equal(register(root, source, { action: 'execute' }).output.hookSpecificOutput.permissionDecision, 'allow');
  assert.equal(authorization.read(root).kind, 'active');
  assert.equal(register(root, source, { action: 'pause', reason: 'Waiting for a required choice', resume: 'Continue after the choice' })
    .output.hookSpecificOutput.permissionDecision, 'allow');
  assert.equal(tree.readChain(root).leaf, null);
  assert.equal(authorization.read(root).kind, 'closed');
  assert.match(fs.readFileSync(path.join(root, 'docs/harness/unfinished/L1.md'), 'utf8'), /等待：Waiting/);
});

test('exit needs current standard coverage and present direct evidence, not a complete label', (t) => {
  const root = project(t), source = submit(root);
  register(root, source, { action: 'execute' });
  fs.writeFileSync(path.join(root, 'docs/harness/reports/result.md'), 'The result exists and its direct usage was checked.\n');
  for (const evidence of [
    [], [{ standard: 'result exists', evidenceRef: 'docs/harness/reports/result.md' }],
    [{ standard: 'result exists', evidenceRef: 'CLOSED' }, { standard: 'result is usable', evidenceRef: 'complete' }],
  ]) {
    assert.equal(register(root, source, { action: 'exit', evidence }).output.hookSpecificOutput.permissionDecision, 'deny');
    assert.equal(tree.readChain(root).leaf.name, 'L1');
  }
  const result = register(root, source, { action: 'exit', evidence: [
    { standard: 'result exists', evidenceRef: 'docs/harness/reports/result.md' },
    { standard: 'result is usable', evidenceRef: 'docs/harness/reports/result.md' },
  ] });
  assert.equal(result.output.hookSpecificOutput.permissionDecision, 'allow');
  assert.equal(tree.readChain(root).leaf, null);
  assert.equal(tree.done(root).some((leaf) => leaf.name === 'L1'), true);
  assert.equal(authorization.read(root).kind, 'closed');
  const state = hook.readTurn(root, source.input);
  assert.equal(state.intent.evidence.length, 2);
  assert.match(state.intent.evidence[0].digest, /^sha256:/);
});

test('ignored agent events do not erase the supervising user source', (t) => {
  const root = project(t), source = submit(root);
  const before = fs.readFileSync(hook.turnFile(root, source.input));
  event(root, { ...source.input, agent_id: 'worker', prompt: 'Internal worker report' });
  assert.deepEqual(fs.readFileSync(hook.turnFile(root, source.input)), before);
  assert.equal(register(root, source, { action: 'execute' }).output.hookSpecificOutput.permissionDecision, 'allow');
});

test('ambiguous leaves absent targets and read-only flag mentions cause no invented lifecycle', (t) => {
  const root = project(t, false), source = submit(root);
  assert.equal(register(root, source, { action: 'pause', reason: 'wait', resume: 'later' })
    .output.hookSpecificOutput.permissionDecision, 'deny');
  assert.equal(register(root, source, { action: 'resume', leaf: 'L' })
    .output.hookSpecificOutput.permissionDecision, 'deny');
  assert.equal(event(root, { ...source.input, hook_event_name: 'PreToolUse', tool_name: 'Bash',
    tool_input: { command: "grep -- '--work-intent' README.md" } }).hookSpecificOutput, undefined);
  assert.equal(tree.readChain(root).leaf, null);
  register(root, source, { action: 'resume', leaf: 'L1.md' });
  fs.copyFileSync(path.join(root, 'docs/harness/leaves/L1.md'), path.join(root, 'docs/harness/leaves/L2.md'));
  const before = fs.readFileSync(path.join(root, authorization.RELATIVE_PATH));
  assert.equal(register(root, source, { action: 'execute' }).output.hookSpecificOutput.permissionDecision, 'deny');
  assert.deepEqual(fs.readFileSync(path.join(root, authorization.RELATIVE_PATH)), before);
  assert.equal(tree.readChain(root).health.currentCount, 2);
});

test('hand-written active authorization without model intent is not execution authority', (t) => {
  const root = project(t), source = submit(root), state = hook.readTurn(root, source.input);
  io.atomic(path.join(root, authorization.RELATIVE_PATH), JSON.stringify({
    schemaVersion: 1, authorized: true, leaf: 'docs/harness/leaves/L1.md', stage: 'stage-one',
    executionReceipt: source.receipt, expiresAt: new Date(Date.parse(state.startedAt) + 60000).toISOString(),
  }), 0o600);
  assert.equal(authorization.validateStop(root, { ...source.input, stop_hook_active: false }, state).reason, 'authorization:intent');
});

test('real registration and semantic progress produce one fallback continuation', (t) => {
  const root = project(t), source = submit(root);
  register(root, source, { action: 'execute' });
  delegation.recordEvent(root, { id: 'active', workUnit: 'A', status: 'active' });
  delegation.recordEvent(root, { id: 'fact', workUnit: 'A', kind: 'progress', progressKind: 'verified-fact',
    evidenceRef: 'docs/harness/reports/fact.md' });
  const lease = fs.readFileSync(path.join(root, authorization.RELATIVE_PATH));
  const input = { ...source.input, hook_event_name: 'Stop', stop_hook_active: false };
  assert.equal(event(root, input).decision, 'block');
  assert.deepEqual(fs.readFileSync(path.join(root, authorization.RELATIVE_PATH)), lease);
  assert.equal(event(root, input).decision, undefined);
  assert.equal(authorization.read(root).kind, 'closed');
});

test('pending push only stops the turn explicitly waiting for that exact current target', (t) => {
  const root = project(t), source = submit(root);
  const git = (args) => {
    const result = spawnSync('/usr/bin/git', args, { cwd: root, encoding: 'utf8', env: {
      HOME: process.env.HOME, PATH: '/usr/bin:/bin', LANG: 'C', LC_ALL: 'C',
    } });
    assert.equal(result.status, 0, result.stderr);
    return result;
  };
  git(['init', '-q']);
  fs.writeFileSync(path.join(root, 'README.md'), 'Disposable push target fixture\n');
  git(['add', 'README.md']); git(['diff', '--cached']); git(['status', '--short']);
  git(['commit', '-q', '-m', 'Initialize disposable fixture', '-m',
    'Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>']);
  git(['remote', 'add', 'origin', path.join(root, 'disposable-never-pushed.git')]);
  const denial = event(root, { ...source.input, hook_event_name: 'PreToolUse', tool_name: 'Bash',
    tool_input: { command: 'git push origin HEAD:refs/heads/main' } });
  assert.equal(denial.hookSpecificOutput.permissionDecision, 'deny');
  const pending = hook.readPush(root).pending;
  assert.equal(register(root, source, { action: 'execute', waitingForPush: pending.pendingId })
    .output.hookSpecificOutput.permissionDecision, 'allow');
  delegation.recordEvent(root, { id: 'active', workUnit: 'A', status: 'active' });
  delegation.recordEvent(root, { id: 'fact', workUnit: 'A', kind: 'progress', progressKind: 'verified-fact',
    evidenceRef: 'docs/harness/reports/fact.md' });
  const input = { ...source.input, hook_event_name: 'Stop', stop_hook_active: false };
  assert.equal(hook.stop(root, input, { write: false }).output.decision, undefined);
  assert.equal(authorization.read(root).kind, 'active');
  git(['remote', 'set-url', 'origin', path.join(root, 'different-never-pushed.git')]);
  assert.equal(hook.stop(root, input, { write: false }).output.decision, 'block');
  assert.equal(hook.readPush(root).pending.pendingId, pending.pendingId);
  register(root, source, { action: 'execute' });
  assert.equal(hook.stop(root, input, { write: false }).output.decision, 'block');
});

test('Cursor event adaptation reaches the same real execution and fallback path', (t) => {
  const root = project(t);
  const input = { hook_event_name: 'beforeSubmitPrompt', conversation_id: 'cursor-session',
    generation_id: 'cursor-turn', workspace_roots: [root], prompt: 'Deliver the approved result' };
  event(root, input);
  const state = hook.readTurn(root, { session_id: 'cursor-session', turn_id: 'cursor-turn' });
  const claim = { sourceReceipt: state.receipt.receiptId, action: 'execute' };
  assert.equal(event(root, { ...input, hook_event_name: 'beforeShellExecution', command: hook.intentCommand(claim) }).permission, 'allow');
  delegation.recordEvent(root, { id: 'active', workUnit: 'A', status: 'active' });
  delegation.recordEvent(root, { id: 'fact', workUnit: 'A', kind: 'progress', progressKind: 'verified-fact',
    evidenceRef: 'docs/harness/reports/fact.md' });
  const stop = { ...input, hook_event_name: 'stop', status: 'completed', loop_count: 0 };
  assert.equal(event(root, stop).followup_message, hook.CONTINUATION_REASON);
  assert.equal(event(root, { ...stop, status: 'aborted' }).followup_message, undefined);
  const final = io.json(path.join(root, 'docs/harness/usage/.observed.json')).events.Stop;
  assert.equal(final.reason, 'host:aborted');
  assert.equal(authorization.read(root).kind, 'closed');
});

test('intent entry never allows shell expansion ahead of the push gate', (t) => {
  const root = project(t), source = submit(root);
  const claim = { sourceReceipt: source.receipt, action: 'execute' };
  const malicious = [
    `"$(git push origin HEAD:main)/node" ".claude/harness-lite/hooks/dispatcher.js" --work-intent '${JSON.stringify(claim)}'`,
    `node ".claude/harness-lite/hooks/dispatcher.js" --work-intent "${JSON.stringify({
      sourceReceipt: source.receipt, action: 'pause', reason: '$(git push origin HEAD:main)', resume: 'later',
    }).replaceAll('"', '\\"')}"`,
  ];
  const before = fs.readFileSync(path.join(root, authorization.RELATIVE_PATH));
  for (const command of malicious) {
    // Only submit strings to the dispatcher. Never execute the shell payload.
    const output = event(root, { ...source.input, hook_event_name: 'PreToolUse',
      tool_name: 'Bash', tool_input: { command } });
    assert.equal(output.hookSpecificOutput.permissionDecision, 'deny');
    assert.deepEqual(fs.readFileSync(path.join(root, authorization.RELATIVE_PATH)), before);
    assert.ok(tree.readChain(root).leaf);
  }
});

test('final Stop leaves replay protection in the existing observation journal', (t) => {
  const root = project(t), source = submit(root);
  register(root, source, { action: 'execute' });
  register(root, source, { action: 'revoke' });
  event(root, { ...source.input, hook_event_name: 'Stop', stop_hook_active: false });
  assert.equal(fs.existsSync(hook.turnFile(root, source.input)), false);
  const before = fs.readFileSync(path.join(root, authorization.RELATIVE_PATH));
  // Another session's Stop must not erase the protection for this source.
  const other = submit(root, 'Review the result only', 'other-turn');
  event(root, { ...other.input, hook_event_name: 'Stop', stop_hook_active: false });
  event(root, source.input);
  assert.equal(register(root, source, { action: 'execute' }).output.hookSpecificOutput.permissionDecision, 'deny');
  assert.deepEqual(fs.readFileSync(path.join(root, authorization.RELATIVE_PATH)), before);
  assert.equal(fs.existsSync(hook.turnFile(root, source.input)), false);
  assert.equal(register(root, submit(root, 'Implement the next approved result', 'fresh-after-stop'),
    { action: 'execute' }).output.hookSpecificOutput.permissionDecision, 'allow');
});

test('an unrelated review-only session cannot close the executing session lease', (t) => {
  const root = project(t), source = submit(root);
  register(root, source, { action: 'execute' });
  const before = fs.readFileSync(path.join(root, authorization.RELATIVE_PATH));
  const input = { ...source.input, session_id: 'other-session', turn_id: 'review', prompt: 'Review only' };
  event(root, input);
  const other = { input, receipt: hook.readTurn(root, input).receipt.receiptId };
  assert.equal(register(root, other, { action: 'non-execution' }).output.hookSpecificOutput.permissionDecision, 'allow');
  assert.deepEqual(fs.readFileSync(path.join(root, authorization.RELATIVE_PATH)), before);
  assert.equal(authorization.validateStop(root, { ...source.input, stop_hook_active: false },
    hook.readTurn(root, source.input)).ok, true);
});

test('reading the actual dispatcher flag is ordinary inspection, not registration', (t) => {
  const root = project(t), source = submit(root);
  const before = fs.readFileSync(path.join(root, authorization.RELATIVE_PATH));
  for (const command of [
    "grep -- '--work-intent' .claude/harness-lite/hooks/dispatcher.js",
    'cat .claude/harness-lite/hooks/dispatcher.js # --work-intent',
    `printf '%s\\n' 'node .claude/harness-lite/hooks/dispatcher.js --work-intent'`,
  ]) {
    assert.equal(event(root, { ...source.input, hook_event_name: 'PreToolUse', tool_name: 'Bash',
      tool_input: { command } }).hookSpecificOutput, undefined);
  }
  assert.deepEqual(fs.readFileSync(path.join(root, authorization.RELATIVE_PATH)), before);
});

test('literal quoted punctuation remains usable in pause intent fields', (t) => {
  const root = project(t), source = submit(root);
  const reason = "User's literal $HOME, `words`, and $(not a command)";
  assert.equal(register(root, source, { action: 'pause', reason, resume: "Continue after user's choice" })
    .output.hookSpecificOutput.permissionDecision, 'allow');
  assert.ok(fs.readFileSync(path.join(root, 'docs/harness/unfinished/L1.md'), 'utf8').includes(reason));
});
