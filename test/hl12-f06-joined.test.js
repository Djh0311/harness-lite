'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const test = require('node:test');
const hook = require('../lib/hook.js');
const install = require('../lib/install.js');
const guidance = require('../lib/guidance.js');
const delegation = require('../lib/delegation.js');

function tempRoot() { return fs.mkdtempSync(path.join(os.tmpdir(), 'hl12-f06-')); }
function chainRoot(root) {
  fs.mkdirSync(path.join(root, 'docs', 'harness', 'leaves'), { recursive: true });
  fs.mkdirSync(path.join(root, 'docs', 'harness', 'stages'), { recursive: true });
  fs.writeFileSync(path.join(root, 'docs', 'harness', 'plan.md'), '# plan\n');
  fs.writeFileSync(path.join(root, 'docs', 'harness', 'stages', 'stage.md'), '# Stage F06\n\n目标：F06\n');
  fs.writeFileSync(path.join(root, 'docs', 'harness', 'leaves', 'F06.md'), [
    '# F06 Leaf', '', '阶段：stage', '', '目标：F06 joined goal', '', '完成标准：', '', '- F06-BEGIN', '- F06-END', '',
    '允许动：', '', '- lib/**', '', '不许动：', '', '- push', '',
    '## Work Unit F06-A', '', 'goal: package', '', 'completionStandards:', '', '- package', '', 'dependencies:', '', '- 无', '',
  ].join('\n'));
}
function chainRootMixed(root) {
  chainRoot(root);
  const leaf = path.join(root, 'docs', 'harness', 'leaves', 'F06.md');
  const units = Array.from({ length: 8 }, (_, i) => `\n## Work Unit U${i + 1}\n\ngoal: U${i + 1} goal\n\ncompletionStandards:\n\n- U${i + 1} standard\n\ndependencies:\n\n- 无\n`).join('');
  fs.appendFileSync(leaf, units);
}

