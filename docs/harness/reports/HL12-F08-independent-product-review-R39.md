# HL12-F08 独立产品复核 R39

结论：**UNKNOWN，不能 accepted**。

本轮把三个结果分开：

1. **0.12 产品行为门槛：PASS**。16 个 0.12 cells 全部为 3/3，`candidateRubricGate=true`，严格对照也全部通过。
2. **真实行为证据的正式可信度：UNKNOWN**。receipt/ledger 绑定有效，但没有可信外部 F08 attestation/key，scored 只能保持 UNKNOWN。
3. **物化 candidate 全量测试：有真实 FAIL**。10 个失败全部是候选包内旧 0.11 测试把当前 0.12 runtime 当成 0.11 来断言；证据指向测试迁移/隔离缺口，不是新的产品运行时反例，但仍阻塞“物化 candidate 全部通过”的收口要求。

本轮没有修改产品、candidate、历史报告、真实 docs/harness 或全局配置；没有安装、发布、推送，也没有碰 Poracode、watchdog、bridge。没有生成或接受本地临时 attestation。所有物化测试目录和临时输出均已清理。

## 1. Candidate identity

当前唯一 0.12 candidate：

```text
docs/harness/artifacts/harness-lite-0.12.0-b556f36dc740031a878852e703425b09dd30352b8afc8fb37a2993343a16fc6a.json
sha256:b556f36dc740031a878852e703425b09dd30352b8afc8fb37a2993343a16fc6a
bytes=1,519,698
files=55
product JS=14
fileDigest=sha256:1a60d52c5c1339a1b2b453ac969b62c15dd0e4f4154e60cdbcf1836f05d4c403
productDigest=sha256:40f5b7168bd436c3d904a91044cbf06993ee3839f1e7825651f18724e22a9022
```

临时真实行为目录中的 candidate SHA、bytes、files 和两个 digest 与 retained candidate 一致。

用当前 source 连续 build 两次并与 retained candidate 比较，F07 candidate 测试结果为：

```text
3 pass / 0 fail / 0 skip
```

覆盖 deterministic build、candidate identity、物化 fresh install、retained 0.11 显式升级及 uninstall 字节恢复。

## 2. 真实行为 A/B

临时目录 `/tmp/hl12-real-eval-r38-OF02i6/` 的证据 SHA：

```text
behavior.json  9e4c1f741d121751e195dad5a8710db7652c3c029894c7fd460ad3e6ef3d64b7
ledger.json    7f6aa609441ba4b45421239e50693b3aef347dc30efc01a7b236909fa82cae59
receipts.json  cbecef6a6c0ca34a9f46d0e42315534de40035d0d73885d2cb89b8932a69aa0a
scored.json    4e5dbe0ee6bbf378dca9932e5b6ce6845a04770bd4961eef7db5ea211b171647
```

`behavior.json` 有 96/96 成功样本、32 cells、8 类场景，但原 evaluator 的 `status=FAIL` 是旧 0.11 基线诊断：0.11 仍有普通任务、reported 等旧基线低分。它不能直接当作 0.12 产品失败。

直接检查 0.12 的 16 个 cells：

```text
Sol  8/8 cells 为 3/3
Grok 8/8 cells 为 3/3
candidateRubricGate=true
```

scored 的 0.12 盲收据也全部为 6/6 verdict pass。严格对照：

```text
firstAction:         0.11=43, 0.12=48  -> 通过
completion:          0.11=41, 0.12=48  -> 通过
unnecessaryQuestion: 0.11=5,  0.12=0   -> 通过
governance:          0.11=6,  0.12=0   -> 通过
```

因此本轮没有发现新的 0.12 guidance 真实 FAIL。R31 之后的 guidance 修复在候选行为门槛上已经达到要求；原 evaluator 的 FAIL 是旧基线诊断，scorer 也明确保留了 `baselineRubricObserved=false` 与 `candidateRubricGate=true` 的区别。

## 3. receipt/ledger 和 attestation

独立读回结果：

```text
ledger:   harness-lite-invocation-ledger, schemaVersion=1, entries=96,
          candidateDigest=b556..., 所有 entry exitCode=0 且有 response/log digest
receipts: R15-contract-v1, required=96, reviewed=96,
          adversarialRequired=6, adversarialReviewed=6, failures=0
receiptsBinding.valid=true
```

