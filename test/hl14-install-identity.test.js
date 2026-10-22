'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const test = require('node:test');
const { spawnSync } = require('child_process');
const install = require('../lib/install.js');
const hook = require('../lib/hook.js');
const io = require('../lib/io.js');
const dispatcher = require('../hooks/dispatcher.js');
const evidence = require('../lib/evidence.js');

function project(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hl14-install-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, '.codex'));
  fs.mkdirSync(path.join(root, '.cursor'));
  return root;
}

function withNode(executable, callback) {
  const original = Object.getOwnPropertyDescriptor(process, 'execPath');
  Object.defineProperty(process, 'execPath', { ...original, value: executable });
  try { return callback(); } finally { Object.defineProperty(process, 'execPath', original); }
}

test('Node launcher path does not change current product Hook identity', (t) => {
  const root = project(t), alias = path.join(root, 'node');
  fs.symlinkSync(process.execPath, alias);
  const expected = install.definition(root);
  const other = withNode(alias, () => install.definition(root));
  assert.notEqual(expected.command, other.command);
  assert.equal(expected.digest, other.digest);
});

test('installed runtime survives a compatible alternate Node launcher', (t) => {
  const root = project(t);
  assert.equal(install.install(root, { write: true }).status, 'INSTALLED');
  const alias = path.join(root, 'node');
  fs.symlinkSync(process.execPath, alias);
  withNode(alias, () => {
    assert.equal(install.verify06(root).ok, true);
    assert.equal(dispatcher.bootstrapVerify(root).ok, true);
    assert.equal(install.configured(root), true);
  });
  const run = spawnSync(alias, [path.join(root, install.RUNTIME, 'hooks/dispatcher.js')], {
    cwd: root, input: JSON.stringify({ hook_event_name: 'SessionStart', session_id: 'alternate-node' }), encoding: 'utf8',
  });
  assert.equal(run.status, 0, run.stderr);
  assert.doesNotMatch(run.stdout, /runtime identity UNKNOWN/);
  const health = install.health(root);
  assert.equal(health.productIdentity.state, 'verified-local');
  assert.equal(health.environment.verifierNode, process.version);
  assert.equal(health.environment.nodeCompatible, true);
  assert.equal(health.effective, false);
  assert.equal(health.observed.Stop, false);
});

test('launcher normalization never accepts shell wrappers or changed Hook semantics', (t) => {
  const root = project(t);
  assert.equal(install.install(root, { write: true }).status, 'INSTALLED');
  const file = path.join(root, '.codex/hooks.json'), original = fs.readFileSync(file, 'utf8');
  const wrapper = path.join(root, 'node');
  fs.writeFileSync(wrapper, '#!/bin/sh\nexec /bin/true\n', { mode: 0o755 });
  for (const mutate of [
    (group) => { group.hooks[0].command = `env ${group.hooks[0].command}`; },
    (group) => { group.hooks[0].command += ' && echo extra'; },
    (group) => { group.hooks[0].command = group.hooks[0].command.replace(JSON.stringify(process.execPath), JSON.stringify(wrapper)); },
    (group) => { group.hooks[0].command = group.hooks[0].command.replace('/hooks/dispatcher.js', '/hooks/other.js'); },
    (group) => { group.hooks[0].timeout++; },
    (group) => { group.matcher = '^Shell$'; },
  ]) {
    const data = JSON.parse(original);
    mutate(data.hooks.PreToolUse[0]);
    fs.writeFileSync(file, JSON.stringify(data));
    assert.equal(install.configured(root), false);
    assert.equal(install.install(root).status, 'HOLD');
  }
  fs.copyFileSync('/bin/true', wrapper);
  fs.chmodSync(wrapper, 0o755);
  const data = JSON.parse(original);
  data.hooks.PreToolUse[0].hooks[0].command = data.hooks.PreToolUse[0].hooks[0].command.replace(JSON.stringify(process.execPath), JSON.stringify(wrapper));
  fs.writeFileSync(file, JSON.stringify(data));
  assert.equal(install.configured(root), false);
  assert.equal(install.install(root).status, 'HOLD');
});

