'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const test = require('node:test');

const sourceRoot = path.resolve(__dirname, '..');
const dispatcher = path.join(sourceRoot, 'hooks', 'dispatcher.js');
const hook = require('../lib/hook.js');
const install = require('../lib/install.js');
const {
  CURSOR_EVENT_MAP, isCursorHostEvent, hostName, remapCursorWorkspacePath, normalizeCursorInput, encodeCursorOutput, identityDegradedOutput,
} = require('../hooks/dispatcher.js');

function disposable(t, label) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `cursor-host-${label}-`));
  t.after(() => { fs.rmSync(root, { recursive: true, force: true }); });
  return root;
}

function spawnDispatcher(payload, args = [], cwd = sourceRoot) {
  return spawnSync(process.execPath, [dispatcher, ...args], {
    cwd, input: JSON.stringify(payload), encoding: 'utf8', timeout: 15000,
  });
}

test('Cursor events map onto the four Codex lifecycle names', () => {
  assert.deepEqual(CURSOR_EVENT_MAP, {
    sessionStart: 'SessionStart',
    beforeSubmitPrompt: 'UserPromptSubmit',
    stop: 'Stop',
    beforeShellExecution: 'PreToolUse',
    preToolUse: 'PreToolUse',
  });
  assert.equal(isCursorHostEvent({ hook_event_name: 'sessionStart' }), true);
  assert.equal(isCursorHostEvent({ hook_event_name: 'SessionStart' }), false);
  assert.equal(hostName(['--host', 'cursor'], { hook_event_name: 'SessionStart' }), 'cursor');
  assert.equal(hostName([], { hook_event_name: 'beforeSubmitPrompt' }), 'cursor');
  assert.equal(hostName([], { hook_event_name: 'UserPromptSubmit' }), 'codex');
});

test('remapCursorWorkspacePath unwraps Cursor Windows WSL hybrid roots', () => {
  assert.equal(remapCursorWorkspacePath('/Ubuntu-24.04/home/synadmin/workspace/syn-hl013-obs'),
    '/home/synadmin/workspace/syn-hl013-obs');
  assert.equal(remapCursorWorkspacePath('\\\\wsl.localhost\\Ubuntu-24.04\\home\\synadmin\\workspace\\syn-hl013-obs'),
    '/home/synadmin/workspace/syn-hl013-obs');
  assert.equal(remapCursorWorkspacePath('/home/synadmin/workspace/syn-hl013-obs'),
    '/home/synadmin/workspace/syn-hl013-obs');
  assert.equal(normalizeCursorInput({
    hook_event_name: 'beforeSubmitPrompt',
    workspace_roots: ['/Ubuntu-24.04/home/synadmin/workspace/syn-hl013-obs'],
  }).cwd, '/home/synadmin/workspace/syn-hl013-obs');
});

test('normalizeCursorInput copies conversation/generation/workspace onto Codex wire fields', () => {
  const normalized = normalizeCursorInput({
    hook_event_name: 'beforeSubmitPrompt',
    conversation_id: 'conv-1',
    generation_id: 'gen-2',
    workspace_roots: ['/tmp/workspace'],
    prompt: 'continue leftover',
  });
  assert.equal(normalized.hook_event_name, 'UserPromptSubmit');
  assert.equal(normalized.session_id, 'conv-1');
  assert.equal(normalized.turn_id, 'gen-2');
  assert.equal(normalized.cwd, '/tmp/workspace');
  assert.equal(normalized.prompt, 'continue leftover');
  assert.equal(normalized.harness_lite_host, 'cursor');
  assert.equal(normalized.cursor_event, 'beforeSubmitPrompt');
});

