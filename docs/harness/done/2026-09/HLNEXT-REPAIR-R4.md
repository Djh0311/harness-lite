# HLNEXT-REPAIR-R4 — dual-state leaf prepared for conditional archive

阶段：stage-hlnext-repair-r4

状态：dual-state closeout authority。

- pre-effectiveness：`CURRENT / R4F05 R3 WRITER PREPARATION / NOT YET SUPERVISOR ACCEPTED / NOT ARCHIVED / ARTIFACT RETAINED / NOT PUSHED / NOT RELEASED`
- post-effectiveness：`PASS / R4 CANDIDATE-CLOSEOUT REPAIR ACCEPTED / CANDIDATE ONLY / ARTIFACT RETAINED / REPRODUCIBLE / NOT PUSHED / NOT RELEASED`

目标：使最终源码稳定重建唯一权威 candidate，将完整 canonical artifact 持久保存在 candidate 输入范围外，并把 R4F05 R3 docs-only closeout 文本准备到可由主管最终验收和归档的状态。Pre-effectiveness 当前路径仍是 live current authority：`currentCount=1`、live delegation=`true`、R4F05 active、三路径 absent；post-effectiveness 只在主管完成后续序列后成立：`currentCount=0`、live delegation=`UNKNOWN/missing`、R4F00-R4F05 archived ledger accepted。

来源收据：2026-09-01 用户明确发出 Harness Lite 0.10 R4 候选收口修复 Kickoff，授权 R4F00-R4F05 按 accepted gate 连续执行。

产品：Harness Lite 0.10.0 R4 candidate-closeout repair

证据：R4F00-R4F04 已 supervisor accepted；R4F05 R1 已由 `docs/harness/reports/HLNEXT-REPAIR-R4F05-R1-supervisor-acceptance-FAIL.md` 记录为有效失败；R4F05 R2 已由 `docs/harness/reports/HLNEXT-REPAIR-R4F05-R2-supervisor-acceptance-FAIL.md` 记录为同根 drift/non-counting；R4F05 R3 当前仍为 active writer-side repair。R4F03 retained artifact 封存见 `docs/harness/reports/HLNEXT-REPAIR-R4F03-supervisor-acceptance-PASS.md`，R4F04 独立 reviewer PASS 见 `docs/harness/reports/HLNEXT-REPAIR-R4F04-independent-product-review.md`，主管 acceptance 见 `docs/harness/reports/HLNEXT-REPAIR-R4F04-supervisor-acceptance-PASS.md`。R3 准备的 `docs/harness/reports/HLNEXT-REPAIR-R4F05-supervisor-closeout-PASS.md` 是 conditional template，不是当前 supervisor acceptance。retained candidate artifact 为 `sha256:d73f4b4f83e6034e33168995c24ca4514d69bcd70ccc19f8aa255da42d218daa`，40 files / 13 product JS，fileDigest `sha256:a380b16c8fc1ddafa0371aa37d8e0a3815576aeaae3e7d94156402204c615acd`，productDigest `sha256:73f9ac6f54d863a5093144e165c17825ac9ba3560309d4382ecd3e8393ebda3e`，artifact bytes `1061071`。

载体：pre-effectiveness 为 current live stage/leaf/delegation + retained candidate artifact `sha256:d73f4b4f83e6034e33168995c24ca4514d69bcd70ccc19f8aa255da42d218daa`；post-effectiveness 为 archived stage/leaf/delegation + 同一 retained candidate artifact。旧 R3 `sha256:b164bab93900c2cbaa2eb43be5ca144934ad83d2bcae6dad4c0c9b0cfb2e95ea` 与 pre-R4F01 `sha256:29e89d7c1751b0fbd27776f0ea854423c0793b1ca147c17fdac6485bdf28f823` 只保留为历史反例身份。retained artifact 路径为 `docs/harness/artifacts/harness-lite-0.10.0-d73f4b4f83e6034e33168995c24ca4514d69bcd70ccc19f8aa255da42d218daa.json`；`docs/harness/done/2026-09/HLNEXT-REPAIR-R4.md` 在 supervisor archive 前必须 absent，只有在主管完成 required sequence 后才 present as archived authority。

直接验收：