test('Cursor composite commands are not mistaken for removable Harness ownership', (t) => {
  const root = project(t), file = path.join(root, '.cursor/hooks.json');
  const before = '{"version":1,"hooks":{"stop":[{"command":"node .claude/harness-lite/hooks/dispatcher.js --host cursor && echo custom","timeout":30}]}}\n';
  fs.writeFileSync(file, before);
  assert.equal(install.mergeCursorHooks(root, { write: true }).ok, false);
  assert.equal(fs.readFileSync(file, 'utf8'), before);
  assert.equal(install.removeCursorHooks(root, { write: true }).ok, false);
  assert.equal(fs.readFileSync(file, 'utf8'), before);
});

test('Cursor uninstall restores existing empty configurations and event declarations', (t) => {
  for (const original of [
    '{"version":1,"hooks":{}}\n',
    '{\n  "version": 1,\n  "hooks": { "stop": [] }\n}\n',
    '{"version":2,"hooks":{"sessionStart":[]},"user_setting":true}\n',
  ]) {
    const root = project(t), file = path.join(root, '.cursor/hooks.json');
    fs.writeFileSync(file, original, { mode: 0o640 });
    assert.equal(install.install(root, { write: true }).status, 'INSTALLED');
    assert.equal(install.uninstall(root, { write: true }).status, 'UNINSTALLED');
    assert.equal(fs.readFileSync(file, 'utf8'), original);
    assert.equal(fs.statSync(file).mode & 0o777, 0o640);
  }
});

test('Cursor uninstall preserves user edits made after installation', (t) => {
  const root = project(t), file = path.join(root, '.cursor/hooks.json');
  fs.writeFileSync(file, '{"version":1,"hooks":{"stop":[]}}\n');
  assert.equal(install.install(root, { write: true }).status, 'INSTALLED');
  const data = io.json(file);
  data.hooks.stop.push({ command: 'echo keep-user-command', timeout: 7 });
  data.user_setting = 'keep';
  fs.writeFileSync(file, JSON.stringify(data));
  assert.equal(install.uninstall(root, { write: true }).status, 'UNINSTALLED');
  const restored = io.json(file);
  assert.equal(restored.user_setting, 'keep');
  assert.deepEqual(restored.hooks.stop, [{ command: 'echo keep-user-command', timeout: 7 }]);
});

test('malformed null Hook handlers return zero-write HOLD instead of crashing', (t) => {
  const root = project(t), file = path.join(root, '.codex/hooks.json');
  const before = '{"hooks":{"Stop":[{"hooks":[null]}]}}\n';
  fs.writeFileSync(file, before);
  assert.equal(install.install(root, { write: true }).status, 'HOLD');
  assert.equal(fs.readFileSync(file, 'utf8'), before);
  assert.equal(fs.existsSync(path.join(root, install.RUNTIME)), false);
});

test('Cursor multi-command separators survive install and uninstall byte exactly', (t) => {
  const root = project(t), file = path.join(root, '.cursor/hooks.json');
  const before = '{\n "version":2,\n "hooks":{"stop":[\n   {"command":"echo one","timeout":7},\n   {"command":"echo two","timeout":9}\n ]},\n "user":true\n}\n';
  fs.writeFileSync(file, before, { mode: 0o640 });
  assert.equal(install.install(root, { write: true }).status, 'INSTALLED');
  assert.equal(install.uninstall(root, { write: true }).status, 'UNINSTALLED');
  assert.equal(fs.readFileSync(file, 'utf8'), before);
  assert.equal(fs.statSync(file).mode & 0o777, 0o640);
});

