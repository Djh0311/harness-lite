'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const test = require('node:test');
const install = require('../lib/install.js');
const hook = require('../lib/hook.js');
const authorization = require('../lib/authorization.js');

// 2026-10-22 user decision: Claude Code must be installed and usable. Claude Code reads project hooks
// from .claude/settings.json and sends prompt_id (no turn_id) on UserPromptSubmit/PreToolUse/Stop,
// as captured from a real `claude -p` run (Claude Code 2.1.306).

function project(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hl14-claude-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  assert.equal(spawnSync('/usr/bin/git', ['init', '-q'], { cwd: root }).status, 0);
  return root;
}
const settings = (root) => path.join(root, '.claude', 'settings.json');

function roundTrip(t, original) {
  const root = project(t);
  if (original !== null) { fs.mkdirSync(path.join(root, '.claude')); fs.writeFileSync(settings(root), original); }
  const result = install.install(root, { write: true });
  assert.equal(result.status, 'INSTALLED', result.reason);
  assert.equal(install.claudeConfigured(root), true);
  const installed = JSON.parse(fs.readFileSync(settings(root), 'utf8'));
  for (const event of install.EVENTS) assert.ok(Array.isArray(installed.hooks[event]), event);
  assert.equal(install.uninstall(root, { write: true }).status, 'UNINSTALLED');
  if (original === null) assert.equal(fs.existsSync(settings(root)), false);
  else assert.equal(fs.readFileSync(settings(root), 'utf8'), original);
  return { root, installed };
}

test('install adds Claude hooks to a fresh project and uninstall removes the file it created', (t) => {
  const { root, installed } = roundTrip(t, null);
  assert.equal(installed.hooks.PreToolUse[0].matcher, 'Bash');
  assert.equal(JSON.stringify(installed).includes('additionalContextLimit'), false);
  assert.equal(fs.existsSync(path.join(root, '.claude')), false);
});

test('existing settings without hooks keep every other byte through install and uninstall', (t) => {
  roundTrip(t, '{\n    "permissions": {\n        "allow": ["Bash(npm test)"]\n    },\n    "env": { "FOO": "bar" }\n}\n');
  roundTrip(t, '{}\n');
  roundTrip(t, '{ \n }');
});

test('user hooks stay in place and an existing empty hooks object is restored exactly', (t) => {
  const userHooks = '{\n  "hooks": {\n    "Stop": [{ "hooks": [{ "type": "command", "command": "echo user-stop" }] }],\n'
    + '    "PostToolUse": [{ "matcher": "Edit", "hooks": [{ "type": "command", "command": "prettier --write" }] }]\n  },\n  "model": "opus"\n}\n';
  const { installed } = roundTrip(t, userHooks);
  assert.deepEqual(installed.hooks.Stop[0], { hooks: [{ type: 'command', command: 'echo user-stop' }] });
  assert.equal(installed.hooks.Stop.length, 2);
  assert.deepEqual(installed.hooks.PostToolUse, [{ matcher: 'Edit', hooks: [{ type: 'command', command: 'prettier --write' }] }]);
  roundTrip(t, '{ "hooks": { } }\n');
});

test('a user group that only resembles the Harness hook holds with zero writes', (t) => {
  const root = project(t);
  fs.mkdirSync(path.join(root, '.claude'));
  const original = '{"hooks":{"Stop":[{"hooks":[{"type":"command","command":"bash -lc \'node .claude/harness-lite/hooks/dispatcher.js\' && notify"}]}]}}\n';
  fs.writeFileSync(settings(root), original);
  const result = install.install(root, { write: true });
  assert.equal(result.status, 'HOLD');
  assert.match(result.reason, /unknown Harness Claude hook: Stop/);
  assert.equal(fs.readFileSync(settings(root), 'utf8'), original);
});

