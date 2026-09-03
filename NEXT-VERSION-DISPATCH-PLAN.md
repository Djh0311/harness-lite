# Harness Lite 下一版本派发包

状态：`HISTORICAL FROZEN REQUIREMENTS INSIDE CANDIDATE / NOT LIVE LIFECYCLE AUTHORITY`

本文件进入 Harness Lite source candidate，用于保留下一版本需求和产品边界的历史冻结要求。它不是实时 stage、leaf、验收、收口或发布状态的权威来源，也不记录任何候选 artifact 身份。

实时/最终 lifecycle、artifact identity 和 candidate digest 只存在 candidate 输入外的 `docs/harness/**` lifecycle/报告材料中；构建后不得把任何 candidate 身份、摘要或字节数回填到本文件顶部。

因为 NEXT 本身是 candidate 输入，本文任一内容变化都应改变 candidate bytes/digest；相反，`docs/harness/**` 不属于 candidate 输入，docs-only lifecycle 更新不应改变 candidate artifact。

## 一、冻结的需求基线

下面这些是下一版本必须同时满足的 WHAT。实现模型可以自主决定 HOW，但不能静默删减或改写这些要求。

| ID | 必须满足的结果 |
| --- | --- |
| R01 | Harness Lite 不是子代理调度器。它只告诉指导模型何时需要子代理、当前最小任务上下文、可用模型、监督与升级规则；真正的选模、派发、等待、消息、打断、接管和验收都由指导模型直接使用宿主现有工具完成。 |
| R02 | 不内置 provider adapter、提供方凭据、静态模型目录、UI 抓取、transcript 猜测、常驻 daemon 或后台定时器。 |
| R03 | 每次派发前以本轮真实工具面或宿主结构化 capability manifest 为准列出模型；缺少结构化信息就明确 `UNKNOWN`，禁止按名字猜出一个模型。新增、下线或改名模型不要求发布新版 Harness。 |
| R04 | 稳定的家族能力提示只有：Grok 偏工程、Gemini 偏前端、Terra xhigh 与 Sol xhigh 用于问题级恢复；未知家族标记 `unclassified`。不同 Grok 通道是不同调用通道、同一模型家族。 |
| R05 | writer 只取得当前决定所需的最小上下文：目标、直接验收、边界、相关事实、入口、已否定路线和 UNKNOWN。任何模型都不得假装理解整个项目，也不得为了“先理解全项目”做无边界审计。 |
| R06 | 开写前只需一条轻量 `route basis`：当前真正重点是什么、哪个最短直接证据先验证关键判断、为何所选实现路线命中直接验收、还有什么相关 UNKNOWN。诊断取证方式不自动等于最终产品实现。它防止默认实现一头钻到底，但不强迫列固定数量方案，也不替模型规定完整 HOW。 |
| R07 | 指导模型按真实依赖和共享状态自主判断串并行。独立 work unit 优先并行；依赖上游结果、重叠写面或共享运行现场的工作串行、重拆或交给唯一 integration owner。Harness 不设全局严格串行，也不设固定并发数。 |
| R08 | 一个 current leaf 仍是当前用户目标、生命周期和授权的唯一总容器；leaf 内可以有多个 work unit。项目或当前 leaf 明确要求单 writer 时，该局部约束高于通用并行默认。 |
| R09 | 每个活动 work unit 由指导模型每五分钟用现有 wait/status 工具做一次只读心跳；一次合并轮询可以覆盖全部活动子代理。正常思考、长工具调用和沉默不是介入理由，只有直接证据表明卡死、实际 blocker 或跑偏时才中途插手。 |
| R10 | 子代理报告 `COMPLETE` 只会启动指导模型验收；依赖节点必须等到指导模型直接验收 PASS 才解锁。`PARTIAL`/`BLOCKED` 只阻塞依赖它的分支，独立分支可以继续。一个 work unit PASS 不等于整个 leaf PASS。 |
| R11 | 工具调用、日志、文件数、测试数、版本数、运行时长和“仍在运行”都只是 activity，不自动等于 progress。progress 必须是新验证事实、排除路线、推进验收、隔离根因或形成可行动 blocker。 |
| R12 | 有效失败只指模型作出的一个实质决定被直接证据证明错误；普通中间错误、探索性负结果、同根多错和宿主/提供方/权限/传输故障不计数。 |
| R13 | 同一问题的同一普通模型家族最多五次不同有效失败，随后用 Terra xhigh 做一次完整恢复；Terra 仍语义失败再升级 Sol xhigh。Sol 默认有 3 次实质不同的完整恢复机会，可配置；工具故障不消耗机会。 |
| R14 | 升级租约只绑定当前问题。问题直接验收 PASS 后清除，其他 work unit 和新问题恢复普通选模；已经升级的问题不能靠换通道、换会话或改名降级。 |
| R15 | Matt `grill-with-docs` 中有用的部分作为可选澄清方式：只有真实产品选择、关键术语或重大架构歧义才向用户问；能从代码、文档、现场或工具直接查明的事实由模型自己查。资料调查是普通 work unit，运行时不冻结真正独立的问题、工作或用户随后提出的其他问题；只有答案依赖调查结果时才等待。 |
| R16 | “将被淘汰的服务器/旧系统”不能作为未来产品权威，但不自动禁止只读查看其当前调用关系、真实行为或诊断事实；只有用户明确禁止读取时才不读。 |
| R17 | 当前用户指令始终高于 plan、stage、leaf、receipt、Hook、委派账和模型推导。所有内部状态只能投影用户目标，不能扩大授权。 |
| R18 | 保留 push 一次性确认、真实证据、安装身份、迁移回滚和载体区分；绝不杀死、重启或干扰 Poracode、watchdog、bridge。宿主或 Git 异常只报告证据。 |

