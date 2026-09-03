# HLNEXT NV03 R2 — Supervisor Acceptance FAIL

结论：`FAIL / SAME WRITER REPAIR R3 / NV04 NOT STARTED`

候选：`sha256:7e82d251c422844069051b98d258ac2a42e9833a39f6c35c7cb61dcd1550f556`

已通过的独立复现：

- 11 类 nested malformed ledger 均在 read 边界 `stale(shape)`，status/SessionStart 不崩溃，后续 event 为 `STALE + wrote:false`，原 bytes 不变。
- heartbeat-only Stop 返回 due/delegation/report，不触发 continuation、不产生 semantic progress、委派账 bytes 不变。

剩余直接验收失败：

- 使用完全合法的多分支账（8 个带 activity/progress 的 active、8 reported、8 accepted、8 blocked、8 partial、8 waiting）压力复现。SessionStart 恰为 1800 字符，但已丢失 `Accepted`、`Blocked/Partial`、`Dependencies`、`Heartbeat`；UserPrompt 输出的宿主可见前 1800 字符丢失 `Blocked/Partial`、`Dependencies`、`Heartbeat`。
- 当前逐字段 compact 不是端到端 1800 字符预算；固定五分钟 heartbeat reminder 仍可在合法状态量下被宿主截断，违反 SessionStart/UserPrompt 的关键委派摘要投影要求。

计数：这是 NV03 R2 完整候选的一次有效失败事件；同一压力场景缺失的多个字段按一个主因计数。普通 writer 家族累计 3 次，未触发恢复升级。

边界：不启动 NV04；原 writer 在原 NV03 写面内完成 R3。
