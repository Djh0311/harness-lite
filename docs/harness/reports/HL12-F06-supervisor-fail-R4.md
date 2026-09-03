# HL12F06 主管验收：FAIL（R4）

复核对象：F06 R4。主管独立读回显示，R4 尚未达到可接受状态。

## 决定性问题

1. `lib/hook.js` 的 `hookParallelWorkUnitLines()` 仍直接生成
   `ParallelWorkUnitsCarrier：complete=true；inline=false；truncated=false`，没有使用
   `context.complete` 的真实值。正式或未来出现 package list `UNKNOWN/incomplete` 时会再次把
   不完整状态说成完整。
2. 两个 unit 的 `ParallelUnit` 内联路径调用 `work.parallelUnitLine()`，该函数会用 `...`、
   `…+N` 缩短 completionStandards、authorityDesign、facts、dependencies 和 writeScope。只要
   缩短后的整行仍低于 260 字符，R4 就把它当 inline 完整包，实际却丢了字段；这违反多 runnable
   每个 unit 都有完整最小任务包的要求。应检测任何语义字段被缩略并转到真实完整 carrier，或生成不截断的完整行。
3. 需要证明 aggregate carrier digest 与完整 `tree.workUnitPackages()` 投影一致，而不只是摘要
   同样一组手工字段；当前测试仍主要核对字符串格式。
4. 全量仍为 13 failures / 1 skip，旧合同迁移尚未完成；这不能覆盖上述产品问题。

## 必须返修

- 并行 carrier 的 `complete`、`truncated` 必须从底层真实状态传递；所有 UNKNOWN/incomplete
  路径均不得输出 complete=true。
- 只要任何 package 字段有缩略标记，就不能 inline；使用 current-leaf + 可实际调用的
  `tree.workUnitPackages` 完整 carrier，或完整无缩略行。增加包含长设计/事实/标准的两-unit 正式
  Hook 反例，逐项核对所有字段。
- 测试从 ref/readApi 读回每个 unit 的完整 package，按稳定 canonical 投影重算 count/digest，
  核对 id、status、goal、全部 standards、authorityDesign、facts、entryPoints、disprovenRoutes、
  unknowns、routeBasis、dependencies、resultContract、allowed/forbidden、writeScope、readiness、
  dispatchReady、source 和 agent。
- 保持必需载体在 1800 字符内且无普通尾切；最终全量回归需 0 fail（既有合理 skip 可保留）。

状态：F06 R4 不接受，退回同一 owning unit 继续 R5。
