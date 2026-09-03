# Harness Lite 0.11 第二次独立产品复核

复核日期：2026-09-01  
复核类型：second-independent-product-review  
工作目录：`/home/synadmin/harness-lite-0.9.1`  
冻结计划：`docs/harness/plans/HL11-DISPATCH-PLAN.md`  
复核结论：**FAIL**

## 一、最终裁决

0.11 candidate 的身份和可重复构建成立，短内核、旧字段只读兼容、主要事件选择、并行/心跳、失败去重和 Terra/Sol 问题级恢复的大部分正反例也成立；但是用户要求的 0.11 产品能力**没有全部完成**。

存在会直接改变结论的生产路径反例：

1. 正式 `hl install --target ... --write` 可把用户全局 `~/.codex` 当成项目根，读取并改写其中的 `AGENTS.md`；产品没有全局 Codex 根的 fail-closed 边界。
2. current 0.11 runtime 被连同自身 `ownership.json.packageDigest` 一起 coherent tamper 后，会被 `verify06`、`inspect` 和正式 dispatcher 当成可信 current runtime，并继续运行、写 usage 观察文件。
3. current leaf 中未声明的“幽灵” work unit 可借 leaf fallback 获得 `dispatchReady=true`，被记录为 `accepted`，并解锁以该幽灵 ID 为依赖的其他 work unit。
4. 两个 runnable work unit 的正式 SessionStart pre-dispatch 路径退回 `id=UNKNOWN/status=leaf-fallback`，没有输出任一 work unit 的最小任务包。
5. 无 freshness/provenance 的项目静态 capability 文件可被声明为 `known/modelsComplete=true`，把历史模型目录冒充当前结构化工具面。
6. uninstall 虽返回 `UNINSTALLED`，但保留安装写入的 `AGENTS.md`/`CLAUDE.md` Harness block；升级后还保留完整旧 runtime rollback carrier。

以上任一关键反例都不允许裁决 PASS。绿测、旧 accepted ledger、既有 PASS 报告和 candidate 可重复构建不能覆盖这些实际调用事实。

## 二、方法与证据顺序

本复核先完整读取冻结计划，自行建立验收清单和反例，再读取相关源码、正式调用路径、candidate 和物化运行结果。只有在独立裁决已经形成后，才读取：

- `docs/harness/reports/HL11-F06-independent-product-review-PASS.md`
- `docs/harness/reports/HL11-supervisor-closeout-PASS.md`

没有把 leaf、测试名、测试数量、writer/主管报告或归档 accepted 状态当作产品事实。关键子检查的结果均由本 reviewer 读回源码、输出和物化现场；子 reviewer 的总结只用于分工，不作为最终证据。

一次初始 candidate build 因 reviewer 在 disposable 根下使用了错误相对路径而未启动；改用 `source/scripts/build-candidate.js` 后两次构建均成功。该失败是调用路径错误，没有产品证据影响。一次物化 suite 的隔离 `TMPDIR` 尚未创建导致 ENOENT；创建该精确目录后完整重跑通过，也不计产品失败。

## 三、权威、lifecycle 与边界事实

### 3.1 冻结身份

- 决策摘要口径：从 `HL11-DECISIONS:BEGIN` 标记后的下一行起，到 `HL11-DECISIONS:END` 标记前一行止，保留原始 UTF-8 字节和换行，不含 marker 行。
- 实际摘要长度：8564 bytes。
- 实算决策摘要：`sha256:2c615becc4704bd45eb4fa7cb6364fa7f7c36489d62d49349399f787d5f719ff`，与声明一致。
- 整份冻结计划实算摘要：`sha256:805ae40c435f0e718584d2a4db1566f41928e21b1e09e3ee3c1b2fe10560e7be`，与计划摘要声明一致。
- 当前用户要求、冻结计划中的用户决定以及实际源码/运行事实是本次判断依据；leaf、账本、测试和报告不替代这些权威。

### 3.2 当前现场

