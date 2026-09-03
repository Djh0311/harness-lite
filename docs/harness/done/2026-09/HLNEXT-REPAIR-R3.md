# HLNEXT-REPAIR-R3 — archived leaf

阶段：stage-hlnext-repair-r3

状态：`PASS / R3 REPAIR ACCEPTED / CANDIDATE ONLY / NOT PUSHED / NOT RELEASED`

目标：从被拒 R2 candidate 出发，只修复 Hook-input 多模型真实载体和归档后当前索引一致性，经独立 reviewer 与主管终验形成固定的 R3 candidate-only 历史收口结果。

来源收据：2026-09-01 用户明确发出 Harness Lite 0.10 R3 定向返修 Kickoff，授权 R3F00-R3F05 连续推进；本文件是归档后的最终 leaf 文本，生效条件由 `docs/harness/reports/HLNEXT-REPAIR-R3F05-supervisor-closeout-PASS.md` 的主管 ledger accepted 约束。

产品：Harness Lite 0.10.0 R3 repair candidate

证据：R3F00-R3F05 已 supervisor accepted；R3F04 独立 reviewer PASS 见 `docs/harness/reports/HLNEXT-REPAIR-R3F04-independent-product-review.md`，主管 acceptance 见 `docs/harness/reports/HLNEXT-REPAIR-R3F04-supervisor-acceptance-PASS.md`，R3F05 final closeout 见 `docs/harness/reports/HLNEXT-REPAIR-R3F05-supervisor-closeout-PASS.md`。accepted candidate 固定为 `sha256:b164bab93900c2cbaa2eb43be5ca144934ad83d2bcae6dad4c0c9b0cfb2e95ea`，39 files / 13 product JS，fileDigest `sha256:576f0edafdd2da2e81f06cf0a869f07092d987c5884e6bc8207eecd91b349ef4`，productDigest `sha256:73f9ac6f54d863a5093144e165c17825ac9ba3560309d4382ecd3e8393ebda3e`，artifact bytes `1051440`。closeout 生效时，主管已完成 archive readback：`tree.readChain().currentCount=0`、`unfinished=0`、`stage=null`、`leaf=null`、live delegation missing/UNKNOWN，且 archive delegation ledger 中 R3F00-R3F05 全部 accepted、recovery leases=0。

载体：accepted candidate artifact `sha256:b164bab93900c2cbaa2eb43be5ca144934ad83d2bcae6dad4c0c9b0cfb2e95ea` + archived lifecycle；旧 R2 candidate `sha256:285fffb4a7f873d0a9959f7a04eabcc2d57c4f6ad5d28894619463da3083e558` 仅为被拒返修基线。最终 archive 路径为 `docs/harness/done/2026-09/HLNEXT-REPAIR-R3.md`。

直接验收：

- accepted candidate `sha256:b164bab93900c2cbaa2eb43be5ca144934ad83d2bcae6dad4c0c9b0cfb2e95ea` 对应的五模型与至少 24 模型 Hook-input 在 dispatcher 退出后仍能由新进程完整读取，或超限准确 incomplete/UNKNOWN
- 并行任务、accepted-only unlock、安全安装升级回滚与 push gate 全部保持
- 主管 pre-closeout direct rerun 已确认 `npm test` 115/115、`selfcheck` PASS、NV05 11/11、joined 6/6、13/13 product JS syntax、双 candidate byte-identical，以及 NEXT/plan 收口索引改写
- closeout 生效时，archive readback 已完成：final done 路径存在，`tree.readChain().currentCount=0`、`unfinished=0`、`stage=null`、`leaf=null`，live delegation missing/UNKNOWN，archive delegation ledger 中 R3F00-R3F05 accepted / leases=0

允许动：

- `lib/capabilities.js`、`lib/hook.js` 与必要专用/joined tests
- `NEXT-VERSION-DISPATCH-PLAN.md` 顶部索引、`docs/harness/plan.md`
- `docs/harness/**` R3 生命周期、delegation 与专用报告

不许动：

- push、tag、release、deploy 或修改/伪造 Git provenance
- provider adapter、静态模型目录、daemon、credential store、UI scraping、错误文本或 transcript 推断、第二调度器
- 覆盖历史 R1/R2 报告或改写 R01-R18 冻结正文
- 更新 external memory
- 杀死、重启或干扰 Poracode、watchdog、bridge

相关事实：

- 被拒 R2 candidate 为 `sha256:285fffb4a7f873d0a9959f7a04eabcc2d57c4f6ad5d28894619463da3083e558`，37 files / 13 product JS
- accepted R3 candidate 为 `sha256:b164bab93900c2cbaa2eb43be5ca144934ad83d2bcae6dad4c0c9b0cfb2e95ea`，39 files / 13 product JS；两次构建 byte-identical，且不同于被拒 R2 digest
- R01-R18 精确区段保持 `4772` bytes，digest `sha256:1a69fc8dbbef7304938b9da1f20af9daf47f6b24b131b6d8861c8c906d66a719`
- 本轮真实 agent 工具面无 Grok/Gemini；普通工程 writer 使用当前可用普通工程模型，Terra/Sol 仅按问题级有效失败升级

