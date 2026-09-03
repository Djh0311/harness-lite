# HLNEXT Repair R2 — Harness Lite 0.10 candidate 定向返修

状态：`PASS / R2 REPAIR ACCEPTED / CANDIDATE ONLY / NOT PUSHED / NOT RELEASED`

目标：保留 R1 已通过的 92/92、安全、安装、升级、回滚、push gate、13 JS 与确定性，只修复完整动态模型投影、并行 active work-unit 最小上下文及历史索引一致性，并经全新独立产品验收。

## 顺序

- [x] R2F00 冻结反例与候选边界（supervisor accepted）
- [x] R2F01 完整动态模型投影合同（supervisor accepted）
- [x] R2F02 并行 work-unit 最小上下文合同（supervisor accepted）
- [x] R2F03 唯一 integration owner 接通真实 Hook（supervisor accepted）
- [x] R2F04 文档、回归与新 candidate（supervisor accepted）
- [x] R2F05 全新独立产品验收（independent reviewer PASS；supervisor accepted）

收口证据：独立报告 `docs/harness/reports/HLNEXT-REPAIR-R2F05-independent-product-review.md`、主管验收 `docs/harness/reports/HLNEXT-REPAIR-R2F05-supervisor-acceptance-PASS.md`、最终 candidate `sha256:285fffb4a7f873d0a9959f7a04eabcc2d57c4f6ad5d28894619463da3083e558`。R2F05 R0 tool-surface blocker 为非产品、非计数事件；R1 reviewer PASS 后主管完成 artifact 物化 joined 终验并 accepted。

硬依赖：`R2F00 → (R2F01,R2F02) → R2F03 → R2F04 → R2F05`。R2F01/R2F02 仅在真实写面不重叠时并行；两者不得修改 `lib/hook.js`，公共 Hook 接线归 R2F03。

相关权威设计：

- 2026-08-31 用户 R2 Kickoff 的两条失败、R2F00-R2F05 直接验收、监督/升级/收口规则
- `NEXT-VERSION-DISPATCH-PLAN.md` R01-R18 历史冻结正文；顶部索引只由 R2F04 修正

相关现有实现：

- `lib/capabilities.js`、`lib/tree.js`、`lib/work.js`、`lib/hook.js`
- installed dispatcher、delegation/recovery ledger、candidate 与 NV05 integration 安全链

必须保持的架构边界：

- Harness 只投影、记账；指导模型直接使用宿主 agent 工具。
- 模型可用性来自当前真实工具面或结构化 manifest；缺失/不完整 fail closed，不抓 UI、不猜模型、不维护静态目录。
- 无冲突 work unit 可并行；writer COMPLETE 只 reported_complete，主管 accepted 才解锁。
- active writer 只用 `wait_agent(timeout_ms=300000)` 监督；普通沉默、长工具和 heartbeat 到期不触发介入。

不许动：

- push、tag、release、deploy 或修改/伪造 Git provenance
- provider adapter、daemon、credential store、UI scraping、transcript 推断、静态模型目录或第二套调度器
- 覆盖历史 FAIL/PASS 或改写冻结 R01-R18 正文
- 更新 external memory
- 杀死、重启或干扰 Poracode.exe、watchdog、bridge 及相关宿主进程