- 当前目录不是 Git repository。目录中虽有空 `.git/`，但 `git rev-parse --is-inside-work-tree` 返回 128 / `fatal: not a git repository`。
- 当前 lifecycle：`stage=null`、`leaf=null`、`currentCount=0`、`unfinishedLeaves=0`；`stages/`、`leaves/`、`unfinished/` 当前均为空。
- current delegation：`live=false`、`state=UNKNOWN`、`reason=missing`。可以确认没有 live carrier；不能把缺失载体扩大成当前 failure/lease 已知为零。
- 归档 `docs/harness/done/2026-09/HL11-UPGRADE-delegation.json` 确实记录 HL11F00–HL11F06 全部 `accepted` 并绑定 `evidenceRef`，但它是历史归档，不是 current live 状态，也不能推翻本次直接反例。
- 当前目录是 source working copy，不是实际安装 runtime：现场 status 为 `installed=false`、`configured=false`，Hook evidence missing；本复核只在 disposable 项目中做真实安装调用。
- 没有 stage、leaf、unfinished leaf 或 live delegation 被本复核创建/改变。

### 3.3 retained、全局文件、push 与 release

- retained 0.10 实际为 1,061,071 bytes，SHA-256 仍是 `d73f4b4f83e6034e33168995c24ca4514d69bcd70ccc19f8aa255da42d218daa`。
- 真实 `/home/synadmin/.codex/AGENTS.md` 为 434 bytes；复核前后 SHA-256 均为 `a060f3cc75512b49e5e4c605841cbad47eda4028ce53251e11d199e8c629e0ae`，本复核未触碰它。
- 但“本次真实文件没变”不等于“产品不会读写它”。第 8.1 节的同构 target 反例证明 retained candidate 的正式安装路径会把 `.codex/AGENTS.md` 当成项目 instruction 文件并写入。
- 当前目录无 Git identity、HEAD、remote、tag 或 push authority；未形成真实 push 证据。
- native push gate 只在 disposable local Git/bare remote 中验证；不是线上 push。
- 未找到可绑定的发布 receipt/registry authority，真实 release 状态为 UNKNOWN。candidate 是 offline source candidate，不是 push、tag、release、deploy 或真实宿主部署。

## 四、candidate 实际身份与可复现性

### 4.1 retained 0.11 身份

| 字段 | 实际值 |
| --- | --- |
| 文件 | `docs/harness/artifacts/harness-lite-0.11.0-8e14e641b7d0fe3641a5e74c49b11a60761e0dc63fb75866ff8226e6b3687ae5.json` |
| SHA-256 | `8e14e641b7d0fe3641a5e74c49b11a60761e0dc63fb75866ff8226e6b3687ae5` |
| bytes | 1,096,150 |
| version | `0.11.0` |
| files | 42 |
| product JavaScript | 14 |
| fileDigest | `sha256:c591777438f9f6dd092da02cada69b10b5a0841a3140ffae986e3272eb0416bb` |
| productDigest | `sha256:cd2d34af1f654af2dde947562a6f051ebfb216621d3aac32f2c1941f819abdb9` |
| provenance | `working-copy-snapshot`; `git.repo=false`; `head=null` |

两次从当前源码独立构建的 JSON 逐字节相同，且分别与 retained 0.11 artifact 逐字节相同。artifact 安全物化后的文件清单、mode、size、逐文件 hash 均与 manifest 相符；从其稳定内容复建仍得到同一摘要。因此 candidate 身份和构建确定性为 PASS。

### 4.2 源码与物化 candidate 测试

| 层级 | 命令/检查 | 结果 | 证据边界 |
| --- | --- | --- | --- |
| working copy | `node scripts/timed-test.js` | 124 total / 123 pass / 0 fail / 1 skip | lifecycle 文档 scope skip；不能覆盖未写入的反例 |
| materialized candidate | `node --test test/*.test.js` | 124 total / 122 pass / 0 fail / 2 skip | 额外 skip 为 retained 0.10 artifact 不在 candidate inputs |
| materialized selfcheck | `node bin/hl.js selfcheck --run --json` | `ok=true`; 内部 122 pass / 2 skip | candidate 自身运行 |
| materialized syntax | 对 14 个产品 JS 分别 `node --check` | 14/14 PASS | 只证明语法 |
| recovery focused | `node --test test/nv04-recovery.test.js` | 15/15 PASS | 另有独立构造恢复链 |

