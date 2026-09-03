# Harness Lite 0.11 完成标准与事件触发升级计划

状态：`DECISIONS FROZEN / PLAN PASS / KICKOFF READY / NOT ACTIVE / NOT EXECUTED`

用户授权边界：2026-09-01 用户明确说“开始”，承接上一轮已经说清的动作，仅授权冻结已确认决策、编写和复核升级计划并推进到可派发前；不授权修改 Harness 产品、全局 `AGENTS.md`、当前 lifecycle、retained candidate、Git、发布或部署。

Decision-Digest：`sha256:2c615becc4704bd45eb4fa7cb6364fa7f7c36489d62d49349399f787d5f719ff`

摘要口径：对 `HL11-DECISIONS:BEGIN` 标记后的下一行起，直到 `HL11-DECISIONS:END` 标记前一行止的原始 UTF-8 字节计算 SHA-256；不包含两条标记行。

独立计划复核：R0 `FAIL` 后仅返修规划；同一 reviewer R1 `PASS`。证据见 `docs/harness/reports/HL11-independent-plan-review-PASS.md`。

本文件位于 `docs/harness/plans/**`，不属于当前 0.10 candidate builder 输入。它是 0.11 规划载体，不是当前 `docs/harness/plan.md` authority，不是 stage、leaf、receipt、candidate、release 或执行授权。

## 一、冻结的用户决策

<!-- HL11-DECISIONS:BEGIN -->

以下是下一版本必须同时满足的 WHAT。实现者可以选择 HOW，但不能静默删减、改写或扩大这些决定。

### 1. 全局 `AGENTS.md` 只做跨项目兜底

目标内容冻结为：

```md
# Codex 全局兜底

- 默认使用中文和大白话；结论与证据强度一致，区分事实、推断和未知。
- 当前用户指令决定目标、范围和权限；历史计划、项目规则、交接、建议和计划不得扩大授权，计划和“下一步”不等于执行。
- 有明确对象、范围或触发条件的规则，只在对应范围内适用，不得类推扩大为普遍禁令。
- 回答、审查和诊断默认只读；用户明确要求实现后，才在授权范围内修改。
- 安全、权限和流程是执行边界，不是任务目标；在边界内，实际完成用户要求的结果优先。
- 单次读取、命令或测试失败，先判断原因和实际影响范围；不得自动回滚已有成果、否定整条路线或停止无关工作。
- 保留用户现有改动，不得擅自 reset、clean、stash、覆盖或批量 staging。Git 写入、push、merge、发布和破坏性删除按当前明确授权执行。
- 项目存在 Harness 时，以当前有效 Harness 为准；局部验证不得冒充全项目、真实运行或发布通过。
```

- 这八条是用户环境配置决定，不是 Harness 产品文件；Harness 不安装、改写或接管全局 `AGENTS.md`。
- 不把 Poracode、watchdog、bridge 或任何少见的特定进程规则放进通用全局兜底或通用 Harness 常驻内核；带对象和触发条件的规则只能在真实相关范围出现。
- 最小路线、完成标准、提问、审查、模型、并行、心跳、失败升级和收口属于 Harness 事件能力，不塞进全局兜底。

### 2. 用户需求是第一权威，但不是模型唯一输入

- 当前用户明确需求决定 WHAT、范围、取舍和权限，始终高于 plan、stage、leaf、receipt、Hook、委派账和模型推导。
- 指导模型必须用相关权威产品设计解释需求在本项目中的含义，用当前真实代码、调用关系、数据和运行事实判断现状；不得只照抄一句用户原话，也不得用模型推测的“真实目标”覆盖用户要求。
- 只读取当前判断所需的相关范围，不以“先理解整个项目”为开工前提，不做无边界审计。
- 历史报告、旧计划和旧系统可以提供背景或诊断事实，但不能冒充当前事实或未来产品权威。

### 3. 完成标准直接写在 leaf，不建立验收卡

- 每个 current leaf 直接登记 `目标`、`完成标准`、边界、相关权威设计、相关事实、入口、已否定路线、UNKNOWN、routeBasis 和 work units。
- `完成标准` 必须描述用户需要的功能或产品结果；代码、文件、测试、文档、报告、提交和流程状态只能作为证据，不能单独成为完成标准。
- leaf 是用户需求的最小工作投影，不是第二权威。leaf 漏掉用户要求时必须修正 leaf，不能以 leaf 自己列出的项目已通过为由宣布完成。
- 不新增验收卡、验收合同、标准数据库、第二套 stage/leaf、固定标准数量或长期审批状态。

### 4. `directAcceptance` 只读兼容，新增内容只使用“完成标准”

