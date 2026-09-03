# HLNEXT-REPAIR — 唯一 current leaf

阶段：stage-hlnext-repair

状态：`PASS / REPAIR ACCEPTED / CANDIDATE ONLY / NOT PUSHED / NOT RELEASED`

目标：定向修复 0.10 candidate 的 joined runtime 与实际指导模型工作流缺口，保留原安全/升级/回滚/证据链，并在 FIX05 独立 PASS 后才关闭。

来源收据：2026-08-31 用户明确发出 Harness Lite 0.10.0 candidate 定向返修完整开始指令。

产品：Harness Lite 0.10.0 repair candidate

证据：FIX00-FIX04 均为 supervisor accepted。FIX05 R1 独立 reviewer 从 R01-R18 与当前用户决策重建产品矩阵，并用动态 challenge 复核真实新安装、真实 agent workflow、`300000ms` heartbeat、reported/accepted 解锁、failure ledger、安全/升级/回滚/push gate、92/92 tests、selfcheck、13 JS 语法与双 artifact，结论 PASS；主管物理读回后 direct acceptance PASS 并登记 FIX05 accepted。最终 candidate 为 `sha256:ee3a584a949016a1b447f7e7f7257f1fbb3e1d86299730fc06a3192c66ecac60`。项目累计有效失败仍只有 FIX02 的 1，已关闭、无 lease；两个 FIX03 问题为 non-counting 且均已关闭。R0/R1A FAIL 与旧 NV06 均保留历史，不被覆盖。

载体：snapshot working copy；当前目录不是 Git repo；candidate-only / not pushed / not released

直接验收：

- FIX01/FIX02 分别经主管生产入口与读回直证 accepted
- FIX03 在临时新项目完成 joined runtime 与真实 agent workflow
- FIX04 保留原安装/升级/攻击/回滚/证据/push gate 能力并形成确定性新 candidate
- 未参与 FIX01-FIX04 实现的独立 reviewer 从 R01-R18 和当前返修指令重建矩阵并使 FIX05 PASS

允许动：

- `lib/install.js`、`lib/tree.js`、`lib/capabilities.js`、`lib/hook.js`
- `lib/delegation.js`、`lib/work.js`、必要时 `bin/hl.js`
- `skills/root-cause.md`、`skills/split-work.md`、`hooks/README.md`
- 对应 tests、candidate/integration 所需现有产品文件与新增产品文件
- `NEXT-VERSION-DISPATCH-PLAN.md` 当前状态标注及 `docs/harness/**` 新返修报告/生命周期投影

不许动：

- push、tag、release、deploy 或修改/伪造 Git provenance
- provider adapter、daemon、credential store、UI scraping、transcript 依赖、静态模型目录或第二套调度器
- 覆盖或改写 R01-R18 历史原文、旧 NV00-NV06 报告
- 杀死、重启或干扰 Poracode.exe、watchdog、bridge 及相关宿主进程

相关事实：

- 原 candidate digest 为 `sha256:bf33bfdce121e19a22fb7c236918301607f39c635f54dab3fe9814dc70746828`，85/85 与安全/升级/回滚能力仍是保留基线
- 本轮真实模型工具面没有 Grok 或 Gemini；普通工程实现选当前可调用的 `gpt-5.5/xhigh`，Terra/Sol 仅用于有效失败恢复
- FIX01 与 FIX02 的精确写面可拆为互不重叠文件，因此 FIX00 accepted 后允许并行

相关入口：

- 新项目真实安装后的 `AGENTS.md`、`CLAUDE.md`
- `SessionStart`、`UserPromptSubmit` Hook 生产输出
- 指导模型完成真实 agent 操作后使用的受支持内部 delegation record 入口

已否定路线：

- 用孤立 helper/module 测试通过证明 joined runtime 或真实 agent workflow PASS

UNKNOWN：

- external memory 是否由用户另行确认记录；本轮未修改，不构成 candidate acceptance blocker

路线依据：先用临时新项目安装和最短生产入口证据验证接线，再保留既有安全回归；诊断探针不自动成为最终产品架构。

依赖：无

结果合同：writer 只能报告 COMPLETE/PARTIAL/BLOCKED；主管 direct acceptance PASS 才登记 accepted，FIX05 独立 PASS 前 leaf 保持 current。

## Work Unit FIX00 — 冻结返修基线

goal: 重算原 candidate 并重复八条 joined-runtime 反例，不修改产品。

directAcceptance:

- 原 candidate digest 精确等于 `sha256:bf33bfdce121e19a22fb7c236918301607f39c635f54dab3fe9814dc70746828`
- 八条用户指定反例全部在当前候选可重复

allowed:

- 只读源码/文档/状态与临时新项目探针
- `docs/harness/**` 生命周期和主管验收证据

forbidden:

