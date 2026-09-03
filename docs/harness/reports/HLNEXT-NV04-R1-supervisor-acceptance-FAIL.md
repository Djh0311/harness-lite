# HLNEXT NV04 R1 — Supervisor Acceptance FAIL

结论：`FAIL / SAME WRITER REPAIR R2 / NV05 NOT STARTED`

候选：`sha256:9a4e7cc86b9d24e2ab43c0b1eaff1229bdb2a0eca2ae71882eac0ab5032f7fd5`

已通过的独立复现：premature Terra/Sol、ordinary 第六次/换 family、第二次 Terra、Sol 第四次均 HOLD 零写；跨 family 同路线 `drift=true/count=false`；PASS 后同 fingerprint 不复活；orphan trigger stale；mixed summary object 保留 active/blocked。

剩余直接验收失败：

- mixed hook context 的 `Recovery` 行实际为 `tier=mixed/status=mixed/next=.../failures.../blocked=WU`，`fitLine` 截掉了 failureCount 数值和 `active=WU2`。SessionStart/UserPrompt 投影没有保留独立 active recovery 分支，未满足 mixed/per-problem wire 合同。
- 真实 ordinary5→Terra1 生成的 Sol lease，手工把 `lease.effectiveCount` 从 1 改成 2 后，`read()` 仍返回 `live=true`。`terra-effective-semantic-failure` 的 trigger ordinal=1 必须绑定 lease count=1；同类 forged counted/effective/completeRecovery 组合也需 fail closed。

计数：同一完整 R1 候选的两条断言按 claimed-complete acceptance failure 一个主因计；普通 writer 家族在 NV04 累计 2 次有效失败，未触发升级。

载体：snapshot working copy；not pushed；not released。
