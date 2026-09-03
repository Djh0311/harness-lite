# HL12-F07 writer report R36

status: reported_complete

本轮只修正 F07 scorer 的 rubric gate 口径：0.11 继续作为完整失败基线和 parity/strict 对照，只有 0.12 的 critical 3/3、非 critical 2/3 要求决定新版本 rubricOk。没有隐藏或删除 0.11 matrix，也未伪造 attestation/行为结果。

## 修改与测试

- `test/hl12-f07-behavior-scorer.js`：`rubricOk` 明确先筛选 `version === '0.12'`，保留完整 matrix、parity、firstAction/completion/nuisance/governance strict checks。
- `test/hl12-f07-behavior-scorer.test.js`：新增 R36 回归，锁定 0.11 基线失败不应单独让 candidate gate FAIL，同时确认 parity/strict checks 仍存在。
- `node --check test/hl12-f07-behavior-scorer.js`：通过。
- F07 scorer 定向：21 pass / 0 fail。
- 物化 candidate：3 pass / 0 fail。
- `npm test`：203 pass / 0 fail / 1 个既有 lifecycle-docs scope skip。

## Candidate

两次 0.12 build 逐字节一致，且仅保留以下 retained candidate：

- [harness-lite-0.12.0-bb3cccf09baa5ad1afd6762ff3b0c0dc0bec52cdaa6353133f9a911017dd2957.json](/home/synadmin/harness-lite-0.9.1/docs/harness/artifacts/harness-lite-0.12.0-bb3cccf09baa5ad1afd6762ff3b0c0dc0bec52cdaa6353133f9a911017dd2957.json)
- SHA-256：`sha256:bb3cccf09baa5ad1afd6762ff3b0c0dc0bec52cdaa6353133f9a911017dd2957`
- bytes：`1,511,030`；files：`55`；product JS：`14`
- fileDigest：`sha256:55e2487c04b1559a4a9035fd779d1c554971f7581e0eb04cb10c10564616baf1`
- productDigest：`sha256:40f5b7168bd436c3d904a91044cbf06993ee3839f1e7825651f18724e22a9022`

行为 artifact 已绑定该 candidate；真实 A/B/外部 attestation 仍由主管独立流程提供。本报告只交回实现，不写 `accepted`。
