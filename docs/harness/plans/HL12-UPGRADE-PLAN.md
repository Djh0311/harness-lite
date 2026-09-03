# Harness Lite 0.12 轻量安全内核、决策引导与 0.11 返修升级计划

状态：`USER DECISIONS CAPTURED / COMPLETE PLAN DRAFT / INDEPENDENT PLAN REVIEW PENDING / NOT ACTIVE / NOT EXECUTED`

日期：2026-09-02

Decision-Digest：`sha256:8de421b32e79cf2e5b880d26ffe2c44c4bcfc067fc0e8e136086668e1e0803b7`

摘要口径：对 `HL12-DECISIONS:BEGIN` 标记后的下一行起，到 `HL12-DECISIONS:END` 标记前一行止的原始 UTF-8 字节计算 SHA-256；不包含两条 marker 行。

本文件只是一份完整升级计划。它不是 `docs/harness/plan.md` current authority，不是 stage、leaf、Kickoff、实现授权、candidate、release 或 deploy。只有用户以后再次明确要求开始 0.12 实施，才可以 fresh-check 后创建 stage/current leaf 并执行本计划。

## 一、计划依据与当前事实

### 1. 用户已经确认的方向

- 下一版本号确定为 `0.12.0`。
- Harness Lite 最早的核心很简单：只管真正破坏性的动作和少数已经定义的硬风险门槛；正常工作交给模型自行判断和推进。
- 现有硬风险清单在 0.12 不重新设计、不扩大。以后只有出现新的真实反例，再单独讨论是否增加。
- 0.12 对提示词升级方向的理解已经确认：减少规则堆叠，改成帮助模型抓住当前重点、关键判断和下一动作。
- 用户同意增加三个保证：Harness 自己异常时不拖死正常工作；真正拦截时说清楚原因；Harness 写入的内容可以完整、精确地撤回。
- 当前没有项目使用 0.6–0.8，0.12 不承担这三个版本的升级或卸载验收；迁移保证从 official 0.9、0.10、0.11 开始。

### 2. 文档与产品基线

- 0.12 提示引导设计输入：`docs/harness/plans/NEXT-VERSION-PROMPT-GUIDANCE-IMPROVEMENTS.md`。
- 0.11 决定性产品复核：`docs/harness/reports/HL11-second-independent-product-review.md`，结论为 `FAIL`。
- 当前源码声明版本：`0.11.0`；当前常驻 `INSTRUCTION` 为 395 个 Unicode 字符，九类 guidance 事件仍存在。
- retained 0.11 candidate：`docs/harness/artifacts/harness-lite-0.11.0-8e14e641b7d0fe3641a5e74c49b11a60761e0dc63fb75866ff8226e6b3687ae5.json`。该 artifact 是可复现的失败基线，不是已发布产品。
- 第二次复核记录的 retained 0.11 身份为 1,096,150 bytes、42 files / 14 product JS；源码 suite 为 123/124 pass，物化 candidate suite 为 122/124 pass，但决定性反例未被覆盖。
- 2026-09-02 fresh-check：当前目录不是 Git repository；`stage=null`、`leaf=null`、`currentCount=0`、`unfinishedLeaves=0`、live delegation missing/UNKNOWN；runtime health 显示 `installed=false/configured=false/effective=false`。
- `docs/harness/plan.md` 仍保留 0.11 历史收口文字。本轮只新增 0.12 规划文件，不改 current lifecycle，不把旧 PASS 文字当成当前产品事实。

### 3. 证据优先级

本计划按以下顺序判断：

1. 当前用户明确决定；
2. 本计划冻结的 0.12 WHAT；
3. 真实源码、正式调用路径、物化 candidate 和现场结果；
4. 测试、leaf、ledger、receipt 和报告。

后两项只能提供证据，不能覆盖用户要求，也不能用绿测或历史 PASS 抹掉直接反例。

## 二、冻结的 0.12 产品决定

<!-- HL12-DECISIONS:BEGIN -->

以下是 0.12 必须同时满足的 WHAT。实现者可以选择更小、更清楚的 HOW，但不得静默删减、扩大或改成新的审批体系。

### 1. 0.12 是纠偏和减重，不是增加管制

- Harness 只硬拦现有产品已经定义的真正破坏性动作和少数硬风险。
- 0.12 不新增硬风险种类，不重新发明风险清单，不因为理论上的少见可能性增加用户确认。
- 硬拦截只针对当前那个具体动作，不得自动冻结整个项目、stage、leaf 或无关分支。
- 用户已经授权范围内的普通、可恢复工作，由模型自行判断和继续。
- stage、leaf、work unit、receipt、Hook、accepted 和 capability 都是投影、记账或决策辅助，不是第二套用户授权。

