#!/usr/bin/env node
'use strict';
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const RUNTIME = '.claude/harness-lite';
const MANIFEST = `${RUNTIME}/ownership.json`;
const INSTALLATION_ANCHOR = '.codex/harness-lite/installation.json';
const GIT_ENV = Object.freeze({ PATH: '/usr/bin:/bin', LANG: 'C', LC_ALL: 'C' });
const sha = (value) => crypto.createHash('sha256').update(value).digest('hex');
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}
const canonicalDigest = (value) => `sha256:${sha(JSON.stringify(canonical(value)))}`;
function projectDefinitionDigest() {
  const command = `node "$(/usr/bin/git rev-parse --show-toplevel)/${RUNTIME}/hooks/dispatcher.js"`;
  const handler = (timeout, canAddContext = true) => ({ type: 'command', command, timeout,
    ...(canAddContext ? { additionalContextLimit: 1800 } : {}) });
  const hooks = {
    SessionStart: [{ matcher: 'startup|resume|clear|compact', hooks: [handler(15)] }],
    UserPromptSubmit: [{ hooks: [handler(10)] }],
    Stop: [{ hooks: [handler(30, false)] }],
    PreToolUse: [{ matcher: '^Bash$', hooks: [handler(10)] }],
  };
  return `sha256:${sha(JSON.stringify(canonical(hooks)))}`;
}
function projectRoot(cwd) {
  const base = path.resolve(cwd || process.cwd()), run = spawnSync('/usr/bin/git', ['rev-parse', '--show-toplevel'], { cwd: base, encoding: 'utf8', env: GIT_ENV });
  const candidate = run.status === 0 && run.stdout.trim() ? path.resolve(run.stdout.trim()) : base;
  try { return fs.realpathSync(candidate); } catch { return candidate; }
}
function regular(file, mode = null) {
  let stat; try { stat = fs.lstatSync(file); } catch (error) { return { ok: false, reason: error.code === 'ENOENT' ? 'missing' : error.message }; }
  if (!stat.isFile() || stat.isSymbolicLink()) return { ok: false, reason: 'not-regular' };
  if (mode !== null && (stat.mode & 0o777) !== mode) return { ok: false, reason: 'mode' };
  try { return { ok: true, body: fs.readFileSync(file), mode: stat.mode & 0o777 }; } catch (error) { return { ok: false, reason: error.message }; }
}
function safeParents(root, file) {
  let cursor = path.resolve(root);
  for (const part of path.relative(root, path.dirname(file)).split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, part);
    try { const stat = fs.lstatSync(cursor); if (!stat.isDirectory() || stat.isSymbolicLink()) return false; }
    catch { return false; }
  }
  return true;
}
function filesBelow(dir, prefix = '') {
  const rows = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const file = path.join(dir, entry.name), rel = prefix ? `${prefix}/${entry.name}` : entry.name, stat = fs.lstatSync(file);
    if (stat.isSymbolicLink()) throw new Error(`symlink:${rel}`);
    if (stat.isDirectory()) rows.push(...filesBelow(file, rel));
    else if (stat.isFile()) rows.push(rel);
    else throw new Error(`other:${rel}`);
  }
  return rows;
}
function packageDigest(runtime, paths) {
  const hash = crypto.createHash('sha256');
  for (const rel of [...paths].sort()) {
    const file = path.resolve(runtime, rel);
    if (file !== path.resolve(runtime) && !file.startsWith(`${path.resolve(runtime)}${path.sep}`)) throw new Error(`outside:${rel}`);
    const item = regular(file); if (!item.ok) throw new Error(`${item.reason}:${rel}`);
    const mode = item.mode.toString(8).padStart(4, '0');
    for (const value of [rel, 'file', mode, String(item.body.length)]) hash.update(`${Buffer.byteLength(value)}:${value}`);
    hash.update(item.body);
  }
  return `sha256:${hash.digest('hex')}`;
}
function anchorBase(root, manifest, manifestBody, createdDirectories) {
  return {
    schemaVersion: 1,
    managedBy: 'harness-lite',
    targetCanonical: fs.realpathSync(root),
    runtimeVersion: manifest.runtimeVersion,
    sourceCommit: manifest.sourceCommit,
    profile: manifest.profile,
    sourcePackageDigest: manifest.packageDigest,
    hookDefinitionDigest: manifest.hookDefinitionDigest,
    manifestDigest: `sha256:${sha(manifestBody)}`,
    managedPathsDigest: canonicalDigest(manifest.managedPaths),
    instructionOwnershipDigest: canonicalDigest(manifest.instructionOwnership ?? null),
    rollbackCarriersDigest: canonicalDigest(manifest.rollbackCarriers ?? []),
    extensionsDigest: canonicalDigest(manifest.extensions ?? {}),
    createdDirectories: [...createdDirectories],
  };
}
function anchorValue(root, manifest, manifestBody, createdDirectories) {
  const base = anchorBase(root, manifest, manifestBody, createdDirectories);
  return { ...base, anchorDigest: canonicalDigest(base) };
}
function verifyExtensions(runtime, extensions) {
  if (!extensions || typeof extensions !== 'object' || Array.isArray(extensions)) return false;
  const claimed = new Set();
  for (const [id, spec] of Object.entries(extensions)) {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(id) || !spec || typeof spec !== 'object' || !spec.packageVersion
      || !Array.isArray(spec.managedPaths) || !/^sha256:[0-9a-f]{64}$/.test(spec.packageDigest || '')) return false;
    const paths = [...spec.managedPaths].sort(), prefix = `extensions/${id}/`;
    if (!paths.length || paths.some((rel) => typeof rel !== 'string' || !rel.startsWith(prefix) || claimed.has(rel))) return false;
    for (const rel of paths) claimed.add(rel);
    try { if (packageDigest(runtime, paths) !== spec.packageDigest) return false; } catch { return false; }
  }
  let physical = []; try {
    const dir = path.join(runtime, 'extensions'); if (fs.existsSync(dir)) physical = filesBelow(dir, 'extensions');
  } catch { return false; }
  return JSON.stringify(physical.sort()) === JSON.stringify([...claimed].sort());
}
function bootstrapVerify(root) {
  root = path.resolve(root); const differences = [];
  let canonicalRoot; try { canonicalRoot = fs.realpathSync(root); } catch { return { ok: false, state: 'UNKNOWN', differences: ['target:canonical'] }; }
  root = canonicalRoot;
  const runtime = path.join(root, RUNTIME), manifestFile = path.join(root, MANIFEST), anchorFile = path.join(root, INSTALLATION_ANCHOR);
  if (!safeParents(root, manifestFile) || !safeParents(root, anchorFile)) return { ok: false, state: 'UNKNOWN', differences: ['identity:unsafe-parent'] };
  const manifestImage = regular(manifestFile, 0o600), anchorImage = regular(anchorFile, 0o600);
  if (!manifestImage.ok) differences.push(`manifest:${manifestImage.reason}`);
  if (!anchorImage.ok) differences.push(`anchor:${anchorImage.reason}`);
  if (differences.length) return { ok: false, state: 'UNKNOWN', differences };
  let manifest, anchor;
  try { manifest = JSON.parse(manifestImage.body.toString('utf8')); } catch { differences.push('manifest:json'); }
  try { anchor = JSON.parse(anchorImage.body.toString('utf8')); } catch { differences.push('anchor:json'); }
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest) || !Array.isArray(manifest.managedPaths)) differences.push('manifest:schema');
  if (!anchor || typeof anchor !== 'object' || Array.isArray(anchor)) differences.push('anchor:schema');
  const allowedDirectories = ['.claude', '.codex', '.codex/harness-lite'];
  if (!Array.isArray(anchor?.createdDirectories) || new Set(anchor.createdDirectories).size !== anchor.createdDirectories.length
    || JSON.stringify(anchor.createdDirectories) !== JSON.stringify(allowedDirectories.filter((rel) => anchor.createdDirectories.includes(rel)))) differences.push('anchor:createdDirectories');
  if (differences.length) return { ok: false, state: 'UNKNOWN', differences };
  let expected;
  try { expected = anchorValue(root, manifest, manifestImage.body, anchor.createdDirectories); } catch { differences.push('anchor:binding'); }
  if (expected) {
    if (!anchorImage.body.equals(Buffer.from(`${JSON.stringify(expected, null, 2)}\n`))) differences.push('anchor:bytes');
    if (JSON.stringify(canonical(anchor)) !== JSON.stringify(canonical(expected))) differences.push('anchor:value');
  }
  if (typeof manifest.runtimeVersion !== 'string' || !manifest.runtimeVersion) differences.push('runtimeVersion');
  if (typeof manifest.sourceCommit !== 'string' || !manifest.sourceCommit) differences.push('sourceCommit');
  if (!/^sha256:[0-9a-f]{64}$/.test(manifest.packageDigest || '')) differences.push('packageDigest');
  if (!['project', 'managed'].includes(manifest.profile)) differences.push('profile');
  if (manifest.hookDefinitionDigest !== projectDefinitionDigest()) differences.push('hookDefinitionDigest');
  const expectedPaths = [...manifest.managedPaths].sort();
  if (new Set(expectedPaths).size !== expectedPaths.length || expectedPaths.some((rel) => typeof rel !== 'string' || !rel || path.isAbsolute(rel) || rel.split(/[\\/]/).includes('..'))) differences.push('managedPaths');
  let actual = [];
  try { actual = filesBelow(runtime).filter((rel) => rel !== 'ownership.json' && !rel.startsWith('extensions/')).sort(); }
  catch (error) { differences.push(`runtime:${error.message}`); }
  if (JSON.stringify(actual) !== JSON.stringify(expectedPaths)) differences.push('runtime:paths');
  try { if (packageDigest(runtime, expectedPaths) !== manifest.packageDigest) differences.push('runtime:packageDigest'); }
  catch (error) { differences.push(`runtime:${error.message}`); }
  if (!verifyExtensions(runtime, manifest.extensions)) differences.push('runtime:extensions');
  return { ok: differences.length === 0, state: differences.length ? 'UNKNOWN' : 'trusted', differences,
    manifest: differences.length ? null : manifest, anchor: differences.length ? null : anchor };
}

