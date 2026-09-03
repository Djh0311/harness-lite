'use strict';

const assert = require('assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const test = require('node:test');

const syntheticProcessHome = fs.mkdtempSync(path.join(os.tmpdir(), 'hl12-f02-process-home-'));
const priorCodexHome = process.env.CODEX_HOME;
process.env.CODEX_HOME = path.join(syntheticProcessHome, '.codex');
fs.mkdirSync(process.env.CODEX_HOME, { recursive: true });

const install = require('../lib/install.js');
const io = require('../lib/io.js');
const managed = require('../lib/managed.js');
const authoritativeHook = require('../lib/hook.js');
const bootstrapDispatcher = require('../hooks/dispatcher.js');
const previous09Fixture = require('./fixtures/previous-09-snapshot.js');

const sourceRoot = path.resolve(__dirname, '..');
const retained10 = path.join(sourceRoot, 'docs', 'harness', 'artifacts',
  'harness-lite-0.10.0-d73f4b4f83e6034e33168995c24ca4514d69bcd70ccc19f8aa255da42d218daa.json');
const retained11 = path.join(sourceRoot, 'docs', 'harness', 'artifacts',
  'harness-lite-0.11.0-8e14e641b7d0fe3641a5e74c49b11a60761e0dc63fb75866ff8226e6b3687ae5.json');
test.after(() => {
  if (priorCodexHome === undefined) delete process.env.CODEX_HOME; else process.env.CODEX_HOME = priorCodexHome;
  fs.rmSync(syntheticProcessHome, { recursive: true, force: false });
  assert.equal(fs.existsSync(syntheticProcessHome), false);
});

function disposable(t, label) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `hl12-f02-${label}-`));
  t.after(() => {
    if (!fs.existsSync(root)) return;
    const stat = fs.lstatSync(root); assert.equal(stat.isDirectory() && !stat.isSymbolicLink(), true, root);
    fs.rmSync(root, { recursive: true, force: false }); assert.equal(fs.existsSync(root), false, root);
  });
  return root;
}
function snapshot(root) {
  const rows = [];
  function walk(dir, prefix = '') {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const file = path.join(dir, entry.name), rel = prefix ? `${prefix}/${entry.name}` : entry.name, stat = fs.lstatSync(file);
      if (stat.isDirectory() && !stat.isSymbolicLink()) { rows.push([rel, 'directory', stat.mode & 0o777]); walk(file, rel); }
      else if (stat.isFile()) rows.push([rel, 'file', stat.mode & 0o777, fs.readFileSync(file).toString('base64')]);
      else if (stat.isSymbolicLink()) rows.push([rel, 'symlink', fs.readlinkSync(file)]);
      else rows.push([rel, 'other', stat.mode & 0o777]);
    }
  }
  walk(root); return rows;
}
function materializeArtifact(parent, file, name) {
  const root = path.join(parent, name), artifact = JSON.parse(fs.readFileSync(file, 'utf8')); fs.mkdirSync(root, { recursive: true });
  for (const row of artifact.files) {
    const target = path.join(root, row.path); fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, Buffer.from(row.contentBase64, 'base64')); fs.chmodSync(target, Number.parseInt(row.mode, 8));
  }
  return root;
}
function materialize09(parent) {
  const root = path.join(parent, 'previous-09-source'); fs.mkdirSync(root, { recursive: true });
  for (const row of previous09Fixture.snapshot().files) {
    const target = path.join(root, row.path); fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, Buffer.from(row.contentBase64, 'base64')); fs.chmodSync(target, Number.parseInt(row.mode, 8));
  }
  return root;
}
function materializeCurrentSource(parent, name) {
  const root = path.join(parent, name); fs.mkdirSync(root, { recursive: true });
  for (const rel of install.runtimePaths(sourceRoot)) {
    const target = path.join(root, rel); fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(sourceRoot, rel), target); fs.chmodSync(target, rel === 'bin/hl.js' || rel === 'hooks/dispatcher.js' ? 0o755 : 0o644);
  }
  return root;
}
function requireFresh(file) { delete require.cache[require.resolve(file)]; return require(file); }
function installedDispatcher(project, input, args = []) {
  return spawnSync(process.execPath, [path.join(project, install.RUNTIME, 'hooks', 'dispatcher.js'), ...args], {
    cwd: project, input: typeof input === 'string' ? input : JSON.stringify(input), encoding: 'utf8', timeout: 30000,
    env: { ...process.env, CODEX_HOME: process.env.CODEX_HOME },
  });
}
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}
const canonicalDigest = (value) => `sha256:${crypto.createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex')}`;
function rewriteAnchor(project, mutate) {
  const file = install.installationAnchorFile(project), value = JSON.parse(fs.readFileSync(file, 'utf8'));
  mutate(value); const base = { ...value }; delete base.anchorDigest; value.anchorDigest = canonicalDigest(base);
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`); fs.chmodSync(file, 0o600);
}
function coherentTamper(project, rel = 'lib/tree.js', suffix = '\n// coherent tamper\n') {
  const runtime = path.join(project, install.RUNTIME), manifestFile = path.join(project, install.MANIFEST);
  fs.appendFileSync(path.join(runtime, rel), suffix);
  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8')); manifest.packageDigest = io.digest(runtime, manifest.managedPaths);
  fs.writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`); fs.chmodSync(manifestFile, 0o600);
}
function usageBytes(project) {
  const dir = path.join(project, 'docs', 'harness', 'usage');
  return fs.existsSync(dir) ? snapshot(dir) : [];
}

