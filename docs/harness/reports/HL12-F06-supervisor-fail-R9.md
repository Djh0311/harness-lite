# Harness Lite 0.12 HL12F06 主管验收：FAIL（R9）

日期：2026-09-02（Asia/Shanghai）  
复核对象：R9 当前工作树；writer report `HL12-F06-writer-report-R9.md`

## 结论

**FAIL，返回同一 owning unit 继续 R10。** R9 的 parallel carrier 已加入 ID 和中点 sentinel，
超长 PushGate 也有 external/incomplete 分支；但 required carrier 的预算保护仍未真正接上，
并且旧测试迁移尚未完成。

## 直接复现的产品缺口

### 1. 单 unit `WorkUnitCarrier` 仍被截断

构造一个 declared active unit，放入 40 条每条约 100 字的 unit completion standards，然后走
正式 `hook.sessionStart()`。当前输出的 carrier 行类似：

```text
WorkUnitCarrier：complete=true;inline=false；truncated=false；id=U1；ref=docs/harness/leaves/L.md；readApi=tree.workUnitPackage；count=1；digest=sha256:b6...
```

`WorkUnitCarrier` 仍被 `workContextSlots` 的 `startsWith('WorkUnit') ? 150` 处理，digest/ref/尾
sentinel 被静默切掉，状态却仍是 `truncated=false`。必须给它专用完整预算或 required 不可截断
路径；短 WorkUnit 摘要可以保留，但不能代替完整 carrier。

### 2. `packageList.complete=false` 仍可被 truthy fallback 覆盖

直接调用导出的 `hook.hookParallelWorkUnitLines()`，传入 `packageList.complete=false`、
`context.complete=true` 的降级上下文，输出仍为 `ParallelWorkUnitsCarrier：complete=true`。应以
明确存在的底层值为准，区分 boolean false、`incomplete` 和 `UNKNOWN`，不可使用会覆盖 false
的 `||`。

### 3. 其他 required 行仍可能被预算器切半

在 8 个 active unit 加合法但极长的五字段 push gate 时，正式 `hookContext()` 仍会把
`HardBoundary` 变成带 `...` 的半行；在极端长 ref/metadata 下 parallel carrier 也应单独防护。
R9 的 PushGate external 行本身方向正确，但 required carrier/gate 必须在最终 1800 预算器和
任何 `slice()` 前被识别，先压 operational metadata，不能只改生成函数。

## 回归状态

主管现场重跑：

```text
F06 定向：8/8 pass
npm test：175 tests / 167 pass / 7 fail / 1 existing skip
```

剩余失败为：两个旧 joined 单 unit 断言仍找不到被替换掉的 `WorkUnit` 摘要、F03 正式 Hook
仍需迁移到 aggregate carrier、一个历史 instruction 断言、两个高压 lifecycle 断言，以及一个
R3F03 aggregate 断言。它们不能直接标成 scope skip；应按 R8 授权的迁移范围保留原安全/完整性
意图，改成当前 0.12 单一 Decision、carrier、accepted-only 和有界上下文合同。

## 必须返修

1. required carrier/gate 采用不可静默截断的预算策略；修正 WorkUnitCarrier 槽位和最终预算
   fallback；carrier 若无法完整表达则明确 external/incomplete；
2. 修正 complete 选择的 false 覆盖，并加恶意上下文回归；
3. 为单 unit、2/3/8 unit、长 ref、长 UNKNOWN、mixed recovery、超长 gate 写正式 source 与
   installed probes，核对 digest/ref/readApi/count/三 sentinel；
4. 完成 R8 授权的所有旧测试迁移，最终 `npm test` 0 fail（合理既有 skip 除外），不得删、跳过、
   放宽或恢复废弃 Guidance/remaining 语义。

本轮未真实安装、全局修改、push/tag/release/deploy，也未干扰 Poracode、watchdog、bridge。
F07/F08 不得启动。