## 二、产品边界

### Harness Lite 做什么

- 在 SessionStart/UserPromptSubmit/Stop 上给指导模型投影当前最小上下文和委派摘要；
- 告诉指导模型本任务是否属于应由子代理 writer 实现的产品任务；
- 要求指导模型从自己当前可见的真实工具定义或宿主 manifest 列出可调用模型；
- 提供依赖感知并行、五分钟心跳、介入、完成验收和模型升级的内部指导规则；
- 保存一个小而可恢复的 work-unit 账，记录依赖、写面、模型家族、问题指纹、心跳、报告状态、验收状态和有效失败；
- 在 status/report 中区分 activity、semantic progress、reported complete、accepted、blocked 和 failure tier。

### 指导模型直接做什么

- 读取当前宿主实际暴露的子代理工具和模型；
- 按任务能力、依赖、写面和当前并发容量选择一个或多个 writer；
- 直接调用 spawn/wait/status/message/interrupt/takeover 等现有工具；
- 每五分钟轮询活动子代理，并依据事实判断是否介入；
- 子代理明确报告完成后直接检查实际改动、运行直接验收和必要回归；
- 依据验收证据登记有效失败、继续返修、升级模型或收口。

### Harness Lite 明确不做什么

- 不连接 Cursor、GrokBuild、Antigravity、Codex 或其他提供方；
- 不替指导模型调用、停止或调度子代理；
- 不自己决定任务一定串行或一定并行；
- 不从模型名推理它一定可用，也不保存逐模型版本目录；
- 不以委派账取代宿主 live status；账只是恢复提示，实际工具结果才是运行状态事实；
- 不要求任何模型预先掌握全项目，也不把一套默认实现当成最优路线。

## 三、运行协议

### 1. 先判定是否需要 writer

- 讨论、只读分析、计划准备、状态说明：指导模型自己完成，不为了形式派子代理。
- 已获得当前用户明确开始/继续的产品实现、修复或重构：建立一个 current leaf，由指导模型派 writer 实现，自己监督并独立验收。
- 清晰的新用户指令可以改变或取消现有工作；内部 work unit 不得拦截用户。

### 2. 形成最小派发包

每个 work unit 只携带：

- `goal`：这次真正要得到的产品结果；
- `directAcceptance`：什么直接证据才算通过；
- `allowed/forbidden`：允许写面、共享状态和明确禁区；
- `facts`：已经直接证实且影响当前决定的事实；
- `entryPoints`：与当前判断有关的入口和调用方；
- `disprovenRoutes`：已被直接证据否定、不得重复的路线；
- `unknowns`：会影响当前路线但还不知道的内容；
- `routeBasis`：当前重点、路线为何命中验收、相关 UNKNOWN；
- `dependencies`：必须等哪些 work unit 验收 PASS；
- `resultContract`：报告 `COMPLETE`、`PARTIAL` 或 `BLOCKED`，并给出证据和未完成项。

不得附带“把整个项目先研究透”之类无边界任务。发现缺少信息时，只围绕当前决定增量读取。

