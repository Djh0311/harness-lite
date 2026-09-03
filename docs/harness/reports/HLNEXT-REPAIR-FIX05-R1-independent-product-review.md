# HLNEXT-REPAIR FIX05 R1 independent product review

日期：2026-08-31（Asia/Shanghai）  
Reviewer：全新独立产品 reviewer（未参与 FIX01-FIX04 实现或返修）

结论：`PASS / INDEPENDENT PRODUCT ACCEPTANCE / CANDIDATE ONLY / NOT PUSHED / NOT RELEASED`

本报告只登记本轮独立产品验收结论，不登记 FIX05 accepted，不关闭 leaf/stage，不修改产品代码或旧报告。R0 FAIL、writer COMPLETE、主管 PASS 均按待核假说重新验证。

## 1. Candidate 与范围

- 当前 candidate：version `0.10.0`，34 files，其中 13 product JS。
- 独立重算：file digest `sha256:5daef70dacc7e8a178448802d8b30dd2dc699a4cd82b658a244038fdf597e266`；product digest `sha256:adb56138a4c0979fb586ca58aab3861cda506f25fa08d40963f463625c228c05`；candidate digest `sha256:ee3a584a949016a1b447f7e7f7257f1fbb3e1d86299730fc06a3192c66ecac60`。
- 两次完整 candidate artifact byte-for-byte 相同，A/B digest 均为上述 candidate digest。
- provenance：`git.repo=false / head=null`；工作区的空 `.git` 与 git 命令失败作为事实保留，未伪造 Git provenance。
- 本轮 challenge：`HL-FIX05-R1-CHALLENGE-8f3a1c7e5b9d2a04`；文件原文精确一行，SHA-256 `sha256:b25bf4888d7d2d33fc0ec84a714e85739ae3c781047259e796c6fbac2a7396c3`。

## 2. 生产调用链与安装指导

结论：`PASS`。

- `lib/tree.js:259-285` 的 `workUnitPackage()` 输出 goal、directAcceptance、allowed/forbidden、boundaries、facts、entryPoints、disprovenRoutes、unknowns、routeBasis、dependencies、resultContract。
- `lib/hook.js:128-160` 的 `hookContext()` 将该 package、capability projection 和 delegation lifecycle 合并到上下文；`lib/hook.js:183-210` 是 SessionStart/UserPromptSubmit 实际 handler。
- 安装入口 `hooks/dispatcher.js:25-37` 在 `verify06` 后直接调用 `hook.dispatch(root, data)`；没有 helper-only 替代或 Harness 内部 agent 调度。
- `lib/capabilities.js:76-115` 从 `.codex/harness-lite/capabilities.json` 或 `docs/harness/capabilities.json` 规范化实时 manifest；缺失、非法或未知字段 fail closed 为 `UNKNOWN`，不按模型名猜可用性。
- `lib/delegation.js:676-686` 暴露 record API；`lib/delegation.js:742-803` 汇总 heartbeat、accepted-only dependency unlock 与 recovery。`hooks/README.md:3-19`、`skills/root-cause.md:12-22`、`skills/split-work.md:6-18` 明确指导模型在真实 collaboration 工具调用之后从已安装项目根加载 `./.claude/harness-lite/lib/delegation.js` 记账。

我在真实临时项目 `/tmp/hl-fix05-r1-manual-IyLVjF` 用 `bin/hl.js install --target ... --write --source /home/synadmin/harness-lite-0.9.1 --json` 安装，并以安装后的 dispatcher 直接读取：`verify06=true`，SessionStart `1315` chars，UserPromptSubmit `1371` chars；AGENTS.md、CLAUDE.md 与两个事件均实际包含 goal、direct acceptance、route basis、facts、entry points、allowed/forbidden boundaries、dependencies、current capability 与 lifecycle。删除 manifest 后上下文为 `Capabilities：state=UNKNOWN；availability=UNKNOWN`。1800 chars 压力下 lifecycle 分类仍保留。

## 3. R01-R18 独立矩阵

