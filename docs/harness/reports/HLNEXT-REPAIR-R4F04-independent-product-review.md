# HLNEXT-REPAIR R4F04 independent product acceptance

日期：2026-09-01（Asia/Shanghai）

Reviewer：`gpt-5.6-luna / openai-engineering / xhigh`。本 reviewer 未参与 R4F01、R4F02、R4F03 实现，只读验收；没有修改产品、candidate 输入、R4 lifecycle、live ledger 或历史归档。

## 结论

`PASS / R4F04 INDEPENDENT PRODUCT ACCEPTANCE`

本结论只表示 R4F04 独立验收通过，写入后仍需主管 direct acceptance；没有提前关闭 `HLNEXT-REPAIR-R4`，没有声明 R4 final closeout。

## 唯一验收源和 artifact identity

唯一产品源为项目内 retained artifact：

`docs/harness/artifacts/harness-lite-0.10.0-d73f4b4f83e6034e33168995c24ca4514d69bcd70ccc19f8aa255da42d218daa.json`

直接从该文件逐行物化到 disposable source tree，恢复每行 mode，然后从该树 fresh install；没有从 b164、历史 session、raw transcript、/tmp 旧目录或工作目录拼装产品源。

Artifact 直接校验结果：

- artifact bytes：`1061071`
- artifact SHA-256：`sha256:d73f4b4f83e6034e33168995c24ca4514d69bcd70ccc19f8aa255da42d218daa`
- 文件名 digest 与文件 SHA、candidate identity 一致
- canonical stable parse/serialize：`1061071` bytes，逐字节一致
- files / product JS：`40 / 13`
- fileDigest：`sha256:a380b16c8fc1ddafa0371aa37d8e0a3815576aeaae3e7d94156402204c615acd`
- productDigest：`sha256:73f9ac6f54d863a5093144e165c17825ac9ba3560309d4382ecd3e8393ebda3e`
- 40 行逐一核对 `path/contentBase64/mode/size/sha256`，无重复路径、绝对路径或 `..`，全部自洽
- artifact 外部 retained path 存在；candidate 输入不包含 `docs/harness/**`

直接命令证据：`node` canonical integrity probe；`sha256sum`；`node scripts/build-candidate.js --json --out ...`；逐字节 `cmp`。

## Rebuild、物化和安装

当前项目根正式 builder 连续构建两份，并与 retained artifact 三方比较：

- retained vs current-root build 1：`cmp=0`
- retained vs current-root build 2：`cmp=0`
- current-root build 1 vs build 2：逐字节相同
- 三份 SHA：`sha256:d73f4b4f83e6034e33168995c24ca4514d69bcd70ccc19f8aa255da42d218daa`
- 三份 bytes：`1061071`

随后只使用 artifact rows 物化的 disposable source tree，再构建一份：

- artifact-materialized rebuild vs retained：`cmp=0`
- candidateDigest、fileDigest、productDigest、40 files / 13 product JS 全部一致
- fresh project install：`INSTALLED`
- installed `verify06`：`ok=true`、`kind=current`、无 differences
- installed runtime / dispatcher 真实 readback 通过

## Candidate boundary 和冻结正文

Artifact 内 `NEXT-VERSION-DISPATCH-PLAN.md` 直接扫描通过：

- 顶部不含 concrete candidate SHA、candidateDigest、fileDigest、productDigest、artifact bytes 或具体文件数身份
- 顶部不含 R3/R4 current stage/leaf、live PASS/ACCEPTED 或具体 docs authority path
- 顶部保持稳定历史说明，candidate identity 和 lifecycle authority 在 candidate 外 `docs/harness/**`
- R01–R18：`4772` bytes
- R01–R18 SHA-256：`sha256:1a69fc8dbbef7304938b9da1f20af9daf47f6b24b131b6d8861c8c906d66a719`

R3 archived delegation ledger 只读 SHA 保持：`sha256:4a93aa476f993a16f21ab8bb1f5dc0024d6d4bd0453311b46d78bdd5d0545ef9`。

## 动态模型和 carrier 直接验收

在 artifact 物化源安装出的新项目中，通过已安装 dispatcher 的 `SessionStart` 和 `UserPromptSubmit` 注入五模型：

1. `cursor / Grok 4.6 High / high / grok / available`
2. `grokbuild / Grok 4.6 High / high / grok / available`
3. `antigravity / Gemini 3.7 Flash High / high / gemini / available`
4. `codex / gpt-5.6-terra / xhigh / terra / available`
5. `codex / gpt-5.6-sol / xhigh / sol / available`

结果：

- SessionStart context：`1613` JS characters（`<=1800`）
- UserPromptSubmit context：`1669` JS characters（`<=1800`）
- 两个事件均输出 `modelCount=5`、`modelsComplete=true`、`carrierBacked=5/5`
- dispatcher 退出后由另一个 Node 进程按 project-relative carrier 读取五行；每行的 channel、model、reasoning、family、status、availability 全部可读
- `shown=0/5`、`embedded-projection:embedded` 均不存在
- Hook-input carrier 覆盖 project manifest，Terra/Sol 没有消失

24 模型反例也从 installed dispatcher 跨进程重放：

- `modelCount=24`、`carrierBacked=24/24`、`complete=true`
- 动态移除一个模型后变为 23；旧/新 carrier path、sourceDigest、projectionDigest 均变化，读取到 23 行
- 模型 capability/status/family 仍来自显式 manifest；名称不推断 family
- 24 模型 carrier 的 `sourceDigest`、`projectionDigest`、freshness、TTL 和所有模型字段自洽