test('beforeShellExecution and Cursor Shell preToolUse become PreToolUse Bash', () => {
  const shell = normalizeCursorInput({ hook_event_name: 'beforeShellExecution', command: 'git push origin HEAD:main', cwd: '/repo' });
  assert.equal(shell.hook_event_name, 'PreToolUse');
  assert.equal(shell.tool_name, 'Bash');
  assert.equal(shell.tool_input.command, 'git push origin HEAD:main');
  const preTool = normalizeCursorInput({ hook_event_name: 'preToolUse', tool_name: 'Shell', tool_input: { command: 'pwd' } });
  assert.equal(preTool.tool_name, 'Bash');
  assert.equal(preTool.tool_input.command, 'pwd');
  const read = normalizeCursorInput({ hook_event_name: 'preToolUse', tool_name: 'Read', tool_input: { path: 'a' } });
  assert.equal(read.tool_name, 'Read');
});

test('encodeCursorOutput uses Cursor fields and leaves Codex payloads untouched', () => {
  assert.deepEqual(encodeCursorOutput({
    hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: '投影' },
  }, { hook_event_name: 'SessionStart' }), { additional_context: '投影' });
  assert.deepEqual(encodeCursorOutput({
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: 'gate' },
  }, { hook_event_name: 'PreToolUse' }), { permission: 'deny', user_message: 'gate', agent_message: 'gate' });
  assert.deepEqual(encodeCursorOutput({
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'allow' },
  }, { hook_event_name: 'PreToolUse' }), { permission: 'allow' });
  assert.deepEqual(encodeCursorOutput({ decision: 'block', reason: hook.CONTINUATION_REASON }, { hook_event_name: 'Stop' }), {
    followup_message: hook.CONTINUATION_REASON,
  });
  assert.deepEqual(encodeCursorOutput({}, { hook_event_name: 'Stop' }), {});
  const codex = identityDegradedOutput({ hook_event_name: 'SessionStart' });
  assert.equal(codex.hookSpecificOutput.hookEventName, 'SessionStart');
  assert.match(codex.hookSpecificOutput.additionalContext, /UNKNOWN/);
});

test('Codex dispatcher stdout stays hookSpecificOutput when identity is UNKNOWN', () => {
  const run = spawnDispatcher({ hook_event_name: 'SessionStart', cwd: sourceRoot, session_id: 'codex-wire' });
  assert.equal(run.status, 0, run.stderr);
  const output = JSON.parse(run.stdout);
  assert.equal(output.hookSpecificOutput.hookEventName, 'SessionStart');
  assert.match(output.hookSpecificOutput.additionalContext, /UNKNOWN/);
  assert.equal(output.additional_context, undefined);
});

test('Cursor dispatcher strips a UTF-8 BOM before parsing stdin', () => {
  const payload = {
    hook_event_name: 'beforeSubmitPrompt', conversation_id: 'bom-1', generation_id: 'g1',
    workspace_roots: [sourceRoot], prompt: 'hi',
  };
  const run = spawnSync(process.execPath, [dispatcher, '--host', 'cursor'], {
    cwd: sourceRoot, input: `\uFEFF${JSON.stringify(payload)}`, encoding: 'utf8', timeout: 15000,
  });
  assert.equal(run.status, 0, run.stderr);
  assert.match(JSON.parse(run.stdout).additional_context, /UNKNOWN/);
});

test('Cursor dispatcher stdout uses additional_context and permission, not hookSpecificOutput', () => {
  const start = spawnDispatcher({
    hook_event_name: 'sessionStart', conversation_id: 'c1', workspace_roots: [sourceRoot],
  }, ['--host', 'cursor']);
  assert.equal(start.status, 0, start.stderr);
  const startOut = JSON.parse(start.stdout);
  assert.equal(startOut.hookSpecificOutput, undefined);
  assert.match(startOut.additional_context, /UNKNOWN/);

  const inferred = spawnDispatcher({
    hook_event_name: 'beforeSubmitPrompt', conversation_id: 'c1', generation_id: 'g1',
    workspace_roots: [sourceRoot], prompt: 'hi',
  });
  assert.equal(inferred.status, 0, inferred.stderr);
  assert.match(JSON.parse(inferred.stdout).additional_context, /UNKNOWN/);

  const deny = spawnDispatcher({
    hook_event_name: 'beforeShellExecution', command: 'git push origin HEAD:main', cwd: sourceRoot,
    conversation_id: 'c1',
  }, ['--host', 'cursor']);
  assert.equal(deny.status, 0, deny.stderr);
  const denied = JSON.parse(deny.stdout);
  assert.equal(denied.permission, 'deny');
  assert.match(denied.user_message, /push gate/);
  assert.equal(denied.hookSpecificOutput, undefined);
});

