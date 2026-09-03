# HL12F08 独立产品复核 R30

结论：**FAIL**。

本复核未参与 F07 实现，只读检查了 HL12 计划/leaf、R30 writer report、当前源码、唯一 retained candidate，并运行了安全的临时回归。没有真实安装、全局写入、push/tag/release/deploy，也没有触碰宿主进程。临时目录由测试自行创建并清理；本报告是唯一新增持久复核输出。

## 直接核对的 candidate

当前唯一 0.12 candidate：

`docs/harness/artifacts/harness-lite-0.12.0-bf65fbae6d51f279031bf750238318a122a62b0afd89842719eace5e124cf983.json`

- 现场 `sha256sum`：`sha256:bf65fbae6d51f279031bf750238318a122a62b0afd89842719eace5e124cf983`
- bytes：`1,506,142`
- files：`55`
- product JavaScript：`14`
- behavior 中声明的 candidateDigest、bytes 与现场一致。
- 独立读取 candidate 后，55 个文件的 base64 解码长度和逐文件 SHA 全部一致；candidate kind/version 正确。

`HL12_F07_ARTIFACT=<上述 candidate> node --test test/hl12-f07-candidate.test.js`：3 pass / 0 fail / 0 skip。该测试覆盖双 build、物化 0.12 install/runtime identity、retained 0.11 显式升级以及 uninstall 后用户字节恢复。

## CEX 双向路径和三个保证

命令：

`node --test test/hl12-f00-counterexamples.test.js`

结果：13 pass / 0 fail / 0 skip。其中 CEX-01 至 CEX-06 的六个坏路径和六个正常正例均通过；另有 F00 hard-risk freeze 通过。

这些结果支持：global-root 边界、current runtime tamper、ghost unit、multi-runnable package、stale capability、upgrade/uninstall residue 的正式路径目前没有复现旧反例；普通项目、健康 runtime、合法 unit、single runnable、动态 capability 和正常 uninstall 没有被关闭。

F01–F06/candidate 定向合计为 43 pass / 0 fail / 0 skip。完整 `npm test` 现场结果为 199 pass / 0 fail / 1 skip；唯一 skip 是 `R3F03 active indexes point to the existing R3 current leaf...`，原因是 source candidate 不包含本地 lifecycle documents。该项虽为既有 scope skip，但计划明确要求 materialized candidate/lifecycle 必需矩阵不得 skip，因此不能把它算成最终 PASS。

## 正式 caller 与 materialized candidate

直接读到的正式接线包括：

- `hooks/dispatcher.js` 的 SessionStart、UserPromptSubmit、Stop、PreToolUse 正式事件入口；
- `lib/hook.js` 的单一 decision、completion/work-unit/capability carrier、push gate 和 UNKNOWN 降级；
- `bin/hl.js` 的内部接口；
- `lib/install.js` 的 0.12 identity、upgrade、rollback、uninstall 接线。

candidate 物化后的 install/identity/upgrade/uninstall 由上述 3 个 F07 candidate 测试直接覆盖，且通过。没有做真实全局安装，符合本 leaf 禁止触碰全局/宿主的边界。

## 行为 A/B 证据

当前 `docs/harness/artifacts/harness-lite-0.12.0-behavior.json` 有 96 samples、32 cells、8 个 canonical scenarios，但：

- behavior status 是 `UNKNOWN`；
- 没有 `harness-lite-0.12.0-invocation-ledger.json`；
- 没有 `harness-lite-0.12.0-attestation.json`；
- retained blind receipts 仍是旧格式，不能证明 R30 合同下的独立 observations；
- R30 report 明确没有 fresh 96，也没有真实 attestation。

因此无法证明真实双模型 A/B、96 个成功调用、盲评 receipts、parity 或关键场景门槛。计划第七节和 HL12F08 的“没有未证明必需结果”条件未满足。

## Attestation 设计的独立对抗结论

当前 scorer 已要求 Ed25519 `crypto.verify`，公钥通过工作区外的 `HL12_F07_ATTEST_PUBKEY` 注入，并绑定 candidate/behavior/ledger/receipts/scorer digest。这比单纯自报 SHA 更严格。

但是现场没有可信的、预先注册的 reviewer 公钥或真实签名。现有回归测试使用临时生成的 key，只能证明签名算法连通，不能证明 reviewer 身份或真实模型调用。

本复核此前在 R24/R25 对无签名版本已复现“零模型调用、自造 ledger/receipts/attestation 得到 PASS”。R27 之后该具体后门被签名验证挡住，但如果调用者可以自行生成 key、设置 `HL12_F07_ATTEST_PUBKEY` 并用对应私钥签名，当前接口仍只能证明“签名匹配注入的 key”，不能证明 key 属于独立 reviewer。因此本次没有把临时 key 测试当作真实行为证据。

## 最小返修与 owning unit

返修 owner：**HL12F07（行为证据/attestation contract）**，不是 F01–F06 产品实现。

最小要求：

1. 由 F07 `reported_complete` 后，F08 在独立环境真实重跑 96-call A/B、盲评和 required counterexamples；
2. reviewer 公钥必须来自工作区/candidate 之外的可信注册来源，不能由同一次本地运行临时生成或自选；
3. 生成真实 external ledger、fresh receipts 和签名 attestation，并将它们按 candidate/behavior/scorer 全部 digest 绑定；
4. 修复上述 lifecycle candidate 的 1 个关键 scope skip，或给出不降低 DoD 的直接物化证据；
5. 重新运行 scorer、source/materialized 矩阵和本独立复核，不能用当前 96 摘要、writer report、绿测数量或 candidate digest 代替。

在这些证据出现前，F07 不能 accepted，HL12 stage/leaf 不能 closeout，也不能启动 0.13 或任何发布动作。