Fail-closed 反例：

- manifest `66142/65536` bytes：`UNKNOWN`、`complete=false`、`incomplete=hook-input-manifest-too-large`、`read=none`，未创建 carrier
- carrier 目录 symlink：`UNKNOWN`、`complete=false`、`incomplete=unsafe-carrier-dir`、`read=none`，未跟随 symlink

直接命令证据：`node --test test/r3-capability-carrier.test.js test/r3-joined-runtime.test.js`，以及本报告记录的 installed-dispatcher/fresh-process probes。

## Joined work-unit workflow

从物化源 fresh install 后重放两个无依赖、写面分离的 active work units，不向 Hook 传入任何人工 `work_unit_id`。Installed dispatcher 输出两份可行动最小上下文，包含各自 id、goal、direct acceptance、dependencies、write scope 和 agent channel/model/family/reasoning；没有 `WorkUnit id=UNKNOWN` 或 `leaf-fallback`，没有 `…+N` 隐藏任务。

直接回归命令：

`node --test test/r2-parallel-context.test.js test/r2-joined-runtime.test.js test/r3-joined-runtime.test.js test/fix03-joined-runtime.test.js`

结果：`20 tests / 19 pass / 0 fail / 1 expected skip`。skip 是 candidate 外 lifecycle documents 的既有 fixture 边界，不是产品失败。覆盖并直接通过：

- 两个 active unit 的完整最小上下文和三项以上 carrier API
- 无人工 selector 的 installed dispatcher joined readback
- overlapping write scopes 保留全部 unit 并明确 `conflict`
- `reported_complete` 不解锁；`accepted` 才解锁 dependent
- blocked/partial 只冻结依赖分支
- missing lifecycle/delegation 返回 UNKNOWN/missing

## Delegation、恢复与监督规则

从物化源执行 delegation/recovery 测试并核对 live ledger：

- provider/tool/auth/queue/transport 等外部故障不计数
- 同根重复和已否定路线不重复计数，标 drift
- ordinary 五次 → Terra xhigh 一次 → Terra 失败后 Sol xhigh；Sol 默认三次且支持问题级 1–5 配置
- acceptance PASS 只清当前 problem lease
- Harness runtime 没有 agent dispatcher、provider adapter、credential store、静态模型目录、daemon、UI/transcript 依赖
- Harness 只投影和记账；未调用 provider 或 agent

直接回归：`node --test test/nv04-recovery.test.js test/fix02-delegation-record.test.js test/nv01-delegation.test.js`，结果 `33 tests / 33 pass / 0 fail`。

当前 live `docs/harness/delegation.json` readback：

- R4F00、R4F01、R4F02、R4F03：`accepted`
- R4F04：`active`
- counted effective failure：`1`
- `r4-r3f05-r1-superseding-same-root-drift`：`counted=false`、`drift=true`，与稳定 problem 绑定
- recovery leases：`0`
- R3 archive SHA 未变
- `r4f03-r2-heartbeat-1` 与 `r4f04-heartbeat-1` 均为 supervisor 真实 `wait_agent timeout_ms=300000` 的 tool-wait activity；没有 30/60 秒忙轮询、也没有因正常沉默介入

## 完整回归矩阵

全部均从 artifact 物化 source 执行，未把工作目录既有结果当作产品源：

- `npm test`：`119 total / 118 pass / 0 fail / 1 expected skip`
- `npm run selfcheck`：PASS；内部接口 6；全测 PASS
- NV05 integration：`11/11 PASS`
- R3 joined/carrier：`5 pass / 1 expected skip`
- R4 closeout tests：`4/4 PASS`
- 产品 JavaScript：`13/13 node --check PASS`
- fresh/managed install、固定 0.9.1 upgrade：PASS
- coherent tamper/relabel、extra-path：HOLD/fail-closed、零写
- fault injection rollback：保持精确 preimage、无 runtime residue
- host evidence：PASS
- native push gate：PASS（仅 disposable local git/bare remote）
- forbidden-surface scan：无 agent dispatcher、provider adapter、static model catalog、credential write、daemon 或 transcript 依赖

## Candidate fail-closed probes

所有探针均只在 disposable copies 执行，retained artifact 未删除或篡改：

- 缺失 artifact：`ENOENT`，不能验证
- 单字节 tampered copy：JSON 仍可 parse 但 SHA 变为 `sha256:f5cabc27d53a774677a1ae059efac96551b032a28283e8ebd73ee14ea3d4fede`，与 filename/authority identity 不符，完整性拒绝
- 修改 candidate input `NEXT-VERSION-DISPATCH-PLAN.md`：candidateDigest 和 fileDigest 均变化
- 只增加 `docs/harness/**`：candidateDigest 和 fileDigest 均保持不变

当前源码 candidate input 在 F03 accepted 后与 retained artifact 逐字节相同；本 reviewer 没有修改任何 candidate input。

## 清理与边界确认

reviewer 创建的精确 disposable source/project/probe 目录在报告完成后删除；项目内 retained artifact 保留。没有 push、tag、release、deploy；没有修改 Git provenance；没有更新 external memory；没有杀死、重启或干扰 Poracode、watchdog、bridge。

本报告是 R4F04 `reported_complete` 的证据载体，不是 supervisor acceptance，也不关闭 R4 stage/leaf。
