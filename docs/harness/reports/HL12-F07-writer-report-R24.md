# HL12 F07 writer report R24

status: reported_complete

R24 解决 F07/F08 流程死结：本地 scorer 不再永久 UNKNOWN，而是提供明确的外部 supervisor/F08 attestation 入口。只有独立 attestation 文件同时绑定 candidate、behavior、ledger、receipts、scorer 的 SHA，且带 reviewerId/status=PASS 时，scorer 才允许 PASS；缺失或任何错绑继续 UNKNOWN。新增 schema 回归确认没有 attestation 不能 PASS。

本轮没有伪造 attestation 或 fresh 96，当前行为仍 UNKNOWN。

最终候选：`harness-lite-0.12.0-aac3ccd4a23bc418b929acb8279a7f4730f041801000af507afb456637f54906.json`；1,486,893 bytes；55 files/14 product JS；fileDigest `sha256:d29678ba448400a963ec625203998b3bc94db7981b84f11b25ec80ed09ad964f`；productDigest `sha256:6d290c19ff4ca07158b19c79eb44014632fc3c1398635700ab53393650ec37d4`。双 build 一致。

测试：node check、F07 scorer/schema 定向通过；行为无独立 attestation 时明确 UNKNOWN。
