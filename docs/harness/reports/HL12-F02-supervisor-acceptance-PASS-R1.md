# Harness Lite 0.12 HL12F02 supervisor acceptance R1

日期：2026-09-02  
work unit：`HL12F02 — runtime trust anchor and degradation`  
结论：`PASS / ACCEPTED`

## 主管决定

R0 的决定性反例已经修复，主管独立读回实现、重放正式 installed coherent-tamper 路径并重跑相关回归后，决定 `HL12F02 accepted`。

本决定只接受 F02：外部安装锚、runtime identity 核对、identity UNKNOWN 降级和相应事务边界。它不接受 F03–F08，不表示 0.12 candidate、发布或真实安装已经完成。

## R0 反例独立重放

主管在 synthetic HOME 与 disposable project 中 fresh install 当前 source，修改 installed `lib/hook.js`，同步修改内部 `ownership.json` 的 package digest，使内部 runtime + manifest coherent、但外部 installation anchor 不匹配。source `verify06` 明确为 `false`，然后直接调用正式 installed `hooks/dispatcher.js`，命令只作为 Hook JSON 输入，没有交给 shell 执行。

结果：

- `env -u OLD X=1 git push origin HEAD:refs/heads/main`：权威命中，dispatcher deny；
- `env --unset OLD X=1 git push origin HEAD:refs/heads/main`：权威命中，dispatcher deny；
- `env -C /tmp X=1 git push origin HEAD:refs/heads/main`：权威命中，dispatcher deny；
- `sudo env -u OLD X=1 git push origin HEAD:refs/heads/main`：权威命中，dispatcher deny；
- `sudo -- git push origin HEAD:refs/heads/main`：当前权威不命中，dispatcher 保持 stdout 为空、exit 0，没有扩大既有硬风险。

R1 同时冻结 `shellSegments`、`tokens`、`classifyPush` 三个完整函数的结构 parity，以及 24 个当前权威命中和 8 个当前权威不命中的双向 corpus。identity UNKNOWN 仍在加载未核实产品 Hook 前完成检查；普通 Bash 不写 target 状态，native pre-push 与 push assertion 继续 fail closed。

## 独立测试结果

- 语法检查：`hooks/dispatcher.js` 与 `test/hl12-f02-runtime-anchor.test.js` 均 exit 0。
- F02 专测：7 tests / 7 pass / 0 fail / 0 skip。
- F00 CEX-02 双向：2 tests / 2 pass / 0 fail / 0 skip。
- F01、升级与相关安装回归：22 tests / 22 pass / 0 fail / 0 skip。
- source suite 排除故意保留给后续 owning unit 的 F00 counterexample 文件：137 tests / 136 pass / 0 fail / 1 个既有 scope skip。
- F00 全文件：13 tests / 10 pass / 精确 3 个计划内 known-red；只剩 CEX-03 幽灵 work unit、CEX-04 多 runnable carrier、CEX-05 静态 capability，分别由后续 F03/F04 修复。
- 所有 supervisor 临时目录均已精确清理；未发现 `hl12-f02-*`、`hl12-f02-r1-*` 或 `hl12-supervisor-f02-*` 遗留。

## 读回身份

- `lib/install.js`：`f8dd95afd07eb815ead0d3d23c2291499e7ef5f4f116f71209ce211790b7fff6`
- `hooks/dispatcher.js`：`9db94a9904696e9bf1a88b9000805a5fd2fd5eda7f6d3b0308246fd911dde15b`
- `test/hl12-f02-runtime-anchor.test.js`：`6e74d7458fb2295e5c8aa9f5cf91ce4bef2011f99923a4420a240b5013358f4e`
- writer R1 report：`48bb8ecfe8a1f6fe920743b1483a94e9d736e3cc34c031214b62f289b494b570`
- supervisor R0 FAIL report 保持：`f69a767628e6c681f5b62b97a21b05954b3d850a4bb0efd96c2a5fa0768d61e8`
- retained 0.11 保持：`8e14e641b7d0fe3641a5e74c49b11a60761e0dc63fb75866ff8226e6b3687ae5`
- retained 0.10 保持：`d73f4b4f83e6034e33168995c24ca4514d69bcd70ccc19f8aa255da42d218daa`

## 后续交接

F02 为了在核实 identity 前不加载未核实模块，bootstrap 中仍有一份与当前权威逐字符相同、由 parity 测试锁住的 hard-risk classifier。F06 必须在不破坏“先核身份、后加载产品模块”的前提下，把最终公共运行接线收敛到计划要求的单一可信来源；这不是把新风险加进清单。

F06 还必须处理已知的公共 CLI pre-read 边界和 `status --json` 截断/非法 JSON；本次 F02 acceptance 不提前接受这两项。

本轮没有真实全局安装，没有执行真实 push，没有 tag、release、deploy，也没有操作 Poracode、watchdog 或 bridge。
