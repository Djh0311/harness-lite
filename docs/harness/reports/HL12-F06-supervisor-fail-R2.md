# HL12F06 主管验收：FAIL（R2）

复核对象：F06 R2 工作树。结论只依据主管独立读回、正式 Hook 反例和独立 reviewer 报告；不把 writer 自报或定向绿测当成接受。

## 决定性问题

1. `lib/hook.js` 的长 `CompletionCarrier` 外部引用分支硬编码
   `complete=true;truncated=false`。当 current leaf 的完成标准包含 `UNKNOWN` 时，底层
   `guidance.completionCarrier()` 明确是 `complete=false`，但正式 Hook 仍向模型说完整，违反
   UNKNOWN 不冒充 complete、carrier 不得虚假完整。
2. 全量 `npm test` 仍不是干净回归（本轮 171 tests，156 pass，14 fail，1 skip；并行运行时计数
   有轻微波动）。旧 wire/instruction fixture 与 0.12 单一 Decision 合同不一致的部分需要明确迁移，
   但不能用删测试或重新引入旧 fragments 隐藏失败。

## 必须返修

- 外部 `CompletionCarrier` 必须保留底层真实 `complete`、`truncated`，并在长 UNKNOWN standards
  反例中明确 `complete=false`；继续提供 ref/readApi/digest/count/sentinel，禁止普通尾截断。
- 为长且含 UNKNOWN 的正式 Hook 增加回归测试；为 3+ runnable carrier 增加从 ref/readApi 读回、
  核对每个 unit 的 goal、全部 standards、boundaries、count、digest 的测试。不能只检查字符串。
- 逐项处理 full-suite 失败：更新确实属于 0.12 合同的迁移 fixture/断言（尤其当前 instruction 的
  owned-block 修改样本），保留历史测试的产品意图；不得放宽断言、删测试或重新输出废弃
  `Guidance[...]` fragments。最终 `npm test` 需 0 fail（已有合理 scope skip 可保留）。
- 重跑 source、disposable installed dispatcher、official 0.9/0.10/0.11 upgrade/uninstall、六个
  CEX 和三个保证；确认 `hooks/dispatcher.js` SHA 不变，不能真实安装、push、tag、release、deploy，
  不能干扰宿主进程。

状态：F06 R2 不接受，退回同一 owning unit 继续 R3。