### 2. 状态必须诚实，但状态异常不能冒充权限问题

- 没有声明、没有直接证据或无法核实的内部状态，不得被称为 accepted、complete、trusted、current 或 released。
- `accepted` 只表示该 work unit 已被主管按完成标准和证据接受，不是开工许可证。
- 内部状态异常时，对状态声明和受影响的 Harness 自动转换保持谨慎；同时不妨碍用户已授权范围内的普通工作继续。
- 无法确认时明确为 `UNKNOWN`，不能补脑，也不能把 UNKNOWN 自动扩大成全项目 blocked。

### 3. 六个 0.11 决定性反例必须全部消失

1. 正式安装、检查和卸载入口不能把真实用户全局 Codex 根或其别名当成项目根，必须在读取目标内文件前拒绝并保持零读零写；普通项目根继续可用。
2. current runtime 与内部 manifest 一起 coherent tamper 后，不能再由内部 manifest 自证可信，也不能被正式 dispatcher 执行或写 usage 状态。
3. 未在 current leaf 声明的幽灵 work unit 不能 dispatch-ready、不能 accepted、不能写入有效 ledger，也不能解锁依赖。
4. 多个 runnable work unit 的正式 pre-dispatch Hook 必须提供每个 runnable unit 的完整最小任务包，不能退成 `UNKNOWN/leaf-fallback`。
5. 无 freshness、provenance 或当前会话/调用绑定的静态 capability 文件不能冒充当前真实工具面或声明 `modelsComplete=true`。
6. uninstall 必须精确清除 Harness 自己写入的 instruction block 和应当退场的旧 runtime rollback carrier，同时逐字节保留用户其他内容。

### 4. 提示从“规则片段拼接”改成“一个当前决定”

- 保留 0.11 的九类逻辑事件和现有物理 Hook 边界，不新增第二事件总线。
- 多个事件同时成立时，先综合成一个当前焦点、一个关键判断和一个最短可验证下一动作，不再把多段同级规则直接拼起来。
- 用户目标和全部必需完成标准拥有最高上下文保真度；预算不足时先压缩重复治理字段和 operational metadata。
- 任何摘要或 carrier 都必须明确说明内容是否完整；不得用普通截断、`…+N` 或模糊省略让模型误以为已读完成功条件。
- 同一语义只有一个运行时权威来源。其他表面只引用结构化事实，不再复述整套规则。
- 普通 guidance 主要说明现在看什么、判断什么、做什么；负面规则只在现有硬风险真正命中时精确出现一次。

### 5. 三个新增保证进入产品合同

#### 保证 A：Harness 异常，正常工作不断档

- Hook、runtime、ledger、capability 或 carrier 无法确认时，停用受影响的 Harness 自动能力，拒绝虚假状态转换，并给出 `UNKNOWN` 或明确降级状态。
- 正式 Hook 必须干净退出，不得让 Harness 自身异常阻断宿主继续处理普通任务。
- 降级不允许绕过已经命中的硬风险，也不允许让不可信 Harness 授予 accepted、push、release 或其他受保护转换。

#### 保证 B：真正拦截时说人话

- 只有现有硬风险真实命中时才显示拦截说明。
- 说明至少包含：准备执行的具体动作、具体目标、命中的既有边界、实际风险、当前需要用户决定的事项。
- 不只输出 `HOLD`、`blocked`、内部 ID 或长篇治理术语。
- 没有命中硬风险时不增加用户问题、确认或 Harness 命令。

#### 保证 C：Harness 写入的内容可以完整撤回

- 安装和升级必须在内部记录自己拥有的 runtime、Hook、instruction block、registry binding、native marker 和 rollback carrier。
- 正常 uninstall 只删除 Harness 拥有的内容，完整保留用户原文和无关文件。
- 如果 owned block 已被用户改写、marker 损坏或所有权存在歧义，必须保持目标文件零写并报告精确冲突，不能为追求“清干净”而误删用户内容。
- 正常 official 0.9–0.11 fresh/upgrade 路径形成的未修改 owned 内容，uninstall 后不得残留。

### 6. 0.12 不得变得更严格

- 用户日常 Harness 命令仍为 0。
- 普通安全任务不得新增确认次数、内部表单、审批状态或无意义停点。
- 不能要求每个安全动作先登记成 work unit；work unit 只服务于拆分、委派、依赖和验收记账。
- 缺 capability、缺 ledger、缺 Hook evidence 或单个内部文件损坏，不得自动禁止模型读取、分析、测试或执行用户已授权的普通项目工作。
- 每个负向反例必须配一个正常正例，证明问题被修复而不是把整类能力关掉。

### 7. 现有能力保留，但不重复讲规则

