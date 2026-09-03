# HL12 F07 writer report R19

status: reported_complete

R19 修复 adversarial receipt 结构：result.ok 时现在写入全部五个 judgment/observation 字段及真实 provider、model、command、`batch: adversarial`、attempt、durationMs provenance；receiptId 与 scorer 使用同一字段投影。新增本地 schema 回归确保 reviewer 输出包含这些字段，未调用模型、未伪造收据。

同时保留 R18 的 malformed fail-closed、canonical candidate/矩阵/ordinal 校验。旧 R15 receipts 仍因缺新字段而由 scorer 判 UNKNOWN；provider 长延迟阻塞 fresh 96，本轮不声称行为通过。

最终候选在全部修改后重建，双 build 逐字节一致：

`harness-lite-0.12.0-b8c86e74a7d4c82fb640228e157bab6fcb115927c7bb314df49c144ae8908cb2.json`

1,479,065 bytes；55 files/14 product JS；fileDigest `sha256:3f049f5a34100652549ae2739420f934913a65241ca3da265d222da84d388e71`；productDigest `sha256:6d290c19ff4ca07158b19c79eb44014632fc3c1398635700ab53393650ec37d4`。

测试：node check 通过；F07 scorer/schema 定向 8/8 pass；candidate source/materialized 需以该最终候选重放。行为结论保持 UNKNOWN。
