# HLNEXT-REPAIR-R2 — archived leaf

阶段：stage-hlnext-repair-r2

状态：`PASS / R2 REPAIR ACCEPTED / CANDIDATE ONLY / NOT PUSHED / NOT RELEASED`

目标：在不回退 R1 安全与安装能力的前提下，使全部动态模型和多个无冲突 active work unit 都能通过真实安装 Hook 被指导模型可行动地读取。

来源收据：2026-08-31 用户明确发出 Harness Lite 0.10 R2 定向返修 Kickoff，状态 AUTHORIZED TO EXECUTE / CANDIDATE REPAIR ONLY。

产品：Harness Lite 0.10.0 R2 repair candidate

证据：R2F00-R2F05 均为 supervisor accepted。R2F01/R2F02 两份合同由 R2F03 接入真实安装后的 SessionStart/UserPromptSubmit；R2F04 全矩阵与确定性 candidate PASS；R2F05 全新独立 reviewer 从 artifact 物化 candidate source 后 fresh install、重放三模型/双 active unit、恢复升级链、原始五分钟 wait 与全部安全矩阵并明确 PASS，主管随后独立 artifact joined 终验并 accepted。最终 candidate 为 `sha256:285fffb4a7f873d0a9959f7a04eabcc2d57c4f6ad5d28894619463da3083e558`，37 files / 13 product JS；105/105 tests、selfcheck、NV05 11/11、13/13 JS、R01-R18 hash、双 candidate 全部 PASS。两个 inherited effective failure 各保持 1/status=accepted，lease=0；R2F05 R0 tool blocker 非计数。

载体：snapshot candidate 与 archived lifecycle；当前目录不是 Git repo；candidate-only / not pushed / not released

直接验收：

- 三模型 manifest 在 SessionStart/UserPromptSubmit 中全部可行动地可见或有真实完整读取载体
- 两个无冲突 active unit 在无人工 work_unit_id 时各自最小任务包均可行动地可见
- R1 的 92/92、安全、安装、升级、回滚、push gate、13 JS 与确定性全部保持
- 全新独立 reviewer PASS 后主管再 direct acceptance，才允许关闭 R2 leaf/stage

允许动：

- `lib/capabilities.js`、`lib/tree.js`、`lib/work.js`、`lib/hook.js`
- 对应专用/joined tests 与必需 current runtime identity/candidate 文件
- `NEXT-VERSION-DISPATCH-PLAN.md` 顶部历史索引
- `docs/harness/**` R2 生命周期、delegation 与新报告

不许动：

- push、tag、release、deploy 或修改/伪造 Git provenance
- provider adapter、daemon、credential store、UI scraping、transcript 推断、静态模型目录或第二套调度器
- 覆盖历史 FAIL/PASS 或改写冻结 R01-R18 正文
- 更新 external memory
- 杀死、重启或干扰 Poracode.exe、watchdog、bridge 及相关宿主进程

相关事实：

- 被拒 candidate 为 `sha256:ee3a584a949016a1b447f7e7f7257f1fbb3e1d86299730fc06a3192c66ecac60`，34 candidate files / 13 product JS
- R1 passed baseline 为 92/92、selfcheck、NV05 integration 11/11、13/13 JS、双 candidate、0.9.1 upgrade、tamper/relabel HOLD 零写、rollback、native push gate
- 当前真实 agent 工具面没有 Grok/Gemini；普通工程 writer 使用当前可用 `gpt-5.5/xhigh`，Terra/Sol 仅按问题级有效失败升级

相关入口：

- fresh install 后的 `hooks/dispatcher.js` SessionStart/UserPromptSubmit
- `.codex/harness-lite/capabilities.json` 与 installed capability projection
- leaf work-unit package、installed delegation record API 与 Hook additionalContext

已否定路线：

- 用一个模型加 `…+N` 冒充全部模型可行动地可见
- 多 active unit 时退化为 `WorkUnit id=UNKNOWN / status=leaf-fallback`
- 只用 helper/module test 证明 installed joined runtime PASS

UNKNOWN：