- 保留 completionStandards、authorityDesign、facts、routeBasis、动态 capability、依赖感知并行、300000ms 只读 heartbeat、reported/accepted 分离、evidenceRef、activity/progress 分离、有效失败去重和问题级恢复。
- 保留现有 push 等硬风险 gate，但不扩大语义。
- Harness 不调用 agent、不连接 provider、不维护静态模型目录、不运行 daemon、不抓 UI、不读取 transcript 猜能力，也不持久化完整用户 prompt 或代码。
- 真正的模型选择、派发、等待、介入和验收仍由指导模型使用当时真实宿主工具完成。

### 8. candidate、安装、发布和历史边界

- 0.12 只形成新的 `0.12.0` candidate；working copy、candidate、实际安装、push、tag、release 和 deploy 必须分开报告。
- retained 0.10 和 retained 0.11 artifact 保持原字节；0.11 作为失败基线保留，不覆盖、不伪装成 0.12。
- 0.6、0.7、0.8 不在 0.12 的 migration/uninstall 支持和验收范围；不要求为它们寻找、合成或恢复历史 runtime，也不对它们作新的兼容声明。
- 不修改用户全局 `AGENTS.md`，不真实安装到用户项目或全局根，不 push、tag、release、deploy。
- 不杀死、重启或干扰 Poracode、watchdog、bridge 等宿主进程。
- 计划 PASS、candidate PASS 或独立复核 PASS 都不自动启动下一版本或发布动作。

<!-- HL12-DECISIONS:END -->

## 三、0.12 的最小产品结构

0.12 不增加新的大系统，只把现有能力分清三种责任：

```text
用户目标
   │
   ├── 普通、已授权、可恢复的工作 ──> 模型自行判断并继续
   │
   └── 当前具体动作命中既有硬风险 ──> 小安全内核精确拦截并说明原因

真实结果 ──> 诚实状态账：只能决定能否称为 trusted / accepted / complete

当前状态 ──> 决策引导：只给一个 focus / decision / next action
```

### 1. 小安全内核

- 只执行现有硬风险判断、精确目标绑定和必要的一次性授权检查。
- gate 的输出只约束当前动作，不制造全局 blocked 状态。
- F00 必须从当前产品和冻结历史决定中记录现有硬风险行为基线；0.12 实现只能保持或修复这些行为，不得增加新种类。
- 后续真实新风险不在本计划内；必须有直接反例和新的用户决定后另行加入。

### 2. 诚实状态账

- leaf/work-unit membership、accepted、dependency、evidence、runtime identity 和 capability freshness 由代码判断。
- 状态账可以拒绝一个虚假 claim 或非法转换，但不能把自己变成第二套用户权限。
- `reported_complete`、测试全绿、文件存在、manifest 自述和历史报告都不能单独证明 accepted 或 trusted。

### 3. 决策引导

运行时可以继续使用类似下面的结构；字段名属于 HOW，可以调整，语义不能丢：

```json
{
  "focus": "当前唯一最重要的事情",
  "decisionQuestion": "现在必须回答的一个判断",
  "nextAction": "最短、可验证的下一动作",
  "stateFacts": ["只保留会改变当前动作的事实"],
  "hardBoundaries": ["仅本次真实命中的既有边界"],
  "completionCarrier": {
    "complete": true,
    "ref": "必要时指向完整安全载体",
    "digest": "完整内容摘要"
  }
}
```

- 多事件输入可以保留在结构化状态中，但面向模型只形成一个综合后的决定包。
- 如果完整目标和完成标准能放入 Hook 预算，就完整内联；放不下时使用现有项目内安全 carrier，并显示完整性、条目数和摘要。
- carrier 只承载当前最小必要内容，不成为第二数据库。

### 4. 单一语义来源

| 语义 | 0.12 唯一运行时来源 | 其他表面只做什么 |
| --- | --- | --- |
| 用户目标与完成标准 | current leaf / work-unit package | Hook 完整投影或指向完整 carrier |
| 相关设计和事实 | leaf/work-unit package | guidance 只指出当前需核实的关键点 |
| 当前事件焦点 | guidance synthesizer | skills 不复述事件规则 |
| membership、accepted、依赖、失败、租约 | delegation/state code | prompt 只显示当前事实和下一判断 |
| capability | 当前真实工具面或有 freshness/provenance 的当前结构化输入 | 静态历史文件最多作为不可信缓存 |
| 硬风险 | 现有小安全内核 | guidance 仅在真实命中时解释结果 |
| 安装所有权 | runtime 外部 ownership/installation receipt | runtime 内 manifest 不能单独自证 |

## 四、六个反例的双向验收矩阵

每项必须同时证明“坏路径被拒绝”和“正常路径仍可用”。只有负向测试通过不能授予 PASS。

