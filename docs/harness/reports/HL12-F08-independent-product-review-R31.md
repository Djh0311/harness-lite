# HL12-F08 独立产品复核 R31

结论：**FAIL**。

本轮没有修改产品代码、测试或旧报告，没有真实安装、全局写入、push/tag/release/deploy，也没有触碰 Poracode、watchdog、bridge 等宿主。R31 只读取当前计划、报告、源码和 retained candidate，并复核了外部临时真实评测目录 `/tmp/hl12-real-eval-NhmSYz`。

## 一句话结论

这次不是“没有行为证据所以 UNKNOWN”。现在已经有 96 次真实调用、96 份盲审和 6 个对抗样本，但盲审明确发现：0.12 的完成判断比 0.11 低（0.11 为 43，0.12 为 40）。所以 0.12 目前确实没有达到行为门槛，不能 accepted。

同时，当前源码在 R30 之后已经变化，retained 的 bf65 candidate 没有随之重建；当前源码能稳定构建出另一个 7d344 candidate。因此 candidate 身份/收口也不能按 R30 报告通过。

## 依据的计划门槛

`docs/harness/plans/HL12-UPGRADE-PLAN.md` 第七、九、十节要求：

- 真实模型 A/B 必须有两个模型家族、8 类场景、每个版本/场景/家族 3 次成功调用，共 96 个样本；
- 盲审中 0.12 的首动作和完成判断不能低于 0.11，无必要提问和无效治理必须更少；
- 关键场景不能失败，行为不通过要退回最小 owning unit；
- 两次 build 必须逐字节一致并等于 retained 0.12 artifact；
- 缺少关键证据、存在关键 scope skip，不能算最终 PASS。

## 真实行为和盲审证据

临时目录包含：

- `behavior.json`：96 samples，32 cells，`status=FAIL`，`successfulSamples=96`；
- `ledger.json`：`kind=harness-lite-invocation-ledger`，96 条外部调用记录，candidateDigest 指向 bf65 candidate；
- `receipts.json`：R15-contract-v1，`reviewed=96`，`adversarialReviewed=6`，6 个对抗检查均存在；
- `scored.json`：没有 attestation 时按设计为 `status=UNKNOWN`。

文件 SHA-256：

```text
behavior.json  0fa7a9f239a9d52e13df3833d18a8d5da37c5335bd5a92cabf5ffe0a72e93abc
ledger.json    380d900b33768c50963115828a8a79eccd633c3deb7c78c635697f63c806eed9
receipts.json  429068c6d77bfa177a15bb269f6dea71fa52c5669ce4937b40d31479edde75f9
scored.json    f6b509c43fe547588de59892209dc49c6de46774a13ec59a56ca2ec55da78eb1
```

盲审 scorer 依据 receipts 的观察值计算出：

```text
firstAction:       0.11=43, 0.12=46  -> 通过
completion:        0.11=43, 0.12=40  -> FAIL，0.12 下降 3
unnecessaryQuestion: 0.11=4, 0.12=0 -> 通过
invalidGovernance:   0.11=3, 0.12=0 -> 通过
```

另外，Grok 格子存在未达门槛的盲审结果，具体可在 `scored.json` 的 `blindRubric.scores` 及 `matrix` 逐格复核；至少可见 0.12 `ordinary-safe-task` 为 0/6 verdict pass、`local-failure-scope` 为 1/6，`reported-not-accepted` 为 5/6。关键场景的失败不能靠其他格子平均掉。

独立用临时生成的诊断 Ed25519 key 仅测试 scorer 的计算路径（不是验收 key），对上述四个临时文件运行 scorer，输出为：

```text
{"status":"FAIL","successfulSamples":96,"cells":32}
reason: Independent attestation is valid, but behavior gates or 0.11/0.12 parity failed
receiptsValid: true
completionNotLower: false
```

这说明盲审 receipt 和 ledger 的绑定检查可以通过，但真实行为门槛仍然失败。临时 key 不证明 reviewer 身份，也不把这次诊断变成正式 attestation。

## CEX、正例和既有回归

现场运行：

