# HL12-F06 writer report R30

status: reported_complete

本轮按主管 R30 要求完成最小收口，未改 guidance、dispatcher、F06 产品运行时代码，也未进行真实全局安装、宿主操作、push/tag/release/deploy。行为评测没有伪造 fresh 96 或正式 attestation；当前行为 artifact 仍诚实保持 `UNKNOWN`。

## 实际修改

- `test/hl12-f07-behavior-scorer.js`
  - FAIL 分支现在区分“有效外部 attestation 但行为门槛/对照失败”和“没有有效 attestation”，不再把行为 FAIL 误报成缺 attestation。
- `test/hl12-f07-behavior-scorer.test.js`
  - 增加真实 scorer 集成 fixture：同路径输出时原始 bytes 保持不变并转写旁路输出；无公钥、错公钥均 `UNKNOWN`；完整临时 Ed25519 签名、完整 ledger/receipts/candidate 结构可得到 `PASS`；签名有效但 0.12 行为指标下降得到 `FAIL`。
  - fixture 使用临时目录和临时密钥，仅用于合同回归，不作为真实模型证据。
- `docs/harness/plans/HL12-UPGRADE-PLAN.md`、`docs/harness/leaves/HL12-UPGRADE.md`
  - 明确生命周期：F07 `reported_complete` 后由 F08 独立 fresh replay 并签发外部 attestation；最终 `accepted` 只能由主管在有效 attestation 后写入。
- `docs/harness/artifacts/harness-lite-0.12.0-behavior.json`
  - 绑定最终 candidate 身份；保留无真实外部 ledger/attestation 时的 `UNKNOWN`。
- 仅保留一个最终 0.12 candidate：
  - `docs/harness/artifacts/harness-lite-0.12.0-bf65fbae6d51f279031bf750238318a122a62b0afd89842719eace5e124cf983.json`
  - SHA-256：`sha256:bf65fbae6d51f279031bf750238318a122a62b0afd89842719eace5e124cf983`
  - bytes：`1,506,142`；files：`55`；product JS：`14`
  - fileDigest：`sha256:08ca617214f55b5df122be22745ecbf503e569cc80434aeaa858afd8da7d51cc`
  - productDigest：`sha256:6d290c19ff4ca07158b19c79eb44014632fc3c1398635700ab53393650ec37d4`

## 验证

- `node --check test/hl12-f07-behavior-scorer.js`：通过。
- `node --test test/hl12-f07-behavior-scorer.test.js`：20 pass / 0 fail。
- `HL12_F07_ARTIFACT=<最终 candidate> node --test test/hl12-f07-candidate.test.js`：3 pass / 0 fail（含双 build、物化 runtime 0.12 identity、retained 0.11 HOLD→显式升级→uninstall 字节恢复）。
- `npm test`：199 pass / 0 fail / 1 个既有 scope skip。
- 两次 `HARNESS_LITE_CANDIDATE_VERSION=0.12.0 node scripts/build-candidate.js` 逐字节一致，并与上述 retained candidate `cmp` 一致。

## 证据边界

本报告只表示 R30 写面已交回主管复核，不表示 F07 accepted 或行为 PASS。真实双模型 A/B、独立 F08 fresh replay 和签名 attestation 仍需在外部可信环境完成；没有这些输入，scorer 必须保持 `UNKNOWN`。
