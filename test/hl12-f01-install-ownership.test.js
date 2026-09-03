'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const test = require('node:test');

const install = require('../lib/install.js');
const managed = require('../lib/managed.js');
const previous09Fixture = require('./fixtures/previous-09-snapshot.js');

const sourceRoot = path.resolve(__dirname, '..');
const retained10 = path.join(sourceRoot, 'docs', 'harness', 'artifacts',
  'harness-lite-0.10.0-d73f4b4f83e6034e33168995c24ca4514d69bcd70ccc19f8aa255da42d218daa.json');
const retained11 = path.join(sourceRoot, 'docs', 'harness', 'artifacts',
  'harness-lite-0.11.0-8e14e641b7d0fe3641a5e74c49b11a60761e0dc63fb75866ff8226e6b3687ae5.json');
const syntheticProcessHome = fs.mkdtempSync(path.join(os.tmpdir(), 'hl12-f01-process-home-'));
const priorCodexHome = process.env.CODEX_HOME;
process.env.CODEX_HOME = path.join(syntheticProcessHome, '.codex');
fs.mkdirSync(process.env.CODEX_HOME, { recursive: true });
test.after(() => {
  if (priorCodexHome === undefined) delete process.env.CODEX_HOME; else process.env.CODEX_HOME = priorCodexHome;
  fs.rmSync(syntheticProcessHome, { recursive: true, force: false });
  assert.equal(fs.existsSync(syntheticProcessHome), false);
});

function disposable(t, label) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `hl12-f01-${label}-`));
  t.after(() => {
    if (!fs.existsSync(root)) return;
    const stat = fs.lstatSync(root);
    assert.equal(stat.isDirectory() && !stat.isSymbolicLink(), true, root);
    fs.rmSync(root, { recursive: true, force: false });
    assert.equal(fs.existsSync(root), false, root);
  });
  return root;
}

function materializeArtifact(parent, file, name) {
  const root = path.join(parent, name), artifact = JSON.parse(fs.readFileSync(file, 'utf8'));
  fs.mkdirSync(root, { recursive: true });
  for (const row of artifact.files) {
    const target = path.join(root, row.path);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, Buffer.from(row.contentBase64, 'base64'));
    fs.chmodSync(target, Number.parseInt(row.mode, 8));
  }
  return root;
}

function materialize09(parent) {
  const root = path.join(parent, 'previous-09-source'); fs.mkdirSync(root, { recursive: true });
  for (const row of previous09Fixture.snapshot().files) {
    const target = path.join(root, row.path);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, Buffer.from(row.contentBase64, 'base64'));
    fs.chmodSync(target, Number.parseInt(row.mode, 8));
  }
  return root;
}

