'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const test = require('node:test');
const install = require('../lib/install.js');
const work = require('../lib/work.js');
const { remapCursorWorkspacePath } = require('../hooks/dispatcher.js');
const { testCount } = require('../scripts/timed-test.js');

// Findings from the 2026-10-22 independent Grok 4.7 review (W6), each reproduced here first.

function fresh(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hl14-review-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  assert.equal(install.install(root, { write: true }).status, 'INSTALLED');
  return root;
}

test('Cursor WSL path unwrapping only applies at the start of the path', () => {
  assert.equal(remapCursorWorkspacePath('/Ubuntu-24.04/home/alice/repo'), '/home/alice/repo');
  assert.equal(remapCursorWorkspacePath('\\\\wsl.localhost\\Ubuntu-24.04\\home\\alice\\repo'), '/home/alice/repo');
  assert.equal(remapCursorWorkspacePath('/opt/Ubuntu/home/alice/real-project'), '/opt/Ubuntu/home/alice/real-project');
  assert.equal(remapCursorWorkspacePath('/home/alice/Ubuntu-notes/home/x'), '/home/alice/Ubuntu-notes/home/x');
});

test('Harness-owned file entries match the exact file, not every path that starts with it', () => {
  assert.equal(work.own('.cursor/hooks.json'), true);
  assert.equal(work.own('.codex/hooks.json'), true);
  assert.equal(work.own('docs/harness/plan.md'), true);
  assert.equal(work.own('.cursor/hooks.json.bak'), false);
  assert.equal(work.own('.codex/hooks.json/payload'), false);
});

test('a recorded failure is never shown as not run, whatever its other fields say', (t) => {
  const root = fresh(t), file = path.join(root, 'docs/harness/verify.jsonl');
  const at = new Date().toISOString();
  fs.writeFileSync(file, `${JSON.stringify({ at, ran: true, ok: false, status: 'failed', summary: 't:fail', ids: [], results: [{ id: 't', ok: false }] })}\n`);
  assert.equal(work.latestVerify(root).ok, false);
  fs.writeFileSync(file, `${JSON.stringify({ at, ok: true, summary: 'no checks' })}\n`);
  assert.equal(work.latestVerify(root).status, 'not-run');
  fs.writeFileSync(file, `${JSON.stringify({ at, ran: false, ok: null, status: 'not-run', summary: '未执行检查', ids: [], results: [] })}\n`);
  assert.equal(work.latestVerify(root).status, 'not-run');
});

test('status cannot be given forged lines through a stored decision reason', (t) => {
  const root = fresh(t);
  fs.writeFileSync(path.join(root, 'docs/harness/usage/.observed.json'), JSON.stringify({ events: {
    Stop: { at: new Date().toISOString(), event: 'Stop', session: 's', turn: 't', decision: 'not-continued', reason: 'blocked\nForged：yes\u2028Also：yes' },
  } }));
  const text = work.status(root).text;
  assert.match(text, /Stop：not-continued；reason=blocked Forged：yes Also：yes/);
  assert.doesNotMatch(text, /\nForged：yes|\u2028/);
});

test('a finalized prompt without a turn id cannot be replayed into a new source', (t) => {
  const { spawnSync } = require('child_process');
  const root = fresh(t);
  fs.writeFileSync(path.join(root, 'docs/harness/stages/stage-one.md'), '# S\n目标：g\n');
  fs.writeFileSync(path.join(root, 'docs/harness/leaves/L1.md'), '# L\n阶段：stage-one\n目标：g\n完成标准：\n- done\n');
  const event = (input) => {
    const run = spawnSync(process.execPath, [path.join(root, install.RUNTIME, 'hooks/dispatcher.js')], { cwd: root, input: JSON.stringify(input), encoding: 'utf8' });
    assert.equal(run.status, 0, run.stderr);
    return run.stdout.trim() ? JSON.parse(run.stdout) : {};
  };
  const prompt = { hook_event_name: 'UserPromptSubmit', session_id: 's', prompt: 'do it' };
  assert.match(event(prompt).hookSpecificOutput.additionalContext, /WorkIntent：/);
  event({ hook_event_name: 'Stop', session_id: 's', stop_hook_active: false });
  assert.equal(event(prompt).hookSpecificOutput?.additionalContext || '', '');
});

