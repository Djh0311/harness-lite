# HL12-F07 writer report R40

status: reported_complete

本轮严格限定为测试夹具/断言迁移；没有修改产品 JavaScript、guidance、runtime/install、retained 0.10/0.11、真实行为证据或正式 attestation，也没有真实安装、全局改写、push、tag、release、deploy。

## 实际修改

- `test/candidate-baseline.test.js`：candidate/package 版本由当前 `package.json` 推导；保留 candidate 结构、无 Git authority、文件面断言。
- `test/current-contracts.test.js`：runtime/package/source commit 由当前 install identity 推导；保留完整 runtime path surface。
- `test/nv05-integration.test.js`：fresh/managed/upgrade 安装断言由当前 runtime identity 推导，历史 0.9 fixture 与 retained 0.10/0.11 语义仍用固定 snapshot 断言。
- `test/hl11-event-upgrade.test.js`：retained 0.10 仍固定验证 previous-10 与显式 upgrade；升级后的 runtime 版本改为当前 install identity。
- `test/hl12-f07-behavior-scorer.test.js`：`badBehavior` 明确定位 `version==='0.12'` 的 ordinary-safe-task 样本及对应 receipt，再重算 receiptId、receipts digest 和临时测试签名；good fixture 仍 PASS、坏 0.12 行为仍 FAIL。
- `test/hl12-f07-candidate.test.js`：区分 raw evaluator 与 scored evidence；raw FAIL 只按 raw artifact schema 验证，不强制 scorer-only 的 `receiptsBinding.valid`；scored FAIL 仍严格要求完整有效 receipt binding，不放宽 candidate gate。

## 测试证据

- 改动 JS `node --check`：通过。
- source 定向（上述测试集合）：54 pass / 0 fail / 0 skip。
- source `npm test`：205 pass / 0 fail / 0 skip。
- 物化最终 candidate（注入外部 retained 0.10/0.11 与 behavior artifacts，保留 candidate 自身内容）`HL12_F07_ARTIFACT=<candidate> npm test`：205 pass / 0 fail / 0 skip。
- 物化运行确认 current 0.12 identity；历史 retained snapshot 仍按固定 previous identity 迁移验证。

## Candidate 身份

测试文件变更后重新双构建，`cmp` 逐字节一致；当前唯一 0.12 candidate：

- SHA-256：`sha256:523c15650145d3e5aad25be136b9b1645302288e712d4d7aeb19598590d46601`
- bytes：1,520,842
- files：55
- product JavaScript：14
- fileDigest：`sha256:db22f5e9681708eb75ae1e39a15a40c59d6eef75b275b6aeebbd42c7a1c36deb`
- productDigest：`sha256:40f5b7168bd436c3d904a91044cbf06993ee3839f1e7825651f18724e22a9022`

## 未解决边界

当前行为 artifact 仍没有新鲜外部 F08 attestation；本轮没有伪造或接受真实行为 PASS。物化 full-suite 的历史 snapshot/behavior 输入必须由验收环境作为外部只读证据提供，不能把这些 lifecycle/retained 文件塞进 candidate。
