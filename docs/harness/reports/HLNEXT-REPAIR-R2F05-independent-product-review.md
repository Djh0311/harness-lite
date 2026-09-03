# HLNEXT-REPAIR-R2F05 independent product review

Date: 2026-09-01 (Asia/Shanghai)

Reviewer: independent product reviewer, gpt-5.6-luna/xhigh. The reviewer did not participate in R2F01-R2F04 implementation. The current root tool surface had no Grok/Gemini reviewer, so Terra/Sol were not used for routine review.

## Verdict and boundary

R2F05 product acceptance is PASS. This is an independent direct product review only; it is not an accepted/closeout/release decision. The supervising root agent owns those later lifecycle decisions.

Only this report was persistently added. No product source, tests, NEXT, delegation, stage, leaf, done marker, release, tag, push, deploy, memory, or host process was changed. All generated projects and ledgers used for probes were disposable under /tmp/hl-r2f05-review-v2iQ5N.

The working directory has no usable Git repository: git rev-parse --verify HEAD returned exit 128 because HEAD is absent. Therefore Git provenance was not used as product evidence.

## R01-R18 reconstruction matrix

The frozen requirements section was extracted from docs/harness/NEXT-VERSION-DISPATCH-PLAN.md from the heading ## 一、冻结的需求基线 to immediately before ## 二、产品边界. UTF-8 bytes: 4772. Independent SHA-256: sha256:1a69fc8dbef7304938b9da1f20af9daf47f6b24b131b6d8861c8c906d66a719.

| Requirement | Direct evidence and result |
|---|---|
| R01 | Candidate/source/install identity and fixed 0.9.1 upgrade were exercised; PASS. |
| R02 | Capability manifest projection, carrier, model completeness, and project-relative read path were exercised; PASS. |
| R03 | SessionStart and UserPromptSubmit installed Hook contexts joined the capability and work-unit projections; PASS. |
| R04 | Two active units with independent identity, goal, direct acceptance, dependencies, and write scopes appeared in both Hook events; PASS. |
| R05 | Reported-complete did not unlock; accepted unlocked; dependent blocked/partial behavior was direct-tested; PASS. |
| R06 | Activity, progress, reported, and accepted remained independent fields; PASS. |
| R07 | Heartbeat was 300000 ms and read-only; PASS. |
| R08 | Effective failure counting, non-counting provider/tool/auth/queue classes, channel/session continuity, and route drift were direct-tested; PASS. |
| R09 | Ordinary fifth failure selected Terra xhigh; PASS. |
| R10 | Terra complete recovery selected Sol xhigh, Sol default limit 3 and configured limit 2 were direct-tested; PASS. |
| R11 | acceptance_pass cleared only the current problem lease; an independent active problem remained active; PASS. |
| R12 | Fresh and managed installs, fixed 0.9.1 upgrade, coherent tamper/relabel/extra-path HOLD, and byte-stable rollback were physically tested; PASS. |
| R13 | Host structured evidence and native pre-push gate behavior were covered by direct nv05 integration tests; PASS. |
| R14 | Candidate builder produced deterministic complete output and independent dual builds compared byte-for-byte; PASS. |
| R15 | Candidate product JS syntax, npm test, selfcheck, and nv05 integration tests passed; PASS. |
| R16 | Hook context remained <=1800 while retaining model, unit, and lifecycle fields; PASS. |
| R17 | No executable provider adapter, static model directory, daemon, credential store, UI scraping, transcript inference/dependency, or agent call was found; PASS. |
| R18 | Real workspace recovery ledger had two inherited effective failures, both accepted, lease count zero; R2F05 R0 was not recorded as a product effective failure; PASS. |

NEXT top-state parse found a historical frozen/not-current status plus the R2 active index and R2F05 not-PASS state. It did not simultaneously claim R2F05 not-started and completed. No contradiction was found.

## Candidate artifact and source-root materialization

Command:

node scripts/build-candidate.js --json --out /tmp/hl-r2f05-review-v2iQ5N/candidate.json

The artifact was independently parsed, not trusted from the builder's printed values. Its kind was harness-lite-source-candidate, version 0.10.0, and Git fields were repo false/head null.

