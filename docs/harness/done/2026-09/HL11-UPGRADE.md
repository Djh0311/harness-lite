# HL11 Upgrade Candidate

阶段：stage-hl11-upgrade
目标：完成 Harness Lite 0.11 产品升级并形成独立验收通过的唯一 candidate。
产品：Harness Lite 0.11 source candidate
证据：直接源码读回、正反测试、物化重建、安装验证、独立 reviewer
载体：working copy plus offline source candidate; not release

相关权威设计：

- `docs/harness/plans/HL11-DISPATCH-PLAN.md` 的八条冻结决定、三层投影、事件矩阵、迁移和验收矩阵。

相关事实：

- 当前目录不是 Git repo；不能声称 commit、push 或 release。
- retained 0.10 candidate 为 exact lifecycle evidence，candidate builder 不包含 `docs/harness/**`。
- 用户全局 AGENTS 是工作区外文件，升级前哈希为 `sha256:a060f3cc75512b49e5e4c605841cbad47eda4028ce53251e11d199e8c629e0ae`。

完成标准：

- 0.11 新 leaf/package/Hook/status 统一输出完成标准，旧 `directAcceptance` 仅作为隐藏只读输入 alias；authorityDesign 与 facts 分栏且缺标准不可派发或 accepted。
- 短常驻内核不超过 900 字符，全部治理能力只在九类相关事件出现，无关 guidance 物理缺席。
- 动态 capability、依赖并行、300000ms 只读心跳、reported/accepted、activity/progress、问题级有效失败与 Terra/Sol 恢复保持可用。
- fresh/project/managed、0.10→0.11、更旧官方 upgrade、tamper 零写、fault rollback、native push identity 和 uninstall 回归通过。
- 唯一 0.11 candidate 可复现、可物化测试和安装验证；retained 0.10 artifact 与全局 AGENTS 哈希不变。
- 主管逐项验收实际产品，未参与实现的 reviewer 独立 PASS；结论只覆盖 candidate，不冒充 push/release。

允许动：

- `bin/**`
- `hooks/**`
- `lib/**`
- `skills/**`
- `test/**`
- `package.json`
- `docs/harness/artifacts/harness-lite-0.11.0-*.json`
- 当前 HL11 lifecycle 与新验收报告

不许动：

- `/home/synadmin/.codex/AGENTS.md`
- retained 0.10 candidate、历史 NEXT/reports/done
- Poracode、watchdog、bridge 进程
- push、tag、release、deploy

入口：

- `lib/install.js`
- `lib/tree.js`
- `lib/hook.js`
- `lib/work.js`
- `lib/delegation.js`
- `scripts/build-candidate.js`

已否定路线：

- 把完整 0.10 治理长文继续常驻。
- 双写 `directAcceptance` 与 `completionStandards`。
- 新增 provider adapter、agent interceptor、daemon、timer 或第二 event bus。
- 修改全局 AGENTS 或把 candidate 当 release。

UNKNOWN：

- 真实宿主运行效果未在本 candidate-only 阶段声明；只验证 source、offline materialization 与 disposable installed runtime。

routeBasis：以最短正反例锁定冻结语义，复用现有 Hook/ledger/install 接线，独立 reviewer 最后只读复核。
dependencies：无
resultContract：主管报告逐项绑定产品结果与证据；独立报告给出 PASS 或精确返修 work unit。

## HL11F00 — baseline and counterexamples

goal：冻结 0.10、全局文件、lifecycle 与旧行为反例。
completionStandards：retained 0.10 和全局 AGENTS 字节身份冻结；四类旧行为反例有当前证据。
allowed：当前 HL11 lifecycle；专用 test fixture；新报告
forbidden：产品行为；全局 AGENTS；retained artifact；历史文件；push/release
authorityDesign：HL11 plan F00 与 frozen decisions
facts：0.10 candidate digest d73f4b4f；旧 instruction digest 347f4580；global digest a060f3cc
entryPoints：docs/harness/plans/HL11-DISPATCH-PLAN.md；lib/install.js；lib/tree.js；lib/delegation.js
disprovenRoutes：从计划 PASS 推断产品已执行
unknowns：无
routeBasis：先固定反例和写面再改产品
dependencies：无
resultContract：基线与反例证据报告

## HL11F01 — completion standards contract

goal：正式输出 completionStandards，并将 authorityDesign 与 facts 分栏。
completionStandards：新对象和文本无旧字段；旧输入可归一化；缺标准 readiness=false；三类 sentinel 可读。
allowed：lib/tree.js；lib/work.js；专用 tests
forbidden：验收卡；第二 lifecycle；历史迁移
authorityDesign：HL11 plan completion contract
facts：0.10 parser 正式输出 directAcceptance 且无独立 authorityDesign
entryPoints：lib/tree.js；lib/work.js
disprovenRoutes：双写新旧字段
unknowns：无
routeBasis：单正式字段加隐藏输入 aliases
dependencies：HL11F00
resultContract：schema 正反测试与读回