test('managed to project migration captures the Cursor events it actually adds', (t) => {
  const root = project(t), system = fs.mkdtempSync(path.join(os.tmpdir(), 'hl14-cursor-migration-'));
  t.after(() => fs.rmSync(system, { recursive: true, force: true }));
  const git = spawnSync('/usr/bin/git', ['init', '-q'], { cwd: root, encoding: 'utf8' });
  assert.equal(git.status, 0, git.stderr);
  const file = path.join(root, '.cursor/hooks.json'), before = '{ "version":2, "hooks": { \n }, "user":true }\n';
  fs.writeFileSync(file, before, { mode: 0o640 });
  assert.equal(require('../lib/managed.js').installGlobal(system, { write: true }).status, 'INSTALLED');
  assert.equal(install.install(root, { write: true, profile: 'managed', globalRoot: system }).status, 'INSTALLED');
  assert.equal(install.install(root, { write: true, profile: 'project', globalRoot: system }).status, 'INSTALLED');
  assert.equal(install.uninstall(root, { write: true }).status, 'UNINSTALLED');
  assert.equal(fs.readFileSync(file, 'utf8'), before);
  assert.equal(fs.statSync(file).mode & 0o777, 0o640);
});

function list(root) {
  const def = install.definition(root);
  return { data: [{ cwd: root, warnings: [], errors: [], hooks: install.EVENTS.map((event) => ({
    eventName: evidence.HOST_EVENT[event], command: def.command, matcher: def.config.hooks[event][0].matcher || null,
    source: 'project', sourcePath: path.join(root, '.codex/hooks.json'), enabled: true,
    isManaged: false, trustStatus: 'trusted', currentHash: `hash-${event}`,
  })) }] };
}

test('host receipt joining accepts final event decisions without weakening exact binding', (t) => {
  const root = project(t), options = { connectionId: 'host-connection', write: true };
  assert.equal(install.install(root, { write: true }).status, 'INSTALLED');
  install.recordHostList(root, list(root), options);
  for (const [event, decision] of [
    ['Stop', 'continued'], ['Stop', 'not-continued'],
    ['PreToolUse', 'allowed'], ['PreToolUse', 'denied'], ['PreToolUse', 'unaffected'], ['Stop', 'executed'],
  ]) {
    const notification = { method: 'hook/started', threadId: 'session', turnId: 'turn', run: {
      id: `run-${event}-${decision}`, eventName: evidence.HOST_EVENT[event], handlerType: 'command', source: 'project',
      sourcePath: path.join(root, '.codex/hooks.json'),
    } };
    assert.equal(install.recordHostEvent(root, notification, options).ok, true);
    hook.observe(root, { hook_event_name: event, session_id: 'session', turn_id: 'turn' }, { decision, reason: 'test-final' });
    const result = install.recordHostEvent(root, {
      ...notification, method: 'hook/completed', run: { ...notification.run, status: 'completed' },
    }, options);
    assert.equal(result.receiptVerdict, 'exact');
    assert.equal(result.value.records.at(-1).receipt.decision, decision);
  }
  for (const [event, session, decision] of [
    ['Stop', 'foreign-session', 'continued'], ['Stop', 'session', 'allowed'], ['PreToolUse', 'session', 'continued'],
  ]) {
    const notification = { method: 'hook/started', threadId: 'session', turnId: 'turn', run: {
      id: `bad-${event}-${session}-${decision}`, eventName: evidence.HOST_EVENT[event], handlerType: 'command',
      source: 'project', sourcePath: path.join(root, '.codex/hooks.json'),
    } };
    assert.equal(install.recordHostEvent(root, notification, options).ok, true);
    hook.observe(root, { hook_event_name: event, session_id: session, turn_id: 'turn' }, { decision });
    assert.equal(install.recordHostEvent(root, {
      ...notification, method: 'hook/completed', run: { ...notification.run, status: 'completed' },
    }, options).receiptVerdict, 'missing');
  }
});

test('evidence bundles recognize only event-appropriate execution decisions', () => {
  for (const [event, decision, expected] of [
    ['Stop', 'continued', true], ['Stop', 'not-continued', true],
    ['PreToolUse', 'denied', true], ['PreToolUse', 'unaffected', true],
    ['SessionStart', 'continued', false], ['Stop', 'allowed', false],
  ]) {
    assert.equal(evidence.executedReceipt(event, decision), expected);
  }
});