| Artifact property | Independently recomputed result |
|---|---|
| files | 37 |
| product JS files | 13 |
| file digest | sha256:6712ce695518c3181fda608473981373e78c9989d82b284ef187c5374014ed1c |
| product digest | sha256:f0ed420560bcd12aa1cca521cf04d0f8f94292ff063bc00786520e78020045de |
| candidate digest | sha256:285fffb4a7f873d0a9959f7a04eabcc2d57c4f6ad5d28894619463da3083e558 |
| canonical artifact bytes | 978575 |

The expected candidate digest was treated as a check target, not as evidence. Stable-sorted metadata rows, file/contentBase64/mode parsing, decoded bytes, mode, per-file SHA, file count, product count, and all three digests independently matched. All 37 rows decoded and materialized successfully into /tmp/hl-r2f05-review-v2iQ5N/candidate-source. No working-copy source was used for candidate acceptance.

The fresh project was installed from that materialized candidate source with the installed candidate installer:

{status: INSTALLED, kind: fresh, written: 1, differences: []}

Installed verify06 returned ok true, kind current, differences [], managedPaths 19, packageDigest sha256:90c78bf973283dbf6d6a422664e6ba1033ed1d0bf46a47303acf3a6b85730a51, configured true.

Two independently generated candidates were both 978575 bytes and compared with cmp; byteEqual was true.

## Fresh installed manifest and joined Hook evidence

The manifest was written only in the disposable fresh project and contained exactly:

| channel | model | reasoning | family | status |
|---|---|---|---|---|
| Cursor | Grok 4.6 High | high | grok | available |
| GrokBuild | Grok 4.6 High | high | grok | available |
| Antigravity | Gemini 3.7 Flash High | high | gemini | available |

Two active, no-dependency, non-overlapping units were created through the installed delegation API. No artificial selector was passed:

| unit | goal/acceptance | dependencies | write scope | agent identity |
|---|---|---|---|---|
| WU01 | candidate product review / direct acceptance evidence | [] | write/a | Cursor, Grok 4.6 High, grok, high |
| WU02 | independent lifecycle review / direct acceptance evidence | [] | write/b | GrokBuild, Grok 4.6 High, grok, high |

Installed dispatcher calls were made with no work_unit, workUnit, work_unit_id, workUnitId, or harness_lite_work_unit input key.

| Hook event | joined context length | direct joined fields |
|---|---:|---|
| SessionStart | 1526 | ParallelWorkUnits known/complete/active=2/units=2/conflicts=0/acceptedOnlyUnlock=true; two complete ParallelUnit lines; three complete CapabilityModel lines; Delegation, Recovery, Reported, Accepted, Dependencies, Heartbeat |
| UserPromptSubmit | 1582 | Same two full unit projections and same three full capability projections, with lifecycle projections retained |

Each event contained two copies of id, goal, direct acceptance, dependencies, write scope, and agent identity. There was no WorkUnit id=UNKNOWN, leaf-fallback, or hidden second unit. Each CapabilityModel included channel, model, reasoning, family, and status; there was no first-entry-plus-ellipsis truncation.

Boundary probes in the same installed API:

- Name-only Grok was projected as family unclassified.
- Missing manifest projected state UNKNOWN, reason missing, modelCount 0, and incomplete carrier.
- A 24-model manifest retained state known, modelCount 24, complete carrier, and project-relative read path .codex/harness-lite/capabilities.json with maxBytes 65536.
- A 2500-model manifest was 365369 bytes and projected state UNKNOWN, reason manifest-too-large, modelCount 0, incomplete carrier, project-relative source/path and maxBytes 65536.

The resulting Hook contexts remained bounded and explicit: name-only 1625, missing 1301, 24 models 1540, oversize 1445.

## Production caller trace

The joined output was traced through registered production callers, not helper-only tests:

- lib/capabilities.js: withGuidance/carrier at lines 115-151; readManifestFile at 156-164; project at 165-177; exported project at 191. This is the manifest-to-capability production path.
- lib/tree.js: workUnitPackages at lines 296-316, with package construction at 269-294. This is the leaf/tree-to-unit package path.
- lib/work.js: delegationView at 99-103, delegationBriefLines at 104-139, parallelWorkUnitContext at 185-290, and lines at 292-310. This is the package-to-context projection path.
- lib/hook.js: capability and parallel context plus budget at 167-195; SessionStart at 218-221; UserPromptSubmit at 226-244; dispatch at 429-435. This is the registered Hook entry path.
- hooks/dispatcher.js: verification and dispatch at lines 25-37. This is the installed Hook dispatcher path.