全绿 suite 没有覆盖 global target、current 0.11 coherent self-tamper、幽灵 unit、多个 runnable Hook fallback、stale project capability、instruction/rollback uninstall residue 等反例，所以不能直接判产品 PASS。

## 五、completionStandards 合同验收

| 要求 | 结果 | 直接事实 |
| --- | --- | --- |
| 新 leaf/work unit/Hook/status/task package/report 只输出 `completionStandards` / 完成标准 | PASS（所查产品输出） | 正式 projection 只写新字段；没有旧字段 own-property/旧中文标签 |
| `authorityDesign` 与 `facts` 独立 | PARTIAL/FAIL | unit 自身有字段时分栏；缺字段时 `lib/tree.js:292-293` 无相关性筛选地继承整个 leaf 数组，不满足“当前 unit 相关最小项” |
| 旧 `directAcceptance` 和旧中文标签只读 alias | PASS | 旧 0.10 leaf 可读并归一化；新对象不双写旧字段 |
| 标准缺失保持 UNKNOWN，不伪装 dispatch-ready | PASS（正常已声明 unit） | 得到 `completionStandards=["UNKNOWN"]`、`dispatchReady=false`；accepted HOLD、零写 |
| 测试全绿但必需功能缺失必须 FAIL/未证明 | FAIL（产品保护）/本 review 判 FAIL | 只写“all tests are green”的标准后，accepted 路径仍可 `RECORDED`；更强的幽灵 unit 甚至借 leaf 标准被 accepted。测试数量不是语义完成证明 |
| 未声明 work unit 不得借 leaf fallback 成为有效任务 | FAIL | 见第 8.3 节；`GHOST99` 可 dispatch-ready、accepted 并解锁依赖 |
| 继承标准后的可派发状态与自动 guidance 一致 | FAIL | unit 缺自身标准但继承 leaf 标准后 package 为 ready；自动 status guidance 却不触发 pre-dispatch，实际投影互相矛盾 |

旧输入兼容本身成立；失败发生在“相关最小投影”“已注册 unit 边界”和“产品结果不能被测试文本替代”。

## 六、短内核与九类事件 guidance

### 6.1 短内核

- marker block：395 Unicode characters、907 UTF-8 bytes、3 physical lines，SHA-256 `5ba7250aa24313f41f48f4548aec877ec57cc01187f6abe97a77f8ad7f09e0c3`。
- 正文：341 Unicode characters、853 UTF-8 bytes、1 physical line，SHA-256 `796494f1095ce7c96bbcda266ee10b152756b3dadd5b2a1cc874955e76e70d62`。
- 正文保留用户权威、相关设计/事实、完成标准、最短路线和证据边界。
- 正文未出现 `300000`、Grok、Gemini、Terra、Sol、provider、`reported_complete`、`accepted`、旧系统、push、失败次数、Poracode、watchdog、bridge、spawn、wait、interrupt 或 takeover。
- fresh 安装后的 instruction block 与源码 `INSTRUCTION` 逐字节一致。

短常驻内核本身 PASS。

### 6.2 九类事件正负例

| 事件 | 正例 | 负例/物理缺席 | 结论 |
| --- | --- | --- | --- |
| `leaf-definition` | 显式 allowlisted intent 返回定义指导 | 不带 capability/heartbeat/recovery/push | PASS |
| `route-clarification` | 显式 intent 返回 XY/最短证据指导 | 不带 capability/heartbeat/recovery/push | PASS |
| `pre-dispatch` | 单一正常 runnable unit 返回 capability 与任务包 | 多 runnable 正式 Hook 退为 UNKNOWN leaf fallback；继承 leaf 标准时事件又可能缺席 | FAIL |
| `agent-active` | active ledger 返回 active 指导，heartbeat 仅此状态出现 | reported/recovery 空态不带 heartbeat | PASS |
| `agent-reported` | reported unit 返回验收指导 | 不把 reported 状态作为 dependency accepted | PASS |
| `problem-recovery` | 有有效失败/lease 时出现 tier 和恢复指导 | 无失败普通状态不常驻 Terra/Sol | PASS |
| `leaf-closeout` | accepted 完成或显式 intent 返回收口指导 | 不把 candidate 写成 release | PASS |
| `legacy-fact` | 显式 intent 返回旧事实边界 | 普通任务物理缺席 | PASS |
| `push-attempt` | PreToolUse/native gate 首次 deny，精确 identity/receipt/assert 后允许 | 非 push 返回空，模糊 shell push fail-closed | PASS（disposable local Git 范围） |