function requireFresh(file) {
  delete require.cache[require.resolve(file)];
  return require(file);
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

function rollbackNames(root) {
  const parent = path.join(root, '.claude');
  return fs.existsSync(parent) ? fs.readdirSync(parent).filter((name) => name.startsWith('.harness-lite.rollback-')).sort() : [];
}

function cliInstall(source, target, home, tmp, args = []) {
  const env = { ...process.env, HOME: home, USERPROFILE: home, TMPDIR: tmp, XDG_CONFIG_HOME: path.join(home, '.config') };
  delete env.CODEX_HOME;
  const run = spawnSync(process.execPath, [path.join(source, 'bin', 'hl.js'), 'install', '--target', target, '--source', source, ...args, '--json'], {
    cwd: tmp, env, encoding: 'utf8', timeout: 30000, maxBuffer: 64 * 1024 * 1024,
  });
  return { run, value: JSON.parse(String(run.stdout || '').trim()) };
}

test('F01 canonical boundary rejects exact global root, symlink alias, and descendants before target content read', { timeout: 30000 }, (t) => {
  const root = disposable(t, 'boundary'), home = path.join(root, 'home'), global = path.join(home, '.codex');
  fs.mkdirSync(global, { recursive: true });
  const agents = path.join(global, 'AGENTS.md'), before = Buffer.from('GLOBAL-CONTENT-MUST-NOT-BE-READ\n');
  fs.writeFileSync(agents, before);
  const alias = path.join(root, 'global-alias'); fs.symlinkSync(global, alias, 'dir');

  for (const target of [global, alias, path.join(alias, 'nested-project')]) {
    const readLog = path.join(root, `reads-${path.basename(target)}-${Math.random().toString(16).slice(2)}.log`);
    const preload = path.join(root, `observer-${Math.random().toString(16).slice(2)}.js`);
    fs.writeFileSync(preload, [
      "'use strict';", "const fs=require('fs');", "const path=require('path');",
      "const read=fs.readFileSync.bind(fs);", "const append=fs.appendFileSync.bind(fs);",
      "const watched=path.resolve(process.env.HL12_WATCHED);", "const log=path.resolve(process.env.HL12_LOG);",
      "fs.readFileSync=function(file,...args){ const value=(typeof file==='string'||Buffer.isBuffer(file))?path.resolve(String(file)):null; if(value&&(value===watched||value.startsWith(watched+path.sep))) append(log,value+'\\n'); return read(file,...args); };",
    ].join('\n'));
    const env = { ...process.env, HOME: home, USERPROFILE: home, TMPDIR: root, NODE_OPTIONS: `--require=${preload}`, HL12_WATCHED: global, HL12_LOG: readLog };
    delete env.CODEX_HOME;
    const run = spawnSync(process.execPath, [path.join(sourceRoot, 'bin', 'hl.js'), 'install', '--target', target, '--source', sourceRoot, '--write', '--json'], {
      cwd: root, env, encoding: 'utf8', timeout: 30000,
    });
    const result = JSON.parse(run.stdout.trim());
    assert.equal(result.status, 'HOLD', target);
    assert.match(result.reason, /全局 Codex 配置根/, target);
    assert.equal(fs.existsSync(readLog), false, target);
    assert.equal(fs.readFileSync(agents).equals(before), true, target);
  }
  for (const [name, expression] of [
    ['inspect', 'api.inspect(target)'],
    ['verify06', 'api.verify06(target)'],
    ['health', 'api.health(target)'],
    ['uninstall', 'api.uninstall(target,{write:true})'],
  ]) {
    const readLog = path.join(root, `formal-${name}-reads.log`), preload = path.join(root, `formal-${name}-observer.js`);
    fs.writeFileSync(preload, [
      "'use strict';", "const fs=require('fs');", "const path=require('path');", "const read=fs.readFileSync.bind(fs);", "const append=fs.appendFileSync.bind(fs);",
      "const watched=path.resolve(process.env.HL12_WATCHED);", "const log=path.resolve(process.env.HL12_LOG);",
      "fs.readFileSync=function(file,...args){ const value=(typeof file==='string'||Buffer.isBuffer(file))?path.resolve(String(file)):null; if(value&&(value===watched||value.startsWith(watched+path.sep))) append(log,value+'\\n'); return read(file,...args); };",
    ].join('\n'));
    const script = `const api=require(${JSON.stringify(path.join(sourceRoot, 'lib', 'install.js'))});const target=${JSON.stringify(global)};process.stdout.write(JSON.stringify(${expression}));`;
    const env = { ...process.env, HOME: home, USERPROFILE: home, TMPDIR: root, NODE_OPTIONS: `--require=${preload}`, HL12_WATCHED: global, HL12_LOG: readLog };
    delete env.CODEX_HOME;
    const run = spawnSync(process.execPath, ['-e', script], { cwd: root, env, encoding: 'utf8', timeout: 30000 });
    assert.equal(run.status, 0, `${name}:${run.stderr}`);
    const result = JSON.parse(run.stdout); assert.equal(result.status, 'HOLD', name); assert.match(result.reason, /全局 Codex 配置根/, name);
    assert.equal(fs.existsSync(readLog), false, name);
  }
  assert.equal(fs.existsSync(path.join(global, install.RUNTIME)), false);
});

test('F01 a same-named ordinary .codex non-Git project remains installable and uninstallable', { timeout: 30000 }, (t) => {
  const root = disposable(t, 'ordinary-dot-codex'), home = path.join(root, 'home'), project = path.join(root, 'ordinary', '.codex');
  fs.mkdirSync(path.join(home, '.codex'), { recursive: true }); fs.mkdirSync(project, { recursive: true });
  const original = Buffer.from('ORDINARY-NON-GIT\n'); fs.writeFileSync(path.join(project, 'AGENTS.md'), original);
  const added = cliInstall(sourceRoot, project, home, root, ['--write']);
  assert.equal(added.value.status, 'INSTALLED', added.run.stderr);
  const removed = cliInstall(sourceRoot, project, home, root, ['--uninstall', '--write']);
  assert.equal(removed.value.status, 'UNINSTALLED', removed.run.stderr);
  assert.equal(fs.readFileSync(path.join(project, 'AGENTS.md')).equals(original), true);
});

test('F01 fresh and official 0.9/0.10/0.11 upgrade uninstall restore exact user instruction bytes and remove rollback', { timeout: 120000 }, (t) => {
  const root = disposable(t, 'upgrade-matrix');
  const sources = [
    ['fresh', null],
    ['0.9', materialize09(root)],
    ['0.10', materializeArtifact(root, retained10, 'previous-10-source')],
    ['0.11', materializeArtifact(root, retained11, 'previous-11-source')],
  ];
  for (const [label, previousSource] of sources) {
    const project = path.join(root, `project-${label}`); fs.mkdirSync(project);
    const original = Buffer.from(`USER-OWNED-${label}\n`), unrelated = Buffer.from([0, 1, 2, 253, 254, 255]);
    fs.writeFileSync(path.join(project, 'AGENTS.md'), original); fs.writeFileSync(path.join(project, 'unrelated.bin'), unrelated);
    if (previousSource) {
      const previousApi = requireFresh(path.join(previousSource, 'lib', 'install.js'));
      assert.equal(previousApi.install(project, { write: true, source: previousSource }).status, 'INSTALLED', label);
      const upgraded = install.install(project, { write: true, upgrade: true, source: sourceRoot });
      assert.equal(upgraded.status, 'INSTALLED', `${label}:${upgraded.reason || ''}`);
      assert.ok(rollbackNames(project).length >= 1, label);
    } else assert.equal(install.install(project, { write: true, source: sourceRoot }).status, 'INSTALLED');
    const checked = install.verify06(project); assert.equal(checked.ok, true, `${label}:${checked.differences.join(',')}`);
    assert.equal(checked.manifest.instructionOwnership.schemaVersion, 1, label);
    assert.equal(Array.isArray(checked.manifest.rollbackCarriers), true, label);
    const removed = install.uninstall(project, { write: true });
    assert.equal(removed.status, 'UNINSTALLED', `${label}:${removed.reason || ''}`);
    assert.equal(fs.readFileSync(path.join(project, 'AGENTS.md')).equals(original), true, label);
    assert.equal(fs.existsSync(path.join(project, 'CLAUDE.md')), false, label);
    assert.equal(fs.readFileSync(path.join(project, 'unrelated.bin')).equals(unrelated), true, label);
    assert.equal(fs.existsSync(path.join(project, install.RUNTIME)), false, label);
    assert.deepEqual(rollbackNames(project), [], label);
  }
});

test('F01 modified, malformed, and duplicate owned markers HOLD with byte-exact zero write', { timeout: 60000 }, (t) => {
  const root = disposable(t, 'marker-holds');
  const ambiguous = path.join(root, 'fresh-unowned-exact'); fs.mkdirSync(ambiguous);
  fs.writeFileSync(path.join(ambiguous, 'AGENTS.md'), `${install.INSTRUCTION}\n`);
  const ambiguousBefore = snapshot(ambiguous), ambiguousResult = install.install(ambiguous, { write: true, source: sourceRoot });
  assert.equal(ambiguousResult.status, 'HOLD'); assert.match(ambiguousResult.reason, /没有 runtime ownership/); assert.deepEqual(snapshot(ambiguous), ambiguousBefore);
  const mutations = [
    ['modified', (body) => body.replace('Harness Lite 0.12 内部核心', 'Harness Lite USER EDIT')],
    ['malformed', (body) => body.replace('<!-- HARNESS-LITE:END -->', '<!-- HARNESS-LITE:END-BROKEN -->')],
    ['duplicate', (body) => `${body}\n${install.INSTRUCTION}\n`],
  ];
  for (const [label, mutate] of mutations) {
    const project = path.join(root, label); fs.mkdirSync(project);
    fs.writeFileSync(path.join(project, 'AGENTS.md'), `USER-${label}\n`);
    assert.equal(install.install(project, { write: true, source: sourceRoot }).status, 'INSTALLED');
    const file = path.join(project, 'AGENTS.md'); fs.writeFileSync(file, mutate(fs.readFileSync(file, 'utf8')));
    const before = snapshot(project), result = install.uninstall(project, { write: true });
    assert.equal(result.status, 'HOLD', `${label}:${result.reason || ''}`);
    assert.match(result.reason, /修改|marker|歧义/, label);
    assert.deepEqual(snapshot(project), before, label);
  }
});

test('F01 uninstall fault injection restores runtime, instruction, Hook, and rollback carrier preimages', { timeout: 120000 }, (t) => {
  const root = disposable(t, 'uninstall-faults');
  for (const point of ['uninstall:instruction:AGENTS.md:written', 'hooks:written', 'uninstall:commit']) {
    const project = path.join(root, point.replaceAll(':', '-')); fs.mkdirSync(project);
    fs.writeFileSync(path.join(project, 'AGENTS.md'), 'FAULT-USER\n');
    assert.equal(install.install(project, { write: true, source: sourceRoot }).status, 'INSTALLED');
    const before = snapshot(project), result = install.uninstall(project, { write: true, fault: (name) => { if (name === point) throw new Error(`fault:${point}`); } });
    assert.equal(result.status, 'PARTIAL', point); assert.match(result.reason, new RegExp(`fault:${point}`));
    assert.deepEqual(snapshot(project), before, point);
  }

  const previousSource = materializeArtifact(root, retained10, 'fault-previous-10'), project = path.join(root, 'rollback-tomb'); fs.mkdirSync(project);
  fs.writeFileSync(path.join(project, 'AGENTS.md'), 'ROLLBACK-FAULT-USER\n');
  assert.equal(requireFresh(path.join(previousSource, 'lib', 'install.js')).install(project, { write: true, source: previousSource }).status, 'INSTALLED');
  assert.equal(install.install(project, { write: true, upgrade: true, source: sourceRoot }).status, 'INSTALLED');
  const before = snapshot(project), result = install.uninstall(project, { write: true, fault: (name) => { if (name === 'uninstall:rollback-tomb') throw new Error('fault:rollback-tomb'); } });
  assert.equal(result.status, 'PARTIAL'); assert.match(result.reason, /fault:rollback-tomb/); assert.deepEqual(snapshot(project), before);
});

test('F01 managed project uninstall removes registry binding and owned instruction without touching system bundle', { timeout: 60000 }, (t) => {
  const root = disposable(t, 'managed'), systemRoot = path.join(root, 'system'), project = path.join(root, 'project');
  fs.mkdirSync(systemRoot); fs.mkdirSync(project);
  const git = (args) => spawnSync('/usr/bin/git', args, { cwd: project, encoding: 'utf8', env: { PATH: '/usr/bin:/bin' } });
  assert.equal(git(['init', '-q']).status, 0); assert.equal(git(['config', 'user.email', 'f01@example.invalid']).status, 0); assert.equal(git(['config', 'user.name', 'F01']).status, 0);
  fs.writeFileSync(path.join(project, 'README.md'), '# f01\n'); assert.equal(git(['add', 'README.md']).status, 0); assert.equal(git(['commit', '-q', '-m', 'init']).status, 0);
  const original = Buffer.from('MANAGED-USER\n'); fs.writeFileSync(path.join(project, 'AGENTS.md'), original);
  assert.equal(managed.installGlobal(systemRoot, { write: true, source: sourceRoot }).status, 'INSTALLED');
  const systemBefore = snapshot(systemRoot);
  assert.equal(install.install(project, { write: true, source: sourceRoot, profile: 'managed', globalRoot: systemRoot }).status, 'INSTALLED');
  assert.equal(managed.projectState(systemRoot, project).active, true);
  const removed = install.uninstall(project, { write: true, globalRoot: systemRoot });
  assert.equal(removed.status, 'UNINSTALLED', removed.reason);
  assert.equal(managed.projectState(systemRoot, project).active, false);
  assert.equal(fs.readFileSync(path.join(project, 'AGENTS.md')).equals(original), true);
  const after = snapshot(systemRoot);
  assert.deepEqual(after.filter((row) => !row[0].endsWith('policy/registry.json')), systemBefore.filter((row) => !row[0].endsWith('policy/registry.json')));
});
