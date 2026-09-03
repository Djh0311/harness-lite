# HL12 F07 writer report R23

status: reported_complete

R23 明确了自动评分的证据边界：外部 invocation ledger 现在必须有固定 schema、candidateDigest、96 个完整 entry；每项绑定 sample 的 family/version/scenario/attempt/returnedModel/responseDigest，并校验 exitCode、duration 和 `sha256:` 格式 logDigest。自动 scorer 永远不把本地 receipts/ledger 自洽视为真实模型证明，最终行为状态固定为 UNKNOWN，PASS 留给独立 F08 现场复跑/人工确认。

没有伪造真实 stdout/stderr 或 fresh 96 调用；旧证据继续 UNKNOWN。

最终候选：`harness-lite-0.12.0-1ad5da37d3de7d92fd218b0a2eb4e8d48bf2849fb545779fd9b4606977268d12.json`；1,485,061 bytes；55 files/14 product JS；fileDigest `sha256:a621e809f09f3eaf42fc414e210dd65f1d896d5816e039d4f38d10132dd39ad8`；productDigest `sha256:6d290c19ff4ca07158b19c79eb44014632fc3c1398635700ab53393650ec37d4`。双 build 逐字节一致。

node check 与 F07 scorer/schema 定向测试通过；无真实外部 ledger 时 fail-closed UNKNOWN。
