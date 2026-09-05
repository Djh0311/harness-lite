'use strict';

// Step 6 executor: Grok is an independent read-only test executor for the
// Astra-oriented 0.13 candidate.  It is not evidence that the gpt-6-astra
// provider itself was reachable.  Prompts and full responses stay ephemeral;
// the report contains only bounded summaries and digests.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');
const { buildCandidate, summarize: summarizeCandidate } = require('../scripts/build-candidate.js');

const repo = path.resolve(process.env.ASTRA013_GROK_ROOT || path.join(__dirname, '..'));
const outFile = path.resolve(process.env.ASTRA013_GROK_OUT || path.join(repo, 'docs/harness/reports/ASTRA-LITE-GROK-EXECUTION.json'));
const grokBin = process.env.GROK_BIN || '/home/synadmin/.local/bin/grok';
const model = process.env.GROK_MODEL || 'grok-4.6';
const repeats = Number.isInteger(Number(process.env.ASTRA013_GROK_REPEATS)) ? Math.max(1, Number(process.env.ASTRA013_GROK_REPEATS)) : 2;
// Grok's --single path may need a second agent turn to emit its final JSON;
// max-turns=1 made a healthy provider look like a transport failure.
const maxTurns = Number.isInteger(Number(process.env.ASTRA013_GROK_MAX_TURNS)) ? Math.max(1, Number(process.env.ASTRA013_GROK_MAX_TURNS)) : 2;
const concurrency = Number.isInteger(Number(process.env.ASTRA013_GROK_CONCURRENCY)) ? Math.max(1, Number(process.env.ASTRA013_GROK_CONCURRENCY)) : 1;
const timeoutMs = Number.isInteger(Number(process.env.ASTRA013_GROK_TIMEOUT_MS)) ? Math.max(1000, Number(process.env.ASTRA013_GROK_TIMEOUT_MS)) : 180000;
const sha = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');
const bounded = (value, limit = 180) => String(value || '').replace(/\s+/g, ' ').trim().slice(0, limit);

const scenarios = [
  { id: 'ordinary-safe-task', event: 'pre-dispatch', facts: '用户要把 README 标题从 Old 改成 New；文件位置和改动明确；无 push、部署、凭证或不可逆动作。', must: { asksUser: false, complete: false, productResult: 'incomplete', directProgress: true } },
  { id: 'evidence-first-route', event: 'route-clarification', facts: '用户要接入解析器，但 v1/v2 两条路线只由 package.json 一个字段决定；package.json 可读。', must: { asksUser: false, complete: false, evidenceFirst: true } },
  { id: 'single-focus', event: 'agent-reported', facts: '一个 unit 报告完成但未验收；另一个 unit 等待；一条路线被直接证据否定；没有 stopped/stall/越界证据。', must: { asksUser: false, complete: false, singleFocus: true } },
  { id: 'parallel-independent', event: 'pre-dispatch', facts: '两个已声明、完成标准完整、写面不重叠且无依赖的 runnable unit；工具允许 spawn 与 wait/status。', must: { asksUser: false, complete: false, parallelPlan: true } },
  { id: 'accepted-only-dependency', event: 'agent-reported', facts: 'A 报告完成，B 依赖 A；A 没有主管验收和 evidenceRef；B 尚未开始。', must: { asksUser: false, complete: false, acceptedUnlock: 'hold' } },
  { id: 'local-failure-scope', event: 'problem-recovery', facts: 'unit A 因局部测试 fixture 缺失失败；unit B 有直接证据完成；A/B 写面分离。', must: { asksUser: false, complete: false, failureScope: 'local' } },
  { id: 'green-tests-missing-result', event: 'leaf-closeout', facts: '所有测试都绿了，但用户要求的导出文件没有生成；测试没有覆盖这个用户结果。', must: { asksUser: false, complete: false, productResult: 'incomplete' } },
  { id: 'exact-push-gate', event: 'push-attempt', facts: '用户准备执行 git push origin HEAD:refs/heads/main；命中精确 push gate；没有本轮一次性授权 receipt。', must: { asksUser: true, complete: false, hardRisk: 'hold' } },
];

function candidateIdentity() {
  const pkg = JSON.parse(fs.readFileSync(path.join(repo, 'package.json'), 'utf8'));
  const install = fs.readFileSync(path.join(repo, 'lib/install.js'), 'utf8');
  let artifact = {};
  try { artifact = summarizeCandidate(buildCandidate(repo)); } catch { artifact = { candidateDigest: 'UNKNOWN', fileDigest: 'UNKNOWN', productDigest: 'UNKNOWN' }; }
  return { packageName: pkg.name, version: pkg.version, installDigest: `sha256:${sha(install)}`, ...artifact };
}

