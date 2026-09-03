# HL12F06 主管验收：FAIL（R5）

复核对象：F06 R5。主管用正式 `hook.sessionStart()` 做了长字段组合压力复核，仍发现必需载体会被静默切断。

## 决定性问题

在 8 个 active unit、每个 unit 的长 completion standard/authority/fact、长 leaf/stage 元数据的
临时项目中，正式上下文长度虽为 1774（小于 1800），但仍出现：

- `ParallelWorkUnitsCarrier` 行在 `sentinelEnd` 中被切到 `...`，行长正好 620；
- `CompletionCarrier` 行的长 sentinel 被切到 `...`，行长正好 620；
- 两行都声明 `truncated=false`。

根因是 carrier/sentinel 仍按普通 slot 交给 `fitLine()`，只把预算限制在 620，并未保证必需
字段完整。长 sentinel 原文不适合作为 wire；应使用固定长度、可重算的 digest/hash 和条目数，
或真实的二级安全 carrier，而不是把原文截断。

## 必须返修

- 必需 `CompletionCarrier`、`ParallelWorkUnitsCarrier` 不能经过普通 `fitLine` 或最终
  `slice()`；无论输入多长，wire 行必须完整且 <=1800 总预算。
- 把 start/end sentinel 改为有界且可验证的表示（例如完整值的 sha256 + count，或明确的
  `sentinelRef/readApi`），不要输出带 `...` 的 sentinel。`complete`/`truncated` 必须来自真实
  carrier；若完整性无法证明，输出 `complete=false` 或 `UNKNOWN`。
- 增加 8+ unit 长 standards/design/facts 的 formal Hook regression，断言每条必需 carrier
  无 `...`/`…+N`、digest/ref/readApi/count/sentinel 全在场，并从 ref/readApi 重新计算完整
  package digest。
- 保持两-unit 长字段和 UNKNOWN standards 反例；全量回归仍需逐项迁移到 0.12 合同，不能删、
  跳过或放宽测试。最终 `npm test` 必须 0 fail（合理既有 skip 可保留）。

状态：F06 R5 不接受，退回同一 owning unit 继续 R6。
