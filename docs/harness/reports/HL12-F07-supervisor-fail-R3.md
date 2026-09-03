# Harness Lite 0.12 HL12F07 supervisor review R3

日期：2026-09-02（Asia/Shanghai）  
work unit：`HL12F07 — behavior evaluation, candidate and supervisor acceptance`  
复核对象：R3 当前工作树；writer report `HL12-F07-writer-report-R3.md`

## 结论

**FAIL，返回同一 owning unit 继续 R4。**

R3 已修好“物化测试找不到外部 artifact/behavior 文件”的边界：主管带两个外部只读路径
重放 F07 测试，源码和物化目录都能 2/2 通过。但候选包仍只是把外层 metadata 和
`package.json` 改成 0.12.0，真正执行的 runtime 身份没有升级，因而不能称为 0.12
candidate。

## 主管独立证据

### 1. 已通过的部分

- 用 `HL12_F07_ARTIFACT` 和 `HL12_F07_BEHAVIOR` 物化运行 F07 两个测试：2 pass、0 fail、
  0 skip；
- 两次 `HARNESS_LITE_CANDIDATE_VERSION=0.12.0 node scripts/build-candidate.js` 逐字节
  相同并匹配 R3 retained artifact `sha256:14a33dd9f822aa3b545b21e04304ab0b92ce069487d169c3083151c5b5347fba`；
- artifact 为 1,383,078 bytes、51 files、14 product JS；outer package 和嵌入的
  `package.json` 都显示 0.12.0；
- 行为报告仍诚实为 8 场景 `UNKNOWN`，没有模拟或关键词冒充模型结果。

### 2. 决定性版本身份失败

当前 working copy 的 `lib/install.js`（SHA-256
`ec606aeae25bfdd5ca43469e691e2c36251792b58ca6f811666721714a810511`）直接导出：

```text
VERSION = 0.11.0
SOURCE_COMMIT = working-copy:0.11.0-candidate
```

主管把 0.12 artifact 解包到 disposable source，并调用其自己的 `lib/install.js`；
再在 disposable project 做 fresh install。结果是：

```text
runtime API VERSION       = 0.11.0
runtime API SOURCE_COMMIT = working-copy:0.11.0-candidate
installed manifest.runtimeVersion = 0.11.0
installed manifest.sourceCommit    = working-copy:0.11.0-candidate
```

这与 artifact 的 0.12.0 package metadata 相矛盾。它还会让正式的 managed/anchor/dispatcher
身份继续按 0.11 路径判断；不是测试写法问题，而是物化 candidate 实际行为仍是 0.11。

### 3. 中间 candidate 未收束

`docs/harness/artifacts/` 当前同时有三个带 64 位 digest 的 0.12 candidate：

```text
harness-lite-0.12.0-be88eb96...json
harness-lite-0.12.0-acd0f7ef...json
harness-lite-0.12.0-14a33dd9...json
```

这会让 retained candidate 选择和独立复核的对象不唯一。旧 0.10/0.11 retained artifact
和历史报告不能删；但 F07 最终 retained 0.12 应只保留一个明确身份，behavior 报告另存。

## R4 最小返修要求

1. 使物化 0.12 candidate 的真实运行时身份一致为 0.12.0（包括 `lib/install.js` 导出、
   `SOURCE_COMMIT`、fresh/managed install 生成的 manifest、external anchor、dispatcher
   读回）；不要只改 JSON 外壳。保留 official 0.9、0.10、0.11 的历史识别和升级输入，
   不要把它们重标成 0.12。
2. 在 F07 允许的测试范围补上可重放的 source + materialized identity/fresh-install
   断言，并迁移确实属于当前版本的旧 0.11 硬断言；不得删测试、加 skip 或放宽安全语义。
3. 重新生成唯一 retained 0.12 artifact，清理上述两个中间 0.12 candidate，保留
   0.10/0.11 retained 和所有 FAIL/报告历史；重新核对文件名 digest、bytes、files/
   product JS 及外层/内层版本。
4. 重新物化并跑 F07、六个 CEX、三个保证、fresh/0.9/0.10/0.11 upgrade/uninstall
   必需矩阵，关键项 0 skip、0 fail。行为 A/B 若仍无两个真实模型家族，继续记 UNKNOWN，
   不得冒充 PASS；F08 在 F07 accepted 前不得启动。