test('Claude payloads bind the turn by prompt_id: registration, observation, and Stop work without turn_id', (t) => {
  const root = project(t);
  assert.equal(install.install(root, { write: true }).status, 'INSTALLED');
  fs.writeFileSync(path.join(root, 'docs/harness/stages/stage-one.md'), '# S\n目标：g\n');
  fs.writeFileSync(path.join(root, 'docs/harness/leaves/L1.md'), '# L\n阶段：stage-one\n目标：g\n完成标准：\n- done\n');
  const event = (input) => {
    const run = spawnSync(process.execPath, [path.join(root, install.RUNTIME, 'hooks/dispatcher.js')], { cwd: root, input: JSON.stringify(input), encoding: 'utf8' });
    assert.equal(run.status, 0, run.stderr);
    return run.stdout.trim() ? JSON.parse(run.stdout) : {};
  };
  const common = { session_id: 'claude-session', transcript_path: path.join(root, 't.jsonl'), cwd: root, permission_mode: 'default' };
  const prompt = { ...common, hook_event_name: 'UserPromptSubmit', prompt: 'implement it', prompt_id: 'prompt-1' };
  const context = event(prompt).hookSpecificOutput.additionalContext;
  const receipt = hook.readTurn(root, { session_id: 'claude-session', turn_id: 'prompt-1' }).receipt.receiptId;
  const command = hook.intentCommand({ sourceReceipt: receipt, action: 'execute' });
  assert.ok(context.includes(command), context);
  const pre = event({ ...common, hook_event_name: 'PreToolUse', prompt_id: 'prompt-1', tool_name: 'Bash', tool_input: { command }, tool_use_id: 'toolu_1' });
  assert.equal(pre.hookSpecificOutput.permissionDecision, 'allow');
  assert.equal(authorization.read(root).value.executionReceipt, receipt);
  const observed = JSON.parse(fs.readFileSync(path.join(root, 'docs/harness/usage/.observed.json'), 'utf8'));
  assert.equal(observed.source, 'claude-host-hook');
  const push = event({ ...common, hook_event_name: 'PreToolUse', prompt_id: 'prompt-1', tool_name: 'Bash', tool_input: { command: 'git push origin main' } });
  assert.equal(push.hookSpecificOutput.permissionDecision, 'deny');
  event({ ...common, hook_event_name: 'Stop', prompt_id: 'prompt-1', stop_hook_active: false, last_assistant_message: 'done' });
  assert.equal(fs.existsSync(path.join(root, 'docs/harness/usage/.turns/claude-session--prompt-1.json')), false);
  assert.equal(authorization.read(root).kind, 'closed');
});

test('switching a project install to managed removes its Claude hooks and restores the settings bytes', (t) => {
  const managed = require('../lib/managed.js');
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'hl14-claude-managed-'));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  const system = path.join(base, 'system'), root = path.join(base, 'project');
  fs.mkdirSync(system); fs.mkdirSync(root);
  const git = (args) => spawnSync('/usr/bin/git', args, { cwd: root, encoding: 'utf8', env: { HOME: process.env.HOME, PATH: '/usr/bin:/bin' } });
  assert.equal(git(['init', '-q']).status, 0);
  fs.writeFileSync(path.join(root, 'README.md'), '# claude managed\n');
  assert.equal(git(['add', 'README.md']).status, 0);
  assert.equal(git(['-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '-m', 'init']).status, 0);
  fs.mkdirSync(path.join(root, '.claude'));
  const original = '{\n  "model": "opus"\n}\n';
  fs.writeFileSync(settings(root), original);
  assert.equal(install.install(root, { write: true }).status, 'INSTALLED');
  assert.equal(install.claudeConfigured(root), true);
  assert.equal(managed.installGlobal(system, { write: true }).status, 'INSTALLED');
  const switched = install.install(root, { write: true, profile: 'managed', globalRoot: system });
  assert.equal(switched.status, 'INSTALLED', switched.reason);
  assert.equal(fs.readFileSync(settings(root), 'utf8'), original);
  assert.equal(install.claudeConfigured(root), false);
  assert.equal(switched.manifest.claudeHookPreimage, null);
  assert.equal(install.uninstall(root, { write: true, globalRoot: system }).status, 'UNINSTALLED');
  assert.equal(fs.readFileSync(settings(root), 'utf8'), original);
});

test('a settings file created by install is removed even after the user emptied its hooks', (t) => {
  const root = project(t);
  assert.equal(install.install(root, { write: true }).status, 'INSTALLED');
  fs.writeFileSync(settings(root), '{}\n');
  assert.equal(install.uninstall(root, { write: true }).status, 'UNINSTALLED');
  assert.equal(fs.existsSync(settings(root)), false);
});

test('Claude hooks installed under one Node binary are recognized by another (cross-Node uninstall and reinstall)', (t) => {
  // W5 cross-node check: install with Node 22 then uninstall with Node 24 held on "unknown Harness Claude hook".
  const root = project(t);
  fs.mkdirSync(path.join(root, '.claude'));
  const original = '{\n  "model": "opus"\n}\n';
  fs.writeFileSync(settings(root), original);
  const tools = fs.mkdtempSync(path.join(os.tmpdir(), 'hl14-claude-node-'));
  t.after(() => fs.rmSync(tools, { recursive: true, force: true }));
  const alternate = path.join(tools, 'node');
  fs.copyFileSync(process.execPath, alternate);
  fs.appendFileSync(alternate, '\nHL14 isolated alternate Claude launcher\n');
  fs.chmodSync(alternate, 0o755);
  const run = spawnSync(alternate, ['-e',
    'const api=require(process.argv[1]); const r=api.install(process.argv[2],{write:true}); console.log(r.status); process.exit(r.status==="INSTALLED"?0:1)',
    path.join(__dirname, '../lib/install.js'), root], { cwd: root, encoding: 'utf8' });
  assert.equal(run.status, 0, run.stdout + run.stderr);
  assert.equal(install.claudeConfigured(root), true);
  const reinstall = install.install(root, { write: true });
  assert.equal(reinstall.status, 'INSTALLED', reinstall.reason);
  assert.equal(install.uninstall(root, { write: true }).status, 'UNINSTALLED');
  assert.equal(fs.readFileSync(settings(root), 'utf8'), original);
});
