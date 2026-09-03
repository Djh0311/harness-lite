# HL12-F07 writer report R31

status: reported_complete

本轮按 R31 主管复核结果做最小语义修复。只改了 F05 guidance decision 文案和对应 joined regression；没有新增硬风险、审批、用户命令、全局停点或 prompt 持久化，也没有真实安装、宿主操作、push/tag/release/deploy。

## 产品修复

`lib/guidance.js` 的正式 `decision`/`text` 现在明确写出：

- 只派发或只记录不等于用户结果完成；结果未出现时保持 `complete=false`、`productResult=incomplete`。
- 派发、读回或测试绿都不等于用户结果完成。
- 局部故障只处理当前 unit，不扩大到全局。
- 能直接查证就不问用户，只有不可替代的用户选择才问。

`lib/install.js` 的 0.12 current instruction 同步加入同一组短语，长度仍为 900 字符以内（当前 约 760 字符）。Decision 仍是单一 focus/decisionQuestion/nextAction，push 说明只在真实 gate 命中时出现。

## 回归与证据

- `node --check lib/guidance.js lib/install.js`：通过。
- `node --test test/hl12-f06-joined.test.js test/hl12-f07-behavior-scorer.test.js`：31 pass / 0 fail。
- 新增 R31 joined 测试直接调用正式 `guidance.select` 与 current instruction，核对结果完成、局部恢复和提问边界。
- `npm test`：200 pass / 0 fail / 1 个既有 scope skip。
- 主管提供的真实评测 `/tmp/hl12-real-eval-NhmSYz` 保留作 R31 对照：96/96 调用成功、receipts 96/96 valid，但旧 guidance 的 completion 严格对照为 0.11=43、0.12=40，因此本轮不宣称行为 PASS；修复后需要新的独立 fresh A/B 与 F08 attestation。

## materialized lifecycle scope skip

现有 `R3F03 active indexes...` skip 是有意的边界：candidate builder 不打包仓库本地 `docs/harness/plan.md`、active stage/leaf 等治理文件，物化 candidate 无法假装拥有 source-only lifecycle 文档。该 skip 不贡献 CEX、行为或 candidate 身份 PASS；已由 F07 的物化 retained-0.11→0.12 HOLD/显式升级/uninstall 字节恢复测试覆盖实际 installed lifecycle。最小证据方案是继续把该断言标为 source-only scope skip，并在物化验收使用 disposable project lifecycle replay，而不是把治理文档塞进 runtime candidate 或放宽 DoD。

## 最终 candidate

仅保留一个 0.12 candidate，双 build 逐字节一致并等于 retained：

- 文件：[harness-lite-0.12.0-7d34441569c9d151cb5ca82eb5a9e352e4a50dc584e73654e65f199026c6e9f9.json](/home/synadmin/harness-lite-0.9.1/docs/harness/artifacts/harness-lite-0.12.0-7d34441569c9d151cb5ca82eb5a9e352e4a50dc584e73654e65f199026c6e9f9.json)
- SHA-256：`sha256:7d34441569c9d151cb5ca82eb5a9e352e4a50dc584e73654e65f199026c6e9f9`
- bytes：`1,508,378`；files：`55`；product JS：`14`
- fileDigest：`sha256:07afc398fc4e12a88889cb03cb60453e054761da0b588250fa4e7dda9c6e4e19`
- productDigest：`sha256:bfd3248b58709bbcb5027adbc787dfd59db4e3150503efeaf1a215247401f7e5`

行为 artifact 已绑定该 candidate，但真实行为状态仍需外部重新评测；本报告不写 `accepted`，不伪造 fresh96 或 attestation。