标准 selector 的不相关字段物理缺席成立，不是“先全部注入再忽略”。但 pre-dispatch 的两个生产路径反例使九类事件整体不能 PASS。

### 6.3 显式 `status --intent`

- 仅允许 `leaf-definition`、`route-clarification`、`pre-dispatch`、`leaf-closeout`、`legacy-fact`。
- 未知 `spawn-now` 返回错误 `unknown guidance intent`，CLI exit 1。
- 五个合法 intent 前后 disposable 项目树 digest 相同，不持久化 intent。
- intent 只增加 guidance，不授予权限，不伪造 runnable、accepted、recovery 或 heartbeat。
- 用户 prompt 中出现 intent 字样不会触发对应事件，未读取 transcript 猜下一步。
- 产品静态面没有新增 provider adapter、daemon、agent-tool Hook 或第二事件总线。

此项 PASS。

## 七、子代理、并行与监督

| 要求 | 结果 | 证据 |
| --- | --- | --- |
| Harness 只说明 capability，不自行 spawn/wait/interrupt/takeover | PASS | 产品面无这些宿主 agent 调用；实际调度仍由指导模型工具面完成 |
| 模型目录来自当前结构化工具面 | FAIL | Hook-input dynamic carrier 有 TTL/绑定；但 `lib/capabilities.js:14-17,336-360` 也接受无 freshness/provenance 的项目静态文件并声明 complete |
| 独立 unit 并行，依赖/重叠写面/共享现场正确处理 | PARTIAL | 独立与 overlap/conflict 正常；幽灵 accepted 可伪造依赖满足 |
| `reported_complete` 不解锁 | PASS | dependent 仍 waiting；accepted 后才 runnable |
| accepted 绑定 `evidenceRef`，缺失 HOLD/零写 | PASS（已声明 unit） | 缺 evidence 直接 HOLD；但 `evidenceRef` 不能弥补幽灵 unit 未注册 |
| 多 active unit 最小上下文完整 | PASS | 7 active units 返回 7/7、`complete=complete`、`truncated=false`、无 fallback |
| 多 runnable unit 的 pre-dispatch 完整 | FAIL | 2 runnable 时正式 Hook 输出 `id=UNKNOWN/status=leaf-fallback`，两份 unit 包均缺失 |
| heartbeat 只在 active，间隔 300000ms | PASS | 299999ms 未 due，300000ms due |
| activity/文件/日志/测试/时间不冒充 semantic progress | PASS | 状态和时间字段独立；测试数量不触发 semantic progress |
| silence/thinking/long-tool/provider delay 不自动介入 | PASS | 全部 `intervene=false`；只有 actual blocker 才给出介入建议 |

动态 Hook-input capability 正路径可用，但静态历史 fallback 违反“每次从当前真实结构化工具面取得”的冻结决定，不能用正路径覆盖。

## 八、决定性直接反例与最小返修范围

本节只记录返修边界，不在本次复核中修改产品。

### 8.1 全局 `~/.codex/AGENTS.md` 可被正式安装路径读写

**实际调用路径**：

- `bin/hl.js:40,49,55-56` 只对 `--target` 做 `path.resolve`，没有用户全局 Codex 根排除。
- `lib/install.js:716-729` 对 `path.join(root, "AGENTS.md")` 读取并生成 instruction plan。
- `lib/install.js:733-742,824-878` 在 `--write` 时实际写入。

**物化 retained candidate 反例**：在 disposable synthetic HOME 中，把 target 精确设为 `<fake-home>/.codex`，运行 candidate 的：

```text
hl install --target <fake-home>/.codex --source <materialized-candidate> --write --json
```

返回 `INSTALLED` / runtime `0.11.0` / `agentsChanged=true` / `instructionAdded=true`，并在 synthetic `.codex/AGENTS.md` 追加 HARNESS-LITE block。换成真实 `/home/synadmin/.codex` 会沿同一正式路径读写真实全局文件；源码没有 canonical global-root guard。

