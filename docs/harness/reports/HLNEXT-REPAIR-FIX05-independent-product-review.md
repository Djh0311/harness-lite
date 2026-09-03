# HLNEXT-REPAIR FIX05 independent product review

日期：2026-08-31（Asia/Shanghai）

Reviewer：独立产品 reviewer（本轮未参与 FIX01-FIX04 实现）

结论：`FAIL / INDEPENDENT PRODUCT REVIEW / RETURN TO FIX03 FOR LIVE REVIEWER-TURN REAL-AGENT REPLAY / FIX05 NOT ACCEPTED / CANDIDATE ONLY / NOT PUSHED / NOT RELEASED`

本次不写 PASS 的直接原因有两个：

- 我已独立重跑源码、安装、hook、delegation、upgrade、tamper、managed、host evidence、native push gate 与 candidate 矩阵，产品候选本体未发现新的 joined/runtime 回退。
- 但 FIX05 指令要求“由我这个指导模型直接调用当前 agent 工具”独立完成一次真实 joined agent workflow replay。当前 reviewer 子会话可见工具面没有向我暴露可直接调用的 `spawn_agent` / `wait_agent` / `followup_task` / `list_agents` schema；因此我只能独立核实已安装 runtime、当前 repair ledger 和既有 FIX03 证据，不能把“上一位 supervisor 已做过”冒充成“我本轮亲自重放过”。
- 同时，当前真实 `docs/harness/delegation.json` 中 FIX05 监督序列出现一次额外的非 300000ms 间隔 heartbeat：`hlnext-repair-fix05-heartbeat-1`（2026-08-31T11:59:03.949Z）到 `hlnext-repair-fix05-heartbeat-1b`（2026-08-31T11:59:28.395Z）仅 24.446s。这与本轮要求的“只使用 300000ms wait/status、正常沉默不介入、无 30/60 秒忙轮询”不一致。

## Candidate 摘要

- `node scripts/build-candidate.js --json` 连续两次一致：
  - version=`0.10.0`
  - files=`34`
  - product JS=`13`
  - file digest=`sha256:5daef70dacc7e8a178448802d8b30dd2dc699a4cd82b658a244038fdf597e266`
  - product digest=`sha256:adb56138a4c0979fb586ca58aab3861cda506f25fa08d40963f463625c228c05`
  - candidate digest=`sha256:ee3a584a949016a1b447f7e7f7257f1fbb3e1d86299730fc06a3192c66ecac60`
  - provenance=`git.repo=false / head=null`
- `npm test`：`92/92 PASS`
- `node bin/hl.js selfcheck --run --json`：`ok=true`，并再次实跑 `92/92 PASS`
- 13 个产品 JS 全部 `node --check` status `0`

## 本轮真实模型/工具面

- 本轮 reviewer 会话没有向我暴露 Grok/Gemini/Terra/Sol 的结构化 model list，也没有暴露可直接调用的 collaboration agent tool schema。
- 因此本轮普通 reviewer 只使用当前 GPT-5 系 Codex 工程模型完成只读核验；Terra/Sol 未使用。
- 这满足“不要猜模型、没有结构化能力信息就不要虚构 model availability”，但也意味着 item 3 的“由我亲自直接调用当前 agent 工具重放”无法在本子会话内完成。

## 逐项验收

### 1. `workUnitPackage()` / capability projection / delegation record 的真实生产调用链

结论：`PASS`

证据：

