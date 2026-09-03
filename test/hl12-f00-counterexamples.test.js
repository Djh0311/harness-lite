'use strict';

const assert = require('assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const test = require('node:test');

const capabilities = require('../lib/capabilities.js');
const delegation = require('../lib/delegation.js');
const hook = require('../lib/hook.js');
const install = require('../lib/install.js');
const io = require('../lib/io.js');

const sourceRoot = path.resolve(__dirname, '..');
const retained10 = path.join(sourceRoot, 'docs', 'harness', 'artifacts',
  'harness-lite-0.10.0-d73f4b4f83e6034e33168995c24ca4514d69bcd70ccc19f8aa255da42d218daa.json');
const realCodexRoot = path.resolve('/home/synadmin/.codex');
const hardRiskBaseline = Object.freeze([
  'push-pretool-and-native-gate',
  'stop-continuation-exact-binding',
  'harness-owned-write-identity-surface-and-ownership-preconditions',
]);

function disposable(t, label) {
  const prefix = path.join(os.tmpdir(), `hl12-f00-${label}-`);
  const root = fs.mkdtempSync(prefix);
  const resolved = fs.realpathSync(root);
  assert.ok(resolved.startsWith(`${path.resolve(os.tmpdir())}${path.sep}hl12-f00-`), resolved);
  t.after(() => {
    if (!fs.existsSync(root)) return;
    const stat = fs.lstatSync(root);
    assert.equal(stat.isDirectory() && !stat.isSymbolicLink(), true, root);
    fs.rmSync(root, { recursive: true, force: false });
    assert.equal(fs.existsSync(root), false, root);
  });
  return root;
}

function layout(t, label) {
  const root = disposable(t, label);
  const home = path.join(root, 'synthetic-home');
  const project = path.join(root, 'project');
  fs.mkdirSync(path.join(home, '.codex'), { recursive: true });
  fs.mkdirSync(project, { recursive: true });
  assert.notEqual(path.resolve(home, '.codex'), realCodexRoot);
  return { root, home, project };
}

function syntheticEnv(home, tmpRoot) {
  const env = {
    ...process.env,
    HOME: home,
    USERPROFILE: home,
    XDG_CONFIG_HOME: path.join(home, '.config'),
    TMPDIR: tmpRoot,
  };
  delete env.CODEX_HOME;
  return env;
}

function runNode(script, args, opts) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd: opts.cwd,
    env: { ...syntheticEnv(opts.home, opts.tmpRoot), ...(opts.env || {}) },
    input: opts.input,
    encoding: 'utf8',
    timeout: 30000,
    maxBuffer: 64 * 1024 * 1024,
  });
}

function jsonOutput(run, label) {
  assert.equal(run.error, undefined, `${label}: ${run.error?.message}`);
  const body = String(run.stdout || '').trim();
  assert.notEqual(body, '', `${label}: empty stdout; stderr=${run.stderr || ''}`);
  try { return JSON.parse(body); } catch (error) {
    assert.fail(`${label}: invalid JSON: ${error.message}\nstdout=${body}\nstderr=${run.stderr || ''}`);
  }
}

function installCli(source, project, home, tmpRoot, args = []) {
  const run = runNode(path.join(source, 'bin', 'hl.js'), [
    'install', '--target', project, '--source', source, ...args, '--json',
  ], { cwd: project, home, tmpRoot });
  return { run, value: jsonOutput(run, `install ${args.join(' ')}`) };
}

function dispatchInstalled(project, home, tmpRoot, input) {
  const run = runNode(path.join(project, install.RUNTIME, 'hooks', 'dispatcher.js'), [], {
    cwd: project,
    home,
    tmpRoot,
    input: JSON.stringify(input),
  });
  return { run, value: jsonOutput(run, `dispatcher ${input.hook_event_name}`) };
}

function workUnitSection(unit) {
  return [
    `## ${unit.id}`,
    '',
    `goal: ${unit.goal || `${unit.id}-GOAL`}`,
    '',
    'completionStandards:',
    '',
    `- ${unit.standard || `${unit.id}-STANDARD`}`,
    '',
    'allowed:',
    '',
    `- ${unit.allowed || `test/${unit.id}.test.js`}`,
    '',
    'forbidden:',
    '',
    '- push',
    '',
    'authorityDesign:',
    '',
    `- ${unit.id}-DESIGN`,
    '',
    'facts:',
    '',
    `- ${unit.id}-FACT`,
    '',
    'entryPoints:',
    '',
    '- lib/tree.js',
    '',
    'disprovenRoutes:',
    '',
    '- leaf fallback',
    '',
    'unknowns:',
    '',
    '- no material unknown',
    '',
    `routeBasis: ${unit.id}-ROUTE`,
    '',
    'dependencies:',
    '',
    ...(unit.dependencies?.length ? unit.dependencies.map((id) => `- ${id}`) : ['- 无']),
    '',
    `resultContract: ${unit.id}-RESULT`,
    '',
  ].join('\n');
}

