# HL12F06 主管验收：FAIL（R3）

复核对象：F06 R3。结论来自主管独立压力 probe 和源码读回；R3 writer 报告、定向绿测和旧历史 PASS 均不替代验收。

## 决定性问题

1. 在 8 个 active unit、长 stage/leaf/ledger metadata 和 mixed recovery 同时存在时，正式
   `hook.sessionStart()` 的 `additionalContext` 仍会出现：
   - `ParallelWorkUnits：...`（header 被切断）；
   - `ParallelWorkUnitsCarrier：complet...`（carrier 被切断）；
   - `CompletionCarrier：...sentinel=...`（carrier 尾部被切断）。
   这些行仍标注 `truncated=false`，违反用户目标/完成标准和 carrier 不得静默截断的合同。当前
   `contextWithinBudget()` 在最低预算仍超限时直接 `text.slice(0, limit)`，是可复现的根因。
2. `hookParallelWorkUnitLines()` 的整体 carrier digest 只摘要自选的部分字段，未绑定
   `tree.workUnitPackages()` 返回的完整最小包（例如 boundaries/allowed/forbidden、entryPoints、
   unknowns、routeBasis、readiness、source 等）。仅有 ref/readApi/count/sentinel 字符串和部分
   digest 不能证明每个 runnable package 的完整性。
3. 并行 carrier 仍固定输出 `complete=true`，没有随 `parallelContext.packageList.complete` 的
   `UNKNOWN/incomplete` 真实状态传递，存在再次误报完整的路径。
4. 全量 suite 仍有 13 failures / 1 skip；旧 wire 合同冲突不能掩盖上述真实预算 bug。

## 必须返修

- 预算器必须保证所有必需决策/载体行在 1800 内完整可读；若放不下，先把它们变成明确的
  `inline=false` 外部 carrier（真实 ref/readApi/digest/count/sentinel），绝不能对必需行做普通
  `...` 或最终 `slice()`。`truncated` 必须反映真实状态；UNKNOWN/incomplete 不能变 complete。
- 并行 carrier 的 digest 以稳定 canonical 的完整 `tree.workUnitPackages()` 投影为输入，或提供
  可实际调用的读取接口来重算并核对；测试要从 ref/readApi 读回所有 runnable unit，逐项验证 id、
  goal、全部 standards、authorityDesign/facts、boundaries、dependencies、writeScope、resultContract、
  readiness 和 digest。
- 增加长 metadata + mixed recovery + 长 UNKNOWN completion 的正式 Hook 反例，确认每一条必需
  carrier 行无尾切且上下文 <=1800。
- 继续逐项处理 full-suite 失败；不得删/跳过/放宽测试，也不得恢复废弃 `Guidance[...]` 或
  `remaining=N` 伪包。最终 `npm test` 需 0 fail（既有合理 skip 可保留）。

状态：F06 R3 不接受，退回同一 owning unit 继续 R4。
