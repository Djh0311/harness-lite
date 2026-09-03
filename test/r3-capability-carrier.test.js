'use strict';

const assert = require('assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const test = require('node:test');

const capabilities = require('../lib/capabilities.js');
const install = require('../lib/install.js');

const sourceRoot = path.resolve(__dirname, '..');
const projectManifestRel = '.codex/harness-lite/capabilities.json';

function sha(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function tempRoot(prefix = 'hl-r3-capability-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function run(command, args, opts = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', ...opts });
  assert.equal(result.status, 0, `${command} ${args.join(' ')}\n${result.stderr || result.stdout}`);
  return result;
}

function installProject(root) {
  fs.mkdirSync(path.join(root, 'docs/harness/stages'), { recursive: true });
  fs.mkdirSync(path.join(root, 'docs/harness/leaves'), { recursive: true });
  fs.writeFileSync(path.join(root, 'docs/harness/plan.md'), '# Capability Plan\n\n目标：event-routed capability\n');
  fs.writeFileSync(path.join(root, 'docs/harness/stages/stage-cap.md'), '# Capability Stage\n\n目标：event-routed capability\n');
  fs.writeFileSync(path.join(root, 'docs/harness/leaves/CAP01.md'), [
    '# Capability Leaf', '', '阶段：stage-cap', '', '目标：event-routed capability', '',
    '完成标准：', '', '- capability is projected only for dispatch', '',
    '## Work Unit CAP01', '', 'goal: dispatch capability', '', 'completionStandards:', '',
    '- selected model is visible from the current structured manifest', '', 'dependencies:', '', '- 无', '',
    'allowed:', '', '- lib/capabilities.js', '', 'forbidden:', '', '- release', '',
    'authorityDesign:', '', '- dynamic capability contract', '', 'facts:', '', '- Hook input is structured', '',
    'entryPoints:', '', '- hooks/dispatcher.js', '', 'disprovenRoutes:', '', '- static catalog', '',
    'unknowns:', '', '- none', '', 'routeBasis: dispatch event requires current capability', '',
    'resultContract: report the complete carrier',
  ].join('\n'));
  const result = install.install(root, { write: true, source: sourceRoot });
  assert.equal(result.status, 'INSTALLED', JSON.stringify(result.differences || []));
  const checked = install.verify06(root);
  assert.equal(checked.ok, true, JSON.stringify(checked.differences || []));
}

function dispatchInstalled(root, input) {
  const result = run(process.execPath, [path.join(root, install.RUNTIME, 'hooks/dispatcher.js')], {
    cwd: root,
    input: `${JSON.stringify(input)}\n`,
  });
  return JSON.parse(result.stdout).hookSpecificOutput.additionalContext;
}

