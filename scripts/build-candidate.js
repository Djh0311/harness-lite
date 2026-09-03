#!/usr/bin/env node
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const SINGLE_FILES = ['LICENSE', 'NEXT-VERSION-DISPATCH-PLAN.md', 'package.json'];
const SOURCE_DIRS = ['bin', 'hooks', 'lib', 'scripts', 'skills', 'test'];
const PRODUCT_JS_RE = /^(?:bin|hooks|lib)\/.*\.js$/;

function sha(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

function stableStringify(value) {
  return JSON.stringify(stable(value));
}

function mode(stat) {
  return (stat.mode & 0o777).toString(8).padStart(4, '0');
}

function assertInside(root, file) {
  const base = path.resolve(root);
  const abs = path.resolve(base, file);
  if (abs !== base && !abs.startsWith(base + path.sep)) return abs;
  return abs;
}

function walk(root, rel, out) {
  const abs = assertInside(root, rel);
  let entries;
  try { entries = fs.readdirSync(abs, { withFileTypes: true }); } catch { return; }
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const child = path.posix.join(rel, entry.name);
    const stat = fs.lstatSync(assertInside(root, child));
    if (stat.isSymbolicLink()) throw new Error(`candidate source contains symlink: ${child}`);
    if (entry.isDirectory()) walk(root, child, out);
    else if (entry.isFile()) out.push(child);
  }
}

function listCandidateFiles(root) {
  const files = [];
  for (const rel of SINGLE_FILES) {
    const abs = assertInside(root, rel);
    let stat;
    try { stat = fs.lstatSync(abs); } catch { continue; }
    if (stat.isSymbolicLink() || !stat.isFile()) throw new Error(`candidate source is not a regular file: ${rel}`);
    files.push(rel);
  }
  for (const rel of SOURCE_DIRS) walk(root, rel, files);
  return [...new Set(files)].sort();
}

function gitIdentity(root) {
  const run = spawnSync('/usr/bin/git', ['rev-parse', '--verify', 'HEAD'], {
    cwd: root,
    encoding: 'utf8',
    env: { PATH: '/usr/bin:/bin', LANG: 'C', LC_ALL: 'C' },
  });
  return run.status === 0 && /^[0-9a-f]{40,64}$/i.test(run.stdout.trim())
    ? { repo: true, head: run.stdout.trim().toLowerCase() }
    : { repo: false, head: null };
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function fileRow(root, rel) {
  const abs = assertInside(root, rel);
  const stat = fs.lstatSync(abs);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`candidate source is not a regular file: ${rel}`);
  const body = fs.readFileSync(abs);
  return {
    path: rel,
    mode: mode(stat),
    size: body.length,
    sha256: sha(body),
    contentBase64: body.toString('base64'),
  };
}

function digestRows(rows) {
  return `sha256:${sha(stableStringify(rows.map(({ contentBase64: _content, ...meta }) => meta)))}`;
}

function productDigest(rows) {
  return `sha256:${sha(stableStringify(rows.filter((row) => PRODUCT_JS_RE.test(row.path)).map((row) => ({
    path: row.path,
    mode: row.mode,
    size: row.size,
    sha256: row.sha256,
  }))))}`;
}

