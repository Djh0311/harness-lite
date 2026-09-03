# HL12 F07 writer report R46

status: reported_complete

## 新 candidate

- 文件：[harness-lite-0.12.0-70e6699721e99612f666da21d7945fb8ad44e69c08a047cc9dbc92d17da92621.json](../artifacts/harness-lite-0.12.0-70e6699721e99612f666da21d7945fb8ad44e69c08a047cc9dbc92d17da92621.json)
- candidate SHA-256：`sha256:70e6699721e99612f666da21d7945fb8ad44e69c08a047cc9dbc92d17da92621`
- bytes：`1,539,790`
- files：`55`
- product JavaScript：`14`
- fileDigest：`sha256:1f8af188252807f3119b1a48a0202caffe519bf859ede61fce0e5606ca2ebd33`
- productDigest：`sha256:d0a31f1d9c97d80a171f04a7005667e47c8abb6e50136bfb9ec0569c1af4b3b3`

两次使用 `HARNESS_LITE_CANDIDATE_VERSION=0.12.0` 构建逐字节一致；新物化
candidate 的 runtime、manifest、anchor 均识别为 0.12.0。candidate test 的
0.11 retained upgrade / uninstall、source 与 materialized formal SessionStart
均通过。旧 dba60 candidate 保留为 R44 FAIL 历史，不参与新证据选择。

## 测试结果

- F03/F06/F07 定向：26/26 PASS，0 skip。
- 全量 `npm test`：210/210 PASS，0 fail，0 skip。
- 行为 artifact/attestation 未重新生成；本轮没有新鲜 A/B 模型调用或新的外部
  attestation，因此不宣称行为 PASS。

未真实安装到全局，未 push/tag/release/deploy，未触碰 `/home/synadmin/.codex`
或 Poracode 宿主。