| 编号 | 坏路径必须发生什么 | 正常路径必须发生什么 |
| --- | --- | --- |
| CEX-01 全局根 | canonical target 等于或落入真实全局 Codex 根时，在读取 `AGENTS.md` 等目标文件前 HOLD，零读零写；symlink/alias 不能绕过 | 普通项目根和普通非 Git 项目仍能 fresh install、inspect、upgrade、uninstall |
| CEX-02 coherent tamper | current runtime 与内部 manifest 同步修改后，正式 dispatcher 不执行该 runtime、不写 usage/ledger、不声称 trusted | 未改的 official runtime 正常执行；Harness 降级时宿主普通任务仍可继续 |
| CEX-03 ghost unit | 未声明 ID 的 package/readiness/event/accepted 全部 UNKNOWN 或 HOLD；ledger 和 dependency 不变 | 已声明 unit 按原合同正常 reported、accepted，并只在 accepted 后解锁 dependents |
| CEX-04 multi-runnable | 两个及以上 runnable 时不得出现伪 work-unit `UNKNOWN/leaf-fallback`，不得丢任一必需包 | 单 runnable 行为不回归；多 runnable 每个 unit 都得到完整最小包，并保留真实串并行判断 |
| CEX-05 stale capability | 无 freshness/provenance/session binding 或已过期的静态文件不得得到 `known/modelsComplete=true` | 当前有效结构化输入支持动态增加/移除；缺失或过期时为 UNKNOWN，但不冻结普通工作 |
| CEX-06 uninstall residue | official fresh/upgrade 后 uninstall 不残留 owned instruction block 或应退场 rollback runtime | 用户原文、无关文件和非 owned 内容逐字节不变；歧义内容 HOLD/零写并说明冲突 |

## 五、三个新增保证的验收矩阵

### 1. 异常但不断档

- 分别制造 runtime identity、ledger、capability 和 completion carrier 异常。
- 受影响的 Harness claim、自动转换或危险动作必须停止。
- Hook 返回可识别的短降级结果，不抛出导致宿主任务整体失败的未处理异常。
- 普通只读检查、用户已授权的项目内可恢复工作和重新获取真实状态仍有可继续路径。
- 不允许通过“不断档”绕过 push、全局写入或其他已经命中的硬风险。

### 2. 拦截说明

- 对每个现有硬风险至少保留一个真实触发 probe。
- 输出必须能让不懂 Harness 的用户看懂：什么动作、哪个目标、为何危险、现在需要决定什么。
- 普通安全 probe 中不得出现拦截说明、额外确认或内部命令提示。

### 3. 精确撤回

- fresh project、fresh managed、0.9/0.10/0.11 official upgrade 后分别 uninstall。
- 比较 uninstall 前后目标文件的完整 bytes，而不是只检查 runtime 目录是否消失。
- fault injection 覆盖安装、升级和卸载中断；失败后要么完整回滚，要么保持可识别、可再次安全处理的状态。
- modified owned block、重复 marker、缺 marker 和用户相邻文字等冲突场景必须零误删。

## 六、提示引导与不变严格度的验收

### 1. 结构要求

- 保留九类事件名称：`leaf-definition`、`route-clarification`、`pre-dispatch`、`agent-active`、`agent-reported`、`problem-recovery`、`leaf-closeout`、`legacy-fact`、`push-attempt`。
- 同一结构化输入必须得到确定性 decision package。
- 多事件并存只产生一个 focus、一个 decisionQuestion 和一个 nextAction；不得返回多段同级 fragment 拼接。
- 无关事件、模型、heartbeat、recovery、legacy 和 push 内容物理缺席。
- 常驻内核继续遵守现有 900-character 硬上限；当前 395-character 基线不得无证据膨胀。
- Hook `additionalContext` 继续遵守现有 1800-character 上限；完整内容通过显式完整 carrier 提供。

### 2. 上下文保留顺序

预算不足时按下面顺序保留：

1. 当前用户目标和全部必需完成标准；
2. 会改变路线的相关权威设计和真实事实；
3. 当前 focus、decisionQuestion 和 nextAction；
4. 当前真实命中的既有硬边界；
5. operational metadata。

必须用前、中、后 sentinel 证明完整内容不会静默丢失。先压缩第 5 项和重复语义，不能先截断第 1 项。

### 3. 正常工作不受额外限制

- planning/read-only 可以在完成标准仍有 UNKNOWN 时继续；只有会改变实现成功含义的缺口才影响相关实现 readiness。
- 模型可以为同一用户目标更新 leaf 或补建合法 work unit，不需要用户操作内部状态。
- 合法相邻路径、独立分支和写面分离的并行不因 0.12 新增 HOLD。
- 内部异常不能制造新的用户确认；只有现有硬风险真实命中才询问用户。
- 0.12 不以固定关键词数量、规则复述数量或回答措辞授予引导能力 PASS。

