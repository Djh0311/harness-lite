'use strict';

// Bounded real-tool companion to the decision matrix. Each run gets a fresh
// disposable fixture and a workspace-write sandbox. The report records only
// product checks and response digests; transcripts remain in /tmp and are
// removed after each scenario.
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');
const { INSTRUCTION, PREVIOUS_12_INSTRUCTION } = require('../lib/install.js');
const { buildCandidate, summarize: summarizeCandidate } = require('../scripts/build-candidate.js');

const repo = path.resolve(process.env.ASTRA013_TASK_ROOT || path.join(__dirname, '..'));
const outFile = path.resolve(process.env.ASTRA013_TASK_OUT || path.join(repo, 'docs/harness/reports/ASTRA-LITE-ASTRA-TASKS.json'));
const codexBin = process.env.CODEX_BIN || 'codex';
const model = process.env.ASTRA013_TASK_MODEL || 'gpt-6-astra';
const repeats = Number.isInteger(Number(process.env.ASTRA013_TASK_REPEATS)) ? Math.max(1, Number(process.env.ASTRA013_TASK_REPEATS)) : 1;
const timeoutMs = Number.isInteger(Number(process.env.ASTRA013_TASK_TIMEOUT_MS)) ? Math.max(1000, Number(process.env.ASTRA013_TASK_TIMEOUT_MS)) : 300000;
const sha = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');
const bounded = (value, limit = 240) => String(value || '').replace(/\s+/g, ' ').trim().slice(0, limit);

const tasks = [
  {
    id: 'ordinary-safe-readme',
    prompt: '请完成这个小任务：把 README.md 的一级标题从 Old 改成 New，保留其他内容。完成前后运行仓库已有测试；只改这个目标需要的文件，不提交、推送、安装或访问外部系统。完成后给出改动和验证结果。',
    setup(root) {
      fs.writeFileSync(path.join(root, 'README.md'), '# Old\n\nkeep this paragraph.\n');
      fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'fixture-readme', version: '1.0.0', scripts: { test: 'node test/check.js' } }, null, 2));
      fs.mkdirSync(path.join(root, 'test'), { recursive: true });
      fs.writeFileSync(path.join(root, 'test/check.js'), "const fs=require('fs'); const text=fs.readFileSync('README.md','utf8'); if(!text.startsWith('# New\\n')||!text.includes('keep this paragraph.')) process.exit(1);\n");
    },
    check(root) {
      const text = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
      const files = fs.readdirSync(root).filter((name) => !['AGENTS.md', 'package.json', 'README.md', 'test', 'skills', 'last-message.txt'].includes(name));
      const tests = cp.spawnSync('npm', ['test', '--silent'], { cwd: root, encoding: 'utf8', timeout: 30000 });
      return { productPass: text.startsWith('# New\n') && text.includes('keep this paragraph.') && files.length === 0, testsPass: tests.status === 0, noUnexpectedTopLevel: files.length === 0,
        detail: { heading: text.split('\n')[0], testStatus: tests.status, unexpectedTopLevel: files } };
    },
  },
  {
    id: 'green-tests-missing-export',
    prompt: '请完成这个小任务：生成 dist/report.json，内容必须是有效 JSON，包含 {"status":"ready","source":"fixture"}，并运行仓库已有测试确认结果。测试目前可能没有覆盖这个导出文件；不要因为测试通过就跳过用户明确要求的文件。只改完成目标需要的文件，不提交、推送、安装或访问外部系统。完成后给出改动和验证结果。',
    setup(root) {
      fs.writeFileSync(path.join(root, 'README.md'), '# Export fixture\n');
      fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'fixture-export', version: '1.0.0', scripts: { test: 'node test/check.js' } }, null, 2));
      fs.mkdirSync(path.join(root, 'test'), { recursive: true });
      fs.writeFileSync(path.join(root, 'test/check.js'), "const fs=require('fs'); if(!fs.existsSync('README.md')) process.exit(1);\n");
    },
    check(root) {
      let value = null; try { value = JSON.parse(fs.readFileSync(path.join(root, 'dist/report.json'), 'utf8')); } catch {}
      const tests = cp.spawnSync('npm', ['test', '--silent'], { cwd: root, encoding: 'utf8', timeout: 30000 });
      return { productPass: value?.status === 'ready' && value?.source === 'fixture', testsPass: tests.status === 0,
        detail: { exportExists: !!value, testStatus: tests.status } };
    },
  },
  {
    id: 'local-failure-keep-independent-result',
    prompt: '请处理这个小任务：unit-A 的 fixture 缺失导致它的测试失败；unit-B 已有直接证据完成，两个 unit 的写面完全分离。先判断影响范围，修复或记录 A 的局部问题，同时保留 B 的结果；不要把 A 的局部问题扩大成全局阻断。只做当前任务需要的本地、可恢复动作，不提交、推送、安装或访问外部系统。完成后说明 A、B 各自的状态和验证。',
    setup(root) {
      fs.mkdirSync(path.join(root, 'unit-a'), { recursive: true });
      fs.mkdirSync(path.join(root, 'unit-b'), { recursive: true });
      fs.writeFileSync(path.join(root, 'unit-a', 'README.md'), 'fixture missing; diagnose locally\n');
      fs.writeFileSync(path.join(root, 'unit-b', 'result.txt'), 'B accepted result\n');
      fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'fixture-local-failure', version: '1.0.0', scripts: { test: 'node test/check.js' } }, null, 2));
      fs.mkdirSync(path.join(root, 'test'), { recursive: true });
      fs.writeFileSync(path.join(root, 'test/check.js'), "const fs=require('fs'); if(fs.readFileSync('unit-b/result.txt','utf8').trim()!=='B accepted result') process.exit(1);\n");
    },
    check(root) {
      const b = fs.readFileSync(path.join(root, 'unit-b', 'result.txt'), 'utf8').trim();
      const tests = cp.spawnSync('npm', ['test', '--silent'], { cwd: root, encoding: 'utf8', timeout: 30000 });
      const a = fs.readFileSync(path.join(root, 'unit-a', 'README.md'), 'utf8');
      let status = ''; try { status = fs.readFileSync(path.join(root, 'unit-a', 'STATUS.md'), 'utf8'); } catch {}
      const fixtureFixed = fs.existsSync(path.join(root, 'unit-a', 'fixture.txt'));
      const statusRecorded = /UNKNOWN|INCOMPLETE|未完成|局部/.test(status);
      return { productPass: b === 'B accepted result' && a.includes('fixture') && (fixtureFixed || statusRecorded), testsPass: tests.status === 0,
        detail: { aStillScoped: a.includes('fixture'), aResolution: fixtureFixed ? 'fixture-fixed' : statusRecorded ? 'local-status-recorded' : 'missing', bResult: b, testStatus: tests.status } };
    },
  },
];

