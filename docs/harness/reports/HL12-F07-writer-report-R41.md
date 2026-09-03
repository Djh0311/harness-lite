# HL12-F07 writer report R41

status: reported_complete

本轮只收紧 F07 candidate 行为证据测试，不修改产品 JS、scorer 逻辑、guidance、runtime/install、retained artifacts、真实行为文件或正式 attestation；没有真实安装、全局改写、push、tag、release、deploy。

## 实际修改

- `test/hl12-f07-candidate.test.js`
  - 新增 `assertValidatedPass`：PASS 必须明确来自 `blindReceiptVerdict-v2`/`blindReceiptVerdict-v1` scorer，`receiptsBinding.valid=true` 且 reviewed/required 与成功样本一致，`candidateRubricGate=true`，并且所有 strict checks 均存在且为 true。
  - raw evaluator 的 PASS 不再被误认作 validated real PASS；原 raw/scored FAIL 分层逻辑保持不变。
  - 新增 R41 disposable 回归：将 raw behavior artifact 伪装成 status=PASS 并删除 scorer/receipt 标记，验证断言拒绝。

## 测试

- 改动 JS `node --check`：通过。
- source F07 定向（candidate + scorer）：26 pass / 0 fail。
- source `npm test`：206 pass / 0 fail / 0 skip。
- 物化最终 candidate，注入外部 retained 0.10/0.11 与 behavior artifacts 后运行 `HL12_F07_ARTIFACT=<candidate> npm test`：206 pass / 0 fail / 0 skip。
- 双构建 `cmp` 逐字节一致；R41 raw-PASS 伪造夹具明确被拒绝。

## Candidate 身份

- 唯一 candidate SHA-256：`sha256:4e37d3efb36dfebb5b1397ad68f320e85bdf6476f13e9527ebb749104574bbdd`
- bytes：1,523,046
- files：55
- product JavaScript：14
- fileDigest：`sha256:3552398b2c4d211e569c903be8a5d129112ea915fc34eed032724cbf76d25504`
- productDigest：`sha256:40f5b7168bd436c3d904a91044cbf06993ee3839f1e7825651f18724e22a9022`

## 未解决边界

本轮只验证证据分层和 PASS 必需结构；当前没有新鲜外部 F08 attestation/key，因此不宣称真实行为 PASS。真实模型调用、盲评收据和外部签名仍需独立 reviewer/F08 现场复核。