| ID | 结论 | 直接核验摘要 |
| --- | --- | --- |
| R01 | PASS | Hook 只投影/记账；真实选模、spawn、wait、status、message、interrupt、takeover 由指导模型工具完成。 |
| R02 | PASS | `bin hooks lib scripts` JS 静态扫描无 provider adapter、credential、static catalog、UI/transcript、daemon、后台 timer 或网络调用。 |
| R03 | PASS | installed manifest projection 使用结构化 channel/model/reasoning/status；missing/invalid manifest 是 UNKNOWN，未猜模型。 |
| R04 | PASS | `grok` engineering、`gemini` frontend、`terra/sol` 仅 xhigh problem recovery，未知 family 为 `unclassified`；本轮实际身份来自 receipt，不由名字推断。 |
| R05 | PASS | package 与 installed Hook 只暴露最小 goal、验收、边界、事实、入口、已否定路线和 UNKNOWN。 |
| R06 | PASS | package 和 Hook 实际可见 route basis，并保留诊断方式不等于最终实现的边界。 |
| R07 | PASS | live leaf 的 REV11/REV12 依赖与 README 写面被物理验证；没有固定全局串行调度器。 |
| R08 | PASS | disposable live leaf 是唯一当前容器；REV11 允许 README，REV12 只由接受后的上游解锁。 |
| R09 | PASS | 源码与 installed guidance 固定 300000ms heartbeat；R1 receipt 的 reviewerHeartbeat/workerWait 均 `timeoutMs=300000`，无短轮询。 |
| R10 | PASS | `reported_complete` 时 REV12 `ready=false`；root direct acceptance 写入 accepted 后 `ready=true`。 |
| R11 | PASS | activity、heartbeat、semantic progress、reported、accepted 分开记账；文件/测试/沉默未被冒充 progress。 |
| R12 | PASS | 只有同一直接验收下的具体 claimed-complete 语义失败计数；provider/tool/auth/queue fault 不计数。 |
| R13 | PASS | 主 ledger 仅 1 个 counted effective failure；未发生 Terra/Sol 普通使用或错误升级。 |
| R14 | PASS | 同 stable root/problem 跨 channel/session replay 为 `DUPLICATE` 且零写；acceptance pass 后只清当前 lease。 |
| R15 | PASS | 文档要求能由代码、现场或工具查明的事实自行查证，资料调查不冻结无依赖分支。 |
| R16 | PASS | plan 允许只读查看旧系统调用关系/行为，不把旧系统作为未来权威；本轮未扩大范围。 |
| R17 | PASS | current user scope 高于 plan/leaf/receipt/Hook/ledger；内部状态只投影，不扩大授权。 |
| R18 | PASS | native pre-push、一次性确认、安装身份、迁移回滚与载体区分均通过；未 push/tag/release/deploy，未触碰 Poracode/watchdog/bridge。 |

## 4. 本轮动态 challenge 的 joined workflow

按要求由 root 作为唯一指导与验收模型，在 `/tmp/hl-fix05-r1-live-wXlh60` 真实安装并派发新 worker；我只在完成其它矩阵后只读读取 ready receipt、challenge、README、installed Hook 与 ledger，未用模块调用替代 collaboration schema。

`FIX05-LIVE-READY.json`：`ready=true`，kind 为 `harness-lite-fix05-live-review-receipt`；root 是 guiding/acceptance model，真实 worker 为 `/root/hlnext_fix05_r1_challenge_worker`，channel `collaboration.spawn_agent`，model `gpt-5.4`，modelFamily `openai-engineering`，reasoning `xhigh`。reviewer challenge 字段、`REVIEW-CHALLENGE.txt` 原文与 SHA-256 三者一致，marker count 为 1，README SHA-256 为 `sha256:b6fe18fcbd4f220a0e4804be7f2b9a0bf8fd63b351340f9a8322d607bf3b8dc9`。

installed live ledger 只读核验到：

- worker active/reported/accepted 的 `channel/model/modelFamily/reasoning` 均保存；真实 writer 写面只有 `README.md`。
- non-README 文件数为 34；before/after tree digest 均为 `sha256:ef9a1d6b4165449a540ff65fc50105deb0d43c53350767d69885d7c9c3d80f7e`。
- `reported_complete` 时 REV12 `ready=false`、上游未 accepted；root direct acceptance 后 REV12 `ready=true`、上游 `accepted`。
- installed live runtime `verify06=true`，SessionStart `1373` chars、UserPromptSubmit `1429` chars；known projection 字段均可见。缺 manifest 时 SessionStart `1237` chars，state/availability 均 `UNKNOWN`，并指示读取 current real tool definitions。
- receipt 的 `agentTools.spawn=collaboration.spawn_agent`、两次 agent wait 均 `timeoutMs=300000`；worker wait 提前正常返回 `COMPLETE`，`shortWaitOrStatusCalls=0`、messages/interrupts/takeovers 均 0，`harnessSourceCalledAgent=false`。