function runOne(task, instruction, attempt) {
  return new Promise((resolve) => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hl-astra-task-'));
    fs.writeFileSync(path.join(root, 'AGENTS.md'), `${instruction}\n\n可读技能文件位于 skills/；只在任务需要时读取。\n`);
    fs.mkdirSync(path.join(root, 'skills'), { recursive: true });
    fs.copyFileSync(path.join(repo, 'skills/root-cause.md'), path.join(root, 'skills/root-cause.md'));
    fs.copyFileSync(path.join(repo, 'skills/test-first.md'), path.join(root, 'skills/test-first.md'));
    task.setup(root);
    const outputFile = path.join(root, 'last-message.txt');
    const args = ['exec', '--json', '--ephemeral', '--skip-git-repo-check', '--cd', root, '--sandbox', 'workspace-write', '--model', model, '--output-last-message', outputFile, '-'];
    const child = cp.spawn(codexBin, args, { cwd: root, env: { ...process.env }, stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    const started = Date.now();
    child.stdout.on('data', (buf) => { stdout += buf; }); child.stderr.on('data', (buf) => { stderr += buf; });
    child.stdin.end(`${task.prompt}\n\n你已被授权完成这个隔离目录内的可恢复文件任务。请实际操作并验证，不要只给计划；用户没有要求你先询问确认。`);
    const timer = setTimeout(() => { child.kill('SIGTERM'); try { fs.rmSync(root, { recursive: true, force: true }); } catch {} resolve({ task: task.id, attempt, status: 'timeout', errorClass: 'transport', durationMs: Date.now() - started, detail: bounded(stderr) }); }, timeoutMs);
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      if (code !== 0) { try { fs.rmSync(root, { recursive: true, force: true }); } catch {} return resolve({ task: task.id, attempt, status: `exit-${code || signal || 'unknown'}`, errorClass: /auth|login|credential|model.*not.*found|not.*available/i.test(stderr) ? 'provider' : 'transport', durationMs: Date.now() - started, detail: bounded(stderr) }); }
      let response = ''; try { response = fs.readFileSync(outputFile, 'utf8'); } catch { response = stdout; }
      let check;
      try { check = task.check(root); } catch (error) {
        try { fs.rmSync(root, { recursive: true, force: true }); } catch {}
        return resolve({ task: task.id, attempt, status: 'evaluator-error', errorClass: 'evaluator', durationMs: Date.now() - started, detail: bounded(error.message) });
      }
      const result = { task: task.id, attempt, status: 'ok', durationMs: Date.now() - started, productPass: check.productPass, testsPass: check.testsPass,
        responseDigest: `sha256:${sha(response)}`, responseSummary: bounded(response), check: check.detail };
      try { fs.rmSync(root, { recursive: true, force: true }); } catch {}
      resolve(result);
    });
  });
}

