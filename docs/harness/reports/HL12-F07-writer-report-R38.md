# HL12-F07 writer report R38

status: reported_complete

本轮只修复 `test/r3-joined-runtime.test.js` 中唯一的 lifecycle-docs scope skip。没有修改运行时产品代码、guidance、scorer、真实 `docs/harness` lifecycle 文件或 R01–R18 冻结正文；没有真实安装、模型评测、attestation、push、tag、release 或 deploy。

## 实际修改

新增 disposable lifecycle fixture helper。每次测试在临时 root 生成：

- `docs/harness/plan.md`（含 REQUIREMENT-BASELINE、current stage/leaf）
- `docs/harness/stages/stage-hlnext-repair-r3.md`
- `docs/harness/leaves/HLNEXT-REPAIR-R3.md`
- `docs/harness/reports/plan-review.md`（由 `tree.readChain` 读回 digest 后绑定）
- 从 candidate 自带的 `NEXT-VERSION-DISPATCH-PLAN.md` 复制冻结正文，并仅在临时副本顶部加入历史 R3 top 断言所需文字；冻结需求基线区段保持原字节

原有 chain、stage/leaf、authority/review digest、NEXT top、R01–R18 body digest 及无 closeout report 断言全部保留。fixture 在 `finally` 中递归精确清理。

## 测试结果

- `node --check test/r3-joined-runtime.test.js`：通过
- 源码工作区 `node --test test/r3-joined-runtime.test.js`：6 pass / 0 fail / 0 skip
- 物化 candidate `node --test test/r3-joined-runtime.test.js`：6 pass / 0 fail / 0 skip
- `npm test`：205 pass / 0 fail / 0 skip

## Candidate 身份

因测试文件进入 candidate，完成修改后重新双构建：两次输出 `cmp` 逐字节一致。当前唯一 0.12 candidate：

- SHA-256：`sha256:b556f36dc740031a878852e703425b09dd30352b8afc8fb37a2993343a16fc6a`
- bytes：1,519,698
- files：55
- product JavaScript：14
- fileDigest：`sha256:1a60d52c5c1339a1b2b453ac969b62c15dd0e4f4154e60cdbcf1836f05d4c403`
- productDigest：`sha256:40f5b7168bd436c3d904a91044cbf06993ee3839f1e7825651f18724e22a9022`

候选不包含上述 disposable lifecycle 文档；它们只在测试临时目录中生成。行为 A/B 及正式 F08 attestation 仍以独立 fresh replay 为准，本轮没有新增行为结论。