function shellSegments(command) {
  const out = []; let part = '', quote = null, escaped = false;
  for (let i = 0; i < String(command).length; i++) {
    const c = String(command)[i], n = String(command)[i + 1];
    if (escaped) { part += c; escaped = false; continue; }
    if (c === '\\' && quote !== "'") { part += c; escaped = true; continue; }
    if (quote) { part += c; if (c === quote) quote = null; continue; }
    if (c === "'" || c === '"') { quote = c; part += c; continue; }
    if (c === '#') { while (i < String(command).length && String(command)[i] !== '\n') i++; if (part.trim()) out.push(part.trim()); part = ''; continue; }
    if (c === ';' || c === '\n' || c === '|' || c === '&') {
      if (part.trim()) out.push(part.trim()); part = ''; if ((c === '|' || c === '&') && n === c) i++; continue;
    }
    part += c;
  }
  if (part.trim()) out.push(part.trim()); return out;
}
function tokens(segment) {
  const out = []; let value = '', quote = null, escaped = false;
  for (const c of segment.trim()) {
    if (escaped) { value += c; escaped = false; continue; }
    if (c === '\\' && quote !== "'") { escaped = true; continue; }
    if (quote) { if (c === quote) quote = null; else value += c; continue; }
    if (c === "'" || c === '"') { quote = c; continue; }
    if (/\s/.test(c)) { if (value) { out.push(value); value = ''; } } else value += c;
  }
  if (value) out.push(value); return quote ? [] : out;
}
function classifyPush(command) {
  let changedDirectory = false;
  for (const segment of shellSegments(command)) {
    const argv = tokens(segment); let at = 0;
    if (argv[0] === 'cd') { changedDirectory = true; continue; }
    const assignment = (value) => /^[A-Za-z_][A-Za-z0-9_]*=/.test(value || ''); let unsafeWrapper = false, prefixInexact = false;
    while (assignment(argv[at])) at++;
    while (true) {
      const base = path.basename(argv[at] || '');
      if (base === 'command' || base === 'exec') { at++; if (argv[at] === '--') at++; while (assignment(argv[at])) at++; continue; }
      if (base === 'sudo') { unsafeWrapper = true; at++; continue; }
      if (base === 'env') {
        at++; while (assignment(argv[at])) at++;
        while ((argv[at] || '').startsWith('-')) { const option = argv[at++]; prefixInexact = true; if (/^(?:-u|--unset|-C|--chdir|-S|--split-string)$/.test(option)) at++; while (assignment(argv[at])) at++; }
        if (argv[at] === '--') at++; continue;
      }
      break;
    }
    if (/^(?:sh|bash|zsh|eval)$/.test(path.basename(argv[at] || '')) && /\bgit\b[\s\S]*\bpush\b/i.test(argv.slice(at + 1).join(' '))) {
      return { command: segment, remote: null, refspec: null, exact: false };
    }
    if (!/(?:^|\/)git$/.test(argv[at] || '')) {
      if (/\$\([^)]*\bgit\b[^)]*\bpush\b|`[^`]*\bgit\b[^`]*\bpush\b/i.test(segment)) return { command: segment, remote: null, refspec: null, exact: false };
      continue;
    }
    if (argv[at + 1] !== 'push') {
      if (argv.slice(at + 1).includes('push')) return { command: segment, remote: null, refspec: null, exact: false };
      continue;
    }
    const rest = argv.slice(at + 2), values = rest.filter((x) => !x.startsWith('-'));
    const canonical = /^\+?HEAD:[^\s:]+$/.test(values[1] || '');
    return { command: segment, remote: values[0] || null, refspec: values[1] || null, canonical,
      exact: !unsafeWrapper && !prefixInexact && !changedDirectory && !rest.includes('--no-verify') && values.length === 2 && canonical };
  }
  return null;
}
function input() { try { return JSON.parse(fs.readFileSync(0, 'utf8').replace(/^\uFEFF/, '')) || {}; } catch { return {}; } }
const CURSOR_EVENT_MAP = Object.freeze({
  sessionStart: 'SessionStart',
  beforeSubmitPrompt: 'UserPromptSubmit',
  stop: 'Stop',
  beforeShellExecution: 'PreToolUse',
  preToolUse: 'PreToolUse',
});
function isCursorHostEvent(input) {
  return !!input && Object.hasOwn(CURSOR_EVENT_MAP, input.hook_event_name);
}
function hostName(argv, data) {
  const at = argv.indexOf('--host');
  if (at >= 0 && argv[at + 1] === 'cursor') return 'cursor';
  if (isCursorHostEvent(data)) return 'cursor';
  // Claude Code sends no turn_id; its per-prompt prompt_id identifies the turn instead.
  return !data?.turn_id && typeof data?.prompt_id === 'string' && data.prompt_id ? 'claude' : 'codex';
}
function normalizeClaudeInput(input) {
  return { ...input, turn_id: input.prompt_id, harness_lite_host: 'claude' };
}
function remapCursorWorkspacePath(value) {
  if (typeof value !== 'string' || !value) return value;
  const unix = value.replace(/\\/g, '/');
  // Anchor at the start: only a WSL UNC root or a leading distro segment is unwrapped,
  // never an ordinary directory that happens to contain "Ubuntu".
  const match = unix.match(/^(?:\/\/(?:wsl\.localhost|wsl\$)\/[^/]+|\/[^/]*Ubuntu[^/]*)(\/home\/.*)$/i);
  return match ? match[1] : value;
}
function normalizeCursorInput(input) {
  const raw = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const cursorEvent = raw.hook_event_name;
  const event = CURSOR_EVENT_MAP[cursorEvent] || cursorEvent;
  const cwd = remapCursorWorkspacePath(typeof raw.cwd === 'string' && raw.cwd ? raw.cwd
    : Array.isArray(raw.workspace_roots) && typeof raw.workspace_roots[0] === 'string' ? raw.workspace_roots[0] : undefined);
  const normalized = {
    ...raw,
    hook_event_name: event,
    session_id: raw.session_id || raw.conversation_id || undefined,
    turn_id: raw.turn_id || raw.generation_id || undefined,
    harness_lite_host: 'cursor',
    cursor_event: cursorEvent,
  };
  if (cwd) normalized.cwd = cwd;
  if (event === 'Stop' && typeof raw.stop_hook_active !== 'boolean' && raw.status === 'completed') {
    normalized.stop_hook_active = Number.isInteger(raw.loop_count) && raw.loop_count > 0;
  }
  if (event === 'PreToolUse') {
    const command = typeof raw.command === 'string' ? raw.command
      : typeof raw.tool_input?.command === 'string' ? raw.tool_input.command : undefined;
    normalized.tool_name = cursorEvent === 'beforeShellExecution' || raw.tool_name === 'Shell' || raw.tool_name === 'Bash'
      ? 'Bash' : raw.tool_name;
    if (command !== undefined) normalized.tool_input = { ...(raw.tool_input && typeof raw.tool_input === 'object' ? raw.tool_input : {}), command };
  }
  return normalized;
}
function encodeCursorOutput(output, normalized) {
  if (!output || typeof output !== 'object' || Array.isArray(output)) return {};
  const event = normalized?.hook_event_name, specific = output.hookSpecificOutput || {};
  if (event === 'SessionStart' || event === 'UserPromptSubmit') {
    return specific.additionalContext ? { additional_context: specific.additionalContext } : {};
  }
  if (event === 'PreToolUse') {
    if (!specific.permissionDecision) return {};
    const encoded = { permission: specific.permissionDecision };
    if (specific.permissionDecisionReason) {
      encoded.user_message = specific.permissionDecisionReason;
      encoded.agent_message = specific.permissionDecisionReason;
    }
    return encoded;
  }
  if (event === 'Stop' && output.decision === 'block') {
    return { followup_message: output.reason || 'Harness internal continuation' };
  }
  return {};
}
function writeHookOutput(output, host) {
  if (output && Object.keys(output).length) process.stdout.write(`${JSON.stringify(output)}\n`);
  else if (host === 'cursor') process.stdout.write('{}\n');
}
function identityDegradedOutput(data) {
  if (data.hook_event_name === 'PreToolUse' && data.tool_name === 'Bash' && classifyPush(data.tool_input?.command)) {
    return { hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny',
      permissionDecisionReason: 'Harness push gate：runtime identity 无法确认；push 继续 fail closed，普通工作不受影响。' } };
  }
  if (data.hook_event_name === 'SessionStart' || data.hook_event_name === 'UserPromptSubmit') {
    return { hookSpecificOutput: { hookEventName: data.hook_event_name,
      additionalContext: 'Harness runtime identity UNKNOWN；已停用本事件的 Harness 自动能力且未写状态，宿主普通工作可继续。' } };
  }
  return {};
}
function identityDegraded(data, host) {
  const output = identityDegradedOutput(data);
  writeHookOutput(host === 'cursor' ? encodeCursorOutput(output, data) : output, host);
  return 0;
}
function main(argv = []) {
  if (argv[0] === '--work-intent') {
    const root = projectRoot(process.cwd()), checked = bootstrapVerify(root);
    if (!checked.ok) { process.stdout.write(`${JSON.stringify({ ok: false, reason: 'runtime identity UNKNOWN；work intent 零写 HOLD' })}\n`); return 1; }
    let claim = null; try { claim = JSON.parse(argv[1]); } catch { /* fixed shape checked by intentResult */ }
    const result = require('../lib/hook.js').intentResult(root, claim);
    process.stdout.write(`${JSON.stringify(result)}\n`); return result.ok ? 0 : 1;
  }
  if (argv[0] === '--native-pre-push') {
    const root = projectRoot(process.cwd()), checked = bootstrapVerify(root);
    if (!checked.ok) { console.error('Harness pre-push：runtime identity 无法确认，push fail closed'); return 1; }
    const refs = fs.readFileSync(0, 'utf8'), hook = require('../lib/hook.js');
    const remote = argv[1] || 'origin', url = argv[2] || null, foreignAt = argv.indexOf('--foreign'), foreign = foreignAt >= 0 ? argv[foreignAt + 1] : null;
    const result = hook.nativePrePush(root, remote, url, refs);
    if (!result.ok) { console.error(`Harness pre-push：${result.reason}`); return 1; }
    if (foreign && fs.existsSync(foreign)) return spawnSync(foreign, argv.slice(1, 3), { cwd: process.cwd(), input: refs, stdio: ['pipe', 'inherit', 'inherit'] }).status || 0;
    return 0;
  }
  if (argv[0] === '--push-assert') {
    const root = projectRoot(process.cwd()), checked = bootstrapVerify(root);
    if (!checked.ok) { process.stdout.write(`${JSON.stringify({ ok: false, reason: 'runtime identity UNKNOWN；push assertion 零写 HOLD' })}\n`); return 1; }
    let claim = {}; try { claim = JSON.parse(fs.readFileSync(0, 'utf8')); } catch { /* 固定结构校验在 pushAssert */ }
    const result = require('../lib/hook.js').pushAssert(root, claim); process.stdout.write(`${JSON.stringify(result)}\n`); return result.ok ? 0 : 1;
  }
  const raw = input(), host = hostName(argv, raw), data = host === 'cursor' ? normalizeCursorInput(raw) : host === 'claude' ? normalizeClaudeInput(raw) : raw;
  const root = projectRoot(data.cwd || process.cwd()), checked = bootstrapVerify(root);
  if (!checked.ok) return identityDegraded(data, host);
  const output = require('../lib/hook.js').dispatch(root, data);
  writeHookOutput(host === 'cursor' ? encodeCursorOutput(output, data) : output, host);
  return 0;
}
if (require.main === module) { try { process.exit(main(process.argv.slice(2))); } catch (error) { console.error(error.message); process.exit(1); } }
module.exports = { main, bootstrapVerify, shellSegments, tokens, classifyPush, projectRoot,
  CURSOR_EVENT_MAP, isCursorHostEvent, hostName, remapCursorWorkspacePath, normalizeCursorInput, normalizeClaudeInput, encodeCursorOutput,
  identityDegradedOutput };
