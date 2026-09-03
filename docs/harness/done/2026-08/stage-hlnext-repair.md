# HLNEXT Repair — Harness Lite 0.10 candidate 定向返修

状态：`PASS / REPAIR ACCEPTED / CANDIDATE ONLY / NOT PUSHED / NOT RELEASED`

目标：在不推倒已通过安装安全、固定 0.9.1 身份、升级/回滚、push gate 和证据链的前提下，接通指导入口、委派记账、joined runtime 与真实 agent workflow，并经独立 FIX05 产品验收。

## 顺序

- [x] FIX00 冻结原 candidate 与八条可重复反例
- [x] FIX01 接通真实指导入口（supervisor accepted）
- [x] FIX02 接通委派与恢复记账（R1 后 supervisor accepted）
- [x] FIX03 R1 唯一指导模型真实 agent replay（supervisor takeover accepted）
- [x] FIX04 上游 R1 PASS 后重验未变 candidate（supervisor re-accepted）
- [x] FIX05 R1 独立产品验收与主管 direct acceptance（accepted）

硬依赖：`FIX00 → (FIX01,FIX02) → FIX03 → FIX04 → FIX05`。FIX01/FIX02 仅在精确写面不重叠时并行；其余串行。

相关权威设计：

- 2026-08-31 用户定向返修指令中的 FIX00-FIX05 目标、直接验收、监督规则和禁止项
- `NEXT-VERSION-DISPATCH-PLAN.md` 的 R01-R18 历史冻结需求；其旧执行状态不再代表当前验收状态

相关现有实现：

- `lib/install.js`、`lib/tree.js`、`lib/capabilities.js`、`lib/hook.js`
- `lib/delegation.js`、`lib/work.js`、`bin/hl.js`、skills/hooks 文档与现有 tests/candidate 安全链

必须保持的架构边界：

- 指导模型直接使用宿主 agent 工具；Harness 只投影和记账，不 spawn/wait/interrupt 或连接 provider。
- 当前模型能力来自本轮真实工具面或显式结构化 manifest；缺失为 `UNKNOWN`，不抓 UI、不猜模型、不维护静态目录。
- `reported_complete` 只启动主管验收；只有 `accepted` 解锁依赖。
- joined runtime/真实 workflow 必须由生产入口与真实安装直证，孤立模块测试不能自证 PASS。

不许动：

- push、tag、release、deploy 或修改/伪造 Git provenance
- provider adapter、daemon、credential store、UI scraping、transcript 依赖或第二套调度器
- 杀死、重启或干扰 Poracode.exe、watchdog、bridge 及相关宿主进程