function writeHarnessState(project, units) {
  const harness = path.join(project, 'docs', 'harness');
  fs.mkdirSync(path.join(harness, 'stages'), { recursive: true });
  fs.mkdirSync(path.join(harness, 'leaves'), { recursive: true });
  fs.writeFileSync(path.join(harness, 'plan.md'), '# HL12 F00 fixture\n\n目标：replay 0.11 baselines\n');
  fs.writeFileSync(path.join(harness, 'stages', 'stage-f00.md'), [
    '# Stage F00',
    '',
    '目标：replay 0.11 baselines',
    '',
    '不许动：',
    '',
    '- push',
  ].join('\n'));
  fs.writeFileSync(path.join(harness, 'leaves', 'F00.md'), [
    '# F00 Leaf',
    '',
    '阶段：stage-f00',
    '',
    '目标：F00-LEAF-GOAL',
    '',
    '完成标准：',
    '',
    '- F00-LEAF-STANDARD',
    '',
    '允许动：',
    '',
    '- test/**',
    '',
    '不许动：',
    '',
    '- push',
    '',
    ...units.map(workUnitSection),
  ].join('\n'));
}

function record(root, event, at) {
  const result = delegation.recordEvent(root, event, { at });
  assert.equal(result.ok, true, result.reason);
  return result;
}

function materializeCandidate(parent, artifactFile, name) {
  const root = path.join(parent, name);
  fs.mkdirSync(root, { recursive: true });
  const bytes = fs.readFileSync(artifactFile);
  const artifact = JSON.parse(bytes);
  for (const row of artifact.files) {
    assert.equal(path.isAbsolute(row.path), false, row.path);
    assert.equal(row.path.split(/[\\/]/).includes('..'), false, row.path);
    const target = path.join(root, row.path);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, Buffer.from(row.contentBase64, 'base64'));
    fs.chmodSync(target, parseInt(row.mode, 8));
  }
  return {
    root,
    artifact,
    sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
  };
}

function runtimeCarriers(project) {
  const parent = path.join(project, '.claude');
  if (!fs.existsSync(parent)) return [];
  return fs.readdirSync(parent).filter((name) => name.startsWith('.harness-lite.')).sort();
}

test('CEX-01 known-red: synthetic global Codex root must HOLD before target content changes', { timeout: 30000 }, (t) => {
  const { root, home } = layout(t, 'cex01-red');
  const target = path.join(home, '.codex');
  const agents = path.join(target, 'AGENTS.md');
  const before = Buffer.from('SYNTHETIC-GLOBAL-USER-TEXT\n');
  fs.writeFileSync(agents, before);
  const readLog = path.join(root, 'target-read.log');
  const preload = path.join(root, 'read-observer.js');
  fs.writeFileSync(preload, [
    "'use strict';",
    "const fs = require('fs');",
    "const path = require('path');",
    "const originalRead = fs.readFileSync.bind(fs);",
    "const originalAppend = fs.appendFileSync.bind(fs);",
    "const target = path.resolve(process.env.HL12_F00_READ_TARGET);",
    "const log = path.resolve(process.env.HL12_F00_READ_LOG);",
    "fs.readFileSync = function observedRead(file, ...args) {",
    "  const absolute = typeof file === 'string' || Buffer.isBuffer(file) ? path.resolve(String(file)) : null;",
    "  if (absolute && (absolute === target || absolute.startsWith(target + path.sep))) originalAppend(log, absolute + '\\n');",
    "  return originalRead(file, ...args);",
    "};",
  ].join('\n'));
  const run = runNode(path.join(sourceRoot, 'bin', 'hl.js'), [
    'install', '--target', target, '--source', sourceRoot, '--write', '--json',
  ], {
    cwd: target,
    home,
    tmpRoot: root,
    env: {
      NODE_OPTIONS: `--require=${preload}`,
      HL12_F00_READ_TARGET: target,
      HL12_F00_READ_LOG: readLog,
    },
  });
  const value = jsonOutput(run, 'install synthetic global root');
  const observed = {
    held: value.status === 'HOLD' && run.status !== 0,
    targetContentUnread: !fs.existsSync(readLog),
    instructionUnchanged: fs.readFileSync(agents).equals(before),
    runtimeAbsent: !fs.existsSync(path.join(target, install.RUNTIME)),
    lifecycleAbsent: !fs.existsSync(path.join(target, 'docs', 'harness')),
  };
  assert.deepEqual(observed, {
    held: true,
    targetContentUnread: true,
    instructionUnchanged: true,
    runtimeAbsent: true,
    lifecycleAbsent: true,
  }, `0.11 baseline=${JSON.stringify({ status: value.status, exit: run.status, observed })}`);
});