**影响**：冻结决定 1；HL11F00/F04/F05/F06；安装写面和 candidate 验收。

**最小返修范围**：CLI/API 安装、检查、卸载等入口在读取 target 内文件前 canonicalize 并拒绝真实用户全局 Codex 根/其 `AGENTS.md`，保持零读零写；保留普通项目根 `AGENTS.md` 能力；增加 synthetic HOME 正负与零写回归，重建 candidate。

### 8.2 current 0.11 coherent tamper 可自证并运行

fresh 0.11 安装后修改 `.claude/harness-lite/lib/tree.js`，再按被改 runtime 重算并写回同一 runtime 的 `ownership.json.packageDigest`：

- source 侧 `install.verify06(root)`：`ok=true/kind=current/differences=[]`。
- installed runtime 自身 `verify06`：同样通过。
- `inspect`：同样宣称 current。
- 正式 `hooks/dispatcher.js` SessionStart：exit 0，输出正常 `additionalContext`，并新增 `.observed.json` / `.observed.jsonl`；没有 identity-failed。
- 只有再次携带可信 candidate 运行 install 时，才因 `source-package-digest` HOLD/零写；日常 Hook 调用没有该外部锚点。

根因在 `lib/install.js:210-226`：current identity 把实际 digest 与同一可修改 `ownership.json.packageDigest` 比较；`hooks/dispatcher.js:25-36` 信赖该结果。

**影响**：冻结决定 5/8；HL11F04/F05/F06 的 coherent tamper、runtime identity、正式 Hook fail-closed。

**最小返修范围**：为 current runtime 引入不可由 runtime 自身同步改写的可信 candidate/安装锚点，接入 dispatcher，并补 current coherent-tamper 正式 Hook 回归。

### 8.3 幽灵 work unit 可 accepted 并解锁依赖

current leaf 只声明正常 unit；对未声明 `GHOST99`：

```text
workUnitPackage("GHOST99"):
  status="leaf-fallback"
  selection="requested"
  dispatchReady=true

recordEvent(status="accepted", evidenceRef="reports/ghost.md"):
  status="RECORDED"
  wrote=true

ledger accepted=["GHOST99"]
dependent dependencies=["GHOST99"]:
  ready=true
  runnable=true
```

实际路径：`lib/tree.js:264-301` 的显式不存在 ID 仍回退 leaf；`lib/delegation.js:614-634` 只检查 evidenceRef 和 fallback 的 readiness；`lib/delegation.js:433-438,731-738` 只按 ledger 字符串 accepted 解锁。

**影响**：冻结决定 3/5/7/8；HL11F01/F03/F05/F06；accepted-only 依赖语义。

**最小返修范围**：显式请求未声明 unit 必须 UNKNOWN/HOLD；recordEvent 必须绑定 current leaf 已声明 unit；dependency unlock 只认有效已声明 accepted unit；补幽灵 unit 回归。

### 8.4 多 runnable pre-dispatch 丢失最小包

两个独立 runnable、无 live ledger 的 SessionStart 实际输出：

```text
WorkUnit：id=UNKNOWN；status=leaf-fallback
Guidance[pre-dispatch]：...
hasMR01=false
hasMR02=false
hasParallelCarrier=false
```

`hl status --intent pre-dispatch --json` 另有完整 unit 数组，但自动 Hook 生产载体本身不完整。`lib/hook.js:41-50` 只在单一 runnable 时选择 unit；`lib/hook.js:195-198` 只在 `activeCount>1` 时用 parallel carrier，未覆盖多个 runnable。

**影响**：冻结决定 5/7；HL11F03/F05/F06 的 pre-dispatch 和最小上下文。

**最小返修范围**：多 runnable 走完整结构化 runnable package carrier，禁止 UNKNOWN leaf fallback 冒充 work-unit package。

### 8.5 静态历史 capability 冒充当前工具面

在 `docs/harness/capabilities.json` 放入无时间、来源或 session 绑定的：

```json
{"model":"removed-model-from-old-run","status":"available"}
```

`hl status --intent pre-dispatch` 返回 `state=known`、`modelsComplete=true`、该旧 model 仍 `available`，而 `createdAt/expiresAt/ttlMs` 全为 null。固定搜索路径和读取逻辑见 `lib/capabilities.js:14-17,336-360`。

