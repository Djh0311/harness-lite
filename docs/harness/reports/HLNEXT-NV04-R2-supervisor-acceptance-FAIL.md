# HLNEXT NV04 R2 — Supervisor Acceptance FAIL

结论：`FAIL / SAME WRITER REPAIR R3 / NV05 NOT STARTED`

候选：`sha256:b859b61b91aecdd4fdf54d74836e70d3da9a087fbce3fba9793c5d3914bb2432`

已通过的主管直接验收：69/69 tests、selfcheck、13 个产品 JS 语法；premature Terra、ordinary 第六次/换 family、第二次 Terra、Sol 第四次均 HOLD 零写；跨 family 同路线 `drift=true/count=false`；PASS 后同 fingerprint 不复活；mixed recovery 行完整保留 `failureCount=14/active=WU2/blocked=WU`；Terra→Sol count、trigger effective、completeRecovery 和 extra counted carrier 篡改 fail closed。

剩余直接验收失败：

- 冻结需求 R13 要求 Sol 完整恢复机会“默认 3 次、可配置”。当前 `lib/delegation.js` 在 exhausted carrier 校验和运行计数中都直接硬编码 `3`，没有合法配置入口，也没有把问题级 Sol 上限绑定进恢复租约与投影。
- 因而非默认上限（例如 2 或 4）无法建立、持久化、恢复或直接验收；当前实现只满足默认值，不满足 R13 全句。

R3 必须保持 R2 已通过的 tier gate、去重、mixed wire 与 carrier fail-closed 行为，并增加有界问题级 Sol 上限：缺省 3，显式合法配置可改变 exhausted 边界；租约、摘要/报告和 carrier shape 必须一致；非法、漂移或篡改配置 HOLD/STALE 且零写；旧无 failures 账仍可读。

计数：本完整 R2 候选按 claimed-complete acceptance failure 一个主因计；普通 writer 家族在 NV04 累计 3 次有效失败，未触发 Terra 升级。

载体：snapshot working copy；not pushed；not released。
