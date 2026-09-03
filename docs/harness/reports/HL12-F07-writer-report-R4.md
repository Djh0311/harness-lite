# HL12-F07 writer report R4

status: reported_complete

本轮按主管意见完成 candidate 身份一致性与物化测试修复：

- candidate-only builder 在设置 `HARNESS_LITE_CANDIDATE_VERSION=0.12.0` 时，同时修补嵌入 `package.json` 和 `lib/install.js` 当前 `VERSION/SOURCE_COMMIT`；`PREVIOUS_11_SNAPSHOT` 常量保持 0.11 历史身份不变。
- F07 测试物化全部 candidate files，断言 runtime `VERSION/SOURCE_COMMIT` 及 fresh install ownership manifest 均为 0.12.0；`HL12_F07_ARTIFACT`、`HL12_F07_BEHAVIOR` 支持源码与物化 root 外部只读路径。
- docs/harness/artifacts 只保留最终 candidate `harness-lite-0.12.0-8c9bc085744357f1c778a674192745b10c13c18f9f00f6fe4300b23f586a41ec.json` 与独立 behavior artifact（旧中间 candidate 已移出）。

最终 candidate：1,385,770 bytes；51 files；14 product JS；candidateDigest=`sha256:8c9bc085744357f1c778a674192745b10c13c18f9f00f6fe4300b23f586a41ec`。两次 build `cmp` 逐字节一致并等于 retained artifact。

行为 A/B：当前无真实模型 connector，八类场景保持 `UNKNOWN`，没有模拟或关键词 PASS。

验证：`node --test test/hl12-f07-candidate.test.js`（外部双路径）2 pass；`npm test` 179 tests，178 pass，0 fail，1 existing scope skip。未真实安装、全局改写、发布或触碰宿主。
