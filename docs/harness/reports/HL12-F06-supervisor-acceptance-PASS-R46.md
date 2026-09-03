# HL12 F06 supervisor acceptance PASS R46

status: accepted

本次只验收 R44 之后的 F06 接线，不改变产品代码，不真实安装到全局，不触碰
`/home/synadmin/.codex` 或 Poracode 宿主。

## 直接核对

- 新 candidate：`sha256:70e6699721e99612f666da21d7945fb8ad44e69c08a047cc9dbc92d17da92621`
- source 与物化 candidate 的正式 `SessionStart` 均重放两条路径：
  - 无 delegation ledger：两个已声明、无依赖、完成标准完整的 runnable unit
    都出现在 `ParallelWorkUnitsCarrier`，`count=2`、IDs=`A,B`，每个包含完整
    completion standards；没有 `UNKNOWN/leaf-fallback`。
  - ledger-backed：只写入 `A=rejected`、`B` 未登记，仍投影同样的两个完整包；
    没有把 rejected 当 accepted，也没有解锁依赖。
- 损坏 delegation carrier 不投影静态包，继续返回可识别的 UNKNOWN/fail-closed；
  普通单 runnable/leaf fallback 不回归。
- F03/F06/F07 定向测试 `26/26 PASS`；全量 source suite `210/210 PASS`、
  `0 fail`、`0 skip`。
- 两次 deterministic build 与 candidate 逐字节一致；旧 0.10/0.11 artifact、
  真实全局 `AGENTS.md` 均未改变。

## 结论

F06 R46 的正式接线和 R44 指定的两条 SessionStart 路径已由主管直接复核，
F06 可接受。F07 的新 candidate 行为评测另由 F07/F08 处理；本报告不把行为
评测或独立复核提前宣称为 PASS。
