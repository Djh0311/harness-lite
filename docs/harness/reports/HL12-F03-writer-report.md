# HL12F03 writer report — work-unit 真值与多 runnable 任务包

状态：`reported_complete`，等待主管独立读回、重放和 acceptance。本报告不宣布 `accepted`，不表示 HL12F04–F08、0.12 candidate 或整个 HL12 已完成。

## 1. 本 unit 的实际结果

HL12F03 只处理 CEX-03 和 CEX-04，并保持 work unit 只是内部拆分、派发和验收工具：

- 显式请求 current leaf 未声明的 ID 时，`tree.workUnitPackage()` 返回 `UNKNOWN / undeclared-work-unit / dispatchReady=false`，不再继承 leaf goal、完成标准或写面来冒充有效 unit。
- `delegation.recordEvent()` 在任何事件解析和 ledger 写入前把 claim 绑定到 current leaf 的声明；未声明 active、reported、accepted、heartbeat 等事件统一 `HOLD / wrote=false / undeclared-work-unit`。合法但大小写不同的 claim 会归一化到声明的规范 ID。
- ledger 的有效 summary、accepted、runnable、heartbeat、conflict 和 dependency unlock 只认 current leaf 已声明的 ID。未声明 dependency 始终投影为 `UNKNOWN / accepted=false`。
- 旧 ledger 仍可由正式 `delegation.read()` 读回；其中历史幽灵行不删、不改原字节，但不会进入有效 summary、计数或解锁依赖，也不能继续获得新写入。脱离 current-leaf membership 绑定的裸 ledger 对 work-unit 状态 fail closed。
- 合法 declared unit 的 `active -> reported_complete -> accepted` 流程不变；`reported_complete` 不解锁，只有带 supervisor evidenceRef 的 `accepted` 解锁 dependent。
- 两个及以上 runnable 时，`work.parallelWorkUnitContext()` 返回每个 runnable 的完整结构化 package；存在 active unit 时仍保留全部 active 和全部 runnable package。每个条目同时含完整嵌套 `package` 和展开的 goal、全部完成标准、allowed/forbidden、authorityDesign、facts、entryPoints、disprovenRoutes、unknowns、routeBasis、dependencies、writeScope、resultContract、source 与 readiness。
- 普通 leaf-level 工作没有被 work-unit 化：没有显式 ID 的 `tree.workUnitPackage(root, null)` 仍走原 leaf fallback，且正常 leaf 完成标准可继续使该普通投影 dispatch-ready。没有新增用户命令、确认、风险种类或开工许可证。

## 2. CEX-03 双向事实

### 坏路径已经拒绝

在 current leaf 只声明合法 unit、显式请求 `GHOST99` 时：

- package 为 `status=UNKNOWN`、`selection=undeclared-work-unit`、`dispatchReady=false`；goal、completionStandards 和 allowed 不继承 leaf；
- ghost active、reported_complete、accepted 和 heartbeat 都返回 `HOLD`、`wrote=false`、`reason=undeclared-work-unit`；
- 每次调用前后 ledger bytes 完全相同，ghost row 不出现；
- 旧 ledger 中即使已有 `GHOST99=accepted`，正式 read 后也不出现在 `summary.accepted/units`，依赖它的 declared unit 仍为 `ready=false`，blocker 为 `GHOST99:UNKNOWN`；
- 不带 current-leaf membership 的裸 JSON ledger 不能把任何 work-unit 行投影成有效状态。

### 正常路径保持可用

已声明 `GOOD1` 与依赖它的 `DEP1`：

- 小写 claim `good1` 被规范绑定并只写为 `GOOD1`；
- `GOOD1=active` 与 `DEP1=rejected/dependencies=[GOOD1]` 正常记录；
- `GOOD1=reported_complete` 后 `DEP1.ready=false`；
- 带 evidenceRef 的 `GOOD1=accepted` 后 `DEP1.ready=true`，accepted summary 只含 `GOOD1`。

F00 的 CEX-03 坏例和正常正例最终 `2/2` PASS。

## 3. CEX-04 双向事实

### 多 runnable

两个 declared unit 都为 runnable、没有 active unit 时：

- structured context 为 `runnable=[RUN1,RUN2]`、`packageIds=[RUN1,RUN2]`、`packageCount=2`、`complete=complete`；
- 两个条目的 nested package 都与各自 `tree.workUnitPackage()` 深度相等，不是 `UNKNOWN` 或 `leaf-fallback`；
- source `lib/hook.js` 的现有 SessionStart 路径和 F00 的 disposable installed formal dispatcher 都同时输出两者的真实 goal 与全部测试 sentinel 完成标准；
- context 中没有 `id=UNKNOWN` 或 `status=leaf-fallback`。

