# HLNEXT-REPAIR R3F04 independent product review

日期：2026-09-01（Asia/Shanghai）

Reviewer：`gpt-5.6-luna/xhigh`，独立产品 reviewer；未参与 R3F01、R3F02、R3F03 实现。writer 的 COMPLETE、主管报告、旧 R2 PASS 和 helper/module 单测均不作为本报告验收依据。

## Verdict and boundary

结论：`PASS / INDEPENDENT PRODUCT ACCEPTANCE / CANDIDATE ONLY / NOT PUSHED / NOT RELEASED / NOT DEPLOYED`。

这是独立产品验收，不是主管终验、leaf 关闭或最终归档。当前 R3F04 仍须由主管按生命周期直接验收；R3F05 尚未执行。

本轮唯一允许的持久工作区写入是本报告。未修改 `bin/`、`hooks/`、`lib/`、`test/`、`scripts/`、`NEXT`、plan、stage、leaf、delegation、历史报告或 external memory；未 push、tag、release、deploy；未杀死、重启或干扰 Poracode/watchdog/bridge。

工作区没有可用 Git provenance：`git status --short --branch` 和 candidate builder 的 `git rev-parse --verify HEAD` 均得到 `fatal: not a git repository`/`repo:false, head:null`。该异常只作为 provenance 事实报告，不被伪造成产品证据。

所有 disposable 产物均置于我创建的精确根 `/tmp/hl-r3f04-independent`，报告写完后删除并复核不存在。

## R01-R18 独立重建矩阵

冻结正文由 `NEXT-VERSION-DISPATCH-PLAN.md` 从 `## 一、冻结的需求基线`（含）到 `## 二、产品边界`（不含）按 UTF-8 重新提取：`4772` bytes，`sha256:1a69fc8dbbef7304938b9da1f20af9daf47f6b24b131b6d8861c8c906d66a719`，与用户 R3 Kickoff 目标一致。

| ID | 直接验收证据与结果 |
|---|---|
| R01 | 安装 dispatcher 只接收 Hook 输入并投影 context；产品可执行面没有 `spawn_agent`、`wait_agent`、`followup_task`、`send_message`、`interrupt_agent`，PASS。 |
| R02 | 生产 caller/installed runtime 扫描无 provider adapter、静态模型目录、credential store、UI scraping、transcript 依赖、daemon 或 timer，PASS。 |
| R03 | Hook-input 结构化 manifest 在 installed `SessionStart`/`UserPromptSubmit` 动态生效；24 模型完整载体、增删后的 path/digest 变化、超限 `UNKNOWN/incomplete`，PASS。 |
| R04 | 五模型载体逐行保留 channel/model/reasoning/family/status/availability/capabilities/suitability；Grok→engineering、Gemini→frontend、Terra/Sol xhigh→problem-recovery，PASS。 |
| R05 | fresh install 的 `R3F31`/`R3F32` 是两个独立无依赖、非重叠写面的 active unit；最小包包含 goal/direct acceptance/boundary/facts/entry points/route/UNKNOWN，且未传人工 selector，PASS。 |
| R06 | installed work-unit package 和 Hook context 保留单一轻量 route basis、disproven routes 与 UNKNOWN，PASS。 |
| R07 | 两个独立 unit 并行；`concurrencyLimit:null`；加入第三 active unit 后由新进程调用 `work.parallelWorkUnitContext`，无全局固定串行/并发调度，PASS。 |
| R08 | `tree.readChain`/status 只有一个 current leaf：`HLNEXT-REPAIR-R3`；leaf 内多个 work unit，PASS。 |
| R09 | 原始 root JSONL 在 R3 Kickoff 后逐项解析 9 次 `collaboration.wait_agent`，每次精确 `timeout_ms=300000`；4 次提前返回、5 次完整超时，无 30000/60000 忙轮询，PASS。 |
| R10 | `reported_complete` 仍不解锁依赖；`accepted` 后才 runnable；blocked/partial 只冻结 dependents；直接测试 PASS。 |
| R11 | installed context 和 ledger 分开保留 activity、heartbeat、progress、reported、accepted；工具等待不自动变成 progress，PASS。 |
| R12 | 当前两个稳定问题只按直接错误各计数一次问题级事件；同根多错未重复计数，普通工具/提供方故障在 disposable recovery test 中 `counted:false`，PASS。 |
| R13 | 当前 live ledger 没有错误触发 Terra/Sol；installed recovery test 验证普通五次后才 Terra、Terra 完整恢复才 Sol，PASS。 |
| R14 | 当前两个问题均 `status:accepted`、leases 为 0；acceptance pass 清理问题级租约，PASS。 |
| R15 | 无无边界资料调查或强制用户中转；可从当前代码、Hook、ledger 和现场直接查明的事实由 reviewer 直接验证，PASS。 |
| R16 | 旧 0.9.1 仅作为固定 17-path snapshot 被显式识别并升级；不被当作未来权威，PASS。 |
| R17 | 用户 Kickoff 的 candidate-only、禁止发布/改 provenance/改 memory/干扰宿主边界高于内部状态；R3 current index 未自行关闭，PASS。 |
| R18 | fresh/managed install、固定 0.9.1 upgrade、tamper/relabel/extra-path HOLD、fault rollback、host evidence、native pre-push gate 和双 candidate 均通过；宿主/Git 异常只报告，PASS。 |

