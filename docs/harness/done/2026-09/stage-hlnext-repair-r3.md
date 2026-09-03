# HLNEXT Repair R3 — Harness Lite 0.10 candidate 定向返修 archived stage

状态：`PASS / R3 REPAIR ACCEPTED / CANDIDATE ONLY / NOT PUSHED / NOT RELEASED`

目标：修复 Hook-input 动态模型超过四个时不存在真实可读载体，以及 R2 归档后当前索引残留 active/未 PASS 状态；保持 R01-R18、安全安装、升级回滚、push gate、并行 work-unit 与轻量投影架构，并以 candidate-only 形式完成 R3 历史收口。

## 顺序

- [x] R3F00 基线与失败绑定（supervisor accepted）
- [x] R3F01 Hook-input 动态模型完整可读修复（supervisor accepted）
- [x] R3F02 当前索引纠正（supervisor accepted）
- [x] R3F03 唯一 integration owner（supervisor accepted）
- [x] R3F04 全新独立产品验收（independent reviewer PASS；supervisor accepted）
- [x] R3F05 主管终验与收口（supervisor accepted；physical archive complete）

收口证据：独立报告 `docs/harness/reports/HLNEXT-REPAIR-R3F04-independent-product-review.md`、主管 acceptance `docs/harness/reports/HLNEXT-REPAIR-R3F04-supervisor-acceptance-PASS.md`、final closeout `docs/harness/reports/HLNEXT-REPAIR-R3F05-supervisor-closeout-PASS.md`、writer report `docs/harness/reports/HLNEXT-REPAIR-R3F05-writer-report.md`、accepted candidate `sha256:b164bab93900c2cbaa2eb43be5ca144934ad83d2bcae6dad4c0c9b0cfb2e95ea`、final done `docs/harness/done/2026-09/stage-hlnext-repair-r3.md`、`docs/harness/done/2026-09/HLNEXT-REPAIR-R3.md`、`docs/harness/done/2026-09/HLNEXT-REPAIR-R3-delegation.json`。

硬依赖：`R3F00 → (R3F01 || R3F02) → R3F03 → R3F04 → R3F05`。只有 supervisor accepted 解锁下游；writer COMPLETE 只登记 reported_complete。

相关权威设计：

- 2026-09-01 用户 R3 Kickoff 的目标、四个直接反例、完整回归、监督、失败升级和停点规则
- `NEXT-VERSION-DISPATCH-PLAN.md` R01-R18 历史冻结正文

相关现有实现：

- `lib/capabilities.js`、`lib/hook.js`、installed dispatcher 与 capability projection
- `NEXT-VERSION-DISPATCH-PLAN.md` 顶部索引、`docs/harness/plan.md` 与 tree/delegation 生命周期

必须保持的架构边界：

- Harness 只投影、记账；指导模型直接使用当前真实 agent 工具。
- 动态模型来自真实工具面或宿主结构化 manifest；缺失或超限 fail closed。
- 无冲突 work unit 可并行；reported_complete 不解锁，accepted 才解锁。
- active writer 仅使用 `wait_agent(timeout_ms=300000)` 监督。

不许动：

- push、tag、release、deploy 或修改/伪造 Git provenance
- provider adapter、静态模型目录、daemon、credential store、UI scraping、错误文本或 transcript 推断、第二调度器
- 覆盖历史 R1/R2 报告或改写 R01-R18 冻结正文
- 更新 external memory
- 杀死、重启或干扰 Poracode、watchdog、bridge