test('CEX-01 normal-positive: ordinary non-Git project still installs', { timeout: 30000 }, (t) => {
  const { root, home, project } = layout(t, 'cex01-green');
  const before = 'ORDINARY-PROJECT-USER-TEXT\n';
  fs.writeFileSync(path.join(project, 'AGENTS.md'), before);
  const { run, value } = installCli(sourceRoot, project, home, root, ['--write']);
  assert.equal(run.status, 0, run.stderr);
  assert.equal(value.status, 'INSTALLED');
  assert.equal(fs.existsSync(path.join(project, install.RUNTIME)), true);
  const after = fs.readFileSync(path.join(project, 'AGENTS.md'), 'utf8');
  assert.ok(after.startsWith(before));
  assert.match(after, /<!-- HARNESS-LITE:BEGIN -->/);
});

test('CEX-02 known-red: coherent current runtime plus manifest tamper must not self-certify or write usage', { timeout: 30000 }, (t) => {
  const { root, home, project } = layout(t, 'cex02-red');
  const installed = installCli(sourceRoot, project, home, root, ['--write']);
  assert.equal(installed.value.status, 'INSTALLED');

  const runtime = path.join(project, install.RUNTIME);
  fs.appendFileSync(path.join(runtime, 'lib', 'tree.js'), '\n// HL12-F00-COHERENT-TAMPER\n');
  const manifestFile = path.join(project, install.MANIFEST);
  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  manifest.packageDigest = io.digest(runtime, manifest.managedPaths);
  fs.writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);

  const checked = install.verify06(project);
  const dispatched = dispatchInstalled(project, home, root, {
    hook_event_name: 'SessionStart',
    cwd: project,
    session_id: 'cex02-session',
    turn_id: 'cex02-turn',
  });
  const context = dispatched.value?.hookSpecificOutput?.additionalContext || '';
  const observedFile = path.join(project, 'docs', 'harness', 'usage', '.observed.json');
  const observedLog = path.join(project, 'docs', 'harness', 'usage', '.observed.jsonl');
  const observed = {
    sourceVerifyRejected: checked.ok === false,
    dispatcherDegradedCleanly: dispatched.run.status === 0 && /identity/.test(context),
    usageUnchanged: !fs.existsSync(observedFile) && !fs.existsSync(observedLog),
  };
  assert.deepEqual(observed, {
    sourceVerifyRejected: true,
    dispatcherDegradedCleanly: true,
    usageUnchanged: true,
  }, `0.11 baseline=${JSON.stringify({ checked: checked.kind, differences: checked.differences, context, observed })}`);
});

test('CEX-02 normal-positive: untouched installed runtime verifies and formal dispatcher runs', { timeout: 30000 }, (t) => {
  const { root, home, project } = layout(t, 'cex02-green');
  assert.equal(installCli(sourceRoot, project, home, root, ['--write']).value.status, 'INSTALLED');
  assert.equal(install.verify06(project).ok, true);
  const dispatched = dispatchInstalled(project, home, root, {
    hook_event_name: 'SessionStart',
    cwd: project,
    session_id: 'healthy-session',
    turn_id: 'healthy-turn',
  });
  assert.equal(dispatched.run.status, 0, dispatched.run.stderr);
  assert.equal(dispatched.value.hookSpecificOutput.hookEventName, 'SessionStart');
  assert.equal(fs.existsSync(path.join(project, 'docs', 'harness', 'usage', '.observed.json')), true);
});