- `lib/tree.js:259-285` 定义 `workUnitPackage()`，输出 goal / directAcceptance / boundaries / facts / entryPoints / disprovenRoutes / unknowns / routeBasis / dependencies / resultContract。
- `lib/hook.js:141-160` 在 `hookContext()` 中把 `workUnitPackage()`、capability projection 和 delegation lifecycle 一起压入 `SessionStart` / `UserPromptSubmit` 上下文。
- `lib/hook.js:183-210` 的 `sessionStart()` / `userPrompt()` 是真实 hook handler。
- `hooks/dispatcher.js:25-37` 是已安装 runtime 的真实生产入口；identity 通过后直接 `hook.dispatch(root, data)`。
- `lib/capabilities.js:107-114` 的 `project()` 从 `.codex/harness-lite/capabilities.json` / `docs/harness/capabilities.json` 读取结构化 manifest；缺失时 fail closed 为 `UNKNOWN`。
- `lib/delegation.js:676-686` 暴露 `recordAgentStatus()` / `recordAgentObservation()` / `recordAgentFailure()` / `recordAgentRecovery()`；`lib/delegation.js:742-803` 独立汇总 accepted-only unlock、heartbeat 与 recovery。
- 已安装 runtime 的真实指导入口不是 helper 自证：`hooks/README.md:3-19`、`skills/root-cause.md:12-22`、`skills/split-work.md:6-18` 都明确要求指导模型在真实 agent 工具调用之后，从项目根加载 `require("./.claude/harness-lite/lib/delegation.js")` 记账；Harness 源码自身不调用 agent。
- `node --test test/fix02-delegation-record.test.js test/fix03-joined-runtime.test.js test/nv05-integration.test.js` 中与 installed runtime/project root 相关的 16 个子测试全部 PASS，不是只测 helper。

### 2. 全新临时 Git 项目真实安装、`AGENTS.md` / `CLAUDE.md` / SessionStart / UserPromptSubmit

结论：`PASS`

我独立创建了 disposable Git 项目并真实执行：

- `node bin/hl.js install --target <temp> --write --source /home/synadmin/harness-lite-0.9.1 --json`
- 安装后 `./.claude/harness-lite/lib/install.js.verify06(process.cwd())` 返回 `ok=true`

直接观察到：

- 安装 runtime manifest 为 19-path 当前候选，`packageDigest=sha256:a16c7eaa7b8ba30a364d99eeb3760b01578b677e9534985d0e572348b62be2cd`
- 新安装的 `AGENTS.md` / `CLAUDE.md` 均包含：
  - 产品实现/修复要求指导模型直接派 writer
  - 讨论/只读分析/计划准备不因形式强制派 writer
  - Grok 偏工程 / Gemini 偏前端 / Terra-Sol 仅问题级恢复
  - 先用最短直接证据验证关键判断
  - 诊断手段不自动成为最终产品架构
- 我用安装后的 `hooks/dispatcher.js` 直接打 `SessionStart`：
  - 长度 `1315` chars
  - 实际包含 `goal`、`directAcceptance`、`routeBasis`、`facts`、`entryPoints`、`dependencies`、`Scope：allowed=README.md；forbidden=release；boundaries=allowed/forbidden`
  - capability 行实际可见：`Capabilities：state=known；availability=available；model=review/gpt-5/xhigh:available；source=.codex/harness-lite/capabilities.json`
- 同一安装 runtime 的 `UserPromptSubmit` 长度 `1371` chars，并包含来源收据句首 `本轮用户消息已记录为来源收据`
- 我删除 manifest 后再次打 `SessionStart`，上下文明确返回 `Capabilities：state=UNKNOWN；availability=UNKNOWN`
- 1800 chars 压力与生命周期分类保留由我重跑：
  - `node --test test/fix01-guidance-runtime.test.js test/nv03-hook-work.test.js`
  - 结果 `14/14 PASS`
  - 其中包含 `installed runtime keeps required guidance fields visible under 1800 chars when capability manifest is absent`
  - 以及 `bounded SessionStart and UserPromptSubmit contexts keep all lifecycle categories visible within 1800 chars under stress`

### 3. 真实 joined agent workflow：由我直接调用当前 agent 工具派 worker，证明 reported_complete 不解锁、accepted 才解锁

结论：`FAIL`

已通过但不够的证据：

