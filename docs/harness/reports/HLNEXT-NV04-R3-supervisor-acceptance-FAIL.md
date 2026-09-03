# HLNEXT NV04 R3 — Supervisor Acceptance FAIL

结论：`FAIL / SAME WRITER REPAIR R4 / NV05 NOT STARTED`

候选：`sha256:1976faf384f67a4799d07cf36df1baf01500107ef6731a3f17f955151d1c46cf`

已通过的候选证据：writer 报告 72/72 tests、selfcheck、13 个产品 JS 语法和双 candidate 一致；配置 2/4、独立租约、冲突/非法配置、投影和常见 carrier 篡改已有覆盖。

主管直接验收失败：

- 产品公开并导出合法范围 `SOL_ATTEMPT_LIMIT_MIN=1` 至 `MAX=5`。主管建立 ordinary5→Terra complete recovery，并在 Terra failure 上合法配置 `solAttemptLimit=1`。
- `recordFailure` 返回 `ok=true/status=RECORDED/wrote=true`，摘要中的 Sol lease 也显示 limit 1；紧接着不做任何外部修改调用 `read()`，结果却是 `live=false/state=stale/reason=shape`。
- 根因是 active Sol lease 的通用 shape 条件要求 `lease.effectiveCount < lease.solAttemptLimit`；Terra→Sol 初始 lease 复用了 Terra problem ordinal 1，导致合法 limit 1 被自身校验拒绝。系统不得成功写出自己立即判 stale 的载体。

R4 必须让全部声明合法边界可读且语义正确，至少直接覆盖 limit 1：Terra failure 后为 live active Sol lease；第一条实质不同的 Sol complete recovery failure 精确耗尽并 blocked；之前为 2/3/4、独立租约、conflict、carrier closure、mixed wire 和 NV03 行为不得回退。若选择收窄范围而非支持 1，必须有冻结需求依据并同步所有 API/投影/测试；优先支持问题级一次恢复的自然语义。

计数：本完整 R3 候选按 claimed-complete acceptance failure 一个主因计；普通 writer 家族在 NV04 累计 4 次有效失败。下一完整普通候选若再次 FAIL 将成为第 5 次，其后完整恢复必须升级 Terra xhigh。

载体：snapshot working copy；not pushed；not released。