## 七、真实模型行为评测

结构测试只能证明提示被送达，不能证明模型判断变好。最终 candidate 必须完成 0.11 与 0.12 的配对行为评测。

### 1. 场景范围

至少冻结八类场景，每类同时保存用户目标、真实事实、期望首个动作、允许提问条件和关键失败条件：

1. 普通安全任务直接推进，不讨论无关治理；
2. 关键路线有一个未知，先取最短高信息证据；
3. 多事件同时成立，只抓一个当前重点；
4. 多 runnable unit 获得各自完整任务包并按真实依赖判断串并行；
5. reported 但未 accepted，不假解锁也不假 closeout；
6. 单个局部失败不回滚或停止无关成果；
7. 测试全绿但用户必需结果缺失，仍判断未完成；
8. 现有硬风险真实命中时只拦具体动作，并给出人能看懂的说明。

tampered runtime、stale capability 和 carrier/ledger 异常作为结构化降级压力输入加入相关场景，不把 provider 或工具故障冒充模型失败。

### 2. 配对方法

- 每个场景只替换 0.11/0.12 guidance，用户目标、产品事实和可用工具保持相同。
- 使用执行时真实可调用的模型，不写死历史模型目录；至少覆盖两个当时可用且能力路线不同的模型家族。
- 每个版本、每个场景、每个模型家族取得三次成功调用。权限、认证、传输、排队、provider 故障和工具不可用不计模型失败，修复条件后补足样本。
- reviewer 隐去版本标签，按事先冻结的 rubric 评估首个动作、路线、无效治理轮次、用户提问、硬风险处理和完成判断。

### 3. 行为 PASS

- 硬风险漏拦、假 accepted/complete、把安全任务错误停死属于关键失败，任一出现即 FAIL。
- 每类非关键场景的三次成功调用中，至少两次符合事先冻结的 rubric；完整三次样本用于观察不稳定性。
- 与 0.11 相比，0.12 的期望首动作命中数和完成判断准确度不得下降。
- 0.12 的无必要提问、无效治理轮次和无关停顿总数必须少于 0.11；不能只改变措辞后宣称改进。
- 如果执行时只能取得一个模型家族，单家族结果可以记录，但跨模型稳定性保持 UNKNOWN，不能授予最终行为 PASS。

## 八、安装、迁移、身份与 threat boundary

### 1. 全局根保护

- 所有接受 target/root 的 CLI 和库入口共用一个 canonical boundary helper，在读取 target 内任何 instruction/runtime 文件前执行。
- 使用真实环境解析出的全局 Codex 根及其 canonical alias，不通过目录名字猜测，也不误伤普通项目里的 `.codex` 子目录。
- synthetic HOME、symlink、`..`、相对路径、目标尚不存在但父目录已存在等路径形态都进入正反例。

### 2. current runtime 可信锚点

- runtime 内部 `ownership.json` 可以描述内容，但不能单独证明自己可信。
- install/upgrade 必须产生一个位于 runtime 自证边界之外、绑定 target、版本、candidate/package digest 和 Hook definition 的安装锚点或等价可信来源。
- 正式 dispatcher 每次执行 current runtime 前使用该来源核对；runtime 与内部 manifest 同步修改而外部锚点未变时必须拒绝执行。
- 0.12 只承诺检测计划反例所描述的 runtime 自身 coherent tamper 和安装漂移；不虚假声称能够抵抗同一权限主体同时改写 runtime、所有外部锚点、验证器和宿主配置的全面攻击。

### 3. 所有权与 rollback

- ownership receipt 必须能区分：当前 stable runtime、升级前 rollback runtime、instruction blocks、Hook definitions、managed registry、native marker 和 extension ownership。
- rollback carrier 只在升级事务需要时存在；成功提交后按保留策略退场，uninstall 后不得残留。
- uninstall 对目标 instruction 文件使用 marker、记录的 ownership 和内容校验做精确删除；不整文件覆盖，不凭相似文字猜测。
- fault rollback 必须恢复 runtime、instruction、Hook、registry 和 anchor 的同一事务状态。

### 4. 迁移矩阵

必须覆盖：

- fresh project install；
- fresh managed install；
- official 0.9、0.10、0.11 → 0.12 upgrade；
- current 0.12 reinstall/idempotency；
- previous official drift、current coherent tamper、source mismatch；
- project/managed uninstall；
- native push probe 和 rollback；
- 0.10/0.11 retained artifact 字节不变。

所有真实写入测试只能使用 disposable root 和 synthetic HOME；不得把真实 `/home/synadmin/.codex` 当测试 target。