- 0.11 新 leaf、新 work unit、新 Hook 文案、新任务包和新报告只写、只展示 `完成标准` / `completionStandards`。
- 旧 `directAcceptance` 仅作为隐藏的只读输入别名，用于读取升级前尚未结束的 0.10 leaf；不得继续写出旧字段，不得向 writer 展示旧名称，不得形成两套工作方式。
- archived 历史文件保持原字节，不批量迁移或改写。
- recovery ledger 中通用的 `acceptanceGate` 是失败身份字段，不等同于旧 leaf 的 `directAcceptance`，不因本次命名调整机械改写历史失败账。

### 5. Harness 核心能力全部保留，但改成事件触发

- Harness 仍不是 agent 调度器。真正的模型选择、spawn、wait/status、message、interrupt、takeover 和验收由指导模型直接使用当前宿主工具完成。
- 保留动态 capability、最小 work-unit 上下文、routeBasis、依赖感知并行、唯一 current leaf、五分钟心跳、限制介入、reported/accepted 分离、activity/progress 分离、有效失败去重、Terra/Sol 问题级恢复、资料澄清、旧系统诊断、安装身份、迁移回滚、证据边界和 push gate。
- 删除的是这些规则在每一轮的长期常驻，不是功能本身。
- 普通静态内核保持很短；动态模型只在派发/恢复相关事件出现，心跳只在 active agent 时出现，验收只在 reported/closeout 时出现，恢复链只在失败/租约事件出现，push 规则只在 push 事件出现。
- 事件由现有 Hook 输入、current leaf、委派账、recovery lease 和当前动作意图组合判断；不新增 provider adapter、agent tool 拦截器、后台 daemon、常驻 timer 或第二事件总线。

### 6. 路线与提问仍按 Lite 原则工作

- 开写前保留轻量 routeBasis：当前重点、会改变路线的关键假设、最短直接证据、路线为何命中完成标准、相关 UNKNOWN。
- 目标与手段混淆时使用第一性原理和 XY 判断；多个方案时采用 KISS/YAGNI，并只在有当前证据支持时考虑长期成本和路径依赖。
- 能从代码、文档、现场或工具安全查明的事实由模型自行查。只有真实产品选择、关键术语或重大架构歧义会改变结果时才询问用户。
- 资料调查是普通 work unit，只冻结依赖其结果的分支，不冻结无依赖工作或用户随后提出的独立问题。
- 单次读取、命令或测试失败先判断原因和影响范围；不自动回滚已有成果、否定整条路线或停止无关分支。

### 7. 子代理、并行、心跳和升级决定保持

- 每次派发前从当前真实工具定义或宿主结构化 capability manifest 获取模型；缺失就明确 UNKNOWN，不按名字、历史、UI、错误文本或 transcript 猜测。
- 稳定家族提示仍为 Grok 偏工程、Gemini 偏前端、Terra xhigh 与 Sol xhigh 用于当前问题恢复；未知家族为 unclassified。实际选模必须以开工时真实工具面为准。
- 独立、写面分离的 work unit 优先并行；真实依赖、重叠写面或共享现场才串行、重拆或交给唯一 integration owner。Harness 不设固定并发数。
- active work unit 每 300000ms 由指导模型做一次只读 wait/status；一次合并观察可覆盖全部 agent。正常思考、沉默、长工具和 provider delay 不介入；只有直接证据表明 stopped/stall、实际 blocker、跑偏、越界或共享状态冲突才中途插手。
- `reported_complete` 只启动主管验收，只有主管按相关完成标准和直接证据判定 `accepted` 才解锁 dependents。一个 work-unit PASS 不等于 leaf PASS。
- activity 不等于 semantic progress；文件数、日志、测试数、版本数和运行时长都不能单独证明进展。
- 有效失败只计直接证据否定的实质决定。工具、普通红测、权限、provider、传输、探索性负结果、同根多错和重复已否定路线不计。
- 同一问题同一普通家族五个不同有效失败后进入 Terra xhigh 一次完整恢复；Terra 仍语义失败后进入 Sol xhigh。Sol 默认三次，可按问题配置 1..5；问题 PASS 后清租约，不污染其他 work unit 或新问题。

### 8. 最终验收必须回答用户功能是否完成

- work unit 自报 COMPLETE 后，主管读取实际改动并运行相关完成标准的直接验收和必要回归；0.11 新登记的 `accepted` 状态必须有 `evidenceRef`。
- leaf 收尾必须重新读取当前用户要求，逐条对照所有完成标准，区分已证明、部分证明、未证明和失败；不建立新的持久化验收数据库，结论写入验收报告即可。
- 测试全绿但用户需要的功能没有完成，必须 FAIL/REPAIR；缺少证据是未证明，不自动算有效模型失败，也不自动触发全局回滚。
- 重大阶段和最终 candidate 保留未参与实现的独立 reviewer；普通 leaf 不强制额外 reviewer，除非存在会改变产品结果的真实歧义或指导模型无法可靠覆盖要求。
- candidate、working copy、离线 fixture、协议推断、真实运行、push 和 release 必须继续区分。任何 PASS 都只覆盖报告明确证明的层级和范围。