- `docs/harness/reports/HLNEXT-REPAIR-FIX03-supervisor-acceptance-PASS.md` 已记录上一轮 supervisor 用真实 `collaboration.followup_task` + `wait_agent(timeout_ms=300000)` 完成 joined runtime / real agent workflow。
- `docs/harness/delegation.json` 当前记录也显示 FIX03 真实 agent 身份：
  - `hlnext-repair-fix03-active-v1` / `...heartbeat-1` / `...reported-complete-v1` / `...accepted-v1`
  - channel=`collaboration.followup_task`
  - model=`gpt-5.5`
  - modelFamily=`openai-engineering`
  - reasoning=`xhigh`
- 我自己重跑了安装 runtime 的 direct ledger probe，确认：
  - `reported_complete` 时下游 `ready=false`
  - `accepted` 后下游 `ready=true`
  - installed runtime 能保存 `channel/model/modelFamily/reasoning`

失败原因：

- FIX05 要求的是“由我这个 reviewer turn 直接调用当前 agent 工具派一个 disposable worker”。
- 当前 reviewer 子会话没有把 collaboration agent tools 作为可直接调用 schema 暴露给我；我无法在本 turn 亲自发起新的真实 worker dispatch，也无法亲自执行 `wait_agent(timeout_ms=300000)`。
- 因此这项 direct acceptance 仍缺“由我本人重放”的证据，不能被既有 FIX03 记录替代。

精确退回：`FIX03`

返修目标不是改产品代码，而是在一个对独立 reviewer 明确暴露 collaboration tools 的 reviewer turn 中，按 FIX05 指令重新完成一次真实 disposable worker replay，并把 reviewer-turn 直接证据补齐。

### 4. disposable carrier 中制造 claimed-complete semantic failure；provider/tool/auth/queue fault 不增加；跨 session/channel 不复位

结论：`PASS`

我在 disposable temp project 的 installed runtime 上直接调用 `./.claude/harness-lite/lib/delegation.js`：

- 第 1 次 `claimed-complete-acceptance-failure`：
  - `counted=true`
  - API `effectiveFailureCount=1`
  - 同次落盘 `recovery.failureCount=1`
- 再记一条 `provider-transport-auth-permission-quota-host`：
  - `counted=false`
  - `effectiveFailureCount` 仍为 `1`
  - `nonCountingFailureEventCount=1`
- 换 channel / model 再记第 2 条同一 stable problem 的 semantic failure：
  - `counted=true`
  - `effectiveFailureCount=2`
  - `recovery.failureCount=2`
  - `problemCount=1`
  - 所有 failure event 共享同一 `leaseKey`

额外直证：

- `node --test test/fix02-delegation-record.test.js test/fix03-joined-runtime.test.js test/nv05-integration.test.js` 中：
  - `agent failure API reports recovery counts from the same ledger and ignores provider faults`
  - `FIX03 joined install runtime projects guidance, delegation, dependency locks, and effective failures`
  - 全部 PASS
- 项目真实 repair ledger 未被我污染：上述 failure/recovery 全部发生在 disposable temp project，不写当前工作目录的 `docs/harness/delegation.json`

### 5. `npm test`、`selfcheck`、全部产品 JS 语法、双 artifact byte equality

结论：`PASS`

命令结果：

- `npm test`
  - `92/92 PASS`
- `node bin/hl.js selfcheck --run --json`
  - `ok=true`
  - disclosure `internalInterfaces=6`
  - 嵌套全测再次 `92/92 PASS`
- 13 个产品 JS `node --check`
  - `bin/hl.js`
  - `hooks/dispatcher.js`
  - `lib/authorization.js`
  - `lib/capabilities.js`
  - `lib/delegation.js`
  - `lib/evidence.js`
  - `lib/hook.js`
  - `lib/install.js`
  - `lib/io.js`
  - `lib/limits.js`
  - `lib/managed.js`
  - `lib/tree.js`
  - `lib/work.js`
  - 全部 status `0`
