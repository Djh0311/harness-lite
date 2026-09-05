'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const builder = require('../scripts/build-candidate.js');

test('candidate builder is deterministic in process', () => {
  const first = builder.buildCandidate(root);
  const second = builder.buildCandidate(root);
  assert.equal(builder.summarize(first).candidateDigest, builder.summarize(second).candidateDigest);
  assert.equal(builder.artifactText(first), builder.artifactText(second));
});

test('candidate builder CLI writes the same artifact and summary twice', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hl-candidate-'));
  try {
    const firstOut = path.join(tmp, 'candidate-1.json');
    const secondOut = path.join(tmp, 'candidate-2.json');
    const first = spawnSync(process.execPath, ['scripts/build-candidate.js', '--json', '--out', firstOut], {
      cwd: root,
      encoding: 'utf8',
    });
    const second = spawnSync(process.execPath, ['scripts/build-candidate.js', '--json', '--out', secondOut], {
      cwd: root,
      encoding: 'utf8',
    });
    assert.equal(first.status, 0, first.stderr || first.stdout);
    assert.equal(second.status, 0, second.stderr || second.stdout);
    const firstSummary = JSON.parse(first.stdout);
    const secondSummary = JSON.parse(second.stdout);
    assert.deepEqual(firstSummary, secondSummary);
    assert.equal(fs.readFileSync(firstOut, 'utf8'), fs.readFileSync(secondOut, 'utf8'));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('candidate records the snapshot source and bounded git authority when available', () => {
  const candidate = builder.buildCandidate(root);
  const summary = builder.summarize(candidate);
  const currentVersion = require(path.join(root, 'package.json')).version;
  assert.equal(candidate.kind, 'harness-lite-source-candidate');
  assert.equal(candidate.package.version, currentVersion);
  assert.equal(summary.version, currentVersion);
  if (candidate.provenance.git.repo) {
    assert.match(candidate.provenance.git.head, /^[0-9a-f]{40,64}$/);
  } else {
    assert.equal(candidate.provenance.git.head, null);
  }
  assert.equal(summary.productFileCount, 14);
  assert.equal(candidate.productFiles.length, 14);
  assert.ok(candidate.files.some((row) => row.path === 'scripts/build-candidate.js'));
  assert.ok(candidate.files.some((row) => row.path === 'scripts/timed-test.js'));
  assert.ok(candidate.files.some((row) => row.path === 'test/current-contracts.test.js'));
  assert.ok(candidate.files.every((row) => !row.path.startsWith('.git/') && !row.path.startsWith('.claude/')));
});

test('candidate artifact can be verified from its own stable content', () => {
  const candidate = builder.buildCandidate(root);
  const text = builder.artifactText(candidate);
  const parsed = JSON.parse(text);
  assert.deepEqual(parsed.productFiles, candidate.productFiles);
  assert.equal(parsed.fileDigest, candidate.fileDigest);
  assert.equal(builder.summarize(parsed).candidateDigest, builder.summarize(candidate).candidateDigest);
});
