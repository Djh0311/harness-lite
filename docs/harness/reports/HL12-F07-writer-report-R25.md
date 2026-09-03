# HL12 F07 writer report R25

status: reported_complete

R25 修复 R24 迁移后的测试契约文字，并保留外部 attestation 门槛：没有独立 supervisor/F08 attestation 时 scorer 继续 UNKNOWN，不能本地自证 PASS。最终候选在源码稳定后双 build 一致：`harness-lite-0.12.0-2b01fa98b048cbb4855db7c70da50bf0eb6c7e38ec9b07dfc2e5243bf0e14464.json`，1,487,081 bytes，55 files/14 product JS，fileDigest `sha256:088a2622a393dd7a3033287b0c45d03f48f9175475d6a1b77675f30e5420f594`，productDigest `sha256:6d290c19ff4ca07158b19c79eb44014632fc3c1398635700ab53393650ec37d4`。

F07 scorer/schema 定向测试通过；当前无真实 attestation/fresh 96，行为保持 UNKNOWN。
