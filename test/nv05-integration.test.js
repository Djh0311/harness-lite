'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const test = require('node:test');

const evidence = require('../lib/evidence.js');
const install = require('../lib/install.js');
const io = require('../lib/io.js');
const managed = require('../lib/managed.js');
const builder = require('../scripts/build-candidate.js');
const previous09Fixture = require('./fixtures/previous-09-snapshot.js');

const sourceRoot = path.resolve(__dirname, '..');
const gitEnv = { PATH: '/usr/bin:/bin', LANG: 'C', LC_ALL: 'C' };

function temp(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

const previousDesiredMode = (rel) => rel === 'bin/hl.js' || rel === 'hooks/dispatcher.js' ? 0o755 : 0o644;

function assertPrevious09SnapshotSource(root) {
  const snapshot = install.PREVIOUS_09_SNAPSHOT;
  assert.deepEqual(install.runtimePaths(root), snapshot.managedPaths);
  assert.equal(fs.existsSync(path.join(root, 'lib/capabilities.js')), false);
  assert.equal(fs.existsSync(path.join(root, 'lib/delegation.js')), false);
  assert.equal(io.digest(root, snapshot.managedPaths, previousDesiredMode), snapshot.packageDigest);
  for (const row of snapshot.files) {
    const item = io.inspect(root, row.path);
    assert.equal(item.type, 'file', row.path);
    assert.equal(item.mode, row.mode, row.path);
    const body = fs.readFileSync(item.abs);
    assert.equal(body.length, row.size, row.path);
    assert.equal(`sha256:${io.sha(body)}`, row.sha256, row.path);
  }
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.equal(pkg.version, '0.9.1');
  const candidate = builder.buildCandidate(root);
  const summary = builder.summarize(candidate);
  assert.equal(summary.fileCount, 17);
  assert.equal(summary.productFileCount, snapshot.productJavaScriptFiles);
  assert.equal(summary.productDigest, snapshot.productDigest);
  assert.equal(summary.fileDigest, snapshot.fileDigest);
}

function assertPrevious09EmbeddedFixturePayload(payload) {
  assert.equal(payload?.schemaVersion, 1);
  assert.equal(payload.kind, 'harness-lite-previous-09-snapshot-fixture');
  assert.equal(Array.isArray(payload.files), true);
  assert.deepEqual(payload.files.map((row) => row.path).sort(), install.PREVIOUS_09_SNAPSHOT.managedPaths);
  for (const row of payload.files) {
    const expected = install.PREVIOUS_09_SNAPSHOT.files.find((item) => item.path === row.path);
    assert.ok(expected, row.path);
    assert.equal(row.mode, expected.mode, row.path);
    const body = Buffer.from(row.contentBase64, 'base64');
    assert.equal(body.length, expected.size, row.path);
    assert.equal(`sha256:${io.sha(body)}`, expected.sha256, row.path);
  }
}

function previous09Source() {
  const root = temp('hl-nv05-prev09-source-');
  const fixture = previous09Fixture.snapshot();
  assertPrevious09EmbeddedFixturePayload(fixture);
  for (const row of fixture.files) {
    const to = path.join(root, row.path);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.writeFileSync(to, Buffer.from(row.contentBase64, 'base64'));
    fs.chmodSync(to, parseInt(row.mode, 8));
  }
  assertPrevious09SnapshotSource(root);
  return root;
}

function runtimeFiles(runtime) {
  return io.list(runtime, true).map((file) => path.relative(runtime, file).replaceAll('\\', '/'))
    .filter((rel) => rel !== 'ownership.json' && !rel.startsWith('extensions/')).sort();
}

function runtimeFingerprint(runtime) {
  return io.list(runtime, true).map((file) => {
    const rel = path.relative(runtime, file).replaceAll('\\', '/');
    const stat = fs.lstatSync(file);
    const body = fs.readFileSync(file);
    return [rel, (stat.mode & 0o777).toString(8).padStart(4, '0'), body.length, io.sha(body)];
  });
}

function writeSelfCertifiedPrevious09Manifest(root) {
  const runtime = path.join(root, install.RUNTIME);
  const paths = runtimeFiles(runtime);
  let hookDefinitionDigest = install.PREVIOUS_09_SNAPSHOT.hookDefinitionDigest;
  try { hookDefinitionDigest = requireFresh(path.join(runtime, 'lib/install.js')).definition(root).digest; } catch { /* keep fixed snapshot value */ }
  const manifest = {
    runtimeVersion: '0.9.1',
    sourceCommit: install.PREVIOUS_09_SNAPSHOT.sourceCommit,
    profile: 'project',
    managedPaths: paths,
    packageDigest: io.digest(runtime, paths, previousDesiredMode),
    hookDefinitionDigest,
    instructionBlockDigest: install.PREVIOUS_09_SNAPSHOT.instructionBlockDigest,
    hookPreimage: { fileExisted: true, addedEvents: [] },
    extensions: {},
  };
  io.atomic(path.join(root, install.MANIFEST), `${JSON.stringify(manifest, null, 2)}\n`, 0o600);
  return manifest;
}

function git(root, args, opts = {}) {
  const run = spawnSync('/usr/bin/git', args, { cwd: root, encoding: 'utf8', env: gitEnv, ...opts });
  assert.equal(run.status, 0, `${args.join(' ')}\n${run.stderr || run.stdout}`);
  return run.stdout.trim();
}

function initGitRoot(root) {
  git(root, ['init', '-q']);
  git(root, ['config', 'user.email', 'harness-lite@example.invalid']);
  git(root, ['config', 'user.name', 'Harness Lite Test']);
  fs.writeFileSync(path.join(root, 'README.md'), '# disposable\n');
  git(root, ['add', 'README.md']);
  git(root, ['commit', '-q', '-m', 'init']);
}

function requireFresh(file) {
  delete require.cache[require.resolve(file)];
  return require(file);
}

function runtimeResidue(root) {
  const dir = path.join(root, '.claude');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((name) => name.startsWith('.harness-lite.'));
}

function assertCurrentInstall(root, result) {
  const expectedVersion = install.VERSION;
  const expectedSourceCommit = install.SOURCE_COMMIT;
  assert.equal(result.status, 'INSTALLED');
  const checked = install.verify06(root);
  assert.equal(checked.ok, true, checked.differences.join(','));
  assert.equal(checked.manifest.runtimeVersion, expectedVersion);
  assert.equal(checked.manifest.sourceCommit, expectedSourceCommit);
  assert.equal(checked.manifest.instructionBlockDigest, `sha256:${io.sha(install.INSTRUCTION)}`);
  assert.deepEqual([...checked.manifest.managedPaths].sort(), install.CURRENT_REQUIRED_RUNTIME_PATHS);
  const runtimePkg = JSON.parse(fs.readFileSync(path.join(root, install.RUNTIME, 'package.json'), 'utf8'));
  assert.equal(runtimePkg.version, expectedVersion);
  const runtimeApi = requireFresh(path.join(root, install.RUNTIME, 'lib/install.js'));
  assert.equal(runtimeApi.VERSION, expectedVersion);
  assert.equal(runtimeApi.SOURCE_COMMIT, expectedSourceCommit);
  assert.equal(runtimeApi.definition(root).digest, checked.manifest.hookDefinitionDigest);
  assert.ok(checked.manifest.managedPaths.includes('lib/capabilities.js'));
  assert.ok(checked.manifest.managedPaths.includes('lib/delegation.js'));
  return checked;
}

function hostHooks(root, profile = 'project', globalRoot = null) {
  const def = profile === 'managed'
    ? (() => {
        const target = managed.layout(globalRoot);
        const config = managed.hooksDefinition(target.gateway, install.VERSION);
        return { command: target.gateway, config, sourcePath: target.definition };
      })()
    : { ...install.definition(root), sourcePath: path.join(install.hookConfigRoot(root), '.codex/hooks.json') };
  return install.EVENTS.map((event) => ({
    eventName: evidence.HOST_EVENT[event],
    command: def.command,
    matcher: def.config.hooks[event][0].matcher || null,
    enabled: true,
    trustStatus: profile === 'managed' ? 'managed' : 'trusted',
    source: profile === 'managed' ? 'system' : 'project',
    isManaged: profile === 'managed',
    sourcePath: def.sourcePath,
    currentHash: `hash-${event}`,
  }));
}

function dispatchInstalled(root, input) {
  const dispatcher = path.join(root, install.RUNTIME, 'hooks/dispatcher.js');
  const run = spawnSync(process.execPath, [dispatcher], {
    cwd: root,
    input: `${JSON.stringify(input)}\n`,
    encoding: 'utf8',
  });
  assert.equal(run.status, 0, run.stderr || run.stdout);
  return run;
}

function hostNotification(event, phase, id, turnId = null, profile = 'project', root = null, globalRoot = null) {
  const def = profile === 'managed'
    ? { sourcePath: managed.layout(globalRoot).definition }
    : { sourcePath: path.join(install.hookConfigRoot(root), '.codex/hooks.json') };
  return {
    method: phase === 'started' ? 'hook/started' : 'hook/completed',
    threadId: 'thread-nv05',
    turnId,
    run: {
      id,
      eventName: evidence.HOST_EVENT[event],
      handlerType: 'command',
      source: profile === 'managed' ? 'system' : 'project',
      isManaged: profile === 'managed',
      sourcePath: def.sourcePath,
      status: phase === 'completed' ? 'completed' : 'started',
    },
  };
}

function inputFor(event, root) {
  if (event === 'SessionStart') return { hook_event_name: event, cwd: root, session_id: 'thread-nv05' };
  if (event === 'UserPromptSubmit') return { hook_event_name: event, cwd: root, session_id: 'thread-nv05', turn_id: 'turn-UserPromptSubmit', prompt: 'hello' };
  if (event === 'Stop') return { hook_event_name: event, cwd: root, session_id: 'thread-nv05', turn_id: 'turn-Stop', stop_hook_active: false };
  return { hook_event_name: event, cwd: root, session_id: 'thread-nv05', turn_id: 'turn-PreToolUse', tool_name: 'Bash', tool_input: { command: 'true' } };
}

test('embedded original 0.9.1 fixture is self-contained and matches the fixed snapshot identity', () => {
  const root = previous09Source();
  try {
    assertPrevious09SnapshotSource(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('fresh project install records coherent 0.11 runtime identity and hook definition', () => {
  const root = temp('hl-nv05-project-');
  try {
    const result = install.install(root, { write: true, source: sourceRoot });
    assertCurrentInstall(root, result);
    assert.equal(install.configured(root), true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('managed global install, registry identity, gateway dispatch, and project binding are 0.11', () => {
  const systemRoot = temp('hl-nv05-global-');
  const project = temp('hl-nv05-managed-project-');
  try {
    initGitRoot(project);
    const global = managed.installGlobal(systemRoot, { write: true, source: sourceRoot });
    assert.equal(global.status, 'INSTALLED');
    const globalCheck = managed.verifyGlobal(systemRoot);
    assert.equal(globalCheck.ok, true, globalCheck.differences.join(','));
    assert.equal(globalCheck.manifest.runtimeVersion, install.VERSION);
    assert.ok(globalCheck.manifest.managedPaths.includes('lib/capabilities.js'));
    assert.ok(globalCheck.manifest.managedPaths.includes('lib/delegation.js'));
    assert.equal(globalCheck.allowlist.runtimes[0].runtimeVersion, install.VERSION);

    const projectInstall = install.install(project, { write: true, source: sourceRoot, profile: 'managed', globalRoot: systemRoot });
    const checked = assertCurrentInstall(project, projectInstall);
    assert.equal(checked.manifest.profile, 'managed');
    const state = managed.projectState(systemRoot, project);
    assert.equal(state.active, true, state.reason);
    assert.equal(state.entry.runtimeVersion, install.VERSION);
    assert.equal(state.entry.packageDigest, checked.manifest.packageDigest);

    const gateway = managed.layout(systemRoot).gateway;
    const input = { hook_event_name: 'SessionStart', cwd: project, session_id: 'managed-thread' };
    const run = spawnSync(gateway, [], { cwd: project, input: `${JSON.stringify(input)}\n`, encoding: 'utf8' });
    assert.equal(run.status, 0, run.stderr || run.stdout);
    assert.match(run.stdout, /hookSpecificOutput/);
    const receipts = fs.readFileSync(managed.layout(systemRoot).receipts, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
    assert.equal(receipts.at(-1).event, 'SessionStart');
    assert.equal(receipts.at(-1).decision, 'executed');
  } finally {
    fs.rmSync(systemRoot, { recursive: true, force: true });
    fs.rmSync(project, { recursive: true, force: true });
  }
});

test('explicit original 0.9.1 snapshot fixture upgrade is recognized from fixed 17-path identity', () => {
  const previousSource = previous09Source();
  const previousInstall = requireFresh(path.join(previousSource, 'lib/install.js'));
  const root = temp('hl-nv05-upgrade-');
  try {
    const previous = previousInstall.install(root, { write: true, source: previousSource });
    assert.equal(previous.status, 'INSTALLED');
    assert.equal(previous.manifest.runtimeVersion, '0.9.1');
    assert.equal(previous.manifest.sourceCommit, install.PREVIOUS_09_SNAPSHOT.sourceCommit);
    assert.equal(previous.manifest.instructionBlockDigest, install.PREVIOUS_09_SNAPSHOT.instructionBlockDigest);
    assert.equal(previous.manifest.packageDigest, install.PREVIOUS_09_SNAPSHOT.packageDigest);
    assert.equal(previous.manifest.hookDefinitionDigest, install.PREVIOUS_09_SNAPSHOT.hookDefinitionDigest);
    assert.deepEqual(previous.manifest.managedPaths, install.PREVIOUS_09_SNAPSHOT.managedPaths);
    assert.equal(previous.manifest.managedPaths.length, 17);
    assert.equal(previous.manifest.managedPaths.includes('lib/capabilities.js'), false);
    assert.equal(previous.manifest.managedPaths.includes('lib/delegation.js'), false);

    const inspected = install.inspect(root);
    assert.equal(inspected.ok, true, inspected.differences.join(','));
    assert.equal(inspected.kind, 'previous-09-snapshot');
    assert.equal(inspected.evidence.carrier, install.PREVIOUS_09_SNAPSHOT.label);
    assert.equal(inspected.evidence.packageDigest, install.PREVIOUS_09_SNAPSHOT.packageDigest);
    const hold = install.install(root, { write: false, source: sourceRoot });
    assert.equal(hold.status, 'HOLD');
    assert.equal(hold.kind, 'previous-09-snapshot');
    assert.match(hold.reason, /显式 upgrade/);

    const upgraded = install.install(root, { write: true, source: sourceRoot, upgrade: true });
    assert.equal(upgraded.kind, 'previous-09-snapshot');
    assertCurrentInstall(root, upgraded);
  } finally {
    fs.rmSync(previousSource, { recursive: true, force: true });
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('coherent tamper of a 0.9.1 runtime plus manifest self-proof is HOLD and byte-stable', () => {
  const previousSource = previous09Source();
  const previousInstall = requireFresh(path.join(previousSource, 'lib/install.js'));
  const tampered = temp('hl-nv05-upgrade-tampered-');
  try {
    const prior = previousInstall.install(tampered, { write: true, source: previousSource });
    assert.equal(prior.status, 'INSTALLED');
    fs.appendFileSync(path.join(tampered, install.RUNTIME, 'lib/work.js'), '\n// attacker-mutated-runtime\n');
    writeSelfCertifiedPrevious09Manifest(tampered);
    const manifestFile = path.join(tampered, install.MANIFEST);
    const before = runtimeFingerprint(path.join(tampered, install.RUNTIME));
    const selfCertified = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
    assert.notEqual(selfCertified.packageDigest, install.PREVIOUS_09_SNAPSHOT.packageDigest);
    const inspected = install.inspect(tampered);
    assert.equal(inspected.ok, false);
    assert.equal(inspected.kind, 'drift');
    assert.ok(inspected.differences.includes('packageDigest') || inspected.differences.includes('fixed-packageDigest'));
    assert.ok(inspected.differences.includes('content:lib/work.js'));
    const denied = install.install(tampered, { write: true, source: sourceRoot, upgrade: true });
    assert.equal(denied.status, 'HOLD');
    assert.equal(denied.kind, 'drift');
    assert.equal(denied.written, 0);
    assert.deepEqual(runtimeFingerprint(path.join(tampered, install.RUNTIME)), before);
  } finally {
    fs.rmSync(previousSource, { recursive: true, force: true });
    fs.rmSync(tampered, { recursive: true, force: true });
  }
});

test('coherent relabelled current 0.11 runtime is not accepted as previous 0.9.1', () => {
  const root = temp('hl-nv05-relabel-current-');
  try {
    assertCurrentInstall(root, install.install(root, { write: true, source: sourceRoot }));
    const forged = writeSelfCertifiedPrevious09Manifest(root);
    const before = runtimeFingerprint(path.join(root, install.RUNTIME));
    assert.equal(forged.runtimeVersion, '0.9.1');
    assert.equal(forged.managedPaths.includes('lib/capabilities.js'), true);
    assert.equal(forged.managedPaths.includes('lib/delegation.js'), true);
    const inspected = install.inspect(root);
    assert.equal(inspected.ok, false);
    assert.equal(inspected.kind, 'drift');
    assert.ok(inspected.differences.includes('managedPaths'), inspected.differences.join(','));
    assert.ok(inspected.differences.includes('extra:lib/capabilities.js'), inspected.differences.join(','));
    assert.ok(inspected.differences.includes('extra:lib/delegation.js'), inspected.differences.join(','));
    const denied = install.install(root, { write: true, source: sourceRoot, upgrade: true });
    assert.equal(denied.status, 'HOLD');
    assert.equal(denied.kind, 'drift');
    assert.equal(denied.written, 0);
    assert.deepEqual(runtimeFingerprint(path.join(root, install.RUNTIME)), before);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('host evidence gates require exact structured list, started/completed notifications, and runtime receipts', () => {
  const root = temp('hl-nv05-host-evidence-');
  try {
    assertCurrentInstall(root, install.install(root, { write: true, source: sourceRoot }));
    const entry = { cwd: root, hooks: hostHooks(root), warnings: [], errors: [] };
    install.recordHostList(root, { data: [entry] }, { write: true, connectionId: 'conn-nv05' });
    let health = install.health(root);
    assert.equal(health.trusted, false);
    assert.deepEqual(health.observed, { SessionStart: false, UserPromptSubmit: false, Stop: false, PreToolUse: false });
    assert.equal(health.effective, false);

    for (const event of install.EVENTS) {
      const runId = `run-${event}`;
      const input = inputFor(event, root);
      const turn = input.turn_id || null;
      const started = install.recordHostEvent(root, hostNotification(event, 'started', runId, turn, 'project', root), {
        write: true,
        connectionId: 'conn-nv05',
      });
      assert.equal(started.ok, true, started.reason);
      dispatchInstalled(root, input);
      const completed = install.recordHostEvent(root, hostNotification(event, 'completed', runId, turn, 'project', root), {
        write: true,
        connectionId: 'conn-nv05',
      });
      assert.equal(completed.ok, true, `${event}: ${completed.reason}`);
      assert.equal(completed.receiptVerdict, 'exact');
    }

    install.recordHostList(root, { data: [entry] }, { write: true, connectionId: 'conn-nv05' });
    health = install.health(root);
    assert.deepEqual(health.observed, { SessionStart: true, UserPromptSubmit: true, Stop: true, PreToolUse: true });
    assert.equal(health.trusted, true);
    assert.equal(health.effective, false);
    assert.deepEqual(health.nativePrePush, { configured: false, probed: false });

    const synthetic = evidence.build({ hostKind: 'synthetic', proofType: 'offline' });
    assert.equal(synthetic.joinVerdict, 'missing');
    assert.deepEqual(synthetic.claims.observed, { SessionStart: false, UserPromptSubmit: false, Stop: false, PreToolUse: false });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('fault injection at swap, instruction, hook, and managed registry rolls back exact preimages without runtime residue', () => {
  for (const point of ['swap:new', 'instruction:AGENTS.md:written', 'hooks:written']) {
    const root = temp(`hl-nv05-fault-${point.replace(/[^A-Za-z0-9]+/g, '-')}-`);
    try {
      fs.writeFileSync(path.join(root, 'AGENTS.md'), 'preimage agents\n');
      const result = install.install(root, {
        write: true,
        source: sourceRoot,
        fault: (name) => { if (name === point) throw new Error(`fault:${point}`); },
      });
      assert.equal(result.status, 'PARTIAL', point);
      assert.match(result.reason, new RegExp(`fault:${point.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), point);
      assert.equal(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), 'preimage agents\n', point);
      assert.equal(fs.existsSync(path.join(root, install.RUNTIME)), false, point);
      assert.deepEqual(runtimeResidue(root), [], point);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }

  const systemRoot = temp('hl-nv05-fault-global-');
  const project = temp('hl-nv05-fault-managed-project-');
  try {
    initGitRoot(project);
    assert.equal(managed.installGlobal(systemRoot, { write: true, source: sourceRoot }).status, 'INSTALLED');
    const registryFile = managed.layout(systemRoot).registry;
    const registryBefore = fs.readFileSync(registryFile, 'utf8');
    const result = install.install(project, {
      write: true,
      source: sourceRoot,
      profile: 'managed',
      globalRoot: systemRoot,
      fault: (name) => { if (name === 'managed:registry:written') throw new Error('fault:managed:registry:written'); },
    });
    assert.equal(result.status, 'PARTIAL');
    assert.match(result.reason, /fault:managed:registry:written/);
    assert.equal(fs.readFileSync(registryFile, 'utf8'), registryBefore);
    assert.equal(fs.existsSync(path.join(project, install.RUNTIME)), false);
    assert.deepEqual(runtimeResidue(project), []);
  } finally {
    fs.rmSync(systemRoot, { recursive: true, force: true });
    fs.rmSync(project, { recursive: true, force: true });
  }
});

test('native pre-push gate is configured and probed only with disposable local git and bare remotes, then uninstall removes it', () => {
  const root = temp('hl-nv05-native-');
  try {
    initGitRoot(root);
    assertCurrentInstall(root, install.install(root, { write: true, source: sourceRoot }));
    const native = install.installNative(root, { write: true });
    assert.equal(native.ok, true, native.reason);
    assert.equal(native.configured, true);
    assert.equal(native.wrote, true);
    const probe = install.probeNative(root, { write: true });
    assert.equal(probe.remote, 'disposable-local-bare-remote');
    assert.equal(probe.ok, true, probe.reason);
    assert.equal(probe.probed, true);
    const state = install.nativeState(root, install.verify06(root).manifest.packageDigest);
    assert.equal(state.configured, true);
    assert.equal(state.probed, true);

    const removed = install.uninstall(root, { write: true });
    assert.equal(removed.status, 'UNINSTALLED', removed.reason);
    assert.equal(fs.existsSync(path.join(root, install.RUNTIME)), false);
    assert.equal(fs.existsSync(path.join(root, '.codex/harness-lite/native.json')), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('candidate builder includes the current source, tests, scripts, and runtime modules deterministically', () => {
  const first = builder.buildCandidate(sourceRoot);
  const second = builder.buildCandidate(sourceRoot);
  const summary = builder.summarize(first);
  const currentVersion = require('../package.json').version;
  assert.equal(summary.version, currentVersion);
  assert.equal(first.package.version, currentVersion);
  if (first.provenance.git.repo) assert.match(first.provenance.git.head, /^[0-9a-f]{40,64}$/);
  else assert.equal(first.provenance.git.head, null);
  for (const rel of [
    'lib/capabilities.js',
    'lib/delegation.js',
    'scripts/build-candidate.js',
    'scripts/timed-test.js',
    'test/nv05-integration.test.js',
    'skills/root-cause.md',
  ]) {
    assert.ok(first.files.some((row) => row.path === rel), rel);
  }
  assert.equal(summary.productFileCount, 14);
  assert.equal(summary.candidateDigest, builder.summarize(second).candidateDigest);
  assert.equal(builder.artifactText(first), builder.artifactText(second));
});

test('current product surface does not implement provider adapters, static model catalogs, credential stores, or daemons', () => {
  const files = install.CURRENT_REQUIRED_RUNTIME_PATHS.filter((rel) => rel.endsWith('.js'));
  const joined = files.map((rel) => fs.readFileSync(path.join(sourceRoot, rel), 'utf8')
    .replace(/const (?:PREVIOUS_10_)?INSTRUCTION = `<!-- HARNESS-LITE:BEGIN -->[\s\S]*?<!-- HARNESS-LITE:END -->`;/g,
      'const INSTRUCTION = "<policy text omitted>";')).join('\n');
  assert.equal(/providerAdapter|staticModelCatalog|modelCatalog\s*=/.test(joined), false);
  assert.equal(/\bsetInterval\s*\(/.test(joined), false);
  assert.equal(/\bdaemon\b.*\bspawn\b|\bspawn\b.*\bdaemon\b/i.test(joined), false);
  assert.equal(/writeFileSync\([^)]*(?:credential|token|password)/i.test(joined), false);
});