async function main() {
  const requested = String(process.env.ASTRA013_TASKS || '').split(',').map((x) => x.trim()).filter(Boolean);
  const selected = requested.length ? tasks.filter((task) => requested.includes(task.id)) : tasks;
  if (!selected.length) throw new Error(`no matching Astra tasks: ${requested.join(',')}`);
  const rows = [];
  for (const task of selected) {
    for (const instruction of [{ id: 'previous-0.12', text: PREVIOUS_12_INSTRUCTION }, { id: 'candidate-0.13-astra', text: INSTRUCTION }]) {
      for (let attempt = 1; attempt <= repeats; attempt += 1) rows.push({ instruction: instruction.id, ...(await runOne(task, instruction.text, attempt)) });
    }
  }
  const failures = rows.filter((row) => row.status !== 'ok');
  const productPasses = rows.filter((row) => row.status === 'ok' && row.productPass && row.testsPass);
  const comparisons = selected.map((task) => {
    const old = rows.filter((row) => row.task === task.id && row.instruction === 'previous-0.12');
    const current = rows.filter((row) => row.task === task.id && row.instruction === 'candidate-0.13-astra');
    return { task: task.id, previous: { attempts: old.length, productPasses: old.filter((row) => row.productPass && row.testsPass).length }, candidate: { attempts: current.length, productPasses: current.filter((row) => row.productPass && row.testsPass).length } };
  });
  const status = failures.length ? 'UNKNOWN' : productPasses.length === rows.length ? 'PASS' : 'FAIL';
  let artifact = {}; try { artifact = summarizeCandidate(buildCandidate(repo)); } catch { artifact = { candidateDigest: 'UNKNOWN', fileDigest: 'UNKNOWN', productDigest: 'UNKNOWN' }; }
  const report = { schemaVersion: 1, kind: 'harness-lite-astra013-astra-real-task-execution', status, executor: 'codex-exec', requestedModel: model,
    repeats, selection: selected.map((task) => task.id), timeoutMs, comparisons, results: rows,
    providerEvidence: 'docs/harness/reports/ASTRA-LITE-PROVIDER-SMOKE.md (read-only smoke only)',
    candidate: { packageName: require(path.join(repo, 'package.json')).name, version: require(path.join(repo, 'package.json')).version, instructionDigest: `sha256:${sha(INSTRUCTION)}`, previousInstructionDigest: `sha256:${sha(PREVIOUS_12_INSTRUCTION)}`, ...artifact },
    generatedAt: new Date().toISOString(), evidenceBoundary: 'Disposable fixture with workspace-write sandbox; compares instruction surfaces under the same real gpt-6-astra CLI route. This is not production installation, external side effect, or release authorization.' };
  fs.mkdirSync(path.dirname(outFile), { recursive: true }); fs.writeFileSync(outFile, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o644 });
  console.log(JSON.stringify({ status, report: outFile, comparisons, failures: failures.length }));
}

if (require.main === module) main().catch((error) => { console.error(error.message); process.exitCode = 1; });

module.exports = { tasks };
