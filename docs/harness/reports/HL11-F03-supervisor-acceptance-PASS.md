# HL11F03 supervisor acceptance PASS

结论：PASS

- SessionStart/UserPromptSubmit/status 从 current leaf 与 delegation/recovery 状态选择相关 guidance；显式 `status --intent` 不持久化状态且拒绝未知值。
- capability 只在 pre-dispatch/recovery，heartbeat 只在 active，acceptance 只在 reported/closeout，Terra/Sol 只在 recovery；无关内容物理缺席。
- 多 active unit、5/24/dynamic capability、300000ms heartbeat、reported 不解锁、activity/progress 分离、失败去重及 Terra/Sol 全部 joined 回归通过。
- 新 accepted 必须同时有 `evidenceRef` 和已知完成标准；两类反例均 HOLD、零写。
- 1800-character 压力场景按字段优先级收缩，recovery tier/count/next/active/blocked/limit 保留。

证据：`test/fix03-joined-runtime.test.js`、`test/r2-joined-runtime.test.js`、`test/r3-joined-runtime.test.js`、`test/nv03-hook-work.test.js`、`test/nv04-recovery.test.js`、`test/hl11-event-upgrade.test.js`。