- `node scripts/build-candidate.js --json` 两次
  - candidate digest A = B = `sha256:ee3a584a949016a1b447f7e7f7257f1fbb3e1d86299730fc06a3192c66ecac60`
  - file digest A = B = `sha256:5daef70dacc7e8a178448802d8b30dd2dc699a4cd82b658a244038fdf597e266`
  - product digest A = B = `sha256:adb56138a4c0979fb586ca58aab3861cda506f25fa08d40963f463625c228c05`

### 6. 真实 fixed 0.9.1 upgrade、fresh/managed install、coherent-tamper、extra/relabel HOLD 零写、fault rollback、host evidence exact join、native push gate

结论：`PASS`

我独立重跑了 disposable integration probe，并另外重跑 targeted suite：

- `node --test test/fix02-delegation-record.test.js test/fix03-joined-runtime.test.js test/nv05-integration.test.js`
  - `16/16 PASS`
- 手工 disposable probe 结果：
  - fresh install：`INSTALLED`，`verify06.ok=true`
  - managed global + project install：两侧都 `INSTALLED`，gateway dispatch status `0`
  - fixed 0.9.1 upgrade：
    - prior runtimeVersion=`0.9.1`
    - no-upgrade 先 `HOLD`
    - 显式 `upgrade=true` 后 `INSTALLED`
    - `verify06.ok=true`
  - coherent tamper：
    - `inspect.kind=drift`
    - `install(...upgrade:true)` 返回 `HOLD`
    - `written=0`
    - runtime bytes 前后完全一致
  - relabel current as 0.9.1：
    - `inspect.kind=drift`
    - `HOLD`
    - `written=0`
    - runtime bytes 前后完全一致
  - host evidence exact join：
    - 初始 `trusted=false / observed all false`
    - 四事件 started/completed + dispatcher 实跑后，`trusted=true / observed all true`
  - fault rollback：
    - `swap:new`
    - `instruction:AGENTS.md:written`
    - `hooks:written`
    - `managed:registry:written`
    - 四处都返回 `PARTIAL`
    - preimage preserved / runtime residue absent
  - native push gate：
    - `installNative().configured=true`
    - `probeNative().remote=disposable-local-bare-remote`
    - `probeNative().ok=true`
    - uninstall 后 runtime 不残留

### 7. R01-R18 历史原文 hash、旧 NV00-NV06 报告未被覆盖；NEXT 文档当前状态不自相矛盾且不随 FIX05 结果过期

结论：`PARTIAL / NO-OVERWRITE PASS / EXACT PRE-REPAIR HASH EQUALITY UNKNOWN`

直接证据：

- `NEXT-VERSION-DISPATCH-PLAN.md:3-7` 现为
  - `HISTORICAL FROZEN DISPATCH BASELINE / NOT CURRENT EXECUTION STATE`
  - 明确“历史 `NOT ACTIVE / NOT EXECUTED` 不再是当前状态”
  - 明确“本历史文件不声明 FIX05 结果”
