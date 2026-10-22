'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const test = require('node:test');
const hook = require('../lib/hook.js');
const install = require('../lib/install.js');
const tree = require('../lib/tree.js');

// Real-host W2–W4v4 (2026-10-22): the stage-end test tidy only happened when it was asked for at close-out,
// so the exit that closes a stage's last leaf hands that request back as nextAction.

function fresh(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hl14-closeout-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  assert.equal(install.install(root, { write: true }).status, 'INSTALLED');
  return root;
}

function gitProject(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hl14-closeout-git-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const git = (...args) => assert.equal(spawnSync('git', args, { cwd: root, encoding: 'utf8' }).status, 0, args.join(' '));
  git('init', '-q');
  fs.mkdirSync(path.join(root, 'test'));
  fs.writeFileSync(path.join(root, 'test/old.test.js'), '// committed\n');
  git('add', '-A');
  git('-c', 'user.name=t', '-c', 'user.email=t@localhost', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'init');
  assert.equal(install.install(root, { write: true }).status, 'INSTALLED');
  return root;
}

function leafText(stage) {
  return `# 标签\n\n阶段：${stage}\n目标：标签能保存\n完成标准：\n- 标签能保存\n允许动：src\n`;
}

function plan(root, { stage = 'stage-two', current = 'tags', unfinished = [] } = {}) {
  fs.writeFileSync(path.join(root, `docs/harness/stages/${stage}.md`), `# 第二阶段\n\n目标：标签\n完成标准：\n- 标签可用\n`);
  fs.writeFileSync(path.join(root, `docs/harness/leaves/${current}.md`), leafText(stage));
  for (const item of unfinished) {
    if (item.stage !== stage) fs.writeFileSync(path.join(root, `docs/harness/stages/${item.stage}.md`), `# 下一阶段\n\n目标：导出\n完成标准：\n- 导出可用\n`);
    fs.writeFileSync(path.join(root, `docs/harness/unfinished/${item.name}.md`), leafText(item.stage));
  }
  fs.mkdirSync(path.join(root, 'src'), { recursive: true });
  fs.writeFileSync(path.join(root, 'src/tags.js'), 'module.exports = {};\n');
}

function event(root, input) {
  const run = spawnSync(process.execPath, [path.join(root, install.RUNTIME, 'hooks/dispatcher.js')], {
    cwd: root, input: JSON.stringify(input), encoding: 'utf8', timeout: 30000,
  });
  assert.equal(run.status, 0, run.stderr);
  return run.stdout.trim() ? JSON.parse(run.stdout) : {};
}

// One registration the way the model does it: the host's PreToolUse (`pre`) first, then the command itself (`cli`).
function session(root) {
  const input = { hook_event_name: 'UserPromptSubmit', session_id: 'session', turn_id: `turn-${Math.random()}`, prompt: '把标签做完' };
  event(root, input);
  const receipt = hook.readTurn(root, input).receipt.receiptId;
  const pre = (action, extra = {}) => {
    const claim = { sourceReceipt: receipt, action, ...extra };
    const decision = event(root, { hook_event_name: 'PreToolUse', session_id: input.session_id, turn_id: input.turn_id,
      tool_name: 'Bash', tool_input: { command: hook.intentCommand(claim) } }).hookSpecificOutput.permissionDecision;
    assert.equal(decision, 'allow', `${action} should be allowed`);
    return claim;
  };
  const cli = (claim) => {
    const run = spawnSync(process.execPath, [path.join(root, install.RUNTIME, 'hooks/dispatcher.js'), '--work-intent', JSON.stringify(claim)], {
      cwd: root, encoding: 'utf8', timeout: 30000,
    });
    assert.equal(run.status, 0, run.stdout + run.stderr);
    return JSON.parse(run.stdout);
  };
  return { pre, intent: (action, extra) => cli(pre(action, extra)) };
}

