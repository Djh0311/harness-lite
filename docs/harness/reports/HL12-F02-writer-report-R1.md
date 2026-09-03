# HL12F02 writer repair report R1 — degraded push parity

状态：`reported_complete`，等待主管独立读回、重放和 acceptance。本报告不宣布 `accepted`，不表示 HL12F02 以外的 work unit、0.12 candidate 或整个 HL12 已完成。

## 1. 返修来源与范围

- 返修依据：`HL12-F02-supervisor-acceptance-FAIL-R0.md`；读回 SHA-256 为 `f69a767628e6c681f5b62b97a21b05954b3d850a4bb0efd96c2a5fa0768d61e8`，本次没有覆盖或修改该报告。
- R0 决定性问题是 identity UNKNOWN 路径另有一份简化 push classifier：漏掉 `env` 带参数选项之后的 assignment，又把当前权威不命中的 `sudo -- git push` 算成 push。
- 本次只返修 HL12F02。没有开始 F03–F07，没有修改 `lib/hook.js`、`lib/install.js`、CLI/public Hook 接线、work-unit、capability、guidance、package/version/candidate、lifecycle/delegation 或 retained artifacts。

## 2. 产品修复事实

- `hooks/dispatcher.js` 的降级 classifier 现在复制当前唯一权威 `lib/hook.js` 中完整的 `shellSegments`、`tokens` 和 `classifyPush`，包括 `cd` chain、`command`/`exec`、`sudo`、`env` option/argument/post-option assignment、shell wrapper、command substitution、Git option 和 `--no-verify` 语义。
- 三个函数的 `Function.prototype.toString()` 在测试中逐字符相等；这不是单向样例匹配，而是当前两个完整实现的双向结构 parity contract。若以后只改权威或只改 bootstrap，测试立即失败。F06 仍负责把最终公共接线收敛到计划指定的单一来源。
- dispatcher 在 external anchor 和 runtime identity 核对之前仍然只加载 Node built-ins，没有提前 `require('../lib/hook.js')`。只有 identity trusted 后才加载产品 Hook；identity UNKNOWN 使用经过 parity 固定的 bootstrap copy。
- identity UNKNOWN 的行为没有扩大风险种类：当前权威 truthy 的 push 才 deny；权威 falsy 的普通 Bash 仍 stdout/stderr 为空、exit 0。native pre-push 和 push assertion 继续 fail closed。

## 3. 双向语料与正式 installed-tamper 证据

`test/hl12-f02-runtime-anchor.test.js` 新增 32 条冻结语料：

- 24 条当前权威 truthy：direct/absolute Git、leading assignment、`command`、`exec`、`sudo`、`env` assignment、`env -u/--unset/-C/--chdir` 的 option argument 加 post-option assignment、`sudo env`、bash/sh/zsh/eval wrapper、两种 command substitution、`cd` chain、Git global option、`--no-verify`。
- 8 条当前权威 falsy：`env -S` 只有 split-string argument、`sudo -- git push`，以及普通 echo/test/rm/printf、`git status`、普通 `cd` chain。

测试先逐条断言 authoritative truth，再直接断言 bootstrap truthiness 等于 authoritative truthiness。随后 fresh install 到 disposable project，coherent 修改 installed `lib/hook.js` 并同步修改内部 `ownership.json` package digest，使 source/installed verify 都进入 identity UNKNOWN，再通过正式 installed `hooks/dispatcher.js` 重放全部 32 条命令字符串（字符串只作为 Hook JSON 输入，未被 shell 执行）：

- 24/24 authoritative truthy 都返回 `permissionDecision=deny`、exit 0；
- 8/8 authoritative falsy 都 stdout/stderr 空、exit 0；
- R0 的 `env -u OLD X=1 ...`、`env --unset OLD X=1 ...`、`env -C /tmp X=1 ...`、`sudo env -u OLD X=1 ...` 全部 deny；反向漂移 `sudo -- git push ...` 保持空输出；
- tampered `lib/hook.js` 的 load sentinel 从未出现；native pre-push 与 push assertion 都 exit 1；
- 所有降级调用前后的整个 target snapshot 逐字节一致，因此 usage、push ledger、host observation、extension ledger 和其他 target 文件均为零写。

## 4. 原 F02 合同回归

- External anchor、manifest-only ownership forgery、anchor missing/modified/symlink/wrong target/wrong package 均继续按 R0 证据拒绝或零写 `HOLD`。
- Fresh/project/managed、official 0.9/0.10/0.11 upgrade、rollback identity 和精确 uninstall 均继续通过。
- 新 receipt 仍不保存完整用户 instruction bytes；anchor install/upgrade/uninstall/extension fault transaction 仍回到完整 preimage。
- F00 的 CEX-02 坏例与正常正例都是绿；CEX-01/CEX-06 及各自正例仍绿。F00 剩余三个红例精确是后续 F03/F04 owning 的 CEX-03、CEX-04、CEX-05。

