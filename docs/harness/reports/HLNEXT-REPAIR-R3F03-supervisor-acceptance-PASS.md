# HLNEXT-REPAIR R3F03 supervisor acceptance

日期：2026-09-01（Asia/Shanghai）

结论：`PASS / R3F03 SUPERVISOR ACCEPTED / CANDIDATE ONLY`

writer COMPLETE 已先登记为 `reported_complete`。主管随后审读新增 joined test 的 artifact/materialization/installed caller 路径，并重新执行直接验收与回归；本报告不依赖 writer 自述。

## Candidate

- candidate/artifact digest：`sha256:b164bab93900c2cbaa2eb43be5ca144934ad83d2bcae6dad4c0c9b0cfb2e95ea`
- 39 files / 13 product JS
- fileDigest=`sha256:576f0edafdd2da2e81f06cf0a869f07092d987c5884e6bc8207eecd91b349ef4`
- productDigest=`sha256:73f9ac6f54d863a5093144e165c17825ac9ba3560309d4382ecd3e8393ebda3e`
- artifact bytes=1051440；两次独立构建 byte-for-byte identical
- 与被拒 R2 `sha256:285fffb4...3e558` 不同；provenance=`working-copy-snapshot / git.repo=false / head=null`

## Joined direct acceptance

- `test/r3-joined-runtime.test.js` 从当前 source 生成完整 candidate object，按每个 artifact row 的 `contentBase64`/mode 物化全新 source，重建 candidate 字节相等后再 fresh install；生产入口为 installed `hooks/dispatcher.js` 和 installed `work.parallelWorkUnitContext`。
- 精确五模型在项目另有三模型 manifest 时通过 SessionStart/UserPromptSubmit；无 `shown=0/5`/embedded projection，dispatcher 退出后新进程按 Hook path 读回五模型全部字段。
- 24 模型在两个事件都 complete=true，跨进程读回 24 行；增删模型改变 path/sourceDigest/projectionDigest；超限 UNKNOWN/incomplete。
- 无人工 work-unit selector 的双 active unit Hook 保留两份 goal/directAcceptance/dependencies/writeScope/agent identity；reported_complete 不解锁，accepted 才解锁。
- 三 active unit 的 Hook 返回 `readApi=work.parallelWorkUnitContext`，另一进程调用 installed API 读回全部三项；重叠写面仍显式 conflict。
- missing manifest、1800 字符、activity/progress、300000ms heartbeat、failure/recovery ledger 与禁止架构扫描均通过。
- active 索引只指向真实 R3 stage/leaf；R01-R18 仍为 4772 bytes / `sha256:1a69fc8dbbef7304938b9da1f20af9daf47f6b24b131b6d8861c8c906d66a719`，未预写 final PASS。

## Supervisor rerun

- `node --test test/r3-joined-runtime.test.js`：6/6 PASS。
- `npm test`：115/115 PASS。
- `npm run selfcheck -- --json`：ok=true，内嵌全测 115/115 PASS，6 internal interfaces / 0 user commands。
- `node --test test/nv05-integration.test.js`：11/11 PASS。
- candidate product JavaScript：13/13 `node --check` PASS。
- 双 candidate SHA-256 均为 `b164bab9...e95ea`，逐字节相等，临时 candidate 根已精确删除。

R3F03 direct acceptance PASS，允许解锁全新独立 R3F04 reviewer。未 push/tag/release/deploy，未更新 external memory，未干扰 Poracode/watchdog/bridge。
