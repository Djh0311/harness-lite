# Harness Lite 0.11 Upgrade

目标：把冻结的 0.11 决策实现为可复现、可升级、可独立验收的 candidate。

相关权威设计：

- `docs/harness/plans/HL11-DISPATCH-PLAN.md` 冻结决策、事件矩阵、work-unit 图和验收矩阵。
- `docs/harness/reports/HL11-independent-plan-review-PASS.md` 仅证明计划可执行。

相关现有实现：

- `lib/tree.js`、`lib/hook.js`、`lib/work.js`、`lib/delegation.js`、`lib/install.js`、`lib/managed.js`。
- retained 0.10 candidate 与现有 0.9/0.8/0.7/0.6 upgrade fixtures。

必须保持的架构边界：

- Harness 只投影结构化状态和事件 guidance，不调度 agent，不新增 provider adapter、daemon、timer 或第二事件总线。
- 全局 AGENTS、Poracode 宿主、历史证据、push/release 都在本阶段写面之外。
- working copy、candidate、installed runtime、真实宿主、push 与 release 分开报告。

不许动：

- `/home/synadmin/.codex/AGENTS.md`
- `docs/harness/artifacts/harness-lite-0.10.0-d73f4b4f83e6034e33168995c24ca4514d69bcd70ccc19f8aa255da42d218daa.json`
- `NEXT-VERSION-DISPATCH-PLAN.md`
- 历史 `docs/harness/reports/**` 与 `docs/harness/done/**`
- Poracode、watchdog、bridge 进程
- push、tag、release、deploy
