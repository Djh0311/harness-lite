#!/usr/bin/env node
'use strict';
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const WORKSPACE = '/home/synadmin/harness-lite-0.9.1';
const CANDIDATE = path.join(WORKSPACE, 'docs/harness/artifacts/harness-lite-0.12.0-dba60a222f87b1e222861ffb851c03542113018668dc0d44814286ba9e6322d2.json');
const results = [];
function record(id, ok, detail) {
  results.push({ id, ok, detail });
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${id}${!ok && detail ? ` :: ${JSON.stringify(detail).slice(0, 700)}` : ''}\n`);
}
const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'hl12-f08-r44-follow-'));
function materialize(dest) {
  const data = JSON.parse(fs.readFileSync(CANDIDATE, 'utf8'));
  fs.mkdirSync(dest, { recursive: true });
  for (const row of data.files) {
    const target = path.join(dest, row.path);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, Buffer.from(row.contentBase64, 'base64'));
    if (row.mode) fs.chmodSync(target, Number.parseInt(row.mode, 8));
  }
  return dest;
}
function envFor(home, tmp) {
  const env = { ...process.env, HOME: home, USERPROFILE: home, TMPDIR: tmp, XDG_CONFIG_HOME: path.join(home, '.config') };
  delete env.CODEX_HOME;
  return env;
}
function writeLeaf(root, units) {
  const harness = path.join(root, 'docs/harness');
  fs.mkdirSync(path.join(harness, 'stages'), { recursive: true });
  fs.mkdirSync(path.join(harness, 'leaves'), { recursive: true });
  fs.writeFileSync(path.join(harness, 'plan.md'), '# F08 independent fixture\n\n目标：独立复核。\n');
  fs.writeFileSync(path.join(harness, 'stages/stage-f08.md'), '# stage-f08\n\n目标：独立复核。\n');
  const unitText = units.map((unit) => [
    `## Work Unit ${unit.id}`, '',
    `goal: ${unit.goal || `${unit.id}-GOAL`}`, '',
    'completionStandards:', '', ...[].concat(unit.completionStandards || `${unit.id}-STANDARD`).map((x) => `- ${x}`), '',
    'allowed:', '', ...[].concat(unit.allowed || `lib/${unit.id}.js`).map((x) => `- ${x}`), '',
    'forbidden:', '', ...[].concat(unit.forbidden || `${unit.id}-FORBIDDEN`).map((x) => `- ${x}`), '',
    'authorityDesign:', '', ...[].concat(unit.authorityDesign || `${unit.id}-DESIGN`).map((x) => `- ${x}`), '',
    'facts:', '', ...[].concat(unit.facts || `${unit.id}-FACT`).map((x) => `- ${x}`), '',
    'entryPoints:', '', ...[].concat(unit.entryPoints || `${unit.id}-ENTRY`).map((x) => `- ${x}`), '',
    'disprovenRoutes:', '', ...[].concat(unit.disprovenRoutes || `${unit.id}-DISPROVEN`).map((x) => `- ${x}`), '',
    'unknowns:', '', ...[].concat(unit.unknowns || `${unit.id}-UNKNOWN`).map((x) => `- ${x}`), '',
    `routeBasis: ${unit.routeBasis || `${unit.id}-ROUTE`}`, '',
    'dependencies:', '', ...(unit.dependencies?.length ? unit.dependencies.map((x) => `- ${x}`) : ['- 无']), '',
    `resultContract: ${unit.resultContract || `${unit.id}-RESULT`}`, '',
  ].join('\n')).join('\n');
  fs.writeFileSync(path.join(harness, 'leaves/LEAF-F08.md'), [
    '# LEAF-F08', '',
    '阶段：stage-f08', '',
    '目标：独立复核任务包。', '',
    'completionStandards:', '',
    '- KEEP-THIS-STANDARD-EXACT', '',
    '- SECOND-STANDARD', '',
    unitText,
  ].join('\n'));
}
function jsonOut(run, label) {
  try { return JSON.parse(String(run.stdout || '').trim()); }
  catch (error) { throw new Error(`${label}: ${error.message} status=${run.status} stderr=${run.stderr} stdout=${String(run.stdout).slice(0, 400)}`); }
}