在产品写入前，先用当前可用的最短直接方式验证会改变路线的关键假设，例如读取真实入口、调用方、现场状态或最小复现。这个诊断方式只负责把事实搞清楚，不因此强迫最终产品沿用同一种机制；最终实现仍以目标直接验收和未来产品权威为准。

### 3. 动态列出模型并选择

指导模型按以下优先级读取当前能力：

1. 当前子代理工具定义中直接暴露的模型和推理档位；
2. 提供方工具可返回的结构化 model list；
3. 宿主本轮注入的结构化 capability manifest；
4. 都没有则记录 `runtime-model-list: UNKNOWN`，不能抓 UI、读错误文本或凭记忆补全。

Harness 可以把结构化 manifest 规范化为“通道、模型、推理档位、家族、状态”的临时投影，但投影不持久化成产品目录。当前会话曾出现过的具体模型只属于历史示例，不是下一轮可用性证据。

任务选模采用能力提示，不是死路由：

- 工程实现优先考虑当前可用 Grok 家族；
- 前端视觉和交互优先考虑当前可用 Gemini 家族；
- Terra xhigh、Sol xhigh按问题升级租约使用；
- `unclassified` 模型只有取得当前能力证据后才获得写任务；
- 如果推荐家族当前不可用，指导模型选择最接近能力的真实可用模型，并记录依据，不等待目录更新。

### 4. 判断并行

指导模型为候选 work unit 画最小依赖关系，不需要写复杂 DAG 文档。

- 无数据依赖、写面不重叠、没有共享现场：可并行。
- 下游路线会被上游结果改变：必须等待上游验收 PASS。
- 同一文件、数据库、浏览器、生成物或环境：拆分、设唯一 integration owner，或串行。
- 只读资料调查可以与不依赖其结果的实现、用户新问题、提问或其他调查并行；依赖调查答案的决定才等待。
- 某分支 `PARTIAL`/`BLOCKED` 时，只冻结它的 dependents；其他独立分支继续。

并行是指导模型的实时判断，不是 Harness 的固定调度表。计划中的依赖图只标硬依赖，指导模型可以根据 fresh evidence 减少或增加安全并行，但不能越过真实依赖或制造无协调重叠写入。

### 5. 五分钟心跳和介入

- 任一 work unit 处于 `active` 时，指导模型使用宿主现有 wait/status，最长五分钟返回一次观察；多个子代理用一次合并轮询即可。
- 子代理提前完成时立即返回，不必为了凑满五分钟继续等待。
- 每次轮询更新 `heartbeatAt`；即便没有新进展，也只代表“已观察”，不能更新 `progressAt`。
- 只有出现以下直接证据才允许中途消息、打断或接管：状态长期不变化且工具证明不再运行；明确等待一个无法自行取得的输入；持续做与 goal/directAcceptance 无关的工作；重复已被否定路线；越过 forbidden/write scope；无协调争用共享状态。
- 正常沉默、长编译、长测试、等待工具、文件变多、日志变多或提供方暂时慢都不是介入证据。

### 6. 完成和依赖解锁

状态分开记录：

- `active`：子代理仍在工作；
- `reported_complete`：子代理自报 `COMPLETE`，等待指导验收；
- `partial`：给出可信部分结果，仍有未完成项；
- `blocked`：给出具体 blocker；
- `accepted`：指导模型直接验收 PASS；
- `rejected`：直接验收证明候选未通过。

只有 `accepted` 解锁 dependents。`SubagentStop`、一次工具结束、沉默、文件落盘和 `reported_complete` 都不解锁。

## 四、activity、progress、failure 和升级

### 1. activity 不等于 progress

work-unit 账必须分开保存：

- `activityAt/activityKind`：工具、文件或运行状态变化；
- `heartbeatAt`：指导模型最近一次只读观察；
- `progressAt/progressKind/evidenceRef`：指导模型已经验证的语义进展；
- `status`：active/reported_complete/partial/blocked/accepted/rejected。

允许登记的 `progressKind` 只有：

- `verified-fact`：得到会改变判断的新事实；
- `route-eliminated`：用直接证据排除路线；
- `acceptance-advanced`：一个直接验收项真实通过；
- `root-cause-isolated`：根因被最小复现或证据隔离；
- `actionable-blocker`：已经清楚说明缺什么、谁能提供、解除后从哪里继续。

### 2. 什么算一次有效失败

有效失败是“模型作出的一个实质决定，被直接证据证明错误”。一个事件只按主因记一次。

计数：

