# HL12 F07 writer report R16

status: reported_complete

R16 只收紧行为证据校验，没有修改 guidance、Harness 产品代码或 dispatcher，也没有真实全局安装、push、发布或触碰宿主。

## 已落地的收紧

- `test/hl12-f07-behavior-scorer.js` 现在强制：96 个样本、每个 32 个 cell 恰好 3 次且 attempt 唯一；固定 `kind/schemaVersion/contractVersion/required/blind/failures`；sample projection canonical digest；response digest；交叉 reviewer 身份；receiptId（含 ordinal 与 canonical 字段）；adversarial fixture 的 contract/response/receiptId/verdict 完整绑定。
- 删除 legacy projection 作为 R15 有效收据的后门；旧 projection 会得到 UNKNOWN。
- 增加严格指标结构（首动作、完成判断、无谓提问、无关治理），只从盲评收据观察字段聚合，并检查 0.12 相对 0.11 的不下降/严格下降要求。
- `test/hl12-f07-behavior-scorer.test.js` 增加 altered sample、缺失 receipt、旧 contract 等篡改回归。
- reviewer schema 已要求独立观察字段；由于真实 provider 延迟，本轮未伪造新观察，也未把旧收据冒充新收据。

## 当前行为证据状态

现有 retained blind receipt 文件仍是 R15 旧格式（无新观察字段/旧 projection）。用 R16 scorer 重放时正确得到 `UNKNOWN`，原因是 receipt contract/projection/schema 不满足 R16；没有把它写成 PASS 或 FAIL。完整 96 条 fresh R16 盲评需要再次调用真实 reviewer，当前 provider 调用延迟过高，本轮未完成，不能声称行为 DoD 已完成。

## 候选

已重新双 build，逐字节一致；唯一保留候选：

`docs/harness/artifacts/harness-lite-0.12.0-c9c9ff87a91212c4bc9f37f2984ab9f4b86aaa50ee0c6721035451f9a5d2c0aa.json`

- candidate digest: `sha256:c9c9ff87a91212c4bc9f37f2984ab9f4b86aaa50ee0c6721035451f9a5d2c0aa`
- bytes: 1,466,861；files: 55；product JS: 14
- file digest: `sha256:204cdda7b1df916457247d9f813be2c287aca17e2eeafad309764f390a711c1e`
- product digest: `sha256:6d290c19ff4ca07158b19c79eb44014632fc3c1398635700ab53393650ec37d4`

旧 retained 0.10/0.11 保持不变；旧中间 0.12 candidate 已移出 artifacts，仅保留上述一个。

## 测试

- 修改文件 `node --check`：通过。
- R16 scorer 当前重放：`status=UNKNOWN`（严格收据拒绝，符合 fail-closed）。
- R15 定向/全量基线曾为 185 pass / 0 fail / 1 scope skip；R16 新增测试和候选文件后需在 fresh receipt 生成后再跑最终全量矩阵。本轮不把旧基线数字冒充 R16 完成证据。

## 阻塞

真实 reviewer 对新增独立观察字段的调用延迟导致 96 条 R16 receipts 尚未重建。缺少 fresh 收据时行为结论必须 UNKNOWN；下一步应在 provider 可用且不会伪造结果的前提下完成全量重评，再重新跑 scorer、candidate/source/materialized 矩阵。
