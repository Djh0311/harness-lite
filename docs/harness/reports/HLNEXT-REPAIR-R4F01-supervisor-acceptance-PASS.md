# HLNEXT-REPAIR R4F01 supervisor acceptance — PASS

日期：2026-09-01（Asia/Shanghai）

结论：`PASS / R4F01 ACCEPTED / CANDIDATE INPUT STABLE / NOT PUSHED / NOT RELEASED`。

## Direct acceptance

- `NEXT-VERSION-DISPATCH-PLAN.md` 仍进入 canonical candidate；顶部现在只描述稳定的历史冻结用途和 candidate 外治理边界。
- 顶部无具体 SHA-256、`candidateDigest`、`fileDigest`、`productDigest`、artifact bytes/file counts、R3/R4 live lifecycle 或具体 current/done/report authority path。
- R01-R18 精确区段保持 4772 bytes，`sha256:1a69fc8dbbef7304938b9da1f20af9daf47f6b24b131b6d8861c8c906d66a719`。
- 专用测试证明：旧 b164/self-referential 顶部会被拒绝；docs/harness-only mutation 不改 artifact；NEXT 或其他真实 candidate input mutation 必须改变 bytes、candidateDigest 与 fileDigest；没有 hash 字段豁免或内容忽略。
- `scripts/build-candidate.js` 未修改；新增 `test/r4-candidate-closeout.test.js` 后 candidate 输入如实为 40 files / 13 product JS。

## Supervisor rebuild

- `node --test test/r4-candidate-closeout.test.js`：4/4 PASS。
- 项目根两次独立 CLI build byte-identical。
- 当前 candidate digest：`sha256:d73f4b4f83e6034e33168995c24ca4514d69bcd70ccc19f8aa255da42d218daa`。
- artifact bytes：`1061071`。
- fileDigest：`sha256:a380b16c8fc1ddafa0371aa37d8e0a3815576aeaae3e7d94156402204c615acd`。
- productDigest：`sha256:73f9ac6f54d863a5093144e165c17825ac9ba3560309d4382ecd3e8393ebda3e`。

该 digest 是 R4F01 输入修复后的当前可重建摘要，不在 R4F03 持久封存与主管 acceptance 前称为 R4 final accepted candidate。

R4F01 direct acceptance PASS 后，stable problem `candidate-closeout-reproducible-artifact-binding` 的当前问题租约按 acceptance_pass 清除；历史有效失败计数仍保留，Terra/Sol 未触发。

未修改 `docs/harness/**` 治理实现、历史 R1/R2/R3 载体、Git provenance 或 external memory；未 push/tag/release/deploy，未干扰 Poracode/watchdog/bridge。