**影响**：冻结决定 5/7；HL11F03/F05/F06 的当前 capability 和选模边界。

**最小返修范围**：project-file 来源若无可验证宿主 provenance、freshness 和 turn/session binding，只能 UNKNOWN；保留已有结构化 Hook-input carrier。

### 8.6 uninstall 保留 owned instruction 与旧 rollback runtime

project/managed uninstall 都返回 `UNINSTALLED` 并移除 stable runtime、Hook/native marker 和 registry binding；但是：

- 安装写入的项目 `AGENTS.md`/`CLAUDE.md` HARNESS-LITE block 原样保留。
- 0.10→0.11 升级后卸载留下 `.claude/.harness-lite.rollback-*`，其中为完整 0.10 runtime。

`lib/install.js:1050-1078` 的生产卸载路径只处理 stable runtime、Hook、native 和 registry，没有 owned instruction/升级 rollback 清理。现有测试只检查有限 carrier 消失。

**影响**：HL11F04/F05/F06 的 uninstall 与安装所有权合同。

**最小返修范围**：明确 instruction preimage/ownership，精确移除 owned block；规定并清理升级 rollback carrier；补 project/managed/upgrade uninstall 的内容级断言。

## 九、失败计数与问题级恢复

独立构造和源码测试得到：

| 场景 | 结果 |
| --- | --- |
| 路线关键假设被直接证据推翻 | 有效语义失败，计数 1 |
| 实现决定直接导致完成标准不成立 | 有效语义失败，计数 1 |
| 同一根因产生多个错误 | 第二个为 DUPLICATE，零写/不重复计数 |
| 工具、权限、provider、传输、普通红测 | 记录为非计数原因，不进入有效失败数 |
| 缺证和 UNKNOWN | evidence 缺失 HOLD/零写；UNKNOWN 不计 |
| 重复提交已否定路线 | drift 记录但不计；后续重复去重 |
| 五个不同普通有效失败 | 第五个后进入 Terra 一次 |
| Terra provider/不完整恢复 | 不计或 HOLD；不进入 Sol |
| Terra 完整有效语义失败 | 进入 Sol；第二次 Terra 被拒绝 |
| Sol 尝试 | 默认 3；问题级 1..5 均按配置耗尽 |
| 问题隔离 | 只绑定当前 problem/family/work unit；其他问题不污染 |
| PASS | 只清当前问题租约；其他问题租约保持 |

`test/nv04-recovery.test.js` 15/15 通过，独立构造与代码状态一致。activity、heartbeat、silence、provider delay 不计失败。本次只读复核没有因复核困难触发真实 Terra/Sol 实现恢复链。

此项 PASS；它不能消除其他产品直接反例。

## 十、安装、迁移与 candidate 矩阵

| 检查 | 结果 | 说明 |
| --- | --- | --- |
| 两次源码构建逐字节一致 | PASS | 两次均等于 retained 0.11 |
| candidate 文件清单、digests、版本、provenance | PASS | 42 / 14 / 0.11.0 / working-copy-snapshot |
| 物化测试/selfcheck/JS syntax | PASS | 见第 4.2 节 |
| fresh project install + verify06 | PASS | `INSTALLED`，fresh runtime current/ok |
| retained 0.10 精确升级 | PASS | 无 `--upgrade` HOLD/零写；显式 upgrade 后 current/ok；旧 leaf 可归一化 |
| 0.9.1 working-copy 固定 fixture 升级 | PASS | 17-path fixture 实际重放 |
| 0.6/0.7/0.8 更旧 official 实际升级 | UNKNOWN | 只有 OFFICIAL 元数据/固定摘要和识别分支，没有完整历史 runtime bytes/artifact 可独立物化执行 |
| previous 0.9/0.10 coherent tamper | PASS | 固定摘要锚点识别 drift，入口 HOLD/零写 |
| current 0.11 coherent tamper | FAIL | 可同步改 manifest 自证 current，正式 Hook 继续运行 |
| extra runtime path | PASS | drift/HOLD/零写，bytes 稳定 |
| symlink unsafe surface | PASS | HOLD/零写，foreign target 不变 |
| fault rollback | PASS | swap/instruction/hook/managed registry 注入故障恢复 preimage，无 stable carrier 残留 |
| project/managed install | PASS | registry/gateway/project binding 在 disposable 范围成立 |
| uninstall | FAIL | instruction block 和升级 rollback runtime 残留 |
| runtime identity | FAIL | current coherent tamper 反例 |
| native push gate | PASS（disposable） | local Git/bare remote；dispatcher drift 时 hook fail-closed |
| 全局 `~/.codex/AGENTS.md` 零读零写 | FAIL | synthetic `.codex` target 的正式 candidate 路径实际改写 |

