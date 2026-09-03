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

function testCount(output) {
  const match = String(output || '').match(/^# tests\s+(\d+)$/m);
  return match ? Number(match[1]) : null;
}

function main(argv = []) {
  const root = path.resolve(__dirname, '..');
  const files = listTests(root);
  if (!files.length) {
    console.error('Harness Lite timed-test: no test files found');
    return 1;
  }

  const run = spawnSync(process.execPath, ['--test', ...argv, ...files], {
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
module.exports = { listTests, testCount, main };