一个 active 加两个 runnable 时，真实运行态仍为 `active=[ACTIVE1] / runningCount=1`，carrier 同时含 `ACTIVE1、RUN1、RUN2` 三份完整 package。实际 running truth 与 dispatch package count 分栏，不把 runnable 冒充正在运行。

### 单 runnable 正例

单 runnable 仍走原单-unit package：正式 installed SessionStart 包含真实 unit ID、`status=work-unit`、goal 和完成标准，没有退回 leaf fallback。

F00 的 CEX-04 坏例和正常正例最终 `2/2` PASS。

## 4. 正式 caller 与 F06 接线边界

- `hooks/dispatcher.js` 完成 F02 runtime identity 检查后进入 installed `lib/hook.js::dispatch/sessionStart`；`lib/hook.js:195-209` 调用 `work.parallelWorkUnitContext()` 并选择 parallel carrier。F00 CEX-04 是这条正式 installed 路径，不是 helper-only 测试。
- `lib/work.js:187-316` 形成 active/runnable package carrier；`lib/work.js:322-333` 形成有界文本 carrier。`active` 与 `runningCount` 是真实运行数，`packageIds/packageCount` 是完整任务包集合。
- 由于 F03 禁止修改公共 Hook，现有 Hook 仍读取既有 `activeCount > 1` 选择信号；F03 让该兼容信号表示本次 carrier package 数，同时新增明确的 `runningCount` 与 `packageCount`，因此正式多-runnable 路径能在不抢 F06 写面的前提下工作。F06 仍是最终公共 Hook/CLI/instruction 单一接线 owner。
- `lib/work.js:644-673` 的 status/pre-dispatch 继续通过 `tree.workUnitPackages()` 返回全部 runnable structured packages。
- installed/source agent API 的 `recordAgentStatus/recordAgentObservation -> recordEvent` 统一经过 `lib/delegation.js:632-657` 的 current-leaf membership gate；没有第二套 ledger 或授权入口。

## 5. 计划写面偏差与机械 fixture 迁移

严格产品合同暴露出若干旧测试 fixture：它们直接记录 A/B/FIX 等 unit，但 synthetic leaf 从未声明这些 ID。主管明确裁决这是 fixture 不完整，不得用“leaf 无声明就接受任意 ID”的产品例外削弱 membership，并逐项授权最小机械扩写。

本次新增纯 fixture helper `test/fixtures/work-unit-declarations.js`，只生成空的 `## Work Unit <ID>` 声明。以下既有测试只新增 helper import 和它们原本已经调用/断言的 ID 声明，没有删除、放宽或改写任何断言，没有新增 skip：

| fixture | 只补的声明 |
|---|---|
| `test/nv03-delegation.test.js` | A–E |
| `test/nv03-hook-work.test.js` | A–E；原有 6 类 × 8 个 stress ID |
| `test/nv04-recovery.test.js` | A、ACCEPTED；原有 6 类 × 8 个 stress ID |
| `test/fix02-delegation-record.test.js` | FIX00、FIX02、FIX03 |
| `test/fix01-guidance-runtime.test.js` | FIX00、FIX02–FIX05；原 FIX01 完整 section 保持 |
| `test/fix03-joined-runtime.test.js` | FIX01、FIX02、FIX05–FIX07；原 FIX03/FIX04 完整 section 保持 |

这 6 个文件和 helper 是主管授权的 fixture-only 计划写面偏差；产品没有 legacy 例外。完整 source suite 没再发现其他同类 fixture 缺口。

## 6. 命令与结果

所有权威测试命令从进程启动起使用 `/tmp/hl12-f03-*-home` synthetic `HOME/USERPROFILE/CODEX_HOME`；F03 专测自身还在 require 产品模块前建立并最终精确删除 synthetic HOME。安装、升级、dispatcher、ledger 和 Hook 写入只发生在 test 创建的 disposable root。

- `node --check lib/tree.js && node --check lib/work.js && node --check lib/delegation.js && node --check test/hl12-f03-work-unit-truth.test.js && node --check test/fixtures/work-unit-declarations.js`：exit 0。
- `node --test test/hl12-f03-work-unit-truth.test.js`：5 tests / 5 pass / 0 fail / 0 skip。
- `node --test --test-name-pattern='CEX-03|CEX-04' test/hl12-f00-counterexamples.test.js`：4 tests / 4 pass / 0 fail / 0 skip；坏路径和对应正常正例均绿。
- tree/work/delegation/parallel/joined/recovery 定向回归（`nv01`、`nv03`、`nv04`、`fix01`、`fix02`、`fix03`、`r2-parallel`、`r2-joined`、`r3-joined`）：76 tests / 75 pass / 0 fail / 1 既有 skip。
- F01/F02/upgrade/integration 与 F03 交叉回归：34 tests / 34 pass / 0 fail / 0 skip。
- 最终枚举全部 `test/*.test.js`，只排除仍故意包含后续 owning-unit known-red 的 `test/hl12-f00-counterexamples.test.js`：142 tests / 141 pass / 0 fail / 1 skip。
- F00 全文件最终：13 tests / 12 pass / 1 fail / 0 skip；唯一失败精确为 F04 owning 的 CEX-05 stale capability。CEX-01、CEX-02、CEX-03、CEX-04、CEX-06、六个正常正例和 hard-risk freeze 均通过。
- 唯一 source-suite skip 是既有 `R3F03 active indexes point to the existing R3 current leaf...`，理由为 `source candidate does not include local lifecycle documents`。它不覆盖 F03 membership、dependency、package、formal Hook 或 installed runtime 证据；本次没有新增条件 skip。

