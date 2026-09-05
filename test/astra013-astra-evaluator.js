'use strict';

// Step 6 executor: a real gpt-6-astra, read-only behavior evaluation for the
// Astra-oriented 0.13 candidate. This is separate from the Grok executor: a
// PASS here describes the model's bounded behavior only, not a product task
// completion or release authorization.
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');
const { buildCandidate, summarize: summarizeCandidate } = require('../scripts/build-candidate.js');

const repo = path.resolve(process.env.ASTRA013_ASTRA_ROOT || path.join(__dirname, '..'));
const outFile = path.resolve(process.env.ASTRA013_ASTRA_OUT || path.join(repo, 'docs/harness/reports/ASTRA-LITE-ASTRA-EXECUTION.json'));
const codexBin = process.env.CODEX_BIN || 'codex';
const model = process.env.ASTRA013_ASTRA_MODEL || 'gpt-6-astra';
const repeats = Number.isInteger(Number(process.env.ASTRA013_ASTRA_REPEATS)) ? Math.max(1, Number(process.env.ASTRA013_ASTRA_REPEATS)) : 1;
const concurrency = Number.isInteger(Number(process.env.ASTRA013_ASTRA_CONCURRENCY)) ? Math.max(1, Number(process.env.ASTRA013_ASTRA_CONCURRENCY)) : 1;
const timeoutMs = Number.isInteger(Number(process.env.ASTRA013_ASTRA_TIMEOUT_MS)) ? Math.max(1000, Number(process.env.ASTRA013_ASTRA_TIMEOUT_MS)) : 300000;
const sha = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');
const bounded = (value, limit = 180) => String(value || '').replace(/\s+/g, ' ').trim().slice(0, limit);

const { scenarios, promptFor, score } = require('./astra013-grok-evaluator');

function candidateIdentity() {
  const pkg = JSON.parse(fs.readFileSync(path.join(repo, 'package.json'), 'utf8'));
  const install = fs.readFileSync(path.join(repo, 'lib/install.js'), 'utf8');
  let artifact = {};
  try { artifact = summarizeCandidate(buildCandidate(repo)); } catch { artifact = { candidateDigest: 'UNKNOWN', fileDigest: 'UNKNOWN', productDigest: 'UNKNOWN' }; }
  return { packageName: pkg.name, version: pkg.version, installDigest: `sha256:${sha(install)}`, ...artifact };
}

function extractModelText(outputFile, stdout) {
  let value = '';
  try { value = fs.readFileSync(outputFile, 'utf8'); } catch {}
  if (!value.trim()) value = stdout;
  // `codex exec -o` normally contains only the final message. Keep a small
  // fallback for JSONL wrappers so a transport envelope is not mistaken for
  // the model's response.
  const lines = String(value).split(/\r?\n/).filter(Boolean);
  for (const line of lines.slice().reverse()) {
    try {
      const event = JSON.parse(line);
      if (typeof event?.text === 'string') return event.text;
      if (typeof event?.item?.text === 'string') return event.item.text;
      if (typeof event?.item?.content?.[0]?.text === 'string') return event.item.content[0].text;
    } catch {}
  }
  return value;
}

function parseResponse(text, stdout) {
  const source = String(text || stdout || '');
  let parsed = null;
  try { parsed = JSON.parse(source.trim()); } catch {}
  if (!parsed) {
    try { parsed = JSON.parse(source.match(/\{[\s\S]*\}/)?.[0] || ''); } catch {}
  }
  if (!parsed || typeof parsed.action !== 'string' || typeof parsed.asksUser !== 'boolean'
    || typeof parsed.complete !== 'boolean' || !['complete', 'incomplete', 'na'].includes(parsed.productResult)
    || !['allow', 'hold', 'na'].includes(parsed.acceptedUnlock) || !['local', 'global', 'na'].includes(parsed.failureScope)
    || !['hold', 'allow', 'na'].includes(parsed.hardRisk) || typeof parsed.singleFocus !== 'boolean'
    || typeof parsed.parallelPlan !== 'boolean') return { ok: false, status: 'invalid-contract', digest: `sha256:${sha(source)}` };
  const response = {
    action: bounded(parsed.action), asksUser: parsed.asksUser, complete: parsed.complete,
    productResult: parsed.productResult, acceptedUnlock: parsed.acceptedUnlock,
    failureScope: parsed.failureScope, hardRisk: parsed.hardRisk,
    singleFocus: parsed.singleFocus, parallelPlan: parsed.parallelPlan,
    evidence: ['direct', 'unknown'].includes(parsed.evidence) ? parsed.evidence : 'unknown',
    reason: bounded(parsed.reason), testsRun: Array.isArray(parsed.testsRun) ? parsed.testsRun.slice(0, 4).map((x) => bounded(x, 100)) : [],
    issues: Array.isArray(parsed.issues) ? parsed.issues.slice(0, 4).map((x) => bounded(x, 120)) : [],
  };
  return { ok: true, status: 'ok', responseDigest: `sha256:${sha(JSON.stringify(response))}`, response };
}