- 我独立重算了当前 16 份历史 NV00-NV06 报告的 SHA-256；全部文件仍存在且互相区分，未发现被当前返修报告覆盖：
  - `HLNEXT-NV00-supervisor-acceptance-PASS.md sha256:8011ceb33ba4d308f144275c9fe74e07550a9d5c4a061f65060a1c91150dcc2e`
  - `HLNEXT-NV01-supervisor-acceptance-PASS.md sha256:2dcfe503bea1068be5d75cc62056368573d2def2723423bf13e3f9d5453d72a6`
  - `HLNEXT-NV02-supervisor-acceptance-PASS.md sha256:17763ad40adaaa85b1a656aae71620e263ebed2b619357c4603dea46abe6d177`
  - `HLNEXT-NV03-R1-supervisor-acceptance-FAIL.md sha256:1f27834eac234554bdd4da5d288d044234d15a98611994241940e9586e104c4f`
  - `HLNEXT-NV03-R2-supervisor-acceptance-FAIL.md sha256:b192988d2a8e73f18845fbd9e7dcf30f1f0669be3f5073546833f281bf7f85fb`
  - `HLNEXT-NV03-R3-supervisor-acceptance-FAIL.md sha256:5e16ade9d2b1f6be8e8b6bf4bde26005277a4151f38f6fcb9d5e26fb1acbb293`
  - `HLNEXT-NV03-supervisor-acceptance-PASS.md sha256:763fcb0ccac218d835978f52174454a3b9f0c1a34ab2d121773412742d8db4e7`
  - `HLNEXT-NV04-R1-supervisor-acceptance-FAIL.md sha256:660a141d9daf100a284fb7421665639800208d4c5717f2211a816083ff0de654`
  - `HLNEXT-NV04-R2-supervisor-acceptance-FAIL.md sha256:87c40459ae98bd23393a212f3c095364ff41175fe4d6785e86c46b667d616e86`
  - `HLNEXT-NV04-R3-supervisor-acceptance-FAIL.md sha256:73f685299be2721b82730ac4c9f4e8151663b766fa1e94aeef37796ea9723594`
  - `HLNEXT-NV04-supervisor-acceptance-PASS.md sha256:077aa46881e54c01e177a7aac761cdef6467b82d591dc4bd6dedb35f52bd488b`
  - `HLNEXT-NV04-v1-supervisor-acceptance-FAIL.md sha256:cf85cd8bd6333a330ef7446a9a3e5e575b60b8b10cb28f8d3b2387bb7ea242e0`
  - `HLNEXT-NV05-supervisor-acceptance-PASS.md sha256:d92914c888bebbb45bbbc391dc1fe6e2f3dc3cb1881341509a503d8a3ed88e6b`
  - `HLNEXT-NV05-v1-supervisor-acceptance-FAIL.md sha256:0b5c1fd4e0dfbf6cbdefec9eae42dc1846773dbd8872a22be6f04faa48c93143`
  - `HLNEXT-NV06-independent-product-review.md sha256:9a286d83151e2aea7a265b1159ba04274a5206fdbd779b5e89ca7699bbc5f7ba`
  - `HLNEXT-NV06-supervisor-closeout-PASS.md sha256:e62294f4870d0642b17188bf1b5311830a05df74c62a7240b0ce73bab9644978`

仍为 `UNKNOWN` 的部分：

- repo 内没有独立存放的“返修前 R01-R18 section hash 来源”或“返修前 16 份历史报告 hash 清单”，只有 FIX04 prose claim。
- 因此我能确认“当前未被覆盖、当前文本是稳定的”，但不能仅凭本轮 repo 内证据把“与返修前精确同 hash”写成 fully independent PASS。

### 8. 审计真实 `docs/harness/delegation.json` 监督事件；FIX01/FIX02/FIX03 heartbeat；本次监督是否只用 300000ms wait/status；唯一历史有效失败与 recovery ledger 一致

结论：`FAIL`

通过部分：

- FIX01：
  - active -> heartbeat-1 = `300.000s`
  - heartbeat-1 -> heartbeat-2 = `300.000s`
  - heartbeat-2 -> reported_complete = `208.150s`
- FIX02 首候选：
  - active -> heartbeat-1 = `300.000s`
  - heartbeat-1 -> heartbeat-2 = `300.000s`
  - heartbeat-2 -> reported_complete = `208.162s`
- FIX02 R1：
  - 五个 heartbeat 间隔均为 `300.000s`
  - 第 5 次 heartbeat 后 `326.151s` 提前 COMPLETE
- FIX03：
  - active -> heartbeat-1 = `300.000s`
  - heartbeat-1 -> reported_complete = `93.796s`
- FIX04：
  - active -> reported_complete = `203.893s`
  - 说明首个 `wait_agent(timeout_ms=300000)` 提前 COMPLETE，无需凑满五分钟
- 唯一历史有效失败与 recovery ledger 一致：
  - `docs/harness/delegation.json` 当前 `failures.events=2 / problems=1 / leases=0`
  - 有效失败为 `hlnext-repair-fix02-effective-failure-r1`
  - 对应 `acceptance_pass` 为 `hlnext-repair-fix02-acceptance-pass-r1`
  - problem `status=accepted / effectiveCount=1`
  - 与 `docs/harness/reports/HLNEXT-REPAIR-FIX02-R1-supervisor-acceptance-FAIL.md`、`...PASS.md` 一致

