# HL12 F07 writer report R22

status: reported_complete

R22 将 invocation ledger 改为 scorer 的外部输入（`HL12_F07_LEDGER` 或 behavior artifact 同目录的独立 ledger 文件），不再接受 report 内嵌 ledger。scorer 要求 ledger 独立文件、96 条、完整绑定 sample 的 family/version/scenario/attempt/returnedModel/responseDigest；缺失或自洽伪造路径均 UNKNOWN。evaluator 同时输出独立 `harness-lite-0.12.0-invocation-ledger.json`。

新增 R22 回归确认 scorer 依赖外部 ledger，不能只靠报告内自填；未调用真实模型时没有 ledger，行为不会 PASS。没有伪造 fresh 96。

最终候选（全部修改后双 build 一致）：`harness-lite-0.12.0-588b770ffdeb93c541e7e39e2eb5030200037d80edc69b2eeb51b5e7aed04724.json`；1,484,677 bytes；55 files/14 product JS；fileDigest `sha256:d23e89fe4312cada92aa3956ae467f4f1ad656686e2d2b5f3436cbceffd57510`；productDigest `sha256:6d290c19ff4ca07158b19c79eb44014632fc3c1398635700ab53393650ec37d4`。

测试：node check 通过；F07 scorer/schema 定向通过；当前无外部真实 ledger，行为保持 UNKNOWN。
