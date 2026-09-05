'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const test = require('node:test');

const capabilities = require('../lib/capabilities.js');
const delegation = require('../lib/delegation.js');
const install = require('../lib/install.js');
const { workUnitDeclarations } = require('./fixtures/work-unit-declarations.js');

const sourceRoot = path.resolve(__dirname, '..');
const gitEnv = { PATH: '/usr/bin:/bin', LANG: 'C', LC_ALL: 'C' };

function tempRoot(prefix = 'hl-fix01-runtime-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}
function run(command, args, opts = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', ...opts });
  assert.equal(result.status, 0, `${command} ${args.join(' ')}\n${result.stderr || result.stdout}`);
  return result;
}
function git(root, args) {
  return run('/usr/bin/git', args, { cwd: root, env: gitEnv });
}
function initGitRoot(root) {
  git(root, ['init', '-q']);
  git(root, ['config', 'user.email', 'harness-lite@example.invalid']);
  git(root, ['config', 'user.name', 'Harness Lite Test']);
  fs.writeFileSync(path.join(root, 'README.md'), '# disposable\n');
  git(root, ['add', 'README.md']);
  git(root, ['commit', '-q', '-m', 'init']);
}
function writeHarnessState(root, opts = {}) {
  fs.mkdirSync(path.join(root, 'docs/harness/stages'), { recursive: true });
  fs.mkdirSync(path.join(root, 'docs/harness/leaves'), { recursive: true });
  fs.writeFileSync(path.join(root, 'docs/harness/plan.md'), '# Plan\n\n目标：FIX01 plan sentinel\n');
  fs.writeFileSync(path.join(root, 'docs/harness/stages/stage-fix01.md'), [
    '# Stage FIX01',
    '',
    '目标：FIX01 stage sentinel',
    '',
    '不许动：',
    '',
    '- release',
  ].join('\n'));
  fs.writeFileSync(path.join(root, 'docs/harness/leaves/FIX01.md'), [
    '# Leaf FIX01',
    '',
    '阶段：stage-fix01',
    '',
    `目标：${opts.long ? `FIX01-GOAL-SENTINEL-${'X'.repeat(240)}` : 'FIX01-GOAL-SENTINEL'}`,
    '',
    '完成标准：',
    '',
    '- FIX01-LEAF-COMPLETION-SENTINEL',
    '',
    '相关权威设计：',
    '',
    '- FIX01-DESIGN-SENTINEL',
    '',
    '允许动：',
    '',
    '- lib/hook.js',
    '- lib/capabilities.js',
    '',
    '不许动：',
    '',
    '- release',
    '',
    '## Work Unit FIX01 - guidance runtime sentinel',
    '',
    `goal: ${opts.long ? `FIX01-GOAL-SENTINEL-${'G'.repeat(240)}` : 'FIX01-GOAL-SENTINEL'}`,
    '',
    'directAcceptance:',
    '',
    '- FIX01-ACCEPT-SENTINEL',
    '',
    'allowed:',
    '',
    '- lib/hook.js',
    '- lib/capabilities.js',
    '',
    'forbidden:',
    '',
    '- release',
    '',
    'facts:',
    '',
    '- FIX01-FACT-SENTINEL',
    '',
    'entryPoints:',
    '',
    '- lib/hook.js sentinel-entry',
    '',
    'disprovenRoutes:',
    '',
    '- FIX01-DISPROVEN-SENTINEL',
    '',
    'unknowns:',
    '',
    '- FIX01-UNKNOWN-SENTINEL',
    '',
    `routeBasis: ${opts.long ? `FIX01-ROUTE-SENTINEL-${'R'.repeat(240)}` : 'FIX01-ROUTE-SENTINEL'}`,
    '',
    'dependencies:',
    '',
    '- FIX00',
    '',
    'resultContract: FIX01-RESULT-SENTINEL',
    ...workUnitDeclarations(['FIX00', 'FIX02', 'FIX03', 'FIX04', 'FIX05']),
  ].join('\n'));
}
function writeDelegation(root) {
  delegation.recordEvent(root, { id: 'evt-fix01-active', workUnit: 'FIX01', status: 'active', writeScope: ['lib/hook.js', 'lib/capabilities.js'] }, { at: '2026-01-01T00:00:00.000Z' });
  delegation.recordEvent(root, { id: 'evt-fix01-activity', workUnit: 'FIX01', kind: 'activity', activityKind: 'runtime-sentinel' }, { at: '2026-01-01T00:01:00.000Z' });
  delegation.recordEvent(root, { id: 'evt-fix01-progress', workUnit: 'FIX01', kind: 'progress', progressKind: 'verified-fact', evidenceRef: 'reports/fix01-sentinel.md' }, { at: '2026-01-01T00:02:00.000Z' });
  delegation.recordEvent(root, { id: 'evt-fix02-report', workUnit: 'FIX02', status: 'reported_complete', dependencies: ['FIX01'] }, { at: '2026-01-01T00:03:00.000Z' });
  delegation.recordEvent(root, { id: 'evt-fix03-accepted', workUnit: 'FIX03', status: 'accepted', evidenceRef: 'reports/fix03.md' }, { at: '2026-01-01T00:04:00.000Z' });
  delegation.recordEvent(root, { id: 'evt-fix04-blocked', workUnit: 'FIX04', status: 'blocked', dependencies: ['FIX02'] }, { at: '2026-01-01T00:05:00.000Z' });
  delegation.recordEvent(root, { id: 'evt-fix05-partial', workUnit: 'FIX05', status: 'partial' }, { at: '2026-01-01T00:06:00.000Z' });
}
function writeCapabilityManifest(root) {
  fs.mkdirSync(path.join(root, '.codex/harness-lite'), { recursive: true });
  fs.writeFileSync(path.join(root, '.codex/harness-lite/capabilities.json'), `${JSON.stringify({
    schemaVersion: 1,
    kind: capabilities.KIND,
    models: [
      { channel: 'fix01-engineer', model: 'grok-fix01-sentinel', reasoning: 'xhigh', family: 'grok', status: 'available', capabilities: ['spawn_agent', 'wait_agent'] },
      { channel: 'fix01-ui', model: 'gemini-fix01-sentinel', reasoning: 'high', family: 'gemini', status: 'unavailable', capabilities: ['frontend'] },
    ],
  }, null, 2)}\n`);
}
function installProject(root) {
  const result = run(process.execPath, [
    path.join(sourceRoot, 'bin/hl.js'),
    'install',
    '--target',
    root,
    '--write',
    '--source',
    sourceRoot,
    '--json',
  ], { cwd: sourceRoot });
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.status, 'INSTALLED');
  assert.equal(install.verify06(root).ok, true);
}
function dispatchInstalled(root, input) {
  const result = run(process.execPath, [path.join(root, install.RUNTIME, 'hooks/dispatcher.js')], {
    cwd: root,
    input: `${JSON.stringify(input)}\n`,
  });
  const parsed = JSON.parse(result.stdout);
  return parsed.hookSpecificOutput.additionalContext;
}
function assertGuidanceBlock(text) {
  for (const needle of [
    'Harness Lite 面向 GPT-6 Astra',
    '用户指令决定目标、范围和权限',
    '直接证据判断用户结果',
    '只有 accepted 才解锁真实依赖它的下游',
    '表达先给结论，再给证据和缺口',
  ]) {
    assert.ok(text.includes(needle), needle);
  }
}
function assertRuntimeContext(context, opts = {}) {
  assert.equal(context.length <= 1800, true, context.length);
  for (const needle of [
    'CompletionCarrier：complete=',
    'Decision：focus=',
    'DecisionQuestion：',
    'NextAction：',
    'Scope：allowed=lib/hook.js、lib/capabilities.js',
    'boundaries=allowed/forbidden',
    'Delegation：live=true',
    'Heartbeat：read-only',
  ]) {
    assert.ok(context.includes(needle), `${needle}\n${context}`);
  }
  assert.ok(context.includes('WorkUnitCarrier：complete=') || context.includes('WorkUnit：id=FIX01'), context);
  assert.equal(context.includes('Capabilities：'), false, context);
  assert.equal(context.includes('Recovery：'), false, context);
}

