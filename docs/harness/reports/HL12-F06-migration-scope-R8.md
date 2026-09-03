# Harness Lite 0.12 HL12F06 迁移范围授权 R8

日期：2026-09-02（Asia/Shanghai）

## 背景

F06 的正式 Hook 已切换到 0.12 的单一 `Decision`、完整 carrier 和有界上下文合同。
当前全量 suite 仍有一组旧 0.10/0.11、R2/R3 wire 断言；其中有些把废弃的
`Guidance[...]`、`remaining=N` 或任意 `complete=true` 当成产品合同。继续保留这些旧断言会
把已经明确删除的行为误当回归，但直接删掉测试也不接受。

## 本次授权

授权 F06 owning child 在不改变产品目标、不放宽安全断言的前提下，做**机械的 0.12
fixture/断言迁移**，并同时补齐正式 Hook 的 carrier 保真检查。允许新增或修改的迁移测试面为：

- `test/fix01-guidance-runtime.test.js`
- `test/fix03-joined-runtime.test.js`
- `test/hl12-f00-counterexamples.test.js`
- `test/hl12-f01-install-ownership.test.js`
- `test/nv02-capabilities.test.js`
- `test/nv03-hook-work.test.js`
- `test/nv04-recovery.test.js`
- `test/r2-joined-runtime.test.js`
- `test/r3-capability-carrier.test.js`
- `test/r3-joined-runtime.test.js`

迁移只能把旧断言改成当前 0.12 已冻结的语义，例如单一 `Decision`、完整/不完整 carrier、
真实 `complete`、有界上下文和 0.12 instruction；不得恢复旧 fragments、伪造
`remaining=N`、放宽 ghost/tamper/push/uninstall 安全断言、删测试或新增 scope skip。

## 产品返修要求

1. aggregate work-unit digest 必须继续等于 `tree.workUnitPackages()` 返回的完整 package 投影的
   稳定 canonical digest，并让读取者能辨认实际 unit 身份/count/ref/readApi；
2. `ParallelWorkUnitsCarrier`、`CompletionCarrier` 及任何单 unit 必需任务包不得经过普通
   `...`/`…` 或最终 `slice()` 静默截断；放不下时必须明确 external/incomplete 并保留可重算的
   digest、count、sentinel；
3. 0.12 正式 source 和 installed dispatcher 的 SessionStart/UserPromptSubmit/Stop/PreToolUse
   行为、六个 CEX、三个新增保证及旧 official 0.9/0.10/0.11 migration 继续重放；普通路径
   不增加命令、确认或全局停点。

本授权不改变 F06 的产品 owner，不允许真实安装、全局配置、push/tag/release/deploy，也不允许
干扰 Poracode、watchdog 或 bridge。完成后仍须由主代理独立验收并由未参与实现的 reviewer
重新复核；R8 任何关键失败都继续返回最小 owning unit。