六个 adversarial receipt 为预期结果：accepted-bypass、fake-complete、global-pause、hard-bypass、route-bypass 为 FAIL，hard-positive 为 PASS。

但是临时目录没有 `harness-lite-0.12.0-attestation.json`，当前 workspace 也没有可信预注册 reviewer key 或 `HL12_F07_ATTEST_PUBKEY`。因此 `scored.json`：

```text
status=UNKNOWN
reason=No valid independent attestation for authentic model execution
```

这不是 receipt 绑定失败，而是“谁为真实运行独立背书”没有被证明。不能生成本地临时签名来把它改成 PASS。

## 4. CEX、正例、正式 caller 和源码全量

```text
node --test test/hl12-f00-counterexamples.test.js
13 pass / 0 fail / 0 skip
```

CEX-01 至 CEX-06 六个坏路径、六个正常正例和 F00 hard-risk freeze 均通过。

F01/F02 定向迁移与身份测试：

```text
13 pass / 0 fail / 0 skip
```

包括 fresh、managed 以及 official 0.9/0.10/0.11 upgrade/uninstall、anchor、rollback 和用户 instruction 字节恢复。

当前源码 full suite：

```text
npm test
205 pass / 0 fail / 0 skip
```

正式 caller 的静态接线仍在 `hooks/dispatcher.js` 的 SessionStart、UserPromptSubmit、Stop、PreToolUse，以及 `lib/hook.js` 的统一 dispatch；candidate 测试和 full suite 对物化 dispatcher、carrier、push gate、迁移和生命周期均有覆盖。

## 5. 物化 candidate full suite 的真实缺口

我将 b556 candidate 的 55 个文件解包到 disposable root，保留 candidate 中的 executable mode，并补入当前 retained artifacts 后运行该 root 的 `npm test`：

```text
205 tests
195 pass / 10 fail / 0 skip
```

10 个失败为：

```text
3   candidate-baseline.test.js
8   current-contracts.test.js
25  hl11-event-upgrade.test.js
169 nv05-integration.test.js
170 nv05-integration.test.js
171 nv05-integration.test.js
173 nv05-integration.test.js
174 nv05-integration.test.js
176 nv05-integration.test.js
177 nv05-integration.test.js
```

失败断言共同表现为：测试期望 `0.11.0`，物化 candidate 的当前 runtime 实际是 `0.12.0`。其余 195 项通过，且没有 skip；这些失败没有显示 global write、tamper、accepted bypass、carrier 截断或硬风险漏拦。

这仍然是计划意义上的收口缺口：计划要求 source 与 materialized candidate 的必需矩阵不能 skip，且本轮要求物化 full suite 0 skip；“测试是历史测试”不能让它们自动贡献 PASS。最小 owning unit 是 **HL12F07 的 test-only candidate fixture/migration scope**：把保留的 0.11 历史测试与当前 0.12 candidate 测试明确分层，或为历史测试提供明确的 0.11 runtime fixture，使它们不再把 0.12 当前 runtime 当成 0.11；不得修改产品语义来迎合旧断言，也不得删除失败测试掩盖问题。

## 6. 最终判断和下一步

没有 attestation 时，本复核不能签 PASS；lifecycle/source-only skip 已消失，CEX、迁移、candidate identity 和 0.12 behavior gate 已通过，但物化 candidate 仍有 10 个历史测试契约失败。

因此当前整体结论是 **UNKNOWN（有明确 test-only 收口阻塞，不是新的 0.12 产品行为 FAIL）**。

最小下一步：

1. HL12F07 先处理上述 10 个物化 candidate 历史测试的 fixture/scope 分层，并重新达到 source+materialized `0 skip`；
2. 由可信外部 reviewer 在独立环境提供 F08 attestation/key；
3. 再复核同一 candidate（或修复后新 candidate）的 receipt binding、candidateRubricGate、16 个 0.12 cells、CEX、迁移和物化 full suite。

在此之前不能把 F08 标为 PASS、不能 accepted/closeout，也不能启动 0.13 或发布动作。