candidate 可复现不等于产品验收通过，也不等于真实安装或发布。

## 十一、与既有报告的差异

### 11.1 被直接复现的旧结论

- 两个 plan digest、candidate SHA/bytes/42 files/14 product JS/fileDigest/productDigest/provenance。
- retained 0.10 和本机全局 AGENTS 当前 bytes/hash 未变。
- 双 build 等于 retained artifact，源码/物化 suite 的 123/122 pass 与 1/2 scope skip，selfcheck 和 14 JS syntax。
- 341-character 短内核及禁项缺席。
- 旧 `directAcceptance` 输入 alias、正常缺标准 HOLD、evidenceRef 要求。
- 单一/多 active 正常上下文、reported 不解锁、300000ms heartbeat、activity/progress、限制介入。
- 有效失败去重、五次普通失败、Terra/Sol、问题级租约和 PASS 清租约。
- fresh、0.10→0.11、0.9.1 fixture、extra path、unsafe surface、fault rollback、project/managed、disposable native push 的通过部分。
- working copy、candidate、installed runtime、push/release 的物理层级区分；当前根不冒充已安装 runtime。

### 11.2 只是报告自述或被扩大了证据层级的结论

| 旧报告声明 | 第二次复核结论 |
| --- | --- |
| “源码无全局路径、当前 hash 不变，所以 install/candidate 对 `~/.codex/AGENTS.md` 零读零写” | 证据扩大且被直接反例否定；任意 target + root `AGENTS.md` 正是正式写路径 |
| “动态 capability 保留” | Hook-input 正路径成立；但静态 stale project-file 被宣称 current/complete，不能整体 PASS |
| “九类事件与最小任务包完整” | 常规 selector 成立；多 runnable pre-dispatch 和继承标准状态存在真实落空 |
| “accepted-only” | reported/accepted 常规例成立；未声明幽灵 unit 仍可 accepted 并解锁，整体边界失败 |
| “coherent tamper zero-write/runtime identity PASS” | 只覆盖带固定摘要的旧 runtime 或 reinstall source 比对；未覆盖 current runtime + 可改 manifest 同步 tamper，正式 dispatcher 也继续运行 |
| “older official upgrade 已证明” | 0.9.1 fixture 与 0.10 artifact 可执行；0.6/0.7/0.8 只有常量/识别分支，真实 official upgrade 为 UNKNOWN |
| “uninstall PASS” | 只断言 runtime/native/registry 等有限 carrier；遗漏 instruction blocks 和 upgrade rollback runtime |
| “所有用户要求已完成” | 由上述多个直接产品反例否定 |

### 11.3 身份与归档差异

- 没有发现 candidate 文件名、artifact SHA、bytes、fileDigest、productDigest 或版本身份不一致。
- 既有独立报告的 124/123/1 和主管报告的 materialized 124/122/2 均可复现；测试摘要数字本身无误。
- 归档 ledger 的 HL11F00–F06 accepted/evidenceRef 是真实历史字节，但其语义结论与本次直接反例冲突；它不能作为 current product PASS authority。
- 旧报告没有证明真实 push、release 或宿主部署；其边界声明在这一点上没有被扩大。

## 十二、事实、推断与 UNKNOWN

### 事实

