# Harness Lite 0.12 HL12F06 supervisor acceptance PASS R16

日期：2026-09-02（Asia/Shanghai）  
work unit：`HL12F06 — joined integration and migration`  
复核对象：R16 当前工作树；writer report `HL12-F06-writer-report-R16.md`  
当前 `lib/hook.js` SHA-256：`sha256:f5529f912cc51465da8d77f3af70cb473cbbb7ee715ae1c7284d0aa20bb23206`  
当前 `test/hl12-f06-joined.test.js` SHA-256：`sha256:15c7226eff352cad3f47e9eefafe064494964ef9d52870d781f0e42525cc38cd`

## 结论

**PASS，接受 HL12F06；F07 才可以在新的明确启动记录后开始。**

R16 保留了 R13/R14 已修复的正式并行状态和 capability 载荷，并补齐了 R14 要求的
source + installed 混合回归。R15 的真实运行数修复也已在正式 caller 中核对：压力路径
不再把 aggregate package 数冒充 active 数。

## 主管直接验收证据

### 1. 正式 source 与 installed 混合路径

主管独立构造 2 个 active、6 个 runnable 的临时 project，直接调用
`hook.sessionStart()`，再用 `install.install(..., {write:true})` 和临时
`.claude/harness-lite/hooks/dispatcher.js` 重放。两条路径均输出：

```text
ParallelWorkUnits：state=known；status=complete；complete=complete；active=2；runnable=6；acceptedOnlyUnlock=true
ParallelWorkUnitsCarrier：...count=8；...readApi=tree.workUnitPackages；digest=sha256:<完整64位摘要>；sentinel...
```

fixture 测试直接断言上述字段；没有只测 helper 或只测全 runnable 巧合值。

### 2. 多种 active/runnable 和长任务包

主管重新构造并重放 2/3/4/8 package 组合（含 2 active + 6 runnable、8 个长完成标准）：

- source 和 installed 的状态头都保留真实 `active`、`runnable` 和
  `acceptedOnlyUnlock=true`；
- aggregate carrier 的 `count`、安全项目内 `ref`、`readApi`、完整 canonical package
  digest、首/中/尾 sentinel 均存在；digest 可由
  `work.parallelWorkUnitContext().units.map(unit => unit.package)` 独立重算，四组均一致；
- 所有 context 均不超过 1800 字符；长标准不会以普通 `...`/`…` 冒充完整；
- 合法当前 Hook capability manifest 在 source/installed 及压力路径均保留
  `Capabilities`/`CapabilityCarrier`，不把 UNKNOWN 静默变成 known，也没有增加普通工作确认。

### 3. 回归矩阵

- `node --check`：`lib/**`、`bin/**`、`hooks/**` 全部通过。
- F00-F06 独立矩阵：53 tests / 53 pass / 0 fail。
- F06 定向：10 pass / 0 fail。
- `npm test`：177 tests / 176 pass / 0 fail / 1 个既有 scope skip。
- 六个 CEX 与六个正常正例均在矩阵中通过；F01/F02 migration、uninstall、tamper、
  dynamic capability、accepted-only dependency 和 push gate 既有回归没有回退。

## 范围与历史

- R13、R14、R15 的 FAIL 报告和 ledger 事件保留；本 PASS 只接受 R16 当前结果，不抹掉失败
  历史，也不把 writer 自报完成当作主管验收。
- 只改动允许的 Hook/test/report/lifecycle 面；没有真实全局安装、没有改写真实全局
  `AGENTS.md`、没有 push/tag/release/deploy、没有生成 0.12 candidate、没有启动行为 A/B。
- 没有杀死、重启或干扰 Poracode、watchdog、bridge 等宿主进程。

## 后续边界

HL12F06 接线已接受；按照 leaf 顺序，后续只能在单独的 F07 启动记录后进行版本 0.12.0、
真实模型 A/B、双构建和物化 candidate。F08 独立产品复核仍未开始；本报告不代表 candidate
或 release PASS。
