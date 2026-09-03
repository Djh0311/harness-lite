# HLNEXT NV03 R3 — Supervisor Acceptance FAIL

结论：`FAIL / SAME WRITER REPAIR R4 / NV04 NOT STARTED`

候选：`sha256:bb6ea1f3ed3dad04456c1c2718cc6eed7be408ba3260cc3f4ed4ec7cce2a16ee`

已通过：R3 的 48-unit 多类别压力账在短 lifecycle metadata 下保留八类标签、counts/truncated 与 heartbeat due。

直接验收失败：

- 在合法 current leaf 中写入 4000 字符的单行 `来源收据`，委派账只含一个 active unit。SessionStart 与 UserPrompt 均返回恰好 1800 字符，但可见内容被 provenance value 占满；`Delegation/Activity/Progress/Reported/Accepted/Blocked+Partial/Dependencies/Heartbeat` 八类全部缺失。
- `hookContext()` 对最终拼接串做尾部 `slice(0, 1800)`，但 `sourceReceipt` 未有界；即使只截该字段，stage/leaf/health/scope 的组合上界与大 lifecycle 摘要仍可能再次挤掉尾部状态。必须做所有行均被保留的总预算分配，而不是依赖最后截尾。

计数：这是 NV03 R3 完整候选的一次有效失败事件。普通 writer 家族累计 4 次；下一完整候选若仍发生有效语义失败，依冻结规则登记第 5 次，随后该问题下一轮进入 Terra xhigh 完整恢复。

边界：不启动 NV04；原 writer 在原 NV03 写面内完成 R4。
