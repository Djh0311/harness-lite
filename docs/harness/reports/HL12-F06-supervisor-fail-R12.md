# Harness Lite 0.12 HL12F06 supervisor review R12

日期：2026-09-02（Asia/Shanghai）  
work unit：`HL12F06 — joined integration and migration`  
复核对象：R12 当前工作树；writer report `HL12-F06-writer-report-R12.md`  
当前 `lib/hook.js` SHA-256：`sha256:f105a2c5d68722a9536176fee45b8633b77d0c758e525fd78f0ce5b4e55c26e2`

## 结论

**FAIL，返回同一 owning unit 继续 R13。**

R12 的全量数字可以复现：`npm test` 为 176 tests / 175 pass / 0 fail / 1 个既有
scope skip；F00-F06 独立矩阵为 52/52，F06 定向为 9/9，语法检查通过。六个 CEX
及其正常正例也通过。它们证明了 R12 修复了此前的静默截断、完整 digest 和旧断言
回归，但还不能覆盖下面两个正式产品语义缺口。

## 决定性问题

### 1. 多 runnable 的正式 carrier 丢失既有 accepted-only / 串并行状态

主管用 2、3、8 个合法 active/runnable unit 重建 disposable project，调用正式
`hook.sessionStart()`。`hookParallelWorkUnitLines()` 先生成包含状态的 header，随后
`hookContext()` 的 `hasCarrierLine` 过滤掉除 `WorkUnitCarrier`/`ParallelWorkUnitsCarrier`
以外的所有 work 行。因此最终 `additionalContext` 只剩 aggregate carrier；其中虽有
`count/conflicts`，却没有 `acceptedOnlyUnlock`、`state/status/active/runnable`。

例如 2 个 active unit 的正式输出首行是：

```text
ParallelWorkUnitsCarrier：complete=complete；inline=false；truncated=false；count=2；ids=U0,U1；ref=docs/harness/leaves/L.md；readApi=tree.workUnitPackages；digest=sha256:...；...
```

输出中没有 `acceptedOnlyUnlock=true`，也没有并行状态 header。`work.parallelWorkUnitContext()`
本身仍返回这些事实，但正式 Hook 的模型载荷没有携带它们；这回归了 F03/F06 要求的
“按真实依赖判断串并行”和 accepted-only 语义，不能只靠模型自行再读内部 API 推断。

### 2. 压力路径会把当前动态 capability 整体删掉

主管构造 4、8 个 runnable unit 并提供合法的当前 Hook capability manifest。由于
`pressuredWire` 成立，`hookContext()` 使用 `essential` 数组；该数组没有
`capabilityContextSlots`。因此最终 `SessionStart`/`UserPromptSubmit` context 完全没有
`Capabilities：` 或 `CapabilityCarrier：`，即使上下文仍有约 850 字符的余量。

这不是把 capability 压缩成 UNKNOWN，而是把当前工具面从正式 pre-dispatch 载荷物理删掉，
使模型无法按当前真实工具面选择 runnable unit。它违反 F04/F06 的 dynamic capability
joined regression，也没有必要，因为 required wire 加上一个有界 capability carrier
仍可落在 1800 字符预算内。

## 已独立核对的部分

- `node --check`：所有当前 product JS 通过。
- `node --test test/hl12-f06-joined.test.js`：9/9。
- F00-F06 矩阵：52/52。
- `npm test`：176 tests / 175 pass / 0 fail / 1 existing scope skip。
- 多 unit aggregate digest 可由 `work.parallelWorkUnitContext().units.map(unit => unit.package)`
  的递归 key-sort canonical JSON 独立重算；2/3/8 个 unit 的 count、id、ref、readApi、
  digest、前中后 sentinel 均可核对。
- 长 goal/standards、长 ref、长 gate 和 mixed recovery 的 required carrier 没有普通
  `...`/`…` 静默尾切，context 保持在 1800 内。
- source 与 disposable installed dispatcher 的核心 carrier/digest 形状一致；六个 CEX
  和六个正常正例重新通过。
- 未做真实全局安装、未修改真实全局配置、未 push/tag/release/deploy、未启动 F07，也未
  干扰 Poracode/watchdog/bridge。

## R13 最小返修要求

1. 正式多-runnable Hook 必须保留一个短而完整的并行 header，或把等价字段加入
   `ParallelWorkUnitsCarrier`：至少包括 `acceptedOnlyUnlock`、`state/status`、
   `active/runnable`（或有明确 count 的等价表示），并保持 carrier 的完整 package
   digest/ref/readApi/count/sentinel；不得恢复 `remaining=N` 或丢 package。
2. 压力预算仍按 required wire 优先，但把有界 `capabilityContextSlots` 作为可保留的
   当前 pre-dispatch 信息加入；若确实放不下，必须给出明确、可读、带完整性状态的
   capability carrier，而不是静默删除。增加 4/8 runnable + valid dynamic manifest 的
   source 与 installed regression。
3. 保留 R12 已通过的全部预算、UNKNOWN、digest、CEX 和 authorized migration 回归；不
   删除测试、不加 skip、不恢复旧 fragments、不扩大硬风险或用户确认。

F07/F08 在该返修和主管重新 PASS 前不得启动。