test('observe records cursor-host-hook only when the normalized host flag is set', (t) => {
  const root = disposable(t, 'observe');
  hook.observe(root, { hook_event_name: 'SessionStart', session_id: 's1', harness_lite_host: 'cursor' });
  const observed = JSON.parse(fs.readFileSync(path.join(root, 'docs', 'harness', 'usage', '.observed.json'), 'utf8'));
  assert.equal(observed.source, 'cursor-host-hook');
  assert.equal(observed.events.SessionStart.event, 'SessionStart');
  hook.observe(root, { hook_event_name: 'UserPromptSubmit', session_id: 's1', turn_id: 't1' });
  const after = JSON.parse(fs.readFileSync(path.join(root, 'docs', 'harness', 'usage', '.observed.json'), 'utf8'));
  assert.equal(after.source, 'codex-host-hook');
});

test('project install leaves Cursor configuration untouched (Cursor hooks are not installed by default)', { timeout: 30000 }, (t) => {
  // 2026-10-22 user decision: the Cursor adapter is unverified on a real Cursor host, so 0.14 does not install it.
  const root = disposable(t, 'install');
  fs.mkdirSync(path.join(root, '.cursor'), { recursive: true });
  const file = path.join(root, '.cursor', 'hooks.json');
  const original = `${JSON.stringify({ version: 1, hooks: { afterFileEdit: [{ command: 'echo format' }] } }, null, 2)}\n`;
  fs.writeFileSync(file, original);
  const digest = install.definition(root).digest;
  const result = install.install(root, { write: true, source: sourceRoot });
  assert.equal(result.status, 'INSTALLED', result.reason);
  assert.equal(result.manifest.hookDefinitionDigest, digest);
  assert.equal(result.manifest.cursorHookPreimage, null);
  assert.equal(install.configured(root), true);
  assert.equal(install.cursorConfigured(root), false);
  assert.equal(fs.readFileSync(file, 'utf8'), original);
  const removed = install.uninstall(root, { write: true });
  assert.equal(removed.status, 'UNINSTALLED', removed.reason);
  assert.equal(fs.readFileSync(file, 'utf8'), original);
});

test('managed profile does not write project Cursor hooks', { timeout: 30000 }, (t) => {
  const root = disposable(t, 'managed');
  const system = path.join(root, 'system'), project = path.join(root, 'project');
  fs.mkdirSync(system); fs.mkdirSync(project);
  const git = (args) => spawnSync('/usr/bin/git', args, { cwd: project, encoding: 'utf8', env: { HOME: process.env.HOME, PATH: '/usr/bin:/bin' } });
  assert.equal(git(['init', '-q']).status, 0);
  fs.writeFileSync(path.join(project, 'README.md'), '# cursor-host\n');
  assert.equal(git(['add', 'README.md']).status, 0);
  assert.equal(git(['commit', '-q', '-m', 'Initialize disposable fixture', '-m', 'Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>']).status, 0);
  const managed = require('../lib/managed.js');
  assert.equal(managed.installGlobal(system, { write: true, source: sourceRoot }).status, 'INSTALLED');
  const result = install.install(project, { write: true, source: sourceRoot, profile: 'managed', globalRoot: system });
  assert.equal(result.status, 'INSTALLED', result.reason);
  assert.equal(fs.existsSync(path.join(project, '.cursor', 'hooks.json')), false);
  assert.equal(install.cursorConfigured(project), false);
});
