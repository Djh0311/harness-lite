# HLNEXT-REPAIR FIX05 R0 supervisor acceptance

日期：2026-08-31（Asia/Shanghai）

结论：`FAIL / RETURN TO FIX03 R1 EVIDENCE REPLAY / FIX04-FIX05 LOCKED / CANDIDATE ONLY / NOT PUSHED / NOT RELEASED`

## 独立结论受理

- 独立 reviewer 明确 COMPLETE 后才开始主管验收；其报告是 `HLNEXT-REPAIR-FIX05-independent-product-review.md`，结论 FAIL，未自签 accepted。
- reviewer 独立通过的部分包括：实际新安装指导与两个 Hook 投影、installed record API 与 recovery 一致性、fresh/managed install、固定 0.9.1 upgrade、tamper/relabel HOLD 零写、fault rollback、host evidence exact join、native push gate、92/92 tests、selfcheck、13 JS 语法和双 artifact 完全一致。
- reviewer 独立重算 candidate 仍为 `sha256:ee3a584a949016a1b447f7e7f7257f1fbb3e1d86299730fc06a3192c66ecac60`；没有发现新的产品回退。

## 必须退回 FIX03 的直接缺口

- FIX05 要求 independent reviewer 在自己的 turn 直接调用真实 agent 工具，派一个 disposable worker，并用 `wait_agent(timeout_ms=300000)` 监督。
- R0 reviewer 没有调用该工具，只复核了先前 FIX03 的 durable ledger/report 并在临时安装项目重放模块记账。这不能代替 reviewer-turn 真实 agent replay，正是本轮已否定的“孤立模块/已有报告代替 joined workflow”路线。
- 因此 item 3 direct acceptance FAIL，精确退回 `FIX03 R1`。R1 只修复实时证据工作流：在明确可调用 collaboration schema 的 turn 由指导模型亲自派发、用 300000ms 等待、把真实 agent 四项身份记入 disposable installed ledger，并证明 reported 不解锁/accepted 才解锁。不修改产品 candidate。

## heartbeat 记账纠错

- 主管实际连续调用了八个 `wait_agent(timeout_ms=300000)` 完整超时窗口，第九次同参数在 COMPLETE 时提前返回；没有 30/60 秒 agent wait/status 忙轮询。
- `hlnext-repair-fix05-heartbeat-1` 实际存储类型为 `type=status / status=active`，是第一个完整五分钟窗口后将 observation 形状写成 status 的记账错误；`...heartbeat-1b` 才是 `type=heartbeat`。两条相距 24.446s 是本地 ledger API 纠错，中间没有第二次 agent wait/status 调用。
- 历史事件不删除、不改写；R1 和新的 FIX05 reviewer 必须按事件 `type` 与实际 tool wait 区分记账纠错和忙轮询。R0 已经 FAIL，本说明不用来反签其 PASS。

## failure 分类与清理

- 本次没有“一个具体 candidate 在同一直接验收下语义失败”；是 reviewer-turn 工具调用/证据 replay 未完成。因此登记为 non-counting `tool`，不消耗 ordinary family 次数，不升级 Terra/Sol。
- reviewer 遗留的唯一 disposable 临时项目 `/tmp/hl-fix05-agentcheck-VFxGd2` 已在验收报告与内容边界读回后精确删除，无法恢复；未删除任何工作区或用户数据。

FIX05 R0 不 accepted，`HLNEXT-REPAIR` 保持 current。FIX03 R1 验收 PASS 前 FIX04/FIX05 锁定；随后必须重验 FIX04 未变 candidate，再由另一名未参与 FIX01-FIX04 实现/返修的独立 reviewer 执行 FIX05 R1。
