# HL12 F03 writer report R45

status: reported_complete

这是 R44 后的边界收紧返修。主管复核发现：损坏、过期或不安全的 delegation
carrier 也会被误当成“没有 ledger”，从而错误投影 leaf 静态 work-unit 包。

## 修复

- `lib/work.js`：静态 runnable projection 现在只在
  `delegation.read()` 明确返回 `state=UNKNOWN` 且 `reason=missing` 时启用。
  malformed、shape/schema、unsafe、stale、chain 等状态继续走原有
  UNKNOWN/零误导路径；live ledger 和普通 leaf 行为不变。
- `test/hl12-f03-work-unit-truth.test.js`：新增 malformed delegation JSON
  回归，确认正式 `hook.sessionStart` 不投影任何 known package；保留 R44 的
  no-ledger 与 rejected-ledger 两条正式 SessionStart 路径测试。

## 验证

- `node --check lib/work.js`: PASS
- `node --test test/hl12-f03-work-unit-truth.test.js test/r2-parallel-context.test.js test/hl12-f06-joined.test.js`: 27/27 PASS，0 skip
- 未重建 candidate，未做真实安装、全局写入、发布或宿主进程操作。

SHA-256：

- `lib/work.js`: `a1f05cf8975b9c15e3f63a63874adef37b9692192cedca0cb6ab64611b650de4`
- `test/hl12-f03-work-unit-truth.test.js`: `b72fe179f43b8f7f734ecde4b188262667ea0b6b5fe85ca86ad88c4f5702ab7b`
