'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const test = require('node:test');
const install = require('../lib/install.js');
const io = require('../lib/io.js');
const previous = require('./fixtures/previous-13-snapshot.js');

const sourceRoot = path.resolve(__dirname, '..');

function setup(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hl14-upgrade-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const source = path.join(root, 'released-013'), project = path.join(root, 'project');
  fs.mkdirSync(source); fs.mkdirSync(project);
  for (const row of previous.snapshot().files) {
    const file = path.join(source, row.path);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, Buffer.from(row.contentBase64, 'base64'), { mode: Number.parseInt(row.mode, 8) });
  }
  fs.writeFileSync(path.join(project, 'AGENTS.md'), 'User instruction before Harness\n', { mode: 0o640 });
  fs.mkdirSync(path.join(project, '.codex')); fs.mkdirSync(path.join(project, '.cursor'));
  const codex = '{\n  "description": "User hooks",\n  "hooks": { "Stop": [] }\n}\n';
  const cursor = '{"version":2,"hooks":{"stop":[]},"user_setting":true}\n';
  fs.writeFileSync(path.join(project, '.codex/hooks.json'), codex, { mode: 0o640 });
  fs.writeFileSync(path.join(project, '.cursor/hooks.json'), cursor, { mode: 0o640 });
  const api = require(path.join(source, 'lib/install.js'));
  assert.equal(api.install(project, { write: true, source }).status, 'INSTALLED');
  return { project, source, codex, cursor };
}

function snapshot(root) {
  return io.list(root).map((file) => {
    const stat = fs.lstatSync(file);
    return [path.relative(root, file), stat.mode & 0o777, stat.isSymbolicLink() ? fs.readlinkSync(file) : io.sha(fs.readFileSync(file))];
  });
}

test('released 0.13 identity is pinned before explicit 0.14 upgrade', (t) => {
  const { project } = setup(t);
  const identity = install.inspect(project);
  assert.equal(identity.kind, 'previous-13-snapshot', identity.differences.join(','));
  assert.equal(identity.ok, true);
  assert.equal(identity.digest, install.PREVIOUS_13_SNAPSHOT.packageDigest);
  const before = snapshot(project);
  assert.equal(install.install(project, { write: true, source: sourceRoot }).status, 'HOLD');
  assert.deepEqual(snapshot(project), before);
});

test('0.13 to 0.14 upgrade and uninstall preserve user configuration and rollback ownership', (t) => {
  const { project, codex, cursor } = setup(t);
  const foreign = path.join(project, '.claude/user-data');
  fs.mkdirSync(foreign); fs.writeFileSync(path.join(foreign, 'keep.txt'), 'User data\n');
  const result = install.install(project, { write: true, upgrade: true, source: sourceRoot });
  assert.equal(result.status, 'INSTALLED', result.reason);
  assert.equal(result.kind, 'previous-13-snapshot');
  assert.equal(result.manifest.runtimeVersion, '0.14.0');
  assert.equal(install.verify06(project).ok, true);
  assert.equal(require('../hooks/dispatcher.js').bootstrapVerify(project).ok, true);
  assert.ok(result.manifest.rollbackCarriers.length);
  assert.equal(install.install(project, { write: true, source: sourceRoot }).written, 0);
  assert.equal(install.uninstall(project, { write: true }).status, 'UNINSTALLED');
  assert.equal(fs.readFileSync(path.join(project, 'AGENTS.md'), 'utf8'), 'User instruction before Harness\n');
  assert.equal(fs.readFileSync(path.join(project, '.codex/hooks.json'), 'utf8'), codex);
  assert.equal(fs.readFileSync(path.join(project, '.cursor/hooks.json'), 'utf8'), cursor);
  assert.equal(fs.statSync(path.join(project, 'AGENTS.md')).mode & 0o777, 0o640);
  assert.equal(fs.readFileSync(path.join(foreign, 'keep.txt'), 'utf8'), 'User data\n');
  assert.equal(fs.existsSync(path.join(project, install.RUNTIME)), false);
  assert.equal(fs.existsSync(install.installationAnchorFile(project)), false);
  assert.equal(fs.readdirSync(path.join(project, '.claude')).some((name) => name.startsWith('.harness-lite.rollback-')), false);
});