<!-- HL11-DECISIONS:END -->

## 二、当前 0.10 基线与规划载体边界

- 当前源码版本：`0.10.0`；当前目录不是 Git repo，不伪造 commit、branch 或 provenance。
- retained candidate：`docs/harness/artifacts/harness-lite-0.10.0-d73f4b4f83e6034e33168995c24ca4514d69bcd70ccc19f8aa255da42d218daa.json`。
- candidate SHA-256：`sha256:d73f4b4f83e6034e33168995c24ca4514d69bcd70ccc19f8aa255da42d218daa`；bytes=`1061071`；40 files / 13 product JS。
- 当前 lifecycle：authority/current review 均 current/PASS；`currentCount=0`、`unfinishedLeaves=0`、`stage=null`、`leaf=null`、live delegation=`UNKNOWN/missing`。
- 当前 `INSTRUCTION` 基线：2595 Unicode characters、4625 UTF-8 bytes、3 physical lines、`sha256:347f45809f37d6c8d8476d97cc8e32c37eff5fac334f178a770484d838e2c090`。它把用户权威、动态模型、并行、心跳、介入、恢复、澄清、旧系统、授权、Stop 和报告规则常驻在同一段，是本次减重的直接基线。
- 当前全局 `/home/synadmin/.codex/AGENTS.md` 为 434 bytes、`sha256:a060f3cc75512b49e5e4c605841cbad47eda4028ce53251e11d199e8c629e0ae`。本计划只记录目标内容，不修改该文件；实际更新需要用户另行明确授权，并且不进入 Harness candidate。
- `scripts/build-candidate.js` 只包含 `LICENSE`、`NEXT-VERSION-DISPATCH-PLAN.md`、`package.json` 和 `bin/hooks/lib/scripts/skills/test`。本文件位于 `docs/harness/plans/**`，因此规划写入不得改变 retained 0.10 candidate。
- 0.10 `NEXT-VERSION-DISPATCH-PLAN.md`、历史 `PREVIOUS_*`、reports、done ledgers 和 retained artifact 都是历史/基线证据；本轮规划不得改写。

## 三、0.11 产品结构

### 1. 三层运行投影

```text
短常驻内核
  + 当前 leaf 的最小上下文
  + 当前真实事件需要的指导片段
```

- 常驻内核只说明用户权威、相关设计与事实、leaf 完成标准、最短直接路线、证据不能冒充结果、详细规则按事件加载。
- 当前 leaf 投影目标、完成标准、边界、authorityDesign、facts、entryPoints、disprovenRoutes、UNKNOWN、routeBasis、dependencies 和 resultContract；writer 不读取全项目。
- 事件片段可以互补合并，但每条指令只出现一次；不相关片段必须物理缺席，而不是先全部注入再告诉模型忽略。

### 2. 常驻内核预算

- `INSTRUCTION` markers 之间的 0.11 常驻正文最多 900 Unicode characters；这是一条上限，不是要求填满。
- 常驻正文不得包含 `300000`、Grok、Gemini、Terra、Sol、provider、`reported_complete`、`accepted`、旧系统、push 细则、失败次数或历史事故叙述。
- 用户权威、leaf/完成标准、相关设计和事实、最短直接路线、证据边界必须在常驻内核中完整可见。
- 动态 Hook `additionalContext` 继续遵守 1800-character 上限；完整动态模型和多 work-unit 内容通过现有安全 carrier 保持可读，不用截断伪装完整。

### 3. 事件选择矩阵

