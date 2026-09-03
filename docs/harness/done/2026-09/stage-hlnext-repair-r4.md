# HLNEXT Repair R4 — Harness Lite 0.10 candidate closeout binding repair current stage

状态：dual-state closeout authority。

- pre-effectiveness：`CURRENT / R4F05 R3 WRITER PREPARATION / NOT YET SUPERVISOR ACCEPTED / NOT ARCHIVED / ARTIFACT RETAINED / NOT PUSHED / NOT RELEASED`
- post-effectiveness：`PASS / R4 CANDIDATE-CLOSEOUT REPAIR ACCEPTED / CANDIDATE ONLY / ARTIFACT RETAINED / REPRODUCIBLE / NOT PUSHED / NOT RELEASED`

目标：修复 R3 candidate 的可重建封存与最终治理绑定问题，当前只把 R4F05 R3 docs-only closeout 文本准备到可验收状态。Pre-effectiveness 时 `currentCount=1`、live delegation=`true`、R4F05 active、三路径 absent；post-effectiveness 只在主管完成 direct acceptance、ledger acceptance、三路径物理归档和最终 rebuild/readback 后成立，此时 `currentCount=0`、live delegation=`UNKNOWN/missing`、R4F00-R4F05 archived ledger accepted。

## 顺序

- [x] R4F00 基线与反例冻结（supervisor accepted）
- [x] R4F01 候选输入与收口机制修复（supervisor accepted）
- [x] R4F02 R3 失败账分类与 R4 治理载体（supervisor accepted）
- [x] R4F03 唯一 integration owner 与候选封存（supervisor accepted）
- [x] R4F04 全新独立产品验收（independent reviewer PASS；supervisor accepted）
- R4F05 最终收口与收口后重建（R1 rejected and counted；R2 rejected as same-root/non-counting drift after repeating premature fake accepted plus physical archive；R3 active writer preparation；supervisor acceptance and physical archive pending）

当前证据：retained artifact `docs/harness/artifacts/harness-lite-0.10.0-d73f4b4f83e6034e33168995c24ca4514d69bcd70ccc19f8aa255da42d218daa.json`、R4F03 supervisor PASS、R4F04 independent PASS、R4F04 supervisor PASS、R4F05 R1 supervisor FAIL、R4F05 R2 supervisor FAIL、R4F05 R3 writer report 和 conditional supervisor closeout template。`docs/harness/done/2026-09/stage-hlnext-repair-r4.md`、`docs/harness/done/2026-09/HLNEXT-REPAIR-R4.md`、`docs/harness/done/2026-09/HLNEXT-REPAIR-R4-delegation.json` 在 supervisor archive 前必须 absent，只有在主管完成 required sequence 后才 present as archived authority。

硬依赖：`R4F00 → (R4F01 || R4F02) → R4F03 → R4F04 → R4F05`。只有主管验收通过解锁下游；writer COMPLETE 只登记 reported_complete。

相关权威设计：

- 2026-09-01 用户 R4 Kickoff 的 candidate-closeout 边界、直接反例、完整回归与停点规则
- 2026-09-01 用户 R4F05 R3 窄范围 repair writer 边界：修正 R1/R2 虚假终态叙述，不写 ledger，不移动 current stage/leaf/delegation
- `NEXT-VERSION-DISPATCH-PLAN.md` R01-R18 历史冻结正文

相关现有实现：

- `scripts/build-candidate.js`、40-file canonical candidate 输入与 retained artifact
- `NEXT-VERSION-DISPATCH-PLAN.md` 稳定顶部索引
- `docs/harness/**` 外部治理、reports、done lifecycle 与 delegation ledger

必须保持的架构边界：

- Harness 只投影和记账，指导模型直接使用真实 agent 工具。
- candidate 输入不包含 retained artifact 自身；candidate identity 与 lifecycle authority 只写在 `docs/harness/**`。
- 5/24 模型 carrier、并行 work-unit、accepted-only unlock、恢复链、安装/升级/回滚/push gate 不回退。
- active agents 统一使用 `wait_agent(timeout_ms=300000)`；本次历史监督记录保持该事实。
- R4F05 R1 是已记录有效失败；R4F05 R2 是同根 drift/non-counting；aggregate counted effective failures=`2`，problemCount=`2`，R4F01 historical root problem accepted/effectiveCount1，R4F05 repair problem effectiveCount1/status observed until supervisor acceptance then accepted，non-counting drift events=`2`，recovery leases=`0`，普通 family count remains below `5`，不触发 Terra/Sol。

不许动：

- push、tag、release、deploy 或修改/伪造 Git provenance
- provider adapter、静态模型目录、daemon、credential store、UI scraping 或第二调度器
- 历史 R1/R2/R3 报告和归档 ledger
- `docs/harness/delegation.json` 或任何 delegation record API
- current stage/leaf/delegation 的移动、复制、删除、创建，或三个 R4 done 路径的物理形成
- external memory
- Poracode、watchdog、bridge 及相关宿主进程
