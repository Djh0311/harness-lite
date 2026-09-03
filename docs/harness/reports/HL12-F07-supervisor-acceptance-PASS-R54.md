# Harness Lite 0.12 HL12F07 主管验收 R54：PASS

日期：2026-09-03（Asia/Shanghai）

## 结论

**PASS。** 主管在核对 F07 R52/R54 和 F08 R53 独立签名后，接受新的
`ef33cf...` 作为当前唯一可复核的离线 0.12 candidate。这个 PASS 只覆盖
source/candidate/行为证据的完成，不代表真实安装、Git commit、push、tag、
release、deploy，也不自动启动 0.13。

## Candidate 与证据身份

- candidate：`docs/harness/artifacts/harness-lite-0.12.0-ef33cf10d2f28ed57be76d22994cbe701cc81b69927f582773ed4e8dc0122db3.json`
- candidate SHA：`sha256:ef33cf10d2f28ed57be76d22994cbe701cc81b69927f582773ed4e8dc0122db3`
- bytes/files/product JS：`1,541,698 / 55 / 14`
- fileDigest：`sha256:2ab1ac97352fd969cbedd4e68ba6a4268f47a0b361d41318d9439a1bfe66ef0b`
- productDigest：`sha256:4f3e34659d01056242694e655c6be331acfe2467426dda16a740a7d832a82d2b`

candidate-bound 文件均保留在 `docs/harness/artifacts/`，且逐项与 R53 临时源
逐字节一致：

- behavior：`sha256:db042c36c7a9b2757faf199559fa5ea10c30c7bfcdebe936648eace368708530`
- invocation ledger：`sha256:f01ba0928f863c1f30f74b985fb37bce7ca888d43941d43eadc1fffea4332fd1`
- blind receipts：`sha256:e5c56084078e7464c6c13aeadbb3e3a92103542d9c7ca48748de9986ca429960`
- behavior-scored：`sha256:7087126510f4c957af7f354745ea5117a8c2fc9af283fe786150c401eb78be2f`
- attestation：`sha256:3e9ce65fa175d503dcb64befbf812045edabf02ba55ae9f33200ad6d3eac9d7b`
- R53 public key：`sha256:c4ccc97b122322649bca9f5a65249266a40bf26224dddfc5aab814bdd8537ea5`

主管重新运行 scorer，使用 candidate-specific ledger/receipts/attestation/key，
得到 `status=PASS`、`receiptsBinding.valid=true`、`reviewed=96/96`、`cells=32`、
`candidateRubricGate=true`；签名验签为 true，payload 的 candidate、behavior、
ledger、receipts、scorer 五个 digest 全部逐字一致。

## F07 完成标准复核

- F06 新 candidate：两次同环境 0.12 build 逐字节一致；source 与物化 candidate
  的正式 Hook、迁移和卸载回归均纳入套件。
- source full suite：`211 pass / 0 fail / 0 skip`。
- materialized candidate full suite：`211 pass / 0 fail / 0 skip`（由 F08 fresh
  replay 复核）。
- CEX-01..06：`13 pass / 0 fail / 0 skip`；F03/F06/F07 joined：`26/26`；
  behavior scorer tests：`22/22`。
- fresh blind replay：`96/96`、`failures=0`、adversarial `6/6`；0.12 的 16 个
  行为 cells 全部 `3/3`，包括 R49 发现的 hard-risk exact-target/local-scope。
- strict comparison：0.12 的 first-action/completion 不低于 0.11，且 nuisance
  question 与 invalid governance 均严格下降（48>45、48>40、0<4、0<1）。

raw evaluator 的整体 `status=FAIL` 被原样保留，因为它包含 0.11 对照基线；
独立 blind scorer 只用 0.12 candidate gate 做收口，没有篡改旧基线或把 raw FAIL
冒充 PASS。

## F08 独立证据

未参与实现的 reviewer 报告：
`docs/harness/reports/HL12-F08-independent-product-review-R53.md`，SHA
`sha256:d9323e7f68cafab8723f58daed0706516a5b70dd4e73d10f427de5e2954a6503`。

R53 reviewer `hl12-f08-independent-reviewer-r53-8458c509` 的预注册 Ed25519
公钥 fingerprint 为
`sha256:8458c509a7fb5ceb3a996321dd2efbd48abf84db2875c3bd21d5428a631c1168`；
attestation `status=PASS` 且主管现场验签通过。R53 没有修改产品、candidate 或
历史报告，也没有真实安装或外部发布。

## 边界与接受决定

retained 0.10、0.11 与真实全局 `AGENTS.md` 保持原 SHA；没有写
`/home/synadmin/.codex`，没有触碰 Poracode/watchdog/bridge。F07 R54 只保留公开
证据，不含 reviewer 私钥。

F07 现在记为 `accepted`，允许主管对 F08 独立复核作最终单元验收；当前仍不授权
安装、push、tag、release、deploy 或其他外部动作。
