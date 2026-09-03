# HLNEXT NV03 R1 — Supervisor Acceptance FAIL

结论：`FAIL / SAME WRITER REPAIR R2 / NV04 NOT STARTED`

候选：`sha256:9c95f1e372e737d9e4d2269dedf5e8b79b1bcbf9ad763af9cc32fb12e67a00a3`

直接复现：

- 合法顶层 JSON 但 `workUnits.A.dependencies = "B"` 的账被 `read()` 判为 `live`；随后 `summary()` 抛出 `TypeError: (unit.dependencies || []).map is not a function`。坏嵌套形状必须 fail closed 为 stale/UNKNOWN，且不得让 status、hook 或 event 写入崩溃。
- 活动 work unit 已超过 300000ms、没有新文件/verify/semantic progress 时，`stop(..., { write:false })` 返回 `output={}`、`delegation` 缺失、`report=null`；到期 heartbeat 因而没有通过 Stop 投影。heartbeat 仍须只读，不能冒充 progress 或触发 continuation，但必须在 Stop 结果中可见。

已确认 R1 修复了首候选的四项问题：目录 glob 重叠、同一 semantic progress 重复续跑、UserPrompt 缺少完整状态字段、非法时间抑制 heartbeat。上述两项是 R1 的剩余直接验收缺口。

计数：这是 NV03 R1 完整候选的一次有效失败事件；同一候选多条断言只按主因一次计数。普通 writer 家族累计 2 次，未触发恢复升级。

边界：不启动 NV04；原 writer 在原 NV03 写面内完成 R2。
