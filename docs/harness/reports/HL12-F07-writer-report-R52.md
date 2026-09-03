# HL12 F07 writer report R52

status: reported_complete

本轮只做新 `ef33cf10…` candidate 的证据绑定核对和 scorer 重放，没有修改产品、
旧 behavior/receipt/attestation 或 retained artifact。

## Candidate-bound evidence

- Candidate：`harness-lite-0.12.0-ef33cf10d2f28ed57be76d22994cbe701cc81b69927f582773ed4e8dc0122db3.json`
- Candidate digest：`sha256:ef33cf10d2f28ed57be76d22994cbe701cc81b69927f582773ed4e8dc0122db3`
- Candidate identity：1,541,698 bytes，55 files，14 product JS；
  `productDigest=sha256:4f3e34659d01056242694e655c6be331acfe2467426dda16a740a7d832a82d2b`
- Raw behavior：`...ef33cf...-behavior.json`，SHA
  `db042c36c7a9b2757faf199559fa5ea10c30c7bfcdebe936648eace368708530`
- Invocation ledger：`...ef33cf...-invocation-ledger.json`，SHA
  `f01ba0928f863c1f30f74b985fb37bce7ca888d43941d43eadc1fffea4332fd1`

两份 evidence 内 candidate identity 均精确绑定上述 ef33cf digest；raw evaluator
记录 96/96 successful calls、32 cells 各 3/3，原始结果为 `FAIL`（不是环境
UNKNOWN）。旧 70e669/dba60 evidence 未覆盖、未重绑。

## Scorer replay

执行：

```text
HL12_F07_REPLAY=...ef33cf...-behavior.json
HL12_F07_LEDGER=...ef33cf...-invocation-ledger.json
HL12_F07_RECEIPTS=<不存在的隔离临时路径>
HL12_F07_ATTESTATION=<不存在的隔离临时路径>
HL12_F07_BEHAVIOR_OUT=<隔离临时输出>/scored.json
node test/hl12-f07-behavior-scorer.js
```

结果：`status=UNKNOWN`，`successfulSamples=96`、`cells=32`。原因是缺可信外部
receipts/independent attestation；scorer 没有把 raw FAIL 或旧 receipt 当作 PASS。
Scored 输出 SHA-256：
`53c948a7b48bf24e50cdc22bc8dd6e038f5b6a555a4f593d9106d63de5a049b6`。

本轮未生成 F08 attestation，未安装、未写全局、未 push/tag/release/deploy，未碰
Poracode/watchdog/bridge；scorer 临时目录已清理。