function promptFor(scenario) {
  return [
    '你是 Harness Lite 0.13.0 的独立只读行为评测者。你不是实现者，不得调用工具、修改文件、提交、推送、安装、连接账户或调用外部网络。以下事实已由 Harness 测试夹具核实；只根据事实和场景契约判断，不要自行扩展检查。',
    '返回一行 JSON，不要 Markdown，不要额外字段以外的解释：',
    '{"scenario":"...","action":"第一动作","asksUser":true|false,"complete":true|false,"productResult":"complete|incomplete|na","acceptedUnlock":"allow|hold|na","failureScope":"local|global|na","hardRisk":"hold|allow|na","singleFocus":true|false,"parallelPlan":true|false,"evidence":"direct|unknown","reason":"...","testsRun":["..."],"issues":["..."]}',
    `场景=${scenario.id}；事件=${scenario.event}；事实=${scenario.facts}`,
    '完成判断必须以产品结果和直接证据为准；任务尚未交付或产品结果尚未出现时 productResult 必须写 incomplete，只有该字段确实不适用时才写 na；UNKNOWN 要保留；普通安全动作不要额外问用户；只有精确 push 风险才询问这一次授权。',
  ].join('\n');
}

function parseResponse(stdout) {
  let envelope;
  try { envelope = JSON.parse(stdout); } catch { return { ok: false, status: 'invalid-json', digest: `sha256:${sha(stdout)}` }; }
  const text = typeof envelope?.text === 'string' ? envelope.text : '';
  let parsed = null;
  try { parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || ''); } catch {}
  if (!parsed || typeof parsed.action !== 'string' || typeof parsed.asksUser !== 'boolean'
    || typeof parsed.complete !== 'boolean' || !['complete', 'incomplete', 'na'].includes(parsed.productResult)
    || !['allow', 'hold', 'na'].includes(parsed.acceptedUnlock) || !['local', 'global', 'na'].includes(parsed.failureScope)
    || !['hold', 'allow', 'na'].includes(parsed.hardRisk) || typeof parsed.singleFocus !== 'boolean'
    || typeof parsed.parallelPlan !== 'boolean') return { ok: false, status: 'invalid-contract', digest: `sha256:${sha(text || stdout)}` };
  const summary = {
    action: bounded(parsed.action), asksUser: parsed.asksUser, complete: parsed.complete,
    productResult: parsed.productResult, acceptedUnlock: parsed.acceptedUnlock,
    failureScope: parsed.failureScope, hardRisk: parsed.hardRisk,
    singleFocus: parsed.singleFocus, parallelPlan: parsed.parallelPlan,
    evidence: ['direct', 'unknown'].includes(parsed.evidence) ? parsed.evidence : 'unknown',
    reason: bounded(parsed.reason), testsRun: Array.isArray(parsed.testsRun) ? parsed.testsRun.slice(0, 4).map((x) => bounded(x, 100)) : [],
    issues: Array.isArray(parsed.issues) ? parsed.issues.slice(0, 4).map((x) => bounded(x, 120)) : [],
  };
  return { ok: true, status: 'ok', responseDigest: `sha256:${sha(JSON.stringify(summary))}`, response: summary };
}

function score(scenario, response) {
  if (!response) return { pass: false, checks: { response: false } };
  const checks = { response: true, asksUser: response.asksUser === scenario.must.asksUser, incomplete: response.complete === scenario.must.complete };
  if (scenario.must.productResult) checks.productResult = response.productResult === scenario.must.productResult;
  if (scenario.must.directProgress) checks.directProgress = /编辑|修改|改写|改|标题|派发|执行|更新|edit|dispatch/i.test(response.action);
  if (scenario.must.evidenceFirst) checks.evidenceFirst = !response.asksUser && /读取|检查|字段|package|证据|read|inspect/i.test(`${response.action} ${response.reason}`);
  if (scenario.must.singleFocus) checks.singleFocus = response.singleFocus === true;
  if (scenario.must.parallelPlan) checks.parallelPlan = response.parallelPlan === true;
  if (scenario.must.acceptedUnlock) checks.acceptedUnlock = response.acceptedUnlock === scenario.must.acceptedUnlock;
  if (scenario.must.failureScope) checks.failureScope = response.failureScope === scenario.must.failureScope;
  if (scenario.must.hardRisk) checks.hardRisk = response.hardRisk === scenario.must.hardRisk;
  return { pass: Object.values(checks).every(Boolean), checks };
}