相关入口：

- fresh install 后 `hooks/dispatcher.js` 的 SessionStart/UserPromptSubmit
- `lib/capabilities.js` capability carrier 与 `lib/hook.js` additionalContext
- NEXT 顶部历史索引、`docs/harness/plan.md` 与 tree/delegation

已否定路线：

- 用进程内 embedded projection 冒充 dispatcher 退出后可读 carrier
- 用 `shown=0/N` 且无载体冒充完整动态模型可见
- 用历史索引或旧 PASS 报告替代当前 lifecycle readback
- 只用 helper/module tests 证明 fresh-install joined runtime

终态备注：

- 无

路线依据：accepted candidate 与主管 direct rerun 已固定产品事实；R3F05 只做 docs-only closeout，保持 accepted candidate 身份不变，并把归档后的 authority 固定到 done 路径与 closeout reports。

依赖：无

结果合同：本 writer 只能 COMPLETE；本 leaf 的终态以 `docs/harness/reports/HLNEXT-REPAIR-R3F05-supervisor-closeout-PASS.md` 生效后的 archive readback 为准。

## Work Unit R3F00 — 基线与失败绑定

goal: 锁定旧 candidate、冻结正文、两个反例、准确 writer family 和 R3 ledger，不修改产品。

directAcceptance:

- 旧 candidate 精确为 285fffb4...3e558，37 files / 13 product JS
- R01-R18 digest 精确为 1a69fc8d...6a719
- 两个反例可从旧 artifact fresh install 重放，当前此前无 active lifecycle，临时根可精确清理

allowed:

- 只读源码、历史 archives/reports/ledger 和真实工具定义
- `docs/harness/**` R3 生命周期、delegation 与 R3F00 主管证据
- 精确 disposable `/tmp/hl-r3f00-*`

forbidden:

- 产品实现修改
- R3F00 accepted 前派发实现 writer

facts:

- problem fingerprints 为 hook-input-dynamic-model-carrier-readable 与 archived-current-index-consistency

entryPoints:

- candidate builder、artifact materialization、installed dispatcher、archived R2 ledger、tree.readChain

disprovenRoutes:

- helper/module 自证 joined Hook；同一反例重复计数

notes:

- 无

routeBasis: 以最短 artifact fresh-install 反例冻结 R3 边界。

dependencies: 无

resultContract: R3F00 supervisor direct acceptance PASS 后 accepted，才可派 R3F01/R3F02。

## Work Unit R3F01 — Hook-input 动态模型完整可读修复

goal: 使有效 Hook-input manifest 的全部模型在 dispatcher 退出后仍可真实读取，超限准确 fail closed。

directAcceptance:

- 五模型 SessionStart/UserPromptSubmit 全字段可读，Terra/Sol 不被项目三模型 manifest 隐藏
- 至少 24 模型 complete=true 时由新进程通过真实 carrier 完整读取；动态增删无需目录维护
- 超出明确上限返回 incomplete/UNKNOWN 与准确原因

allowed:

- `lib/capabilities.js`
- `lib/hook.js`
- 必要专用 capability tests

forbidden:

- provider/UI/credential/daemon/static catalog/transcript 实现
- 从模型名猜 family、availability 或 suitability

facts:

- R2 hook-input carrier 当前只在同一 Node 进程内存在，Hook 输出无真实路径

entryPoints:

- capabilities.project、hook capabilityLines、installed dispatcher

disprovenRoutes:

- `embedded-projection:embedded` 且 `shown=0/N`、无退出后载体

notes:

- 最小安全 carrier HOW

routeBasis: 先以五模型/24模型 artifact replay 验证 carrier 生存期，再收敛实现。

dependencies:

- R3F00

resultContract: writer COMPLETE 后 reported_complete；主管 fresh-install direct acceptance PASS 才 accepted。

## Work Unit R3F02 — 当前索引纠正

goal: R3 执行中两个索引只指向真实 R3 current，收口后改为 R3 final PASS/done/report，冻结正文不变。

directAcceptance:

- NEXT 顶部与 plan 在执行阶段只指向真实存在的生命周期载体，收口后改为 R3 final report/done 路径，不再把 R2 写成 current
- R01-R18 hash 保持 1a69fc8d...6a719，历史报告不覆盖

allowed:

- `NEXT-VERSION-DISPATCH-PLAN.md` 顶部索引
- `docs/harness/plan.md`
- R3 生命周期和专用报告

forbidden:

- 修改 R01-R18 冻结正文
- 修改或覆盖历史 R1/R2 报告

facts:

- 当前两个索引均残留已归档 R2 active/current/未 PASS

entryPoints:

- NEXT 顶部、plan stage checklist、tree.planAuthority/readChain

disprovenRoutes:

- 把带日期的 active 文案保留在当前索引并声称它不算 current

notes:

- 无

routeBasis: 只改 current index/authority，不触碰历史冻结正文或报告。

dependencies:

- R3F00

resultContract: writer COMPLETE 后 reported_complete；主管索引与 hash direct acceptance PASS 才 accepted。

## Work Unit R3F03 — 唯一 integration owner

goal: 接入 R3F01/R3F02，重放四类直接反例并形成不同于 R2 的确定性 candidate。

directAcceptance:

- A/B/C/D 中适用于 active 阶段的 joined 反例全部 PASS
- 完整回归、生产 caller、无禁止架构和双 candidate PASS，digest 不同于 R2

allowed:

- R3F01/R3F02 已确认产品与索引写面
- joined tests、candidate 与 R3 专用报告

forbidden:

- provider/agent 调用、静态目录、第二调度器

facts:

- 只有 R3F01/R3F02 supervisor accepted 后开始

entryPoints:

- installed dispatcher、candidate artifact、index/tree/delegation

disprovenRoutes:

- writer COMPLETE、helper tests 或工作目录直接运行替代 artifact fresh install

notes:

- 无

routeBasis: 唯一 owner 负责公共接线和候选一致性，主管重放原始反例。

dependencies:

- R3F01
- R3F02

resultContract: integration owner COMPLETE 后 reported_complete；主管 joined direct acceptance PASS 才 accepted。

## Work Unit R3F04 — 全新独立产品验收

goal: 未参与实现的 reviewer 从 candidate artifact 物化源码并独立重建完整验收矩阵。

directAcceptance:

- 四个直接反例与完整回归全部由 reviewer 独立 PASS
- reviewer 核对 300000ms 原始 wait 工具事实、失败 ledger、禁止架构与禁止动作

allowed:

- 只读产品、artifact、历史基线、raw supervision facts
- 精确 disposable `/tmp/hl-r3f04-*`
- R3F04 独立报告

forbidden:

- 修改产品实现
- 相信 writer COMPLETE、旧测试数、R2 PASS 或主管报告

facts:

- reviewer 必须未参与 R3F01-R3F03 实现

entryPoints:

- candidate materialization、fresh install、dispatcher、tests/security/candidate/lifecycle

disprovenRoutes:

- 工作目录或 helper/module 单测冒充独立产品验收

notes:

- reviewer 验收结论

routeBasis: 全新模型只读挑战 candidate，而非复述既有报告。

dependencies:

- R3F03

resultContract: reviewer 只报告 PASS/FAIL/BLOCKED；主管确认完整性后才 accepted。

## Work Unit R3F05 — 主管终验与收口

goal: 独立 PASS 后依据已给主管直接证据准备 docs-only final closeout，固定 accepted candidate 与归档后的最终 authority。

directAcceptance:

- accepted candidate `sha256:b164bab93900c2cbaa2eb43be5ca144934ad83d2bcae6dad4c0c9b0cfb2e95ea`、R01-R18 hash、NEXT/plan/plan-review/final reports 与 final done 路径准确写入
- 主管 direct rerun 事实准确落盘：`npm test` 115/115、`selfcheck` PASS、NV05 11/11、joined 6/6、13/13 product JS syntax、双 candidate byte-identical；docs-only closeout 不新建 accepted candidate
- closeout 生效时，主管 archive readback 已完成：`tree.readChain().currentCount=0`、`unfinished=0`、`stage=null`、`leaf=null`、live delegation missing/UNKNOWN，archive delegation ledger 中 R3F00-R3F05 accepted / leases=0

allowed:

- R3 final reports、NEXT 顶部/plan/plan-review 最终索引、leaf/stage archived closeout 文案

forbidden:

- 改完索引后重新 build 并把新摘要叫 accepted candidate
- 写 PASS 但归档后 authority 仍指向 current stage/leaf 或保留 pending wording

facts:

- R3F04 independent PASS、R3F05 supervisor accepted 与 archive readback 由 closeout 生效条件约束

entryPoints:

- independent report、主管 acceptance、accepted candidate digest、final indexes 与 archive readback

disprovenRoutes:

- 改完 NEXT 后重新 build 并把新摘要叫 accepted candidate
- 让归档后的最终 authority 继续依赖 current stage/leaf 路径

notes:

- 无

routeBasis: accepted candidate、独立 PASS 与主管 direct rerun 已固定；R3F05 仅收口治理文档，并把归档后的最终 authority 固定到 done 路径与 closeout readback。

dependencies:

- R3F04

resultContract: writer COMPLETE 后只登记 reported_complete；closeout report 生效时，R3F05 accepted 与归档 readback 已完成验证。
