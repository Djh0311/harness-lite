# Harness Lite 0.12 HL12F07 supervisor review R16

结论：FAIL，R15 的盲评收据管线仍不能作为可接受的行为证据，退回同一实现子代理做最小证据层修复。没有修改产品 guidance，也没有启动 F08。

## 主管独立复核

R15 的当前 artifact 有 96/96 正常样本收据和 6/6 固定反例收据，行为状态诚实为 `FAIL`。候选身份 `sha256:c2129f11aa2c7c2650e274cb5bdec72ffee773c46e06adc36829f92a4f02bd09`（1,456,015 bytes，55 files / 14 product JS）与报告声明一致；这些基础事实不等于 F07 完成。

我在 disposable 副本上直接运行 `test/hl12-f07-behavior-scorer.js`，得到以下决定性缺口：

1. 把 `successfulSamples` 从 96 改成 97，评分器仍保持完整有效状态（只做 `< 96` 检查），所以不强制 96 个成功样本、32 个 cell 各 3 个唯一样本。
2. 把 `hard-bypass` 收据的 `inputDigest` 改成全零，评分器仍报告 `receiptsBinding.valid=true`；固定反例没有绑定到冻结的 response/contract。
3. 把普通收据的 `receiptId` 改成任意字符串，评分器仍报告有效；receiptId 没有验证为声明字段的摘要。
4. R15 contract 已经固定为 `R15-contract-v1`，但评分器仍接受省略 `forbidHold` 的 legacy digest，旧投影可以混入当前收据集合。
5. 样本保存的是 response summary，而 `responseDigest` 来自未保存的完整模型 JSON，评分器不能独立重算该摘要；当前绑定不是可复核的 canonical response digest。
6. 评分器把所有行为指标压成同一总 PASS 数，只检查 0.12 不低于 0.11；没有从同一盲评 verdict 层统计并强制计划要求的首动作/完成判断不下降、无必要提问/无效治理/无关停顿严格减少。

这些问题允许篡改或弱化证据后继续得到 `valid=true`，与计划第七节、F07 DoD 的“证据可复核、严格配对、任何未证明项不得 PASS”不符。

## 返修要求

- 收据必须绑定固定 canonical sample projection、当前完整合同版本、可复核 response projection 和 receiptId；缺任何绑定均为 `UNKNOWN`。
- 固定反例的 contract、response、期望 verdict 必须在 scorer 中逐项核对，不能只核对 id 和非空 digest。
- 严格验证 96 个成功样本、32 个 family/version/scenario cell、每 cell 恰好 3 个且 ordinal/input/receipt 唯一；缺失、额外、重复、错标签均不得进入 PASS。
- 所有配对指标必须来自同一盲评 verdict 收据，并落实计划规定的严格门槛；不得恢复关键词 scorer 或信任模型自报字段。
- 补充对应的篡改回归测试；若因此需要重新生成收据，按新合同完整重评并重新绑定 candidate/scorer/reviewer 身份。行为真实 FAIL 时继续如实保留 FAIL。

本轮未做真实安装、全局写入、push、tag、release、deploy，也未触碰 Poracode/watchdog/bridge。F07 保持 active，F08 不得启动。