- 产品代码修改

facts:

- 八条反例均已重复

entryPoints:

- candidate builder、新安装 instruction/Hook、生产 caller 搜索、delegation 读回、历史 FAIL/ledger 对照

disprovenRoutes:

- 旧 NV06 PASS 作为当前产品验收

unknowns: 无

routeBasis: 用最短直接反例冻结返修边界。

dependencies: 无

resultContract: FIX00 supervisor direct acceptance PASS 后 accepted。

## Work Unit FIX01 — 接通真实指导入口

goal: 让新安装项目的指导模型从稳定生产入口看到用户已决定规则、当前最小 work-unit package 与 capability projection。

directAcceptance:

- 临时新项目真实安装后的 AGENTS.md/CLAUDE.md 与 SessionStart/UserPromptSubmit 直证全部必需规则和投影
- 1800 字符压力下保留 goal、direct acceptance、route basis、model availability 与关键 lifecycle 分类

allowed:

- `lib/install.js`
- `lib/tree.js`
- `lib/capabilities.js`
- `lib/hook.js`
- `test/fix01-guidance-runtime.test.js`

forbidden:

- FIX02 写面、provider/UI/credential/daemon/静态目录

facts:

- FIX00 accepted；当前 helper 没有 production caller

entryPoints:

- install instruction、SessionStart、UserPromptSubmit

disprovenRoutes:

- 只调用 `workUnitPackage()` 或 `normalizeManifest()` 自证接线

unknowns:

- 最小、稳定的 capability manifest 载入载体

routeBasis: 从安装指令与两个现有 Hook 接通最小投影，不建立新的调度层。

dependencies:

- FIX00

resultContract: COMPLETE/PARTIAL/BLOCKED，附新安装生产入口证据；主管 PASS 才 accepted。

## Work Unit FIX02 — 接通委派与恢复记账

goal: 提供零用户负担、仅供指导模型在真实 agent 操作后调用的受支持内部记录入口，并保持现有单一 delegation 状态系统。

directAcceptance:

- active unit 完整保存/恢复 channel、model、modelFamily、reasoning、依赖、写面、状态、heartbeat/activity/progress
- 支持入口只记账且 effective failure 报告与 ledger 一致；失败恢复次数规则不回退

allowed:

- `lib/delegation.js`
- `lib/work.js`
- 必要时 `bin/hl.js`
- `skills/root-cause.md`
- `skills/split-work.md`
- `hooks/README.md`
- `test/fix02-delegation-record.test.js`

forbidden:

- FIX01 写面、agent/provider 调用、第二套状态系统

facts:

- FIX00 accepted；当前 event API 丢失 agent 身份，历史 FAIL 计数未进 recovery ledger

entryPoints:

- 现有 delegation ledger/record/recovery API 与指导模型内部接口

disprovenRoutes:

- 新建第二套委派账或由 Harness 调 agent

unknowns:

- 最小受支持内部接口形态由 writer 在现有 CLI/API 约束内决定

routeBasis: 收敛现有 delegation 系统并接通 record，不创建调度器。

dependencies:

- FIX00

resultContract: COMPLETE/PARTIAL/BLOCKED，附持久化读回和 recovery 一致性证据；主管 PASS 才 accepted。

## Work Unit FIX03 — Joined runtime 与真实代理工作流

goal: 由唯一 integration owner 合并 FIX01/FIX02，并在临时新项目证明真实指导入口、真实 agent 工具与内部记账端到端接通。

directAcceptance:

- 用户指定的九项 joined workflow 逐项直接通过并新增 joined E2E
- 原 85 项测试全部保留通过

dependencies:

- FIX01
- FIX02

resultContract: integration owner COMPLETE 后由主管执行 joined direct acceptance；PASS 才 accepted。

## Work Unit FIX04 — 集成、候选与文档收口

goal: 保留全部安装/升级/攻击/回滚/host/push/selfcheck/语法能力，形成双构建一致新 candidate，并让派发计划成为历史冻结基线。

directAcceptance:

- 用户 FIX04 全矩阵通过，旧 R01-R18/NV00-NV06 历史正文不覆盖
- 新增返修主管报告和新 candidate digest，memory 动作仅列待单独确认

dependencies:

- FIX03

resultContract: COMPLETE 后主管全矩阵 PASS 才 accepted。

## Work Unit FIX05 — 独立产品验收

goal: 由未参与 FIX01-FIX04 实现的独立 reviewer 从 R01-R18 与当前返修决策重建验收矩阵。

directAcceptance:

- 用户 FIX05 全部独立直接验收通过，包括真实安装、真实 agent workflow、全部安全回归与监督证据

dependencies:

- FIX04

resultContract: 独立 reviewer PASS 且主管核对后才关闭 H LNEXT-REPAIR；否则精确退回对应 FIX。