const pushParityCorpus = [
  ['direct', 'git push origin HEAD:refs/heads/main', true],
  ['absolute-git', '/usr/bin/git push origin HEAD:refs/heads/main', true],
  ['leading-assignment', 'X=1 git push origin HEAD:refs/heads/main', true],
  ['command', 'command git push origin HEAD:refs/heads/main', true],
  ['command-option-assignment', 'command -- X=1 git push origin HEAD:refs/heads/main', true],
  ['exec', 'exec git push origin HEAD:refs/heads/main', true],
  ['exec-option-assignment', 'exec -- X=1 git push origin HEAD:refs/heads/main', true],
  ['env-assignment', 'env X=1 git push origin HEAD:refs/heads/main', true],
  ['env-short-option-post-assignment', 'env -u OLD X=1 git push origin HEAD:refs/heads/main', true],
  ['env-long-option-post-assignment', 'env --unset OLD X=1 git push origin HEAD:refs/heads/main', true],
  ['env-chdir-post-assignment', 'env -C /tmp X=1 git push origin HEAD:refs/heads/main', true],
  ['env-long-chdir-post-assignment', 'env --chdir /tmp X=1 git push origin HEAD:refs/heads/main', true],
  ['env-option-terminator', 'env -- git push origin HEAD:refs/heads/main', true],
  ['env-split-string-argument-only', 'env -S "git push origin HEAD:refs/heads/main"', false],
  ['sudo-env-option-post-assignment', 'sudo env -u OLD X=1 git push origin HEAD:refs/heads/main', true],
  ['sudo-git', 'sudo git push origin HEAD:refs/heads/main', true],
  ['sudo-option-terminator', 'sudo -- git push origin HEAD:refs/heads/main', false],
  ['bash-wrapper', 'bash -lc "git push origin HEAD:refs/heads/main"', true],
  ['sh-wrapper', 'sh -c "git push origin HEAD:refs/heads/main"', true],
  ['zsh-wrapper', 'zsh -c "git push origin HEAD:refs/heads/main"', true],
  ['eval-wrapper', 'eval "git push origin HEAD:refs/heads/main"', true],
  ['dollar-command-substitution', 'echo $(git push origin HEAD:refs/heads/main)', true],
  ['backtick-command-substitution', 'echo `git push origin HEAD:refs/heads/main`', true],
  ['cd-chain', 'cd /tmp && git push origin HEAD:refs/heads/main', true],
  ['git-global-option', 'git --no-pager push origin HEAD:refs/heads/main', true],
  ['no-verify', 'git push --no-verify origin HEAD:refs/heads/main', true],
  ['ordinary-echo', 'echo git push', false],
  ['ordinary-test', 'test -n git push', false],
  ['ordinary-rm', 'rm -rf git push', false],
  ['ordinary-printf', 'printf "git push"', false],
  ['ordinary-git-status', 'git status', false],
  ['ordinary-cd-chain', 'cd /tmp && echo ordinary', false],
];

