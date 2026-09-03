# HL12-F06 writer report R12

status: reported_complete
date: 2026-09-02 (Asia/Shanghai)

## 实际修改

- `lib/hook.js`: required decision/carrier budget contract；WorkUnit/Parallel/Completion/HardBoundary/PushGate 行不再走 `fitLine` 或最终 `slice`；超限使用明确 `inline=false;truncated=true;digest/ref/readApi` 载体；长引用有界摘要；并行载体保留 ids/count、完整 canonical digest、三 sentinel、conflicts；`complete=false` 显式优先；单元载体补齐 sentinelMiddle。
- `lib/install.js`: 当前 instruction 明确 0.12、运行事实、产品结果完成标准和单一 decision package 语义；保留 0.10 历史块字节。
- `test/hl12-f06-joined.test.js`: 增加极端长 push gate 正式 SessionStart 压力回归；保留 3/8 unit、UNKNOWN、digest 重算覆盖。
- 按 R8 授权机械迁移旧断言：`test/fix01-guidance-runtime.test.js`、`test/fix03-joined-runtime.test.js`、`test/hl12-f03-work-unit-truth.test.js`、`test/nv02-capabilities.test.js`、`test/nv03-hook-work.test.js`、`test/nv04-recovery.test.js`、`test/r2-joined-runtime.test.js`、`test/r3-joined-runtime.test.js`。安全/完整性意图保留为当前 0.12 carrier、digest、Scope/Recovery/heartbeat、accepted-only/conflict 断言；未删除测试、未加 skip、未恢复 Guidance/remaining。

未修改 `hooks/dispatcher.js`、`lib/guidance.js`、`lib/tree.js`、`lib/work.js`；dispatcher accepted SHA 保持既有 `9db94a9904696e9bf1a88b9000805a5fd2fd5eda7f6d3b0308246fd911dde15b`。

## 验证证据

- `node --check lib/*.js bin/*.js hooks/*.js`: pass。
- F00-F06 matrix（52 tests）: 52 pass / 0 fail。
- `npm test`: 176 tests / 175 pass / 0 fail / 1 existing scope skip。
- F06 formal source + disposable installed dispatcher：9 pass；覆盖 single/leaf fallback、2/3/8 units、long UNKNOWN、long ref、digest/sentinel/readApi/count、极端 push gate；未做真实全局安装、宿主修改、push/tag/release/deploy，未启动 F07。

## 当前 product hashes

```
lib/hook.js   f105a2c5d68722a9536176fee45b8633b77d0c758e525fd78f0ce5b4e55c26e2
lib/install.js ec606aeae25bfdd5ca43469e691e2c36251792b58ca6f811666721714a810511
bin/hl.js     676dce1d4664c52f8c74f1c5796e8064d3097c6c5b72eca7541a3bcf6c8725f2
hooks/README.md e8ec9787e2c71afd08a775fa28c62c88c6b0ee4e16260b5ae0d2d413484e3b4b
```

工作区无 Git repository；以上为当前文件 SHA-256。报告完成后停止，等待主管独立验收。