这满足了 R0 缺失的 reviewer-turn/real-worker joined evidence；worker 期间非 README tree 保持一致，README 精确承载本轮 token。

## 5. failure、recovery 与 ledger 审计

结论：`PASS`。

在物理安装项目的 installed delegation API 上复核：一个 controlled direct claimed-complete acceptance failure 在 API/report/disk 均为 1；换 channel/session 的同 root 同问题为 `DUPLICATE`、零写且不新增；provider/transport/auth/permission/quota/host fault `counted=false`；acceptance pass 后 problem 为 `accepted` 且 lease 数为 0。live receipt 同时给出 `effectiveFailureCount=1`、`countedFailureEventCount=1`、`nonCountingFailureEventCount=1`、provider 不计数。

当前主 `docs/harness/delegation.json` 直接核验：累计 counted effective failure 只有 FIX02 的 1 个，已 acceptance-pass closed、无 active lease；FIX03 相关的两个问题均 non-counting 且 acceptance-pass closed：`worker-hook-telemetry-versus-byte-freeze`（exploration-negative）与 `reviewer-turn-collaboration-tool-surface`（R0 tool）。无 Terra/Sol 普通使用。FIX05 R1 的 disposable failure 只在临时项目，不污染主 ledger。

监督时间线按 event type 与实际工具事实审计：

- FIX01：两次 300000ms heartbeat；FIX02 原轮次两次、R1 五次均为 300000ms heartbeat；FIX03 一次 300000ms heartbeat。
- FIX04 在报告 COMPLETE 前提前完成，没有伪造额外 heartbeat；其提前 COMPLETE 事实不被改写。
- FIX05 R0 的 `hlnext-repair-fix05-heartbeat-1` 存储类型是 `status`，`heartbeat-1b` 才是 `heartbeat`；两者相隔 24.446s 是本地记账纠错，不是第二次 agent wait。历史事件保留。
- FIX05 R1 root supervision 的 reviewer heartbeat 与 worker wait 都是 `collaboration.wait_agent(timeout_ms=300000)`；receipt 明确短 wait/status 为 0。只按 event type 和 joined receipt 判断，不按事件 ID 猜测。

## 6. 测试与物理安装矩阵

- `npm test`：`92/92 PASS`。
- `npm run selfcheck`：全测通过 `3.69s`，实现 4558、测试 4660、技能 60、内部接口 6（目标 6）。
- 13 个产品 JS `node --check` 全部 status 0。
- `node --test test/nv05-integration.test.js`：`11/11 PASS`，覆盖 fresh install、managed install、固定 0.9.1 upgrade、coherent tamper、extra/relabel HOLD 零写、fault rollback、host evidence exact join、native push、candidate completeness 与 forbidden architecture scan。
- physical disposable probes：fresh/managed 均 `INSTALLED`；固定 0.9.1 先 HOLD、显式 upgrade 后安装且 `verify06=true`；coherent tamper 与 relabel 均 HOLD/`written=0`/runtime bytes 不变；fault rollback 四阶段均 `PARTIAL`、preimage 保留且无 runtime residue；host evidence 完成四事件 exact join 后 trusted/observed 全 true；native disposable local bare remote probe `ok=true`，uninstall 后无 runtime residue。

## 7. R01-R18 冻结 hash 与历史 NV00-NV06 清单

当前 `NEXT-VERSION-DISPATCH-PLAN.md`：`R01-R18` 冻结需求块（文件开头至 `## 二、产品边界` 前）独立重算为 `sha256:1a69fc8dbbef7304938b9da1f20af9daf47f6b24b131b6d8861c8c906d66a719`，与要求一致。文件当前索引明确返修已启动，历史 NOT ACTIVE/NOT EXECUTED 不再代表当前状态，并明确本历史文件不声明 FIX05 结果；未把当前状态同时声称为未启动和已完成，也未预判 FIX05。

