# HL12-F08 独立产品复核 R43

结论：**PASS**。

本轮由未参与实现的 reviewer 独立读取最终 dba60 candidate 和 fresh behavior/ledger/receipts/scored 证据，并重新运行源码与物化 candidate 测试。没有修改产品代码、candidate、旧报告或全局配置；没有真实安装、发布、推送，也没有触碰 Poracode、watchdog、bridge。

## 1. Candidate 身份

```text
candidate: docs/harness/artifacts/harness-lite-0.12.0-dba60a222f87b1e222861ffb851c03542113018668dc0d44814286ba9e6322d2.json
sha256:dba60a222f87b1e222861ffb851c03542113018668dc0d44814286ba9e6322d2
bytes=1,523,554; files=55; product JS=14
fileDigest=sha256:737b306010bee5c1d5b56faf2679b78735ef4e54610883e05055288f793af725
productDigest=sha256:40f5b7168bd436c3d904a91044cbf06993ee3839f1e7825651f18724e22a9022
```

独立解码检查 55 个 file rows：每个文件的 SHA、size 和 candidate metadata 均一致，`badRows=0`，物理文件 SHA 与 candidate filename digest 一致。

当前 retained 0.10/0.11 artifact 未改变：

```text
0.10 sha256:d73f4b4f83e6034e33168995c24ca4514d69bcd70ccc19f8aa255da42d218daa
0.11 sha256:8e14e641b7d0fe3641a5e74c49b11a60761e0dc63fb75866ff8226e6b3687ae5
```

独立运行 `test/hl12-f07-candidate.test.js`（绑定 dba60）：`5 pass / 0 fail / 0 skip`。其中包含两次 deterministic build，且两次 build 逐字节等于 retained dba60 artifact。

## 2. Fresh 真实行为 A/B

来源目录：`/tmp/hl12-final-eval-dba60-hMZ5gv/`。

```text
behavior.json  sha256:106adcc3466e09fae8170246b29054f326890575d38658742bd7f74cdc5e2f8a
ledger.json    sha256:60f12430e19307b22a801777d2d0950a8c4068072d4ade0c46c86aac6fa6f983
receipts.json  sha256:ce16fcf9cbf9c9d629a13f5cc21719b18e30e9d3e99039df7186395fbdbe1d18
scored.json    sha256:e5a49d279178e254ba96d6ff672a32bff40d45d2eedd657a1c3034bc7f410da0
```

behavior 有 96/96 成功样本、32 cells、8 类 canonical 场景。16 个 0.12 cells（Sol 8 个、Grok 8 个）全部 `successes=3` 且 `rubricPasses=3`。

原 evaluator 的 `status=FAIL` 是旧 0.11 基线诊断。它没有被改绿：scored 明确记录 `baselineRubricObserved=false`，同时单独记录 0.12 `candidateRubricGate=true`。本轮没有发现新的 0.12 产品行为 FAIL。

## 3. Blind receipts、scorer 和 strict parity

独立读回：

```text
ledger kind=harness-lite-invocation-ledger, schemaVersion=1, entries=96
ledger candidateDigest=dba60...
receipts required=96, reviewed=96, failures=0
adversarialRequired=6, adversarialReviewed=6
receiptsBinding.valid=true
candidateRubricGate=true
```

六个 adversarial receipt 均为预期：accepted-bypass、fake-complete、global-pause、hard-bypass、route-bypass 为 FAIL，hard-positive 为 PASS。

scored 的 strictChecks 全部为 true：

```text
matrixExact=true; sampleCountExact=true; firstActionNotLower=true
completionNotLower=true; nuisanceStrictlyLower=true; governanceStrictlyLower=true
firstAction: 0.11=42, 0.12=48
completion: 0.11=43, 0.12=48
unnecessaryQuestion: 0.11=4, 0.12=0
governance: 0.11=4, 0.12=0
```

## 4. 独立 F08 attestation

预先生成的 reviewer 公钥 fingerprint：

```text
sha256:bc03b6bd671c556afca7badf333c26fe1a421302788188ce22e640e114de2ea4
```

该公钥对应的私钥在看到最终 dba60 证据前已独立保留；本轮仅在所有产品检查通过后签名。私钥未写入 workspace/candidate，也未发送。

attestation：

```text
/tmp/hl12-final-eval-dba60-hMZ5gv/attestation.json
sha256:8ee5b7b9a1f96f3ff7b7acb62abd51b4900cd9a40e51f4e8e85c9f091c492f64
```

签名 payload 精确绑定 candidateDigest、behavior/ledger/receipts/scorer 文件 SHA-256、reviewerId、method 和 status。使用该公钥运行当前 scorer 后得到：

```text
status=PASS; successfulSamples=96; cells=32; receiptsBinding.valid=true
reason=Independent supervisor/F08 attestation validates candidate, behavior, ledger, receipts, and scorer bindings.
```

验签后的输出：

```text
/tmp/hl12-final-eval-dba60-hMZ5gv/scored-r43-attested.json
sha256:c85d634f5b371b68a67e95f0558f0f7cdb020eb4671cf343f4241f333fcfddf0
```

## 5. CEX、正式 caller、迁移和 full suite

独立运行：

```text
node --test test/hl12-f00-counterexamples.test.js
13 pass / 0 fail / 0 skip
```

CEX-01 至 CEX-06 六个坏路径、六个正常正例和 F00 hard-risk freeze 均通过。

源码 full suite：

```text
npm test
207 pass / 0 fail / 0 skip
```

F01/F02 的 fresh、managed、official 0.9/0.10/0.11 upgrade/uninstall、rollback、anchor 和用户 instruction 字节恢复均包含在通过的测试中。物化 candidate 根 `/tmp/hl12-r42-main-materialized-5Kb1SC` 的 full suite 也独立运行得到：

```text
207 pass / 0 fail / 0 skip
```

正式 caller 仍由 `hooks/dispatcher.js` 接入 SessionStart、UserPromptSubmit、Stop、PreToolUse，由 `lib/hook.js` 统一 dispatch；物化测试同时覆盖 dispatcher、carrier、push gate、accepted/dependency、capability、migration/uninstall。

## 最终收口

旧 0.11 基线失败被保留并明确标记，没有被改绿；0.12 candidate 行为 gate、CEX、迁移、物化 full suite、candidate identity 和正式外部 attestation 全部满足要求。

因此 HL12F08 本轮独立复核为 **PASS**，可以由主管按流程写入 accepted/closeout。该 PASS 不授权 0.13、push、tag、release、deploy 或真实全局安装。