- retained candidate artifact `sha256:d73f4b4f83e6034e33168995c24ca4514d69bcd70ccc19f8aa255da42d218daa` 在项目内持久存在，SHA/文件名/摘要/逐文件内容与 fresh install 全部可验证
- R4F05 R3 docs-only 修改后，当前源码两次重建、retained artifact 与 artifact 物化后重建逐字节一致；docs-only closeout 前后 candidate 摘要不变
- candidate 内 NEXT 稳定、非 live、非自引用；R4 生命周期只存在于 `docs/harness/**`
- 5/24 模型 carrier、并行 work-unit、accepted-only unlock、恢复链、安全安装、升级回滚和 push gate 全部保持
- 当前 live readback 仍为 `currentCount=1`、stage=`stage-hlnext-repair-r4`、leaf=`HLNEXT-REPAIR-R4`、live delegation=`true`；三个 R4 done paths 不存在
- 主管后续验收通过并完成 physical archive 后，archive readback 才应为 `tree.readChain().currentCount=0`、`unfinished=0`、`stage=null`、`leaf=null`，live delegation missing/UNKNOWN，archived R4 delegation ledger 中 R4F00-R4F05 accepted / aggregate counted effective failures=2 / non-counting drift events=2 / problemCount=2 / leases=0

允许动：

- R4F01：NEXT 顶部、candidate builder 的必要最小调整、专用 candidate tests
- R4F02：`docs/harness/**` R4 lifecycle/ledger/reports、plan 与 plan-review
- R4F03：上述必要 integration 写面、retained artifact 与专用报告
- R4F05：candidate 输入范围之外的 `docs/harness/**` 最终治理文件

不许动：

- 历史 R1/R2/R3 报告或归档 ledger
- `docs/harness/delegation.json` 或任何 delegation record API
- current stage/leaf/delegation 的移动、复制、删除、创建，或三个 R4 done 路径的物理形成
- push、tag、release、deploy、Git provenance 或 external memory
- provider/UI/credential/daemon/static catalog/第二调度器
- 杀死、重启或干扰 Poracode、watchdog、bridge

相关事实：

- 被 supersede 的 R3 historical candidate 为 `sha256:b164bab93900c2cbaa2eb43be5ca144934ad83d2bcae6dad4c0c9b0cfb2e95ea`
- retained R4 candidate 为 `sha256:d73f4b4f83e6034e33168995c24ca4514d69bcd70ccc19f8aa255da42d218daa`，40 files / 13 product JS；R4F05 R3 docs-only edits must keep current root rebuild byte-identical to retained artifact
- 当前 productDigest `sha256:73f9ac6f54d863a5093144e165c17825ac9ba3560309d4382ecd3e8393ebda3e`
- stable problem fingerprint：`candidate-closeout-reproducible-artifact-binding`
- aggregate counted effective failures=`2`：R4F01 historical root problem `effectiveCount=1/status=accepted`；R4F05 current repair problem `effectiveCount=1/status=observed` until supervisor records acceptance_pass plus R4F05 accepted
- non-counting drift events=`2`（R4F01 superseding `1` + R4F05 R2 same-root `1`）；problemCount=`2`；recovery leases=`0`；普通 family count below `5`，Terra/Sol 不触发

相关入口：

- retained artifact、`scripts/build-candidate.js`
- candidate 内 `NEXT-VERSION-DISPATCH-PLAN.md`
- `docs/harness/artifacts/`、`docs/harness/reports/`、`docs/harness/done/2026-09/`
- artifact materialization、fresh install、installed dispatcher

已否定路线：

- 用报告里的 digest 文字代替真实 retained artifact
- 接受收口前快照后再修改 candidate 输入，并把新旧摘要都称为 accepted
- 在 candidate 内回填 candidateDigest/fileDigest/bytes 形成自引用变化
- 从临时目录或 raw session 反向拼装权威 artifact
- 依赖 writer 的口头 COMPLETE 而不做 retained artifact 与 archive readback 直验
- R4F05 R1 自签 accepted、伪造 acceptance ledger event、在主管验收前物理归档 current stage/leaf/delegation；R4F05 R2 重复同根 premature archive route，只登记 drift/non-counting，不能升级成 accepted 或第二次有效失败

终态备注：

- R4 final accepted candidate 与 done lifecycle authority 尚未生效；pre-effectiveness 三个 done paths absent，post-effectiveness 在主管完成 direct acceptance、ledger acceptance、三路径 archive 和 final rebuild/readback 后 present as archived authority。NEXT 仅保留稳定历史索引。

路线依据：先把 NEXT 从 live/self-referential governance 中分离，再由唯一 integration owner 封存当前源码可重建的 canonical artifact；R4F05 R3 仅准备 docs-only closeout 文本，并等待主管直接验收、ledger acceptance 和 physical archive。

