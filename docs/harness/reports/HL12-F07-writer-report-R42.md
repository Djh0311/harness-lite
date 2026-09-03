# HL12-F07 writer report R42

status: reported_complete

本轮只改 `test/hl12-f07-candidate.test.js` 的证据断言和 disposable 回归，没有修改产品/scorer/行为/retained 文件，也没有生成或接受本地 attestation；未进行真实安装、全局改写、push、tag、release、deploy。

## 修复内容

- UNKNOWN 文案允许明确的 fail-closed 原因 `No valid independent attestation for authentic model execution`，同时保留 connector、missing ledger、96/sample 等原有 UNKNOWN 入口。
- 新增 R42 回归夹具，确认缺可信外部签名/attestation 的结果保持 `UNKNOWN`，绝不转为 PASS。
- PASS 分支的 R41 严格 scorer/receipt/candidateRubricGate/strictChecks 门槛保持不变。

## 测试

- `node --check test/hl12-f07-candidate.test.js`：通过。
- F07 candidate 定向：5 pass / 0 fail / 0 skip。
- source `npm test`：207 pass / 0 fail / 0 skip。
- 物化 candidate（外部注入 retained 0.10/0.11 与 behavior artifacts，`HL12_F07_ARTIFACT` 指向候选）`npm test`：207 pass / 0 fail / 0 skip。
- 双构建逐字节一致（`cmp` 通过）。

## Candidate 身份

- 唯一 candidate SHA-256：`sha256:dba60a222f87b1e222861ffb851c03542113018668dc0d44814286ba9e6322d2`
- bytes：1,523,554
- files：55
- product JavaScript：14
- fileDigest：`sha256:737b306010bee5c1d5b56faf2679b78735ef4e54610883e05055288f793af725`
- productDigest：`sha256:40f5b7168bd436c3d904a91044cbf06993ee3839f1e7825651f18724e22a9022`

## 未解决边界

当前仍没有新鲜外部 F08 attestation/key；R42 只证明证据缺失时正确保持 UNKNOWN，不对真实模型行为作 PASS 结论。