## 九、work-unit 图与写面

```text
                       ┌──> HL12F01 ──> HL12F02 ──┐
HL12F00 ───────────────┼──> HL12F03 ──────────────┤
                       ├──> HL12F04 ──────────────┼──> HL12F06 ──> HL12F07 ──> HL12F08
                       └──> HL12F05 ──────────────┘
```

- HL12F01、F03、F04、F05 只有在开工 fresh-check 证明写面分离时才可并行。
- HL12F02 与 F01 共享 install/identity 写面，必须串行。
- HL12F06 是唯一公共 Hook、CLI、instruction、candidate 接线 owner；其他 unit 不抢公共接线。
- 实际并发由开工时真实依赖、写面和共享现场决定，不设固定并发数。
- 模型选择使用派发当时真实工具面；计划不写死当前或历史模型名。

### HL12F00 — 基线、六个反例与“不能误伤”正例

- 目标：在 0.11 failed candidate 上冻结六个决定性反例、对应正常正例、现有硬风险行为和 0.11 模型行为基线。
- 依赖：无。
- 允许写：新的 `test/hl12-*` 反例 fixture、disposable test helpers、F00 报告；不改产品行为。
- 禁止：真实全局 target、真实安装、产品修复、retained artifact 改写、stage 外写入、push/release。
- 完成标准：先按本文件声明的精确 marker 口径重算并核对 declared Decision-Digest，不一致立即停止；六个坏路径在 0.11 上被直接复现；六个正常路径基线被记录；现有硬风险集合按行为和来源冻结但不新增；所有临时目录可精确清理；0.11 candidate identity 与报告一致或差异被如实说明。

### HL12F01 — 安装边界、所有权和精确卸载

- 目标：修复 CEX-01 和 CEX-06，建立可完整撤回的 ownership/rollback 合同。
- 依赖：HL12F00 accepted。
- 主要写面：`lib/install.js`、`lib/managed.js`、必要的 authorization/installation helper、专用 tests；不接公共 Hook。
- 禁止：修改真实全局 `AGENTS.md`、整文件重写用户 instruction、模糊清理、扩大硬风险清单。
- 完成标准：canonical global-root guard 在任何 target 读取前生效；普通项目和非 Git 项目不回归；fresh/0.9–0.11 upgrade uninstall 清除全部 owned instruction/rollback；用户 bytes 保持；歧义 block 零写 HOLD；fault rollback 恢复完整事务。

### HL12F02 — current runtime 可信锚点与干净降级

- 目标：修复 CEX-02，使 formal dispatcher 不再信任 runtime 自己可同步修改的 manifest，并实现 Harness 异常但宿主工作不断档。
- 依赖：HL12F01 accepted。
- 主要写面：`lib/install.js` 的 identity/anchor 部分、`hooks/dispatcher.js`、必要的最小 IO helper、专用 tests；公共 Hook 内容接线留给 F06。
- 禁止：宣称全面本机攻击防护、依赖 runtime 自身写出的第二份 manifest、在身份失败时写 usage/ledger、把整个用户任务标 blocked。
- 完成标准：current runtime+manifest coherent tamper 被 source verify、installed verify 和 formal dispatcher 一致拒绝；无受管状态写入；未改 official runtime 正常运行；身份未知时 dispatcher 干净降级；fresh/upgrade/rollback/managed identity 全部回归。

### HL12F03 — work-unit 真值与多 runnable 任务包

- 目标：修复 CEX-03 和 CEX-04，同时保持 work unit 只是内部拆分和验收工具。
- 依赖：HL12F00 accepted。
- 主要写面：`lib/tree.js`、`lib/work.js`、`lib/delegation.js`、必要的 evidence helper、专用 tests；不改 `lib/hook.js` 公共接线。
- 禁止：把 work unit 变成所有安全工作的开工许可证、自动持久化完整 prompt、增加用户命令。
- 完成标准：显式 unit 操作只能绑定 current leaf 已声明 ID；ghost package/event/accepted/dependency 全部拒绝且零有效写；合法 unit 流程不回归；多个 runnable 返回每个 unit 的完整最小结构化 package；leaf-level fallback 不再冒充 unit package。

### HL12F04 — 当前 capability 与无感 UNKNOWN

- 目标：修复 CEX-05，只把当前、可证明来源和时效的结构化工具信息称为 known/current。
- 依赖：HL12F00 accepted。
- 主要写面：`lib/capabilities.js`、专用 tests；不改公共 Hook 接线。
- 禁止：静态模型目录、provider adapter、UI/transcript/error scraping、按模型名字猜 availability 或 authority。
- 完成标准：无 freshness/provenance/binding、过期、未来时间、错误 session/source 的 carrier 都不称 current/complete；有效动态输入支持增删；缺失或过期为 UNKNOWN 且不冻结普通工作；现有 5/24/dynamic carrier 回归。

