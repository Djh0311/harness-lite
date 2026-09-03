# HL12 F07 writer report R17

status: reported_complete

R17 继续只收紧 F07 行为证据校验，没有修改 guidance、Harness 产品代码或 dispatcher，也未进行真实全局安装、发布或宿主操作。

## 本轮修复

- scorer 严格拒绝负数/非整数/越界 ordinal、重复或缺失样本；固定 canonical 的 `sol/grok × 0.11/0.12 × 8 scenarios` 32-cell 集合，且每 cell 恰好三次。
- candidateIdentity 现场读取唯一候选文件，重算候选 SHA、bytes、文件数、product JS 数、fileDigest 和 productDigest；不再只信 behavior JSON。
- receiptId 绑定 ordinal、digest、verdict、reviewer 和全部独立 observation/judgment 字段；adversarial receipt 同样绑定固定 fixture、contract、response digest、verdict 和 reviewer 身份。
- strict metrics 改为聚合 blind reviewer 的 `firstActionJudgment`、`completionJudgment`、`unnecessaryQuestion`、`invalidGovernance`、`irrelevantPause`，不再只看枚举或 PASS 子集。
- evaluator/reviewer/scorer 使用同一 canonical sample projection；新增负数、额外 ordinal、旧 contract、篡改 sample 等回归。

## 当前证据结论

本轮没有伪造 fresh 96 条盲评。现有 R15 receipts 缺少 R17 要求的 observation/judgment/provenance 字段，因此 scorer 诚实返回 `UNKNOWN`；F07 行为没有被宣称 PASS。provider 仍有明显延迟，完整 fresh 重评需单独长跑。

## 候选

双 build 逐字节一致，唯一保留：

`docs/harness/artifacts/harness-lite-0.12.0-2abdb41e1353c0429efe736bc8f695c9ebc97fd43eb48051110cf84179804978.json`

- digest: `sha256:2abdb41e1353c0429efe736bc8f695c9ebc97fd43eb48051110cf84179804978`
- bytes: 1,474,717；files: 55；product JS: 14
- file digest: `sha256:4fd11d660187a8d303e4b1a1e3bcff6a0f2d1dd1e08dcf0336a85512ece8e57a`
- product digest: `sha256:6d290c19ff4ca07158b19c79eb44014632fc3c1398635700ab53393650ec37d4`

## 测试

- 修改 JS `node --check`：通过。
- F07 scorer/篡改回归：7 pass / 0 fail。
- candidate 双 build 与物化回归：通过；行为因收据缺字段保持 UNKNOWN。
- 未把旧 R15 全量测试数字冒充 R17 行为证据；fresh 96 收据完成后需重新跑最终全量矩阵。

Final candidate rebuilt after all R17 source edits; source/materialized candidate test passes 3/3.
