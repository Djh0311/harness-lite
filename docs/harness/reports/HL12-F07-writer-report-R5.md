# HL12-F07 writer report R5

status: reported_complete

Candidate-only runtime routing修复：在物化 0.12 `lib/install.js` 的 `inspect()` 中显式识别 `PREVIOUS_11_SNAPSHOT.runtimeVersion`，先走 `verifyPrevious11Snapshot`；因此 retained 0.11 manifest 在未授权升级时可被识别为 previous-11，upgrade 门槛和历史 0.9/0.10/0.11 常量保持不变。当前 runtime VERSION/SOURCE_COMMIT 与 package/manifest 仍为 0.12.0。

重新构建后只保留：

- `harness-lite-0.12.0-f728ce1057f935451a17fe45d5b964540611ef168461778864b392ed434341e8.json`（1,386,442 bytes；51 files；14 product JS；candidateDigest `sha256:f728ce1057f935451a17fe45d5b964540611ef168461778864b392ed434341e8`）
- `harness-lite-0.12.0-behavior.json`

两次 build 逐字节一致；F07 外部 artifact/behavior 路径测试 2 pass；`npm test` 179 tests，178 pass，0 fail，1 existing scope skip。行为 A/B 因无真实 connector 继续 UNKNOWN，未模拟 PASS。未真实安装、全局改写、发布或触碰宿主。
