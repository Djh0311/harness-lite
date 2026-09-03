# Harness Lite 0.12 HL12F03 supervisor acceptance

日期：2026-09-02  
work unit：`HL12F03 — work-unit truth and multi-runnable packages`  
结论：`PASS / ACCEPTED`

## 主管决定

主管直接读回 F03 产品改动、专用测试、fixture 迁移和 writer report，并在独立 synthetic/disposable 环境重放关键路径后，决定 `HL12F03 accepted`。

本决定只覆盖 work-unit membership、accepted-only dependency 和 multi-runnable package carrier；不接受 F04/F05/F06/F07/F08，也不表示 0.12 candidate 或发布已经完成。

writer 的最后协作回合因额度耗尽退出，但实现文件与报告已经完整落盘；本 PASS 不依赖该回合的自报数字。

## 直接反例与正常路径

- 没有 Work Unit 声明的普通 leaf：`tree.workUnitPackage(root, null)` 仍为 `leaf-fallback`、`dispatchReady=true`，普通工作不被卡住。
- 对未声明的 `A/GHOST99` 请求：package 为 `UNKNOWN / undeclared-work-unit / dispatchReady=false`，不继承 leaf 目标或完成标准。
- ghost `active`、`reported_complete`、`accepted`、`heartbeat` 全部返回 `HOLD / wrote=false`；ledger 文件不存在或前后字节完全相同，ghost 不进入有效 summary，也不解锁依赖。
- 旧 ledger 中已有 ghost accepted 行时，原字节仍可读，但 ghost 不进入 accepted/units，依赖显示 `UNKNOWN/accepted=false`；后续 ghost 新写仍被拒绝。
- 已声明 unit 的 `active -> reported_complete -> accepted` 继续可用；只有带 evidenceRef 的 accepted 才解锁 dependent。
- 两个 runnable unit 的 source Hook 和 disposable installed formal dispatcher 都携带两个完整嵌套 package，包含各自 goal、全部 completion standards、边界、事实、入口、路线、依赖、写面、result contract 和 source；没有 `UNKNOWN/leaf-fallback`。
- 一个 active 加两个 runnable 时，carrier 同时含三份完整 package，并把 `runningCount=1` 与 `packageCount=3` 分开，未把 runnable 冒充正在运行。

另做了一个边界 probe：一个 active 加一个 runnable 不会伪造“多个 runnable”状态，仍只呈现当前 active；这与本 unit 的“两个及以上 runnable”合同一致，F06 负责最终公共接线语义。

## 独立测试结果

- F03 专测：5 tests / 5 pass / 0 fail / 0 skip。
- F00 CEX-03/CEX-04 双向：4 tests / 4 pass / 0 fail / 0 skip。
- tree/delegation/work/parallel/joined/recovery 定向回归：76 tests / 75 pass / 0 fail / 1 既有 scope skip。
- F01/F02/upgrade/integration 与 F03 交叉回归：34 tests / 34 pass / 0 fail / 0 skip。
- 全部 source tests，排除故意留给 F04 的 `test/hl12-f00-counterexamples.test.js`：142 tests / 141 pass / 0 fail / 1 既有 `R3F03` lifecycle scope skip。
- F00 全文件：13 tests / 12 pass / 1 fail；唯一失败是 F04 owning 的 CEX-05 stale capability，CEX-01、CEX-02、CEX-03、CEX-04、CEX-06、六个正常正例和 hard-risk freeze 均通过。
- `node --check` 对 F03 三个产品模块、专测和 fixture helper 全部通过。
- 所有本轮 supervisor 临时目录已精确清理；没有 `hl12-f03-*` 或 `hl12-supervisor-f03-*` 遗留。

## 实际读回 SHA-256

| 文件 | SHA-256 |
|---|---|
| `lib/tree.js` | `6e0c9d999598c24cc65cd428f62df62c283c8649b3110cadf8c235ebe5cc4a58` |
| `lib/work.js` | `7c58e6fb7c74c351c354bd72bf7628576cf00af0fd330f0d772d06bb666ffeaf` |
| `lib/delegation.js` | `8ebef24c7ffcd361e92939c6b9f69b0124fb79c5a0784761621a9c824ccedf61` |
| `test/hl12-f03-work-unit-truth.test.js` | `16f0586cd40952c5f8f076c146852caf100ad34a7ce2f53b8357b9c02ffc863c` |
| `test/fixtures/work-unit-declarations.js` | `c865e573603327c1acf095582d202547e2cfb7421611fc9015c8a24ec62332f4` |
| `docs/harness/reports/HL12-F03-writer-report.md` | `9db07aaccee132fd8af39cce3c5b181d5e7ebaa0b5ab22dc2bc8cbf13a961dfd` |

旧 fixture 的六个文件只增加原测试已经使用的 synthetic Work Unit 声明和 helper import；未删除、放宽或 skip 任何断言。retained 0.10/0.11 artifact 保持原 SHA，F03 未修改 `lib/hook.js`、capability、guidance、install/dispatcher、版本或 candidate。

## 后续交接与边界

F03 为了不让旧 fixture 掩盖 membership 合同，采用了 fixture-only 机械迁移，不增加产品 legacy 例外。F06 仍需把最终公共 Hook 的 `activeCount`/package carrier 接线收敛为清晰的单一语义，并在不扩大严格度的情况下重放 joined matrix。

本轮没有真实 install、push、tag、release、deploy，没有读取或写入真实 `/home/synadmin/.codex` 配置，也没有操作 Poracode、watchdog、bridge。
