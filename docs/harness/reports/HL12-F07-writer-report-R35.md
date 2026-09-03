# HL12-F07 writer report R35

status: reported_complete

R35 针对 fresh A/B 中唯一语义失败做最小文案修复：避免 closeout guidance 触发 evaluator 的 `标记完成`、`已完成`、`收口` 禁用词，同时保留结果未出现时的不完整语义。未改 scorer/rubric，未覆盖 R34 临时证据，没有安装、发布或宿主操作。

## 修改

- `lib/guidance.js`：leaf-closeout nextAction 现在是“逐条核验导出结果和完成标准；测试绿不等于用户结果；结果未出现时保持未完成，先补直接证据（complete=false、productResult=incomplete）”。
- `test/hl12-f06-joined.test.js`：R34 回归同步核对上述字段和禁用词缺席。

## 验证

- `node --check lib/guidance.js`：通过。
- F06/F07 定向：33 pass / 0 fail。
- 物化 candidate：3 pass / 0 fail。
- `npm test`：202 pass / 0 fail / 1 个既有 lifecycle-docs scope skip。
- 两次 0.12 candidate build 逐字节一致，并与 retained candidate 相同。

## Candidate

- [harness-lite-0.12.0-1b2db8a9754f3994c900bb0fcda2923ac2cfa0f9564dad8bc1450d64d58e829f.json](/home/synadmin/harness-lite-0.9.1/docs/harness/artifacts/harness-lite-0.12.0-1b2db8a9754f3994c900bb0fcda2923ac2cfa0f9564dad8bc1450d64d58e829f.json)
- SHA-256：`sha256:1b2db8a9754f3994c900bb0fcda2923ac2cfa0f9564dad8bc1450d64d58e829f`
- bytes：`1,510,266`；files：`55`；product JS：`14`
- fileDigest：`sha256:4a52f3cd3f38d3d11ea89604cd62814235c710e8327b726c14995f94b89a9785`
- productDigest：`sha256:40f5b7168bd436c3d904a91044cbf06993ee3839f1e7825651f18724e22a9022`

R34 fresh A/B 因 provider timeout 为环境 UNKNOWN，不能作为语义失败；本轮只交回实现，等待主管 fresh 重跑，不写 `accepted` 或行为 PASS。
