# HLNEXT-REPAIR R4F03 supervisor acceptance — PASS

日期：2026-09-01（Asia/Shanghai）

结论：`PASS / R4F03 ACCEPTED / CANONICAL ARTIFACT RETAINED / R4F04 UNLOCKED / NOT PUSHED / NOT RELEASED`。

## Direct retained-artifact acceptance

- retained artifact：`docs/harness/artifacts/harness-lite-0.10.0-d73f4b4f83e6034e33168995c24ca4514d69bcd70ccc19f8aa255da42d218daa.json`
- 文件 SHA-256 与文件名 identity：`sha256:d73f4b4f83e6034e33168995c24ca4514d69bcd70ccc19f8aa255da42d218daa`
- artifact bytes：`1061071`
- fileDigest：`sha256:a380b16c8fc1ddafa0371aa37d8e0a3815576aeaae3e7d94156402204c615acd`
- productDigest：`sha256:73f9ac6f54d863a5093144e165c17825ac9ba3560309d4382ecd3e8393ebda3e`
- files / product JS：`40 / 13`

主管没有以 writer COMPLETE 代替验收。主管重新读取 retained bytes，验证 canonical stringify round-trip，逐条核对 40 个 `path/contentBase64/mode/size/sha256`，确认无重复、绝对路径或 `..`，且 candidate 输入中没有 `docs/harness/**`。

## Rebuild, materialization and install

- 当前项目根两次 programmatic build 与 retained artifact 三方逐字节相同。
- 当前项目根两次 CLI `--out` build 与 retained artifact 三方 `cmp` PASS；三份 SHA 和 bytes 均为上述 `d73f...8daa / 1061071`。
- 从 retained artifact 每个 row 物化到精确 disposable source tree，恢复 mode 后重新 build，artifact bytes、candidate SHA、fileDigest、productDigest、file count 与 product file count 全部一致。
- 只从物化 source fresh install 到 disposable project：`INSTALLED`，`verify06.ok=true`。
- 主管创建的精确 `/tmp/hl-r4f03-supervisor-*` 与 `/tmp/hl-r4f03-cli-supervisor-*` 已删除；项目内 retained artifact 保留。

## Candidate boundary and frozen requirements

- artifact 内 NEXT 顶部没有具体 `sha256:<64hex>`、candidateDigest/fileDigest/productDigest 字段、artifact bytes、R3/R4 current stage/leaf 或 retained digest。
- R01-R18 区段保持 `4772` bytes / `sha256:1a69fc8dbbef7304938b9da1f20af9daf47f6b24b131b6d8861c8c906d66a719`。
- immutable R3 archived ledger 保持 `sha256:4a93aa476f993a16f21ab8bb1f5dc0024d6d4bd0453311b46d78bdd5d0545ef9`。
- R4F03 只新增 retained artifact 和 candidate 外治理材料；没有修改 NEXT、scripts、test 或产品源码。完成这些 docs-only 写入后根构建仍与 retained artifact 相同。

## Regression and supervision

- `npm test`：119 tests，118 pass，0 fail，1 expected skip。skip 为既有 `source candidate does not include local lifecycle documents`，因为 `docs/harness/**` 被设计为 candidate 外治理面。
- `npm run selfcheck`：PASS；内部接口 6，内含全测 PASS。
- 13/13 product JavaScript `node --check`：PASS。
- 完整测试已覆盖 NV05 的 fresh/managed install、固定 0.9.1 upgrade、coherent tamper/relabel HOLD 零写、host evidence、fault rollback、native push gate，以及 R3 的五模型/24 模型 carrier、动态变化、oversize/unsafe fail-closed、并行 work units、accepted-only unlock、恢复 ledger 与 write conflict。
- writer R1 的协作工具角色误解被登记为实际 blocker 后纠正；它不是 candidate direct-acceptance failure，也未增加 recovery failure。R2 期间主管使用真实 `wait_agent(timeout_ms=300000)`；一个完整窗口只登记 `tool-wait` activity，未伪作 semantic progress，也未介入正常沉默。
- live recovery 仍为 1 个 counted historical root failure、1 个 same-root drift/non-counting event、0 leases；未触发 Terra/Sol。

R4F03 主管 direct acceptance PASS。该 acceptance 只解锁 artifact-only 独立 R4F04；不提前声明 R4 final PASS，不归档 stage/leaf。

未 push/tag/release/deploy，未更新 external memory，未修改 Git provenance，未增加 provider adapter/static model catalog/daemon/credential/UI scraping/agent dispatcher，未干扰 Poracode/watchdog/bridge。
