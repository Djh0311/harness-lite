# Harness Lite 0.12 HL12F08 主管验收 R53：PASS

日期：2026-09-03（Asia/Shanghai）

## 结论

**PASS。** 未参与实现的独立 reviewer 已对新 `ef33cf...` candidate 做 fresh
复核并签发有效 Ed25519 attestation；主管现场重新读回身份、证据绑定和签名，
确认 F08 通过。这个结论只接受当前离线 candidate，不授权真实安装、push、tag、
release 或 deploy。

## 独立复核对象

- candidate：`harness-lite-0.12.0-ef33cf10d2f28ed57be76d22994cbe701cc81b69927f582773ed4e8dc0122db3.json`
- candidate SHA：`sha256:ef33cf10d2f28ed57be76d22994cbe701cc81b69927f582773ed4e8dc0122db3`
- behavior：`sha256:db042c36c7a9b2757faf199559fa5ea10c30c7bfcdebe936648eace368708530`
- invocation ledger：`sha256:f01ba0928f863c1f30f74b985fb37bce7ca888d43941d43eadc1fffea4332fd1`
- blind receipts：`sha256:e5c56084078e7464c6c13aeadbb3e3a92103542d9c7ca48748de9986ca429960`
- scored：`sha256:7087126510f4c957af7f354745ea5117a8c2fc9af283fe786150c401eb78be2f`
- independent report：`docs/harness/reports/HL12-F08-independent-product-review-R53.md`
  （`sha256:d9323e7f68cafab8723f58daed0706516a5b70dd4e73d10f427de5e2954a6503`）

R53 的 fresh blind replay 最终为 `96/96`、`failures=0`、adversarial `6/6`；
0.12 的 16 个行为格均 `3/3`。source 和物化 candidate 均为 `211/211 pass`、
`0 fail`、`0 skip`；CEX-01..06、joined Hook、动态 capability、迁移/卸载和
普通路径也都通过。R49 指出的 hard-risk exact target/local scope 问题不再复现。

## 签名和现场验收

预注册 reviewer：`hl12-f08-independent-reviewer-r53-8458c509`，Ed25519
fingerprint：
`sha256:8458c509a7fb5ceb3a996321dd2efbd48abf84db2875c3bd21d5428a631c1168`。
公钥登记文件为
`docs/harness/reports/HL12-F08-independent-product-review-R53-pubkey.md`，
只含公钥的 candidate-specific 副本也已保存，`privateKeyPresent=false`。

attestation SHA：`sha256:3e9ce65fa175d503dcb64befbf812045edabf02ba55ae9f33200ad6d3eac9d7b`。
主管用登记公钥验签 `true`，并确认 payload 中 candidate、behavior、ledger、
receipts、scorer 五个 digest 与现场文件逐一相等。使用 candidate-specific
文件重跑 `test/hl12-f07-behavior-scorer.js` 得到：

```text
status=PASS
receiptsBinding.valid=true
reviewed=96/96
cells=32
candidateRubricGate=true
matrixExact/sampleCountExact/firstActionNotLower/completionNotLower/
nuisanceStrictlyLower/governanceStrictlyLower = true
```

## 边界

独立 reviewer 只写了 R53 报告、公钥登记和 disposable evidence；没有修改产品、
candidate、旧报告或 retained artifact。整个复核没有真实安装、全局写入、push、
tag、release、deploy，也没有接触 Poracode、watchdog、bridge。retained 0.10、
0.11 与真实全局 `AGENTS.md` 保持原 SHA。

## 接受决定

F08 R53 记为 `accepted`。结合 F07 R54 和 F06 R51 的 acceptance，当前 0.12
离线 candidate 的产品验收链闭合；下一步若要安装或发布，必须由用户另行明确授权，
本轮不自动执行任何外部动作，也不启动 0.13。
