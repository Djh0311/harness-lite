# HL12 F07 writer report R28

status: reported_complete

R28 将行为 PASS 门槛与 attestation 同时绑定：即使外部签名有效，只要 matrix、样本数、rubric、parity 或 strict metrics 任一失败，结果也不会 PASS。无签名/无 fresh96 仍 UNKNOWN。该状态仅表示代码交回，不代表 F07 accepted。

最终候选为 `harness-lite-0.12.0-70cdbbd1e09c362779436077d495814b3ec94501dfeb940281de7a12afd25e6b.json`，1,490,718 bytes，55 files/14 product JS，双 build 一致。当前无 fresh96/attestation，行为仍 UNKNOWN。