- 把 goal、用户边界或直接验收理解错；
- 根因诊断被最小证据否定；
- 主实现路线被真实调用链或目标验收否定；
- 声称完整候选，但候选没有通过目标直接验收；
- 用不相关、模拟、局部或错误证据宣称 PASS。

不计数：

- 探索探针得到负结果，但新增了有用事实或排除路线；
- 实现中的普通编译、单测、lint、命令或工具错误；
- 认证、权限、配额、队列、网络、传输、提供方或宿主故障；
- 外部依赖缺失、需要用户真实产品选择或无关基线失败；
- 同一根因产生的多条错误、同一候选的一组失败断言；
- 指导模型尚未采纳的草稿想法。

已经被直接证据否定的同一路线再次重复，判定为 `drift` 并允许立即介入；它不会被伪装成五次新的尝试。

### 3. 失败账和升级租约

失败事件键：

`leaf + workUnit + acceptanceGate + stableProblemFingerprint + modelFamily`

问题级升级租约键：

`leaf + workUnit + acceptanceGate + stableProblemFingerprint`

`modelFamily` 用来归因和共享同一家族的次数：Cursor Grok 与 GrokBuild Grok 共享 Grok 家族计数。问题级租约不带 family；任一普通家族已经触发 Terra 后，不能再切另一个普通家族把问题降级。只有在尚未触发升级、且当前证据表明任务能力类型确实改变时，指导模型才可选择另一普通家族并使用它自己的计数，不能为了多拿五次而机械换模。

规则：

1. 同一普通模型家族在同一问题上最多登记五次彼此实质不同的有效失败；
2. 第五次后，下一次完整恢复由当前可用 `gpt-5.6-terra` 的 `xhigh` 档承担；Terra 先重新诊断，再实现和跑直接验收，不继承错误 HOW；
3. Terra 的一次完整恢复仍发生有效语义失败，问题租约升级到当前可用 `gpt-5.6-sol` 的 `xhigh` 档；Terra 没有另一套五次预算；
4. Sol 默认 3 次完整恢复机会。每次必须基于新证据、新诊断或实质不同路线；提供方/工具故障不消耗机会；
5. Sol 机会用尽仍未通过，停止自动升级，报告 blocker、已否定路线和下一项真正需要的决定或证据；
6. 同一问题切 Cursor Grok/GrokBuild Grok、换会话、改 work-unit 名或换普通模型都不能把已经提升的租约降级；
7. 问题直接验收 PASS 后租约结束。其他独立 work unit、新问题和后续 leaf 使用普通选模；升级不是永久身份。

## 五、轻量状态合同

实现可以自主选择内部函数或零用户命令的内部接口，但最终只允许一个小型、原子写入、leaf-bound 的委派账。建议最小字段：

```text
schemaVersion
projectIdentity
stageId
leafId
workUnits[]:
  id, goalDigest, dependencies[], writeScope[]
  channel, model, modelFamily, reasoning
  stableProblemFingerprint, acceptanceGate
  status
  activityAt, heartbeatAt
  progressAt, progressKind, evidenceRef
  reportedResult, acceptedAt
  effectiveFailures[]
  escalationTier, solAttempts
```

约束：

- 账必须与 current leaf 绑定；leaf 变化、project identity 不符或 schema 不认识时，只标 stale/UNKNOWN，不自动控制子代理；
- live agent status 高于账；SessionStart 恢复后先由指导模型用现有工具对账；
- 不保存 provider credential、完整 prompt、完整 transcript、用户秘密或整份代码；
- heartbeat 只记观察，progress 必须带 evidenceRef；
- 同一事件幂等，重放不能增加失败次数或 Sol 次数；
- 用户改变目标时更新最小投影，旧问题账归档但不能扩大新目标。

## 六、代码改动图

下一版本保持小核心，不新增调度服务。

