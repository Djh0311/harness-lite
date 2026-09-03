# HL12-F06 independent review R7：FAIL

## 结论

本轮以当前 R7 源码为唯一复核对象，重新做了定向测试、载荷对抗检查、正式 Hook/installed dispatcher 检查和全量回归。R7 针对“多 runnable 完整包”和“completion carrier 诚实性”的核心返修证据成立；但整体 F06 不能 PASS：全量回归仍有 13 个失败，且其中包含既有 push gate 文案兼容性回归。当前状态只能是 `FAIL`，不能把定向 8/8 当成版本完成。

没有修改产品代码、旧测试、宿主进程，也没有真实安装、发布或推送。

## 复核对象与命令

复核对象：

- `lib/hook.js`（R7 writer 声明 SHA-256：`0400c15f7cb31ac0427c8a4ff855f4b0e0fb5c06eff406ffa0a91f228651d25c`）
- `test/hl12-f06-joined.test.js`（SHA-256：`6902771f1a8ebe80e93186172df1a9fd605a3f0bea82dab7c8a0dbb186633c0b`）
- R7 writer report（本次现场 SHA-256：`8a56a8609c0f5feae22af76a949215acba0afe2581d1725fc011eb75002fc4e8`）
- `docs/harness/plans/HL12-UPGRADE-PLAN.md` 的 F06、三项保证和迁移要求

执行：

```text
node --check lib/hook.js
node --check hooks/dispatcher.js
node --test test/hl12-f06-joined.test.js
node --test test/hl12-f06-joined.test.js test/hl12-f04-capability-freshness.test.js test/hl12-f05-guidance.test.js
npm test
```

结果：F06 定向 `8/8 pass`；F04/F05/F06 合并定向 `18/18 pass`；全量 `175 tests / 161 pass / 13 fail / 1 skip`。

## R7 核心验收证据

### 1. 完整 package projection 与 digest

独立构造 3 个 runnable unit，读取 `work.parallelWorkUnitContext` 返回的 `unit.package`，对 `units.map(unit => unit.package || unit)` 做递归 key-sort canonical JSON，再独立计算 SHA-256，并与 Hook 的 `ParallelWorkUnitsCarrier.digest` 比较。结果逐字一致：

```text
expected sha256:6fe27672c032e0fe0e76f60db85fccaf908b5a6d76878a933d08ab0b2a395577
got      sha256:6fe27672c032e0fe0e76f60db85fccaf908b5a6d76878a933d08ab0b2a395577
match true; packageCount 3
```

随后只改变一个 unit 的 `allowed` 边界，digest 从
`sha256:c0aee3969b999297d2a657f75e84952ac65f68310181cd54788345ace17c4770`
变为
`sha256:6bd12dfdd630f4058e3c0fa62a65e9c35427ed4af78d20e6c318d15b4754d4c4`，不再出现“只覆盖少数字段、边界变了 digest 不变”的问题。该项 PASS。

### 2. 2 个、3 个及更多 runnable unit

在 2 个普通、2 个长 package、3 个长 package、8 个长 package（含 UNKNOWN completion）以及 8 个 unit 的 combined-pressure 输入下，Hook 均产生 aggregate carrier，包含：

```text
complete=...；inline=false；truncated=false；count=N；ref=...；readApi=tree.workUnitPackages；digest=sha256:...；sentinelStart=...；sentinelEnd=...；sentinelCount=N
```

2/3/8 的 count 与 digest 均随完整 projection 变化；必需的 parallel carrier 行没有 `...` 或 `…+N` 静默省略。combined-pressure 输出总长 `1033`，其中出现的省略号只在非必需、已有界的普通 metadata 行；parallel/completion 必需 carrier 本身没有被切尾。该项 PASS。

### 3. 极长 completion 与 UNKNOWN

构造 40 条长 completion standards，最后一条为 `UNKNOWN`。正式 `SessionStart` 输出：

```text
CompletionCarrier：complete=false;truncated=false;inline=false;ref=docs/harness/leaves/L.md;readApi=guidance.completionCarrier;digest=sha256:b6521c3763b33090108672b3e476c1bbec583fea0f9c6de3425998d1ace2becc;standardsCount=40;sentinel=sha256:70d336c...|UNKNOWN|40
```

