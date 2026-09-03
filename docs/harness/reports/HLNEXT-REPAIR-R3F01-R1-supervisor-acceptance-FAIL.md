# HLNEXT-REPAIR R3F01 R1 supervisor acceptance

日期：2026-09-01（Asia/Shanghai）

结论：`FAIL / R3F01 NOT ACCEPTED / CURRENT LEAF REMAINS`

## 直接反例

主管从当前 working copy 构建 concrete candidate artifact，再从 artifact `contentBase64/mode` 物化新 source 并 fresh install；不是只调用 helper 或相信 writer tests。

- candidate：`sha256:71f33fdacbc422ef53365ffe0743932d79e1ddd2cfa2c1f91d3722b3a1a0a3f2`
- 38 files / 13 product JS
- SessionStart：additionalContext 1604 chars；carrier 可由 dispatcher 退出后的新 Node 进程读取五个模型，但仍包含 `CapabilityModelsInline：shown=0/5`。
- UserPromptSubmit：additionalContext 1660 chars；carrier 同样可跨进程读取五个模型，但仍包含 `CapabilityModelsInline：shown=0/5`。
- 两个事件均不再使用 `embedded-projection:embedded`，五个模型的 channel/model/reasoning/family/status 在 carrier 中正确；这证明 carrier 路线部分有效，但不能覆盖 Kickoff 明确的“不允许 shown=0/5”。
- `test/r3-capability-carrier.test.js` 当前主动断言 `shown=0/5`，因此 109/109 绿测不能证明 direct acceptance PASS。

## 处置

- R3F01 writer COMPLETE 只保持为 reported result，本轮主管 direct acceptance FAIL，不解锁 R3F03。
- stable problem：`hook-input-dynamic-model-carrier-readable`；acceptance gate：`hook-input-models-readable-after-dispatcher-exit`。
- 当前 concrete candidate 的实质错误路线是“carrier 可读即可继续输出 shown=0/N”；它不同于 R2 的“只有 embedded 且无 carrier”，按 archived writer family `openai-engineering` 登记该 problem 的第二次有效失败。
- 普通 family 计数为 2，未达到 5；不触发 Terra/Sol。
- 返修只需让 Hook 文案表达完整 carrier-backed 可见性且不出现 `shown=0/5`，并把测试改为先击中旧反例、后断言该字符串不存在；保持真实 carrier、1800 字符和其余回归。

未 push/tag/release/deploy，未更新 external memory，未干扰 Poracode/watchdog/bridge。