| 文件/区域 | 下一版本改动 | 不能做 |
| --- | --- | --- |
| `lib/install.js` | 只更新新的当前 `INSTRUCTION`；把最小上下文、真实工具面、work unit、五分钟心跳、完成验收和升级规则写入当前指导文本；更新 runtime identity/managed paths。 | 不改写 `PREVIOUS_06/07/08_*` 历史迁移常量；不写静态模型表。 |
| `lib/tree.js` | 从 plan/stage/current leaf 解析 direct acceptance、facts、entry points、disproven routes、UNKNOWN、route basis，形成最小投影。 | 不读取整个项目替模型总结；不取消唯一 current leaf。 |
| 新增 `lib/delegation.js` | 纯本地委派账、依赖判断、心跳到期、幂等失败与升级状态；不执行 agent 工具。 | 不连接 provider，不 spawn/poll/stop，不把 stale 账当 live 状态。 |
| 可选新增 `lib/capabilities.js` | 仅规范化宿主明确传入的结构化 capability manifest；没有输入就返回 UNKNOWN。 | 不抓 UI、不猜模型、不持久化逐模型目录。若当前宿主无需 helper，可不新增。 |
| `lib/hook.js` | SessionStart/UserPromptSubmit/Stop 投影委派摘要和到期提醒；把当前总体 verify/三次失败逻辑改为 work-unit 语义。 | Hook 不直接调用子代理，不用 activity 自动续跑，不靠 transcript 判断。 |
| `lib/work.js` | status/report 分开输出 activity、progress、各 work unit 状态、依赖、心跳、验收和 escalation tier。 | 不以文件数、测试数或 agent 数宣称产品进展。 |
| `bin/hl.js` | 如实现需要，只增加零用户负担的内部委派状态接口；文本明确它是内部接口。 | 不让用户手工维护 agent 账，不暴露 provider 调度命令。 |
| `skills/root-cause.md` | 删除旧“三次同处失败”规则，写入路线否定、drift、五次有效失败和恢复链。 | 不把普通红测都计为模型失败。 |
| `skills/split-work.md` | 加入 current leaf 内的依赖感知 work units、独立并行、共享写面 owner 和分支验收。 | 不把 current leaf 错等于一个 agent；不强制全局并行。 |
| `hooks/README.md` | 更新为下一版本真实运行方式。 | 不再把旧 0.8 Stop 行为描述成当前行为。 |
| `lib/managed.js`、`lib/evidence.js`、`lib/limits.js`、`package.json`、构建脚本 | 覆盖新增文件、安装/升级/回滚、selfcheck、candidate、证据和版本身份。 | 不弱化 push gate、真实载体或回滚。 |

## 七、派发时的 work-unit 图

激活后只建立一个 Harness lifecycle current leaf，建议名为 `HLNEXT-IMPLEMENTATION`。以下 NV 编号是 leaf 内的 work units，不是多个 competing current leaves。

初始硬依赖：

```text
NV00 ──┬──> NV01 ──┐
       └──> NV02 ──┴──> NV03 ──> NV04 ──> NV05 ──> NV06
```

NV01 与 NV02 写面独立时并行；其余箭头表示下游设计或验收真实依赖上游结果。指导模型仍需 fresh-check 写面后决定实际并发。

### NV00 — 可验证源码基线

- 目标：把当前 0.9.1 快照绑定成可开发、可复现、可构建候选的明确基线。
- 依赖：无。
- 能力偏好：工程模型；从当前工具面选择，不写死具体模型。
- 允许写：`test/**`、`scripts/timed-test.js`、`scripts/build-candidate.js`，以及为运行这些资产所必需的最小 `package.json` 修正。
- 禁止：修改产品行为；伪造 Git commit；push/release；干扰 Poracode。
- 做法边界：先检查是否存在一个证据更强且明确属于本项目的完整源码载体；没有就直接以当前快照的文件清单和摘要为 source baseline，重建缺失测试/候选脚本，不因“没有 Git”空转。只有发现两个相互冲突且无法用证据判权威的载体才 `BLOCKED` 请求用户选择。
- 直接验收：11 个现有 JS 文件仍通过语法；`npm test` 实际执行非零数量测试；`npm run selfcheck` 不再因缺脚本失败；candidate builder 可重复地产出同摘要候选；产品文件相对输入基线无行为改动。

### NV01 — 最小上下文与委派账

- 目标：实现 R05、R06、R08、R10 和轻量状态合同。
- 依赖：NV00 accepted。
- 能力偏好：工程模型。
- 主要写面：`lib/tree.js`、`lib/delegation.js`、必要时 `bin/hl.js`、对应 tests。
- 禁止：provider 调用、模型目录、完整 prompt/transcript 持久化、取消唯一 current leaf。
- 直接验收：最小投影字段齐全；缺字段保留 UNKNOWN；账与 project/leaf 绑定；幂等重放不重复计数；stale 账不冒充 live；模型无需读取全项目即可得到当前 work unit 包。

### NV02 — 当前工具面与指导文本

