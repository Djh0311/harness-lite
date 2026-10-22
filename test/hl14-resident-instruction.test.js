'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const test = require('node:test');
const install = require('../lib/install.js');
const io = require('../lib/io.js');
const previous = require('./fixtures/previous-13-snapshot.js');

// 2026-10-22: in real projects the AI kept rewriting AGENTS.md to record decisions. The user approved one
// sentence; everything else in the resident instruction stays the released 0.13 text byte for byte.
const ANCHOR = '按需审阅技能与常驻指令，冲突时说明来源。';
const SENTENCE = 'AGENTS.md 和 CLAUDE.md 由用户维护，用户明确要求才改；要长期记住的决定写进 docs/harness 的 plan 或 stage。';
const sourceRoot = path.resolve(__dirname, '..');

function released013(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hl14-instruction-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const source = path.join(root, 'released-013'), project = path.join(root, 'project');
  fs.mkdirSync(source); fs.mkdirSync(project);
  for (const row of previous.snapshot().files) {
    const file = path.join(source, row.path);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, Buffer.from(row.contentBase64, 'base64'), { mode: Number.parseInt(row.mode, 8) });
  }
  fs.writeFileSync(path.join(project, 'AGENTS.md'), 'User instruction before Harness\n', { mode: 0o640 });
  assert.equal(require(path.join(source, 'lib/install.js')).install(project, { write: true, source }).status, 'INSTALLED');
  return project;
}

test('the 0.14 instruction is the 0.13 text plus only the AGENTS.md sentence', () => {
  assert.equal(`sha256:${io.sha(install.PREVIOUS_13_INSTRUCTION)}`, install.PREVIOUS_13_SNAPSHOT.instructionBlockDigest);
  assert.equal(install.PREVIOUS_13_INSTRUCTION.split(ANCHOR).length, 2);
  assert.equal(install.INSTRUCTION, install.PREVIOUS_13_INSTRUCTION.replace(ANCHOR, ANCHOR + SENTENCE));
});

test('upgrading published 0.13 replaces its instruction block and uninstall restores the user text', (t) => {
  const project = released013(t);
  assert.ok(fs.readFileSync(path.join(project, 'AGENTS.md'), 'utf8').includes(install.PREVIOUS_13_INSTRUCTION));
  const result = install.install(project, { write: true, upgrade: true, source: sourceRoot });
  assert.equal(result.status, 'INSTALLED', result.reason);
  for (const name of ['AGENTS.md', 'CLAUDE.md']) {
    const upgraded = fs.readFileSync(path.join(project, name), 'utf8');
    assert.ok(upgraded.includes(install.INSTRUCTION), name);
    assert.ok(!upgraded.includes(install.PREVIOUS_13_INSTRUCTION), name);
  }
  assert.equal(install.verify06(project).ok, true);
  assert.equal(install.uninstall(project, { write: true }).status, 'UNINSTALLED');
  assert.equal(fs.readFileSync(path.join(project, 'AGENTS.md'), 'utf8'), 'User instruction before Harness\n');
  assert.equal(fs.existsSync(path.join(project, 'CLAUDE.md')), false);
});

test('the 0.14 code can still uninstall published 0.13 directly and restore the user text', (t) => {
  const project = released013(t);
  assert.equal(install.inspect(project).kind, 'previous-13-snapshot');
  assert.equal(install.uninstall(project, { write: true }).status, 'UNINSTALLED');
  assert.equal(fs.readFileSync(path.join(project, 'AGENTS.md'), 'utf8'), 'User instruction before Harness\n');
});

test('an edited 0.13 block is still refused on upgrade instead of being overwritten', (t) => {
  const project = released013(t), file = path.join(project, 'AGENTS.md');
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(ANCHOR, `${ANCHOR}AI 自己加的规则。`));
  const result = install.install(project, { write: true, upgrade: true, source: sourceRoot });
  assert.equal(result.status, 'HOLD');
  assert.match(result.reason, /unknown Harness instruction edit: AGENTS\.md/);
  assert.ok(fs.readFileSync(file, 'utf8').includes('AI 自己加的规则。'));
});