| 逻辑事件 | 可直接计算的触发 | 注入内容 | 明确不注入 |
| --- | --- | --- | --- |
| `leaf-definition` | current leaf 缺少完成标准，或指导模型处理新的/改变后的用户目标 | 需求＋相关设计＋真实事实如何形成完成标准、范围外和 UNKNOWN | 模型目录、心跳、恢复、push |
| `route-clarification` | 模型发现目标/手段/关键前提歧义；这是语义自触发 | 第一性原理、XY、最短证据、信息价值、可选资料调查 | 固定多方案、全仓审计、无价值提问 |
| `pre-dispatch` | current leaf 有可运行 work unit 且无依赖阻塞，或指导模型准备直接调用 spawn；后者为动作自触发 | 当前真实 capability、最小任务包、完成标准、routeBasis、依赖、写面、串并行 | 心跳、最终收口、未触发的恢复链 |
| `agent-active` | delegation summary `active.length > 0` | 300000ms 合并心跳、activity/progress 区分、允许介入的直接证据 | 完整失败教程、push、closeout |
| `agent-reported` | `reported.length > 0` | 实际改动读回、相关完成标准、必要回归、accepted-only 解锁 | 把自报完成当 PASS |
| `problem-recovery` | failure/drift/active recovery lease/exhausted 状态存在 | 计数原因、问题指纹、当前 tier、下一模型、剩余 Sol 次数、PASS 清租约 | 无失败时的 Terra/Sol 常驻说明 |
| `leaf-closeout` | 所有必需 work unit accepted 且 leaf 仍 current，或指导模型准备收口；后者为动作自触发 | 最新用户要求、全 leaf 完成标准、产品结果、必要测试、证据范围、独立 reviewer 条件 | candidate=release、局部 PASS=leaf PASS |
| `legacy-fact` | 当前任务实际涉及旧系统/旧载体；语义自触发 | 未来权威与当前只读事实分开 | 普通任务常驻旧系统说明 |
| `push-attempt` | 现有 `PreToolUse`/native push 检测 | 一次性确认、identity、receipt 和 push gate | 非 push 命令中的 Git/push 长说明 |

- 不新增宿主 Hook event 名称。`SessionStart`、`UserPromptSubmit`、`Stop`、`PreToolUse` 和现有 ledger 状态仍是物理载体。
- 状态事件由代码确定；路线歧义、准备派发和准备收口等意图只能由指导模型自触发，Harness 不通过 UI/transcript/provider 猜测。
- 多事件同时成立时按目标/leaf → 派发 → active → reported → recovery → closeout 的相关部分合并；push 继续由独立 PreToolUse 路径处理。合并结果必须去重并遵守上下文预算。

### 4. 状态事件与显式意图的取指引方式

- `agent-active`、`agent-reported`、`problem-recovery` 和可由 leaf/ledger 直接判断的 closeout 状态，由现有 Hook/status 读取结构化状态后自动选择。
- 无法从状态可靠观察的语义动作，由指导模型显式声明 allowlisted intent；中途状态变化使用现有内部接口 `hl status --intent <intent> --json`（或同一库函数的等价调用）取得当次 `guidance`。不新增用户命令或第二事件总线。
- intent 只允许 `leaf-definition`、`route-clarification`、`pre-dispatch`、`leaf-closeout`、`legacy-fact`。未知值拒绝；intent 只选择指导片段，不授予权限、不伪造 runnable/accepted/recovery 等状态，也不覆盖当前 leaf。
- `SessionStart`/`UserPromptSubmit` 可以直接注入当时已成立的状态事件；同一 turn 内新建 leaf、准备派发或准备收口时，指导模型主动用上述只读 status intent 刷新一次。Harness 不读取 transcript 猜下一步。
- 返回对象只包含当前显式 intent 和同时成立的状态事件；其他 guidance 必须没有字段、没有占位、没有载入。常驻内核只保留一句“工作事件变化时读取当次 guidance”的路由提醒。

## 四、完成标准与只读兼容合同

### 新格式

```md
目标：完成用户要求的产品结果。

相关权威设计：

- 只列与本 leaf 成功含义直接相关的设计来源和约束。

相关事实：

- 只列当前代码、调用、数据或运行现场中会改变路线或验收的事实及来源。

完成标准：

- 用户可观察的必需结果一；
- 用户可观察的必需结果二；
- 明确要求的失败/异常结果；
- 与本次目标直接相关的必要回归。

范围外：

- 本次明确不负责的事项。
```

- parser/API 的新正式字段为 `completionStandards`；Hook 中文标签为 `完成标准`。
- leaf/work-unit 的相关权威设计正式字段为 `authorityDesign`，中文标签为 `相关权威设计`；它与 `facts` / `相关事实` 分开，二者都进入最小任务包，不得互相冒充。
- work-unit `completionStandards` 优先取 unit 自身，缺失时继承 leaf；缺失保持 UNKNOWN，不能补脑。
- work-unit `authorityDesign` 和 `facts` 同样优先取 unit 自身的相关最小项，缺失时只继承 leaf 中与该 unit 直接相关的条目；不得把整个项目设计或全仓事实塞给 writer。
- 规划、只读调查和澄清可以在完成标准仍有 UNKNOWN 时进行；相关产品实现不得被投影为 dispatch-ready，直到会决定成功含义的标准明确。
- 不能从用户消息自动持久化完整 prompt；指导模型以当前对话、用户 receipt 的 provenance、相关权威设计和实际事实更新 leaf。

