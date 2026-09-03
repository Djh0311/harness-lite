# H﻿LNEXT-REPAIR R2F03 主管验收 — PASS

状态：`PASS / R2F03 ACCEPTED / R2F04 READY / CANDIDATE REPAIR ONLY / NOT PUSHED / NOT RELEASED`

验收对象：R2F03 unique integration owner 的 `lib/hook.js` 与 `test/r2-joined-runtime.test.js`。writer 的 COMPLETE 先登记为 `reported_complete`；本报告来自主管随后独立执行的 fresh-install joined direct acceptance，不以 writer 报告或 helper/module 单测自签。

## 原始反例重放

- 从当前工作副本安装到 disposable 新项目，installed `verify06=true`。
- 不向 dispatcher 输入任何 `work_unit_id` 变体；真实 installed SessionStart 为 1637 字符，UserPromptSubmit 为 1693 字符，均小于 1800。
- 三模型逐项出现：Cursor / Grok 4.6 High、GrokBuild / Grok 4.6 High、Antigravity / Gemini 3.7 Flash High；每项均有 channel、model、reasoning、显式 family、availability/status。两个 Grok 通道均为 `family=grok`，没有首项加 `…+2`。
- 两个无冲突 active unit 均出现完整 compact package：id、goal、direct acceptance、dependencies、write scope、agent channel/model/family/reasoning。输出不含 `WorkUnit：id=UNKNOWN` 或 `leaf-fallback`。
- 原始 additionalContext、长度与 SHA-256 固化在 `docs/harness/reports/HLNEXT-REPAIR-R2F03-joined-acceptance.json`。

## Joined lifecycle 与边界

- missing manifest 明确 `UNKNOWN/incomplete=missing`，要求读取当前真实工具定义；24 模型 manifest 通过 project-relative JSON 完整载体可读；超过上限时为 `UNKNOWN/incomplete=manifest-too-large`，不伪装完整。
- `reported_complete` 上游时 dependent 仍锁定；主管 `accepted` 后才 ready。
- heartbeat 为 read-only、`intervalMs=300000`；activity 与 verified semantic progress 使用不同时间和字段。
- 临时账制造一个受控有效 direct-acceptance failure 和一个 provider transport fault：报告与 ledger 均为 effective=1，provider 不计数；acceptance pass 后 problem=accepted、lease=0，历史有效计数保留。
- 无冲突两 unit 的 conflicts=0；另加重叠 scope 后 conflicts=1，未靠隐藏 unit 消除冲突。
- installed 产品执行面没有 agent tool 调用、provider adapter、静态模型目录、daemon、credential 写入或 transcript 读取。
- 第一次主管探针的 daemon 静态正则命中了 `lib/install.js` 内的政策说明文本；收窄为执行面扫描后通过。该诊断脚本误报不构成产品候选的有效语义失败，且两次 disposable root 均已精确删除。

## 回归

- R2 joined installed tests：2/2 PASS。
- 完整测试：105/105 PASS。
- selfcheck：PASS；内部接口仍为 6，用户命令仍为 0。
- 当前产品 JavaScript：13/13 `node --check` PASS。
- R2F03 writer 受监督期间实际发生一次完整 `wait_agent(timeout_ms=300000)` 到期，未因此介入；随后第二次同规格 wait 提前收到 COMPLETE。账中 `hlnext-r2f03-heartbeat-1` 保留事实记录。

## 主管结论

R2F03 两个原始 joined runtime 反例均已消失，关键 lifecycle、恢复账、冲突检测和架构边界保持。主管 direct acceptance：`PASS`。本报告落盘后才登记 R2F03 `accepted`；R2F04 此前保持锁定，接受后方可开始。
