# Harness Lite 0.12 HL12F06 supervisor review R15

日期：2026-09-02（Asia/Shanghai）  
work unit：`HL12F06 — joined integration and migration`  
复核对象：R15 当前工作树；writer report `HL12-F06-writer-report-R15.md`  
当前 `lib/hook.js` SHA-256：`sha256:f5529f912cc51465da8d77f3af70cb473cbbb7ee715ae1c7284d0aa20bb23206`

## 结论

**FAIL，返回同一 owning unit 继续 R16。**

R15 的产品改动经主管直接重放是正确的：混合 2 active + 6 runnable 场景在 source 和
installed dispatcher 中都显示 `active=2；runnable=6；acceptedOnlyUnlock=true`，aggregate
carrier、capability 和预算没有回归。可是 R14 明确要求的回归证据没有落到测试中。

## 缺口：没有正式 source + installed 混合计数回归

当前 `test/hl12-f06-joined.test.js` 仍为 9 个测试；新增/修改的并行断言只调用
`hook.hookParallelWorkUnitLines()` helper，并且是 3 个 synthetic unit 的普通 header。
文件中没有构造 `active=2/runnable=6` 的真实 delegation ledger，也没有通过
`hook.sessionStart()` 和 `.claude/harness-lite/hooks/dispatcher.js` 各自断言正式输出。

因此当前绿测不能防止 R14 暴露的那类“压力路径把 aggregate package count 当 active count”
回归。主管临时 probe 能证明当前代码，但 writer 的 resultContract 仍未满足 R14 要求的
可重复 source/materialized regression；这不是新增严格度，而是正式 caller 证据链尚未闭合。

## 已独立核对

- source 正式输出：`active=2；runnable=6；acceptedOnlyUnlock=true`，context 1407 字符；
- installed dispatcher 正式输出：同一状态，context 1526 字符；
- 8 个 unit 的完整 aggregate digest/ref/readApi/count/sentinel、dynamic capability 和
  长 completion carrier 均保留；
- `node --check`、F00-F06 52/52、F06 9/9、`npm test` 176/175/0/1 可复现；
- 未做真实全局安装、未修改真实全局配置、未 push/tag/release/deploy、未启动 F07，也未
  干扰 Poracode/watchdog/bridge。

## R16 最小返修要求

1. 在允许的 `test/hl12-f06-joined.test.js`（或同范围 `test/hl12-*`）加入一个可重放的
   混合 fixture：至少 2 个 active、6 个 runnable；直接调用正式 `hook.sessionStart()`
   断言 `active=2`、`runnable=6`、`acceptedOnlyUnlock=true`、carrier count=8。
2. 同一 fixture 做一次 disposable `install.install(..., {write:true})` 后，通过已安装
   `hooks/dispatcher.js` 重放并断言同样字段；不只测 helper，不只测全 runnable 巧合值。
3. 保留 R15 已通过的实现和所有旧 CEX/预算/capability/migration 回归；不删测试、不加
   skip、不增加普通工作确认或新的授权系统。

F07/F08 在 R16 主管重新 PASS 前不得启动。