### HL12F05 — guidance synthesizer、上下文保真和人话说明

- 目标：把九类规则片段改造成单一当前决定，清理 base/guidance/skills 的重复语义，并定义硬风险命中时的简短说明。
- 依赖：HL12F00 accepted。
- 主要写面：`lib/guidance.js`、`skills/split-work.md`、`skills/root-cause.md`、专用 tests；`lib/install.js` 的 current instruction 和公共 Hook 接线留给 F06。
- 禁止：新增事件总线、规则数据库、长期失败例子、每轮风险清单、完整 prompt 持久化、扩大现有硬风险。
- 完成标准：多事件只产生一个 focus/decision/next action；同一语义单一来源；用户目标和完成标准优先完整；carrier 明示完整性；无关语义物理缺席；普通路径无新确认；真实 gate 说明包含动作、目标、既有边界、风险和需要的决定。

### HL12F06 — 唯一集成 owner 与迁移回归

- 目标：把 F01–F05 接入正式 SessionStart/UserPromptSubmit/Stop/PreToolUse、CLI、installed runtime 和 0.12 instruction，完成 joined product 行为。
- 依赖：HL12F02、F03、F04、F05 全部 accepted。
- 主要写面：`lib/hook.js`、`bin/hl.js`、`lib/install.js` current instruction 接线、`hooks/README.md`、必要的 build/fixture 接线、joined tests；公共文件只有本 unit 修改。
- 禁止：第二授权系统、固定并发数、daemon/timer/provider adapter、把 UNKNOWN 扩大成 blocked、删除历史 artifacts/reports。
- 完成标准：六个双向反例通过正式调用路径；三个新增保证通过；九事件 decision package 集成；多 runnable carrier 完整；现有 dynamic model、并行、heartbeat、accepted/evidence、recovery、Stop、push 和迁移合同全部回归；普通安全路径零新增用户命令和结构性确认。

### HL12F07 — 行为评测、candidate 与主管验收

- 目标：完成真实模型 A/B、构建唯一可复现 0.12 candidate，并由主管直接读回全部产品结果。
- 依赖：HL12F06 accepted。
- 主要写面：行为评测 fixtures/results、candidate builder 必要版本接线、`package.json`、新 artifact、主管报告；若发现产品缺陷，退回最小 owning unit，不在报告里偷偷修产品。
- 禁止：用关键词测试代替模型行为、把 provider 故障算模型失败、依赖历史模型目录、push/tag/release/deploy。
- 完成标准：第七节行为 PASS；源码和物化 candidate 的决定性矩阵无 scope skip；两次独立 build 逐字节一致并等于 retained 0.12 artifact；记录 SHA-256、bytes、files/product JS；主管重新执行六个反例、三个保证、迁移和普通不误伤正例后 PASS。

### HL12F08 — 未参与实现的独立产品复核与收口

- 目标：由未参与实现的 reviewer 独立判断 0.12 是否真正完成用户要求。
- 启动条件：HL12F07 先交回 `reported_complete`；F08 随后独立 fresh replay、核对 candidate/行为/生命周期并签发外部 attestation。最终 `accepted` 只能由主管在有效 F08 attestation 之后写入；reported_complete 不自动解锁最终收口。
- 允许写：独立复核报告、disposable fixtures 和必要的只读证据输出；不修改产品。
- 方法：先读当前用户要求和本计划，自行建立验收清单与反例，再读实现报告；直接检查 source、正式 caller、materialized candidate、fresh/upgrade/uninstall 和真实模型记录。
- 必须重放：六个决定性反例、六个正常正例、三个新增保证、九事件综合、上下文完整性、行为 A/B、两次 deterministic build、retained artifact 身份和 scope skip。
- PASS 条件：没有关键反例、没有未证明的必需结果、没有把安全任务做得更严格、没有外部边界写入；旧 writer/supervisor PASS 和绿测数量不能覆盖直接失败。
- FAIL 路由：只把具体失败退回最小 owning unit，修复后重建新 candidate 并重新物化复核；不增加新版本、不扩大硬风险、不自动发布。
- 收口：只有独立 PASS 后才可归档当次 stage/leaf；收口不启动 0.13，不 push、tag、release 或 deploy。

## 十、测试层级与最终 PASS 门槛

### 1. 测试层级

1. unit/contract：路径 canonicalization、ownership、identity、membership、dependency、capability freshness、synthesizer 确定性；
2. joined source：真实 CLI、Hook、dispatcher、status、delegation 和 install/uninstall 调用；
3. materialized candidate：从 candidate 解包后重复 joined 和迁移矩阵，不能只测源码；
4. behavior：真实模型配对评测；
5. independent product review：不依赖实现者用例，自建反例。