## 7. 实际改动与 SHA-256

| 文件 | 用途 | SHA-256 |
|---|---|---|
| `lib/tree.js` | 显式 declared membership；undeclared UNKNOWN package；单字母显式 heading 解析 | `6e0c9d999598c24cc65cd428f62df62c283c8649b3110cadf8c235ebe5cc4a58` |
| `lib/delegation.js` | current-leaf membership binding、canonical claim、ghost zero-write、effective summary/dependency 过滤 | `8ebef24c7ffcd361e92939c6b9f69b0124fb79c5a0784761621a9c824ccedf61` |
| `lib/work.js` | active+runnable 完整 structured package carrier 和真实 running/package 计数分栏 | `7c58e6fb7c74c351c354bd72bf7628576cf00af0fd330f0d772d06bb666ffeaf` |
| `test/hl12-f03-work-unit-truth.test.js` | strict membership、旧 ledger、accepted-only、多 runnable、formal Hook 专测 | `16f0586cd40952c5f8f076c146852caf100ad34a7ce2f53b8357b9c02ffc863c` |
| `test/fixtures/work-unit-declarations.js` | 纯 synthetic leaf declaration helper | `c865e573603327c1acf095582d202547e2cfb7421611fc9015c8a24ec62332f4` |
| `test/nv03-delegation.test.js` | fixture-only declarations | `d4784e13b6f3dca969bc173845a51b8a0fca302cf2e0f7c31edf2adf1067ef0b` |
| `test/nv03-hook-work.test.js` | fixture-only declarations | `dd97382fe1b56e7c5f2047ddd42736806286a7d0c8a2dcd3f02ad7f84a84027e` |
| `test/nv04-recovery.test.js` | fixture-only declarations | `9a073c9421ce6fd05e47f3835f34a243283d0ff906153dc3bf5b4865bf9c5ace` |
| `test/fix02-delegation-record.test.js` | fixture-only declarations | `f55e80ff53ff0cfbad8c9f1bc1b66386670f0556a69eb4d2ab0e5f460cf933aa` |
| `test/fix01-guidance-runtime.test.js` | fixture-only declarations | `3b86129a9e473e5816cfd50cdc5a95326263f193c89683bc5e1dc0ade46f3375` |
| `test/fix03-joined-runtime.test.js` | fixture-only declarations | `e867b11bfa54fae077cd2587665e0d4d74399fc19478424bae1f35ffc0e8fb24` |
| `docs/harness/reports/HL12-F03-writer-report.md` | 本 writer 报告 | 报告完成后由主管直接读回计算 |

Retained artifacts 未写：0.10 SHA-256 仍为 `d73f4b4f83e6034e33168995c24ca4514d69bcd70ccc19f8aa255da42d218daa`；0.11 仍为 `8e14e641b7d0fe3641a5e74c49b11a60761e0dc63fb75866ff8226e6b3687ae5`。

## 8. UNKNOWN、边界与清理

- 产品版本仍是 0.11.0；F03 没有 F07 的 version/candidate 权限，不声明 0.12 candidate identity。
- CEX-05 stale capability 仍是唯一计划内 known-red，由 F04 owning；F05 guidance、F06 最终公共接线、F07 candidate/行为评测和 F08 closeout 均未开始。
- `lib/hook.js`、`bin/hl.js`、install/dispatcher、capability、guidance、package/version/candidate、retained artifacts 与历史报告均未由 F03 修改。
- shared workspace 中 `docs/harness/delegation.json` 在 F03 期间出现主管维护的 concurrent lifecycle 变化；不是本 writer 写入，已原样保留，也不计入上表。
- 没有真实 install、push、tag、release 或 deploy；没有读取或写入真实 `/home/synadmin/.codex` 配置内容；没有操作或干扰 Poracode、watchdog、bridge 等宿主进程。
- 每个 F03 disposable root 都在删除前核对为真实目录且非 symlink，再用精确路径删除。最终 `find /tmp -maxdepth 1 -name 'hl12-f03-*'` 无输出；没有 F03 临时输出文件残留。
