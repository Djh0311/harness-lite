# HL12-F07 writer report R37

status: reported_complete

本轮只做 R37 的证据门槛回归补强，没有修改 guidance、运行时产品代码、正式 attestation，也没有运行真实模型评测、真实安装、全局改写、push、tag、release 或 deploy。

## 实际修改

- `test/hl12-f07-behavior-scorer.js`
  - 明确保留 `baselineRubricObserved`（完整 0.11 对比结果），并将 `rubricOk`/`candidateRubricGate` 限定为 0.12 matrix。
- `test/hl12-f07-behavior-scorer.test.js`
  - scorer fixture 现在动态读取唯一当前 0.12 candidate，不依赖已经过期的文件名。
  - 新增 `badBaseline` disposable fixture：将一个 0.11 critical cell 的 receipt 改为 FAIL，重新绑定 receipt digest/ID 和 Ed25519 临时签名；实际运行 scorer 证明 0.11 基线失败时，0.12 candidate gate 仍可通过。
  - 保留原有“坏 0.12 行为必须 FAIL”集成回归。
- 重建唯一 0.12 candidate；旧候选未保留为 0.12 正式 artifact。

## R37 实际证据

`R37 candidate gate passes when a retained 0.11 baseline cell fails` 通过：

- `status=PASS`（临时测试 attestation，仅用于结构回归，不是正式行为证据）
- `candidateRubricGate=true`
- `baselineRubricObserved=false`
- `scores['0.11/real-hard-risk-gate'].verdictFails=1`
- `scores['0.12/ordinary-safe-task'].verdictFails=0`
- `receiptsBinding.valid=true`

这证明 0.11 的失败只作为完整对比数据保留，不会错误地把 0.12 gate 判失败；同时错误的 0.12 行为仍由既有测试判为 FAIL。

## Candidate 身份

两次独立构建逐字节一致（`cmp` 通过）。当前唯一 retained candidate：

- 文件：[current retained 0.12 candidate](../../artifacts/harness-lite-0.12.0-d852ff2542de7eb7405248ea290dce749cee8b4eea0e0d3d1c6f38e5173ac8b6.json)
- SHA-256：`sha256:d852ff2542de7eb7405248ea290dce749cee8b4eea0e0d3d1c6f38e5173ac8b6`
- bytes：1,514,914
- files：55
- product JavaScript：14
- fileDigest：`sha256:e2443bfadd398efa90ceb4149fb628b1160b9885e7db1d9f6920e6f72b5f6802`
- productDigest：`sha256:40f5b7168bd436c3d904a91044cbf06993ee3839f1e7825651f18724e22a9022`

## 测试

- `node --check test/hl12-f07-behavior-scorer.js`：通过
- `node --check test/hl12-f07-behavior-scorer.test.js`：通过
- `node --test test/hl12-f07-behavior-scorer.test.js`：22 pass / 0 fail
- `node --test test/hl12-f07-candidate.test.js`：3 pass / 0 fail
- `npm test`：204 pass / 0 fail / 1 既有 scope skip

## 未解决边界

R37 只修 scorer 版本门槛的自动回归证据。当前没有新鲜的 96 次真实双模型行为评测或正式外部 F08 attestation，因此不能据此宣称 F07 行为 PASS；真实行为结论仍以独立 fresh replay 和外部签名 attestation 为准。