The installed dispatcher outputs above therefore demonstrate joined production wiring, not an isolated helper.

## Delegation, lifecycle, conflict, and recovery probes

The installed delegation API was used in disposable state. WU01/write/a and WU02/write/b produced no conflicts. An overlap probe with WUX16 shared/** and WUX17 shared/file produced an explicit conflict with overlap [["shared/**","shared/file"]] and action integration-owner-or-split-or-serial.

Dependency and lifecycle checks:

- WUX09 reported_complete did not make dependent WUX10 runnable; WUX10 remained waiting with blocker status reported_complete and accepted false.
- Accepting WUX09 made WUX10 runnable.
- WUX11 blocked; dependent WUX12 remained waiting/frozen; independent WUX13 remained runnable.
- heartbeatSummary returned intervalMs 300000, readOnly true, mode single-summary. A simulated due time produced a reminder only and did not mutate status/progress.
- WUX15 retained activity (tool-wait), progress (verified-fact with evidence ref), reported-complete, and accepted as separate timestamps/fields. Before acceptance, acceptedAt was null; after acceptance, status became accepted and acceptedAt was populated.

Failure/recovery probe results were run in disposable installed state:

- provider-transport, tool, auth, and quota events with effective false were recorded but counted false.
- Five ordinary effective claimed-complete failures, including a run varying channel and session, counted against the same substantive problem. The fifth selected Terra, model gpt-5.6-terra, reasoning xhigh.
- Repeating the same route/substantive key recorded drift and did not increment effective failure count.
- An ordinary effective failure during the Terra lease was held by the recovery-tier gate.
- Terra complete recovery counted and selected Sol xhigh.
- Three Sol complete recoveries exhausted the default Sol limit of 3 and blocked the problem.
- A configured solAttemptLimit of 2 exhausted exactly after two Sol complete recoveries.
- acceptance_pass cleared the current problem lease only. A separate active problem remained leased until its own acceptance_pass.

The ordinary first problem had 9 effective counted events across ordinary, Terra, and Sol phases, 4 explicit non-counting events, and 1 repeated-route drift event; the disposable report's non-counting total of 5 includes the drift classification. No disposable ledger was copied to the workspace.

## Commands, counts, and physical NV05 evidence

npm test exited 0: tests 105, pass 105, fail 0, cancelled 0, skipped 0, todo 0.

node bin/hl.js selfcheck --run --json exited 0 with ok true. Reported selfcheck rows were implementation 4830, tests 5591, skills 60, report templates 0, internal interfaces 6/6; embedded tests exited 0 with 105/105 pass.

All 13 candidate product JavaScript files passed node --check:

bin/hl.js; hooks/dispatcher.js; lib/authorization.js; lib/capabilities.js; lib/delegation.js; lib/evidence.js; lib/hook.js; lib/install.js; lib/io.js; lib/limits.js; lib/managed.js; lib/tree.js; lib/work.js.

node --test test/nv05-integration.test.js exited 0 with 11/11 pass. The direct physical cases covered:

1. embedded original 0.9.1 fixture fixed identity;
2. fresh project install;
3. managed global install/registry/gateway/project binding;
4. explicit original 0.9.1 upgrade;
5. coherent tamper with self-proof HOLD and byte stability;
6. coherent relabelled current 0.10 not previous 0.9.1;
7. host evidence exact structured events/receipts;
8. fault injection swap/instruction/hook/managed registry rollback;
9. native pre-push local bare remote plus uninstall;
10. complete deterministic candidate builder;
11. forbidden provider/static catalog/credential/daemon scan.

An extra-path probe independently appended runtime extra-path.js to a fresh installed candidate. verify06 returned drift with differences ["extra:extra-path.js"]; explicit upgrade returned HOLD, written 0, the same difference, reason runtime identity 不允许增量混装, and bytesStable true. This is a separate direct check of coherent extra-path HOLD.

The physical evidence therefore covers fresh install, managed install, fixed 0.9.1 upgrade, coherent tamper/relabel/extra-path HOLD with zero write, fault rollback preimage, host structured evidence, and native pre-push gate behavior.

## Raw supervision-tool evidence

The raw JSONL inspected was /home/synadmin/.codex/sessions/2026/08/31/rollout-2026-08-31T01-37-55-01a053bf-d419-7b61-9619-f032017f7966.jsonl. The R2 Kickoff user message was independently located at lines 4538-4539, timestamp 2026-08-31T15:16:42.828Z. JSONL parsing after that boundary selected namespace=collaboration, name=wait_agent function calls and matched outputs by call_id.

The requested R2 main supervision window ended at the first R2F05 R0 reviewer-result/retry boundary (line 5214). It contained exactly the following seven calls, all timeout_ms 300000; there were zero 30000 or 60000 calls:

| call/output lines | call_id | timeout_ms | output fact |
|---|---|---:|---|
| 4770 -> 4771 | call_VHfW... | 300000 | completed false, elapsed 230684 ms |
| 4799 -> 4800 | call_RQp... | 300000 | completed false, elapsed 80856 ms |
| 4886 -> 4887 | call_xoo... | 300000 | timed_out true, elapsed 300006 ms |
| 4897 -> 4898 | call_jYV... | 300000 | completed false, elapsed 247003 ms |
| 5076 -> 5077 | call_hKE... | 300000 | completed false, elapsed 191632 ms |
| 5202 -> 5203 | call_vQ1... | 300000 | timed_out true, elapsed 300006 ms |
| 5213 -> 5214 | call_O4J... | 300000 | completed false, elapsed 83947 ms |

For transparency, the full raw file continues after this requested seven-call main window: lines 5300 -> 5301 contain a later R2F05 retry wait with timeout_ms 300000 and timed_out true, elapsed 300010 ms; line 5310 contains call_3HZY... with timeout_ms 300000 but no matching output before EOF. These two later records are not silently discarded; they are R0-blocker retry activity, not part of the user-specified seven-call main window. The product does not depend on the transcript.

## Security and forbidden-architecture scan

The candidate product JS was scanned and then traced. No executable provider adapter, static model catalog, credential store, UI scraping/browser automation, daemon/timer, transcript reading/inference, or agent/subagent call exists in the product path. SpawnSync uses were limited to local Git, filesystem move, test/selfcheck, and explicit foreign pre-push passthrough. No setInterval was found. Strings mentioning daemon, transcript, interrupt, or takeover are denylist/instruction text, not executable adapters or orchestration.

The design remains guidance/context/ledger based: model identity comes from the project manifest, units come from delegation state, and acceptance state gates dependents. It does not dispatch agents or infer state from a transcript.

Security matrix:

| Forbidden capability | Direct scan/trace result |
|---|---|
| provider adapter or provider dispatch | absent from executable product path |
| static model catalog | absent; models are project manifest data |
| daemon, timer, or background runner | absent; no setInterval and no daemon process |
| credential store | absent |
| UI scraping or browser automation | absent |
| transcript inference or transcript dependency | absent; transcript words are only denylist/instruction text |
| agent/subagent call | absent; spawnSync is limited to local Git/filesystem/test/selfcheck/native hook passthrough |
| selector or hidden work-unit fallback | absent in joined Hook inputs and outputs |

## Workspace recovery ledger and R0 disposition

Direct read-only inspection of docs/harness/delegation.json found schema/kind harness-lite-delegation-ledger, 4 events, 2 counted effective failures, 0 non-counting events, 2 problems, and leaseCount 0. The two inherited problems were:

- capability-manifest-all-models-visible: family openai-engineering, effectiveCount 1, accepted;
- parallel-active-work-unit-min-context: family openai-engineering, effectiveCount 1, accepted.

Both have acceptedAt timestamps and there is no R2F05 R0 entry in recovery events. The current R2F05 reviewer work unit is active with channel collaboration.spawn_agent, model gpt-5.6-luna, family openai-engineering, reasoning xhigh. R2F05 R0 is consequently a reviewer-tool blocker, not a product effective failure and not a workspace-ledger mutation.

## Cleanup and acceptance conclusion

The disposable root /tmp/hl-r2f05-review-v2iQ5N was validated by realpath and exact prefix /tmp/hl-r2f05-review-, then removed with Node fs.rmSync({recursive:true,force:true}). A post-cleanup find found no remaining /tmp/hl-r2f05-review-* directory. No real workspace ledger or host process was touched.

All direct product hard items passed, including candidate identity, independent candidate materialization/install, joined production callers, manifest boundaries, two-unit context, lifecycle/recovery semantics, physical install/rollback/security tests, raw tool-fact verification, context limits, frozen requirements hash, and workspace ledger state.

R2F05 independent reviewer result: PASS