### 旧格式只读入口

- parser 可以读取 `directAcceptance`、`direct acceptance`、`直接验收`、`验收标准`，统一归一化到 `completionStandards`。
- 任何新序列化、Hook、status、task package、技能示例和报告不得输出旧字段或旧标签。
- 兼容探针必须证明旧 0.10 leaf 可读，同时新输出对象没有 `directAcceptance` own-property；这不是双写。
- archived 历史文档不迁移；历史测试 fixture 可以保留旧输入，用于证明只读兼容。

## 五、当前实现冲突清单

| 当前位置 | 冲突 | 0.11 需要达到的结果 |
| --- | --- | --- |
| `lib/install.js` 当前 `INSTRUCTION` | 2595 字符的一段常驻全部治理规则 | 短内核；0.10 正文冻结为 `PREVIOUS_10_INSTRUCTION`，仅供识别升级 |
| `lib/tree.js` | 正式字段和 API 都是 `directAcceptance`；leaf 没有独立 `authorityDesign` | 新 API 只输出 `completionStandards`；旧名称仅输入 alias；设计与事实分栏投影 |
| `lib/hook.js` | `WorkUnit` 行展示 `directAcceptance`；capability/recovery/lifecycle 主要按固定布局拼接 | 事件选择、中文完成标准、无关片段物理缺席、组合去重 |
| `lib/work.js` | parallel context 公开 `directAcceptance`，无 live ledger 时仍输出 heartbeat/recovery UNKNOWN 占位 | 新字段；只在相关状态输出对应治理片段 |
| `lib/delegation.js` | `accepted` status 不强制 `evidenceRef`；summary 总是携带 heartbeat/recovery 结构 | 新 accepted 事件要求 evidenceRef；结构化状态保留，展示由事件 router 决定 |
| `bin/hl.js` | `status` 没有显式 semantic intent 输入 | 保持同一内部命令，仅新增 allowlisted `--intent` 只读 guidance 投影；用户仍无需运行 Harness 命令 |
| `skills/split-work.md` | 并行、心跳、进展、调用、介入和提问都在一个技能正文 | 保留完整参考，但运行时只在 pre-dispatch/active/reported 事件加载相关小段 |
| `skills/root-cause.md` | 根因和完整恢复链同文常驻可读 | 只在 diagnosis/failure/recovery 事件加载；无失败时不投影 |
| `hooks/README.md` | 描述当前固定投影 | 更新为短内核＋状态事件；不声称 Harness 能知道不可观测意图 |
| `test/**` | 大量 fixtures/assertions 写死 `directAcceptance` 和固定完整上下文 | 旧输入只用于兼容；新增输出和 joined 断言只认完成标准和事件缺席/出现 |
| `package.json` / install identity | 当前为 0.10.0，runtime paths/digests绑定当前产品 | 构建 0.11.0 candidate，精确迁移和回滚，不回退版本 |
| `NEXT-VERSION-DISPATCH-PLAN.md` | 0.10 历史冻结内容含旧字段和当时宿主边界 | 保持历史原字节；不得当作 0.11 当前运行提示 |
| 全局 `~/.codex/AGENTS.md` | 当前是外部 434-byte 宿主事故规则 | 不属于产品写面；本计划只记录已确认目标内容 |

## 六、work-unit 图与派发计划

```text
HL11F00 ──┬──> HL11F01 ──┐
          └──> HL11F02 ──┴──> HL11F03 ──> HL11F04 ──> HL11F05 ──> HL11F06
```

- HL11F01 与 HL11F02 只有在 fresh-check 后写面实际分离时并行；两者不直接改同一公共接线文件，HL11F03 是唯一 integration owner。
- 其余箭头是真实设计/迁移依赖。Harness 不设固定并发数。
- 每次实际派发按当时真实工具面选择模型；工程优先当前可用 Grok family，未知/不可用就如实记录并选择当前真正可调用的工程模型，不用历史目录。

### 有效失败的执行口径

- 计数对象是“同一问题上被直接证据否定的实质模型决定”，不是一次命令、一次测试或一次 agent 调用。典型计数项包括：关键路线假设被现场事实推翻；实现选择直接造成完成标准不成立；修复声称解决某一已知问题，但主管读回证明该语义问题仍存在。
- 只有根因或被否定决定不同才是新的有效失败。同一决定造成多个报错、同一根因在多项测试暴露、重复提交已否定路线，都按一个问题指纹去重。
- 工具不可用、权限不足、provider/传输异常、普通红测、探索性负结果、缺证/UNKNOWN 和 reviewer 只要求补证都不计；它们可以形成 blocker 或待办，但不能消耗模型升级次数。
- 升级租约只绑定当前问题。五个普通有效失败后 Terra 只有一次完整恢复；Terra 仍发生有效语义失败后转 Sol，Sol 默认三次且只在该问题内计数。PASS 后清该问题租约，其他 leaf/work unit 仍从自己的普通层开始。