const evidence = { evidence: [{ standard: '标签能保存', evidenceRef: 'src/tags.js' }] };

test('the exit that closes a stage hands back the test tidy as nextAction; execute does not', (t) => {
  const root = fresh(t);
  plan(root);
  const { intent } = session(root);
  assert.equal(intent('execute').nextAction, undefined);
  const result = intent('exit', evidence);
  assert.equal(result.action, 'exit');
  assert.match(result.nextAction, /^stage-two 的 leaf 都已完成/);
  assert.match(result.nextAction, /先把这阶段相关的测试文件都看一遍，再整理/);
  assert.match(result.nextAction, /重复的用例合并成一处（边界用例保留）/);
  assert.match(result.nextAction, /只测已删除功能的测试删掉/);
  assert.match(result.nextAction, /与这阶段无关的测试不动/);
  assert.match(result.nextAction, /没有要整理的就不整理/);
  assert.doesNotMatch(result.nextAction, /这一轮改了/);
  assert.match(result.nextAction, /交付说明里用一句话写这阶段测试改了什么、为什么/);
  assert.equal(fs.existsSync(path.join(root, 'docs/harness/leaves/tags.md')), false, 'the leaf really left');
});

test('no nextAction while another leaf of the same stage is still planned', (t) => {
  const root = fresh(t);
  plan(root, { unfinished: [{ name: 'export', stage: 'stage-two' }] });
  const { intent } = session(root);
  intent('execute');
  const result = intent('exit', evidence);
  assert.equal(result.ok, true);
  assert.equal(result.nextAction, undefined);
});

test('a planned leaf of a different stage does not hold back the close-out', (t) => {
  const root = fresh(t);
  plan(root, { unfinished: [{ name: 'export', stage: 'stage-three' }] });
  const { intent } = session(root);
  intent('execute');
  assert.match(intent('exit', evidence).nextAction, /^stage-two 的 leaf 都已完成/);
});

test('a chain that cannot be read only drops the hint; the exit that already happened still reports ok', (t) => {
  const root = fresh(t);
  plan(root);
  const { pre, intent } = session(root);
  intent('execute');
  const claim = pre('exit', evidence);
  const readChain = tree.readChain;
  tree.readChain = () => { throw new Error('unreadable harness directory'); };
  let result;
  try { result = hook.intentResult(root, claim); } finally { tree.readChain = readChain; }
  assert.equal(result.ok, true);
  assert.equal(result.action, 'exit');
  assert.equal(result.nextAction, undefined);
  assert.equal(fs.existsSync(path.join(root, 'docs/harness/leaves/tags.md')), false);
});

test('the close-out names the test files changed in this turn and leaves earlier edits out', (t) => {
  const root = gitProject(t);
  plan(root);
  fs.writeFileSync(path.join(root, 'test/old.test.js'), '// changed by the user before this turn\n');
  const { intent } = session(root);
  intent('execute');
  fs.writeFileSync(path.join(root, 'test/tags.test.js'), '// written in this turn\n');
  // Not test changes of this turn: the user's earlier edit only gets staged; spec docs and data fixtures are not tests.
  assert.equal(spawnSync('git', ['add', 'test/old.test.js'], { cwd: root }).status, 0);
  fs.mkdirSync(path.join(root, 'docs/spec'), { recursive: true });
  fs.writeFileSync(path.join(root, 'docs/spec/api.md'), '# api\n');
  fs.mkdirSync(path.join(root, 'test/fixtures'));
  fs.writeFileSync(path.join(root, 'test/fixtures/tags.json'), '[]\n');
  const result = intent('exit', evidence);
  assert.match(result.nextAction, /这一轮改了 test\/tags\.test\.js：交付说明里要有一句写为什么改。/);
  assert.doesNotMatch(result.nextAction, /old\.test\.js|api\.md|tags\.json/);
  assert.match(result.nextAction, /交付说明里用一句话写这阶段测试改了什么、为什么/);
});