依赖：无

结果合同：本 writer 只能报告 writer-side `COMPLETE`；本 leaf 的最终 PASS/accepted/archive 以主管后续 direct acceptance、ledger acceptance、physical archive 和 final readback 为准。

## Current execution status

- `R4F00`：supervisor accepted；基线、反例身份、immutable R3 archive SHA 与 same-root superseding classification 已冻结。
- `R4F01`：supervisor accepted；candidate 内 NEXT 已稳定、非 live、非自引用，candidate 输入固定为 40 files / 13 product JS。
- `R4F02`：supervisor accepted；R4 governance design 与 R3 superseding classification 已迁入 `docs/harness/**`，未改写 R3 archive bytes。
- `R4F03`：supervisor accepted；retained artifact 固定为 `docs/harness/artifacts/harness-lite-0.10.0-d73f4b4f83e6034e33168995c24ca4514d69bcd70ccc19f8aa255da42d218daa.json`，SHA `sha256:d73f4b4f83e6034e33168995c24ca4514d69bcd70ccc19f8aa255da42d218daa`，artifact bytes `1061071`，fileDigest `sha256:a380b16c8fc1ddafa0371aa37d8e0a3815576aeaae3e7d94156402204c615acd`，productDigest `sha256:73f9ac6f54d863a5093144e165c17825ac9ba3560309d4382ecd3e8393ebda3e`，40 files / 13 product JS。
- `R4F04`：独立 reviewer PASS 且 supervisor accepted；artifact-only 产品、安全、变更敏感性和恢复链验收完成。
- `R4F05`：R1 supervisor rejected 且计为有效失败；R2 supervisor rejected 且登记为同根 drift/non-counting；R3 active writer preparation。当前仍有 one current leaf 和 live delegation；physical archive、supervisor acceptance 和 final archive readback pending。

## Work Unit R4F00 — 基线与反例冻结

goal: 锁定 b164、29e89d、productDigest、39-file 输入、缺失 artifact 与 R3F05 R1 分类，建立 R4 ledger。

directAcceptance:

- 当前源码两次构建均为 29e89d...f823，明确不等于 b164...e95ea
- 项目全文件 SHA 与 candidate JSON 扫描均找不到 b164 artifact
- R01-R18 保持 4772 bytes / 1a69...a719
- 历史 R4F01 根因保留为 `effectiveCount=1/status=accepted`；R3F05 R1 另作 same-root drift/non-counting 分类

allowed:

- 只读项目、R3 archive 与精确 `/tmp/hl-r4f00-*`
- R4 stage/leaf/delegation 与 R4F00 主管报告

forbidden:

- 产品实现修改
- R4F00 accepted 前派实现 writer

facts:

- 决策 writer family 可由 archived R3F05 event 精确绑定为 `openai-engineering`

entryPoints:

- candidate builder、R3 archived ledger、R3 reports、project-wide artifact scan

disprovenRoutes:

- 把重复构建、缺文件、旧 NEXT 分别重复计数

unknowns:

- 无

routeBasis: 以当前双构建、项目全文件 SHA 扫描和 immutable R3 ledger 读回冻结根因。

dependencies: 无

resultContract: supervisor direct acceptance PASS 后登记 accepted，才可派 R4F01/R4F02。

## Work Unit R4F01 — 候选输入与收口机制修复

goal: 使 candidate 内 NEXT 稳定、非 live、非自引用，并建立候选/收口专用 fail-closed 测试。

directAcceptance:

- NEXT 仍进入 candidate 并保留 R01-R18，但顶部不含 live R3/R4 lifecycle 或任何 candidate 身份回填字段
- candidate 输入变更会改变摘要，`docs/harness/**` 变更不会改变摘要
- 不以忽略内容或 hash 豁免伪造稳定性

allowed:

- `NEXT-VERSION-DISPATCH-PLAN.md` 顶部索引区
- `scripts/build-candidate.js` 的必要最小改动
- `test/r4-candidate-closeout.test.js`

forbidden:

- `docs/harness/**`
- 产品能力或安装边界改写

facts:

- `R4F00` 冻结时 candidate 输入为 39 files；`R4F01` 新增专用 `test/r4-candidate-closeout.test.js` 并经主管验收后，candidate 当前输入已为 40 files / 13 product JS，NEXT 仍是唯一治理混入点

entryPoints:

- candidate file list、canonical stringify、artifact digest

disprovenRoutes:

- candidate 内嵌自己的 digest/fileDigest/bytes；对 hash 字段特殊豁免

unknowns:

- 最小 HOW 由 writer 在边界内决定

routeBasis: 保留 NEXT 冻结需求但让其顶部只描述稳定的历史用途，生命周期迁出 candidate。

dependencies:

- R4F00

resultContract: writer COMPLETE 后 reported_complete；主管直接重建和扫描 PASS 才 accepted。

## Work Unit R4F02 — R3 失败账分类与 R4 治理载体

goal: 在不改 R3 archive 的前提下，用 R4 ledger 分类 R3F05 R1，并让 R4 live/final authority 只位于 docs/harness。

directAcceptance:

- archived R3 ledger bytes 不变
- R4 ledger 对当前根因只计数一次，R3F05 R1 为有 evidenceRef 的 same-root drift/non-counting
- plan/plan-review 指向真实 R4 current，且不写入 NEXT

allowed:

- `docs/harness/**` R4 lifecycle/ledger/reports
- `docs/harness/plan.md`
- `docs/harness/reports/plan-review.md`

forbidden:

- NEXT、产品代码、测试与历史 archive/report

facts:

- archived `r3f05-r1-rejected` 明确记录 `gpt-5.4/openai-engineering/high`，但 evidenceRef 为 null

entryPoints:

- R4 live delegation API、planAuthority、R3 archived ledger read-only

disprovenRoutes:

- 回写/伪造 R3 ledger；仅保留 rejected/null 而不做 superseding classification

unknowns:

- 无

routeBasis: R4 ledger 以 evidence-bound superseding event 保留历史不可变性和当前解释。

dependencies:

- R4F00

resultContract: writer COMPLETE 后 reported_complete；主管核对 R3 byte hash、R4 ledger 和 plan authority 后 accepted。

## Work Unit R4F03 — 唯一 integration owner 与候选封存

goal: 生成、物化、重建并持久保存唯一 canonical R4 candidate artifact。

directAcceptance:

- 两次项目根构建、artifact 物化重建三方逐字节一致
- artifact 存在于 `docs/harness/artifacts/harness-lite-0.10.0-<candidateDigest>.json`
- 文件 SHA 等于文件名/权威摘要，元数据、逐文件内容与 fresh install 可独立验证

allowed:

- R4F01/R4F02 已验收写面的必要 integration 修正
- `docs/harness/artifacts/` 与 R4F03 report

forbidden:

- 把 artifact 纳入 candidate 自身；临时载体冒充持久 artifact

facts:

- R4F01/R4F02 accepted 后任何 candidate 输入变化都使本单失效
- retained artifact accepted identity: `sha256:d73f4b4f83e6034e33168995c24ca4514d69bcd70ccc19f8aa255da42d218daa`
- retained artifact bytes: `1061071`
- fileDigest: `sha256:a380b16c8fc1ddafa0371aa37d8e0a3815576aeaae3e7d94156402204c615acd`
- productDigest: `sha256:73f9ac6f54d863a5093144e165c17825ac9ba3560309d4382ecd3e8393ebda3e`
- file count: 40; product JS count: 13

entryPoints:

- candidate builder、canonical artifact、materializer、installer

disprovenRoutes:

- 只记录 hash 文本；依赖 `/tmp` 或 raw session 恢复

终态备注：

- retained candidate digest 已固定，不再存在待定 identity。

routeBasis: 由唯一 owner 在输入冻结后一次封存并做 artifact-only round trip。

dependencies:

- R4F01
- R4F02

resultContract: writer COMPLETE 后 reported_complete；主管三方 cmp/fresh install PASS 才 accepted。

## Work Unit R4F04 — 全新独立产品验收

goal: 仅使用项目内 retained artifact，独立否定或接受 R4 candidate。

directAcceptance:

- retained SHA、当前源码重建、artifact materialize/fresh install、5/24 carrier、并行/恢复/安全矩阵全部 PASS
- artifact 删除/篡改或 candidate 输入变化 fail closed；docs/harness-only 变化不改 candidate

allowed:

- 只读产品与 retained artifact
- R4F04 independent report 和精确 disposable 根

forbidden:

- 产品/测试/plan/lifecycle/ledger 修改；历史会话拼装 b164

facts:

- reviewer 必须未参与 R4F01-R4F03 实现

entryPoints:

- retained artifact、candidate builder、installed dispatcher、NV05/joined/security tests