test('installed runtime projects work-unit package and capability manifest through SessionStart and UserPromptSubmit', () => {
  const root = tempRoot();
  try {
    initGitRoot(root);
    writeHarnessState(root);
    writeDelegation(root);
    writeCapabilityManifest(root);
    installProject(root);

    assertGuidanceBlock(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'));
    assertGuidanceBlock(fs.readFileSync(path.join(root, 'CLAUDE.md'), 'utf8'));

    const start = dispatchInstalled(root, { hook_event_name: 'SessionStart', cwd: root, session_id: 'fix01-session', work_unit_id: 'FIX01' });
    const prompt = dispatchInstalled(root, { hook_event_name: 'UserPromptSubmit', cwd: root, session_id: 'fix01-session', turn_id: 'fix01-turn', prompt: 'FIX01 runtime sentinel prompt', work_unit_id: 'FIX01' });
    assertRuntimeContext(start, { manifest: true });
    assertRuntimeContext(prompt, { manifest: true });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('installed runtime keeps required guidance fields visible under 1800 chars when capability manifest is absent', () => {
  const root = tempRoot('hl-fix01-pressure-');
  try {
    initGitRoot(root);
    writeHarnessState(root, { long: true });
    writeDelegation(root);
    installProject(root);

    const start = dispatchInstalled(root, { hook_event_name: 'SessionStart', cwd: root, session_id: 'fix01-pressure', work_unit_id: 'FIX01' });
    const prompt = dispatchInstalled(root, { hook_event_name: 'UserPromptSubmit', cwd: root, session_id: 'fix01-pressure', turn_id: 'fix01-pressure-turn', prompt: 'FIX01 pressure prompt', work_unit_id: 'FIX01' });
    assertRuntimeContext(start, { manifest: false });
    assertRuntimeContext(prompt, { manifest: false });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
