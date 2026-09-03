# HLNEXT-REPAIR R4F04 supervisor acceptance — PASS

日期：2026-09-01（Asia/Shanghai）

结论：`PASS / R4F04 INDEPENDENT PRODUCT ACCEPTANCE ACCEPTED / R4F05 UNLOCKED / NOT PUSHED / NOT RELEASED`。

## Reviewer independence and artifact-only route

- reviewer：`gpt-5.6-luna / openai-engineering / xhigh`，未参与 R4F01–R4F03 实现。
- reviewer 唯一持久写面是 `docs/harness/reports/HLNEXT-REPAIR-R4F04-independent-product-review.md`；没有修改产品、candidate 输入、lifecycle、ledger 或历史归档。
- 产品验收源只取项目内 retained artifact；reviewer 从 40 个 artifact rows 物化源码、恢复 mode、重建、fresh install 和运行矩阵，没有从 b164、历史 session 或旧 `/tmp` 拼装。

## Independent evidence accepted

- retained SHA / candidate identity：`sha256:d73f4b4f83e6034e33168995c24ca4514d69bcd70ccc19f8aa255da42d218daa`
- bytes：`1061071`
- fileDigest：`sha256:a380b16c8fc1ddafa0371aa37d8e0a3815576aeaae3e7d94156402204c615acd`
- productDigest：`sha256:73f9ac6f54d863a5093144e165c17825ac9ba3560309d4382ecd3e8393ebda3e`
- files / product JS：`40 / 13`
- current-root build 1/build 2、retained、artifact-materialized rebuild 全部逐字节一致；fresh install `INSTALLED`，installed `verify06.ok=true`。
- artifact 内 NEXT 无 live R3/R4 current authority、自身 SHA、fileDigest、artifact bytes 或 identity 回填；R01–R18 保持 4772 bytes / `sha256:1a69fc8dbbef7304938b9da1f20af9daf47f6b24b131b6d8861c8c906d66a719`。
- 五模型与 24 模型 carrier、跨 dispatcher 进程读取、动态增删、oversize/unsafe fail-closed 全部 PASS。
- 并行 work-unit 最小上下文、无人工 selector、overlap conflict、reported_complete/accepted unlock、blocked/partial 分支隔离全部 PASS。
- ordinary→Terra→Sol 问题级恢复、外部工具故障不计数、同根 drift、problem-local lease clear 全部 PASS；产品静态面无 agent/provider 调度器、静态模型目录、credential、daemon、UI/transcript 依赖。
- artifact 物化源 `npm test`：119 total / 118 pass / 0 fail / 1 expected docs-local skip；selfcheck PASS；NV05 11/11；R3 joined/carrier、R4 closeout、13/13 syntax、fresh/managed install、固定 0.9.1 upgrade、tamper/extra-path/relabel HOLD 零写、fault rollback、host evidence、native push gate全部 PASS。

## Supervisor direct challenge

主管没有把 independent reviewer COMPLETE 直接当作 accepted。读回完整 review 后，重新执行：

- 当前根正式 rebuild 与 retained artifact `cmp` PASS；retained 文件 SHA 仍为 `d73f...8daa`。
- disposable missing artifact 返回 `ENOENT`，不能验证。
- disposable artifact 单字节改变后 JSON 仍可 parse，但 SHA 变为 `9cc9bb...18d1`，与 authority identity 不符，fail closed。
- artifact-materialized source 只增加 `docs/harness/**` 后 candidate bytes/digest 不变；修改 NEXT candidate input 后 candidate bytes/digest 必须变化。
- 从 pristine artifact-materialized source 重跑 NV05 + R3 carrier/joined + R4 closeout：25 tests / 24 pass / 0 fail / 1 同一 expected docs-local skip。
- R3 archived ledger SHA 仍为 `sha256:4a93aa476f993a16f21ab8bb1f5dc0024d6d4bd0453311b46d78bdd5d0545ef9`；主管 disposable 目录已删除。

监督 readback：R4F04 只使用 `wait_agent(timeout_ms=300000)`；一个完整窗口只登记 activity，未用 30/60 秒忙轮询，未因正常沉默介入。live failureCount=1、same-root drift/non-counting=1、leases=0。

R4F04 主管 direct acceptance PASS，只解锁 docs-only R4F05；尚未关闭或归档 R4 stage/leaf。

未 push/tag/release/deploy，未更新 external memory，未修改 Git provenance，未干扰 Poracode/watchdog/bridge。
