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
const tree = require('../lib/tree.js');

// Real-host W1 (2026-10-22): on a fresh install the model read the README, called
// `--work-intent execute` four times and was refused with `intent:current` every
// time, because nothing it could see said how to create the stage and leaf.

function fresh(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hl14-guide-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  assert.equal(install.install(root, { write: true }).status, 'INSTALLED');
  return root;
}

function event(root, input) {
  const run = spawnSync(process.execPath, [path.join(root, install.RUNTIME, 'hooks/dispatcher.js')], {
    cwd: root, input: JSON.stringify(input), encoding: 'utf8', timeout: 30000,
  });
  assert.equal(run.status, 0, run.stderr);
  return run.stdout.trim() ? JSON.parse(run.stdout) : {};
}

function submit(root, turn = 'turn') {
  const input = { hook_event_name: 'UserPromptSubmit', session_id: 'session', turn_id: turn, prompt: 'start the second stage' };
  const output = event(root, input), state = hook.readTurn(root, input);
  return { input, context: output.hookSpecificOutput.additionalContext, receipt: state.receipt.receiptId };
}

function preTool(root, source, command) {
  return event(root, { hook_event_name: 'PreToolUse', session_id: source.input.session_id, turn_id: source.input.turn_id,
    tool_name: 'Bash', tool_input: { command } });
}

function workIntentLine(context) {
  return context.split('\n').find((line) => line.startsWith('WorkIntent：'));
}

function readmeExamples(root) {
  const text = fs.readFileSync(path.join(root, install.RUNTIME, 'hooks/README.md'), 'utf8');
  const start = text.indexOf('### 开工前：建 stage 和 leaf');
  assert.ok(start >= 0, 'README explains how to create the stage and leaf');
  const section = text.slice(start, text.indexOf('\n## ', start) >= 0 ? text.indexOf('\n## ', start) : undefined);
  const blocks = [...section.matchAll(/```md\n([\s\S]*?)```/g)].map((match) => match[1]);
  assert.equal(blocks.length, 2, 'one stage example and one leaf example');
  return { section, stage: blocks[0], leaf: blocks[1] };
}

test('without a usable current leaf the WorkIntent line says how to start and stays untruncated', (t) => {
  const root = fresh(t), source = submit(root), line = workIntentLine(source.context);
  assert.ok(line, source.context);
  assert.ok(line.includes(`sourceReceipt=${source.receipt}`), line);
  assert.match(line, /current leaf/);
  assert.match(line, /\.claude\/harness-lite\/hooks\/README\.md「开工前」/);
  assert.doesNotMatch(line, /truncated=true/);
});

test('with a current leaf the WorkIntent line carries the exact execute command that registers', (t) => {
  const root = fresh(t), examples = readmeExamples(root);
  fs.writeFileSync(path.join(root, 'docs/harness/stages/stage-two.md'), examples.stage);
  fs.writeFileSync(path.join(root, 'docs/harness/leaves/tags.md'), examples.leaf.replace('stage-<id>', 'stage-two'));
  const source = submit(root), line = workIntentLine(source.context);
  const command = hook.intentCommand({ sourceReceipt: source.receipt, action: 'execute' });
  assert.ok(line.includes(command), line);
  assert.doesNotMatch(line, /truncated=true/);
  assert.equal(preTool(root, source, command).hookSpecificOutput.permissionDecision, 'allow');
  assert.equal(authorization.read(root).value.leaf, 'docs/harness/leaves/tags.md');
});

test('the README examples parse into a healthy chain, including a work unit', (t) => {
  const root = fresh(t), examples = readmeExamples(root);
  assert.match(examples.section, /## 工作单元 A1 /);
  fs.writeFileSync(path.join(root, 'docs/harness/stages/stage-two.md'), examples.stage);
  fs.writeFileSync(path.join(root, 'docs/harness/unfinished/tags.md'),
    `${examples.leaf.replace('stage-<id>', 'stage-two')}\n## 工作单元 A1 标签存储\n目标：标签能保存\n完成标准：\n- 标签能保存\n依赖：无\n`);
  const planned = tree.readChain(root);
  assert.equal(planned.health.ok, true, JSON.stringify(planned.health));
  assert.equal(planned.unfinished.length, 1);
  assert.equal(planned.leaf, null);
  const source = submit(root);
  assert.equal(preTool(root, source, hook.intentCommand({ sourceReceipt: source.receipt, action: 'resume', leaf: 'tags' }))
    .hookSpecificOutput.permissionDecision, 'allow');
  const chain = tree.readChain(root);
  assert.equal(chain.health.ok, true);
  assert.equal(chain.stage.name, 'stage-two');
  assert.deepEqual(chain.leaf.completionStandards, ['一条可以直接验收的结果', '另一条可以直接验收的结果']);
  assert.deepEqual(chain.leaf.workUnits.map((unit) => unit.id), ['A1']);
  assert.equal(preTool(root, source, hook.intentCommand({ sourceReceipt: source.receipt, action: 'execute' }))
    .hookSpecificOutput.permissionDecision, 'allow');
});

test('an intent:current refusal says what is missing and where to fix it', (t) => {
  const root = fresh(t), source = submit(root);
  const output = preTool(root, source, hook.intentCommand({ sourceReceipt: source.receipt, action: 'execute' }));
  assert.equal(output.hookSpecificOutput.permissionDecision, 'deny');
  const reason = output.hookSpecificOutput.permissionDecisionReason;
  assert.match(reason, /intent:current/);
  assert.match(reason, /current leaf/);
  assert.match(reason, /「开工前」/);
  assert.match(reason, /unfinished/);
});

test('an inexact push is refused without asking the user for a confirmation that cannot authorize it', (t) => {
  const root = fresh(t), source = submit(root);
  const output = preTool(root, source, 'git push origin main');
  assert.equal(output.hookSpecificOutput.permissionDecision, 'deny');
  const reason = output.hookSpecificOutput.permissionDecisionReason;
  assert.doesNotMatch(reason, /是否允许这一次 push/);
  assert.match(reason, /HEAD:refs\/heads\//);
  const pushFile = path.join(root, 'docs/harness/usage/.turns/.push.json');
  assert.equal(fs.existsSync(pushFile) && JSON.parse(fs.readFileSync(pushFile, 'utf8')).pending ? 'pending' : 'none', 'none');
});
