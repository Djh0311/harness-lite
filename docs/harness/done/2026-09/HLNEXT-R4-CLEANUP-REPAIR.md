# HLNEXT-R4-CLEANUP-REPAIR — exact disposable cleanup erratum

阶段：stage-hlnext-r4-cleanup-repair

状态：`CURRENT / R4C00-R4C02 ACCEPTED / R4C03 SUPERVISOR CLOSEOUT / CANDIDATE FROZEN / NOT PUSHED / NOT RELEASED`

目标：只删除五个已证实属于 R4F05 的 disposable 目录，以 additive erratum 纠正原零残留结论，同时保持原产品、candidate 和 R4 历史归档逐字节不变。

来源收据：2026-09-01 用户明确发出 R4 cleanup erratum repair 并授权连续执行 R4C00–R4C03。

产品：Harness Lite 0.10.0 retained R4 candidate；本 leaf 没有产品写面。

证据：R4C00 fresh-check 见 `docs/harness/reports/HLNEXT-R4-CLEANUP-R4C00-supervisor-acceptance-PASS.md`；后续只接受 R4C01 精确删除、R4C02 独立只读核验和 R4C03 additive closeout。

载体：current stage/leaf/delegation + 原 retained artifact；final authority 为 archived cleanup stage/leaf/delegation 和 additive erratum report。

当前执行：R4C00、R4C01、R4C02 已由主管 accepted；R4C03 正在进行 additive erratum、plan authority 和物理归档。归档前仍保持唯一 current leaf 和 live delegation。

直接验收：

- 五个精确目录均 absent，且 `/tmp` 顶层无任何 `hl-r4f05-*` 目录
- retained artifact SHA、bytes、fileDigest、productDigest、40/13 和当前根一次 rebuild cmp 全部不变
- candidate inputs、原 R4 archive/ledger/report 不变
- cleanup writer 与独立 reviewer 均由主管直接验收，accepted-only gate 保持
- final lifecycle 回到 currentCount=0、unfinished=0、stage=null、leaf=null、live delegation=UNKNOWN/missing

允许动：

- R4C01：仅五个字面量 `/tmp/hl-r4f05-*` 允许路径
- R4C00/R4C03：本轮 `docs/harness/**` stage、leaf、delegation、additive reports、plan、plan-review
- R4C02：只读核验与其 additive reviewer report

不许动：

- retained artifact、LICENSE、package.json、NEXT、bin、hooks、lib、scripts、skills、test
- 原 R4 archived stage、leaf、delegation ledger 和历史报告
- 允许列表之外的任何文件或目录
- push、tag、release、deploy、Git provenance、external memory
- kill、restart 或干扰 Poracode、watchdog、bridge

相关事实：

- stableProblemFingerprint=`r4f05-cleanup-claim-zero-residue-gap`
- 这是一次继承的 closeout acceptance 有效失败，不是产品或 candidate 失败；新 ledger 计数一次，leases=0
- 当前真实 collaboration 工具面没有 Grok；普通工程 writer 使用当前可调用的 `gpt-5.5`，不猜测未暴露模型
- retained candidate=`sha256:d73f4b4f83e6034e33168995c24ca4514d69bcd70ccc19f8aa255da42d218daa`，bytes=1061071，40 files / 13 product JS

相关入口：

- 五个 Kickoff 字面量目录
- retained artifact 与 `scripts/build-candidate.js`
- R4 archived stage/leaf/ledger 和历史 reports 的只读 hash
- `tree.readChain()` 与 delegation readback

已否定路线：

- 用窄前缀残留扫描证明全部删除
- 使用 glob、`rm -rf`、`find -delete` 或扩大到未授权 `/tmp` 内容
- 用完整产品重写或新 candidate 掩盖 cleanup erratum
- 改写原 R4 历史报告或 archived ledger

未知：无；发现额外 `/tmp/hl-r4f05-*` 时必须 HOLD 并报告。

路线依据：先冻结 exact allowlist、realpath/owner/type/symlink 和原 candidate/archive hashes，再由单 writer 精确删除，独立 reviewer 只读复核，最后主管 additive closeout。

依赖：无

结果合同：只有 R4C03 主管最终验收和物理归档后，本 leaf 才关闭；任何 writer/reviewer COMPLETE 都不等于 accepted。

## Work Unit R4C00 — baseline and minimal task package

goal: Fresh-read zero-current lifecycle，冻结 retained artifact、五个字面量目录和原 R4 历史 hashes，并建立最小 cleanup ledger。

directAcceptance:

- currentCount=0、unfinished=0、stage=null、leaf=null、live delegation=UNKNOWN/missing
- 五目录 realpath 等于字面量、owner=current user、type=directory、无内部 symlink
- 未发现第六个未知 `/tmp/hl-r4f05-*`
- inherited closeout acceptance failure 在新 ledger 中只计一次且 leases=0