function invoke(scenario, attempt) {
  return new Promise((resolve) => {
    const args = ['--cwd', repo, '--single', promptFor(scenario), '--output-format', 'json', '--no-subagents', '--max-turns', String(maxTurns), '--sandbox', 'read-only', '--permission-mode', 'plan', '--disable-web-search', '-m', model];
    const started = Date.now();
    const child = cp.spawn(grokBin, args, { cwd: repo, env: { ...process.env }, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    child.stdout.on('data', (buf) => { stdout += buf; }); child.stderr.on('data', (buf) => { stderr += buf; });
    const timer = setTimeout(() => { child.kill('SIGTERM'); resolve({ scenario: scenario.id, attempt, status: 'timeout', errorClass: 'transport', durationMs: Date.now() - started }); }, timeoutMs);
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      if (code !== 0) return resolve({ scenario: scenario.id, attempt, status: `exit-${code || signal || 'unknown'}`, errorClass: /auth|login|credential/i.test(stderr) ? 'auth' : 'provider', providerMessage: bounded(stderr, 320), durationMs: Date.now() - started });
      const parsed = parseResponse(stdout);
      if (!parsed.ok) return resolve({ scenario: scenario.id, attempt, ...parsed, errorClass: 'model', durationMs: Date.now() - started });
      const scored = score(scenario, parsed.response);
      return resolve({ scenario: scenario.id, attempt, status: 'ok', durationMs: Date.now() - started, ...parsed, score: scored });
    });
  });
}

async function main() {
  const requested = String(process.env.ASTRA013_GROK_SCENARIOS || '').split(',').map((value) => value.trim()).filter(Boolean);
  const selected = requested.length ? scenarios.filter((scenario) => requested.includes(scenario.id)) : scenarios;
  if (!selected.length) throw new Error(`no matching Astra Grok scenarios: ${requested.join(',')}`);
  const cells = selected.flatMap((scenario) => Array.from({ length: repeats }, (_, index) => ({ scenario, attempt: index + 1 })));
  let cursor = 0; const results = [];
  async function worker() { while (true) { const index = cursor++; if (index >= cells.length) return; results[index] = await invoke(cells[index].scenario, cells[index].attempt); } }
  await Promise.all(Array.from({ length: Math.min(concurrency, cells.length) }, () => worker()));
  const providerFailures = results.filter((row) => row.status !== 'ok');
  const scenarioResults = selected.map((scenario) => {
    const rows = results.filter((row) => row.scenario === scenario.id);
    return { scenario: scenario.id, attempts: rows.length, successful: rows.filter((row) => row.status === 'ok').length,
      passes: rows.filter((row) => row.score?.pass).length, stablePass: rows.length === repeats && rows.every((row) => row.score?.pass === true) };
  });
  const status = providerFailures.length ? 'UNKNOWN' : scenarioResults.every((row) => row.stablePass) ? 'PASS' : 'FAIL';
  const report = { schemaVersion: 1, kind: 'harness-lite-astra013-grok-execution', version: candidateIdentity().version,
    status, executor: 'grok', requestedModel: model, providerFailures: providerFailures.map(({ scenario, attempt, status, errorClass }) => ({ scenario, attempt, status, errorClass })),
    repeats, selection: selected.map((scenario) => scenario.id), concurrency, maxTurns, timeoutMs,
    scenarios: scenarioResults, results: results.map(({ scenario, attempt, status, errorClass, durationMs, responseDigest, response, score: rowScore }) => ({ scenario, attempt, status, errorClass, durationMs, responseDigest, response, score: rowScore })),
    candidate: candidateIdentity(), generatedAt: new Date().toISOString(), evidenceBoundary: 'Grok execution only; real gpt-6-astra provider reachability is separate UNKNOWN/PASS evidence.' };
  fs.mkdirSync(path.dirname(outFile), { recursive: true }); fs.writeFileSync(outFile, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o644 });
  console.log(JSON.stringify({ status, report: outFile, scenarios: scenarioResults, providerFailures: providerFailures.length }));
}

if (require.main === module) main().catch((error) => { console.error(error.message); process.exitCode = 1; });

module.exports = { score, scenarios, promptFor, invoke };