Hook 的 `complete=false` 与底层 completion carrier 一致，没有因为 carrier 不完整而假报 complete。F06 专测中的 `carrier.complete=false`、`truncated=true` 和无普通省略号也通过。该项 PASS。

### 4. 正式 Hook 和 installed dispatcher

当前正式路由仍覆盖 `SessionStart`、`UserPromptSubmit`、`Stop`、`PreToolUse`；installed dispatcher 的对应配置和入口存在。定向测试实际执行了：

- SessionStart：一个 Decision、completion carrier；不再输出旧 `Guidance[...]` 片段。
- UserPromptSubmit：通过正式 dispatcher 得到同一 joined decision package。
- Stop：保留生命周期报告/续跑边界。
- PreToolUse：普通 Bash 返回空；真实 `git push` 才 deny 并给出动作、目标、边界、风险和用户决定。

这部分的正式接线和三保证的“异常不拖死普通工作、真实拦截说人话、写入可撤回”在定向范围内通过；没有据此宣称真实宿主安装验收。

## 不能通过的证据

`npm test` 的 13 个失败为：

```text
14  installed runtime projects work-unit package and capability manifest through SessionStart and UserPromptSubmit
20  FIX03 joined install runtime projects guidance, delegation, dependency locks, and effective failures
38  F00 hard-risk freeze: existing action gate stays push-specific and ordinary Bash remains untouched
42  F01 modified, malformed, and duplicate owned markers HOLD with byte-exact zero write
95  0.11 instruction is a short event-routed kernel and preserves the exact 0.10 block
114 bounded SessionStart and UserPromptSubmit contexts keep all lifecycle categories visible within 1800 chars under stress
115 long provenance metadata and multi-category ledger cannot tail-cut lifecycle rows
136 mixed recovery hook wire preserves compact counts under metadata and lifecycle pressure
153 R2 joined installed dispatcher exposes all capability models and both active work units without manual work-unit id
164 R3 oversize Hook-input manifest fails closed instead of claiming a complete carrier
165 R3 unsafe Hook-input carrier directory fails closed without following symlinks
167 R3F03 installed dispatcher keeps twenty-four-model carriers complete and fails oversized Hook input closed
168 R3F03 fresh install exposes parallel work-unit context, accepted-only unlock, missing UNKNOWN, and conflicts
```

其中多数是旧测试仍硬编码 0.11 的 `Guidance[...]`、`remaining=N`、旧 instruction 文本或旧 lifecycle 行布局；按计划的 0.12 单一 Decision/aggregate carrier 语义，应迁移断言而不是把旧 Guidance 恢复回来。但在迁移完成前，全量回归不能宣称 PASS。

两类不能简单忽略：

1. F00 仍要求既有 push gate 的原有可识别文案；当前输出虽有人话且只拦截真实 push，但去掉了字面 `Harness push gate`，所以存在产品兼容性回归，至少需要恢复稳定标识或更新并明确批准该语义变更。
2. F01 的 modified fixture 仍替换旧 0.11 instruction 文字；由于当前 0.12 文本没有该 needle，测试没有真正修改 owned block，结果是 `UNINSTALLED` 而不是预期 `HOLD`。这是测试 fixture 失效，需改成针对当前 owned block 的真实修改后重跑零写断言。

oversize/unsafe capability 的失败则是旧测试把 completion carrier 的 `complete=true` 误当成 capability carrier 完整；应把断言定位到 `CapabilityCarrier：complete=false` / `modelsComplete=false`。这属于测试迁移，但必须完成并保留负向证据。

## 最小返修与 owning unit

Owning unit：`F06 formal Hook / joined runtime integration and migration`。

最小返修顺序：

1. 先决定 F00 的稳定 push gate 标识：若产品语义不变，恢复兼容标识；若确实改名，更新受控断言并记录批准的语义变更。
2. 将仍依赖 0.11 Guidance/旧 carrier 布局的测试改为验证 0.12 单一 Decision、aggregate carrier、ref/readApi/digest/count，以及相同的风险与 accepted-only 语义。
3. 修正 F01 modified fixture，使其确实改写当前 owned instruction block；修正 R3 capability 断言只读取 capability carrier 完整性。
4. 重跑全量；只有 `0 fail`（允许明确、与本版无关的既有 skip）后，F06 才能进入 PASS 评估。

R7 的载荷实现本身可以作为返修基线保留；本报告不授权后续开发、安装、push、tag、release 或 deploy。
