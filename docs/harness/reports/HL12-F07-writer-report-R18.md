# HL12 F07 writer report R18

status: reported_complete

R18 未改产品 guidance，仅修行为证据校验。

- 统一 adversarial response digest 为带 `sha256:` 前缀；adv receiptId 与 observation/provenance 全字段绑定。
- scorer 对 malformed behavior/receipts fail-closed 返回 UNKNOWN，不再因 `samples={}` 等输入崩溃。
- regular/adv provenance 校验 provider、model、command、batch、attempt、duration，拒绝 prompt/transcript。
- candidateIdentity 现场重算物理文件内容、文件/产品 JS 元数据、候选和 product digest。
- canonical matrix/scenario/attempt 集合、ordinal 范围和计数继续严格校验。

现有 R15 receipts 缺少 R17/R18 新字段，scorer 仍诚实返回 UNKNOWN；没有伪造 fresh 96 或行为 PASS。provider 长延迟阻塞真实重评。

最终唯一候选（所有修改后重建，双 build 逐字节一致）：

`harness-lite-0.12.0-cc91805613223b7c8f932b76f1d335df9458bf9e4ee8e712cabf90b745e0dd29.json`

candidate digest `sha256:cc91805613223b7c8f932b76f1d335df9458bf9e4ee8e712cabf90b745e0dd29`；bytes 1,477,673；55 files/14 product JS；fileDigest `sha256:f33e328d6c9b8ffe89646f971be45248eeb825d76e8f9b905c0a958c6604ed58`；productDigest `sha256:6d290c19ff4ca07158b19c79eb44014632fc3c1398635700ab53393650ec37d4`。

测试：`node --check` 通过；F07 scorer 篡改回归 7/7 pass；candidate source/materialized 3/3 pass。行为结论保持 UNKNOWN，等待 provider 可用后重新获取真实盲评收据。