allowed:

- 只读项目、retained artifact 和五个字面量目录
- 本轮 stage、leaf、delegation 与 R4C00 supervisor report

forbidden:

- 删除任何目录
- 修改 candidate input、原 R4 archive/report 或 external memory

facts:

- stableProblemFingerprint=r4f05-cleanup-claim-zero-residue-gap

entryPoints:

- tree.readChain、delegation.read、lstat/realpath、retained artifact

disprovenRoutes:

- 窄前缀零结果替代完整 `hl-r4f05-*` 顶层扫描

unknowns:

- 无

routeBasis: 最短只读证据冻结字面量允许列表和不可变摘要。

dependencies: 无

resultContract: 主管直接验收 PASS 后记录 accepted，才允许派 R4C01。

## Work Unit R4C01 — exact cleanup writer

goal: 使用显式路径数组和安全 `fs.rmSync` 只删除五个已授权 R4F05 disposable 目录。

directAcceptance:

- 删除前逐项 realpath literal-equal、directory non-symlink、owner current、内部 symlink=0、allowlist member
- 删除后五路径全部 absent
- 未删除或修改任何其他路径

allowed:

- /tmp/hl-r4f05-check-42BiRM
- /tmp/hl-r4f05-mat-Bj28kc
- /tmp/hl-r4f05-proj-he2P5I
- /tmp/hl-r4f05-finalsrc-L3Xl6Y
- /tmp/hl-r4f05-finalproj-397F1D

forbidden:

- glob、rm -rf、find -delete、任何非 allowlist 路径
- 项目文件、candidate、R4 archive/report、lifecycle、ledger

facts:

- R4C00 已确认五目录无内部 symlink 且 owner 为当前用户

entryPoints:

- Node fs.lstatSync、fs.realpathSync、fs.readdirSync、fs.rmSync

disprovenRoutes:

- 扩大删除范围或仅扫描不删除

unknowns:

- 删除时出现任何状态漂移必须 BLOCKED，不得绕过断言

routeBasis: 显式 allowlist + 删除前全断言是最短安全路线。

dependencies:

- R4C00

resultContract: writer COMPLETE 只登记 reported_complete；主管直接读回五路径和范围证据 PASS 才 accepted。

## Work Unit R4C02 — independent cleanup verification

goal: 独立只读证明五目录和全部 `/tmp/hl-r4f05-*` 已清零，原 candidate 与 R4 历史权威完全未变。

directAcceptance:

- 五路径 absent，`find /tmp -maxdepth 1 -type d -name 'hl-r4f05-*'` 零结果
- retained SHA 不变；当前根一次 build 与 retained 逐字节相同；candidate/file/product digests 和 40/13 不变
- candidate input、原 R4 archive/ledger/report hashes 不变
- 禁止动作全部为 false

allowed:

- 只读 `/tmp`、当前项目、retained artifact、原 R4 archive/report
- additive R4C02 independent review report

forbidden:

- 删除、产品/candidate/lifecycle/ledger 修改、完整 119 项测试

facts:

- R4C01 只有 supervisor accepted 后才解锁本单

entryPoints:

- find、sha256、candidate builder 单次 build、cmp、tree/delegation readback

disprovenRoutes:

- 相信 cleanup writer COMPLETE 或原错误零残留报告

unknowns:

- 无

routeBasis: independent reviewer 使用新进程和完整前缀扫描，直接挑战原缺口。

dependencies:

- R4C01

resultContract: reviewer COMPLETE 只登记 reported_complete；主管读回并复核 PASS 才 accepted。

## Work Unit R4C03 — supervisor additive closeout

goal: 在 R4C01/R4C02 accepted 后建立 additive erratum authority，更新 plan/plan-review 并归档本轮 lifecycle。

directAcceptance:

- additive report 明确纠正原“全部删除”结论且不改写原 R4 历史文件
- plan/plan-review 指向 cleanup erratum final authority
- archived cleanup ledger R4C00-R4C03 accepted、inherited failures=1、leases=0
- final currentCount=0、unfinished=0、stage=null、leaf=null、live delegation=UNKNOWN/missing

allowed:

- 本轮 docs/harness stage、leaf、delegation、additive erratum report、plan、plan-review

forbidden:

- 所有 candidate inputs、retained artifact、原 R4 archives/reports、任何 `/tmp` 删除

facts:

- R4 产品和 candidate acceptance 保持不变

entryPoints:

- R4C01/R4C02 reports、new ledger、plan authority、tree readback

disprovenRoutes:

- 覆盖原 R4 closeout report 或 archived ledger

unknowns:

- 无

routeBasis: additive erratum 保留历史真实性并提供最新 authority。

dependencies:

- R4C02

resultContract: 主管 direct PASS 后 accepted 并 no-clobber 归档；停在 candidate-only。