function invoke(scenario, attempt) {
  return new Promise((resolve) => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hl-astra-eval-'));
    const outputFile = path.join(tmp, 'last-message.txt');
    const args = ['exec', '--json', '--ephemeral', '--skip-git-repo-check', '--cd', tmp,
      '--sandbox', 'read-only', '--model', model, '--output-last-message', outputFile, '-'];
    const started = Date.now();
    const child = cp.spawn(codexBin, args, { cwd: tmp, env: { ...process.env }, stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    child.stdout.on('data', (buf) => { stdout += buf; });
    child.stderr.on('data', (buf) => { stderr += buf; });
    child.stdin.end(promptFor(scenario));
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
      resolve({ scenario: scenario.id, attempt, status: 'timeout', errorClass: 'transport', durationMs: Date.now() - started, providerMessage: bounded(stderr, 320) });
    }, timeoutMs);
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      if (code !== 0) { try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {} return resolve({ scenario: scenario.id, attempt, status: `exit-${code || signal || 'unknown'}`, errorClass: /auth|login|credential|model.*not.*found|not.*available/i.test(stderr) ? 'provider' : 'transport', providerMessage: bounded(stderr, 320), durationMs: Date.now() - started }); }
      const parsed = parseResponse(extractModelText(outputFile, stdout), stdout);
      if (!parsed.ok) { try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {} return resolve({ scenario: scenario.id, attempt, ...parsed, errorClass: 'model', durationMs: Date.now() - started }); }
      const scored = score(scenario, parsed.response);
      const result = { scenario: scenario.id, attempt, status: 'ok', durationMs: Date.now() - started, ...parsed, score: scored };
      try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
      return resolve(result);
    });
  });
}

async function main() {
  const requested = String(process.env.ASTRA013_ASTRA_SCENARIOS || '').split(',').map((value) => value.trim()).filter(Boolean);
  const selected = requested.length ? scenarios.filter((scenario) => requested.includes(scenario.id)) : scenarios;
  if (!selected.length) throw new Error(`no matching Astra scenarios: ${requested.join(',')}`);
  const cells = selected.flatMap((scenario) => Array.from({ length: repeats }, (_, index) => ({ scenario, attempt: index + 1 })));
  let cursor = 0; const results = [];
  async function worker() { while (true) { const index = cursor++; if (index >= cells.length) return; results[index] = await invoke(cells[index].scenario, cells[index].attempt); } }
  await Promise.all(Array.from({ length: Math.min(concurrency, cells.length) }, () => worker()));
  const providerFailures = results.filter((row) => row.status !== 'ok' && row.errorClass !== 'model');
  const modelFailures = results.filter((row) => row.status !== 'ok' && row.errorClass === 'model');
  const scenarioResults = selected.map((scenario) => {
    const rows = results.filter((row) => row.scenario === scenario.id);
    return { scenario: scenario.id, attempts: rows.length, successful: rows.filter((row) => row.status === 'ok').length,
      passes: rows.filter((row) => row.score?.pass).length, stablePass: rows.length === repeats && rows.every((row) => row.score?.pass === true) };
  });
  const status = providerFailures.length ? 'UNKNOWN' : scenarioResults.every((row) => row.stablePass) ? 'PASS' : 'FAIL';
  const report = { schemaVersion: 1, kind: 'harness-lite-astra013-astra-execution', version: candidateIdentity().version,
    status, executor: 'codex-exec', requestedModel: model,
    providerFailures: providerFailures.map(({ scenario, attempt, status: rowStatus, errorClass }) => ({ scenario, attempt, status: rowStatus, errorClass })),
    modelFailures: modelFailures.map(({ scenario, attempt, status: rowStatus, errorClass }) => ({ scenario, attempt, status: rowStatus, errorClass })),
    repeats, selection: selected.map((scenario) => scenario.id), concurrency, timeoutMs,
    scenarios: scenarioResults,
    results: results.map(({ scenario, attempt, status: rowStatus, errorClass, durationMs, responseDigest, response, score: rowScore, providerMessage }) => ({ scenario, attempt, status: rowStatus, errorClass, durationMs, responseDigest, response, score: rowScore, providerMessage })),
    candidate: candidateIdentity(), generatedAt: new Date().toISOString(),
    providerEvidence: 'docs/harness/reports/ASTRA-LITE-PROVIDER-SMOKE.md (read-only smoke only)',
    evidenceBoundary: 'Real gpt-6-astra codex-exec behavior requested through the CLI; read-only scenario evaluation does not prove a product task or authorize release.' };
  fs.mkdirSync(path.dirname(outFile), { recursive: true }); fs.writeFileSync(outFile, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o644 });
  console.log(JSON.stringify({ status, report: outFile, scenarios: scenarioResults, providerFailures: providerFailures.length, modelFailures: modelFailures.length }));
}

if (require.main === module) main().catch((error) => { console.error(error.message); process.exitCode = 1; });

module.exports = { parseResponse, extractModelText, invoke };
