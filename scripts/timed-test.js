#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function listTests(root) {
  const base = path.join(root, 'test');
  const out = [];
  function walk(dir) {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(abs);
      else if (entry.isFile() && /\.test\.js$/.test(entry.name)) out.push(path.relative(root, abs).replaceAll('\\', '/'));
    }
  }
  walk(base);
  return out;
}

// These files are retained as historical evidence for the 0.11/0.12 and
// Terra/Sol contracts.  They are intentionally not part of the 0.13 Astra
// default gate, retained by 0.14: running them against the current runtime would turn an
// expected contract transition into a false current regression.
const HISTORICAL_TEST_FILES = new Set([
  'test/nv04-recovery.test.js',
  'test/hl12-f07-candidate.test.js',
  'test/hl12-f07-behavior-scorer.test.js',
]);

const HISTORICAL_MIXED_TESTS = [
  {
    file: 'test/hl11-event-upgrade.test.js',
    pattern: '0.11 base instruction is short and event guidance is allowlisted, deterministic, and physically scoped'
  },
];

function parseMode(argv) {
  const remaining = [];
  let mode = 'current';
  for (const arg of argv) {
    if (arg === '--historical') mode = 'historical';
    else remaining.push(arg);
  }
  return { mode, remaining };
}

function testCount(output) {
  // Node 22 prints the TAP summary "# tests N"; Node 24's default reporter prints "ℹ tests N".
  const match = String(output || '').match(/^(?:#|ℹ) tests\s+(\d+)$/m);
  return match ? Number(match[1]) : null;
}

function main(argv = []) {
  const root = path.resolve(__dirname, '..');
  const parsed = parseMode(argv);
  const allFiles = listTests(root);
  const files = parsed.mode === 'historical'
    ? [...new Set([
      ...HISTORICAL_TEST_FILES,
      ...HISTORICAL_MIXED_TESTS.map((mixed) => mixed.file),
    ])].map((file) => path.relative(root, path.join(root, file)).replaceAll('\\', '/'))
    : allFiles.filter((file) => !HISTORICAL_TEST_FILES.has(file));
  if (!files.length) {
    console.error('Harness Lite timed-test: no test files found');
    return 1;
  }

  const nodeArgs = ['--test', ...parsed.remaining];
  if (parsed.mode === 'current') {
    for (const mixed of HISTORICAL_MIXED_TESTS) {
      // Keep the mixed file in the current suite while excluding only the
      // exact legacy assertion. The source test remains in the repository and
      // can be run explicitly with the historical file; it is not a current
      // 0.13 contract.
      nodeArgs.push(`--test-skip-pattern=${mixed.pattern}`);
    }
    console.error('Harness Lite timed-test: current 0.14/Astra gate (historical contracts excluded)');
  } else {
    console.error('Harness Lite timed-test: historical compatibility evidence (expected to diverge from current)');
  }

  const run = spawnSync(process.execPath, [...nodeArgs, ...files], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    timeout: 300000,
  });
  if (run.stdout) process.stdout.write(run.stdout);
  if (run.stderr) process.stderr.write(run.stderr);
  if (run.error) {
    console.error(`Harness Lite timed-test: ${run.error.message}`);
    return 1;
  }
  if (run.status !== 0) return run.status || 1;

  const count = testCount(`${run.stdout || ''}${run.stderr || ''}`);
  if (count === 0) {
    console.error('Harness Lite timed-test: zero tests executed');
    return 1;
  }
  return 0;
}

if (require.main === module) process.exit(main(process.argv.slice(2)));
module.exports = { listTests, testCount, parseMode, HISTORICAL_TEST_FILES, HISTORICAL_MIXED_TESTS, main };