test('F02 degraded push classifier is structurally identical and bidirectionally matches the authoritative corpus', () => {
  for (const name of ['shellSegments', 'tokens', 'classifyPush']) {
    assert.equal(bootstrapDispatcher[name].toString(), authoritativeHook[name].toString(), `${name}:source parity`);
  }
  for (const [label, command, expected] of pushParityCorpus) {
    const authoritative = Boolean(authoritativeHook.classifyPush(command));
    assert.equal(authoritative, expected, `${label}:authoritative truth`);
    assert.equal(Boolean(bootstrapDispatcher.classifyPush(command)), authoritative, `${label}:bidirectional parity`);
  }
});

test('F02 fresh anchor binds target/runtime/manifest ownership without retaining original user instruction bytes', { timeout: 60000 }, (t) => {
  const root = disposable(t, 'fresh-contract'), project = path.join(root, 'project'); fs.mkdirSync(project);
  const secret = 'USER-SOURCE-BYTES-MUST-NOT-BE-COPIED-87d8e1'; fs.writeFileSync(path.join(project, 'AGENTS.md'), `${secret}\n`);
  const added = install.install(project, { write: true, source: sourceRoot }); assert.equal(added.status, 'INSTALLED', added.reason);
  const checked = install.verify06(project); assert.equal(checked.ok, true, checked.differences.join(','));
  const anchorFile = install.installationAnchorFile(project), anchor = JSON.parse(fs.readFileSync(anchorFile, 'utf8'));
  assert.equal(anchor.targetCanonical, fs.realpathSync(project)); assert.equal(anchor.runtimeVersion, install.VERSION);
  assert.equal(anchor.sourceCommit, install.SOURCE_COMMIT); assert.equal(anchor.sourcePackageDigest, checked.manifest.packageDigest);
  assert.equal(anchor.hookDefinitionDigest, checked.manifest.hookDefinitionDigest);
  assert.equal(anchor.manifestDigest, `sha256:${io.sha(fs.readFileSync(path.join(project, install.MANIFEST)))}`);
  assert.equal(anchor.instructionOwnershipDigest, canonicalDigest(checked.manifest.instructionOwnership));
  assert.equal(anchor.rollbackCarriersDigest, canonicalDigest(checked.manifest.rollbackCarriers));
  const manifestText = fs.readFileSync(path.join(project, install.MANIFEST), 'utf8');
  assert.equal(manifestText.includes('originalBodyBase64'), false); assert.equal(manifestText.includes(secret), false);
  assert.equal(manifestText.includes(Buffer.from(`${secret}\n`).toString('base64')), false);
  const bootstrap = requireFresh(path.join(project, install.RUNTIME, 'hooks', 'dispatcher.js')).bootstrapVerify(project);
  assert.equal(bootstrap.ok, true, bootstrap.differences.join(','));
  const run = installedDispatcher(project, { hook_event_name: 'SessionStart', cwd: project, session_id: 'healthy' });
  assert.equal(run.status, 0, run.stderr); assert.match(run.stdout, /Harness/); assert.ok(usageBytes(project).length > 0);
  const removed = install.uninstall(project, { write: true }); assert.equal(removed.status, 'UNINSTALLED', removed.reason);
  assert.equal(fs.existsSync(anchorFile), false); assert.equal(fs.existsSync(path.join(project, '.codex')), false);
  assert.equal(fs.readFileSync(path.join(project, 'AGENTS.md'), 'utf8'), `${secret}\n`);
});

