# Harness Lite 0.12 HL12F06 supervisor review R14

日期：2026-09-02（Asia/Shanghai）  
work unit：`HL12F06 — joined integration and migration`  
复核对象：R14 当前工作树；writer report `HL12-F06-writer-report-R14.md`  
当前 `lib/hook.js` SHA-256：`sha256:c2eb53c7d34c9b5106f7a3cc25a1fd835acaa2f11caee05e412ae45575689486`

## 结论

**FAIL，返回同一 owning unit 继续 R15。**

R14 确实修复了 R13 的主要丢字段问题：在 2、4、8 个全 runnable 场景中，source 和
installed dispatcher 都能看到 `ParallelWorkUnits：` 和
`acceptedOnlyUnlock=true`，aggregate package carrier、capability 和 1800 字符预算也
仍在。可是压力版 header 的 `active` 计数在混合状态下不诚实。

## 决定性问题：混合 active+runnable 时把总包数冒充 active 数

主管构造 4 个 unit（2 个 `active`、2 个 `rejected`/runnable）以及 8 个 unit（2 个
`active`、6 个 runnable），调用正式 `hook.sessionStart()`，再通过临时 installed
dispatcher 重放。内部 `work.parallelWorkUnitContext()` 的事实是：

```text
active.length=2；runningCount=2；activeCount=4/8；runnable.length=2/6
```

但 R14 在 `pressuredWire` 分支重写 header 时使用了 `parallelContext.activeCount`，正式
输出变成：

```text
ParallelWorkUnits：state=known；status=complete；complete=complete；active=4；runnable=2；acceptedOnlyUnlock=true
ParallelWorkUnits：state=known；status=complete；complete=complete；active=8；runnable=6；acceptedOnlyUnlock=true
```

这里的 `activeCount` 是 aggregate package 数，不是正在运行的 active 数；正常（非压力）
header 使用的却是 `runningCount`/`active.length`。因此同一语义在压力路径发生了可观测
漂移，模型可能误以为 8 个任务都在运行，错误地选择等待、串行或介入。这个问题不是
增加管制，而是恢复已经存在的真实状态字段；F03/F06 要求的 accepted-only 和依赖感知
不能靠错误数字表达。

source 和 installed 两条正式 caller 都复现该错误；上下文长度分别仍低于 1800，不能以
预算不足解释。

## 已独立核对

- R13 缺失的并行状态头已出现，`acceptedOnlyUnlock=true` 已出现。
- aggregate carrier 的完整 digest/ref/readApi/count/sentinel 保持；合法 dynamic capability
  在全 runnable 和混合场景保持。
- `node --check`、F00-F06 52/52、F06 9/9、`npm test` 176/175/0/1 可复现；这些绿测没有
  混合 active+runnable 压力计数断言。
- 未做真实全局安装、未修改真实全局配置、未 push/tag/release/deploy、未启动 F07，也未
  干扰 Poracode/watchdog/bridge。

## R15 最小返修要求

1. 压力 header 的 `active` 必须使用真实运行数（`runningCount` 或 `active.length`），
   `runnable` 使用真实 runnable 数；保留 `state/status/complete/acceptedOnlyUnlock`。
2. 增加至少一个正式 source 和 installed dispatcher 的混合场景回归（例如 active=2、
   runnable=6），直接断言 `active=2`、`runnable=6`；不得只测 helper 或全 runnable 的
   巧合值。
3. 保留 R14 已通过的 header、aggregate carrier、dynamic capability、预算和所有历史
   CEX/迁移回归；不删除测试、不加 skip、不增加普通工作确认或新的授权系统。

F07/F08 在 R15 主管重新 PASS 前不得启动。
