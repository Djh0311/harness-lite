# Harness Lite 0.12 HL12F06 supervisor review R13

日期：2026-09-02（Asia/Shanghai）  
work unit：`HL12F06 — joined integration and migration`  
复核对象：R13 当前工作树；writer report `HL12-F06-writer-report-R13.md`  
当前 `lib/hook.js` SHA-256：`sha256:f2cf6f5e24d73ddd2635aedae3d044a9d519aa8123d7db277c11d618af7156d2`

## 结论

**FAIL，返回同一 owning unit 继续 R14。**

R13 报告的测试数字可以复现：F00-F06 独立矩阵 52/52，F06 定向 9/9，`npm test`
为 176 tests / 175 pass / 0 fail / 1 个既有 scope skip，语法检查通过。这些数字没有
覆盖正式多-runnable Hook 中状态头被后续预算整理丢掉的问题。

## 决定性问题

### 正式多-runnable Hook 仍丢失 accepted-only / 并行状态

主管在 disposable project 中声明并记录 2、4、8 个合法 runnable unit，提供合法的当前
Hook capability manifest，然后调用正式 `hook.sessionStart()`；又在同一临时项目安装后
通过 `.claude/harness-lite/hooks/dispatcher.js` 重放。source 和 installed 两条路径结果
一致：

- `ParallelWorkUnitsCarrier：...count=2/4/8...` 存在，完整 package digest、ref、readApi
  和前中后 sentinel 可核对；
- `Capabilities：state=known` 和 `CapabilityCarrier：complete=true` 也保留，说明 R13
  的 capability 压力修补确实生效；
- 但 `ParallelWorkUnits：state=...；status=...；active=...；runnable=...` 完全不存在，
  `acceptedOnlyUnlock=true` 也完全不存在。

直接原因是 `lib/hook.js` 的 `hookContext()` 在 `hasCarrierLine` 为真时仍使用只允许
`WorkUnitCarrier|ParallelWorkUnitsCarrier` 的过滤器（当前约第 263-266 行），把
`hookParallelWorkUnitLines()` 已经补上的 `ParallelWorkUnits：...acceptedOnlyUnlock=true`
header 丢弃。aggregate carrier 本身也没有这些字段，因此模型正式载荷看不到“哪些在跑、
哪些可派、只有 accepted 才解锁依赖”的并行判断依据。

这不是要求增加新确认或新授权；只是 F03/F06 已冻结的状态事实不能在正式 caller 接线时
消失。它会让模型只能看到一个包裹摘要，无法按真实 accepted-only 依赖和 active/runnable
状态作决定，故不能接受。

## 已独立核对

- source `hook.sessionStart()`：2、4、8 runnable 均复现缺失 header；context 长度分别为
  1111、1194、1206，均在 1800 内，不能以预算不足解释。
- installed dispatcher：2、4、8 runnable 均复现同一缺失；context 长度分别为 1230、
  1313、1325。
- 合法 dynamic capability manifest 在 2、4、8（包括 pressured 8）均保留 known 状态和
  capability carrier；这部分不要求另加严格度。
- `node --check`、F00-F06 52/52、F06 9/9、`npm test` 176/175/0/1 均通过，但未覆盖
  这个正式输出语义。
- 未做真实全局安装、未修改真实全局配置、未 push/tag/release/deploy、未启动 F07，也未
  干扰 Poracode/watchdog/bridge。

## R14 最小返修要求

1. 正式多-runnable Hook 必须保留一个短而完整的并行状态头，至少带上
   `state/status/active/runnable/acceptedOnlyUnlock`；或者把完全等价字段放进
   `ParallelWorkUnitsCarrier`。不得只在 helper 返回值里保留、再在 `hookContext()` 过滤掉。
2. 保留 R13 已通过的 aggregate package digest/ref/readApi/count/sentinel、dynamic capability
   carrier、1800 字符预算和全部 F00-F06/既有迁移回归。
3. 增加一个正式 source 和一个 installed dispatcher 的 2-unit（至少）回归断言，直接检查
   `ParallelWorkUnits：` 与 `acceptedOnlyUnlock=true`；不能只检查 helper 或 carrier count。
4. 不删除测试、不加 scope skip、不恢复旧 fragments、不增加普通工作确认或新的授权系统。

F07/F08 在 R14 主管重新 PASS 前不得启动。