- 目标：实现 R01-R04、R15-R17，并消除静态模型维护。
- 依赖：NV00 accepted；与 NV01 写面不重叠时可并行。
- 能力偏好：工程模型。
- 主要写面：`lib/install.js` 当前 `INSTRUCTION`、可选 `lib/capabilities.js`、对应 tests。
- 禁止：修改历史 `PREVIOUS_*` 常量；添加 provider adapter/credential/UI scraping；把本文件里的历史模型例子写成目录。
- 直接验收：两个不同 capability fixtures 得到各自临时投影而无需改 Harness 源码；空 manifest 返回 UNKNOWN；指导文本明确模型直接调用 agent 工具；安装迁移只替换已识别旧指令。

### NV03 — 依赖感知并行与五分钟监督

- 目标：实现 R07-R11 和资料调查不冻结独立工作的规则。
- 依赖：NV01、NV02 accepted。
- 能力偏好：工程模型。
- 主要写面：`lib/hook.js`、`lib/work.js`、`skills/split-work.md`、`hooks/README.md`、对应 tests。
- 禁止：Harness 自己 spawn/poll/interrupt；全局串行；固定并发数；用 activity 续跑或宣称 progress。
- 直接验收场景：
  - 两个独立、写面分离的 work units 可以同时 active；
  - B 依赖 A 时，A 只有 `accepted` 才解锁 B；
  - 重叠写面被标 conflict，需要 owner/重拆/串行；
  - 一个分支 blocked 不冻结独立分支；
  - 300 秒到期产生只读 heartbeat reminder，提前完成立即返回；
  - heartbeat/activity 不更新 semantic progress；
  - 沉默和长工具调用不触发干预，drift/越界/真实 blocker 可以触发。

### NV04 — 有效失败与模型恢复链

- 目标：实现 R12-R14。
- 依赖：NV03 accepted；因为会重叠 `delegation/hook/work` 写面，默认串行。
- 能力偏好：工程模型；本 work unit 自身正常开发不等于触发产品恢复租约。
- 主要写面：`lib/delegation.js`、`lib/hook.js`、`lib/work.js`、`skills/root-cause.md`、对应 tests。
- 直接验收场景：
  - 同一普通模型家族五个不同语义失败后下一轮为 Terra xhigh；
  - 普通测试红、provider error 和同根多错不增加计数；
  - 重复被否定路线标 drift，不伪增次数；
  - Terra 失败后直接到 Sol，不获得五次；
  - Sol 默认 3 次且只有实质新路线消耗；
  - 同问题换 Grok 通道/会话/名字不降级；
  - 当前问题 PASS 清租约，独立分支和新问题不被永久升级。

### NV05 — 集成、安装与候选验收

- 目标：把前面能力接入真实 Harness 运行面，完成下一版本候选，不削弱 0.9.1 既有边界。
- 依赖：NV04 accepted。
- 能力偏好：工程模型；可以并行运行互不争用的测试矩阵，integration owner 唯一。
- 主要写面：全候选集成所需 Harness 文件、tests、scripts、package identity 和文档；按 fresh diff 精确收敛。
- 禁止：push/release；改写历史官方常量；删除回滚和证据门；干扰 Poracode。
- 直接验收：unit/integration/selfcheck/candidate 全通过；project 与 managed 安装、0.9.1 upgrade、fault rollback、runtime identity、Hook definition、native push gate 回归通过；candidate 文件清单完整；旧版本迁移文本保持原摘要；无 provider adapter、daemon、credential 或静态模型目录。
- 候选版本：完整源码若仍为 0.9.1，默认构建 0.10.0 candidate；fresh source 已有更高版本时按当前版本顺延，绝不回退。版本号不构成发布授权。

### NV06 — 独立产品验收

- 目标：由未参与实现的 reviewer 只读核验需求、目标、验收、测试和最终候选，而不是相信 writer 的 done。
- 依赖：NV05 candidate accepted by supervisor。
- 模型：从当前工具面选一个未参与候选实现、适合工程复核的模型；不因为“需要独立”就静态写死 Terra/Sol。
- 写面：只允许验收报告和必要的只读测试产物；reviewer 不直接修候选。
- 必查：R01-R18 全覆盖；指导模型而非 Harness 调 agent；动态模型投影；最小上下文；route basis；安全并行；五分钟 heartbeat；accepted 才解锁；busy≠progress；失败去重；Terra/Sol 问题级恢复；旧系统只失去未来权威而非自动不可读；安装、回滚、push gate 和 Poracode 边界无回归。
- 结论：PASS 才能关闭 current leaf；FAIL 精确返回对应 work unit 返修并重新走受影响验收。NV06 PASS 仍不代表 pushed/released。