disprovenRoutes:

- 信任 writer COMPLETE 或工作目录单测

unknowns:

- 无

routeBasis: artifact-only 物化是候选载体闭环的最短直接证据。

dependencies:

- R4F03

resultContract: reviewer COMPLETE 只 reported_complete；主管 direct acceptance PASS 才 accepted。

## Work Unit R4F05 — 最终收口与收口后重建

goal: 只改 candidate 外治理文件，修正 R1 虚假叙述，准备 R4 final authority 文本，并证明 retained artifact 与当前源码两次重建仍逐字节一致。归档、ledger acceptance 和 final PASS 由主管后续完成。

directAcceptance:

- R3 allowed docs remove or correct R1/R2 false final-state narratives; R1 remains recorded as an effective failure and R2 remains recorded as same-root/non-counting drift
- aggregate counted effective failures=`2`: R4F01 problem `effectiveCount=1/status=accepted`; R4F05 repair problem `effectiveCount=1/status=observed` until supervisor records acceptance_pass plus R4F05 accepted; non-counting drift events=`2`; problemCount=`2`; recovery leases=`0`; no Terra/Sol
- R3 docs-only edits keep two current root builds, retained artifact, and artifact materialization rebuild byte-identical
- materialized retained rows fresh install returns `INSTALLED`; installed `verify06.ok=true`
- current readback before supervisor acceptance remains `currentCount=1`, stage=`stage-hlnext-repair-r4`, leaf=`HLNEXT-REPAIR-R4`, live delegation=`true`, and the three R4 done paths do not exist
- final status becomes `PASS / R4 CANDIDATE-CLOSEOUT REPAIR ACCEPTED / CANDIDATE ONLY / ARTIFACT RETAINED / REPRODUCIBLE / NOT PUSHED / NOT RELEASED` only after supervisor reads `COMPLETE`, records `reported_complete`, performs direct acceptance, records `acceptance_pass` plus `accepted`, physically archives the three paths, and final rebuild/readback passes

allowed:

- `docs/harness/plan.md`
- `docs/harness/reports/plan-review.md`
- `docs/harness/stages/stage-hlnext-repair-r4.md`
- `docs/harness/leaves/HLNEXT-REPAIR-R4.md`
- `docs/harness/reports/HLNEXT-REPAIR-R4F05-writer-report.md`
- `docs/harness/reports/HLNEXT-REPAIR-R4F05-supervisor-closeout-PASS.md`

forbidden:

- NEXT、LICENSE、package.json、bin/hooks/lib/scripts/skills/test
- 重新回填 candidate hash 到 NEXT
- `docs/harness/delegation.json`
- delegation record API
- move/copy/delete/create current stage、current leaf、live delegation 或三个 R4 done paths

facts:

- R4F04 independent PASS 和 supervisor accepted 是硬依赖
- R4F05 R1 supervisor FAIL rejected premature self-acceptance, fake acceptance ledger events, and physical archive before supervisor direct acceptance
- Parent supervisor had used `wait_agent(timeout_ms=300000)` and rejected R1 by chain HOLD after detecting out-of-scope archive/ledger writes
- final authority will point to retained artifact、R4F03/F04/F05 reports and `docs/harness/done/2026-09/` only after supervisor direct acceptance and archive; before that archive the three R4 done paths must remain absent

entryPoints:

- retained artifact、final root build、tree/delegation readback、planAuthority readback

disprovenRoutes:

- 收口后摘要变化仍自签 PASS
- 声称工具缺失、主管已完成 R4F05 direct acceptance、或长时间沉默可替代验收证据
- 在主管 direct acceptance 前移动 current lifecycle 或写 live delegation

终态备注：

- 本单 writer closeout 不修改 candidate 输入；R3 COMPLETE 只表示 writer-side preparation complete，不表示 supervisor acceptance 或 archive has occurred。

routeBasis: candidate 输入在 R4F03 后冻结，最终治理位于输入外，因此 R3 writer edits 应只改变 allowed `docs/harness/**` files，不改变 canonical bytes；final lifecycle mutation stays with supervisor acceptance.

dependencies:

- R4F04

resultContract: final writer COMPLETE 只允许主管后续登记 reported_complete；本单 closeout 由主管完成最终 cmp、archive readback 与 accepted，归档后的 authority 以 `docs/harness/reports/HLNEXT-REPAIR-R4F05-supervisor-closeout-PASS.md` 生效条件满足后为准。
