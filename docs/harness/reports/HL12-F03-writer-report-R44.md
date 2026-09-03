# HL12 F03 writer report R44

status: reported_complete

本轮是 R44 独立复核后、同一 F03 owning unit 的最小返修。目标是修复正式
SessionStart 在 current leaf 已声明多个独立 runnable work unit、但 delegation
ledger 尚不存在时退回 `WorkUnit: id=UNKNOWN; status=leaf-fallback` 的问题。

## 实际修改

- `lib/work.js`
  - `parallelWorkUnitContext` 现在先读取当前 leaf 的完整
    `tree.workUnitPackages(root, null, chain)` 投影。
  - 无 live ledger 时，仅对 leaf 明确声明、completion standards 完整且无依赖
    的 work unit 建立只读 `state=known` runnable context；普通无 work-unit leaf
    仍保持原来的 leaf fallback/UNKNOWN 行为。
  - no-ledger projection 为每个 unit 保留完整 package、goal、全部
    completionStandards、authority/design/facts/entryPoints、boundaries、依赖和
    resultContract，并以 `tree.workUnitPackages` carrier 暴露。
  - live ledger 仍由 accepted-only delegation summary 决定 runnable 集合；仅当
    ledger 没有 active/reported/partial/blocked/accepted 分支时，才补入尚未登记
    且无依赖的静态声明，避免 rejected/无关记录让另一独立 unit 消失，同时不绕过
    任何依赖锁。
  - package-list `complete=false` 等显式值不再被 `|| UNKNOWN` 覆盖。
- `test/hl12-f03-work-unit-truth.test.js`
  - 新增正式 `hook.sessionStart` 回归：同一 leaf 的两个独立 unit 在无 ledger
    时必须出现完整 parallel carrier；随后写入 rejected lifecycle 记录后，
    ledger-backed SessionStart 仍必须保留两个 package，且不能出现 UNKNOWN/
    leaf-fallback。
  - 直接从 `work.parallelWorkUnitContext` 核对两 unit 的 goal 与完整标准，
    同时核对正式 carrier 的 count/ids。

## 验证证据

- `node --check lib/work.js`: PASS
- `node --test test/hl12-f03-work-unit-truth.test.js`: 6/6 PASS，0 skip
- F03 相关 joined matrix：
  `node --test test/hl12-f03-work-unit-truth.test.js test/r2-parallel-context.test.js test/r2-joined-runtime.test.js test/nv03-hook-work.test.js test/hl12-f06-joined.test.js test/hl12-f00-counterexamples.test.js`
  26/26 PASS，0 skip。
- `npm test`: 207 PASS，1 FAIL（既有 F07 candidate deterministic retained
  artifact identity mismatch；本轮按主管要求没有重建 candidate，因此该失败是
  预期的候选哈希过期，不是 F03 测试失败）。同一次全量运行未发现其他失败。

## 文件摘要

- `lib/work.js` SHA-256:
  `1038b0c25597829b5cb649d42186f480c2cc90078fe6cd5cf6d358ca5985e837`
- `test/hl12-f03-work-unit-truth.test.js` SHA-256:
  `288954511b4010001a2aee074c0f3d1b457941a01bd8baf49d7881435ed24bed`

未重建或改写任何 0.12 candidate/retained artifact；未做真实安装、全局写入、
push/tag/release/deploy，也未触碰宿主进程或 `/home/synadmin/.codex`。