## 八、整体验收矩阵

| 验收组 | 必须证明的正例 | 必须证明的反例/负例 |
| --- | --- | --- |
| 产品边界 | 指导模型收到规则并直接使用现有 agent 工具 | Harness 源码不存在 provider start/poll/stop、credential、daemon、UI/transcript 猜测 |
| 动态模型 | manifest/tool surface 变化即可改变临时列表 | 旧快照、记忆和模型名字不能冒充当前 availability |
| 上下文 | 当前 work unit 可以从最小包开工 | 不要求全仓审计，不允许声称理解整个项目 |
| 路线 | route basis 先用最短直接证据验证关键判断，再让实现命中 goal/direct acceptance；UNKNOWN 可增量调查 | 不列固定三方案，不因默认实现跳过当前重点；诊断手段不自动变成最终产品架构 |
| 并行 | 独立 work units 并行；资料查询不冻结独立问题 | 依赖、重叠写面和共享现场不能无协调并行 |
| 心跳 | active 时 300 秒轮询；多个 agent 可合并观察 | heartbeat、日志和 running 不算 progress；正常沉默不介入 |
| 完成 | reported_complete 后独立验收；accepted 解锁 | SubagentStop、文件落盘、自报 done、一个分支 PASS 不等于 leaf PASS |
| 失败 | 同一普通模型家族五个不同语义失败触发 Terra；同一家族跨通道共享计数；去重和 problem fingerprint 稳定 | 中间红测、provider error、同根多错不消耗；drift 不伪装新机会；不得机械换家族套取新预算 |
| 升级 | Terra 一次后 Sol 默认三次；PASS 后复位 | 换通道/会话/名字不能降级；升级不污染其他分支或永久项目 |
| 兼容性 | 0.9.1 upgrade、project/managed、identity、rollback、evidence、push gate 全通过 | 不改写历史迁移常量，不把 candidate 冒充 release |

## 九、已发现的文档和实现冲突

下一版本候选必须同时处理，不能只改一段 prompt：

- `lib/install.js` 当前 `INSTRUCTION` 缺少 work unit、运行时模型清单、心跳和分支验收；只更新当前指令，历史 `PREVIOUS_06/07/08_*` 保持原样。
- `lib/hook.js` 当前把任意 verify/file 变化当 progress，并以同一 verification digest `<3` 继续；这与 semantic progress、drift 和五次有效失败冲突。
- `skills/root-cause.md` 当前写“同一处失败三次就停”；必须由新失败语义取代。
- `skills/split-work.md` 当前只描述连续拆 leaf；必须补充一个 current leaf 内的依赖感知 work units。
- `lib/work.js` 当前只报告整个 turn/leaf 的文件和 verify 变化；必须增加分支状态并停止把 activity 冒充 progress。
- `hooks/README.md` 标题和内容仍是旧 0.8 Hook 行为；必须与候选真实行为同步。
- `bin/hl.js`、`lib/limits.js`、`lib/install.js` runtime identity 和测试/候选脚本要覆盖新增模块，否则会出现“源文件存在但安装包/自检不认识”的分裂候选。

继续保留：

- `lib/tree.js` 的唯一 current leaf；它是生命周期容器，不是单-agent 锁。
- `authorization.json` 对 project/session/turn/leaf/stage 的精确绑定；work unit 只能缩小投影，不能扩大授权。
- push 一次性确认、真实证据、安装身份、回滚和 working-copy/candidate/release 区分。
- Trading、KTERP、Syn 历史 stage 中明确的 single-writer 约束；它们是局部事实，不被通用并行默认倒推改写。

旧的下一版本记录中以下说法已被本基线取代：

- “任何子代理没完成就暂停整个指导流程”改为“只暂停 dependents，独立分支继续”；
- “Harness/provider adapter 自己枚举、路由和调用模型”改为“指导模型读取当前工具面并直接调用”；
- “混合任务一定拆成多个 current leaves”改为“一个 current leaf 内可有多个 work units”；
- “忙碌或多次普通红测就是失败/进展”改为本文件的 semantic progress/effective failure。

历史 memory 不在本次方案编辑的写面内，也不应改写旧事实。候选完成时另写一条 superseding note，明确新规则从哪个版本开始生效。

## 十、未来可直接使用的 Kickoff

下面文本现在只是未来派发载体，不是本轮执行授权。只有当前用户明确把它作为“开始/继续下一版本开发”的指令发出后，才允许建立 current leaf 和启动 writer。

