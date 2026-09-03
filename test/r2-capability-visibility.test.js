'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const test = require('node:test');

const capabilities = require('../lib/capabilities.js');
const install = require('../lib/install.js');

const sourceRoot = path.resolve(__dirname, '..');
const manifestRel = '.codex/harness-lite/capabilities.json';

function tempRoot(prefix = 'hl-r2-capability-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function writeManifest(root, models) {
  const file = path.join(root, manifestRel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify({
    schemaVersion: 1,
    kind: capabilities.KIND,
    models,
  }, null, 2)}\n`);
  return file;
}
function hookManifest(models) {
  return { schemaVersion: 1, kind: capabilities.KIND, models };
}

function threeModelManifest() {
  return [
    {
      channel: 'cursor',
      model: 'Grok 4.6 High',
      reasoning: 'high',
      family: 'grok',
      status: 'available',
      capabilities: ['agent-writer'],
    },
    {
      channel: 'grokbuild',
      model: 'Grok 4.6 High',
      reasoning: 'high',
      family: 'grok',
      status: 'available',
      capabilities: ['build-writer'],
    },
    {
      channel: 'antigravity',
      model: 'Gemini 3.7 Flash High',
      reasoning: 'high',
      family: 'gemini',
      status: 'available',
      capabilities: ['frontend'],
    },
  ];
}

function assertCarrier(projection, count, source = manifestRel) {
  assert.equal(projection.state, 'known');
  assert.equal(projection.modelsComplete, true);
  assert.equal(projection.modelCount, count);
  assert.equal(projection.carrier.kind, capabilities.CARRIER_KIND);
  assert.equal(projection.carrier.complete, true);
  assert.equal(projection.carrier.incompleteReason, null);
  assert.equal(projection.carrier.modelCount, count);
  assert.equal(projection.carrier.source, source);
  if (source === 'hook-input') assert.match(projection.carrier.path, /^\.codex\/harness-lite\/caps\/c-[0-9a-f]{32}\.json$/);
  else assert.equal(projection.carrier.path, source);
  assert.deepEqual(projection.carrier.modelFields, capabilities.MODEL_FIELDS);
  assert.match(projection.carrier.projectionDigest, /^sha256:[0-9a-f]{64}$/);
  assert.match(projection.carrier.manifestDigest, /^sha256:[0-9a-f]{64}$/);
  assert.equal(projection.carrier.read.type, 'project-relative-json');
  if (source === 'hook-input') assert.equal(projection.carrier.read.path, projection.carrier.path);
  else assert.equal(projection.carrier.read.path, source);
}

function installProject(root) {
  const result = install.install(root, { write: true, source: sourceRoot });
  assert.equal(result.status, 'INSTALLED', JSON.stringify(result.differences || []));
  const checked = install.verify06(root);
  assert.equal(checked.ok, true, checked.differences.join(','));
}

function writePredispatchState(root) {
  const stageDir = path.join(root, 'docs', 'harness', 'stages');
  const leafDir = path.join(root, 'docs', 'harness', 'leaves');
  fs.mkdirSync(stageDir, { recursive: true });
  fs.mkdirSync(leafDir, { recursive: true });
  fs.writeFileSync(path.join(stageDir, 'stage-r2-capability.md'), '# R2 Capability Stage\n\n不许动：\n\n- push\n');
  fs.writeFileSync(path.join(leafDir, 'R2CAP.md'), [
    '# R2 Capability Leaf',
    '',
    '阶段：stage-r2-capability',
    '目标：project current capability visibility before dispatch',
    '',
    '完成标准：',
    '',
    '- every current structured capability row is visible',
    '',
    '## R2F01',
    '',
    '目标：select current model',
    'completionStandards：all current structured models are readable',
    'dependencies：无',
  ].join('\n'));
}

function dispatchInstalled(root, input) {
  const result = spawnSync(process.execPath, [path.join(root, install.RUNTIME, 'hooks/dispatcher.js')], {
    cwd: root,
    input: `${JSON.stringify(input)}\n`,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return JSON.parse(result.stdout).hookSpecificOutput.additionalContext;
}

test('R2 direct projection preserves every dynamic manifest model without name inference', () => {
  const projected = capabilities.project('/tmp/not-read', {
    manifest: hookManifest([
      ...threeModelManifest(),
      { channel: 'name-only', model: 'Grok name-only candidate', reasoning: 'high', status: 'available' },
    ]),
    eventName: 'UserPromptSubmit', sessionId: 'r2-direct', turnId: 'r2-direct-turn', writeDynamicCarrier: false,
  });

  assert.equal(projected.models.length, 4);
  assert.deepEqual(projected.models.map((model) => ({
    channel: model.channel,
    model: model.model,
    reasoning: model.reasoning,
    family: model.family,
    status: model.status,
    availability: model.availability.status,
  })), [
    { channel: 'antigravity', model: 'Gemini 3.7 Flash High', reasoning: 'high', family: 'gemini', status: 'available', availability: 'available' },
    { channel: 'cursor', model: 'Grok 4.6 High', reasoning: 'high', family: 'grok', status: 'available', availability: 'available' },
    { channel: 'grokbuild', model: 'Grok 4.6 High', reasoning: 'high', family: 'grok', status: 'available', availability: 'available' },
    { channel: 'name-only', model: 'Grok name-only candidate', reasoning: 'high', family: 'unclassified', status: 'available', availability: 'available' },
  ]);
  assert.deepEqual(projected.models.filter((model) => model.model === 'Grok 4.6 High').map((model) => model.channel), ['cursor', 'grokbuild']);
  assert.equal(projected.carrier.sourceType, 'hook-input');
  assert.equal(projected.carrier.read.type, 'embedded-projection');
  assert.equal(projected.carrier.modelCount, 4);
});

test('R2 project carrier records a complete readable projection for larger manifests', () => {
  const root = tempRoot();
  try {
    const rows = Array.from({ length: 40 }, (_, index) => ({
      channel: `channel-${String(index).padStart(2, '0')}`,
      model: `Model ${String(index).padStart(2, '0')}`,
      reasoning: index % 2 === 0 ? 'high' : 'xhigh',
      family: index % 3 === 0 ? 'grok' : index % 3 === 1 ? 'gemini' : 'terra',
      status: index % 5 === 0 ? 'unavailable' : 'available',
      capabilities: [`cap-${index}`],
    }));
    const projected = capabilities.project(root, {
      manifest: hookManifest(rows), eventName: 'UserPromptSubmit', sessionId: 'r2-project', turnId: 'r2-project-turn',
      writeDynamicCarrier: true, now: '2026-09-02T00:00:00.000Z',
    });
    assertCarrier(projected, 40, 'hook-input');
    assert.equal(projected.models.at(0).channel, 'channel-00');
    assert.equal(projected.models.at(-1).channel, 'channel-39');
    assert.equal(projected.carrier.manifestBytes < capabilities.MAX_MANIFEST_BYTES, true);
    assert.equal(fs.existsSync(path.join(root, projected.carrier.read.path)), true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('R2 oversize manifest fails closed with explicit incomplete carrier metadata', () => {
  const root = tempRoot('hl-r2-capability-oversize-');
  try {
    const file = path.join(root, manifestRel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify({
      schemaVersion: 1,
      kind: capabilities.KIND,
      padding: 'x'.repeat(capabilities.MAX_MANIFEST_BYTES),
      models: threeModelManifest(),
    }));

    const projected = capabilities.project(root);
    assert.equal(projected.state, 'UNKNOWN');
    assert.equal(projected.reason, 'manifest-too-large');
    assert.equal(projected.modelsComplete, false);
    assert.equal(projected.modelCount, 0);
    assert.equal(projected.carrier.complete, false);
    assert.equal(projected.carrier.incompleteReason, 'manifest-too-large');
    assert.equal(projected.carrier.source, manifestRel);
    assert.equal(projected.carrier.manifestDigest, null);
    assert.equal(projected.carrier.manifestBytes > capabilities.MAX_MANIFEST_BYTES, true);
    assert.equal(projected.carrier.read.type, 'project-relative-json');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('R2 installed runtime capability API exposes all manifest rows through the carrier', () => {
  const root = tempRoot('hl-r2-capability-installed-');
  try {
    const rows = [
      ...threeModelManifest(),
      { channel: 'name-only', model: 'Grok label cannot classify', reasoning: 'high', status: 'available' },
    ];
    writeManifest(root, rows);
    installProject(root);
    writePredispatchState(root);
    const installedCapabilities = require(path.join(root, install.RUNTIME, 'lib/capabilities.js'));
    const staleProject = installedCapabilities.project(root);
    assert.equal(staleProject.state, capabilities.UNKNOWN);
    assert.equal(staleProject.modelsComplete, false);

    const dynamic = hookManifest(rows);
    const start = dispatchInstalled(root, { hook_event_name: 'SessionStart', cwd: root, session_id: 'r2-capability-start', capability_manifest: dynamic });
    const prompt = dispatchInstalled(root, {
      hook_event_name: 'UserPromptSubmit',
      cwd: root,
      session_id: 'r2-capability-prompt',
      turn_id: 'turn-r2-capability',
      prompt: 'R2 capability visibility sentinel',
      capability_manifest: dynamic,
    });
    assert.ok(start.includes('source=hook-input'), start);
    assert.ok(prompt.includes('source=hook-input'), prompt);

    const projected = installedCapabilities.project(root, {
      manifest: dynamic, eventName: 'UserPromptSubmit', sessionId: 'r2-capability-prompt', turnId: 'turn-r2-capability',
      writeDynamicCarrier: true, now: '2026-09-02T00:00:00.000Z',
    });
    assertCarrier(projected, 4, 'hook-input');
    assert.deepEqual(projected.models.map((model) => [model.channel, model.model, model.family, model.status]), [
      ['antigravity', 'Gemini 3.7 Flash High', 'gemini', 'available'],
      ['cursor', 'Grok 4.6 High', 'grok', 'available'],
      ['grokbuild', 'Grok 4.6 High', 'grok', 'available'],
      ['name-only', 'Grok label cannot classify', 'unclassified', 'available'],
    ]);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
