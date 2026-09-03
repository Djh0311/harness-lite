# Harness Lite 0.12 HL12F02 supervisor acceptance R0

日期：2026-09-02  
work unit：`HL12F02 — runtime trust anchor and degradation`  
结论：`FAIL / RETURN FOR REPAIR`

## 决定性反例

F02 的 external anchor、coherent-tamper 拒绝和普通降级路径都能重放，但 identity UNKNOWN 时使用了 `hooks/dispatcher.js` 内另一份简化 push classifier。它与当前硬风险权威 `lib/hook.js::classifyPush` 不等价，因此 Harness 自身损坏时反而可以绕过已经命中的 push 风险。

主管在 synthetic HOME、disposable project、正式 installed dispatcher 上直接执行：

`env -u OLD X=1 git push origin HEAD:refs/heads/main`

结果：

- 健康产品权威 `lib/hook.js::classifyPush`：识别为 push；
- runtime + internal manifest coherent tamper 后，source `verify06`：`false`；
- installed `hooks/dispatcher.js`：exit `0`、stdout 为空、没有 `permissionDecision=deny`。

同一差异还可由 `env --unset OLD X=1 ...`、`env -C /tmp X=1 ...`、`sudo env -u OLD X=1 ...` 重现。反方向也有差异：`sudo -- git push` 被 bootstrap 识别而当前权威不识别。

这直接违反冻结合同：identity UNKNOWN 可以停用受影响的 Harness 自动能力，但不得绕过已经命中的硬风险；同时同一硬风险语义不能出现两个会漂移的运行时来源。

## 已确认但不足以覆盖反例的结果

- F02 专测独立重跑 `6/6` PASS。
- CEX-02 双向独立重跑 `2/2` PASS。
- F00 当前为 `10` pass / `3` 后续 known-red。
- external anchor 位于 runtime 外，能绑定 manifest/ownership/rollback；dispatcher 在加载产品模块前验签；新 receipt 不再保存完整原 instruction bytes。
- 这些绿结果没有覆盖上述 degraded push parser 差异，不能授予 accepted。

## 返修要求

1. degraded dispatcher 对当前既有 push hard-risk 的命中集合必须与唯一权威完全一致，不能只补这一个字符串。
2. 至少加入 wrapper、`env` option + option argument + assignment、`sudo`、shell wrapper、command substitution、directory-changing chain、普通非 push 的双向 parity corpus。
3. 在 coherent tamper 的正式 installed dispatcher 上证明：权威命中的每个 push 都 deny；权威不命中的普通 Bash 都零输出、exit 0。
4. 不扩大硬风险类别，不加载未核实产品模块，不破坏现有 anchor/transaction/healthy 路径。
5. 修复后重跑 F02、CEX-02、F00、相关回归和 source suite，并提交 R1 writer report；不得覆盖本 R0。

所有主管 probe 均在 `/tmp/hl12-supervisor-f02-*` 和 synthetic HOME 内执行并已清理。writer 披露的早期真实 `~/.codex` metadata-only `realpath/stat` 不构成本次产品 FAIL 的原因；没有证据显示真实配置内容被读取或写入。
