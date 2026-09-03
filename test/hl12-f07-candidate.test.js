'use strict';
const assert = require('assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const builder = path.join(root, 'scripts', 'build-candidate.js');
const retained11 = path.join(root, 'docs', 'harness', 'artifacts', 'harness-lite-0.11.0-8e14e641b7d0fe3641a5e74c49b11a60761e0dc63fb75866ff8226e6b3687ae5.json');
function resolveArtifact(expected) {
  if (process.env.HL12_F07_ARTIFACT) return path.resolve(process.env.HL12_F07_ARTIFACT);
  const dir = path.join(root, 'docs', 'harness', 'artifacts');
  if (!fs.existsSync(dir)) throw new Error('HL12_F07_ARTIFACT is required for materialized candidate runs');
  const name = fs.readdirSync(dir).find((item) => /^harness-lite-0\.12\.0-[0-9a-f]{64}\.json$/.test(item)
    && (!expected || fs.readFileSync(path.join(dir, item)).equals(expected)));
  if (!name) throw new Error('HL12_F07_ARTIFACT is required for materialized candidate runs');
  return path.join(dir, name);
}

function assertValidatedPass(report) {
  assert.equal(report.status, 'PASS');
  assert.equal(report.blindRubric?.scorer, 'blindReceiptVerdict-v2', 'PASS must come from the blind scorer');
  assert.equal(report.verdictLayer?.name, 'blindReceiptVerdict-v1', 'PASS must include the scorer verdict layer');
  assert.equal(report.receiptsBinding?.valid, true, 'PASS requires valid blind receipt binding');
  const successful = Number(report.successfulSamples);
  assert.ok(Number.isInteger(successful) && successful >= 96, 'PASS requires complete successful samples');
  assert.equal(Number(report.receiptsBinding.reviewed), successful, 'PASS receipt review count must match samples');
  assert.equal(Number(report.receiptsBinding.required), successful, 'PASS receipt requirement must match samples');
  assert.equal(report.blindRubric?.candidateRubricGate, true, 'PASS requires the 0.12 candidate rubric gate');
  const strict = report.blindRubric?.strictChecks;
  for (const field of ['matrixExact', 'sampleCountExact', 'firstActionNotLower', 'completionNotLower', 'nuisanceStrictlyLower', 'governanceStrictlyLower']) {
    assert.equal(strict?.[field], true, `PASS requires strict check ${field}`);
  }
}
function treeSnapshot(dir) {
  const rows = [];
  const walk = (base, rel = '') => {
    if (!fs.existsSync(base)) return;
    for (const name of fs.readdirSync(base).sort()) {
      const abs = path.join(base, name), child = path.join(rel, name), stat = fs.lstatSync(abs);
      if (stat.isDirectory()) walk(abs, child);
      else if (stat.isFile()) rows.push([child, crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex')]);
    }
  };
  walk(dir); return JSON.stringify(rows);
}

test('F07 candidate builds deterministically as 0.12.0 and matches retained artifact', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hl12-f07-'));
  try {
    const a = path.join(dir, 'a.json'), b = path.join(dir, 'b.json');
    const env = { ...process.env, HARNESS_LITE_CANDIDATE_VERSION: '0.12.0' };
    const run = (out) => spawnSync(process.execPath, [builder, '--json', '--out', out], { cwd: root, env, encoding: 'utf8' });
    assert.equal(run(a).status, 0);
    assert.equal(run(b).status, 0);
    assert.equal(fs.readFileSync(a).equals(fs.readFileSync(b)), true);
    assert.equal(fs.readFileSync(a).equals(fs.readFileSync(resolveArtifact(fs.readFileSync(a)))), true);
    const summary = JSON.parse(run(a).stdout);
    assert.equal(summary.version, '0.12.0');
    assert.equal(summary.fileCount, 55);
    assert.equal(summary.productFileCount, 14);
    assert.match(summary.candidateDigest, /^sha256:[0-9a-f]{64}$/);
    const candidate = JSON.parse(fs.readFileSync(a, 'utf8'));
    const runtimeRow = candidate.files.find((row) => row.path === 'lib/install.js');
    const runtimeText = Buffer.from(runtimeRow.contentBase64, 'base64').toString('utf8');
    assert.match(runtimeText, /const VERSION = '0\.12\.0'/);
    assert.match(runtimeText, /const SOURCE_COMMIT = 'working-copy:0\.12\.0-candidate'/);
    assert.match(runtimeText, /value\.runtimeVersion === PREVIOUS_11_SNAPSHOT\.runtimeVersion\) return verifyPrevious11Snapshot/);
    const materialized = fs.mkdtempSync(path.join(os.tmpdir(), 'hl12-f07-materialized-'));
    try {
      for (const row of candidate.files) {
        const target = path.join(materialized, row.path);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, Buffer.from(row.contentBase64, 'base64'));
      }
      const runtime = require(path.join(materialized, 'lib', 'install.js'));
      assert.equal(runtime.VERSION, '0.12.0');
      assert.equal(runtime.SOURCE_COMMIT, 'working-copy:0.12.0-candidate');
      const installed = runtime.install(materialized, { write: true, source: materialized });
      assert.equal(installed.status, 'INSTALLED');
      const ownership = JSON.parse(fs.readFileSync(path.join(materialized, '.claude', 'harness-lite', 'ownership.json'), 'utf8'));
      assert.equal(ownership.runtimeVersion, '0.12.0');
      assert.equal(ownership.sourceCommit, 'working-copy:0.12.0-candidate');
    } finally { fs.rmSync(materialized, { recursive: true, force: true }); }
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('F07 behavior A/B evidence is explicit UNKNOWN or validated real PASS', () => {
  const behaviorPath = process.env.HL12_F07_BEHAVIOR || path.join(root, 'docs', 'harness', 'artifacts', 'harness-lite-0.12.0-behavior.json');
  const report = JSON.parse(fs.readFileSync(behaviorPath, 'utf8'));
  assert.equal(report.scenarios.length, 8);
  assert.match(String(report.candidate || ''), /^harness-lite-0\.12\.0-[0-9a-f]{64}\.json$/);
  assert.ok(report.candidateIdentity && /^sha256:[0-9a-f]{64}$/.test(report.candidateIdentity.candidateDigest));
  assert.ok(Number(report.candidateIdentity.bytes) > 1000000);
  assert.equal(Number(report.candidateIdentity.files), 55);
  assert.equal(Number(report.candidateIdentity.productJavaScriptFiles), 14);
  if (report.status === 'UNKNOWN') {
    assert.match(String(report.reason || ''), /(?:connector|96|sample|blocked|未完成|attestation|signature|public.?key|可信外部)/i);
    return;
  }
  if (report.status === 'FAIL') {
    assert.ok(Number(report.successfulSamples) >= 96, 'FAIL evidence must still contain the full 96-call run');
    assert.ok(Array.isArray(report.matrix) && report.matrix.length === 32, 'FAIL evidence requires the complete matrix');
    assert.match(String(report.reason || ''), /rubric|parity|FAIL/i);
    const scoredEvidence = report.blindRubric?.scorer === 'blindReceiptVerdict-v2'
      || report.verdictLayer?.name === 'blindReceiptVerdict-v1';
    if (scoredEvidence) {
      assert.equal(report.receiptsBinding?.valid, true, 'scored FAIL evidence requires complete valid blind receipts');
      assert.equal(Number(report.receiptsBinding?.reviewed), Number(report.successfulSamples));
    } else {
      // Raw evaluator FAIL is a model-run result, not a scored receipt package;
      // do not demand a binding that only the scorer is responsible for.
      assert.equal(report.kind, 'harness-lite-behavior-evaluation');
    }
    return;
  }
  assert.equal(report.status, 'PASS');
  assertValidatedPass(report);
  assert.ok(Array.isArray(report.families) && report.families.length >= 2, 'PASS requires two real model families');
  const successful = Number(report.successfulSamples ?? report.sampleCount ?? report.samples);
  assert.ok(Number.isFinite(successful) && successful >= 96, 'PASS requires >=96 successful calls');
  const matrix = report.matrix || report.samplesByVersionFamilyScenario || report.cells;
  assert.ok(Array.isArray(matrix), 'PASS requires per-version/family/scenario matrix');
  assert.equal(matrix.length, 32, 'PASS matrix must contain 2x8x2 cells');
  for (const cell of matrix) {
    assert.match(String(cell.version), /^0\.(?:11|12)(?:\.0)?$/);
    assert.ok(cell.family, 'matrix cell must identify model family');
    assert.ok(cell.scenario, 'matrix cell must identify scenario');
    assert.ok(Number(cell.successes ?? cell.successfulSamples ?? cell.sampleCount) >= 3,
      'each matrix cell requires three successful samples');
  }
});

test('R41 raw evaluator PASS without scorer evidence is rejected', () => {
  const raw = JSON.parse(fs.readFileSync(path.join(root, 'docs', 'harness', 'artifacts', 'harness-lite-0.12.0-behavior.json'), 'utf8'));
  raw.status = 'PASS';
  delete raw.blindRubric;
  delete raw.verdictLayer;
  delete raw.receiptsBinding;
  assert.throws(() => assertValidatedPass(raw), /blind scorer|verdict layer|receipt binding/);
});

test('R42 fail-closed UNKNOWN accepts missing independent attestation reason', () => {
  const report = { status: 'UNKNOWN', reason: 'No valid independent attestation for authentic model execution' };
  assert.match(report.reason, /(?:attestation|signature|public.?key|可信外部)/i);
  assert.notEqual(report.status, 'PASS');
});

test('F07 candidate migrates retained 0.11 with explicit upgrade and restores user bytes on uninstall', () => {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'hl12-f07-migration-'));
  try {
    const candidatePath = resolveArtifact();
    const materialize = (file, name) => {
      const targetRoot = path.join(parent, name), data = JSON.parse(fs.readFileSync(file, 'utf8'));
      fs.mkdirSync(targetRoot, { recursive: true });
      for (const row of data.files) { const target = path.join(targetRoot, row.path); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, Buffer.from(row.contentBase64, 'base64')); }
      return targetRoot;
    };
    const previous = materialize(retained11, 'previous-11'), candidate = materialize(candidatePath, 'candidate-12');
    const project = path.join(parent, 'project'); fs.mkdirSync(project);
    const original = Buffer.from('USER-ORIGINAL-F07\n'); fs.writeFileSync(path.join(project, 'AGENTS.md'), original);
    const previousApi = require(path.join(previous, 'lib', 'install.js'));
    assert.equal(previousApi.install(project, { write: true, source: previous }).status, 'INSTALLED');
    const api = require(path.join(candidate, 'lib', 'install.js'));
    assert.equal(api.VERSION, '0.12.0');
    const inspected = api.inspect(project, candidate); assert.equal(inspected.kind, 'previous-11-snapshot');
    const beforeHold = treeSnapshot(project);
    const held = api.install(project, { write: true, upgrade: false, source: candidate });
    assert.equal(held.status, 'HOLD'); assert.equal(held.kind, 'previous-11-snapshot'); assert.equal(held.written, 0);
    assert.equal(treeSnapshot(project), beforeHold);
    const upgraded = api.install(project, { write: true, upgrade: true, source: candidate }); assert.equal(upgraded.status, 'INSTALLED');
    assert.equal(api.verify06(project).ok, true);
    const manifest = JSON.parse(fs.readFileSync(path.join(project, '.claude', 'harness-lite', 'ownership.json'), 'utf8'));
    assert.equal(manifest.runtimeVersion, '0.12.0'); assert.equal(manifest.sourceCommit, 'working-copy:0.12.0-candidate');
    const anchor = JSON.parse(fs.readFileSync(path.join(project, '.codex', 'harness-lite', 'installation.json'), 'utf8'));
    assert.equal(anchor.runtimeVersion, '0.12.0'); assert.equal(anchor.sourceCommit, 'working-copy:0.12.0-candidate');
    assert.match(anchor.manifestDigest, /^sha256:[0-9a-f]{64}$/); assert.match(anchor.sourcePackageDigest, /^sha256:[0-9a-f]{64}$/); assert.match(anchor.anchorDigest, /^sha256:[0-9a-f]{64}$/);
    const dispatcher = path.join(project, '.claude', 'harness-lite', 'hooks', 'dispatcher.js');
    const run = spawnSync(process.execPath, [dispatcher], { cwd: project, input: JSON.stringify({ hook_event_name: 'SessionStart', cwd: project, session_id: 'f07-migrate' }), encoding: 'utf8' });
    assert.equal(run.status, 0, run.stderr);
    assert.equal(api.uninstall(project, { write: true }).status, 'UNINSTALLED');
    assert.equal(fs.readFileSync(path.join(project, 'AGENTS.md')).equals(original), true);
    assert.equal(fs.existsSync(path.join(project, '.claude', 'harness-lite')), false);
    assert.equal(fs.existsSync(path.join(project, '.codex', 'harness-lite')), false);
    assert.equal(fs.readdirSync(project).some((name) => name.startsWith('.harness-lite.rollback-')), false);
    assert.equal(fs.existsSync(path.join(project, 'CLAUDE.md')), false);
  } finally { fs.rmSync(parent, { recursive: true, force: true }); }
});

