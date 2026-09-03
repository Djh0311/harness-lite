# HL12 F07 writer report R29

status: reported_complete

R29 修复 scorer 同路径覆盖风险：即使 `HL12_F07_BEHAVIOR_OUT=input`，也会自动改写到独立 `.scored.json`，原始 behavior 字节不变。验签公钥继续只来自外部 `HL12_F07_ATTEST_PUBKEY`，无 key/无签名/错签名均 UNKNOWN；ledger provider 与 family/command 精确绑定。F07 reported_complete 后由独立 F08 fresh replay 产生签名 attestation，再由 scorer 读取，避免生命周期死结。

最终候选：`harness-lite-0.12.0-cbd9b012322ef03eabc1de1ba734069a3a00f34700fc4d0907f2971255e3a737.json`；1,491,586 bytes；55 files/14 product JS；双 build 一致。无 fresh96/attestation，行为保持 UNKNOWN。
