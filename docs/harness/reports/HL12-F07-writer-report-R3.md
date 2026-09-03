# HL12-F07 writer report R3

status: reported_complete

修复物化 candidate 测试的外部证据路径：`HL12_F07_ARTIFACT` 指定 retained candidate，`HL12_F07_BEHAVIOR` 指定行为结果；源码默认使用当前 docs artifact。模块顶层不再无条件扫描不存在的物化目录，且没有加 skip 或删除断言。

验证命令：

```text
HL12_F07_ARTIFACT=$PWD/docs/harness/artifacts/harness-lite-0.12.0-14a33dd9f822aa3b545b21e04304ab0b92ce069487d169c3083151c5b5347fba.json \
HL12_F07_BEHAVIOR=$PWD/docs/harness/artifacts/harness-lite-0.12.0-behavior.json \
node --test test/hl12-f07-candidate.test.js  # 2 pass
npm test                                      # 179 tests / 178 pass / 0 fail / 1 existing scope skip
```

Candidate 两次 build 逐字节一致；最新 artifact candidateDigest=`sha256:14a33dd9f822aa3b545b21e04304ab0b92ce069487d169c3083151c5b5347fba`，51 files / 14 product JS。行为 A/B 因无真实 connector 继续 UNKNOWN，未冒充 PASS。未真实安装、全局改写、发布或触碰宿主。
