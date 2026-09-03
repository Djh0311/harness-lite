# HLNEXT-REPAIR R3F03 writer report

日期：2026-09-01（Asia/Shanghai）

结论：`COMPLETE / WRITER ONLY / NOT SUPERVISOR PASS`

本轮为唯一 integration owner，未采信历史 writer COMPLETE，也未只跑 helper。新增 joined-runtime 专用测试从当前 source 构建 candidate artifact，按 artifact 的 `contentBase64` 和 mode 物化全新 source，再 fresh install 到 disposable project，随后只通过 installed `hooks/dispatcher.js` 和 installed `work.parallelWorkUnitContext` 取证。

## Candidate

- candidateDigest：`sha256:b164bab93900c2cbaa2eb43be5ca144934ad83d2bcae6dad4c0c9b0cfb2e95ea`
- differs from rejected R2：old R2 is `sha256:285fffb4a7f873d0a9959f7a04eabcc2d57c4f6ad5d28894619463da3083e558`
- files：39
- product JS：13
- fileDigest：`sha256:576f0edafdd2da2e81f06cf0a869f07092d987c5884e6bc8207eecd91b349ef4`
- productDigest：`sha256:73f9ac6f54d863a5093144e165c17825ac9ba3560309d4382ecd3e8393ebda3e`
- git provenance：`repo=false/head=null` because local `.git` is not a valid Git repository carrier

## Direct Evidence

- A：fresh installed dispatcher SessionStart/UserPromptSubmit with a project three-model manifest and Hook-input exact five-model manifest. additionalContext had no `shown=0/5` and no `embedded-projection:embedded`; post-dispatcher fresh Node read the carrier path and recovered all fields for:
  - `cursor / Grok 4.6 High / high / grok`
  - `grokbuild / Grok 4.6 High / high / grok`
  - `antigravity / Gemini 3.7 Flash High / high / gemini`
  - `codex / gpt-5.6-terra / xhigh / terra`
  - `codex / gpt-5.6-sol / xhigh / sol`
- B：fresh installed dispatcher SessionStart/UserPromptSubmit both kept 24 Hook-input models `complete=true`; post-exit fresh Node read back 24 rows. Dynamic add/remove changed carrier path, source digest, and projection digest. Oversize Hook input over 64 KiB returned `UNKNOWN`, `complete=false`, `incomplete=hook-input-manifest-too-large`, and no project-relative carrier.
- C：fresh project installed runtime recorded two independent active work units with no manual selector keys. Hook retained both units' goal/directAcceptance/dependencies/writeScope/agent identity plus activity/progress categories; `reported_complete` did not unlock a dependent, and `accepted` did. A three-active-unit case emitted carrier API `work.parallelWorkUnitContext`; another Node process read all three active units through the installed API. Overlapping write scopes produced explicit `integration-owner-or-split-or-serial` conflict.
- Recovery：installed recovery ledger counted five evidence-bound semantic failures into a Terra lease, kept a provider transport fault non-counting, then cleared the lease on acceptance pass.
- D-active：current tree readback is healthy with stage `stage-hlnext-repair-r3`, leaf `HLNEXT-REPAIR-R3`, authority/review current. `NEXT-VERSION-DISPATCH-PLAN.md` R01-R18 slice remains 4772 bytes and `sha256:1a69fc8dbbef7304938b9da1f20af9daf47f6b24b131b6d8861c8c906d66a719`; no R3F05 final PASS report exists.

## Verification

- `node --test test/r3-joined-runtime.test.js`：6/6 PASS.
- `npm test`：115/115 PASS.
- `npm run selfcheck -- --json`：`ok=true`; embedded full test run 115/115 PASS.
- `node --test test/nv05-integration.test.js`：11/11 PASS.
- `node --check` on 13 product JS files：13/13 PASS.
- candidate build twice：byte-identical; summary exactly matched.

## Changes

- Added `test/r3-joined-runtime.test.js`.
- Added this report only.
- No manual edits or patches to `lib/capabilities.js`, `lib/hook.js`, `lib/work.js`, `lib/tree.js`, NEXT, plan, R3 stage/leaf/delegation, frozen R01-R18 body, or historical R1/R2 reports. Current lifecycle delegation may contain host/supervisor heartbeat state; this report does not self-sign acceptance.

No push/tag/release/deploy, no external memory update, and no Poracode/watchdog/bridge interference.
