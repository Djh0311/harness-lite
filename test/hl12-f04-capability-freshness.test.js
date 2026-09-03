'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const capabilities = require('../lib/capabilities.js');

const manifest = (models = [{ channel: 'cursor', model: 'current', reasoning: 'high', family: 'grok', status: 'available' }], extra = {}) => ({
  schemaVersion: 1, kind: capabilities.KIND, models, ...extra,
});
const temp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'hl12-f04-'));

test('HL12F04 stale unbound project file is UNKNOWN/incomplete', () => {
  const root = temp();
  try {
    const file = path.join(root, 'docs/harness/capabilities.json');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(manifest()));
    const value = capabilities.project(root);
    assert.equal(value.state, capabilities.UNKNOWN);
    assert.equal(value.modelsComplete, false);
    assert.equal(value.carrier.incompleteReason, 'project-file-no-live-source');
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('HL12F04 bound Hook input is fresh and carrier integrity is checked', () => {
  const root = temp();
  try {
    const opts = { writeDynamicCarrier: true, now: '2026-09-02T00:00:00.000Z', eventName: 'UserPromptSubmit', sessionId: 's1', turnId: 't1' };
    const value = capabilities.project(root, { ...opts, manifest: manifest() });
    assert.equal(value.state, 'known');
    assert.equal(value.modelsComplete, true);
    assert.deepEqual(value.carrier.binding, { project: fs.realpathSync(root), sessionId: 's1', turnId: 't1', eventName: 'UserPromptSubmit', source: 'hook-input' });
    const rel = value.carrier.path;
    assert.equal(capabilities.readDynamicCarrier(root, rel, opts).ok, true);
    assert.equal(capabilities.readDynamicCarrier(root, rel, { now: opts.now }).reason, 'missing-binding');
    const file = path.join(root, rel);
    const body = JSON.parse(fs.readFileSync(file, 'utf8'));
    body.projection.models[0].model = 'tampered';
    fs.writeFileSync(file, JSON.stringify(body));
    assert.equal(capabilities.readDynamicCarrier(root, rel, opts).reason, 'projection-digest-mismatch');
    for (const [field, value, reason] of [
      ['modelFields', ['tampered'], 'model-fields-mismatch'],
      ['sourceBytes', 1, 'source-bytes-mismatch'],
      ['binding', null, 'project-binding-mismatch'],
    ]) {
      const fresh = capabilities.project(root, { ...opts, manifest: manifest() });
      const target = path.join(root, fresh.carrier.path);
      const image = JSON.parse(fs.readFileSync(target, 'utf8'));
      image[field] = value;
      fs.writeFileSync(target, JSON.stringify(image));
      assert.equal(capabilities.readDynamicCarrier(root, fresh.carrier.path, opts).reason, reason);
    }
    const rebound = capabilities.project(root, { ...opts, manifest: manifest() });
    const reboundFile = path.join(root, rebound.carrier.path);
    const reboundImage = JSON.parse(fs.readFileSync(reboundFile, 'utf8'));
    delete reboundImage.binding;
    fs.writeFileSync(reboundFile, JSON.stringify(reboundImage));
    assert.equal(capabilities.readDynamicCarrier(root, rebound.carrier.path, opts).reason, 'project-binding-mismatch');
    for (const malformedBinding of [null, 3, 'binding', [], false]) {
      const malformed = capabilities.project(root, { ...opts, manifest: manifest() });
      const malformedFile = path.join(root, malformed.carrier.path);
      const malformedImage = JSON.parse(fs.readFileSync(malformedFile, 'utf8'));
      malformedImage.binding = malformedBinding;
      fs.writeFileSync(malformedFile, JSON.stringify(malformedImage));
      assert.doesNotThrow(() => capabilities.readDynamicCarrier(root, malformed.carrier.path, opts));
      assert.equal(capabilities.readDynamicCarrier(root, malformed.carrier.path, opts).ok, false);
    }
    for (const malformedModels of [null, {}, 'models']) {
      const malformed = capabilities.project(root, { ...opts, manifest: manifest() });
      const malformedFile = path.join(root, malformed.carrier.path);
      const malformedImage = JSON.parse(fs.readFileSync(malformedFile, 'utf8'));
      malformedImage.projection.models = malformedModels;
      fs.writeFileSync(malformedFile, JSON.stringify(malformedImage));
      assert.doesNotThrow(() => capabilities.readDynamicCarrier(root, malformed.carrier.path, opts));
      assert.equal(capabilities.readDynamicCarrier(root, malformed.carrier.path, opts).reason, 'invalid-carrier-shape');
    }
    const schema = capabilities.project(root, { ...opts, manifest: manifest() });
    const schemaFile = path.join(root, schema.carrier.path);
    const schemaImage = JSON.parse(fs.readFileSync(schemaFile, 'utf8'));
    schemaImage.schemaVersion = 2;
    fs.writeFileSync(schemaFile, JSON.stringify(schemaImage));
    assert.equal(capabilities.readDynamicCarrier(root, schema.carrier.path, opts).reason, 'invalid-carrier-shape');
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('HL12F04 wrong binding, stale/future metadata and unsafe carrier path fail closed', () => {
  const root = temp();
  try {
    const base = { writeDynamicCarrier: true, now: '2026-09-02T00:00:00.000Z', eventName: 'UserPromptSubmit', sessionId: 's1', turnId: 't1' };
    assert.equal(capabilities.project(root, { ...base, manifest: manifest([{ channel: 'cursor', model: 'bound', reasoning: 'high', family: 'grok', status: 'available' }], { binding: { sessionId: 'other', eventName: base.eventName, turnId: base.turnId, source: 'hook-input' } }) }).state, capabilities.UNKNOWN);
    const stale = manifest([{ channel: 'cursor', model: 'old', reasoning: 'high', family: 'grok', status: 'available' }], {
      freshness: { status: 'fresh', createdAt: '2026-09-01T00:00:00.000Z', expiresAt: '2026-09-01T00:01:00.000Z', ttlMs: 60000 },
    });
    assert.equal(capabilities.project(root, { ...base, manifest: stale }).reason, 'expired-freshness');
    const future = manifest([], { freshness: { status: 'fresh', createdAt: '2026-09-03T00:00:00.000Z', expiresAt: '2026-09-03T00:01:00.000Z', ttlMs: 60000 } });
    assert.equal(capabilities.project(root, { ...base, manifest: future }).reason, 'future-freshness');
    const wrongSource = manifest([{ channel: 'cursor', model: 'wrong-source', reasoning: 'high', family: 'grok', status: 'available' }], {
      provenance: { source: 'project-file' },
    });
    assert.equal(capabilities.project(root, { ...base, manifest: wrongSource }).reason, 'source-binding-mismatch');
    for (const malformed of [null, undefined, 3, 'manifest']) {
      assert.doesNotThrow(() => capabilities.project(root, { ...base, manifest: malformed }));
      assert.equal(capabilities.project(root, { ...base, manifest: malformed }).state, capabilities.UNKNOWN);
    }
    const bindingNullRoot = temp();
    try {
      const bindingNull = capabilities.project(bindingNullRoot, { ...base, writeDynamicCarrier: true, manifest: { ...manifest(), binding: null } });
      assert.equal(bindingNull.state, capabilities.UNKNOWN);
      assert.equal(fs.existsSync(path.join(bindingNullRoot, capabilities.DYNAMIC_CARRIER_RELATIVE_DIR)), false);
    } finally { fs.rmSync(bindingNullRoot, { recursive: true, force: true }); }
    for (const malformedProvenance of [null, 3, 'provenance', [], false, () => {}]) {
      assert.doesNotThrow(() => capabilities.project(root, { ...base, manifest: manifest([{ channel: 'cursor', model: 'bad-prov', reasoning: 'high', family: 'grok', status: 'available' }], { provenance: malformedProvenance }) }));
      assert.equal(capabilities.project(root, { ...base, manifest: manifest([{ channel: 'cursor', model: 'bad-prov', reasoning: 'high', family: 'grok', status: 'available' }], { provenance: malformedProvenance }) }).state, capabilities.UNKNOWN);
    }
    assert.equal(capabilities.project(root, { ...base, project: '', manifest: manifest() }).reason, 'project-binding-mismatch');
    assert.equal(capabilities.project(root, { ...base, manifest: manifest([{ channel: 'cursor', model: 'empty-project', reasoning: 'high', family: 'grok', status: 'available' }], { project: '' }) }).reason, 'project-binding-mismatch');
    const nestedBad = manifest([{ channel: 'cursor', model: 'nested-bad', reasoning: 'high', family: 'grok', status: 'available' }], {
      provenance: { binding: { project: 3, sessionId: base.sessionId, turnId: base.turnId, eventName: base.eventName, source: 'hook-input' } },
    });
    assert.equal(capabilities.project(root, { ...base, manifest: nestedBad }).reason, 'project-binding-mismatch');
    const directBad = manifest([{ channel: 'cursor', model: 'direct-bad', reasoning: 'high', family: 'grok', status: 'available' }], {
      provenance: { project: root, sessionId: 'other', turnId: base.turnId, eventName: base.eventName, source: 'hook-input' },
    });
    assert.equal(capabilities.project(root, { ...base, manifest: directBad }).reason, 'session-binding-mismatch');
    const directTypeBad = manifest([{ channel: 'cursor', model: 'direct-type-bad', reasoning: 'high', family: 'grok', status: 'available' }], {
      provenance: { project: root, sessionId: 7, turnId: base.turnId, eventName: base.eventName, source: 'hook-input' },
    });
    assert.equal(capabilities.project(root, { ...base, manifest: directTypeBad }).reason, 'session-binding-mismatch');
    const staticFile = path.join(root, '.codex/harness-lite/capabilities.json');
    fs.mkdirSync(path.dirname(staticFile), { recursive: true });
    fs.writeFileSync(staticFile, JSON.stringify(manifest([{ channel: 'cursor', model: 'self-asserted', reasoning: 'high', family: 'grok', status: 'available' }], {
      provenance: { source: 'project-file', project: root, binding: { eventName: base.eventName, sessionId: base.sessionId, turnId: base.turnId }, freshness: { status: 'fresh', createdAt: base.now, expiresAt: '2026-09-02T00:10:00.000Z', ttlMs: 600000 } },
    })));
    assert.equal(capabilities.project(root, { ...base }).reason, 'project-file-no-live-source');
    assert.equal(capabilities.project(root, { ...base, now: 'not-a-date', manifest: manifest() }).reason, 'invalid-freshness-now');
    assert.doesNotThrow(() => capabilities.project(root, { ...base, manifest: manifest(), now: Symbol('invalid') }));
    assert.equal(capabilities.project(root, { ...base, manifest: manifest(), now: Symbol('invalid') }).reason, 'invalid-freshness-now');
    assert.equal(capabilities.project(root, { ...base, manifest: manifest(), writeDynamicCarrier: false }).carrier.binding.project, fs.realpathSync(root));
    assert.equal(capabilities.readDynamicCarrier(root, '../escape.json', base).reason, 'unsafe-carrier-path');
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