test('F02 coherent runtime plus manifest tamper is rejected before runtime modules load and writes no managed observation', { timeout: 60000 }, (t) => {
  const root = disposable(t, 'coherent-tamper'), project = path.join(root, 'project'); fs.mkdirSync(project);
  assert.equal(install.install(project, { write: true, source: sourceRoot }).status, 'INSTALLED');
  const sentinel = path.join(root, 'hook-module-loaded');
  coherentTamper(project, 'lib/hook.js', `\nrequire('fs').writeFileSync(${JSON.stringify(sentinel)}, 'LOADED');\n`);
  const beforeUsage = usageBytes(project), sourceCheck = install.verify06(project);
  assert.equal(sourceCheck.ok, false); assert.ok(sourceCheck.differences.some((row) => row.startsWith('installationAnchor:')));
  const installedApi = requireFresh(path.join(project, install.RUNTIME, 'lib', 'install.js'));
  assert.equal(installedApi.verify06(project).ok, false);
  const beforeDegradedCalls = snapshot(project);
  const run = installedDispatcher(project, { hook_event_name: 'SessionStart', cwd: project, session_id: 'tampered' });
  assert.equal(run.status, 0, run.stderr); assert.match(run.stdout, /identity UNKNOWN/); assert.equal(fs.existsSync(sentinel), false);
  assert.deepEqual(usageBytes(project), beforeUsage);
  for (const [label, command, expected] of pushParityCorpus) {
    const hook = installedDispatcher(project, { hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command }, cwd: project });
    assert.equal(hook.status, 0, `${label}:${hook.stderr}`); assert.equal(hook.stderr, '', `${label}:stderr`);
    if (expected) {
      const output = JSON.parse(hook.stdout); assert.equal(output.hookSpecificOutput.permissionDecision, 'deny', `${label}:deny`);
    } else assert.equal(hook.stdout, '', `${label}:ordinary stdout`);
  }
  const native = installedDispatcher(project, '0'.repeat(40) + ' '.repeat(1) + '1'.repeat(40) + ' refs/heads/main\n', ['--native-pre-push', 'origin', 'local']);
  assert.equal(native.status, 1); assert.match(native.stderr, /identity/);
  const assertion = installedDispatcher(project, '{}', ['--push-assert']);
  assert.equal(assertion.status, 1); assert.match(assertion.stdout, /identity UNKNOWN/); assert.equal(assertion.stderr, '');
  assert.equal(fs.existsSync(sentinel), false); assert.deepEqual(usageBytes(project), beforeUsage);
  assert.deepEqual(snapshot(project), beforeDegradedCalls);
});

