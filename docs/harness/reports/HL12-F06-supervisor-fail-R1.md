# Harness Lite 0.12 HL12F06 supervisor review R1

日期：2026-09-02  
work unit：`HL12F06 — joined integration and migration`  
结论：`FAIL / 返回返修`

## 决定

F06 writer 已把单一 Decision 接入正式 Hook，但当前结果不能接受。主管独立复核发现：

1. 三个 active/runnable work unit 的正式 `SessionStart` 只输出
   `ParallelWorkUnitsCarrier：...remaining=3`，没有任一 unit 的 goal 或 completion standard；这重新产生了 F06 明确禁止的“只给 carrier、丢最小任务包”路径。
2. 很长的 current-leaf completion standards 在正式 Hook 中被 `...` 截断，而同一行仍声明 `complete=true;truncated=false`；模型会误以为已读完全部完成标准。
3. 全量回归仍有旧正式 caller 失败：当前 `npm test` 为 `171 tests / 164 pass / 6 fail / 1 skip`（其中 Guidance 旧 wire 断言和 capability oversize 的宽匹配断言暴露了迁移兼容边界）。writer 定向测试通过不能覆盖这些正式路径。

## 直接证据

- 三 unit disposable source probe：Hook context 919 字符；`U1/U2/U3` 的 unit 标识出现于 summary，但三个 `STD-1/STD-2/STD-3` 均不出现；输出只有 `ParallelWorkUnitsCarrier ... remaining=3`。
- 长 standards disposable source probe：Hook context 1333 字符；`CompletionCarrier` 含 `...`，`complete=true;truncated=false`，并非完整 carrier。
- 相关回归失败包括 `nv03-hook-work.test.js`、`r2-joined-runtime.test.js`、`r3-capability-carrier.test.js` 和 `r3-joined-runtime.test.js` 的正式 installed/source caller。

## 返修要求

- 正式 pre-dispatch Hook 必须让每一个 runnable/active unit 都能得到完整、可读取的最小任务包；数量或长度超过内联预算时，提供明确的安全项目内 carrier/ref、数量、摘要和完整性，不得只写 `remaining` 或 `UNKNOWN/leaf-fallback`。
- Completion carrier 只能在目标和全部 standards 确实可读时标记完整；预算不足要指向完整安全 carrier，并保留 digest、条目数、前/中/后 sentinel，禁止普通 `...` 截断后继续声称 complete。
- 重新跑正式 source、installed dispatcher、multi-runnable、capability、Stop/push/accepted/recovery、0.9/0.10/0.11 migration/uninstall 和全量回归；不能用删测试或放宽断言掩盖失败。

本次未做 candidate、真实安装、全局配置、push/tag/release/deploy，也未干扰 Poracode、watchdog 或 bridge。
