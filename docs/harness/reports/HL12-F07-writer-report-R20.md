# HL12 F07 writer report R20

status: reported_complete

R20 修正重试 attempt 语义：成功样本允许 attempt 4/5/6，只要求每个 canonical cell 的三个成功样本使用唯一正整数 attempt。新增 independent invocation ledger 门槛：没有真实调用记录（provider/model/command/exitCode/response projection digest/log digest）时，scorer 直接 UNKNOWN，不能靠自洽 receipts 伪造 PASS。保留 malformed、receipt、candidate 和 adversarial 严格校验。

由于没有 fresh 真实 96-call invocation ledger，本轮行为结论保持 UNKNOWN，未伪造收据或模型结果。

最终候选（全部修改后双 build 一致）：`harness-lite-0.12.0-84f3e497522d566d2def3e7c85e72781dbbd0e72205ea6964d523585d75b9d66.json`；1,480,769 bytes；55 files/14 product JS；fileDigest `sha256:edca36a9d0e51023501160d729565c289b601132010714ab229e80e03b47bdc8`；productDigest `sha256:6d290c19ff4ca07158b19c79eb44014632fc3c1398635700ab53393650ec37d4`。

测试：node check 通过；F07 scorer/fixture 定向 10/10 pass；candidate source/materialized 需以该最终候选重放。无真实全量行为证据，不宣称 F07 accepted。

补充 R21 修复：evaluator 现在将 `responseDigest` 计算在实际落盘的 `responseSummary` 上，并生成 invocationLedger；scorer 将 ledger 与 sample ordinal/model/attempt/response digest 一一绑定。缺少真实 ledger 仍返回 UNKNOWN。最终候选已在本轮所有源码稳定后重建为 fbc54be150db5f54b3fd56ec4ac42d963326a1a6cb050d86c031527eb07413a8（1,483,149 bytes，fileDigest 3f844a93512b4353c1803b3b724a6c78886c59159266d41a5b5d4009b7a4eaac）。