## HL11F02 — short kernel and event selector

goal：实现短内核与确定性事件 guidance selector。
completionStandards：内核 <=900 且禁项缺席；九片段可选择/去重；未知 intent 拒绝。
allowed：lib/install.js；lib/guidance.js；专用 tests
forbidden：公共 Hook 接线；daemon；provider adapter
authorityDesign：HL11 three-layer projection and event matrix
facts：0.10 instruction 为 2595 字符常驻治理文本
entryPoints：lib/install.js；lib/guidance.js
disprovenRoutes：把 0.10 长文换名继续常驻
unknowns：无
routeBasis：短路由核心加纯状态选择器
dependencies：HL11F00
resultContract：预算、禁项和事件单元测试

## HL11F03 — joined event runtime

goal：把 Hook、status、delegation 与 skills 接到事件选择器。
completionStandards：事件正负投影、动态模型、并行、心跳、accepted-only、progress 和 recovery 全部 joined 通过；accepted 无 evidenceRef 或无标准零写。
allowed：lib/hook.js；lib/work.js；lib/delegation.js；bin/hl.js；hooks/README.md；skills/**；tests
forbidden：Harness 调 agent；固定并发；无事件常驻治理
authorityDesign：HL11 event matrix and supervision contract
facts：现有 Hook 限制 1800 字符并已有 capability/delegation carrier
entryPoints：hooks/dispatcher.js；lib/hook.js；lib/work.js；lib/delegation.js
disprovenRoutes：只在测试里拼 guidance 而不接 installed dispatcher
unknowns：无
routeBasis：唯一 integration owner 复用现有结构化状态
dependencies：HL11F01、HL11F02
resultContract：installed joined positive/negative tests

## HL11F04 — install and migration

goal：形成 0.11 identity 与精确 0.10 migration/rollback。
completionStandards：fresh、0.10、older、managed/project、tamper、rollback、native push 和 uninstall 均通过。
allowed：lib/install.js；lib/managed.js；package.json；tests
forbidden：改写历史常量；弱化 fail-closed；release
authorityDesign：HL11 migration contract
facts：retained 0.10 runtime identity 可从 artifact 物化
entryPoints：lib/install.js；lib/managed.js；test/nv05-integration.test.js
disprovenRoutes：按版本标签而不按固定字节身份升级
unknowns：无
routeBasis：固定 0.10 snapshot identity 加既有事务 swap/rollback
dependencies：HL11F03
resultContract：materialized upgrade and rollback evidence

## HL11F05 — integration and candidate

goal：构建唯一可复现 candidate 并由主管验收。
completionStandards：全测/selfcheck/syntax/双构建/物化测试/物化安装均通过；retained/global 不变；candidate identity 固定。
allowed：集成产品文件；tests；scripts；0.11 candidate；主管报告
forbidden：push/tag/release/deploy；修改全局 AGENTS；用测试数替代产品验收
authorityDesign：HL11 overall acceptance matrix
facts：工作区无 Git；candidate builder 只含固定 source inputs
entryPoints：scripts/build-candidate.js；test/*.test.js；lib/install.js
disprovenRoutes：candidate 生成后继续改 candidate inputs 而不重建
unknowns：真实宿主效果不在 candidate 证据范围
routeBasis：最终输入冻结后双 build，再物化重放
dependencies：HL11F04
resultContract：主管产品验收 PASS 或精确返修

## HL11F06 — independent product review

goal：未参与实现的 reviewer 独立检查冻结决定、实际调用路径、正反例、迁移和最终 candidate。
completionStandards：独立 reviewer 对八条决定、九事件、核心能力、安装迁移、candidate 和边界给出证据化 PASS。
allowed：只读产品/candidate/lifecycle；新独立验收报告
forbidden：reviewer 改候选；push/tag/release/deploy；干扰宿主
authorityDesign：HL11 independent acceptance requirements
facts：F05 candidate digest 为 sha256:8e14e641b7d0fe3641a5e74c49b11a60761e0dc63fb75866ff8226e6b3687ae5
entryPoints：docs/harness/artifacts/harness-lite-0.11.0-8e14e641b7d0fe3641a5e74c49b11a60761e0dc63fb75866ff8226e6b3687ae5.json；实际产品源码；tests
disprovenRoutes：复述主管 PASS 而不读实际产品
unknowns：review verdict pending
routeBasis：只读独立上下文复核并精确绑定 candidate
dependencies：HL11F05
resultContract：Verdict PASS/FAIL、逐项证据、FAIL work unit
