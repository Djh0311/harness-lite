'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

test('product JavaScript surface has the current fourteen files', () => {
  const files = ['bin', 'hooks', 'lib'].flatMap((dir) => {
    const base = path.join(root, dir);
    function walk(abs) {
      return fs.readdirSync(abs, { withFileTypes: true }).flatMap((entry) => {
        const child = path.join(abs, entry.name);
        if (entry.isDirectory()) return walk(child);
        return entry.isFile() && entry.name.endsWith('.js') ? [path.relative(root, child).replaceAll('\\', '/')] : [];
      });
    }
    return walk(base);
  }).sort();
  assert.deepEqual(files, [
    'bin/hl.js',
    'hooks/dispatcher.js',
    'lib/authorization.js',
    'lib/capabilities.js',
    'lib/delegation.js',
    'lib/evidence.js',
    'lib/guidance.js',
    'lib/hook.js',
    'lib/install.js',
    'lib/io.js',
    'lib/limits.js',
    'lib/managed.js',
    'lib/tree.js',
    'lib/work.js',
  ]);
});

test('current product JavaScript files pass node syntax checks', () => {
  const files = [
    'bin/hl.js',
    'hooks/dispatcher.js',
    'lib/authorization.js',
    'lib/capabilities.js',
    'lib/delegation.js',
    'lib/evidence.js',
    'lib/guidance.js',
    'lib/hook.js',
    'lib/install.js',
    'lib/io.js',
    'lib/limits.js',
    'lib/managed.js',
    'lib/tree.js',
    'lib/work.js',
  ];
  for (const file of files) {
    const run = spawnSync(process.execPath, ['--check', file], { cwd: root, encoding: 'utf8' });
    assert.equal(run.status, 0, `${file}: ${run.stderr || run.stdout}`);
  }
});

test('CLI remains six internal interfaces', () => {
  const cli = require('../bin/hl.js');
  assert.deepEqual(cli.CLI_COMMANDS, ['status', 'verify', 'map', 'mistake', 'install', 'selfcheck']);
  assert.deepEqual(cli.positional(['verify', '--target', '.', 'lib/io.js']), ['verify', 'lib/io.js']);
});

test('runtime identity and paths are the 0.11.0 candidate install source surface', () => {
  const pkg = require('../package.json');
  const install = require('../lib/install.js');
  assert.equal(install.VERSION, pkg.version);
  assert.equal(install.SOURCE_COMMIT, `working-copy:${pkg.version}-candidate`);
  assert.deepEqual(install.CURRENT_REQUIRED_RUNTIME_PATHS, [
    'LICENSE',
    'bin/hl.js',
    'hooks/README.md',
    'hooks/dispatcher.js',
    'lib/authorization.js',
    'lib/capabilities.js',
    'lib/delegation.js',
    'lib/evidence.js',
    'lib/guidance.js',
    'lib/hook.js',
    'lib/install.js',
    'lib/io.js',
    'lib/limits.js',
    'lib/managed.js',
    'lib/tree.js',
    'lib/work.js',
    'package.json',
    'skills/root-cause.md',
    'skills/split-work.md',
    'skills/test-first.md',
  ]);
  assert.deepEqual(install.runtimePaths(root), install.CURRENT_REQUIRED_RUNTIME_PATHS);
});

test('io.safe rejects paths outside the project', () => {
  const io = require('../lib/io.js');
  assert.equal(io.safe(root, 'lib/io.js'), path.join(root, 'lib/io.js'));
  assert.throws(() => io.safe(root, '../outside'));
  assert.throws(() => io.safe(root, '/tmp/outside'));
});

test('authorization shape accepts only closed or exact active leases', () => {
  const authorization = require('../lib/authorization.js');
  const active = {
    schemaVersion: 1,
    authorized: true,
    leaf: 'docs/harness/leaves/L1.md',
    stage: 'stage-1',
    executionReceipt: 'u-0123456789abcdef0123',
    expiresAt: '2026-01-01T00:00:00.000Z',
  };
  assert.equal(authorization.shape({ schemaVersion: 1, authorized: false }), 'closed');
  assert.equal(authorization.shape(active), 'active');
  assert.equal(authorization.shape({ ...active, leaf: '../L1.md' }), 'malformed');
  assert.equal(authorization.shape({ ...active, expiresAt: '2026-01-01' }), 'malformed');
});

test('plan authority distinguishes current, legacy, and invalid baselines', () => {
  const tree = require('../lib/tree.js');
  const current = [
    'Intro',
    tree.BASELINE_BEGIN,
    'Confirmation-Source: u-0123456789abcdef0123',
    'Goal: keep baseline',
    tree.BASELINE_END,
    'Plan body',
  ].join('\n');
  assert.equal(tree.planAuthorityText(current).status, 'current');
  assert.equal(tree.planAuthorityText('plain plan').status, 'legacy');
  assert.equal(tree.planAuthorityText(`${tree.BASELINE_BEGIN}\nmissing end`).status, 'invalid');
});

test('host evidence exact join is required before events are observed', () => {
  const evidence = require('../lib/evidence.js');
  const digest = 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  const before = {
    connectionId: 'c1',
    cwdFingerprint: 'cwd',
    hooks: evidence.EVENTS.map((eventName) => ({
      eventName: evidence.HOST_EVENT[eventName],
      key: eventName,
      currentHash: `h-${eventName}`,
      enabled: true,
      trustStatus: 'trusted',
      source: 'project',
    })),
  };
  const after = JSON.parse(JSON.stringify(before));
  const started = evidence.EVENTS.map((eventName) => ({
    threadId: 't1',
    turnId: 'u1',
    run: { id: `r-${eventName}`, eventName: evidence.HOST_EVENT[eventName], status: 'started' },
  }));
  const completed = evidence.EVENTS.map((eventName) => ({
    threadId: 't1',
    turnId: 'u1',
    run: { id: `r-${eventName}`, eventName: evidence.HOST_EVENT[eventName], status: 'completed' },
  }));
  const receipts = evidence.EVENTS.map((event) => ({
    event,
    runId: `r-${event}`,
    decision: 'executed',
    generation: 1,
    digestPrefix: digest.slice(7, 19),
  }));
  const result = evidence.build({
    profile: 'project',
    hostKind: 'desktop',
    hooksBefore: before,
    hooksAfter: after,
    started,
    completed,
    receipts,
    identities: { projectPackageDigest: digest },
    binding: { connectionId: 'c1', existingConnection: true, desktopProcessId: 1, appServerProcessId: 2 },
    projectRootFingerprint: 'cwd',
  });
  assert.equal(result.joinVerdict, 'exact');
  assert.deepEqual(result.claims.observed, {
    SessionStart: true,
    UserPromptSubmit: true,
    Stop: true,
    PreToolUse: true,
  });
});

test('offline or synthetic host evidence cannot observe events', () => {
  const evidence = require('../lib/evidence.js');
  const result = evidence.build({ hostKind: 'synthetic', proofType: 'offline' });
  assert.equal(result.joinVerdict, 'missing');
  assert.deepEqual(result.claims.observed, {
    SessionStart: false,
    UserPromptSubmit: false,
    Stop: false,
    PreToolUse: false,
  });
});