test('F06 formal SessionStart exposes one decision and a complete carrier', () => {
  const root = tempRoot();
  try {
    chainRoot(root);
    const result = hook.sessionStart(root, { hook_event_name: 'SessionStart', session_id: 's', turn_id: 't' }, { write: false });
    const context = result.hookSpecificOutput.additionalContext;
    assert.equal(context.length <= 1800, true);
    assert.equal((context.match(/Decision：focus=/g) || []).length, 1);
    assert.equal((context.match(/DecisionQuestion：/g) || []).length, 1);
    assert.equal((context.match(/NextAction：/g) || []).length, 1);
    assert.match(context, /CompletionCarrier：/);
    assert.match(context, /F06-BEGIN/);
    assert.doesNotMatch(context, /Guidance\[(?:leaf-definition|pre-dispatch|agent-active)\]/);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('F06 formal PreToolUse explains only a real push interception', () => {
  const root = tempRoot();
  try {
    const ordinary = hook.preTool(root, { hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'printf ok' } });
    assert.equal(ordinary, null);
    const blocked = hook.preTool(root, { hook_event_name: 'PreToolUse', session_id: 's', turn_id: 't', tool_name: 'Bash', tool_input: { command: 'git push origin HEAD:main' } });
    assert.equal(blocked.hookSpecificOutput.permissionDecision, 'deny');
    assert.match(blocked.hookSpecificOutput.permissionDecisionReason, /动作=.*目标=.*边界=.*风险=.*现在请用户决定=/);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('F06 installed dispatcher uses the joined decision package', () => {
  const root = tempRoot();
  try {
    const result = install.install(root, { write: true });
    assert.equal(result.status, 'INSTALLED');
    const dispatcher = path.join(root, '.claude', 'harness-lite', 'hooks', 'dispatcher.js');
    const run = spawnSync(process.execPath, [dispatcher], { cwd: root, input: JSON.stringify({ hook_event_name: 'UserPromptSubmit', cwd: root, session_id: 's', turn_id: 't', prompt: 'hello' }), encoding: 'utf8' });
    assert.equal(run.status, 0);
    assert.ok(run.stdout.includes('hookSpecificOutput'));
    assert.ok(run.stdout.includes('Decision：focus='));
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('F06 current instruction keeps zero-command and exact ownership language', () => {
  assert.match(install.INSTRUCTION, /普通且已授权的可恢复工作/);
  assert.match(install.INSTRUCTION, /一个当前 focus、一个 decisionQuestion 和一个 nextAction/);
  assert.match(install.INSTRUCTION, /用户日常 Harness 命令仍为 0/);
});

test('F06 long UNKNOWN completion carrier stays explicitly incomplete', () => {
  const root = tempRoot();
  try {
    const carrier = guidance.completionCarrier({ leaf: { goal: 'goal', completionStandards: [guidance.UNKNOWN, 'x'.repeat(900)] } }, { maxChars: 620, ref: 'docs/harness/leaves/F06.md' });
    assert.equal(carrier.complete, false);
    assert.equal(carrier.truncated, true);
    assert.equal(carrier.carrier, 'external-required');
    assert.doesNotMatch(JSON.stringify(carrier), /\.\.\./);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('F06 parallel carrier has a real ref, count, digest and sentinel metadata', () => {
  const units = [1, 2, 3].map((n) => ({ id: `U${n}`, goal: `goal-${n}`, completionStandards: [`U${n}-BEGIN`, `U${n}-END`], authorityDesign: [`D${n}`], facts: [`F${n}`], dependencies: [], writeScope: [`src/${n}.js`], resultContract: `R${n}`, status: 'active', channel: 'codex', model: 'model', modelFamily: 'ordinary', reasoning: 'high' }));
  const lines = hook.hookParallelWorkUnitLines({ state: 'known', status: 'complete', complete: 'complete', active: units.map((u) => u.id), units, conflicts: [], runnable: [], source: { leaf: 'docs/harness/leaves/F06.md' }, carrier: { readApi: 'work.parallelWorkUnitContext' }, acceptedOnlyUnlock: true });
  assert.equal(lines.length, 2);
  const carrier = lines[1];
  assert.match(lines[0], /ParallelWorkUnits：state=known；status=complete；complete=complete；active=3；units=3/);
  assert.match(carrier, /ParallelWorkUnitsCarrier：complete=complete；inline=false；truncated=false；count=3；ids=U1,U2,U3；/);
  assert.match(carrier, /ref=docs\/harness\/leaves\/F06\.md；readApi=tree\.workUnitPackages；/);
  assert.match(carrier, /digest=sha256:[0-9a-f]{64}；sentinelStart=U1-BEGIN；sentinelMiddle=U2-BEGIN；sentinelEnd=U3-END；sentinelCount=3/);
});

test('F06 eight long units use bounded sentinel carrier without ellipsis', () => {
  const units = Array.from({ length: 8 }, (_, i) => ({ id: `L${i}`, goal: `goal-${i}`, completionStandards: [`BEGIN-${'x'.repeat(180)}`, `END-${'y'.repeat(180)}`], authorityDesign: ['D'.repeat(180)], facts: ['F'.repeat(180)], entryPoints: ['src/x.js'], disprovenRoutes: ['none'], unknowns: ['none'], routeBasis: 'route', dependencies: [], writeScope: ['src/x.js'], resultContract: 'result', allowed: ['src/**'], forbidden: ['push'], readiness: 'ready', dispatchReady: true, source: { leaf: 'docs/harness/leaves/F06.md' }, agent: { status: 'active' }, status: 'active' }));
  const lines = hook.hookParallelWorkUnitLines({ state: 'known', status: 'complete', complete: 'complete', active: units.map((u) => u.id), units, conflicts: [], runnable: [], source: { leaf: 'docs/harness/leaves/F06.md' }, carrier: { readApi: 'work.parallelWorkUnitContext', complete: 'complete', truncated: false }, acceptedOnlyUnlock: true });
  assert.equal(lines.length, 2);
  assert.ok(lines[1].length < 620, lines[1].length);
  assert.doesNotMatch(lines[1], /\.\.\.|…/);
  assert.match(lines[1], /count=8；.*digest=sha256:[0-9a-f]{64}；sentinelStart=sha256:/);
});

test('F06 aggregate digest is derived from complete package projections', () => {
  const units = [1, 2, 3].map((i) => ({ id: `P${i}`, goal: `G${i}`, completionStandards: [`S${i}`], authorityDesign: [`D${i}`], facts: [`F${i}`], entryPoints: [`E${i}`], disprovenRoutes: [], unknowns: [], routeBasis: `R${i}`, dependencies: [], resultContract: `C${i}`, allowed: [`a${i}`], forbidden: [`f${i}`], writeScope: [`w${i}`], readiness: 'ready', dispatchReady: true, source: { leaf: 'leaf' }, agent: { status: 'active' }, status: 'active' }));
  const lines = hook.hookParallelWorkUnitLines({ state: 'known', complete: 'complete', status: 'complete', active: units.map((u) => u.id), units, conflicts: [], runnable: [], source: { leaf: 'leaf' }, carrier: { readApi: 'work.parallelWorkUnitContext', complete: 'complete', truncated: false } });
  assert.match(lines[1], /digest=sha256:[0-9a-f]{64}/);
  const before = lines[1]; units[1].goal = 'CHANGED';
  const changed = hook.hookParallelWorkUnitLines({ state: 'known', complete: 'complete', status: 'complete', active: units.map((u) => u.id), units, conflicts: [], runnable: [], source: { leaf: 'leaf' }, carrier: { readApi: 'work.parallelWorkUnitContext', complete: 'complete', truncated: false } })[1];
  assert.notEqual(changed, before);
});

test('F06 required carriers survive extreme push-gate pressure without silent tail cutting', () => {
  const root = tempRoot();
  try {
    chainRoot(root);
    const gate = { action: 'git push', target: 'remote/'.concat('x'.repeat(1200)), boundary: 'main'.concat('b'.repeat(700)), risk: 'destructive'.concat('r'.repeat(700)), userDecision: 'confirm'.concat('u'.repeat(700)) };
    const context = hook.sessionStart(root, { hook_event_name: 'SessionStart', session_id: 'pressure', turn_id: 't' }, { write: false, pushGate: gate }).hookSpecificOutput.additionalContext;
    assert.equal(context.length <= 1800, true, context.length);
    assert.match(context, /CompletionCarrier：complete=/);
    assert.match(context, /PushGate：complete=false；inline=false；truncated=true；ref=.*readApi=guidance\.select；digest=sha256:/);
    assert.doesNotMatch(context, /PushGate：.*\.\.\./);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('F06 mixed 2 active plus 6 runnable keeps counts in source and installed formal hooks', () => {
  const root = tempRoot();
  try {
    chainRootMixed(root);
    for (let i = 1; i <= 8; i++) {
      const status = i <= 2 ? 'active' : 'rejected';
      const result = delegation.recordEvent(root, { id: `e${i}`, workUnit: `U${i}`, status }, { at: `2026-09-02T00:00:0${i}.000Z` });
      assert.equal(result.ok, true, result.reason);
    }
    const source = hook.sessionStart(root, { hook_event_name: 'SessionStart', session_id: 'mixed-source' }, { write: false }).hookSpecificOutput.additionalContext;
    assert.match(source, /ParallelWorkUnits：state=known；status=.*；complete=.*；active=2；runnable=6；acceptedOnlyUnlock=true/);
    assert.match(source, /ParallelWorkUnitsCarrier：.*count=8/);
    install.install(root, { write: true });
    const dispatcher = path.join(root, '.claude', 'harness-lite', 'hooks', 'dispatcher.js');
    const run = spawnSync(process.execPath, [dispatcher], { cwd: root, input: JSON.stringify({ hook_event_name: 'SessionStart', cwd: root, session_id: 'mixed-installed' }), encoding: 'utf8' });
    assert.equal(run.status, 0, run.stderr);
    const installed = JSON.parse(run.stdout).hookSpecificOutput.additionalContext;
    assert.match(installed, /ParallelWorkUnits：state=known；status=.*；complete=.*；active=2；runnable=6；acceptedOnlyUnlock=true/);
    assert.match(installed, /ParallelWorkUnitsCarrier：.*count=8/);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('R31 decision package keeps product completion, local recovery, and question boundaries explicit', () => {
  const pre = guidance.select({}, {}, { intent: 'pre-dispatch' });
  assert.match(pre.nextAction, /只派发或只记录不等于用户结果完成/);
  assert.match(pre.nextAction, /complete=false/);
  assert.match(pre.nextAction, /productResult=incomplete/);
  const recovery = guidance.select({}, {}, { intent: 'problem-recovery' });
  assert.match(recovery.nextAction, /只修当前A/);
  assert.match(recovery.nextAction, /不扩大全局/);
  const route = guidance.select({}, {}, { intent: 'route-clarification' });
  assert.match(route.nextAction, /能直接查证就不问用户/);
  assert.match(route.nextAction, /不可替代的用户选择才问/);
  assert.match(install.INSTRUCTION, /只派发或只记录不等于用户结果完成/);
  assert.match(install.INSTRUCTION, /局部故障只修当前 unit A/);
  assert.ok(install.INSTRUCTION.length <= 900);
});

test('R33 dependency and local-failure decisions put HOLD and incomplete semantics first', () => {
  const reported = guidance.select({}, {}, { intent: 'agent-reported' });
  assert.match(reported.decisionQuestion, /先 HOLD\/暂停 B/);
  assert.match(reported.nextAction, /先 HOLD\/暂停 B/);
  assert.match(reported.nextAction, /能查证不问用户/);
  const recovery = guidance.select({}, {}, { intent: 'problem-recovery' });
  assert.match(recovery.decisionQuestion, /^A 未修复/);
  assert.match(recovery.nextAction, /^只修当前A/);
  assert.match(recovery.nextAction, /complete=false、productResult=incomplete/);
  assert.match(install.INSTRUCTION, /B 依赖未验收的 A，第一动作先 HOLD\/暂停 B/);
  assert.ok(install.INSTRUCTION.length <= 900);
});

test('R34 closeout guidance never treats green tests as the user result', () => {
  const closeout = guidance.select({}, {}, { intent: 'leaf-closeout' });
  assert.match(closeout.nextAction, /核验导出结果和完成标准/);
  assert.match(closeout.nextAction, /保持未完成/);
  assert.match(closeout.nextAction, /先补直接证据/);
  assert.match(closeout.nextAction, /complete=false、productResult=incomplete/);
  assert.doesNotMatch(closeout.text, /收口/);
});
