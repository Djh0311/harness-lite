'use strict';

const assert = require('assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const test = require('node:test');

const builder = require('../scripts/build-candidate.js');

const sourceRoot = path.resolve(__dirname, '..');
const frozenR01R18Bytes = 4772;
const frozenR01R18Digest = 'sha256:1a69fc8dbbef7304938b9da1f20af9daf47f6b24b131b6d8861c8c906d66a719';
const legacyB164Digest = 'sha256:b164bab93900c2cbaa2eb43be5ca144934ad83d2bcae6dad4c0c9b0cfb2e95ea';

function sha(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function unique(values) {
  return [...new Set(values)];
}

function topOfNext(next) {
  const marker = '## 一、冻结的需求基线';
  const index = next.indexOf(marker);
  assert.notEqual(index, -1, 'NEXT is missing the frozen requirements marker');
  return next.slice(0, index);
}

function frozenR01R18(next) {
  const start = next.indexOf('## 一、冻结的需求基线');
  const end = next.indexOf('## 二、产品边界');
  assert.notEqual(start, -1, 'NEXT is missing R01-R18 start');
  assert.notEqual(end, -1, 'NEXT is missing R01-R18 end');
  return next.slice(start, end);
}

function nextFromCandidate(candidate) {
  const row = candidate.files.find((file) => file.path === 'NEXT-VERSION-DISPATCH-PLAN.md');
  assert.ok(row, 'candidate must include NEXT-VERSION-DISPATCH-PLAN.md');
  return Buffer.from(row.contentBase64, 'base64').toString('utf8');
}

function candidateSnapshot(root) {
  const candidate = builder.buildCandidate(root);
  const text = builder.artifactText(candidate);
  const summary = builder.summarize(candidate);
  assert.equal(summary.candidateDigest, `sha256:${sha(text)}`);
  return { candidate, text, summary };
}

function withoutGitAuthority(value) {
  return {
    ...value,
    provenance: { ...value.provenance, git: { repo: false, head: null } },
  };
}

function materializeCandidate(prefix = 'hl-r4-candidate-') {
  const baseline = candidateSnapshot(sourceRoot);
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  for (const row of baseline.candidate.files) {
    const target = path.join(root, row.path);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, Buffer.from(row.contentBase64, 'base64'));
    fs.chmodSync(target, parseInt(row.mode, 8));
  }
  const rematerialized = candidateSnapshot(root);
  // The disposable materialization has no Git worktree.  Candidate bytes and
  // content digests must remain stable, while provenance.git may legitimately
  // change from the source worktree to { repo: false, head: null }.
  assert.equal(builder.artifactText(withoutGitAuthority(rematerialized.candidate)),
    builder.artifactText(withoutGitAuthority(baseline.candidate)));
  assert.deepEqual(builder.summarize(withoutGitAuthority(rematerialized.candidate)),
    builder.summarize(withoutGitAuthority(baseline.candidate)));
  assert.equal(rematerialized.candidate.fileDigest, baseline.candidate.fileDigest);
  assert.equal(rematerialized.candidate.productDigest, baseline.candidate.productDigest);
  return { root, baseline };
}

function topContractViolations(top) {
  const violations = [];
  if (/sha256:[0-9a-f]{64}/i.test(top)) violations.push('concrete digest identity');
  if (/\b(?:candidateDigest|fileDigest|productDigest)\b/.test(top)) violations.push('builder digest field');
  if (/\bartifact bytes\b\s*`?\d+`?/i.test(top) || /\b\d+\s+files\s*\/\s*\d+\s+product JS\b/i.test(top)) {
    violations.push('artifact byte or file-count identity');
  }
  if (/\bR[34]\b/.test(top) && /(?:stage|leaf|candidate|PASS|ACCEPTED|current|active|final|最终|当前|验收|收口)/i.test(top)) {
    violations.push('R3/R4 lifecycle authority');
  }
  if (/(?:current leaf|active stage|authoritative current|live PASS|final closeout|\bPASS\b|\bACCEPTED\b|\bACTIVE\b|当前唯一|最终索引|报告索引|归档索引)/i.test(top)) {
    violations.push('live lifecycle authority');
  }
  if (/docs\/harness\/(?:leaves|stages|reports|done)\//.test(top)) violations.push('specific docs authority pointer');
  return unique(violations);
}

function assertStableTop(top) {
  const violations = topContractViolations(top);
  assert.deepEqual(violations, [], `NEXT top is not stable: ${violations.join(', ')}`);
  assert.ok(top.includes('历史冻结要求'), top);
  assert.ok(top.includes('实时/最终 lifecycle、artifact identity 和 candidate digest 只存在 candidate 输入外的 `docs/harness/**`'), top);
  assert.ok(top.includes('NEXT 本身是 candidate 输入'), top);
  assert.ok(top.includes('docs-only lifecycle 更新不应改变 candidate artifact'), top);
}

test('R4F01 guard rejects the legacy self-referential closeout top', () => {
  const legacyTop = `# Harness Lite 下一版本派发包

状态：\`PASS / R4 REPAIR ACCEPTED / CANDIDATE ONLY / NOT PUSHED / NOT RELEASED\`

R4 最终索引：accepted candidate 固定为 \`${legacyB164Digest}\`，39 files / 13 product JS，fileDigest \`sha256:576f0edafdd2da2e81f06cf0a869f07092d987c5884e6bc8207eecd91b349ef4\`，artifact bytes \`1051440\`。
R4 当前唯一 active stage 是 \`stage-hlnext-repair-r4\`，authoritative current leaf 只以 \`docs/harness/leaves/HLNEXT-REPAIR-R4.md\` 为准。
R4 final closeout：\`docs/harness/reports/HLNEXT-REPAIR-R4F05-supervisor-closeout-PASS.md\`。
`;

  const violations = topContractViolations(legacyTop);
  for (const violation of [
    'concrete digest identity',
    'builder digest field',
    'artifact byte or file-count identity',
    'R3/R4 lifecycle authority',
    'live lifecycle authority',
    'specific docs authority pointer',
  ]) {
    assert.ok(violations.includes(violation), `${violation} missing from ${violations.join(', ')}`);
  }
  assert.throws(() => assertStableTop(legacyTop), /NEXT top is not stable/);
});

test('R4F01 NEXT top is stable history while R01-R18 remains byte-for-byte frozen', () => {
  const candidate = builder.buildCandidate(sourceRoot);
  const next = fs.readFileSync(path.join(sourceRoot, 'NEXT-VERSION-DISPATCH-PLAN.md'), 'utf8');
  assert.equal(nextFromCandidate(candidate), next);

  assertStableTop(topOfNext(next));
  const frozen = frozenR01R18(next);
  assert.equal(Buffer.byteLength(frozen), frozenR01R18Bytes);
  assert.equal(`sha256:${sha(frozen)}`, frozenR01R18Digest);
});

test('R4F01 candidate ignores docs-only lifecycle changes but changes for real candidate inputs', () => {
  const docsOnly = materializeCandidate('hl-r4-docs-only-');
  try {
    const report = path.join(docsOnly.root, 'docs/harness/reports/r4f01-docs-only-probe.md');
    fs.mkdirSync(path.dirname(report), { recursive: true });
    fs.writeFileSync(report, 'docs-only lifecycle probe outside candidate input\n');
    const afterDocs = candidateSnapshot(docsOnly.root);
    assert.equal(builder.artifactText(withoutGitAuthority(afterDocs.candidate)),
      builder.artifactText(withoutGitAuthority(docsOnly.baseline.candidate)));
    assert.deepEqual(builder.summarize(withoutGitAuthority(afterDocs.candidate)),
      builder.summarize(withoutGitAuthority(docsOnly.baseline.candidate)));
  } finally {
    fs.rmSync(docsOnly.root, { recursive: true, force: true });
  }

  const nextInput = materializeCandidate('hl-r4-next-input-');
  try {
    fs.appendFileSync(path.join(nextInput.root, 'NEXT-VERSION-DISPATCH-PLAN.md'), '\nR4F01 candidate input mutation probe.\n');
    const afterNext = candidateSnapshot(nextInput.root);
    assert.notEqual(afterNext.text, nextInput.baseline.text);
    assert.notEqual(afterNext.summary.candidateDigest, nextInput.baseline.summary.candidateDigest);
    assert.notEqual(afterNext.summary.fileDigest, nextInput.baseline.summary.fileDigest);
  } finally {
    fs.rmSync(nextInput.root, { recursive: true, force: true });
  }

  const sourceInput = materializeCandidate('hl-r4-source-input-');
  try {
    fs.appendFileSync(path.join(sourceInput.root, 'skills/root-cause.md'), '\nR4F01 candidate source mutation probe.\n');
    const afterSource = candidateSnapshot(sourceInput.root);
    assert.notEqual(afterSource.text, sourceInput.baseline.text);
    assert.notEqual(afterSource.summary.candidateDigest, sourceInput.baseline.summary.candidateDigest);
    assert.notEqual(afterSource.summary.fileDigest, sourceInput.baseline.summary.fileDigest);
  } finally {
    fs.rmSync(sourceInput.root, { recursive: true, force: true });
  }
});

test('R4F01 candidate builds deterministically with closeout tests included', () => {
  const first = candidateSnapshot(sourceRoot);
  const second = candidateSnapshot(sourceRoot);
  assert.equal(first.text, second.text);
  assert.deepEqual(first.summary, second.summary);
  assert.ok(first.candidate.files.some((row) => row.path === 'test/r4-candidate-closeout.test.js'));
  assert.equal(first.summary.productFileCount, 14);
});