## Candidate artifact and source-root materialization

独立执行（两次）并重新解析 artifact：

```text
node scripts/build-candidate.js --json --out /tmp/hl-r3f04-independent/candidate-1.json
node scripts/build-candidate.js --json --out /tmp/hl-r3f04-independent/candidate-2.json
cmp -s /tmp/hl-r3f04-independent/candidate-1.json /tmp/hl-r3f04-independent/candidate-2.json
```

两份 artifact 均为 `harness-lite-source-candidate`、package `harness-lite@0.10.0`，每份 canonical JSON `1051440` bytes；`cmp` exit `0`。独立从 artifact 字段重算/核对 `files`、`contentBase64` 解码、mode、per-file SHA、排序 digest：

| 项目 | 结果 |
|---|---|
| files | 39 |
| product JavaScript | 13 |
| fileDigest | `sha256:576f0edafdd2da2e81f06cf0a869f07092d987c5884e6bc8207eecd91b349ef4` |
| productDigest | `sha256:73f9ac6f54d863a5093144e165c17825ac9ba3560309d4382ecd3e8393ebda3e` |
| candidateDigest（canonical artifact bytes） | `sha256:b164bab93900c2cbaa2eb43be5ca144934ad83d2bcae6dad4c0c9b0cfb2e95ea` |
| R2 rejected baseline | `sha256:285fffb4a7f873d0a9959f7a04eabcc2d57c4f6ad5d28894619463da3083e558`，明确不同 |
| provenance | `source=working-copy-snapshot; git.repo=false; head=null` |

没有从工作目录复制 runtime。Node 物化器只读取 artifact 每个 row 的 `path/contentBase64/mode`，生成全新 `/tmp/hl-r3f04-independent/source`；再次由该 source 构建得到与 candidate-1 相同的 39/13、file/product/candidate digest。随后使用该物化 source 安装全新 `project-five`、`project-24`，两者 `status=INSTALLED, kind=fresh`，installed `verify06.ok=true`，runtime `0.10.0`、19 managed paths、packageDigest=`sha256:0560b139eb85697b52c78935aa44a6bd6987ad8cffa3ab90410e5ad4c7123e09`。

## Installed joined Hook evidence

所有以下 Hook 调用都运行物化 artifact 的 installed `hooks/dispatcher.js`，dispatcher 子进程退出后，再启动另一个 Node 进程按 carrier 相对路径读取 JSON。没有使用工作区 runtime。

### Exact five-model manifest

`project-five` 同时放置了只有 3 模型的项目 manifest；Hook 每个事件临时传入的结构化 manifest 精确为：

| channel | model | reasoning | family | status |
|---|---|---|---|---|
| cursor | Grok 4.6 High | high | grok | available |
| grokbuild | Grok 4.6 High | high | grok | available |
| antigravity | Gemini 3.7 Flash High | high | gemini | available |
| codex | gpt-5.6-terra | xhigh | terra | available |
| codex | gpt-5.6-sol | xhigh | sol | available |

`SessionStart` 与 `UserPromptSubmit` 均输出 `state=known`、`modelsComplete=true`、`modelCount=5`、`CapabilityModelsCarrier: carrierBacked=5/5`、`CapabilityCarrier: complete=true`、`read=project-relative-json`；输出没有 `shown=0/5`、`embedded-projection:embedded` 或 `CapabilityModelsInline`，也没有错误显示项目 3 模型。