- 无；完整模型与并行 unit 已通过 inline rows/project-relative carrier 在 1800 字符预算内由 candidate artifact fresh install 直接验证

路线依据：先用最短 fresh-install 反例冻结缺口；R2F01/R2F02 分别收敛合同，R2F03 唯一 owner 接通 Hook，不建立第二调度器。

依赖：无

结果合同：writer 只能 COMPLETE/PARTIAL/BLOCKED；主管 direct acceptance PASS 才 accepted，R2F05 独立 PASS 前 leaf 保持 current。

## Work Unit R2F00 — 冻结反例与候选边界

goal: 重算被拒 candidate、复现两个 fresh-install 反例、绑定实际 writer family 和允许/禁止边界，不修改产品。

directAcceptance:

- candidate 精确为 ee3a584a...ecac60，34 files / 13 product JS
- 当前无 active stage/leaf，两个 fresh-install 反例均可重复，核验临时载体清理完成

allowed:

- 只读当前源码、历史 done/reports/ledger 与本轮真实工具定义
- `docs/harness/**` R2 生命周期和主管证据
- 精确 disposable `/tmp/hl-r2f00-*` 探针

forbidden:

- 产品代码修改
- writer 派发（R2F00 accepted 前）

facts:

- stable fingerprints 为 capability-manifest-all-models-visible 与 parallel-active-work-unit-min-context

entryPoints:

- candidate builder、installed dispatcher、capability manifest、delegation ledger、归档 R1 writer identity

disprovenRoutes:

- 只读 helper/module 自证 joined Hook

unknowns:

- fresh-install 反例的完整输出与归档 writer family 绑定

routeBasis: 用真实安装 SessionStart/UserPromptSubmit 的最短反例冻结 R2 边界。

dependencies: 无

resultContract: R2F00 supervisor direct acceptance PASS 后 accepted，才可派 R2F01/R2F02。

## Work Unit R2F01 — 完整动态模型投影合同

goal: 让指导模型实际取得 manifest 中全部模型的 channel/model/reasoning/explicit family/status，不再以首项加省略计数隐藏模型。

directAcceptance:

- fresh install 三模型在 SessionStart/UserPromptSubmit 全部可行动地可见
- name-only Grok 仍 unclassified；过大 manifest 有完整可读路径或 UNKNOWN/incomplete

allowed:

- `lib/capabilities.js`
- `test/r2-capability-visibility.test.js`

forbidden:

- `lib/hook.js`
- provider/UI/credential/daemon/static catalog/transcript 实现

facts:

- 被拒 candidate 在 Hook 只显示排序首项和 …+2

entryPoints:

- capability projection 合同与 installed manifest 读取

disprovenRoutes:

- 首项加省略计数代表完整模型投影

unknowns:

- 不修改 Hook 时最小完整读取载体 HOW

routeBasis: 独立收敛 capability 合同与真实可读取载体，公共 Hook 展示留给 R2F03。

dependencies:

- R2F00

resultContract: writer COMPLETE 后 reported_complete；主管 fresh-install direct acceptance PASS 才 accepted。

## Work Unit R2F02 — 并行 work-unit 最小上下文合同

goal: 多个无冲突 active unit 时提供各自可行动最小包，不退化 UNKNOWN leaf fallback，也不强制串行。

directAcceptance:

- 无人工 work_unit_id 的 fresh install Hook 可取得两个 active unit 的 id/goal/direct acceptance/dependencies/write scope/agent identity
- single active、conflict、accepted-only unlock、branch-local blocked/partial 语义保持

allowed:

- `lib/tree.js`
- `lib/work.js`
- `test/r2-parallel-context.test.js`

forbidden:

- `lib/hook.js`
- 靠隐藏 unit 或全局串行消除并行状态

facts:

- 被拒 candidate 在两个 active unit 时输出 UNKNOWN leaf-fallback

entryPoints:

- tree work-unit packages、delegation view/summary 与 compact parallel contract

disprovenRoutes:

- 多 active unit 退回 leaf fallback

unknowns:

- 不修改 Hook 时最小 parallel package API HOW