try {
  const source = materialize(path.join(parent, 'src'));
  const home = path.join(parent, 'home');
  fs.mkdirSync(path.join(home, '.codex'), { recursive: true });

  const project = path.join(parent, 'project');
  fs.mkdirSync(project, { recursive: true });
  const install = spawnSync(process.execPath, [path.join(source, 'bin/hl.js'), 'install', '--target', project, '--source', source, '--write', '--json'], {
    cwd: parent, env: envFor(home, parent), encoding: 'utf8', timeout: 20000,
  });
  const installed = jsonOut(install, 'install');
  record('follow-install', installed.status === 'INSTALLED', installed.status);
  writeLeaf(project, [
    { id: 'UNITA', completionStandards: ['A-STANDARD-MUST-REMAIN'], allowed: ['lib/a.js'] },
    { id: 'UNITB', completionStandards: ['B-STANDARD-MUST-REMAIN'], allowed: ['lib/b.js'] },
    { id: 'UNITC', completionStandards: ['C-STANDARD'], allowed: ['lib/c.js'], dependencies: ['UNITA'] },
  ]);

  const probe = `
    const tree=require(${JSON.stringify(path.join(source, 'lib/tree.js'))});
    const delegation=require(${JSON.stringify(path.join(source, 'lib/delegation.js'))});
    const hook=require(${JSON.stringify(path.join(source, 'lib/hook.js'))});
    const work=require(${JSON.stringify(path.join(source, 'lib/work.js'))});
    const guidance=require(${JSON.stringify(path.join(source, 'lib/guidance.js'))});
    const capabilities=require(${JSON.stringify(path.join(source, 'lib/capabilities.js'))});
    const root=${JSON.stringify(project)};
    const chain=tree.readChain(root);
    const ghost=tree.workUnitPackage(root,'GHOST99');
    const accepted=delegation.recordEvent(root,{id:'ghost-accepted',workUnit:'GHOST99',type:'status',status:'accepted',evidenceRef:'docs/harness/reports/ghost.md'},{write:true});
    const declared=tree.workUnitPackage(root,'UNITA');
    const listed=tree.workUnitPackages(root,['UNITA','UNITB']);
    const out=hook.dispatch(root,{hook_event_name:'SessionStart',cwd:root,session_id:'f08-multi',turn_id:'t1'});
    const ctx=JSON.stringify(out);
    const reported=delegation.recordEvent(root,{id:'a-reported',workUnit:'UNITA',type:'status',status:'reported_complete',evidenceRef:'docs/harness/reports/a.md'},{write:true});
    const view1=work.delegationView(root, tree.readChain(root), {write:false});
    const acc=delegation.recordEvent(root,{id:'a-accepted',workUnit:'UNITA',type:'status',status:'accepted',evidenceRef:'docs/harness/reports/a-pass.md'},{write:true});
    const view2=work.delegationView(root, tree.readChain(root), {write:false});
    const selected=guidance.select(tree.readChain(root), view2, {events:['pre-dispatch','agent-active','agent-reported']});
    const fresh=capabilities.project(root,{
      manifest:{schemaVersion:1,kind:capabilities.KIND,models:[{channel:'cursor',model:'current',reasoning:'high',family:'grok',status:'available'}]},
      writeDynamicCarrier:true, now:'2026-09-03T00:00:00.000Z', eventName:'UserPromptSubmit', sessionId:'s1', turnId:'t1'
    });
    process.stdout.write(JSON.stringify({
      leafType:chain.leaf && chain.leaf.type, leafName:chain.leaf && chain.leaf.name, health:chain.health,
      ghostStatus:ghost.status, ghostReady:ghost.dispatchReady, ghostSelection:ghost.selection,
      acceptedOk:accepted.ok, acceptedWrote:accepted.wrote, acceptedReason:accepted.reason,
      declaredStatus:declared.status, declaredReady:declared.dispatchReady, declaredId:declared.workUnit, declaredStandards:declared.completionStandards,
      listedComplete:listed.complete, listedIds:listed.units.map(u=>u.workUnit), listedMissing:listed.missing, listedStandards:listed.units.map(u=>u.completionStandards),
      hasFallback:/id=UNKNOWN/.test(ctx)||/leaf-fallback/.test(ctx),
      hasA:/UNITA/.test(ctx), hasB:/UNITB/.test(ctx), hasAStd:/A-STANDARD-MUST-REMAIN/.test(ctx), hasBStd:/B-STANDARD-MUST-REMAIN/.test(ctx),
      hasCarrier:/ParallelWorkUnits/.test(ctx),
      ctx:ctx.slice(0,1200),
      reportedOk:reported.ok, afterReported:view1.summary.runnable, acceptedUnitOk:acc.ok, afterAccepted:view2.summary.runnable,
      focus:selected.focus, q:selected.decisionQuestion, n:selected.nextAction, text:selected.text,
      standards:selected.completionCarrier.completionStandards, complete:selected.completionCarrier.complete, truncated:selected.completionCarrier.truncated,
      freshState:fresh.state, freshComplete:fresh.modelsComplete, freshCount:fresh.modelCount, freshReason:fresh.reason||fresh.carrier&&fresh.carrier.incompleteReason
    }));
  `;
  const run = spawnSync(process.execPath, ['-e', probe], { cwd: project, env: envFor(home, parent), encoding: 'utf8', timeout: 20000 });
  const v = jsonOut(run, `follow-probe ${run.stderr}`);
  record('leaf-recognized', v.leafType === 'leaf' && v.health?.ok === true, v.health);
  record('cex03-ghost-unknown-not-ready', v.ghostStatus === 'UNKNOWN' && v.ghostReady === false, v);
  record('cex03-ghost-accepted-hold', v.acceptedOk === false && v.acceptedWrote === false, v);
  record('cex03-declared-unit-ok', v.declaredStatus === 'work-unit' && v.declaredReady === true && v.declaredId === 'UNITA', v);
  record('cex04-multi-packages-complete', v.listedComplete === 'complete' && JSON.stringify(v.listedIds) === JSON.stringify(['UNITA', 'UNITB']) && v.listedMissing.length === 0, v);
  record('cex04-hook-no-leaf-fallback', v.hasFallback === false && v.hasCarrier === true, { hasFallback: v.hasFallback, hasCarrier: v.hasCarrier, ctx: v.ctx });
  record('cex04-hook-keeps-unit-identity', v.hasA && v.hasB && v.hasAStd && v.hasBStd, { hasA: v.hasA, hasB: v.hasB, hasAStd: v.hasAStd, hasBStd: v.hasBStd, ctx: v.ctx });
  record('accepted-only-unlock', v.reportedOk && !v.afterReported.includes('UNITC') && v.acceptedUnitOk && v.afterAccepted.includes('UNITC'), { afterReported: v.afterReported, afterAccepted: v.afterAccepted });
  record('guidance-single-focus', typeof v.focus === 'string' && typeof v.q === 'string' && typeof v.n === 'string' && (String(v.text).match(/当前重点：/g) || []).length === 1, { focus: v.focus, q: v.q, n: v.n, text: v.text });
  record('guidance-standards-not-silently-truncated', v.complete === true && v.truncated === false && Array.isArray(v.standards) && v.standards.includes('KEEP-THIS-STANDARD-EXACT'), v.standards);
  record('cex05-fresh-dynamic-ok', v.freshState === 'known' && v.freshComplete === true && v.freshCount === 1, v);

  const dispatcher = path.join(project, '.claude/harness-lite/hooks/dispatcher.js');
  const disp = spawnSync(process.execPath, [dispatcher], {
    cwd: project, env: envFor(home, parent), encoding: 'utf8', timeout: 20000,
    input: JSON.stringify({ hook_event_name: 'SessionStart', cwd: project, session_id: 'disp-multi', turn_id: 't1' }),
  });
  const dctx = String(disp.stdout || '');
  record('cex04-formal-dispatcher-multi', disp.status === 0 && /UNITA/.test(dctx) && /UNITB/.test(dctx) && !/leaf-fallback/.test(dctx) && /ParallelWorkUnits/.test(dctx), { status: disp.status, out: dctx.slice(0, 800), err: disp.stderr });

  const single = path.join(parent, 'single');
  fs.mkdirSync(single, { recursive: true });
  spawnSync(process.execPath, [path.join(source, 'bin/hl.js'), 'install', '--target', single, '--source', source, '--write', '--json'], {
    cwd: parent, env: envFor(home, parent), encoding: 'utf8', timeout: 20000,
  });
  writeLeaf(single, [{ id: 'ONLY1', completionStandards: ['ONLY-STANDARD'], allowed: ['lib/only.js'] }]);
  const srun = spawnSync(process.execPath, [path.join(single, '.claude/harness-lite/hooks/dispatcher.js')], {
    cwd: single, env: envFor(home, parent), encoding: 'utf8', timeout: 20000,
    input: JSON.stringify({ hook_event_name: 'SessionStart', cwd: single, session_id: 's', turn_id: 't' }),
  });
  const sctx = String(srun.stdout || '');
  record('cex04-single-runnable-ok', srun.status === 0 && /ONLY1/.test(sctx) && /ONLY-STANDARD/.test(sctx) && !/leaf-fallback/.test(sctx), sctx.slice(0, 500));

  const systemRoot = path.join(parent, 'system');
  const managedProject = path.join(parent, 'managed-project');
  fs.mkdirSync(systemRoot);
  fs.mkdirSync(managedProject);
  const git = (args, cwd) => spawnSync('/usr/bin/git', args, { cwd, encoding: 'utf8', env: { PATH: '/usr/bin:/bin' } });
  git(['init', '-q'], managedProject);
  git(['config', 'user.email', 'f08@example.invalid'], managedProject);
  git(['config', 'user.name', 'F08'], managedProject);
  fs.writeFileSync(path.join(managedProject, 'README.md'), '# managed\n');
  git(['add', 'README.md'], managedProject);
  git(['commit', '-q', '-m', 'init'], managedProject);
  const original = Buffer.from('MANAGED-USER\n');
  fs.writeFileSync(path.join(managedProject, 'AGENTS.md'), original);
  const man = spawnSync(process.execPath, ['-e', `
    const managed=require(${JSON.stringify(path.join(source, 'lib/managed.js'))});
    const install=require(${JSON.stringify(path.join(source, 'lib/install.js'))});
    const g=managed.installGlobal(${JSON.stringify(systemRoot)},{write:true,source:${JSON.stringify(source)}});
    const i=install.install(${JSON.stringify(managedProject)},{write:true,source:${JSON.stringify(source)},profile:'managed',globalRoot:${JSON.stringify(systemRoot)}});
    const u=install.uninstall(${JSON.stringify(managedProject)},{write:true,globalRoot:${JSON.stringify(systemRoot)}});
    process.stdout.write(JSON.stringify({global:g.status, installed:i.status, profile:i.manifest&&i.manifest.profile, removed:u.status, reason:i.reason||u.reason}));
  `], { cwd: managedProject, env: envFor(home, parent), encoding: 'utf8', timeout: 30000 });
  const manVal = jsonOut(man, `managed ${man.stderr}`);
  record('managed-install-uninstall', manVal.global === 'INSTALLED' && manVal.installed === 'INSTALLED' && manVal.profile === 'managed' && manVal.removed === 'UNINSTALLED' && fs.readFileSync(path.join(managedProject, 'AGENTS.md')).equals(original), manVal);

  const behavior = JSON.parse(fs.readFileSync(path.join(WORKSPACE, 'docs/harness/artifacts/harness-lite-0.12.0-behavior.json'), 'utf8'));
  const receipts = JSON.parse(fs.readFileSync(path.join(WORKSPACE, 'docs/harness/artifacts/harness-lite-0.12.0-blind-receipts.json'), 'utf8'));
  const sample = (scenario) => behavior.samples.filter((s) => s.version === '0.12' && s.scenario === scenario);
  const ordinary = sample('ordinary-safe-task');
  const reported = sample('reported-not-accepted');
  const hard = sample('real-hard-risk-gate');
  const green = sample('green-tests-missing-result');
  const local = sample('local-failure-scope');
  const unknown = sample('unknown-route');
  const multi = sample('multi-event-single-focus');
  function act(s) { return String(s.response?.action || ''); }
  record('behavior-ordinary-direct-or-dispatch', ordinary.length === 6 && ordinary.every((s) => /编辑|改写|修改|派发|执行|edit|dispatch/i.test(act(s)) && s.response?.asksUser !== true), ordinary.map(act));
  record('behavior-reported-hold-b', reported.length === 6 && reported.every((s) => /HOLD|暂停B|暂停 B|不启动 B|不解锁/i.test(act(s))), reported.map(act));
  record('behavior-hard-ask-user', hard.length === 6 && hard.every((s) => s.response?.asksUser === true && s.response?.complete === false && /ask|push|授权|确认|询问/i.test(act(s))), hard.map((s) => ({ action: act(s), asks: s.response?.asksUser })));
  record('behavior-green-incomplete', green.every((s) => s.response?.complete === false), green.map((s) => s.response?.complete));
  record('behavior-local-not-global', local.every((s) => !/暂停全局|停止整个|global stop/i.test(act(s))), local.map(act));
  record('behavior-unknown-reads-first', unknown.every((s) => /读|打开|查看|package.json|inspect|read/i.test(act(s))), unknown.map(act));
  record('behavior-multi-single-focus-no-global-pause', multi.every((s) => !/暂停全局/.test(act(s))), multi.map(act));

  const receiptBy = new Map(receipts.receipts.map((r) => [r.sampleOrdinal, r]));
  const fail012 = behavior.samples.filter((s, i) => s.version === '0.12' && receiptBy.get(i)?.verdict !== 'PASS');
  record('behavior-0.12-receipts-all-pass', fail012.length === 0, fail012.map((s) => `${s.family}/${s.scenario}/${s.attempt}`));
} catch (error) {
  record('followup-crashed', false, { message: error.message, stack: error.stack });
} finally {
  const failed = results.filter((r) => !r.ok);
  fs.writeFileSync('/tmp/hl12-f08-r44-followup.json', `${JSON.stringify({ parent, results, failed: failed.map((r) => r.id), pass: results.filter((r) => r.ok).length, total: results.length }, null, 2)}\n`);
  process.stdout.write(`SUMMARY ${results.filter((r) => r.ok).length}/${results.length} failed=${JSON.stringify(failed.map((r) => r.id))}\n`);
  process.exit(failed.length ? 1 : 0);
}
