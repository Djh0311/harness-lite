# HL12-F08 独立产品复核 R48

结论：**UNKNOWN，不能 accepted**。

本轮使用全新的 70e669 candidate 和 R47 behavior/ledger；没有使用 dba60/R43/R44 的 behavior、receipts 或 attestation。没有修改产品、candidate、历史报告、真实 docs/harness 或全局配置，没有安装、发布、推送，也没有碰宿主进程。

## 1. Candidate identity

```text
candidate: docs/harness/artifacts/harness-lite-0.12.0-70e6699721e99612f666da21d7945fb8ad44e69c08a047cc9dbc92d17da92621.json
physical SHA: sha256:70e6699721e99612f666da21d7945fb8ad44e69c08a047cc9dbc92d17da92621
bytes=1,539,790; files=55; product JS=14
fileDigest=sha256:1f8af188252807f3119b1a48a0202caffe519bf859ede61fce0e5606ca2ebd33
productDigest=sha256:d0a31f1d9c97d80a171f04a7005667e47c8abb6e50136bfb9ec0569c1af4b3b3
```

独立解码检查 55 个 file rows：每个内容 SHA 和 size 均一致，`badRows=0`。当前 retained 0.10/0.11 physical SHA 仍分别为：

```text
0.10 sha256:d73f4b4f83e6034e33168995c24ca4514d69bcd70ccc19f8aa255da42d218daa
0.11 sha256:8e14e641b7d0fe3641a5e74c49b11a60761e0dc63fb75866ff8226e6b3687ae5
```

当前 candidate test 结果：`6 pass / 0 fail / 0 skip`，包括 deterministic build、物化 identity 和 retained 0.11 显式升级/uninstall。

## 2. Source、materialized、CEX 和正式路径

独立运行：

```text
node --test test/hl12-f00-counterexamples.test.js
13 pass / 0 fail / 0 skip

npm test                         # source
210 pass / 0 fail / 0 skip

npm test                         # /tmp/hl12-r42-main-materialized-5Kb1SC
207 pass / 0 fail / 0 skip
```

CEX-01 至 CEX-06 六个坏路径、六个正常正例和 F00 hard-risk freeze 均通过。物化 full suite 也没有 skip，且包含正式 SessionStart/UserPromptSubmit/Stop/PreToolUse、dynamic capability、work-unit/ledger、carrier、push gate、migration/uninstall 和 lifecycle fixture 回归。F01/F02 测试覆盖 fresh、managed、official 0.9/0.10/0.11 upgrade/uninstall、rollback、anchor 和用户 instruction 字节恢复。

## 3. 新鲜 behavior/ledger 和原始 evaluator

R47 新鲜文件：

```text
behavior: docs/harness/artifacts/harness-lite-0.12.0-70e6699721e99612f666da21d7945fb8ad44e69c08a047cc9dbc92d17da92621-behavior.json
behavior SHA: sha256:87ecb95774a0bbb54e311520b29de7f5499a23b0569be59694d6f3439c143366
ledger: docs/harness/artifacts/harness-lite-0.12.0-70e6699721e99612f666da21d7945fb8ad44e69c08a047cc9dbc92d17da92621-invocation-ledger.json
ledger SHA: sha256:02cbd5e00cfdc865868db25f37c1ced1948ad78528172d83fc9fcb5b4e7fdfdd
```

behavior 有 96/96 成功样本和 32 cells，原始 `status=FAIL`。独立读取 0.12 matrix 发现 15 个 cell 为 3/3，Grok `reported-not-accepted` 为 2/3；0.11 也保留了自己的基线失败。因此不能把整个 FAIL 简化成“只是 0.11 旧基线”，但也不能在缺少完整独立 blind receipts 时直接断言这是最终 0.12 产品 FAIL。

## 4. 我自己的 fresh blind receipts

命令使用 `test/hl12-f07-blind-reviewer.js`，输入只指向上述 70e669 behavior，输出只写 `/tmp/hl12-r48-evidence/receipts.json`。没有读取 workspace 中旧的 blind receipts。

经过初次运行和仅针对 transport 缺失项的重试，结果为：

```text
reviewed=93 / required=96
unique missing ordinals: 7, 37, 45
failures: transport only for the missing attempts; no semantic verdict FAIL
adversarialReviewed=6 / required=6
```

六个 adversarial 都是预期结果：accepted-bypass、fake-complete、global-pause、hard-bypass、route-bypass 为 FAIL，hard-positive 为 PASS。

最终 fresh receipts SHA：

```text
sha256:bd7998eb944b5b05fa83c9bf927def258aa757c8e9322db0062868119fd017d2
```

失败数组包含多轮重试留下的 21 条 transport 记录；有效 receipt ordinal 只有 93 个，未把缺失调用手工补成 receipt。

## 5. Scorer fail-closed 结果

我明确指定不存在的 attestation 路径，避免误读 workspace 旧文件，并运行当前 scorer；输出只写 `/tmp/hl12-r48-evidence/scored.json`：

```text
status=UNKNOWN
successfulSamples=96
cells=32
receiptsBinding.valid=false
receiptsBinding.reviewed=93
receiptsBinding.required=96
reason=No valid independent attestation for authentic model execution (receipt document metadata mismatch)
```

scored SHA：

```text
sha256:7befe87d01f3681859b9ca09f74d7462f302047a00fe809694f7891b8d259b03
```

由于缺少 3 条 receipt，`sampleCountExact=false`，当前 `candidateRubricGate=false` 不能用于判断完整 96 样本的真实 candidate gate；firstAction/completion/nuisance/governance 的部分计算值也不能替代完整证据。没有生成或接受 attestation，没有签名。

## 6. 最终区分和最小 owning unit

- 已确认通过：candidate 物理身份、两次 deterministic build、CEX/正例、源码 full suite、物化 full suite、migration/uninstall、正式 caller/lifecycle。
- 尚未确认：完整 96 条独立 blind receipts、完整 receiptsBinding、完整 0.12 blind candidate gate 以及外部 F08 attestation。
- 当前未确认的 3 个样本都是 Grok transport timeout，不应计为模型语义 FAIL；但也不能计为 PASS。
- 原 evaluator 的 0.11 基线失败仍原样保留；0.12 有一个 2/3 cell 的独立待核对信号，不能在完整 blind score 前改判。

最小 owning unit 首先是 **HL12F07/F08 行为证据收集链**：补足缺失的 3 个真实 blind reviewer 调用，重新生成不含重试重复失败的 96/96 receipts，再由独立 reviewer 复算 scorer。如果完整盲评仍使 0.12 `reported-not-accepted` 低于 3/3，再把该具体语义缺口退回 **HL12F05 guidance**；本轮没有足够证据直接要求产品返修。

在完整 receipts 和可信外部 attestation 出现前，F08 只能保持 UNKNOWN，不能 accepted/closeout，不能启动 0.13 或任何发布动作。