test('F02 manifest-only ownership forgery cannot authorize uninstall and remains byte-exact zero-write', { timeout: 60000 }, (t) => {
  const root = disposable(t, 'ownership-forgery'), project = path.join(root, 'project'); fs.mkdirSync(project);
  fs.writeFileSync(path.join(project, 'AGENTS.md'), 'USER-OWNED-FORGERY\n');
  assert.equal(install.install(project, { write: true, source: sourceRoot }).status, 'INSTALLED');
  const file = path.join(project, install.MANIFEST), value = JSON.parse(fs.readFileSync(file, 'utf8'));
  value.instructionOwnership.files[0].originalDigest = `sha256:${'0'.repeat(64)}`;
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`); fs.chmodSync(file, 0o600);
  const forged = snapshot(project), checked = install.verify06(project); assert.equal(checked.ok, false);
  assert.ok(checked.differences.some((row) => row.startsWith('installationAnchor:')));
  const removed = install.uninstall(project, { write: true }); assert.equal(removed.status, 'HOLD'); assert.deepEqual(snapshot(project), forged);
});

test('F02 missing modified symlink wrong-target and wrong-package anchors degrade cleanly and HOLD uninstall', { timeout: 120000 }, (t) => {
  const root = disposable(t, 'anchor-matrix');
  const mutations = [
    ['missing', (project, file) => fs.unlinkSync(file)],
    ['modified', (project, file) => fs.appendFileSync(file, ' ')],
    ['symlink', (project, file) => { const copy = path.join(project, 'anchor-copy.json'); fs.renameSync(file, copy); fs.symlinkSync(path.relative(path.dirname(file), copy), file); }],
    ['wrong-target', (project) => rewriteAnchor(project, (value) => { value.targetCanonical = `${fs.realpathSync(project)}-other`; })],
    ['wrong-package', (project) => rewriteAnchor(project, (value) => { value.sourcePackageDigest = `sha256:${'f'.repeat(64)}`; })],
  ];
  for (const [label, mutate] of mutations) {
    const project = path.join(root, label); fs.mkdirSync(project); assert.equal(install.install(project, { write: true, source: sourceRoot }).status, 'INSTALLED', label);
    const file = install.installationAnchorFile(project); mutate(project, file); const degraded = snapshot(project), beforeUsage = usageBytes(project);
    const checked = install.verify06(project); assert.equal(checked.ok, false, label); assert.ok(checked.differences.some((row) => row.startsWith('installationAnchor:')), label);
    const run = installedDispatcher(project, { hook_event_name: 'UserPromptSubmit', cwd: project, prompt: 'normal work' });
    assert.equal(run.status, 0, `${label}:${run.stderr}`); assert.match(run.stdout, /identity UNKNOWN/, label); assert.deepEqual(usageBytes(project), beforeUsage, label);
    const removed = install.uninstall(project, { write: true }); assert.equal(removed.status, 'HOLD', label); assert.deepEqual(snapshot(project), degraded, label);
  }
});

test('F02 fresh managed and official 0.9 0.10 0.11 upgrades all receive a healthy anchor bound to rollback identity', { timeout: 180000 }, (t) => {
  const root = disposable(t, 'healthy-matrix'), sources = [
    ['0.9', materialize09(root)],
    ['0.10', materializeArtifact(root, retained10, 'previous-10-source')],
    ['0.11', materializeArtifact(root, retained11, 'previous-11-source')],
  ];
  for (const [label, previousSource] of sources) {
    const project = path.join(root, `project-${label}`); fs.mkdirSync(project); fs.writeFileSync(path.join(project, 'AGENTS.md'), `USER-${label}\n`);
    const previousApi = requireFresh(path.join(previousSource, 'lib', 'install.js'));
    assert.equal(previousApi.install(project, { write: true, source: previousSource }).status, 'INSTALLED', label);
    const upgraded = install.install(project, { write: true, upgrade: true, source: sourceRoot }); assert.equal(upgraded.status, 'INSTALLED', `${label}:${upgraded.reason}`);
    const checked = install.verify06(project); assert.equal(checked.ok, true, `${label}:${checked.differences.join(',')}`);
    assert.ok(checked.manifest.rollbackCarriers.length >= 1, label); assert.equal(checked.anchor.value.rollbackCarriersDigest, canonicalDigest(checked.manifest.rollbackCarriers), label);
    assert.equal(install.uninstall(project, { write: true }).status, 'UNINSTALLED', label); assert.equal(fs.existsSync(install.installationAnchorFile(project)), false, label);
  }
  const systemRoot = path.join(root, 'system'), managedProject = path.join(root, 'managed-project'); fs.mkdirSync(systemRoot); fs.mkdirSync(managedProject);
  const git = (args) => spawnSync('/usr/bin/git', args, { cwd: managedProject, encoding: 'utf8', env: { PATH: '/usr/bin:/bin' } });
  assert.equal(git(['init', '-q']).status, 0); assert.equal(git(['config', 'user.email', 'f02@example.invalid']).status, 0); assert.equal(git(['config', 'user.name', 'F02']).status, 0);
  fs.writeFileSync(path.join(managedProject, 'README.md'), '# managed\n'); git(['add', 'README.md']); git(['commit', '-q', '-m', 'init']);
  assert.equal(managed.installGlobal(systemRoot, { write: true, source: sourceRoot }).status, 'INSTALLED');
  assert.equal(install.install(managedProject, { write: true, source: sourceRoot, profile: 'managed', globalRoot: systemRoot }).status, 'INSTALLED');
  const managedCheck = install.verify06(managedProject); assert.equal(managedCheck.ok, true, managedCheck.differences.join(',')); assert.equal(managedCheck.manifest.profile, 'managed');
  assert.equal(requireFresh(path.join(managedProject, install.RUNTIME, 'hooks', 'dispatcher.js')).bootstrapVerify(managedProject).ok, true);
  assert.equal(install.uninstall(managedProject, { write: true, globalRoot: systemRoot }).status, 'UNINSTALLED');
});

test('F02 anchor participates in install upgrade uninstall and extension fault rollback transactions', { timeout: 180000 }, (t) => {
  const root = disposable(t, 'faults');
  for (const point of ['anchor:written', 'instruction:AGENTS.md:written']) {
    const project = path.join(root, `fresh-${point.replaceAll(':', '-')}`); fs.mkdirSync(project); fs.writeFileSync(path.join(project, 'AGENTS.md'), 'FRESH-FAULT\n');
    const before = snapshot(project), result = install.install(project, { write: true, source: sourceRoot, fault: (name) => { if (name === point) throw new Error(`fault:${point}`); } });
    assert.equal(result.status, 'PARTIAL', point); assert.match(result.reason, new RegExp(`fault:${point}`)); assert.deepEqual(snapshot(project), before, point);
  }
  const previousSource = materializeArtifact(root, retained11, 'upgrade-old'), upgradeProject = path.join(root, 'upgrade-project'); fs.mkdirSync(upgradeProject);
  assert.equal(requireFresh(path.join(previousSource, 'lib', 'install.js')).install(upgradeProject, { write: true, source: previousSource }).status, 'INSTALLED');
  const upgradeBefore = snapshot(upgradeProject), upgradeFault = install.install(upgradeProject, { write: true, upgrade: true, source: sourceRoot,
    fault: (name) => { if (name === 'anchor:written') throw new Error('fault:upgrade-anchor'); } });
  assert.equal(upgradeFault.status, 'PARTIAL'); assert.match(upgradeFault.reason, /fault:upgrade-anchor/); assert.deepEqual(snapshot(upgradeProject), upgradeBefore);

  const currentProject = path.join(root, 'current-upgrade-project'), changedSource = materializeCurrentSource(root, 'changed-current-source'); fs.mkdirSync(currentProject);
  assert.equal(install.install(currentProject, { write: true, source: sourceRoot }).status, 'INSTALLED');
  fs.appendFileSync(path.join(changedSource, 'lib', 'tree.js'), '\n// changed package for anchor rollback\n');
  const currentBefore = snapshot(currentProject), currentFault = install.install(currentProject, { write: true, upgrade: true, source: changedSource,
    fault: (name) => { if (name === 'swap:verified') throw new Error('fault:current-anchor-rollback'); } });
  assert.equal(currentFault.status, 'PARTIAL'); assert.match(currentFault.reason, /fault:current-anchor-rollback/); assert.deepEqual(snapshot(currentProject), currentBefore);

  const uninstallProject = path.join(root, 'uninstall-project'); fs.mkdirSync(uninstallProject); assert.equal(install.install(uninstallProject, { write: true, source: sourceRoot }).status, 'INSTALLED');
  for (const point of ['anchor:uninstall:removed', 'uninstall:commit']) {
    const before = snapshot(uninstallProject), result = install.uninstall(uninstallProject, { write: true, fault: (name) => { if (name === point) throw new Error(`fault:${point}`); } });
    assert.equal(result.status, 'PARTIAL', point); assert.match(result.reason, new RegExp(`fault:${point}`)); assert.deepEqual(snapshot(uninstallProject), before, point);
  }

  const extensionDir = path.join(root, 'extension'); fs.mkdirSync(extensionDir); fs.writeFileSync(path.join(extensionDir, 'payload.js'), 'module.exports=1;\n');
  fs.writeFileSync(path.join(extensionDir, 'manifest.json'), `${JSON.stringify({ version: 1, id: 'f02-ext', packageVersion: '1.0.0',
    files: { [`${install.RUNTIME}/extensions/f02-ext/payload.js`]: 'payload.js' } }, null, 2)}\n`);
  const extensionBefore = snapshot(uninstallProject);
  assert.throws(() => install.installExtension(uninstallProject, extensionDir, { write: true, fault: (name) => { if (name === 'anchor:written') throw new Error('fault:extension-anchor'); } }), /fault:extension-anchor/);
  assert.deepEqual(snapshot(uninstallProject), extensionBefore);
  assert.equal(install.installExtension(uninstallProject, extensionDir, { write: true }).status, 'INSTALLED'); assert.equal(install.verify06(uninstallProject).ok, true);
  assert.equal(install.uninstallExtension(uninstallProject, 'f02-ext', { write: true }).status, 'UNINSTALLED'); assert.equal(install.verify06(uninstallProject).ok, true);
});
