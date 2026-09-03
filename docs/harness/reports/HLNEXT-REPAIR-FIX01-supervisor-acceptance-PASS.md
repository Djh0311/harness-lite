# HLNEXT-REPAIR FIX01 supervisor direct acceptance

日期：2026-08-31（Asia/Shanghai）

结论：`PASS / FIX01 ACCEPTED / FIX03 STILL LOCKED BY FIX02 / CANDIDATE ONLY / NOT PUSHED / NOT RELEASED`

## 主管直接证据

- writer 仅修改 `lib/install.js`、`lib/tree.js`、`lib/capabilities.js`、`lib/hook.js` 与 `test/fix01-guidance-runtime.test.js`；未触碰 FIX02/lifecycle/候选文档写面。
- 生产调用链为安装 runtime `hooks/dispatcher.js → lib/hook.js dispatch() → SessionStart/UserPromptSubmit → hookContext() → tree.workUnitPackage()/capabilities.project()`；两 helper 已不再只有 test caller。
- 主管在临时 Git 新项目执行真实 0.10 install，从安装后的 runtime 调 dispatcher。未注入 synthetic `work_unit_id`、未把 capability manifest 塞进 Hook input：单一 active unit 由真实 delegation ledger 选为 FIX01，manifest 从稳定 `.codex/harness-lite/capabilities.json` 读取。
- 实际 SessionStart 1194 chars、UserPromptSubmit 1250 chars，均保留 goal、direct acceptance、route basis、facts、entry points、disproven route、UNKNOWN、dependencies、result contract、boundaries、known/available model，以及 Activity/Progress/Reported/Accepted/Blocked+Partial/Dependencies/Heartbeat 分类。
- 定向压力测试在 manifest 缺失时验证两个安装 Hook 均明确 `Capabilities state=UNKNOWN / availability=UNKNOWN`，提示指导模型读取当前真实工具定义，缺失仍为 UNKNOWN；总长不超过 1800 chars。
- 实际安装后的 AGENTS.md/CLAUDE.md 均包含：产品实现/修复直接派 writer；讨论/只读分析/计划准备不为形式强制派；Grok 工程/Gemini 前端/Terra-Sol 问题恢复；先用最短直接证据；诊断手段不自动成为最终产品架构。
- 产品代码搜索未发现 Harness 调用 spawn/wait/interrupt/provider；相关词只存在于指导文本。

## 回归

- `node --test test/fix01-guidance-runtime.test.js test/fix02-delegation-record.test.js test/nv04-recovery.test.js`：20/20 PASS。
- `npm test`：90/90 PASS；原 85 项全部保留，新增 5 项通过。
- 首次主管探针用超过单字段预算的长 sentinel 做完整字符串匹配，字段按设计有界截断导致探针断言红；改为短稳定 sentinel 后同一生产入口通过。这是 exploratory test assertion，不是候选直接验收失败，不计有效失败。

FIX01 满足当前直接验收，登记 accepted。FIX03 仍必须等待 FIX02 supervisor accepted。