routeBasis: 独立形成 parallel context 合同，公共 Hook 接线留给 R2F03。

dependencies:

- R2F00

resultContract: writer COMPLETE 后 reported_complete；主管合同与回归 direct acceptance PASS 才 accepted。

## Work Unit R2F03 — 唯一 integration owner 接通真实 Hook

goal: 将 R2F01/R2F02 accepted 合同接入真实安装 SessionStart/UserPromptSubmit，保持有界上下文和 fail-closed 架构。

directAcceptance:

- 三模型与两个 parallel active unit 两个原始 fresh-install 反例均消失
- missing manifest、accepted-only、heartbeat/activity/progress/recovery/conflict/budget/production caller 全部保持

allowed:

- `lib/hook.js`
- R2F01/R2F02 已确认必要的最小产品调整
- joined-runtime tests 与必需 runtime identity/candidate 文件

forbidden:

- provider/agent 调用、静态目录、第二调度器

facts:

- R2F01/R2F02 必须先 accepted

entryPoints:

- installed dispatcher SessionStart/UserPromptSubmit

disprovenRoutes:

- helper/module 测试代替 installed joined runtime

unknowns:

- 无；主管 fresh-install joined direct acceptance 已确认 SessionStart 1637、UserPromptSubmit 1693，均在 1800 字符内

routeBasis: 唯一 integration owner 只做公共接线与 joined direct evidence。

dependencies:

- R2F01
- R2F02

resultContract: integration owner COMPLETE 后主管重放两个原始反例；PASS 才 accepted。

## Work Unit R2F04 — 文档、回归与新 candidate

goal: 修正历史索引，保持 R01-R18 hash 与全部 R1 基线，形成确定性 R2 candidate。

directAcceptance:

- 全测/selfcheck/13 JS/NV05 integration/双 candidate 和完整安全矩阵 PASS
- NEXT 顶部指向 R2 最终 done/报告路径，不再指向不存在的 current leaf，冻结正文不变

allowed:

- `NEXT-VERSION-DISPATCH-PLAN.md` 顶部索引
- regression/candidate 必需 tests、scripts 与 R2 报告

forbidden:

- 覆盖历史报告或修改冻结 R01-R18 正文

facts:

- R2F03 accepted 后才开始

entryPoints:

- candidate builder、NV05 integration、安全/升级/回滚/push gate

disprovenRoutes:

- 测试数量覆盖原始反例

unknowns:

- 无；candidate digest=`sha256:285fffb4a7f873d0a9959f7a04eabcc2d57c4f6ad5d28894619463da3083e558`

routeBasis: 上游 joined PASS 后串行完成文档和全矩阵。

dependencies:

- R2F03

resultContract: writer COMPLETE 后主管全矩阵 PASS 才 accepted；leaf/stage 仍保持 current。

## Work Unit R2F05 — 全新独立产品验收

goal: 由未参与 R2F01-R2F04 实现的 reviewer 从用户 R2 决策重建并执行产品级验收。

directAcceptance:

- reviewer 自己 fresh install、重放三模型和双 active unit、追踪生产 caller并运行全部安全回归
- reviewer 验证真实五分钟 wait、失败升级链、架构禁止项及未 push/release/干扰宿主

allowed:

- `docs/harness/reports/HLNEXT-REPAIR-R2F05-*.md`
- 精确 disposable 验收目录

forbidden:

- 产品实现修改
- 相信旧 PASS、writer COMPLETE 或 helper-only 证据

facts:

- R2F04 accepted 后才派全新 reviewer

entryPoints:

- 完整 candidate、installed dispatcher、真实 agent wait receipt、security/upgrade/rollback matrix

disprovenRoutes:

- 旧 FIX05 或主管报告代替独立验收

unknowns:

- 无；独立 reviewer result=PASS，主管 direct acceptance=PASS

routeBasis: 全新模型独立重建矩阵；其 PASS 后主管才 direct acceptance。

dependencies:

- R2F04

resultContract: independent PASS 已先 reported_complete；主管 direct acceptance PASS 后已 accepted，并按序归档 R2 leaf/stage/delegation。
