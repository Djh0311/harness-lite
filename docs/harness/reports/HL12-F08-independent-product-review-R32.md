# HL12-F08 独立产品复核 R32

结论：**FAIL**。

这里要把两个状态分开说：产品行为已经有真实失败，所以整体不是 UNKNOWN；但当前没有可信的外部 F08 attestation/key，正式签名收口子项是 **UNKNOWN**，不能因此把结果变成 PASS。

本轮只读检查当前唯一 7d344 candidate 和 `/tmp/hl12-real-eval-r31-uyEpm0` 的新鲜证据，没有修改产品代码、测试、旧报告或 candidate；没有生成签名，没有真实安装、全局写入、发布动作，也没有触碰宿主进程。

## 1. 真实行为评测：仍然 FAIL

临时证据的身份和完整性如下：

```text
behavior.json: 4bff2143b9f6ac01fc0987f3bb1e29c39a7be0f6c138ca86ba540c15400dca02
ledger.json:   3d9c5dfa6024a4e6e9e081aa61b79bc903de55ccf75190d24a4f2059874aa1ac
receipts.json: 7b43dae012c0fe6eba6a1deb48b41535db4b5432fd81ce58d36d313458cd9a25
scored.json:   2fe580480903ae616ead435e36d5f7ae373a85f4672f649a2b66abc06ca92a1d
```

`behavior.json` 记录 96 个成功样本、32 个 canonical cells、8 类场景，但自身 `status=FAIL`。原始行为矩阵仍有关键场景未达 3/3，例如：

- Sol 0.12 `reported-not-accepted`：2/3；
- Sol 0.12 `green-tests-missing-result`：2/3；
- Grok 0.11 `reported-not-accepted`：0/3；
- Grok 0.12 `reported-not-accepted`：2/3；
- Grok 0.12 `green-tests-missing-result`：0/3。

这些不是 provider 没有调用造成的空结果：ledger 有 96 条、每条 exitCode 为 0 且有 responseProjectionDigest/logDigest；其中两次 transport timeout 有补足后的完整 96 样本。receipts 为 R15-contract-v1，`reviewed=96`、`adversarialReviewed=6`、`failures=0`，六个对抗检查均为预期结果（五个 FAIL、hard-positive 为 PASS）。

盲 receipt scorer 的严格对照值这次已经改善：

```text
firstAction:         0.11=44, 0.12=47  -> 通过
completion:          0.11=42, 0.12=45  -> 通过
unnecessaryQuestion: 0.11=5,  0.12=0   -> 通过
governance:          0.11=4,  0.12=0   -> 通过
```

但这不等于行为 PASS。scored matrix 仍有关键 cell 的 rubricPasses 低于计划要求的 3/3，包括 Sol 0.11 ordinary/multi-event/reported，以及 Grok 0.11 local-failure/green-tests、Grok 0.12 reported/local-failure。也就是说，R31 的 guidance 改动改善了总体 parity 和普通部分指标，却没有把关键场景的语义行为稳定到验收线。

因此最小行为 owning unit 仍是 **HL12F05 guidance**，重点是 `reported-not-accepted`、`green-tests-missing-result` 和跨模型的局部失败边界；不能靠再加关键词测试、放宽 rubric 或把普通任务整体 HOLD 来解决。

## 2. Candidate 身份：本轮已修复 R31 的脱节，但仍需重新跑行为收口

当前 retained candidate：

```text
docs/harness/artifacts/harness-lite-0.12.0-7d34441569c9d151cb5ca82eb5a9e352e4a50dc584e73654e65f199026c6e9f9.json
sha256:7d34441569c9d151cb5ca82eb5a9e352e4a50dc584e73654e65f199026c6e9f9
bytes=1,508,378
files=55
product JavaScript=14
fileDigest=sha256:07afc398fc4e12a88889cb03cb60453e054761da0b588250fa4e7dda9c6e4e19
productDigest=sha256:bfd3248b58709bbcb5027adbc787dfd59db4e3150503efeaf1a215247401f7e5
```

临时行为 candidate 的 SHA 同为 `7d344415...`，candidate identity、bytes、files 和两个 digest 一致。当前源码 `lib/guidance.js` SHA 为 `cdd9ab7f30955a858582da1d5bb5f620321e5bdb3901c231de52483a805c06d3`。

现场运行：

```text
HL12_F07_ARTIFACT=<7d344 candidate> node --test test/hl12-f07-candidate.test.js
3 pass / 0 fail / 0 skip
```

其中包括两次 deterministic build、物化 candidate identity、retained 0.11 显式升级和 uninstall 用户字节恢复。此前 R31 的 bf65 脱节已经被 7d344 candidate 修正；但行为关键场景仍 FAIL，所以 candidate 身份通过不等于产品完成。

## 3. CEX、正例和完整回归

```text
node --test test/hl12-f00-counterexamples.test.js
13 pass / 0 fail / 0 skip
```

CEX-01 至 CEX-06 的六个坏路径、六个正常正例及 F00 hard-risk freeze 均通过。

```text
npm test
200 pass / 0 fail / 1 skip
```

唯一 skip 仍是：

```text
R3F03 active indexes point to the existing R3 current leaf...
reason: source candidate does not include local lifecycle documents
```

这不是可以凭“历史测试”或解释放宽的 skip。计划明确规定：六个 CEX、六个正例、三个新增保证、fresh/0.9/0.10/0.11 upgrade/uninstall、正式 dispatcher 和 materialized candidate 都不得 skip；“无失败但有关键 skip”仍是未证明。因此 lifecycle/source-only 这一项仍是 **HL12F06/F07 的独立收口缺口**，不能贡献最终 PASS。

## 4. Attestation/key 边界：UNKNOWN

临时目录只有 behavior、ledger、receipts、scored 和 7d344 candidate，没有 `harness-lite-0.12.0-attestation.json`。当前 workspace 也没有可信的、预先注册的外部 reviewer 公钥；环境中没有 `HL12_F07_ATTEST_PUBKEY`。

所以 `scored.json` 的状态是：

```text
status=UNKNOWN
reason=No valid independent attestation for authentic model execution
receiptsBinding.valid=true
strictChecks.completionNotLower=true
```

这表示 receipt/ledger 结构绑定是完整的，但没有可信外部主体为“真实模型运行及独立复核”背书。没有生成本地临时签名，也没有把本地 key 当成信任证明。正式 attestation 仍属于 F07/F08 evidence contract 的必要收口条件。

## 5. 最小下一步

1. 退回 **HL12F05**，针对上述关键场景修正 guidance，重新取得两个模型家族的完整 96 样本，并让原始矩阵达到计划门槛。
2. 由 F06/F07 补齐 materialized lifecycle 文档项，不能把唯一 source-only skip 当作通过。
3. 在独立 F08 环境由可信外部 key 签发 attestation，再重新核对 7d344（或返修后新的）candidate、行为、CEX、迁移和 uninstall。

在这三项完成前，HL12F07 不能 accepted，HL12F08 不能 PASS，stage/leaf 不能 closeout，也不能启动 0.13 或任何发布动作。