以下 16 份是 R0 independent report 在 R1 前列出的冻结清单；我逐份以当前文件重算，均 `MATCH`，文件均仍存在、相互区分，未覆盖旧 R0/NV 报告：

1. `HLNEXT-NV00-supervisor-acceptance-PASS.md` — `sha256:8011ceb33ba4d308f144275c9fe74e07550a9d5c4a061f65060a1c91150dcc2e` — MATCH
2. `HLNEXT-NV01-supervisor-acceptance-PASS.md` — `sha256:2dcfe503bea1068be5d75cc62056368573d2def2723423bf13e3f9d5453d72a6` — MATCH
3. `HLNEXT-NV02-supervisor-acceptance-PASS.md` — `sha256:17763ad40adaaa85b1a656aae71620e263ebed2b619357c4603dea46abe6d177` — MATCH
4. `HLNEXT-NV03-R1-supervisor-acceptance-FAIL.md` — `sha256:1f27834eac234554bdd4da5d288d044234d15a98611994241940e9586e104c4f` — MATCH
5. `HLNEXT-NV03-R2-supervisor-acceptance-FAIL.md` — `sha256:b192988d2a8e73f18845fbd9e7dcf30f1f0669be3f5073546833f281bf7f85fb` — MATCH
6. `HLNEXT-NV03-R3-supervisor-acceptance-FAIL.md` — `sha256:5e16ade9d2b1f6be8e8b6bf4bde26005277a4151f38f6fcb9d5e26fb1acbb293` — MATCH
7. `HLNEXT-NV03-supervisor-acceptance-PASS.md` — `sha256:763fcb0ccac218d835978f52174454a3b9f0c1a34ab2d121773412742d8db4e7` — MATCH
8. `HLNEXT-NV04-R1-supervisor-acceptance-FAIL.md` — `sha256:660a141d9daf100a284fb7421665639800208d4c5717f2211a816083ff0de654` — MATCH
9. `HLNEXT-NV04-R2-supervisor-acceptance-FAIL.md` — `sha256:87c40459ae98bd23393a212f3c095364ff41175fe4d6785e86c46b667d616e86` — MATCH
10. `HLNEXT-NV04-R3-supervisor-acceptance-FAIL.md` — `sha256:73f685299be2721b82730ac4c9f4e8151663b766fa1e94aeef37796ea9723594` — MATCH
11. `HLNEXT-NV04-supervisor-acceptance-PASS.md` — `sha256:077aa46881e54c01e177a7aac761cdef6467b82d591dc4bd6dedb35f52bd488b` — MATCH
12. `HLNEXT-NV04-v1-supervisor-acceptance-FAIL.md` — `sha256:cf85cd8bd6333a330ef7446a9a3e5e575b60b8b10cb28f8d3b2387bb7ea242e0` — MATCH
13. `HLNEXT-NV05-supervisor-acceptance-PASS.md` — `sha256:d92914c888bebbb45bbbc391dc1fe6e2f3dc3cb1881341509a503d8a3ed88e6b` — MATCH
14. `HLNEXT-NV05-v1-supervisor-acceptance-FAIL.md` — `sha256:0b5c1fd4e0dfbf6cbdefec9eae42dc1846773dbd8872a22be6f04faa48c93143` — MATCH
15. `HLNEXT-NV06-independent-product-review.md` — `sha256:9a286d83151e2aea7a265b1159ba04274a5206fdbd779b5e89ca7699bbc5f7ba` — MATCH
16. `HLNEXT-NV06-supervisor-closeout-PASS.md` — `sha256:e62294f4870d0642b17188bf1b5311830a05df74c62a7240b0ce73bab9644978` — MATCH

## 8. 架构、主机与残余 UNKNOWN

静态与物理扫描均未发现 provider adapter、daemon、credential persistence、UI/static catalog、transcript store、第二调度器、网络调用或 Harness 源码 agent call；唯一 dispatcher 是 `hooks/dispatcher.js`。未发现 push/tag/release/deploy 或 Git provenance 伪造；没有执行任何 Poracode/watchdog/bridge 干扰操作。

残余 `UNKNOWN` 仅为外部 memory 是否由用户另行确认更新；本轮未修改 external memory。Git provenance 仍按 `git.repo=false / head=null` 记录，不构成 candidate acceptance blocker。其它直接验收项无未解决 blocker。
