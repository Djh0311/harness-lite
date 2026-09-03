# HL12 F07 writer report R47

status: reported_complete

## Candidate-bound real behavior replay

在隔离临时目录运行了现有正式 evaluator（未写入运行时 prompt/transcript）：

```text
HL12_F07_ARTIFACT=docs/harness/artifacts/harness-lite-0.12.0-70e6699721e99612f666da21d7945fb8ad44e69c08a047cc9dbc92d17da92621.json
HL12_F07_BEHAVIOR_OUT=/tmp/hl12-real-eval-r46-*/behavior.json
HL12_F07_LEDGER_OUT=/tmp/hl12-real-eval-r46-*/invocation-ledger.json
node test/hl12-f07-behavior-evaluator.js
```

结果：`96/96` successful real calls，32/32 cells each 3/3，provider/format
failure 3 条被单独记录；正式 frozen rubric 结果为 `FAIL`，不宣称行为 PASS。
样本使用 Codex `gpt-5.6-sol` 与 Grok `grok-4.6`，均在隔离 temporary cwd、
read-only/plan、无 subagents、空 PORACODE hook 环境运行。

candidate-bound 证据已写入（旧 dba60 canonical behavior/ledger 未覆盖）：

- `docs/harness/artifacts/harness-lite-0.12.0-70e6699721e99612f666da21d7945fb8ad44e69c08a047cc9dbc92d17da92621-behavior.json`
  - SHA-256 `87ecb95774a0bbb54e311520b29de7f5499a23b0569be59694d6f3439c143366`
- `docs/harness/artifacts/harness-lite-0.12.0-70e6699721e99612f666da21d7945fb8ad44e69c08a047cc9dbc92d17da92621-invocation-ledger.json`
  - SHA-256 `02cbd5e00cfdc865868db25f37c1ced1948ad78528172d83fc9fcb5b4e7fdfdd`

两份 JSON 内的 candidate identity 均绑定：
`sha256:70e6699721e99612f666da21d7945fb8ad44e69c08a047cc9dbc92d17da92621`，
1,539,790 bytes、55 files、14 product JS，productDigest
`sha256:d0a31f1d9c97d80a171f04a7005667e47c8abb6e50136bfb9ec0569c1af4b3b3`。

本轮没有生成或签发 F08 独立 attestation；行为结果仍是可复核的真实运行 FAIL，
不是 UNKNOWN，也没有把旧 candidate 响应重绑到新 candidate。旧
`harness-lite-0.12.0-dba60...json` 及其历史 behavior/attestation 保持原样。

未真实安装到全局、未 push/tag/release/deploy、未触碰 `/home/synadmin/.codex`
或 Poracode 宿主；临时评测目录已清理。
