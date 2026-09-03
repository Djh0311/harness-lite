# Harness Lite 0.12 HL12F07 supervisor review R6

结论：FAIL，返修。

## 已独立确认的部分

用 retained 0.11 candidate
`8e14e641b7d0fe3641a5e74c49b11a60761e0dc63fb75866ff8226e6b3687ae5`
和本轮 0.12 candidate
`f728ce1057f935451a17fe45d5b964540611ef168461778864b392ed434341e8`
在一次性临时项目中直接重放：

```text
0.11 install                         INSTALLED
0.12 inspect before upgrade          previous-11-snapshot / ok=true
0.12 install without upgrade         HOLD / written=0
0.12 install with upgrade=true       INSTALLED
0.12 verify06                        ok=true
installed dispatcher --push-assert  exit=0
uninstall                            UNINSTALLED
user AGENTS.md + unrelated bytes    exact restored
old runtime / installation anchor   absent
rollback carrier                    absent
```

这说明 R5 的候选 runtime 路由修复在该手工路径上有效。

## 决定性缺口

当前 `test/hl12-f07-candidate.test.js` 仍只有两个测试：

1. candidate 双 build/物化 fresh install；
2. behavior artifact 的 UNKNOWN 形状。

没有正式测试把上面的迁移链固定下来，也没有在测试里核对：

- 物化 retained 0.11 的真实安装；
- 0.12 candidate 对同一目标的 `upgrade:false` 零写 HOLD；
- `upgrade:true` 后 manifest、installation anchor、`verify06` 和已安装 dispatcher 的共同 0.12 身份；
- uninstall 对用户文件的逐字节恢复，以及旧 instruction block、旧 runtime、anchor、rollback carrier 的清理。

因此 writer 报告中的 `F07 2 pass` 不能证明 F07 的迁移完成标准；这不是单纯测试数量问题，而是 candidate-only 修复可能再次与实际物化路径脱节的关键证据缺失。

## 必须返修

1. 在允许写面内加入正式 F07 migration regression（源码测试文件要能通过外部 artifact 路径在物化 candidate 中执行），使用 retained 0.11 和当前 retained 0.12，不复制或重写历史 artifact。
2. 测试同时断言无 upgrade HOLD 的 `written===0` 和升级后的完整 identity；不要只断言 `status=INSTALLED`。
3. 测试保存用户原始文件的原始字节，并在 uninstall 后逐字节比对；明确检查旧 0.11 instruction 内容、runtime、`.codex/harness-lite/installation.json` 和 rollback carrier 不残留。允许 Harness 自己的非用户控制面基线文件按现有合同保留，但不能把它们混入用户字节恢复结论。
4. 用最终 candidate 运行该测试和必要 source/materialized 矩阵，重新双 build；若行为仍无两个真实模型家族，只保持 UNKNOWN，不伪造 PASS。

在正式回归落地并由主管独立重跑前，F07 仍不能 accepted，也不能进入 F08。