```text
开始 Harness Lite 下一版本候选开发。以 NEXT-VERSION-DISPATCH-PLAN.md 的 R01-R18、work-unit 图和验收矩阵为冻结基线。

你是唯一指导/验收模型，不与 writer 竞争写产品代码。先 fresh-check 当前源码载体、已有 WIP、Harness 状态、用户边界和当前真实 agent 工具面；不得依赖静态模型记忆。若没有更强且无冲突的完整源码载体，直接以当前快照摘要作为 NV00 baseline 并补齐测试/候选资产，不因缺 Git 空转。只有两个权威源码载体真实冲突时才停下来问我。

建立一个 stage 和一个 current leaf（HLNEXT-IMPLEMENTATION）；NV00-NV06 是 leaf 内 work units，不建立 competing current leaves。按硬依赖推进；独立且写面不重叠的 work units 由你自主并行，依赖、重叠写面和共享现场由你重拆、设唯一 integration owner 或串行。

每次派发只给当前 goal、direct acceptance、allowed/forbidden、相关 facts/entry points、disproven routes、UNKNOWN、route basis、dependencies 和 result contract。开写前先用最短直接证据验证会改变路线的关键判断，但不要把诊断手段自动做成最终产品架构。不要要求 writer 理解整个项目，也不要替它规定完整 HOW。工程优先考虑当前可用 Grok 家族，前端优先当前可用 Gemini 家族；实际模型必须来自本轮真实工具面。

你直接调用现有 agent 工具。每个 active work unit 最长五分钟做一次 wait/status；可以一次合并轮询多个 agent。正常沉默、长工具和 provider 延迟不介入。只有直接证据表明卡死、blocker、跑偏、越界或共享状态冲突才 message/interrupt/takeover。独立分支可以继续，dependents 必须等上游 accepted。

子代理只有明确报告 COMPLETE 才进入你的独立验收；只有 direct acceptance PASS 才标 accepted 并解锁依赖。PARTIAL/BLOCKED 不冒充完成。activity 与 progress 分开；文件、日志、测试数和 running 不能单独证明进展。

只登记被直接证据否定的实质决定。同一普通模型家族五次不同有效失败后，当前问题下一轮升 Terra xhigh；同一家族跨通道共享计数，不得机械换家族套取预算。Terra 一次完整恢复仍语义失败则升 Sol xhigh；Sol 默认三次实质不同完整恢复。工具/提供方故障不消耗机会。升级只绑定当前问题，PASS 后复位，换通道/会话/名字不能给同一问题降级。

按 NV00 到 NV06 完成 supervisor acceptance 和独立 reviewer PASS。writer done、Harness done、candidate PASS 都不代表 pushed/released。未经当前用户另行精确确认，不 push、不 release；绝不杀死、重启或干扰 Poracode、watchdog、bridge。
```

## 十一、负责人派发前复核

### 复核结论

- `需求覆盖：PASS` — R01-R18 已分别绑定运行协议、代码面、work unit 和验收矩阵。
- `架构边界：PASS` — Harness 只指导、投影和记轻量账；实际 agent 调用仍由指导模型完成。
- `Lite 原则：PASS` — 没有 provider adapter、daemon、credential、静态模型目录或全项目预读。
- `并行一致性：PASS` — 唯一 current leaf 与 leaf 内并行 work units 不冲突；局部 single-writer 仍可覆盖默认。
- `失败/升级：PASS` — 路线失败、验收失败、普通红测、工具失败和 drift 已分开；Terra/Sol 是问题级租约。
- `文档冲突：PASS` — 已列出所有当前可见冲突面，并绑定到具体 work unit，不会只改 prompt 留下旧 Hook/skill 行为。
- `Kickoff：PASS` — 已明确源码 baseline、动态选模、派发、五分钟心跳、介入、验收、升级、回归和禁止事项。
- `载体：SNAPSHOT-ONLY` — 当前目录没有可用 Git 历史且缺测试/构建脚本；这由 NV00 解决，不再作为派发前的形式性阻塞。push/release 仍不在授权内。
- `独立候选验收：PENDING BY DESIGN` — NV06 只能在真实候选产生后执行，不能在派发前伪造 PASS。

### 当前停点

派发包已经准备好。下一步只剩当前用户明确下达“开始/继续下一版本开发”，届时指导模型才可以执行 Kickoff、建立唯一 current leaf 并直接派发 NV00。现在没有 writer、current leaf、产品改动、push 或 release。
