# HL12 F07 writer report R26

status: reported_complete

修复 R25 测试契约兼容字面，并为 attestation 增加 `schemaVersion=1` 与 `method=independent-supervisor-f08` 要求。最终候选在所有源码稳定后双 build 一致：`harness-lite-0.12.0-6008e849ce2bde60ca2ec3588b3dd89ae297398fc0a84e0a3ba405f2164a58fe.json`，1,487,353 bytes；55 files/14 product JS；fileDigest `sha256:0a6c290f8b14a884f40a4ac5488594e3e9e17f7d11e1829978ac620dfe6fde75`；productDigest `sha256:6d290c19ff4ca07158b19c79eb44014632fc3c1398635700ab53393650ec37d4`。

F07 scorer/schema 定向测试源码部分通过；candidate 测试需以该最终 retained artifact 重放（本地未设 HL12_F07_ARTIFACT 时旧测试会报缺少 retained 环境变量）。没有伪造 attestation/fresh96，行为保持 UNKNOWN。