### HL11F00 — 基线、直接反例与写面冻结

- 目标：冻结 retained 0.10 candidate、常驻提示基线、当前 lifecycle、全局文件外部边界和会直接否定错误 0.11 的反例。
- 依赖：无。
- 允许写：新阶段/leaf、计划配套 reports、专用测试 fixture；不改产品。
- 禁止：修改 0.10 source behavior、retained artifact、全局 `AGENTS.md`、历史 NEXT/reports/done、push/release。
- 完成标准：至少重放“普通任务仍看到恢复/push/旧系统规则”“新 leaf 仍输出 directAcceptance”“accepted 无 evidenceRef 也可写入”“一次工具失败被扩大为全局回滚提示”四类旧行为或结构反例；证据绑定当前 0.10 identity。

### HL11F01 — leaf 完成标准与旧输入只读兼容

- 目标：实现新 completionStandards 合同，使用户需求、相关设计和真实事实落到 leaf 完成标准，旧字段只读不写。
- 依赖：HL11F00 accepted。
- 主要写面：`lib/tree.js`、必要的 `lib/work.js` 非接线部分、专用 tests。
- 禁止：新验收卡/数据库、完整用户 prompt 持久化、全仓总结、历史文档改写。
- 完成标准：新格式 leaf/unit 解析完整；`authorityDesign` 与 `facts` 分栏且共同进入相关最小包；旧 0.10 输入归一化；新 package/JSON/文本无 `directAcceptance` 输出；缺失标准为 UNKNOWN；规划可继续但相关实现 readiness=false；用户要求 sentinel、权威设计 sentinel 与真实事实 sentinel 都能被直接读回。

### HL11F02 — 短内核与事件指导选择器

- 目标：把 0.10 大常驻提示拆为短内核和可组合事件片段，不改 agent 工具边界。
- 依赖：HL11F00 accepted；与 HL11F01 写面分离时可并行。
- 主要写面：`lib/install.js` 当前 instruction、新的最小内部 guidance 选择实现或等价局部模块、专用 tests；公共 Hook 接线留给 HL11F03。
- 禁止：新 daemon/timer/event bus、provider/agent adapter、静态模型目录、在 base kernel 列举全部事件规则。
- 完成标准：base kernel ≤900 chars；必需核心语义存在；禁止的事件词不在 base；相同结构化状态产生确定性片段；无相关状态返回空事件片段；组合去重；allowlisted intent 确定性选择 guidance，未知 intent 拒绝且不产生指导。

### HL11F03 — Hook、work、delegation 与 skills 集成

- 目标：让真实 SessionStart/UserPromptSubmit/Stop/PreToolUse 和 installed runtime 按当前状态投影正确事件，同时保留 0.10 已验收的动态模型、并行、心跳、accepted-only、progress 和恢复链。
- 依赖：HL11F01、HL11F02 accepted。
- 主要写面：`lib/hook.js`、`lib/work.js`、`lib/delegation.js`、`bin/hl.js`、`skills/split-work.md`、`skills/root-cause.md`、`hooks/README.md`、对应 tests。
- 禁止：Harness spawn/poll/interrupt、固定并发数、activity 冒充 progress、无失败常驻恢复说明、无 active 常驻 heartbeat。
- 完成标准：事件矩阵逐项正例与负例通过；Hook 状态触发与同 turn 的 `status --intent` 都能只返回相关 guidance，且不从 transcript 猜意图；最小包同时保留 completionStandards、authorityDesign 和 facts；accepted 无 evidenceRef HOLD/零写；reported 不解锁；多 active unit 保持完整最小上下文；capability 5/24/dynamic add-remove 仍完整；300000ms 与限制介入不变；恢复链全部回归。

### HL11F04 — 0.10 安装迁移、版本身份与回滚

- 目标：形成 0.11.0 runtime，识别并精确替换官方 0.10 current instruction，保留历史常量、project/managed、identity、Hook、native push 和 rollback。
- 依赖：HL11F03 accepted。
- 主要写面：`lib/install.js`、必要的 `lib/managed.js`、`package.json`、candidate builder/tests、迁移文档。
- 禁止：改写 `PREVIOUS_06/07/08/09_*`；把规划文件或 lifecycle docs 意外加入旧 0.10 candidate；弱化 tamper fail-closed、rollback 或 push gate。
- 完成标准：fresh install、0.10→0.11 upgrade、已有更旧官方 upgrade 回归、managed/project、coherent tamper 零写、fault rollback、runtime identity、uninstall 和 native push probe 全部通过；历史 0.10 leaf 的旧输入只读可见，新写面只使用完成标准。

