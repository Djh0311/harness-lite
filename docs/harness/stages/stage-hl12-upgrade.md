# Harness Lite 0.12 Upgrade

目标：把独立计划复核通过的 0.12 决策实现为可复现、可迁移、可独立验收的 candidate，同时保持 Lite 不新增管制。

相关权威设计：

- `docs/harness/plans/HL12-UPGRADE-PLAN.md` 冻结 0.12 WHAT、六个双向反例、三个保证、work-unit 图和最终 DoD。
- `docs/harness/reports/HL12-independent-plan-review-R1.md` 独立证明计划可执行；不证明产品已经实现。
- 2026-09-02 用户启动指令要求一个实现子代理开发、主代理验收、失败返修。

相关现有实现：

- `lib/install.js`、`lib/managed.js`、`hooks/dispatcher.js` 的安装、identity、ownership、rollback 和 uninstall 路径。
- `lib/tree.js`、`lib/work.js`、`lib/delegation.js`、`lib/hook.js` 的 work-unit、依赖、Hook 和状态投影路径。
- `lib/capabilities.js`、`lib/guidance.js`、`skills/**` 的 capability 与 guidance 路径。
- retained 0.10/0.11 artifacts 和自包含 0.9 fixture。

必须保持的架构边界：

- Harness 只硬拦现有破坏性动作和少数已有硬风险；普通安全工作由模型自主继续。
- Harness 只投影和记账，不调 agent，不新增 provider adapter、daemon、timer、静态模型目录、第二事件总线或第二授权系统。
- 用户命令为 0；accepted 不是执行授权；UNKNOWN 不自动扩大成全项目 blocked。
- working copy、candidate、disposable installed runtime、真实安装、push 和 release 分开报告。

不许动：

- `/home/synadmin/.codex/AGENTS.md` 与其他真实全局配置
- retained 0.10/0.11 artifacts 和历史 plans/reports/done
- 0.6–0.8 runtime 获取、合成、恢复或验收
- Poracode、watchdog、bridge 进程
- push、tag、release、deploy