function writeProjectManifest(root) {
  const file = path.join(root, projectManifestRel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify({
    schemaVersion: 1,
    kind: capabilities.KIND,
    models: [
      { channel: 'project-a', model: 'manifest-a', reasoning: 'low', family: 'grok', status: 'available' },
      { channel: 'project-b', model: 'manifest-b', reasoning: 'high', family: 'gemini', status: 'available' },
      { channel: 'project-c', model: 'manifest-c', reasoning: 'xhigh', family: 'terra', status: 'unavailable' },
    ],
  }, null, 2)}\n`);
}

function fiveHookModels() {
  return [
    { channel: 'cursor', model: 'grok', reasoning: 'high', family: 'grok', status: 'available' },
    { channel: 'grokbuild', model: 'grok', reasoning: 'high', family: 'grok', status: 'available' },
    { channel: 'antigravity', model: 'gemini', reasoning: 'high', family: 'gemini', status: 'available' },
    { channel: 'codex', model: 'terra', reasoning: 'xhigh', family: 'terra', status: 'available' },
    { channel: 'codex', model: 'sol', reasoning: 'xhigh', family: 'sol', status: 'available' },
  ];
}

function hookManifest(models, extra = {}) {
  return { schemaVersion: 1, kind: capabilities.KIND, ...extra, models };
}

function manyHookModels(count) {
  const families = ['grok', 'gemini', 'terra', 'sol'];
  return Array.from({ length: count }, (_, index) => ({
    channel: `channel-${String(index).padStart(2, '0')}`,
    model: `model-${String(index).padStart(2, '0')}`,
    reasoning: index % 2 === 0 ? 'high' : 'xhigh',
    family: families[index % families.length],
    status: index % 7 === 0 ? 'unavailable' : 'available',
    capabilities: [`cap-${index}`],
  }));
}

function carrierRel(context) {
  const line = context.split('\n').find((row) => row.startsWith('CapabilityCarrier：') && row.includes('read=project-relative-json'));
  assert.ok(line, context);
  if (line.includes('read=project-relative-json:')) return line.split('read=project-relative-json:')[1].split('；')[0];
  return line.split('path=')[1].split('；')[0];
}

function readCarrierInFreshProcess(root, rel) {
  const script = `
const fs = require("fs");
const crypto = require("crypto");
const path = require("path");
const rel = process.argv[1];
if (path.isAbsolute(rel) || rel.split(/[\\\\/]/).includes("..")) throw new Error("unsafe rel");
const value = JSON.parse(fs.readFileSync(path.join(process.cwd(), rel), "utf8"));
function sha(value) { return crypto.createHash("sha256").update(String(value)).digest("hex"); }
function projectionPayload(projection) {
  return {
    schemaVersion: projection.schemaVersion,
    kind: projection.kind,
    state: projection.state,
    reason: projection.reason,
    models: projection.models || []
  };
}
process.stdout.write(JSON.stringify({
  schemaVersion: value.schemaVersion,
  kind: value.kind,
  source: value.source,
  sourceType: value.sourceType,
  eventName: value.eventName,
  sessionId: value.sessionId,
  turnId: value.turnId,
  modelCount: value.modelCount,
  modelFields: value.modelFields,
  sourceDigest: value.sourceDigest,
  sourceBytes: value.sourceBytes,
  projectionDigest: value.projectionDigest,
  digestMatches: value.projectionDigest === "sha256:" + sha(JSON.stringify(projectionPayload(value.projection))),
  freshness: value.freshness,
  models: value.projection.models.map((model) => ({
    channel: model.channel,
    model: model.model,
    reasoning: model.reasoning,
    family: model.family,
    status: model.status,
    availability: model.availability.status
  }))
}));
`;
  return JSON.parse(run(process.execPath, ['-e', script, rel], { cwd: root }).stdout);
}

function assertCarrierFile(value, models, eventName) {
  assert.equal(value.schemaVersion, 1);
  assert.equal(value.kind, capabilities.CARRIER_KIND);
  assert.equal(value.source, 'hook-input');
  assert.equal(value.sourceType, 'hook-input');
  assert.equal(value.eventName, eventName);
  assert.equal(value.modelCount, models.length);
  assert.deepEqual(value.modelFields, capabilities.MODEL_FIELDS);
  assert.match(value.sourceDigest, /^sha256:[0-9a-f]{64}$/);
  assert.equal(value.sourceDigest, `sha256:${sha(JSON.stringify(hookManifest(models)))}`);
  assert.match(value.projectionDigest, /^sha256:[0-9a-f]{64}$/);
  assert.equal(value.digestMatches, true);
  assert.equal(value.freshness.status, 'fresh');
  assert.equal(value.freshness.ttlMs, capabilities.DYNAMIC_CARRIER_TTL_MS);
  assert.equal(Date.parse(value.freshness.expiresAt) > Date.parse(value.freshness.createdAt), true);
}

test('R3 Hook-input five-model carrier overrides a project manifest and is readable after installed dispatcher exit', () => {
  const root = tempRoot();
  try {
    writeProjectManifest(root);
    installProject(root);
    const manifest = hookManifest(fiveHookModels());

    const contexts = [
      ['SessionStart', dispatchInstalled(root, { hook_event_name: 'SessionStart', cwd: root, session_id: 'r3-five-start', capability_manifest: manifest })],
      ['UserPromptSubmit', dispatchInstalled(root, {
        hook_event_name: 'UserPromptSubmit',
        cwd: root,
        session_id: 'r3-five-prompt',
        turn_id: 'r3-five-turn',
        prompt: 'R3 five-model dynamic carrier',
        capability_manifest: manifest,
      })],
    ];

    for (const [eventName, context] of contexts) {
      assert.equal(context.length <= 1800, true, context.length);
      assert.ok(context.includes('Capabilities：state=known'), context);
      assert.ok(context.includes('modelCount=5；source=hook-input；carrier=project-relative-json:'), context);
      assert.ok(context.includes('CapabilityModelsCarrier：carrierBacked=5/5；carrier=project-relative-json:'), context);
      assert.ok(context.includes('CapabilityCarrier：complete=true；modelsComplete=true；modelCount=5；incomplete=none'), context);
      assert.equal(context.includes('CapabilityModelsInline'), false, context);
      assert.equal(context.includes('shown=0/5'), false, context);
      assert.equal(context.includes('modelCount=3；source=.codex/harness-lite/capabilities.json'), false, context);
      assert.equal(context.includes('embedded-projection:embedded'), false, context);

      const carrier = readCarrierInFreshProcess(root, carrierRel(context));
      assertCarrierFile(carrier, fiveHookModels(), eventName);
      assert.deepEqual(carrier.models, [
        { channel: 'antigravity', model: 'gemini', reasoning: 'high', family: 'gemini', status: 'available', availability: 'available' },
        { channel: 'codex', model: 'sol', reasoning: 'xhigh', family: 'sol', status: 'available', availability: 'available' },
        { channel: 'codex', model: 'terra', reasoning: 'xhigh', family: 'terra', status: 'available', availability: 'available' },
        { channel: 'cursor', model: 'grok', reasoning: 'high', family: 'grok', status: 'available', availability: 'available' },
        { channel: 'grokbuild', model: 'grok', reasoning: 'high', family: 'grok', status: 'available', availability: 'available' },
      ]);
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('R3 Hook-input twenty-four-model carrier remains complete across dispatcher exit and changes after model edits', () => {
  const root = tempRoot('hl-r3-capability-24-');
  try {
    installProject(root);
    const models24 = manyHookModels(24);
    const context24 = dispatchInstalled(root, {
      hook_event_name: 'SessionStart',
      cwd: root,
      session_id: 'r3-24-start',
      capability_manifest: hookManifest(models24),
    });
    assert.equal(context24.length <= 1800, true, context24.length);
    assert.ok(context24.includes('modelsComplete=true；modelCount=24；source=hook-input；carrier=project-relative-json:'), context24);
    assert.ok(context24.includes('CapabilityModelsCarrier：carrierBacked=24/24；carrier=project-relative-json:'), context24);
    assert.ok(context24.includes('CapabilityCarrier：complete=true；modelsComplete=true；modelCount=24；incomplete=none'), context24);
    assert.equal(context24.includes('CapabilityModelsInline'), false, context24);
    assert.equal(context24.includes('shown=0/24'), false, context24);
    assert.equal(context24.includes('embedded-projection:embedded'), false, context24);

    const rel24 = carrierRel(context24);
    const carrier24 = readCarrierInFreshProcess(root, rel24);
    assertCarrierFile(carrier24, models24, 'SessionStart');
    assert.equal(carrier24.models.length, 24);
    assert.deepEqual(carrier24.models.at(0), {
      channel: 'channel-00',
      model: 'model-00',
      reasoning: 'high',
      family: 'grok',
      status: 'unavailable',
      availability: 'unavailable',
    });
    assert.deepEqual(carrier24.models.at(-1), {
      channel: 'channel-23',
      model: 'model-23',
      reasoning: 'xhigh',
      family: 'sol',
      status: 'available',
      availability: 'available',
    });

    const models23 = models24.slice(1);
    const context23 = dispatchInstalled(root, {
      hook_event_name: 'UserPromptSubmit',
      cwd: root,
      session_id: 'r3-23-prompt',
      turn_id: 'r3-23-turn',
      prompt: 'R3 carrier changes after one model is removed',
      capability_manifest: hookManifest(models23),
    });
    const rel23 = carrierRel(context23);
    const carrier23 = readCarrierInFreshProcess(root, rel23);
    assert.notEqual(rel23, rel24);
    assert.notEqual(carrier23.sourceDigest, carrier24.sourceDigest);
    assert.notEqual(carrier23.projectionDigest, carrier24.projectionDigest);
    assert.equal(carrier23.modelCount, 23);
    assert.equal(carrier23.models.length, 23);
    assert.equal(context23.includes('modelCount=23；source=hook-input；carrier=project-relative-json:'), true, context23);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('R3 oversize Hook-input manifest fails closed instead of claiming a complete carrier', () => {
  const root = tempRoot('hl-r3-capability-oversize-');
  try {
    installProject(root);
    const context = dispatchInstalled(root, {
      hook_event_name: 'SessionStart',
      cwd: root,
      session_id: 'r3-oversize',
      capability_manifest: hookManifest(fiveHookModels(), { padding: 'x'.repeat(capabilities.MAX_HOOK_INPUT_BYTES) }),
    });

    assert.equal(context.length <= 1800, true, context.length);
    assert.ok(context.includes('Capabilities：state=UNKNOWN'), context);
    assert.ok(context.includes('source=hook-input'), context);
    assert.ok(context.includes('CapabilityCarrier：complete=false；modelsComplete=false；modelCount=0；incomplete=hook-input-manifest-too-large；path=hook-input；read=none'), context);
    assert.ok(context.includes(`manifestBytes=`), context);
    assert.ok(context.includes(`/${capabilities.MAX_MANIFEST_BYTES}`), context);
    assert.equal(context.includes('CapabilityCarrier：complete=true'), false, context);
    assert.equal(context.includes('read=project-relative-json'), false, context);
    assert.equal(fs.existsSync(path.join(root, capabilities.DYNAMIC_CARRIER_RELATIVE_DIR)), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('R3 unsafe Hook-input carrier directory fails closed without following symlinks', () => {
  const root = tempRoot('hl-r3-capability-unsafe-dir-');
  try {
    installProject(root);
    const carrierDir = path.join(root, capabilities.DYNAMIC_CARRIER_RELATIVE_DIR);
    fs.mkdirSync(path.dirname(carrierDir), { recursive: true });
    fs.symlinkSync(os.tmpdir(), carrierDir, 'dir');

    const context = dispatchInstalled(root, {
      hook_event_name: 'SessionStart',
      cwd: root,
      session_id: 'r3-unsafe-carrier-dir',
      capability_manifest: hookManifest(fiveHookModels()),
    });

    assert.equal(context.length <= 1800, true, context.length);
    assert.ok(context.includes('Capabilities：state=UNKNOWN'), context);
    assert.ok(context.includes('CapabilityCarrier：complete=false；modelsComplete=false；modelCount=0；incomplete=unsafe-carrier-dir'), context);
    assert.ok(context.includes('path=.codex/harness-lite/caps/c-'), context);
    assert.ok(context.includes('read=none'), context);
    assert.equal(context.includes('CapabilityCarrier：complete=true'), false, context);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