## 5. 正式 caller 读回

- Formal Codex Hook：`hooks/dispatcher.js::main` 先调用同文件 `bootstrapVerify`；失败才进入 `identityDegraded`，后者消费本次 parity 固定的 `classifyPush`，成功后才加载 `../lib/hook.js`。
- Native pre-push 与 push assertion：同一 `main` 在各自分支先调用 `bootstrapVerify`，identity UNKNOWN 直接 fail closed，不加载未核实 Hook。
- Source/installed verify、external anchor、ownership/rollback binding 的 caller 保持 R0 实现不变；本次没有绕开或改写这些入口。

## 6. 命令与结果

所有权威测试命令从进程启动起使用 `/tmp/hl12-f02-r1-*-home` 形式的 synthetic `HOME/CODEX_HOME`；F02 测试又在产品模块加载前建立自己的 synthetic `CODEX_HOME`。所有安装、升级、tamper 和 uninstall target 都是 test 创建的 disposable root。

- `node --check lib/install.js && node --check hooks/dispatcher.js && node --check test/hl12-f02-runtime-anchor.test.js`：exit 0。
- `node --test test/hl12-f02-runtime-anchor.test.js`：7 tests / 7 pass / 0 fail / 0 skip。
- `node --test --test-name-pattern='CEX-02' test/hl12-f00-counterexamples.test.js`：2 tests / 2 pass / 0 fail / 0 skip。
- `node --test test/hl12-f00-counterexamples.test.js`：exit 1；13 tests / 10 pass / 3 fail / 0 skip；失败只为计划内 CEX-03/CEX-04/CEX-05 known-red。
- `node --test test/nv05-integration.test.js test/hl11-event-upgrade.test.js test/hl12-f01-install-ownership.test.js`：22 tests / 22 pass / 0 fail / 0 skip。
- 枚举 `test/*.test.js` 并只排除故意保留三个后续 known-red 的 `test/hl12-f00-counterexamples.test.js` 后执行 `node --test`：137 tests / 136 pass / 0 fail / 1 skip。
- 唯一 skip 是既有 `R3F03 active indexes point to the existing R3 current leaf...`，理由为 `source candidate does not include local lifecycle documents`；本次没有新增条件 skip。

## 7. 实际改动与 SHA-256

R1 实际改动：

| 文件 | R1 用途 | SHA-256 |
|---|---|---|
| `hooks/dispatcher.js` | 完整权威 push classifier bootstrap copy；导出 parity probes | `9db94a9904696e9bf1a88b9000805a5fd2fd5eda7f6d3b0308246fd911dde15b` |
| `test/hl12-f02-runtime-anchor.test.js` | 结构 parity、32 条双向 corpus、正式 tampered dispatcher 全量重放与 target 零写快照 | `6e74d7458fb2295e5c8aa9f5cf91ce4bef2011f99923a4420a240b5013358f4e` |
| `docs/harness/reports/HL12-F02-writer-report-R1.md` | 本返修报告 | 报告完成后由主管直接读回计算 |

F02 累计但 R1 未修改：`lib/install.js` 仍为 `f8dd95afd07eb815ead0d3d23c2291499e7ef5f4f116f71209ce211790b7fff6`。

Retained artifacts 未写：0.11 仍为 `8e14e641b7d0fe3641a5e74c49b11a60761e0dc63fb75866ff8226e6b3687ae5`；0.10 仍为 `d73f4b4f83e6034e33168995c24ca4514d69bcd70ccc19f8aa255da42d218daa`。

## 8. UNKNOWN、边界与清理

- 产品版本仍是 0.11.0；F02 没有 F07 的 version/candidate 权限。本报告只证明当前 F02 行为和返修语义，不声明 0.12 candidate identity。
- 没有真实 install、push、tag、release、deploy 或宿主 E2E；命令 corpus 未被执行，只作为 dispatcher 的 JSON 输入。
- 当前 threat boundary 与 R0 相同：不宣称抵抗同一权限主体同时改写 runtime、external anchor、dispatcher/verifier 和宿主配置。
- 测试 `test.after` 对每个 disposable root 做 type/path 核对后精确删除；外层 synthetic HOME 路径执行前后均验证不存在。完成时 `/tmp` 中没有 `hl12-f02-*` 或 `hl12-f02-r1-*` 遗留。
- 本轮从第一条 probe 起均使用 synthetic HOME 或只读取仓库内文件；没有读取或写入真实 `/home/synadmin/.codex`，没有操作或干扰 Poracode、watchdog、bridge 等宿主进程。