| event | installed carrier path | sourceDigest | projectionDigest | 新进程读回 |
|---|---|---|---|---:|
| SessionStart | `.codex/harness-lite/caps/c-adcba58eac33f0623360b439b780327c.json` | `sha256:6f9e3542640cdb8a86af0f442f976dce39ca7aa6af2b30dc85ef8979f747ea88` | `sha256:0e8db42edf6e9922f5df064ddf1e62d794758fabf1afedf04b1cdbe9efa4dc94` | 5 |
| UserPromptSubmit | `.codex/harness-lite/caps/c-6a529b28b5822908ca0d78217f155faa.json` | 同上 | 同上 | 5 |

载体本身核对 `kind=harness-lite-capability-projection-carrier`、`source/sourceType=hook-input`、event/session/turn、完整 `modelFields`、`modelCount=5`、`freshness.status=fresh`、TTL `1800000`，每个模型的 8 个字段均可被新进程读回。

### Twenty-four models, dynamic changes, and bound

同一 fresh installed dispatcher 的 `SessionStart` 和 `UserPromptSubmit` 都完成跨进程 24 行读回：

| event | carrier path | sourceDigest | projectionDigest | complete/modelCount/read rows |
|---|---|---|---|---|
| SessionStart | `.codex/harness-lite/caps/c-0ab61c183fcc424e2fbb5e2988ae76c9.json` | `sha256:5c563c45c1e0e8c5f9f4662cec3b05de00600e5c47d033ee525fe05ccdfd20ca` | `sha256:bf92d20a0e7d15efd61c1f9725b56a31c41292dc7e2f933e72fc6991ed65c956` | `true/24/24` |
| UserPromptSubmit | `.codex/harness-lite/caps/c-92340dc3d2bcaf4dd15b4af1239a9048.json` | 同上 | 同上 | `true/24/24` |

模型动态变化是在 dispatcher 退出后重新启动的新进程中核对：删除一行后 `modelCount=23`、path=`c-c48f35733d7180198ba5c5b3a3d33bb6.json`、sourceDigest=`sha256:e65ef7535bfa8dd79fa5dc3eed22eb33264ed18b9eb7d812f4ca71ab9ad77937`；增加一行后 `modelCount=25`、path=`c-1272346c80a43ba80cb6ada11cd46203.json`、sourceDigest=`sha256:e2ba7f530e1674fce5a2d1b04101ea0f785122b848cdedda908020f3befdf0`。增删均同时改变 path 和 digest。

超限输入为 2000 模型、manifest `309852` bytes，超过明确上限 `65536`。Hook 输出 `state=UNKNOWN`、`complete=false`、`modelsComplete=false`、`modelCount=0`、`incomplete=hook-input-manifest-too-large`、`manifestBytes=309852/65536`、`read=none`，没有 carrier，准确 fail closed。

## Fresh installed work-unit and recovery behavior

使用 artifact source fresh install 建立 `R3F31`、`R3F32` 两个无依赖 active unit，写面分别为 `src/alpha.js`、`src/beta.js`，模型分别为 `cursor/Grok 4.6 High/grok/high`、`grokbuild/Grok 4.6 High/grok/high`；没有传 `work_unit`、`workUnit`、`work_unit_id`、`workUnitId` 或 `harness_lite_work_unit` selector。两个最小包均被 installed dispatcher 投影且由新进程 `work.parallelWorkUnitContext` 读取。

`reported_complete` 的 `R3F33` 使依赖 `R3F34` 保持 waiting、`accepted=false`、不可 runnable；记录 `accepted` 后才 runnable。`R3F35` 独立分支继续 runnable，证明 branch-local freeze。增加第三 active unit 后，新进程真实调用 `work.parallelWorkUnitContext`，返回 `active=[R3F31,R3F32,R3F35]`、`units.length=3`、`carrier.readApi=work.parallelWorkUnitContext`，Hook 以 `ParallelWorkUnitsCarrier` 传递剩余 3 个 unit。

重叠 active write scopes `src/**` 与 `src/alpha.js` 返回 `status=conflict`、`conflicts=1`、overlap `["src/**","src/alpha.js"]`、action=`integration-owner-or-split-or-serial`。未重叠写面仍为 complete/parallel。

installed recovery probe 中，provider-transport/tool/auth/quota 均记录但 `counted=false`；同一普通家族的五个彼此不同语义失败才进入 Terra xhigh，Terra 完整恢复再进入 Sol xhigh，acceptance pass 清理 lease。当前工作区 ledger 未被这些 disposable 记录污染。

## Production caller trace and architecture boundary

真实生产路径（不是 helper-only 自证）如下：