test('CEX-03 known-red: undeclared ghost unit must not be ready, accepted, persisted, or unlock a dependency', (t) => {
  const { project } = layout(t, 'cex03-red');
  writeHarnessState(project, [
    { id: 'HL12GOOD1' },
    { id: 'HL12DEP1', dependencies: ['GHOST99'] },
  ]);
  record(project, {
    id: 'evt-dep-pending',
    workUnit: 'HL12DEP1',
    status: 'rejected',
    dependencies: ['GHOST99'],
  }, '2026-09-02T00:00:00.000Z');

  const ledgerFile = delegation.ledgerPath(project);
  const before = fs.readFileSync(ledgerFile);
  const pkg = require('../lib/tree.js').workUnitPackage(project, 'GHOST99');
  const result = delegation.recordEvent(project, {
    id: 'evt-ghost-accepted',
    workUnit: 'GHOST99',
    status: 'accepted',
    evidenceRef: 'docs/harness/reports/ghost.md',
  }, { at: '2026-09-02T00:00:01.000Z' });
  const after = fs.readFileSync(ledgerFile);
  const state = delegation.read(project);
  const observed = {
    packageRejected: pkg.status !== 'work-unit' && pkg.dispatchReady !== true,
    eventRejected: result.ok === false && result.wrote === false,
    ledgerUnchanged: before.equals(after),
    ghostAbsent: !Object.hasOwn(state.ledger.workUnits, 'GHOST99'),
    dependencyLocked: delegation.dependencyState(state.ledger, 'HL12DEP1').ready === false,
  };
  assert.deepEqual(observed, {
    packageRejected: true,
    eventRejected: true,
    ledgerUnchanged: true,
    ghostAbsent: true,
    dependencyLocked: true,
  }, `0.11 baseline=${JSON.stringify({ package: { status: pkg.status, dispatchReady: pkg.dispatchReady }, result: result.status, observed })}`);
});

test('CEX-03 normal-positive: declared unit reports, is accepted with evidence, and only then unlocks dependent', (t) => {
  const { project } = layout(t, 'cex03-green');
  writeHarnessState(project, [
    { id: 'HL12GOOD1' },
    { id: 'HL12DEP1', dependencies: ['HL12GOOD1'] },
  ]);
  record(project, { id: 'evt-good-active', workUnit: 'HL12GOOD1', status: 'active' }, '2026-09-02T00:00:00.000Z');
  record(project, {
    id: 'evt-dep-pending', workUnit: 'HL12DEP1', status: 'rejected', dependencies: ['HL12GOOD1'],
  }, '2026-09-02T00:00:01.000Z');
  record(project, {
    id: 'evt-good-reported', workUnit: 'HL12GOOD1', status: 'reported_complete', evidenceRef: 'reports/good-writer.md',
  }, '2026-09-02T00:00:02.000Z');
  let state = delegation.read(project);
  assert.equal(delegation.dependencyState(state.ledger, 'HL12DEP1').ready, false);
  record(project, {
    id: 'evt-good-accepted', workUnit: 'HL12GOOD1', status: 'accepted', evidenceRef: 'reports/good-supervisor.md',
  }, '2026-09-02T00:00:03.000Z');
  state = delegation.read(project);
  assert.equal(state.ledger.workUnits.HL12GOOD1.status, 'accepted');
  assert.equal(delegation.dependencyState(state.ledger, 'HL12DEP1').ready, true);
});

test('CEX-04 known-red: formal pre-dispatch Hook must carry every runnable unit package', { timeout: 30000 }, (t) => {
  const { root, home, project } = layout(t, 'cex04-red');
  assert.equal(installCli(sourceRoot, project, home, root, ['--write']).value.status, 'INSTALLED');
  writeHarnessState(project, [
    { id: 'HL12RUN1', goal: 'HL12RUN1-GOAL', standard: 'HL12RUN1-STANDARD' },
    { id: 'HL12RUN2', goal: 'HL12RUN2-GOAL', standard: 'HL12RUN2-STANDARD' },
  ]);
  record(project, { id: 'evt-run1-ready', workUnit: 'HL12RUN1', status: 'rejected' }, '2026-09-02T00:00:00.000Z');
  record(project, { id: 'evt-run2-ready', workUnit: 'HL12RUN2', status: 'rejected' }, '2026-09-02T00:00:01.000Z');
  const dispatched = dispatchInstalled(project, home, root, {
    hook_event_name: 'SessionStart', cwd: project, session_id: 'multi-runnable', turn_id: 'turn-1',
  });
  const context = dispatched.value.hookSpecificOutput.additionalContext;
  const observed = {
    firstCompletePackage: context.includes('HL12RUN1') && context.includes('HL12RUN1-STANDARD'),
    secondCompletePackage: context.includes('HL12RUN2') && context.includes('HL12RUN2-STANDARD'),
    noLeafFallback: !/id=UNKNOWN|status=leaf-fallback/.test(context),
  };
  assert.deepEqual(observed, {
    firstCompletePackage: true,
    secondCompletePackage: true,
    noLeafFallback: true,
  }, `0.11 baseline=${JSON.stringify({ observed, context })}`);
});

