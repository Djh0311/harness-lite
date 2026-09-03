# Harness Lite 0.12 upgrade current authority

目标：完成 Harness Lite 0.12 产品开发、测试、candidate、主管验收和独立产品复核；不 push、tag、release、deploy，也不修改用户全局配置。

<!-- REQUIREMENT-BASELINE:BEGIN -->
确认来源：2026-09-02 用户明确要求“你自己开一个子代理来完成开发，子代理完成之后由你验收，如果不通过就返修”。

- 当前用户明确授权启动 0.12，并要求一个实现子代理开发、主代理独立验收、失败后退回同一实现子代理返修。
- 冻结 WHAT、work-unit 图和验收矩阵以 `docs/harness/plans/HL12-UPGRADE-PLAN.md` 为准；Decision-Digest 为 `sha256:8de421b32e79cf2e5b880d26ffe2c44c4bcfc067fc0e8e136086668e1e0803b7`。
- 独立计划复核以 `docs/harness/reports/HL12-independent-plan-review-R1.md` 为准，Verdict=PASS；R0 FAIL 保持历史原字节。
- 0.6–0.8 不在 0.12 migration/uninstall 支持和验收范围；0.9、0.10、0.11 在范围内。
- 0.12 只修复六个已证反例、实现决策引导和三个新增保证，不扩大现有硬风险，不增加用户日常 Harness 命令或普通安全任务的确认。
- retained 0.10/0.11、历史 plans/reports/done 和用户全局 `/home/synadmin/.codex/AGENTS.md` 保持原字节；working copy、candidate、installed runtime 和 release 分开报告。
- 禁止真实全局安装、push、tag、release、deploy；绝不杀死、重启或干扰 Poracode、watchdog、bridge。
<!-- REQUIREMENT-BASELINE:END -->

阶段：

- [ ] `stage-hl12-upgrade` — F00 基线到 F08 独立产品复核；当前 active。

执行方式：

- 唯一实现子代理按依赖逐个完成 HL12F00–HL12F07；每个 unit reported 后由主代理直接读回和验收，accepted 后才进入依赖 unit。
- HL12F08 由未参与实现的独立 reviewer 完成；FAIL 返回最小 owning unit，同一实现子代理返修并重建 candidate。
- 所有真实写入测试只能使用 disposable root 和 synthetic HOME。

边界：

- 不把 plan/leaf/ledger/report 或绿测数量当作产品完成事实。
- 不自动开始 0.13，不自动发布。