- `lib/capabilities.js:203-260`：Hook-input manifest → normalize → dynamic carrier 写入；`lib/capabilities.js:348-360`：project-file/Hook-input 选择。
- `lib/hook.js:77-93`：capability/model/carrier lines；`lib/hook.js:172-194`：Hook context 调用 capabilities、parallel context 和预算；`lib/hook.js:441-447`：事件 dispatch。
- `hooks/dispatcher.js:25-37`：installed runtime `verify06` 后调用 `hook.dispatch` 并输出 `additionalContext`。
- `lib/tree.js:267-316`：真实 leaf/current chain → work-unit package/list。
- `lib/work.js:185-290`：真实 delegation ledger → parallel work-unit context；`lib/work.js:300-310`：carrier/inline projection。
- `lib/delegation.js:709-779`：active、写面冲突、依赖 runnable、300000ms read-only heartbeat summary；`lib/delegation.js:781+`：recovery summary。

对 `bin/hooks/lib` 及 installed 19-path runtime 的结构扫描通过：没有 executable agent/subagent call、provider adapter/static catalog、daemon/`setInterval`、credential store、UI/browser scrape、transcript read/inference 或第二调度器。`spawnSync` 仅用于本地 Git/filesystem/test/selfcheck/native hook passthrough；相关 forbidden 名词只出现在 instruction/denylist 文本。

## Regression and physical security matrix

| 命令/检查 | 独立结果 |
|---|---|
| `npm test` | exit 0；TAP `115/115` pass，fail/cancel/skip/todo 均 0 |
| `npm run selfcheck` | exit 0；implementation 5030、tests 6608、skills 60、internal interfaces 6/6，全测通过 |
| artifact source `node bin/hl.js selfcheck --run` | exit 0；同样 internal interfaces 6/6、全测通过 |
| worktree product JS `node --check` | 13/13 pass |
| materialized artifact product JS `node --check` | 13/13 pass |
| `node --test test/nv05-integration.test.js` | `11/11` pass；fresh、managed、固定 0.9.1 upgrade、tamper/relabel、host evidence、fault rollback、native push gate、双候选、forbidden scan 均覆盖 |
| `node --test test/r3-joined-runtime.test.js` | `6/6` pass；5/24 joined carrier、24 动态/超限、并行/accepted-only、recovery、overlap、current index 均覆盖 |
| artifact fresh install | `project-five`/`project-24` 均 `INSTALLED`、`verify06.ok=true`，无工作区 runtime 混用 |
| artifact managed install | disposable Git project 上 managed global/registry/gateway/project binding `INSTALLED`，`verifyGlobal`/`verify06` 均 true |
| artifact fixed 0.9.1 upgrade | 物化 previous-09 17-path identity；无显式 upgrade 为 HOLD，显式 upgrade 为 `INSTALLED` 到 0.10.0、19 paths |
| coherent tamper/relabel | NV05 直接结果均 HOLD/不接受伪造身份，零写并保留前像 |
| coherent extra path | 已安装 runtime 追加 `lib/extra-path.js` 后 explicit upgrade 为 `HOLD`、written 0、difference=`extra:lib/extra-path.js`、bytes stable |
| fault rollback | swap/instruction/hook/managed registry 四处 fault 均回滚 exact preimage、无 runtime residue |
| host evidence/native gate | NV05 结构化 list/start/completed/runtime receipts 与 disposable local Git/bare remote pre-push gate 通过；未触碰真实 remote |

## Raw supervision wait evidence

直接查找包含本次 R3 Kickoff 的 root 会话：

`/home/synadmin/.codex/sessions/2026/08/31/rollout-2026-08-31T01-37-55-01a053bf-d419-7b61-9619-f032017f7966.jsonl`

Kickoff `user_message` 在第 `5472` 行（对应 event message 第 `5473` 行），文本含 `Harness Lite 0.10 R3 定向返修 Kickoff`。从该边界后按 JSON 解析，筛选 `namespace=collaboration,name=wait_agent`，再按 `call_id` 关联 output：

