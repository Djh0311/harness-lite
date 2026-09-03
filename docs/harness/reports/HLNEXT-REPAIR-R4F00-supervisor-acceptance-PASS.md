# HLNEXT-REPAIR R4F00 supervisor acceptance — PASS

日期：2026-09-01（Asia/Shanghai）

结论：`PASS / R4F00 ACCEPTED / BASELINE AND COUNTEREXAMPLE FROZEN / NOT PUSHED / NOT RELEASED`。

## Fresh candidate boundary

- 当前项目根连续两次 canonical build 完全一致：`sha256:29e89d7c1751b0fbd27776f0ea854423c0793b1ca147c17fdac6485bdf28f823`，`1052132` bytes，39 files / 13 product JS。
- 当前 fileDigest：`sha256:6731b9d86665e0ebf8d99d295867f21e3dcf0279cd696602d4a0160adabaae3b`；productDigest：`sha256:73f9ac6f54d863a5093144e165c17825ac9ba3560309d4382ecd3e8393ebda3e`。
- R3 声称接受的 pre-closeout digest 为 `sha256:b164bab93900c2cbaa2eb43be5ca144934ad83d2bcae6dad4c0c9b0cfb2e95ea`，与当前直接重建不同，不能由当前源码重建。
- 项目全文件 SHA 扫描没有任何文件等于 b164；项目内也没有 `kind=harness-lite-source-candidate` JSON。`docs/harness/artifacts/` 当前没有 retained candidate。
- b164 与当前快照“只有 NEXT 不同”是用户提供并由相同 39-file/productDigest 与 R3 历史报告支持的已知事实；由于 b164 原始 artifact 已删除，本报告不伪称重新做了 byte diff。

## Frozen inputs

R01-R18 精确区段仍为 4772 bytes，`sha256:1a69fc8dbbef7304938b9da1f20af9daf47f6b24b131b6d8861c8c906d66a719`。

当前 39 个 candidate paths：`LICENSE`、`NEXT-VERSION-DISPATCH-PLAN.md`、`bin/hl.js`、`hooks/README.md`、`hooks/dispatcher.js`、`lib/authorization.js`、`lib/capabilities.js`、`lib/delegation.js`、`lib/evidence.js`、`lib/hook.js`、`lib/install.js`、`lib/io.js`、`lib/limits.js`、`lib/managed.js`、`lib/tree.js`、`lib/work.js`、`package.json`、`scripts/build-candidate.js`、`scripts/timed-test.js`、`skills/root-cause.md`、`skills/split-work.md`、`skills/test-first.md`、`test/candidate-baseline.test.js`、`test/current-contracts.test.js`、`test/fix01-guidance-runtime.test.js`、`test/fix02-delegation-record.test.js`、`test/fix03-joined-runtime.test.js`、`test/fixtures/previous-09-snapshot.js`、`test/nv01-delegation.test.js`、`test/nv02-capabilities.test.js`、`test/nv03-delegation.test.js`、`test/nv03-hook-work.test.js`、`test/nv04-recovery.test.js`、`test/nv05-integration.test.js`、`test/r2-capability-visibility.test.js`、`test/r2-joined-runtime.test.js`、`test/r2-parallel-context.test.js`、`test/r3-capability-carrier.test.js`、`test/r3-joined-runtime.test.js`。

## R3 superseding classification

- immutable R3 ledger event `r3f05-r1-rejected` 明确绑定 `gpt-5.4 / openai-engineering / high`，但 `evidenceRef=null`；R3 archive 不修改。
- R3 archived ledger 当前 SHA-256 仍为 `sha256:4a93aa476f993a16f21ab8bb1f5dc0024d6d4bd0453311b46d78bdd5d0545ef9`，与 R3 归档时主管读回一致。
- R4 stable problem 为 `candidate-closeout-reproducible-artifact-binding`，acceptance gate 同名。b164 未留存且收口后源码重建为 29e89d 是一个根因，只登记一次 `openai-engineering` 有效失败；重复构建、缺失文件和旧 NEXT 不分别计数。
- 对 `r3f05-r1-rejected` 在 R4 ledger 写 superseding same-root route classification：`counted=false`、`drift=true`、带本报告 evidenceRef。它是同一 closeout/governance 混合根因的已否定表现，不是第二次有效失败。
- 总有效失败计数为 1，低于五次；Terra/Sol lease 均不创建。

## Lifecycle and boundary

已建立唯一 `stage-hlnext-repair-r4` / `HLNEXT-REPAIR-R4` 与 R4 live delegation。此前 chain 为 currentCount=0、unfinished=0、stage/leaf=null、live delegation missing；R3 stage/leaf/ledger 已归档且保持只读。

本轮真实 subagent 工具面没有 Grok/Gemini；后续普通工程 work units 使用当前可用普通工程模型并记录依据，不触发 Terra/Sol。

未修改产品、测试、历史 R1/R2/R3 报告或 R3 archived ledger；未 push/tag/release/deploy，未更新 external memory，未干扰 Poracode/watchdog/bridge。