test('CEX-04 normal-positive: one runnable unit still receives its complete minimal package', { timeout: 30000 }, (t) => {
  const { root, home, project } = layout(t, 'cex04-green');
  assert.equal(installCli(sourceRoot, project, home, root, ['--write']).value.status, 'INSTALLED');
  writeHarnessState(project, [
    { id: 'HL12RUN1', goal: 'HL12RUN1-GOAL', standard: 'HL12RUN1-STANDARD' },
  ]);
  record(project, { id: 'evt-run1-ready', workUnit: 'HL12RUN1', status: 'rejected' }, '2026-09-02T00:00:00.000Z');
  const dispatched = dispatchInstalled(project, home, root, {
    hook_event_name: 'SessionStart', cwd: project, session_id: 'one-runnable', turn_id: 'turn-1',
  });
  const context = dispatched.value.hookSpecificOutput.additionalContext;
  assert.match(context, /WorkUnit：id=HL12RUN1；status=work-unit/);
  assert.ok(context.includes('HL12RUN1-STANDARD'));
  assert.ok(context.includes('HL12RUN1-GOAL'));
});

test('CEX-05 known-red: stale unbound project capability file must not claim current complete tools', (t) => {
  const { project } = layout(t, 'cex05-red');
  const file = path.join(project, 'docs', 'harness', 'capabilities.json');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify({
    schemaVersion: 1,
    kind: capabilities.KIND,
    models: [{
      channel: 'collaboration.spawn_agent',
      model: 'removed-model-from-old-run',
      reasoning: ['high'],
      family: 'grok',
      status: 'available',
    }],
  }, null, 2)}\n`);
  const projection = capabilities.project(project);
  const observed = {
    unknown: projection.state === 'UNKNOWN',
    incomplete: projection.modelsComplete === false,
    notCurrentModel: !(projection.models || []).some((model) => model.model === 'removed-model-from-old-run' && model.status === 'available'),
    noFreshnessClaim: projection.carrier?.createdAt == null && projection.carrier?.expiresAt == null && projection.carrier?.ttlMs == null,
  };
  assert.deepEqual(observed, {
    unknown: true,
    incomplete: true,
    notCurrentModel: true,
    noFreshnessClaim: true,
  }, `0.11 baseline=${JSON.stringify({ state: projection.state, modelsComplete: projection.modelsComplete, source: projection.source, observed })}`);
});

test('CEX-05 normal-positive: current bound Hook input supports dynamic add and remove', (t) => {
  const { project } = layout(t, 'cex05-green');
  const base = {
    schemaVersion: 1,
    kind: capabilities.KIND,
    models: [
      { channel: 'collaboration.spawn_agent', model: 'current-one', reasoning: ['high'], family: 'grok', status: 'available' },
      { channel: 'collaboration.spawn_agent', model: 'current-two', reasoning: ['xhigh'], family: 'terra', status: 'available' },
    ],
  };
  const bound = {
    writeDynamicCarrier: true,
    now: '2026-09-02T00:00:00.000Z',
    eventName: 'SessionStart',
    sessionId: 'cap-session',
    turnId: 'cap-turn',
  };
  const first = capabilities.project(project, { ...bound, manifest: base });
  assert.equal(first.state, 'known');
  assert.equal(first.modelsComplete, true);
  assert.deepEqual(first.models.map((model) => model.model), ['current-one', 'current-two']);
  assert.equal(first.carrier.sourceType, 'hook-input');
  assert.equal(first.carrier.ttlMs, capabilities.DYNAMIC_CARRIER_TTL_MS);
  const second = capabilities.project(project, { ...bound, manifest: { ...base, models: [base.models[1]] } });
  assert.equal(second.state, 'known');
  assert.deepEqual(second.models.map((model) => model.model), ['current-two']);
});

test('CEX-06 known-red: official upgrade uninstall must remove owned instructions and rollback carrier', { timeout: 60000 }, (t) => {
  const { root, home, project } = layout(t, 'cex06-red');
  const originalAgents = Buffer.from('USER-OWNED-AGENTS-BEFORE-HARNESS\n');
  fs.writeFileSync(path.join(project, 'AGENTS.md'), originalAgents);
  const previous = materializeCandidate(root, retained10, 'retained-010-source');
  assert.equal(previous.sha256, 'd73f4b4f83e6034e33168995c24ca4514d69bcd70ccc19f8aa255da42d218daa');
  assert.equal(previous.artifact.package.version, '0.10.0');

  const installed10 = installCli(previous.root, project, home, root, ['--write']);
  assert.equal(installed10.value.status, 'INSTALLED', installed10.run.stderr);
  const upgraded = runNode(path.join(sourceRoot, 'bin', 'hl.js'), [
    'install', '--target', project, '--source', sourceRoot, '--upgrade', '--write', '--json',
  ], { cwd: project, home, tmpRoot: root });
  assert.equal(upgraded.status, 0, upgraded.stderr);
  assert.equal(install.verify06(project).ok, true);
  assert.ok(runtimeCarriers(project).some((name) => name.startsWith('.harness-lite.rollback-')));
  const removed = installCli(sourceRoot, project, home, root, ['--uninstall', '--write']);
  assert.equal(removed.value.status, 'UNINSTALLED', removed.run.stderr);

  const observed = {
    userInstructionExact: fs.readFileSync(path.join(project, 'AGENTS.md')).equals(originalAgents),
    generatedClaudeAbsent: !fs.existsSync(path.join(project, 'CLAUDE.md')),
    rollbackAbsent: runtimeCarriers(project).filter((name) => name.startsWith('.harness-lite.rollback-')).length === 0,
    stableRuntimeAbsent: !fs.existsSync(path.join(project, install.RUNTIME)),
  };
  assert.deepEqual(observed, {
    userInstructionExact: true,
    generatedClaudeAbsent: true,
    rollbackAbsent: true,
    stableRuntimeAbsent: true,
  }, `0.11 baseline=${JSON.stringify({ carriers: runtimeCarriers(project), observed })}`);
});

test('CEX-06 normal-positive: uninstall removes stable runtime and preserves unrelated user bytes', { timeout: 30000 }, (t) => {
  const { root, home, project } = layout(t, 'cex06-green');
  const agents = Buffer.from('USER-PREFIX-MUST-SURVIVE\n');
  const unrelated = Buffer.from([0, 1, 2, 3, 254, 255]);
  fs.writeFileSync(path.join(project, 'AGENTS.md'), agents);
  fs.writeFileSync(path.join(project, 'unrelated.bin'), unrelated);
  assert.equal(installCli(sourceRoot, project, home, root, ['--write']).value.status, 'INSTALLED');
  const removed = installCli(sourceRoot, project, home, root, ['--uninstall', '--write']);
  assert.equal(removed.value.status, 'UNINSTALLED');
  assert.equal(fs.existsSync(path.join(project, install.RUNTIME)), false);
  assert.equal(fs.readFileSync(path.join(project, 'AGENTS.md')).subarray(0, agents.length).equals(agents), true);
  assert.equal(fs.readFileSync(path.join(project, 'unrelated.bin')).equals(unrelated), true);
});

test('F00 hard-risk freeze: existing action gate stays push-specific and ordinary Bash remains untouched', (t) => {
  const { project } = layout(t, 'hard-risk');
  assert.deepEqual(hardRiskBaseline, [
    'push-pretool-and-native-gate',
    'stop-continuation-exact-binding',
    'harness-owned-write-identity-surface-and-ownership-preconditions',
  ]);
  assert.equal(hook.classifyPush('node --test test/unit.test.js'), null);
  assert.equal(hook.classifyPush('rm -rf ./disposable-build-output'), null);
  assert.equal(hook.preTool(project, {
    hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'node --test test/unit.test.js' },
  }), null);
  const push = hook.preTool(project, {
    hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'git push' },
  });
  assert.equal(push.hookSpecificOutput.permissionDecision, 'deny');
  assert.match(push.hookSpecificOutput.permissionDecisionReason, /Harness push gate/);
});