| call → output 行 | call_id | 参数 | 原始 output | 分类 |
|---|---|---:|---|---|
| 5614 → 5615 | `call_YDDUzYvEMTuA2tOGs495erGB` | `timeout_ms=300000` | `completed,timed_out=false` | 提前返回（约 229.1s） |
| 5648 → 5649 | `call_RUqRYHWjUFdBtPbarVyMTItO` | `timeout_ms=300000` | `timed_out=true` | 完整超时（约 300.0s） |
| 5658 → 5659 | `call_kuF3YV2zuDtpG6KMNlJhDWrs` | `timeout_ms=300000` | `completed,timed_out=false` | 提前返回（约 49.9s） |
| 5723 → 5724 | `call_1MOUgWFWURNBaVDhCYwcp9xl` | `timeout_ms=300000` | `completed,timed_out=false` | 提前返回（约 59.5s） |
| 5805 → 5806 | `call_Br5ATNJ5zeK5wx6gCxu0wZLM` | `timeout_ms=300000` | `timed_out=true` | 完整超时（约 300.0s） |
| 5815 → 5816 | `call_cFgDT4S19lZFYXf7QVSALc5k` | `timeout_ms=300000` | `timed_out=true` | 完整超时（约 300.0s） |
| 5824 → 5825 | `call_u275BWGhN011hfQJlIjbcuG5` | `timeout_ms=300000` | `completed,timed_out=false` | 提前返回（约 210.7s） |
| 5898 → 5899 | `call_9C6TNwPuwZiXjqLGRxYjI3RL` | `timeout_ms=300000` | `timed_out=true` | 完整超时（约 300.0s） |
| 5907 → 5908 | `call_ReRvw7f9tdxRe2sEDrtQDIdR` | `timeout_ms=300000` | `timed_out=true` | 完整超时（约 300.0s） |

R3 Kickoff 后没有任何 `timeout_ms=30000` 或 `timeout_ms=60000` 的 `wait_agent` 调用。原始事实区分了提前返回和完整超时；没有将 wait activity 当作产品 progress 或 failure。

## Current lifecycle and live delegation ledger

只读执行 `node bin/hl.js status --json` 并直接读取 `docs/harness/delegation.json`：

| 项目 | 当前事实 |
|---|---|
| stage/leaf | `stage-hlnext-repair-r3` / `HLNEXT-REPAIR-R3` |
| chain health | `ok=true`、`conflicts=[]`、`currentCount=1`、`unfinishedLeaves=0` |
| work-unit statuses | `R3F00 accepted`、`R3F01 accepted`、`R3F02 accepted`、`R3F03 accepted`、`R3F04 active` |
| active/runnable | active=`[R3F04]`；runnable=`[]`；R3F04 dependency R3F03 accepted |
| heartbeat | `intervalMs=300000`、`readOnly=true`、`mode=single-summary`、`due=[]` |
| carrier problem | fingerprint=`hook-input-dynamic-model-carrier-readable`，effectiveCount=`2`，status=`accepted`，普通 tier |
| index problem | fingerprint=`archived-current-index-consistency`，effectiveCount=`1`，status=`accepted`，普通 tier |
| leases | `0` |
| Terra/Sol | `[]`；没有错误触发升级 |
| ordinary probe/tool/provider errors | 未写入 workspace failure ledger；disposable recovery test 明确 `counted=false` |

ledger 原始行可复核：R3F03 accepted 位于 `docs/harness/delegation.json:730-761`，R3F04 active 位于 `:763-784`；问题计数及 accepted/leases 位于 `:478-637`。当前两个稳定问题准确为 carrier=2、index=1，不把普通探针/tool/provider 故障计入，也没有错误触发 Terra/Sol。

`NEXT-VERSION-DISPATCH-PLAN.md` 顶部、`docs/harness/plan.md` 与 `test/r3-joined-runtime.test.js` current-index check 均指向 R3 current leaf；R2 明确 archived/rejected、不是 current，且没有预写 R3 final PASS。最终归档 D 尚未执行，不能要求主管提前关闭。

## Cleanup and final disposition

报告写入后执行精确路径校验，只删除我创建的 `/tmp/hl-r3f04-independent` disposable 根；未使用 workspace root、`/tmp` 广泛 glob 或任何宿主进程操作。删除后 `find /tmp -maxdepth 1 -type d -name 'hl-r3f04-*'` 不再发现该根。

独立产品硬验收全部通过：artifact 身份与双构建、artifact-only source materialization、fresh installed joined dispatcher、5/24 跨进程载体、动态变更、上限 fail closed、并行最小包/accepted-only/冲突、真实生产 caller、完整回归与物理安全矩阵、R01-R18 hash、原始 wait facts、current index 和 live ledger 均有直接证据。

最终 verdict：`PASS`。

该 PASS 只表示 R3F04 independent product acceptance，不关闭 leaf，不执行 R3F05，不 push/tag/release/deploy。