### HL11F05 — 集成、candidate 与主管验收

- 目标：构建唯一可复现 0.11 candidate，并由主管直接重放用户结果和事件触发矩阵。
- 依赖：HL11F04 accepted。
- 主要写面：集成必要产品文件、tests、scripts、candidate identity 和主管 reports；integration owner 唯一。
- 禁止：push/tag/release/deploy、改写全局 AGENTS、把 writer done 或测试数冒充产品 PASS。
- 完成标准：unit/integration/selfcheck/产品 JS syntax/双 candidate/物化重建全部通过；普通任务提示显著减重且无无关规则；完成标准缺失功能的反例即使测试全绿也不能 accepted；所有 0.10 核心能力只在正确事件出现；0.10 retained artifact 仍原字节存在。

### HL11F06 — 独立产品验收与停点

- 目标：由未参与实现的 reviewer 只读检查冻结用户决定、实际产品调用路径、正反例、升级/回滚和最终 candidate，而不是相信 writer 或主管报告。
- 依赖：HL11F05 supervisor accepted。
- 模型：从当时真实工具面选择未参与实现且适合工程复核的模型，不静态指定恢复模型。
- 写面：只允许独立验收报告；reviewer 不直接修候选。
- 必查：八条全局决定没有进入 Harness 写面；完成标准语义和旧输入只读；常驻内核预算；九类事件正负投影；动态模型、并行、五分钟心跳、accepted-only、busy≠progress、失败去重和 Terra/Sol；安装、回滚、candidate 确定性、push/release 边界。
- 结论：PASS 才允许主管关闭 0.11 current leaf；FAIL 精确返回受影响 work unit。独立 PASS 仍只是 candidate，不是 push/release。

### 冻结决策追踪

| 决策 | 产品落点 | 主 work unit | 决定性正例 / 反例 |
| --- | --- | --- | --- |
| 1. 全局仅兜底 | Harness 安装、managed、candidate 与 `~/.codex/AGENTS.md` 彻底分界 | F00、F05、F06 | 全局目标可在计划读回；install/candidate 对该路径零读零写，哈希不变 |
| 2. 用户第一权威＋设计＋事实 | leaf schema、最小包、closeout | F01、F03、F05 | 三类 sentinel 分栏可读；leaf 漏掉用户必需功能时即使测试绿也 FAIL |
| 3. 标准直接进 leaf | leaf/work-unit parser 与主管验收 | F01、F05 | completionStandards 是产品结果；不存在验收卡、第二 lifecycle 或固定标准数量 |
| 4. 旧名只读 | parser、package、Hook、升级读取 | F01、F04 | 0.10 旧 leaf 可读；所有新对象/文本无旧 own-property/标签，历史文件原字节不变 |
| 5. 核心改成事件触发 | 短 INSTRUCTION、guidance selector、Hook/status | F02、F03、F05 | 正确事件出现完整能力；无关 guidance 物理缺席，无 daemon/adapter/第二总线 |
| 6. Lite 路线与提问 | route-clarification guidance、调查 work unit | F02、F03 | 最短证据和真实歧义提问生效；资料分支等待时无依赖工作及用户其他问题可继续 |
| 7. 子代理与问题级升级 | capability、delegation、heartbeat、recovery | F03、F05、F06 | 动态模型、依赖并行、300000ms、限制介入、有效失败去重和问题级 Terra/Sol 正反例通过 |
| 8. 最终回答功能是否完成 | reported acceptance、leaf closeout、independent review | F03、F05、F06 | accepted 绑定 evidenceRef；局部/载体/测试 PASS 不能冒充用户功能、真实运行或发布 PASS |

## 七、整体验收矩阵