test('a hook launcher counts as the official one only in the exact form the shell will run', (t) => {
  const root = fresh(t), file = path.join(root, '.codex/hooks.json'), original = fs.readFileSync(file, 'utf8');
  assert.equal(install.configured(root), true);
  const rewrite = (change) => {
    const data = JSON.parse(original);
    for (const handler of Object.values(data.hooks).flat().flatMap((group) => group.hooks)) handler.command = change(handler.command);
    fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
  };
  const prefix = JSON.stringify(process.execPath);
  rewrite((command) => command.replace(prefix, prefix.replaceAll('/', '\\/')));
  assert.equal(install.configured(root), false, 'JSON-escaped slashes decode to node but bash runs a different path');
  const odd = path.join(root, '$(true)');
  fs.mkdirSync(odd); fs.symlinkSync(process.execPath, path.join(odd, 'node'));
  rewrite((command) => command.replace(prefix, JSON.stringify(path.join(odd, 'node'))));
  assert.equal(install.configured(root), false, 'a launcher path the shell would expand is not the official launcher');
  // A lone surrogate survives JSON round-trips only as a \uXXXX escape, which the shell keeps literally.
  const surrogate = path.join(root, 'a\ud800');
  fs.mkdirSync(surrogate); fs.symlinkSync(process.execPath, path.join(surrogate, 'node'));
  rewrite((command) => command.replace(prefix, JSON.stringify(path.join(surrogate, 'node'))));
  assert.equal(install.configured(root), false, 'a JSON escape in the launcher prefix is not what the shell runs');
  fs.writeFileSync(file, original);
  assert.equal(install.configured(root), true);
});

test('install and uninstall leave no .cursor residue and keep a pre-existing .cursor directory', (t) => {
  // An earlier candidate wrote Cursor hooks on every install and left an empty .cursor/ behind (0.13 left none).
  for (const existed of [false, true]) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hl14-cursor-dir-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    if (existed) fs.mkdirSync(path.join(root, '.cursor'));
    assert.equal(install.install(root, { write: true }).status, 'INSTALLED');
    assert.equal(fs.existsSync(path.join(root, '.cursor/hooks.json')), false);
    assert.equal(install.uninstall(root, { write: true }).status, 'UNINSTALLED');
    assert.equal(fs.existsSync(path.join(root, '.cursor')), existed, `pre-existing .cursor=${existed}`);
  }
});

test('an exit whose evidence points at the project root is refused promptly instead of hanging', (t) => {
  const { spawnSync } = require('child_process');
  const hook = require('../lib/hook.js');
  const root = fresh(t);
  fs.writeFileSync(path.join(root, 'docs/harness/stages/stage-one.md'), '# S\n目标：g\n');
  fs.writeFileSync(path.join(root, 'docs/harness/leaves/L1.md'), '# L\n阶段：stage-one\n目标：g\n完成标准：\n- done\n');
  const event = (input) => spawnSync(process.execPath, [path.join(root, install.RUNTIME, 'hooks/dispatcher.js')],
    { cwd: root, input: JSON.stringify(input), encoding: 'utf8', timeout: 8000 });
  const prompt = { hook_event_name: 'UserPromptSubmit', session_id: 's', turn_id: 't', prompt: 'finish it' };
  event(prompt);
  const receipt = hook.readTurn(root, prompt).receipt.receiptId;
  const command = hook.intentCommand({ sourceReceipt: receipt, action: 'exit', evidence: [{ standard: 'done', evidenceRef: '.' }] });
  const run = event({ hook_event_name: 'PreToolUse', session_id: 's', turn_id: 't', tool_name: 'Bash', tool_input: { command } });
  assert.equal(run.status, 0, `hook did not return (signal=${run.signal})`);
  const output = JSON.parse(run.stdout);
  assert.equal(output.hookSpecificOutput.permissionDecision, 'deny');
  assert.match(output.hookSpecificOutput.permissionDecisionReason, /intent:evidence/);
});

test('the current gate recognizes zero executed tests in both TAP and spec reporter output', () => {
  assert.equal(testCount('# tests 3\n'), 3);
  assert.equal(testCount('ℹ tests 237\nℹ pass 237\n'), 237);
  assert.equal(testCount('ℹ tests 0\n'), 0);
});