function buildCandidate(root = path.resolve(__dirname, '..')) {
  root = path.resolve(root);
  const pkg = readJson(path.join(root, 'package.json'));
  const files = listCandidateFiles(root).map((rel) => fileRow(root, rel));
  const candidateVersion = process.env.HARNESS_LITE_CANDIDATE_VERSION || pkg.version;
  if (process.env.HARNESS_LITE_CANDIDATE_VERSION && candidateVersion !== pkg.version) {
    const row = files.find((item) => item.path === 'package.json');
    if (row) {
      const body = Buffer.from(row.contentBase64, 'base64');
      const patched = { ...JSON.parse(body.toString('utf8')), version: candidateVersion };
      const text = `${JSON.stringify(patched, null, 2)}\n`;
      row.contentBase64 = Buffer.from(text).toString('base64');
      row.size = Buffer.byteLength(text);
      row.sha256 = sha(Buffer.from(text));
    }
    const installRow = files.find((item) => item.path === 'lib/install.js');
    if (installRow) {
      const body = Buffer.from(installRow.contentBase64, 'base64').toString('utf8')
        .replace("const VERSION = '0.11.0';", `const VERSION = '${candidateVersion}';`)
        .replace("const SOURCE_COMMIT = 'working-copy:0.11.0-candidate';", `const SOURCE_COMMIT = 'working-copy:${candidateVersion}-candidate';`)
        .replace("  if (value.runtimeVersion === PREVIOUS_10_SNAPSHOT.runtimeVersion)", "  if (value.runtimeVersion === PREVIOUS_11_SNAPSHOT.runtimeVersion) return verifyPrevious11Snapshot(root);\n  if (value.runtimeVersion === PREVIOUS_10_SNAPSHOT.runtimeVersion)");
      installRow.contentBase64 = Buffer.from(body).toString('base64');
      installRow.size = Buffer.byteLength(body);
      installRow.sha256 = sha(Buffer.from(body));
    }
  }
  const productFiles = files.filter((row) => PRODUCT_JS_RE.test(row.path)).map((row) => row.path);
  return {
    schemaVersion: 1,
    kind: 'harness-lite-source-candidate',
    provenance: {
      source: 'working-copy-snapshot',
      git: gitIdentity(root),
    },
    package: {
      name: pkg.name,
      // F07 may build a versioned candidate from the current working tree
      // without mutating the retained 0.11 source package metadata.
      version: candidateVersion,
      type: pkg.type,
      node: pkg.engines?.node || null,
    },
    files,
    fileDigest: digestRows(files),
    productFiles,
    productDigest: productDigest(files),
  };
}

function artifactText(candidate) {
  return `${stableStringify(candidate)}\n`;
}

function summarize(candidate) {
  const text = artifactText(candidate);
  return {
    ok: true,
    kind: candidate.kind,
    packageName: candidate.package.name,
    version: candidate.package.version,
    git: candidate.provenance.git,
    fileCount: candidate.files.length,
    productFileCount: candidate.productFiles.length,
    fileDigest: candidate.fileDigest,
    productDigest: candidate.productDigest,
    candidateDigest: `sha256:${sha(text)}`,
  };
}

function parseArgs(argv) {
  const opts = { root: path.resolve(__dirname, '..'), out: null, json: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--json') opts.json = true;
    else if (arg === '--root') opts.root = path.resolve(argv[++i] || '');
    else if (arg === '--out') opts.out = path.resolve(argv[++i] || '');
    else if (arg === '--help' || arg === '-h') opts.help = true;
    else throw new Error(`unknown argument: ${arg}`);
  }
  return opts;
}

function main(argv = []) {
  const opts = parseArgs(argv);
  if (opts.help) {
    console.log('Usage: node scripts/build-candidate.js [--json] [--out file] [--root dir]');
    return 0;
  }
  const candidate = buildCandidate(opts.root);
  const text = artifactText(candidate);
  const summary = summarize(candidate);
  if (opts.out) {
    fs.mkdirSync(path.dirname(opts.out), { recursive: true });
    fs.writeFileSync(opts.out, text, { mode: 0o600 });
  }
  if (opts.json) console.log(JSON.stringify(summary, null, 2));
  else {
    console.log(`Harness Lite ${summary.version} candidate ${summary.candidateDigest}`);
    console.log(`files=${summary.fileCount} productFiles=${summary.productFileCount} productDigest=${summary.productDigest}`);
    console.log(`git=${summary.git.repo ? summary.git.head : 'none'}`);
  }
  return 0;
}

if (require.main === module) {
  try { process.exit(main(process.argv.slice(2))); }
  catch (error) { console.error(error.message); process.exit(1); }
}

module.exports = {
  listCandidateFiles,
  buildCandidate,
  artifactText,
  summarize,
  stableStringify,
  main,
};