- 两个冻结摘要、retained 0.10 和 0.11、candidate 构建确定性与测试计数均已直接复算/重跑。
- 当前无 Git repo、无 stage/leaf/unfinished leaf/live delegation；live ledger 是 missing/UNKNOWN。
- 真实全局 AGENTS 本次未变，但 retained candidate 的 synthetic `.codex` target 安装确实改写该 target 的 `AGENTS.md`。
- current coherent-tampered runtime 通过自身 identity 并被正式 dispatcher 执行。
- 幽灵 unit 被 accepted 并解锁依赖；多 runnable Hook 丢失 unit 包；static stale capability 被标为 known/complete。
- uninstall 留下 owned instruction 和升级 rollback runtime。

### 推断

- 因 CLI/API 没有 global-root guard，若用户把真实 `/home/synadmin/.codex` 作为 target，产品会沿与 synthetic 反例相同的 path 读取并改写真实 `AGENTS.md`。这是由同构正式调用路径作出的直接代码推断；本复核没有冒险触碰真实文件。
- current runtime 的可信根与被验证内容同处可改写边界，因此当前 self-manifest 不能独立证明安装来源；reinstall 的外部 source 检查不能替代每次正式 Hook 的 runtime identity。

### UNKNOWN

- 0.6/0.7/0.8 official runtime 的完整字节不存在于当前可执行证据中，真实升级回归 UNKNOWN。
- 当前 source candidate 是否已经在任何外部 registry 发布、是否曾被 push/tag，因本目录无 Git authority 且无发布 receipt，UNKNOWN；本次没有联网发布核验，也没有授权外部写操作。
- current delegation 缺失时的 failureCount/lease 具体值 UNKNOWN；归档值不等于 current live 值。

这些 UNKNOWN 即使不存在直接反例，也不允许把对应项目扩大为 PASS；本次已有直接反例，所以总裁决为 FAIL。

## 十三、临时目录、清理与工作区写面

本次只在以下 disposable 根中执行验证，所有子目录均位于对应根下：

- `/tmp/hl11-second-review-main-tfCy2V`
- `/tmp/hl11-second-review-candidate-nuAN3n`
- `/tmp/hl11-second-review-contract-tFW9KX`
- `/tmp/hl11-second-review-lifecycle-J9Tuit`
- `/tmp/hl11-second-review-lifecycle-TPD0Mv`
- `/tmp/hl11-second-review-lifecycle-eCOs7P`
- `/tmp/hl11-second-review-lifecycle-JIzfFL`

清理时均先精确确认 resolved path，再只删除该次创建的根；未用宽泛 workspace/home/root 目标。初次 shell recursive remove 被环境安全策略拒绝时没有改用宽泛命令，而是经 realpath/前缀校验后用精确 filesystem removal。最终逐项确认以上路径不存在。

reviewer 还创建了三个小型临时输出文件 `/tmp/hl11_git_probe_err`、`/tmp/hl11_unknown_intent_out`、`/tmp/hl11_unknown_intent_err`，最终精确删除。

本 reviewer 及三个复核单元在工作区唯一新增的文件是本报告：

`docs/harness/reports/HL11-second-independent-product-review.md`

最终与开工 disposable 快照对比时，还发现工作区新增了 `docs/harness/plans/NEXT-VERSION-PROMPT-GUIDANCE-IMPROVEMENTS.md`。其 birth/mtime 均为 `2026-09-01 23:36:37.878690760 +0800`，是在本次复核进行中出现的 concurrent/unrelated 文件；它没有由本 reviewer 或三个复核单元创建，不是本次复核授权写面，且文件自身声明 `NOT ACTIVE / NOT DISPATCHED`。本复核没有删除、改写或把它作为 0.11 authority；为保留外部/用户现场，原样留下并明确报告。

没有修改产品、candidate、retained 0.10、lifecycle、plan authority、全局 `AGENTS.md`，没有创建 stage/leaf，没有 push、tag、release 或 deploy，也没有干扰 Poracode/watchdog/bridge。

## 十四、最终结论

**FAIL**。

candidate 身份和可复现结果成立，但冻结决定 1、3、5、7、8 以及 HL11F01/F03/F04/F05/F06 的产品完成标准存在直接反例。最小返修应仅覆盖第 8 节列出的 global-root guard、current runtime 可信锚点、registered work-unit 校验、多-runnable carrier、capability freshness/provenance、以及 owned instruction/rollback uninstall；完成后必须重建 candidate 并重新物化复核。本次到此停止，不自行修复、不激活后续工作。