失败点：

- 当前 FIX05 监督序列不是严格单一 300000ms cadence：
  - `hlnext-repair-fix05-active-v1` -> `hlnext-repair-fix05-heartbeat-1` = `314.087s`
  - `hlnext-repair-fix05-heartbeat-1` -> `hlnext-repair-fix05-heartbeat-1b` = `24.446s`
  - `hlnext-repair-fix05-heartbeat-1b` -> `...heartbeat-2` = `310.663s`
  - `...heartbeat-2` -> `...heartbeat-3` = `312.773s`
  - `...heartbeat-3` -> `...heartbeat-4` = `308.035s`
- 其中 `heartbeat-1` 到 `heartbeat-1b` 的 24.446 秒额外观测，不符合“正常沉默不介入、无 30/60 秒忙轮询、只使用 300000ms wait/status”的 FIX05 审核要求。

这项因此不能写 PASS。

### 9. 禁用面扫描：不存在 provider adapter、daemon、credential store、UI scraping、static model catalog、transcript 依赖、第二调度器；未 push/tag/release/deploy；未伪造 Git provenance；未干扰 Poracode/watchdog/bridge

结论：`PASS`

直接证据：

- `rg -n` 扫描 `bin hooks lib skills package.json scripts -g '!docs/**' -g '!test/**'`
  - 没有产品实现层的 `spawn_agent` / `wait_agent` / `followup_task` / `send_message` / `interrupt_agent`
  - 命中的 agent/provider/transcript/credential 文本只出现在指导文档、fail-closed 文案或 `FORBIDDEN_KEYS` 防护
- `hooks/README.md:5-19`、`skills/split-work.md:16-18`、`lib/install.js:109` 都明确“Harness 不 spawn/poll/interrupt agent、不连接 provider、不抓 UI、不保存 credential/transcript、不运行 daemon”
- `node --test test/fix02-delegation-record.test.js test/fix03-joined-runtime.test.js test/nv05-integration.test.js`
  - 子测试 `current product surface does not implement provider adapters, static model catalogs, credential stores, or daemons` PASS
- 当前工作目录不是 Git repo；`git status` / `git rev-parse` 只返回 not-a-repo，候选 provenance 也保持 `git.repo=false / head=null`
- 本轮只读 review 未执行 push/tag/release/deploy，也未执行任何 kill/restart/interfere Poracode/watchdog/bridge 动作

### 10. external memory 不修改

结论：`PASS`

我只做了 memory quick pass 读取；未写入任何 `/home/synadmin/.codex/memories/extensions/ad_hoc/notes/`，也未修改任何 memory 文件。

## 残余 UNKNOWN

- 当前 reviewer 子会话为什么没有向我暴露 collaboration agent tool schema：这是本轮工具面事实，但 repo 内没有进一步可验证原因。
- R01-R18 与 16 份历史 NV00-NV06 报告的“返修前 exact hash 清单”未在 repo 内独立保存；因此 exact pre/post equality 无法只靠本轮仓内证据完全重建。

## 结论说明

如果只看 0.10 candidate 产品本体、安装 runtime、delegation ledger、upgrade/rollback/safety/push gate 和 candidate determinism，我没有发现新的产品级回退；这些部分在我本轮独立核验中大体通过。

但 FIX05 的通过条件不是“产品看起来没问题”，而是“独立 reviewer 把要求中的 direct evidence 全部亲手补齐”。目前至少两点不满足：

- item 3 缺我本人在本 turn 直接发起的真实 agent replay；
- item 8 的当前 FIX05 supervision ledger 出现一次 24.446s 额外 heartbeat。

因此本报告只能给出 `FAIL`，且不登记 FIX05 accepted，不关闭 leaf/stage。