| 验收组 | 必须证明的正例 | 必须证明的反例 |
| --- | --- | --- |
| 用户结果 | 最新用户要求、相关设计和真实事实形成 leaf 完成标准；最终逐项验收实际功能 | 测试全绿但用户必需功能缺失必须 FAIL；leaf 不得覆盖用户 |
| 全局边界 | 计划记录八条目标，全局文件另行授权 | Harness install/candidate 不读取、创建或改写 `~/.codex/AGENTS.md` |
| 短内核 | 核心六义完整且 ≤900 chars | base 不含模型、心跳、恢复、旧系统、push 和历史事故细则 |
| 完成标准 | 新 leaf/package/Hook/status 统一使用 completionStandards/完成标准；authorityDesign 与 facts 分栏进入最小包 | 新输出无 directAcceptance；旧输入仍可只读归一化；设计不能藏进 facts 冒充已覆盖 |
| 事件选择 | 各状态只出现相关片段；相关多事件可去重合并；显式 status intent 可在同 turn 取 guidance | 无 active 不出现 heartbeat；无失败不出现 Terra/Sol；非 push 不出现 push 细则；不猜 transcript 意图 |
| 路线/提问 | 关键假设用最短证据；真实歧义才问；资料 work unit 只冻结其依赖分支 | 不做固定方案表、无边界审计、阻断无依赖问题或因一次错误全局回滚 |
| 子代理 | 指导模型直接使用真实工具面；最小包；独立 work units 可并行 | Harness 不 spawn/poll/interrupt；不静态猜模型或固定并发 |
| 监督 | active 时 300000ms；明确卡死/blocker/跑偏/越界才介入 | silence、thinking、long-tool、provider delay 和 heartbeat 不算 progress/介入理由 |
| 完成 | reported 后主管直接验收；accepted 有 evidenceRef 才解锁 | 自报 done、文件落盘、测试数、一个 unit PASS 不等于 leaf PASS |
| 失败/升级 | 五个不同有效普通失败→Terra 一次→Sol 默认三次；PASS 清当前租约 | 未证明、工具、普通红测、同根多错、重复路线不耗次数；升级不污染其他分支 |
| 兼容/安装 | 0.10→0.11、older official 回归、project/managed、identity、rollback、push gate | 历史常量不改；tamper/extra path fail-closed 零写；candidate 不冒充 release |
| 载体 | working copy、candidate、真实运行、push/release 分开报告 | docs-only 规划和 lifecycle 不能改变 0.10 retained candidate |

## 八、计划复核标准

本计划只有同时满足以下条件才可标为 `PLAN PASS / KICKOFF READY`：

1. 冻结决策 section digest 已计算，且后续复核不修改其正文。
2. 当前 0.10 candidate、global file、lifecycle 和 instruction 基线均有 fresh evidence。
3. 每条冻结决定至少对应一个产品面、一个 work unit 和一个正/反验收项。
4. 事件矩阵明确区分可计算状态与模型自触发意图，没有假装 Harness 能观察 provider/tool 意图。
5. HL11F01/HL11F02 的并行只在 fresh write-scope 不重叠时成立；HL11F03 是唯一公共接线 owner。
6. `authorityDesign` 与 `facts` 在正式 schema、最小包、Hook/status 和验收中保持分栏且最小相关。
7. 旧 `directAcceptance` 是读旧/只写新，不是双写兼容。
8. 全局 `AGENTS.md` 明确在产品范围外，没有借升级授权修改。
9. 计划 review PASS 仅表示派发材料可用，不建立 stage/leaf、不派 writer、不改变 candidate。

## 九、未激活 Kickoff

以下文字仅在未来用户重新明确开始 0.11 产品开发后使用。它现在不是执行授权。

```text
开始 Harness Lite 0.11 candidate 开发。以 docs/harness/plans/HL11-DISPATCH-PLAN.md 冻结决策、work-unit 图和验收矩阵为当前开发基线。

你是唯一指导/验收模型。先 fresh-check 0.10 source、retained candidate、当前 lifecycle、用户边界和真实 agent 工具面；不要修改用户全局 AGENTS.md，不把计划 PASS 当作实现授权以外的 push/release 权限。

建立一个 0.11 current stage 和一个 current leaf。先执行 HL11F00；HL11F01/HL11F02 只有在 write-scope fresh-check 分离后才并行，随后按 accepted-only 依赖推进到 HL11F06。实际 writer 从当时真实工具面选择，Harness 不调用 agent。

每个 leaf/work unit 使用 goal、完成标准、allowed/forbidden、authorityDesign、facts、entryPoints、disprovenRoutes、UNKNOWN、routeBasis、dependencies 和 resultContract；authorityDesign 与 facts 必须分开且都只投影相关最小项。active agent 用 300000ms wait/status；只有直接卡死/blocker/跑偏/越界证据才介入。reported_complete 后由你读取实际产品并按完成标准验收；accepted 必须有 evidenceRef。

有效失败按冻结问题级规则记账。完成 HL11F05 后由未参与实现的 reviewer 执行 HL11F06。PASS 只形成 0.11 candidate；未经用户另行明确确认，不 push、tag、release 或 deploy。
```

当前停点：`PLAN PREPARATION ONLY / NO CURRENT LEAF / NO PRODUCT WORK / NO GLOBAL AGENTS CHANGE / NOT PUSHED / NOT RELEASED`
