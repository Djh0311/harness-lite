# HL12 F07 writer report R27

status: reported_complete

R27 加入 Ed25519 attestation 验签：公钥仅来自工作区外的 `HL12_F07_ATTEST_PUBKEY`，私钥不进入 repo/candidate；签名覆盖 candidate/behavior/ledger/receipts/scorer digest、reviewerId、method、schema/status。无 key、伪签名、错绑签名均 UNKNOWN。增加临时密钥签名/篡改回归。

scorer 默认输出独立 `harness-lite-0.12.0-behavior-scored.json`，不覆盖 HL12_F07_REPLAY 原始 behavior。F07 reported_complete 后由独立 F08 fresh replay 产生 attestation，避免生命周期死结；本轮未伪造 attestation/fresh96。

最终候选：`harness-lite-0.12.0-7f905cc982ffaa261c7259a17ef996faf3e643b8b5cfdfff0f657894d7625f89.json`；1,489,429 bytes；55 files/14 product JS；fileDigest `sha256:d33c8e0ef7ab7c4d229179cf4367e2f1b7d4e09797a71593f59fe1eb02c0cfe8`；productDigest `sha256:6d290c19ff4ca07158b19c79eb44014632fc3c1398635700ab53393650ec37d4`。双 build 一致。

node check 与 F07 scorer/attestation 定向测试通过；无外部签名时行为保持 UNKNOWN。
