# HLNEXT-REPAIR R2F02 supervisor acceptance

日期：2026-08-31（Asia/Shanghai）

结论：`PASS / R2F02 ACCEPTED / R2F03 READY AFTER BOTH ACCEPTED / CANDIDATE REPAIR ONLY / NOT PUSHED / NOT RELEASED`

## 写面与实现合同

- writer `/root/hlnext_r2f02_writer` 使用当前可用普通工程模型 `gpt-5.5/xhigh`；当前工具面无 Grok/Gemini，未占用 Terra/Sol。
- 实际 recent-write 边界只有 `lib/tree.js`、`lib/work.js` 与 `test/r2-parallel-context.test.js`；与 R2F01 无重叠，`lib/hook.js` 未改。
- `tree.workUnitId()` 精确支持用户指定 `R\d+F\d+` ID；当前 leaf 可解析 R2F00-R2F05。`workUnitPackages()` 提供 complete/missing/units 全量合同，单 unit 原行为保持。
- `work.parallelWorkUnitContext()` 对所有 active unit 返回 id/status/goal/direct acceptance/dependencies/writeScope/boundaries/channel/model/modelFamily/reasoning/agent status；`parallelWorkUnitLines()` 在大状态下明确 carrier/readApi，不用首项加省略冒充完整。
- accepted-only unlock、branch-local blocked/partial、single active 与 overlapping write-scope conflict 均保持；未靠隐藏 unit 或固定全局串行消除冲突。
- 未引入 provider/agent 调用、第二调度器、静态目录或 transcript 依赖。

## 主管 fresh-install 直接证据

durable receipt：`docs/harness/reports/HLNEXT-REPAIR-R2F01-R2F02-contract-acceptance.json`，SHA-256 `sha256:e1c26f37fc4f0a6f017b3aeb40094ab17d41713bcdbcfbb0d6a6d7863e0b4fac`。

- 当前 source 真实安装为 INSTALLED，verify06=true；installed tree 精确解析 R2F00-R2F05。
- installed work API 在无人工 work_unit_id 时返回 R2F01/R2F02 两个 active unit，status=complete、complete=complete、conflicts=[]。
- 两个 unit 各自 goal、direct acceptance、dependencies、write scope 和实际 agent channel/model/modelFamily/reasoning 全部可读，没有 UNKNOWN package 或首项省略。
- 同一 installed ledger 直证：两个 reported_complete 时 R2F03 ready=false；只接受 R2F01 仍 false；R2F01/R2F02 都 accepted 后才 true。
- installed Hook 此时仍 `WorkUnit id=UNKNOWN / status=leaf-fallback`，证明公共生产接线仍归 R2F03，R2F02 没有自签 joined PASS。

## 回归

- R2 parallel 专用测试 7/7 PASS，覆盖 R2 ID、双 active、single active、conflict、accepted-only、branch-local blocked/partial、installed API。
- R2F01/R2F02 新合同合计 11/11 PASS；相关 tree/work/delegation/hook tests 49/49 PASS。
- `npm test` 103/103 PASS；`node --check lib/tree.js`、`node --check lib/work.js` PASS。
- R01-R18 冻结 hash仍为 `sha256:1a69fc8dbbef7304938b9da1f20af9daf47f6b24b131b6d8861c8c906d66a719`。
- disposable contract root 已精确删除，不可恢复；无 R2 temp residue。

稳定问题 `parallel-active-work-unit-min-context` 的继承有效失败保持 1，没有新增失败。主管 direct acceptance PASS；本报告落盘后登记对应 acceptance_pass 并将 R2F02 accepted。只有两者均 accepted 后，R2F03 才 ready。