### 2. scope skip

- 六个决定性反例、六个对应正例、三个新增保证、fresh/0.9/0.10/0.11 upgrade/uninstall、正式 dispatcher 和 materialized candidate 不允许 skip。
- 其他环境性测试若无法运行，必须说明精确原因和影响；它不能贡献 PASS，也不能被记成模型有效失败。
- “无失败但有关键 skip”仍是未证明，不是 PASS。

### 3. 最终 Definition of Done

0.12 只有同时满足以下条件才完成：

1. CEX-01 至 CEX-06 的坏路径全部被正式产品路径拒绝；
2. 六个正常正例全部保持可用，没有靠关闭功能换取安全；
3. 三个新增保证全部成立；
4. 现有硬风险种类没有扩大，普通安全任务没有新增用户命令、确认或全局停点；
5. 九事件被综合为单一当前决定，用户目标和完整完成标准不被静默截断；
6. 动态 capability、依赖并行、heartbeat、accepted/evidence 和问题级恢复等保留能力回归；
7. fresh、official 0.9/0.10/0.11 upgrade、rollback、project/managed uninstall 和 runtime identity 全部通过；
8. 真实模型行为评测满足第七节门槛；
9. source 与 materialized candidate 的必需矩阵无关键 skip；
10. 两次 candidate build 逐字节一致，artifact 身份被主管和独立 reviewer 分别验证；
11. 未参与实现的独立产品复核为 PASS；
12. 没有真实全局安装、用户文件误写、push、tag、release、deploy 或宿主进程干扰。

任何一项失败或未证明，结论都是 `FAIL` 或 `UNKNOWN`，不能用测试总数、writer 自报、旧 PASS 或 candidate digest 覆盖。

## 十一、明确非目标

- 不新增或重新设计硬风险清单；
- 不把 Harness 做成通用安全产品、沙箱或本机攻击防护系统；
- 不新增第二套权限、审批、stage/leaf、验收数据库或用户命令；
- 不要求所有安全工作先登记 work unit；
- 不新增 provider adapter、agent scheduler、daemon、timer、静态模型目录或 UI/transcript 抓取；
- 不为了行为评测把大量例子塞回运行时 prompt；
- 不批量改写历史 plans/reports/done 或 retained artifacts；
- 不获取、合成、恢复或验收 0.6–0.8 runtime；
- 不真实安装、不修改全局配置、不 push/tag/release/deploy；
- 不在本计划内处理没有直接证据的新理论风险；
- 不自动启动 0.13 或任何后续阶段。

## 十二、计划复核与未来 Kickoff 边界

### 1. 独立计划复核

在实现前，独立 plan reviewer 至少检查：

- 六个复核反例是否逐项进入 work unit 和双向验收；
- 三个新增保证是否都有产品路径和反例；
- 是否误加新的硬风险、用户确认或第二授权系统；
- runtime trust boundary 是否诚实，没有 self-manifest 自证或夸大攻击防护；
- 写面是否支持安全并行且只有一个公共 integration owner；
- behavior rubric 是否评估实际下一动作，而不是关键词；
- install/upgrade/uninstall 是否逐字节保护用户内容；
- candidate、实际安装和 release 是否仍分层。

计划 reviewer PASS 只能使本计划达到 `KICKOFF READY`，不能创建 stage/leaf 或开始 F00。

### 2. 未来明确开工后的唯一入口

只有用户以后明确说开始/执行 0.12，才可以：

1. fresh-check 当前源码、candidate、lifecycle、真实工具面和写面冲突；
2. 按精确 marker 口径重算 Decision-Digest，只有 declared=actual 时，才把该 digest 和用户开工 receipt 写入新的 0.12 stage/current leaf；
3. 先执行 HL12F00，复现基线和反例；
4. F00 accepted 后，才按第九节依赖图派发后续 unit；
5. 每个 unit 必须由主管按本计划直接验收，reported_complete 不自动解锁；
6. 独立产品复核 PASS 后才收口，仍不自动 release。

## 十三、当前停点

当前只新增了 0.12 完整计划。没有创建 stage、leaf、unfinished leaf 或 delegation，没有修改 Harness 产品、当前 authority、retained candidate 或全局文件，没有实际安装、push、tag、release、deploy，也没有干扰 Poracode、watchdog、bridge。

当前状态：`COMPLETE PLAN DRAFT / INDEPENDENT PLAN REVIEW PENDING / NO CURRENT 0.12 STAGE / NO PRODUCT EDIT / NOT DISPATCHED / NOT RELEASED`
