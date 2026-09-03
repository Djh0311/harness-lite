# HL12F06 主管验收：FAIL（R6）

复核对象：F06 R6。长 sentinel/预算问题已改善，但 aggregate package carrier 仍不能被独立核验。

## 决定性问题

主管在临时项目中调用正式 Hook，解析 `ParallelWorkUnitsCarrier` 的 digest，并用同一项目的
`work.parallelWorkUnitContext().units.map(unit => unit.package)`（即
`tree.workUnitPackages()` 返回的完整 package）重算 SHA-256。结果不一致：

- Hook digest 是 `hook.js` 手工挑选字段的 projection；
- 完整 package 还包含 `schemaVersion`、`kind`、`workUnit`、`stage`、`leaf`、`selection`、
  `boundaries`、完整 `source` 等字段。

因此 `ref=...；readApi=tree.workUnitPackages` 不能证明 wire 中的 digest 确实绑定每个 runnable
unit 的完整最小包。当前测试只检查 digest 长得像 SHA，没有做回读重算。

## 已通过但需保留

- 长 UNKNOWN completion carrier 能显示真实 `complete=false`；
- 8+ unit 长 standards/design/facts 压力下，必需 carrier 行不再出现 `...`；
- aggregate carrier 的 complete/truncated 已不再固定为 true；
- F06 定向测试 7/7 通过，dispatcher SHA 未变。

## 必须返修

- 让 aggregate digest 直接基于 `tree.workUnitPackages(root, ids, chain)` 的完整稳定 canonical
  package projection（或提供唯一共享 helper，Hook 与 readApi 使用完全同一算法），不得再手写
  缩减字段。carrier 中应明确 ids/count、ref、readApi、digest 和有界 sentinel。
- 增加正式测试：从临时项目的 ref/readApi 读回每个 runnable package，按产品定义的 canonical
  方式重算 digest，逐项核对所有包字段；修改任一字段必须导致校验失败。
- 保持预算、UNKNOWN、两/三/八 unit 及异常降级反例；全量回归仍不能以历史冲突为由直接 PASS。

状态：F06 R6 不接受，退回同一 owning unit 继续 R7。
