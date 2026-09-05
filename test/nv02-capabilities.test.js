'use strict';

const assert = require('assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const test = require('node:test');

const capabilities = require('../lib/capabilities.js');
const install = require('../lib/install.js');

const sha = (value) => crypto.createHash('sha256').update(value).digest('hex');

test('capability fixtures produce temporary projections without source changes', () => {
  const fixtureA = {
    schemaVersion: 1,
    kind: capabilities.KIND,
    models: [
      { channel: 'cursor', model: 'writer-a', reasoning: ['low', 'xhigh'], family: 'grok', status: 'available', capabilities: ['agent-writer'] },
      { channel: 'frontend', model: 'visual-b', reasoning: 'high', family: 'gemini', status: 'unavailable', capabilities: ['ui'] },
    ],
  };
  const fixtureB = {
    schemaVersion: 1,
    kind: capabilities.KIND,
    models: [
      { channel: 'recovery-a', model: 'terra-a', reasoning: 'xhigh', family: 'terra', status: 'available' },
      { channel: 'recovery-b', model: 'sol-a', reasoning: 'xhigh', family: 'sol', status: 'available' },
      { channel: 'other', model: 'plain-a', reasoning: 'medium', family: 'unknown', status: 'unknown' },
    ],
  };

  assert.deepEqual(capabilities.normalizeManifest(fixtureA).models.map((item) => ({
    channel: item.channel,
    model: item.model,
    reasoning: item.reasoning,
    family: item.family,
    status: item.status,
    availability: item.availability.status,
    capabilities: item.capabilities,
    suitability: item.suitability,
  })), [
    { channel: 'cursor', model: 'writer-a', reasoning: 'low', family: 'grok', status: 'available', availability: 'available', capabilities: ['agent-writer'], suitability: ['engineering'] },
    { channel: 'cursor', model: 'writer-a', reasoning: 'xhigh', family: 'grok', status: 'available', availability: 'available', capabilities: ['agent-writer'], suitability: ['engineering'] },
    { channel: 'frontend', model: 'visual-b', reasoning: 'high', family: 'gemini', status: 'unavailable', availability: 'unavailable', capabilities: ['ui'], suitability: ['frontend'] },
  ]);

  assert.deepEqual(capabilities.normalizeManifest(fixtureB).models.map((item) => ({
    channel: item.channel,
    model: item.model,
    reasoning: item.reasoning,
    family: item.family,
    status: item.status,
    suitability: item.suitability,
  })), [
    { channel: 'other', model: 'plain-a', reasoning: 'medium', family: 'unclassified', status: 'UNKNOWN', suitability: [] },
    { channel: 'recovery-a', model: 'terra-a', reasoning: 'xhigh', family: 'terra', status: 'available', suitability: ['problem-recovery'] },
    { channel: 'recovery-b', model: 'sol-a', reasoning: 'xhigh', family: 'sol', status: 'available', suitability: ['problem-recovery'] },
  ]);
});

test('missing empty and invalid manifests fail closed to UNKNOWN', () => {
  for (const [name, value, reason] of [
    ['missing', null, 'missing'],
    ['empty', { schemaVersion: 1, kind: capabilities.KIND, models: [] }, 'empty'],
    ['wrong-kind', { schemaVersion: 1, kind: 'other', models: [] }, 'invalid-shape'],
    ['wrong-shape', { schemaVersion: 1, kind: capabilities.KIND, entries: [] }, 'invalid-shape'],
  ]) {
    const projected = capabilities.normalizeManifest(value);
    assert.equal(projected.state, 'UNKNOWN', name);
    assert.equal(projected.reason, reason, name);
    assert.deepEqual(projected.models, [{
      channel: 'UNKNOWN',
      model: 'UNKNOWN',
      reasoning: 'UNKNOWN',
      family: 'unclassified',
      status: 'UNKNOWN',
      availability: { status: 'UNKNOWN' },
      capabilities: [],
      suitability: [],
    }], name);
  }
});

test('model names do not infer availability or family', () => {
  const projected = capabilities.normalizeManifest({
    schemaVersion: 1,
    kind: capabilities.KIND,
    models: [
      { channel: 'looks-like-grok', model: 'grok-claims-available', reasoning: 'xhigh' },
    ],
  });
  assert.equal(projected.state, 'known');
  assert.equal(projected.models[0].family, 'unclassified');
  assert.equal(projected.models[0].status, 'UNKNOWN');
  assert.equal(projected.models[0].availability.status, 'UNKNOWN');
  assert.deepEqual(projected.models[0].suitability, []);
});

test('different channels can share an explicit family', () => {
  const projected = capabilities.normalizeManifest({
    schemaVersion: 1,
    kind: capabilities.KIND,
    models: [
      { channel: 'cursor-grok', model: 'writer-a', reasoning: 'xhigh', family: 'grok', status: 'available' },
      { channel: 'build-grok', model: 'writer-b', reasoning: 'xhigh', family: 'grok', status: 'unavailable' },
    ],
  });
  assert.deepEqual(projected.models.map((item) => ({
    channel: item.channel,
    family: item.family,
    status: item.status,
    suitability: item.suitability,
  })), [
    { channel: 'build-grok', family: 'grok', status: 'unavailable', suitability: ['engineering'] },
    { channel: 'cursor-grok', family: 'grok', status: 'available', suitability: ['engineering'] },
  ]);
});

test('0.11 instruction is a short event-routed kernel and preserves the exact 0.10 block', () => {
  const text = install.INSTRUCTION;
  for (const needle of [
    'Harness Lite 面向 GPT-6 Astra',
    '用户指令决定目标、范围和权限',
    '直接证据判断用户结果',
    '只有 accepted 才解锁真实依赖它的下游',
    '缺结果保持 complete=false、productResult=incomplete',
    '表达先给结论，再给证据和缺口',
  ]) {
    assert.ok(text.includes(needle), needle);
  }
  assert.equal(text.split('\n').slice(1, -1).join('\n').length <= 900, true);
  for (const forbidden of ['300000', 'Grok', 'Gemini', 'Terra', 'Sol', 'provider', 'reported_complete', '旧系统', 'push']) {
    assert.equal(text.includes(forbidden), false, forbidden);
  }
  assert.equal(sha(install.PREVIOUS_10_INSTRUCTION), '347f45809f37d6c8d8476d97cc8e32c37eff5fac334f178a770484d838e2c090');
});

test('instructionPlan migrates exact old 0.9.1 current block and holds unknown edits', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hl-nv02-instruction-'));
  try {
    fs.writeFileSync(path.join(root, 'AGENTS.md'), `${install.PREVIOUS_09_INSTRUCTION}\n`);
    let plan = install.instructionPlan(root);
    assert.equal(plan.ok, true);
    assert.equal(plan.rows.find((row) => path.basename(row.file) === 'AGENTS.md').text, `${install.INSTRUCTION}\n`);

    fs.writeFileSync(path.join(root, 'AGENTS.md'), install.PREVIOUS_09_INSTRUCTION.replace('当前用户指令高于', '当前用户指令略高于'));
    plan = install.instructionPlan(root);
    assert.equal(plan.ok, false);
    assert.match(plan.reason, /unknown Harness instruction edit/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('historical instructions and official records stay byte stable', () => {
  assert.equal(sha(install.PREVIOUS_09_INSTRUCTION), 'a2af0dc1023aa4b446782273d21236ff49fc54462977f493b8062da984505eda');
  assert.equal(sha(install.PREVIOUS_06_INSTRUCTION), 'ff7591b87500d31e2fc1400052db4c1e10efb396db881e52642a6ca73f900b4c');
  assert.equal(sha(install.PREVIOUS_07_INSTRUCTION), '4a87ff5ab56331b588057614ab5f1c824589017088b38404ea4923bbc3fe9320');
  assert.equal(sha(install.PREVIOUS_08_INSTRUCTION), '38e26a67b8421fed27bb131943ee48d307aec64dae91e82cf3abd9be4829bf36');
  assert.equal(sha(install.PREVIOUS_08_COMPLETION_INSTRUCTION), 'e2181c9ecdfe38f0c4b4a84ed9b53ec8d2ed2da902d16d71f4c70cbd01efd51d');
  assert.equal(sha(JSON.stringify(install.OFFICIAL_06)), '613aa93d193fbe0c2bcfc6a56fecd55c46ebb76d48a79f20b37ff56c15678221');
  assert.equal(sha(JSON.stringify(install.OFFICIAL_07)), '8d31367eba157fbc9045fbff2689967b4821ade02427c0b02e09a6abcd174343');
  assert.equal(sha(JSON.stringify(install.OFFICIAL_08)), '2b627c072a792ace381ce17300d64bb5230dbb7828808a28dc0f90a34a815f28');
});