test('0.13 upgrade transaction faults restore exact prior bytes', (t) => {
  for (const point of ['anchor:written', 'swap:verified', 'hooks:verified']) {
    const { project } = setup(t), before = snapshot(project);
    const result = install.install(project, { write: true, upgrade: true, source: sourceRoot,
      fault: (name) => { if (name === point) throw new Error(`fault:${point}`); } });
    assert.equal(result.status, 'PARTIAL', `${point}:${result.reason}`);
    assert.match(result.reason, /fault:/);
    assert.deepEqual(snapshot(project), before, point);
    assert.equal(install.inspect(project).kind, 'previous-13-snapshot');
  }
});

test('modified 0.13 and mixed runtime anchor identity remain zero-write HOLD', (t) => {
  const { project } = setup(t);
  fs.appendFileSync(path.join(project, install.RUNTIME, 'lib/tree.js'), '\n// user edit must remain\n');
  const before = snapshot(project);
  assert.equal(install.install(project, { write: true, upgrade: true, source: sourceRoot }).status, 'HOLD');
  assert.deepEqual(snapshot(project), before);
  const manifestFile = path.join(project, install.MANIFEST), manifest = io.json(manifestFile);
  manifest.runtimeVersion = '0.8.0';
  fs.writeFileSync(manifestFile, JSON.stringify(manifest), { mode: 0o600 });
  const mixed = snapshot(project);
  assert.equal(install.install(project, { write: true, upgrade: true, source: sourceRoot }).status, 'HOLD');
  assert.deepEqual(snapshot(project), mixed);
});

test('direct published 0.13 uninstall retains its historical Node launcher identity', (t) => {
  const { project, source, codex, cursor } = setup(t);
  assert.equal(require(path.join(source, 'lib/install.js')).uninstall(project, { write: true }).status, 'UNINSTALLED');
  const alternate = path.join(source, 'node');
  fs.copyFileSync(process.execPath, alternate);
  fs.appendFileSync(alternate, '\nHL14 isolated historical-launcher fixture\n');
  fs.chmodSync(alternate, 0o755);
  const run = spawnSync(alternate, ['-e',
    'const api=require(process.argv[1]); const result=api.install(process.argv[2],{write:true,source:process.argv[3]}); console.log(JSON.stringify(result)); process.exit(result.status==="INSTALLED"?0:1)',
    path.join(source, 'lib/install.js'), project, source], { cwd: project, encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  assert.equal(install.inspect(project).kind, 'previous-13-snapshot');
  assert.equal(install.uninstall(project, { write: true }).status, 'UNINSTALLED');
  assert.equal(fs.readFileSync(path.join(project, '.codex/hooks.json'), 'utf8'), codex);
  assert.equal(fs.readFileSync(path.join(project, '.cursor/hooks.json'), 'utf8'), cursor);
});

test('managed published 0.13 retains its unused local definition across launcher changes', (t) => {
  for (const action of ['upgrade', 'uninstall']) {
    const { project, source } = setup(t);
    assert.equal(require(path.join(source, 'lib/install.js')).uninstall(project, { write: true }).status, 'UNINSTALLED');
    const git = spawnSync('/usr/bin/git', ['init', '-q'], { cwd: project, encoding: 'utf8' });
    assert.equal(git.status, 0, git.stderr);
    const system = path.join(source, 'system'), alternate = path.join(source, 'node');
    fs.mkdirSync(system);
    fs.copyFileSync(process.execPath, alternate);
    fs.appendFileSync(alternate, '\nHL14 isolated historical-managed launcher fixture\n');
    fs.chmodSync(alternate, 0o755);
    const run = spawnSync(alternate, ['-e', [
      'const path=require("path"); const [source,root,system]=process.argv.slice(1);',
      'const api=require(path.join(source,"lib/install.js")); const managed=require(path.join(source,"lib/managed.js"));',
      'const global=managed.installGlobal(system,{write:true,source}); if(global.status!=="INSTALLED")throw Error(JSON.stringify(global));',
      'const result=api.install(root,{write:true,source,profile:"managed",globalRoot:system});',
      'console.log(JSON.stringify(result)); process.exit(result.status==="INSTALLED"?0:1);',
    ].join('\n'), source, project, system], { cwd: project, encoding: 'utf8' });
    assert.equal(run.status, 0, run.stderr);
    assert.equal(install.inspect(project).kind, 'previous-13-snapshot');
    assert.equal(require('../lib/managed.js').installGlobal(system, { write: true, source: sourceRoot }).status, 'INSTALLED');
    const result = action === 'upgrade' ? install.install(project, { write: true, upgrade: true, source: sourceRoot,
      profile: 'managed', globalRoot: system }) : install.uninstall(project, { write: true, globalRoot: system });
    assert.equal(result.status, action === 'upgrade' ? 'INSTALLED' : 'UNINSTALLED', result.reason);
  }
});
