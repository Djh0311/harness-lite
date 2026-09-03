# HL12-F07 writer report R33

status: reported_complete

本轮按 R33 真实盲评反馈做最小语义修复。没有修改 scorer/rubric，没有新增硬风险、审批、用户命令或全局停点，也没有伪造行为结果或 attestation；未进行真实全局安装、宿主操作、push/tag/release/deploy。

## 修改

- `lib/guidance.js`
  - `agent-reported` 的 decisionQuestion/nextAction 前置：A 未验收时第一动作 `HOLD/暂停 B`；缺口只修，能查证不问用户。
  - `problem-recovery` 前置：A 未修复保持 `complete=false/productResult=incomplete`；B 的结果不代表整体完成；只修当前 A，不扩大全局。
  - 压缩 recovery 文案，保留原有 Terra/Sol 账本语义标识，避免压力上下文丢失生命周期行。
- `lib/install.js`
  - current 0.12 instruction 同步上述依赖、局部故障和未完成语义；长度 900 字符以内。
- `lib/hook.js`
  - 压力 essential wire 中将既有 `Harness：stage=` 行标为 required，确保上下文预算压力下不静默丢失基础生命周期事实；不改变风险或普通路径决策。
- `test/hl12-f06-joined.test.js`
  - 增加/更新字段级 joined 断言，直接检查 HOLD、A 局部修复、complete/productResult 和提问边界。

## 验证

- `node --check lib/guidance.js lib/hook.js lib/install.js`：通过。
- F06/F07 定向：32 pass / 0 fail。
- `HL12_F07_ARTIFACT=<candidate> node --test test/hl12-f07-candidate.test.js`：3 pass / 0 fail。
- `npm test`：201 pass / 0 fail / 1 个既有 lifecycle-docs scope skip。
- 两次 `HARNESS_LITE_CANDIDATE_VERSION=0.12.0 node scripts/build-candidate.js` 逐字节一致，并与 retained candidate 相同。

## Materialized lifecycle scope skip

`R3F03 active indexes...` 仍是唯一既有 scope skip：candidate 不打包仓库本地 plan/stage/leaf 治理文档，因此物化 root 无法运行 source-only index 断言。该 skip 不参与 CEX、行为或身份 PASS；F07 物化 migration replay 已验证 retained 0.11→0.12 HOLD/显式升级/verify/dispatcher/uninstall 字节恢复。保持该边界比把治理文档塞入 runtime candidate 或放宽 DoD 更小、更诚实。

## Candidate

唯一 retained candidate：

- [harness-lite-0.12.0-13e1569ff8af3eb4bc6831598b0c1524fbda2acf0d8f19ac95f3998b8690acc3.json](/home/synadmin/harness-lite-0.9.1/docs/harness/artifacts/harness-lite-0.12.0-13e1569ff8af3eb4bc6831598b0c1524fbda2acf0d8f19ac95f3998b8690acc3.json)
- SHA-256：`sha256:13e1569ff8af3eb4bc6831598b0c1524fbda2acf0d8f19ac95f3998b8690acc3`
- bytes：`1,509,490`；files：`55`；product JS：`14`
- fileDigest：`sha256:c60e7b0588e11969f1f43fec1583bdd4e05843e35f587b7b9cb36361bd7e72a6`
- productDigest：`sha256:bd748142e4adb329390d60748ce8e4246f68db1eb7c29d759ddc9a7de4f051d4`

行为 artifact 已绑定该 candidate。R31/R32 真实 A/B 的失败结果（completion parity 0.11=43、0.12=40 及 Grok 场景缺陷）不能由本轮代码测试覆盖；需独立 fresh A/B 重跑后再决定 F07 行为状态。此报告只交回实现，不写 `accepted`。
