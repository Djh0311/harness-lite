# Harness Lite 0.12 HL12F06 主管验收：FAIL（R8）

日期：2026-09-02（Asia/Shanghai）  
复核对象：R8 当前工作树；writer report `HL12-F06-writer-report-R8.md`

## 结论

**FAIL，返回同一 owning unit 继续 R9。** R8 把 2+ unit 改成 aggregate carrier、加入 ID/digest，并
迁移了一部分旧断言；但正式 Hook 仍有可独立重现的必需 carrier 截断和状态误报，且 source suite
仍未归零。不能接受或进入 F07。

## 决定性产品问题

### 1. 单 unit 的必需 carrier 仍被 WorkUnit 的 150 字符槽截断

在临时项目声明一个 active unit，unit goal/standards/design/facts 足够长，调用正式
`hook.sessionStart()`。R8 输出类似：

```text
WorkUnitCarrier：complete=true;inline=false；truncated=false；id=A；ref=docs/harness/leaves/L.md；readApi=tree.workUnitPackage；count=1；digest=sha256:388...
```

`digest`、ref 和尾部 sentinel 被 `contextWithinBudget()` 的 `WorkUnit*` 150 字符上限截断，
但仍标 `truncated=false`。同类 leaf-fallback/长 leaf standards 也可复现。这个结果不能证明
单 unit 的完整最小任务包；关键 carrier 必须有完整 digest/ref/readApi/count/sentinel，或明确
`truncated/incomplete`，不能出现普通 `...`。

### 2. packageList 的 false 会被 `||` 覆盖成 true

直接调用 `hook.hookParallelWorkUnitLines()`，构造 `packageList.complete=false`、
`context.complete=true` 的恶意/降级上下文，R8 仍输出：

```text
ParallelWorkUnitsCarrier：complete=true...
```

这违反 UNKNOWN/incomplete 不冒充 complete。底层明确值（包括 boolean `false`）必须优先保留，
不能用 truthy fallback。

### 3. 完整性合同仍未覆盖 inline/顺序细节

R8 对 2+ unit 已统一 aggregate，这是正确方向；但必须补正式测试证明：ID 顺序、count、每个
package 全字段和 digest 与 `tree.workUnitPackages()` 一致；任一 package 字段变化都改变校验。
若接受任意输入顺序，需先按稳定 unit ID canonicalize；否则要明确 API 返回顺序就是合同。carrier
还应提供前/中/后或等价的有界 sentinel（当前主要是 start/end/count）。

## 回归状态

当前 `npm test`：**175 tests / 168 pass / 6 fail / 1 existing skip**（主管现场重跑另有 F03
旧正式 Hook 断言随 carrier 迁移出现失败，尚未形成 0 fail）。剩余失败集中在：单 unit carrier
仍被截断、压力场景要求过时的生命周期布局、以及尚未迁移的正式 F03 fixture；不能只标记为
“旧测试冲突”。R8 已迁移的 instruction/Guidance/oversize 断言方向正确，但仍需完成全量迁移，
保留安全负向意图，不删、不过宽、不新增 skip。

## 必须返修

1. 把 `WorkUnitCarrier` 当作 required carrier，不能落入 `WorkUnit` 150 字符槽或最终
   `text.slice()`；必要时保留简短 WorkUnit 可读行，同时让完整 carrier 独立占有足够预算。
2. 修正 complete 状态选择，显式区分 `false`、`incomplete`、`UNKNOWN`，并为该反例加测试。
3. 增加单 unit 长字段、leaf-fallback 长标准、2/3/8 unit、极端 metadata/recovery 的正式
   source/installed probes；每条必需 carrier 无 `...`/`…`，<=1800，digest 可由真实 API 重算。
4. 完成 R8 授权迁移范围内的剩余旧 fixture/断言，最终 `npm test` 0 fail（合理既有 skip 除外）。

本轮未修改产品、测试或全局文件；没有真实安装、push/tag/release/deploy，也没有干扰
Poracode、watchdog、bridge。F07/F08 不得启动。
