# HL12-F07 writer report R54

status: `reported_complete`

本轮是 F08 R53 独立 PASS 证据的候选绑定保留，不重新运行模型、不修改产品代码或 candidate，不宣称 F07/F08 最终 acceptance。R53 临时证据目录为 `/tmp/hl12-r53-evidence-ljpgPu`，目标 candidate 为：

`harness-lite-0.12.0-ef33cf10d2f28ed57be76d22994cbe701cc81b69927f582773ed4e8dc0122db3.json`

candidate identity：`sha256:ef33cf10d2f28ed57be76d22994cbe701cc81b69927f582773ed4e8dc0122db3`；1541698 bytes，55 files，14 product JavaScript files。旧 dba60/70e669 和 generic/历史 evidence 均未覆盖、未删除。

## 原样保留的三份 R53 文件

以下文件由临时目录逐字节复制，目标 SHA 与源文件核对一致：

| candidate-specific 文件 | 源文件 | bytes | SHA-256 |
| --- | --- | ---: | --- |
| `docs/harness/artifacts/harness-lite-0.12.0-ef33cf10d2f28ed57be76d22994cbe701cc81b69927f582773ed4e8dc0122db3-blind-receipts.json` | `/tmp/hl12-r53-evidence-ljpgPu/receipts.json` | 125992 | `sha256:e5c56084078e7464c6c13aeadbb3e3a92103542d9c7ca48748de9986ca429960` |
| `docs/harness/artifacts/harness-lite-0.12.0-ef33cf10d2f28ed57be76d22994cbe701cc81b69927f582773ed4e8dc0122db3-attestation.json` | `/tmp/hl12-r53-evidence-ljpgPu/attestation.json` | 935 | `sha256:3e9ce65fa175d503dcb64befbf812045edabf02ba55ae9f33200ad6d3eac9d7b` |
| `docs/harness/artifacts/harness-lite-0.12.0-ef33cf10d2f28ed57be76d22994cbe701cc81b69927f582773ed4e8dc0122db3-behavior-scored.json` | `/tmp/hl12-r53-evidence-ljpgPu/scored-attested.json` | 288688 | `sha256:7087126510f4c957af7f354745ea5117a8c2fc9af283fe786150c401eb78be2f` |

源/目标 SHA 由 `sha256sum` 逐项核对；未重序列化、格式化或改写 JSON。R53 attestation payload 绑定 candidate、behavior `sha256:db042c36c7a9b2757faf199559fa5ea10c30c7bfcdebe936648eace368708530`、ledger `sha256:f01ba0928f863c1f30f74b985fb37bce7ca888d43941d43eadc1fffea4332fd1`、receipts `sha256:e5c56084078e7464c6c13aeadbb3e3a92103542d9c7ca48748de9986ca429960` 和 scorer `sha256:b3806ca715c7024239c944c4352fee8fd979d646a0cbbbcef5e990c1d6edfe1c`。

## R53 公钥副本

新增：

`docs/harness/artifacts/harness-lite-0.12.0-ef33cf10d2f28ed57be76d22994cbe701cc81b69927f582773ed4e8dc0122db3-attestation-key.json`

该 JSON 只包含 R53 reviewer 公钥和 candidate 绑定信息，`privateKeyPresent: false`；私钥未写入 workspace/candidate。公钥 fingerprint 为 `sha256:8458c509a7fb5ceb3a996321dd2efbd48abf84db2875c3bd21d5428a631c1168`，与 R53 登记文件及 Ed25519 公钥 DER 重算一致。副本 SHA 为 `sha256:c4ccc97b122322649bca9f5a65249266a40bf26224dddfc5aab814bdd8537ea5`。

本轮仅新增上述四个 candidate-specific artifact 和本报告；没有安装、全局写入、push/tag/release/deploy，也没有接触 Poracode/watchdog/bridge。最终 F07 状态和生命周期由主管独立验收决定。