```text
node --test test/hl12-f00-counterexamples.test.js
13 pass / 0 fail / 0 skip
```

其中 CEX-01 至 CEX-06 六个坏路径、六个对应正常正例和 F00 hard-risk freeze 均通过。这支持 F01–F06 的结构性修复仍在源码测试中成立，但不能覆盖真实模型行为 FAIL。

现场运行完整 suite：

```text
npm test
199 pass / 1 fail / 1 skip
```

失败是 `test/hl12-f07-candidate.test.js` 的 retained candidate 相等性检查；跳过的是 `R3F03 active indexes ...`，原因是 `source candidate does not include local lifecycle documents`。计划明确说 materialized candidate/lifecycle 必需矩阵不能 skip，因此这仍是未证明项。

F07 行为 scorer 定向测试本身为 `20 pass / 0 fail / 0 skip`。它证明 scorer 的 schema、绑定、签名和 fail-closed 代码路径，但不等于真实模型行为 PASS。

## Candidate 身份复核

retained candidate：

```text
docs/harness/artifacts/harness-lite-0.12.0-bf65fbae6d51f279031bf750238318a122a62b0afd89842719eace5e124cf983.json
sha256:bf65fbae6d51f279031bf750238318a122a62b0afd89842719eace5e124cf983
bytes=1,506,142
files=55, product JS=14
```

当前源码现场 hash 中，`lib/guidance.js` 已为：

```text
cdd9ab7f30955a858582da1d5bb5f620321e5bdb3901c231de52483a805c06d3
```

R30 writer report 记录的旧 `lib/guidance.js` hash 是 `de676f51...`。用当前源码在临时目录连续 build 两次：

```text
build A/B: 7d34441569c9d151cb5ca82eb5a9e352e4a50dc584e73654e65f199026c6e9f9
bytes: 1,508,378
files: 55, product JS: 14
fileDigest: sha256:07afc398fc4e12a88889cb03cb60453e054761da0b588250fa4e7dda9c6e4e19
productDigest: sha256:bfd3248b58709bbcb5027adbc787dfd59db4e3150503efeaf1a215247401f7e5
```

两次新 build 彼此逐字节一致，但都不等于 retained bf65 candidate；因此本轮 candidate identity 要求 FAIL。这里不是说 deterministic builder 坏了，而是当前 working copy 已经和 retained artifact 脱节，必须由 F07 重新建新 candidate 后再复核。

## 外部 key 和 attestation 边界

临时真实目录没有正式 `harness-lite-0.12.0-attestation.json`，当前 workspace 也没有可信预注册 reviewer 公钥。scored.json 因此诚实为 UNKNOWN；用本轮自选诊断 key 只得到“有效签名下的行为 FAIL”。

scorer 当前会绑定 candidate、behavior、ledger、receipts 和 scorer digest，并用 `HL12_F07_ATTEST_PUBKEY` 验签；但工作区临时生成的 key 只能证明签名和注入公钥匹配，不能证明 reviewer 是独立主体。因此正式收口仍需要 F08 之外可信来源提供的 reviewer key/attestation，不能把本轮诊断 key 当成 acceptance 证据。

## 最小 owning unit 和返修方向

第一 owning unit 是 **HL12F05 guidance**：真实模型输出显示 0.12 完成判断下降，并且 Grok 若干格未达到场景门槛。应修复 0.12 guidance 在完成标准、局部失败和普通安全任务等场景的语义引导，再由 F07 重新做完整 96 样本盲评。不是增加关键词测试，也不是把普通任务整体拦住。

第二个收口问题属于 **HL12F07/F08 evidence contract**：当前源码变化后要重建 candidate；正式 attestation 必须来自可信、独立、外部注册的 key，不能由本地同一次运行自选临时 key 产生。

此外，F06/candidate 的 lifecycle 文档 scope skip 必须补直接物化证据或明确解决；在计划门槛不允许 skip 的情况下，不能继续沿用“199 pass”作为最终 PASS。

在上述问题完成前，HL12F07 不能 accepted，HL12F08 不能 PASS，stage/leaf 不能 closeout，也不能启动 0.13 或任何发布动作。
