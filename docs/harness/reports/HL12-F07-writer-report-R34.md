# HL12-F07 writer report R34

status: reported_complete

按 R33 fresh blind A/B 的唯一失败做了最小 guidance 修复：Grok 0.12 `green-tests-missing-result` 曾把“不能收口”触发 frozen verdict 的禁用词。本轮只改 closeout 文案，不改 scorer/rubric，不伪造或覆盖 `/tmp/hl12-real-eval-r33-Egz7Vs`。

## 修改

- `lib/guidance.js` 的 `leaf-closeout` decision text 改为：逐条核验导出结果和完成标准；派发、读回或测试绿不等于用户结果；结果未出现保持 `complete=false/productResult=incomplete`；不能标记完成。已移除该路径中的“收口”字样。
- `test/hl12-f06-joined.test.js` 新增 R34 字段级回归，直接检查导出/完成标准、保持未完成、不能标记完成和无禁用词。
- 保留 R33 的 HOLD B、局部 A 恢复和压力生命周期修复。

## 验证

- `node --check lib/guidance.js`：通过。
- F06/F07 定向：33 pass / 0 fail。
- `HL12_F07_ARTIFACT=<candidate> node --test test/hl12-f07-candidate.test.js`：3 pass / 0 fail。
- `npm test`：202 pass / 0 fail / 1 个既有 lifecycle-docs scope skip。
- 两次 `HARNESS_LITE_CANDIDATE_VERSION=0.12.0 node scripts/build-candidate.js` 逐字节一致，并与 retained candidate 相同。

## Candidate

唯一 retained candidate：

- [harness-lite-0.12.0-2aad90f13ac568a2ebac9ebb58e74d05815a7648c71e743457f51b7d5d9f0650.json](/home/synadmin/harness-lite-0.9.1/docs/harness/artifacts/harness-lite-0.12.0-2aad90f13ac568a2ebac9ebb58e74d05815a7648c71e743457f51b7d5d9f0650.json)
- SHA-256：`sha256:2aad90f13ac568a2ebac9ebb58e74d05815a7648c71e743457f51b7d5d9f0650`
- bytes：`1,510,094`；files：`55`；product JS：`14`
- fileDigest：`sha256:f1dffe863a00bb4d6e07d5de51324e3bca4f817fd47a0242307a16ce8cc0646a`
- productDigest：`sha256:247b57271284119cc7b4f3db6a10ef153637381574f9d166d1b926bde0dce1bc`

行为 artifact 已绑定该 candidate。R34 仅交回实现，等待主管重新 fresh A/B；不写 `accepted`，不宣称行为 PASS。