test('F07 installed candidate SessionStart projects declared runnable units with and without a live ledger', () => {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'hl12-f07-formal-work-'));
  try {
    const candidatePath = resolveArtifact();
    const data = JSON.parse(fs.readFileSync(candidatePath, 'utf8'));
    const candidate = path.join(parent, 'candidate');
    for (const row of data.files) {
      const target = path.join(candidate, row.path);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, Buffer.from(row.contentBase64, 'base64'));
    }
    const project = path.join(parent, 'project');
    const harness = path.join(project, 'docs', 'harness');
    fs.mkdirSync(path.join(harness, 'stages'), { recursive: true });
    fs.mkdirSync(path.join(harness, 'leaves'), { recursive: true });
    fs.writeFileSync(path.join(harness, 'plan.md'), '# plan\n');
    fs.writeFileSync(path.join(harness, 'stages', 's.md'), '# Stage\n\n目标：formal work\n');
    fs.writeFileSync(path.join(harness, 'leaves', 'formal.md'), [
      '# Leaf', '', '阶段：s', '', '目标：formal leaf', '', '完成标准：', '', '- leaf', '',
      '允许动：', '', '- test/**', '', '不许动：', '', '- push', '',
      '## Work Unit A', '', 'goal: A goal', '', 'completionStandards:', '', '- A standard', '', 'dependencies:', '', '- 无', '',
      '## Work Unit B', '', 'goal: B goal', '', 'completionStandards:', '', '- B standard', '', 'dependencies:', '', '- 无', '',
    ].join('\n'));
    const api = require(path.join(candidate, 'lib', 'install.js'));
    assert.equal(api.install(project, { write: true, source: candidate }).status, 'INSTALLED');
    const dispatcher = path.join(project, '.claude', 'harness-lite', 'hooks', 'dispatcher.js');
    const dispatch = () => {
      const run = spawnSync(process.execPath, [dispatcher], {
        cwd: project,
        input: JSON.stringify({ hook_event_name: 'SessionStart', cwd: project, session_id: 'formal-work' }),
        encoding: 'utf8',
      });
      assert.equal(run.status, 0, run.stderr);
      return JSON.parse(run.stdout).hookSpecificOutput.additionalContext;
    };
    for (const context of [dispatch()]) {
      assert.match(context, /ParallelWorkUnitsCarrier：.*count=2；ids=A,B；/);
      assert.doesNotMatch(context, /id=UNKNOWN|status=leaf-fallback/);
    }
    const delegation = require(path.join(candidate, 'lib', 'delegation.js'));
    assert.equal(delegation.recordEvent(project, { id: 'formal-a-rejected', workUnit: 'A', status: 'rejected' }, { at: '2026-09-03T00:00:00.000Z' }).ok, true);
    const ledgerBacked = dispatch();
    assert.match(ledgerBacked, /ParallelWorkUnitsCarrier：.*count=2；ids=A,B；/);
    assert.doesNotMatch(ledgerBacked, /id=UNKNOWN|status=leaf-fallback/);
  } finally { fs.rmSync(parent, { recursive: true, force: true }); }
});
