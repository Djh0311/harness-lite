# Harness Lite 0.12 HL12F06 主管验收 R51：PASS

日期：2026-09-03（Asia/Shanghai）

## 结论

**PASS。** 这是主管对 F06 在 F05 R50 accepted 后的全新 candidate 重建和
正式 Hook 接线的验收。行为评测仍是独立的 F07/F08 门槛，本报告不把 raw
evaluator 的 FAIL 改成 PASS，也不代替独立产品复核。

## Candidate 身份

- 文件：`docs/harness/artifacts/harness-lite-0.12.0-ef33cf10d2f28ed57be76d22994cbe701cc81b69927f582773ed4e8dc0122db3.json`
- candidate SHA：`sha256:ef33cf10d2f28ed57be76d22994cbe701cc81b69927f582773ed4e8dc0122db3`
- 大小：`1,541,698` bytes；`55` files；`14` product JavaScript files
- fileDigest：`sha256:2ab1ac97352fd969cbedd4e68ba6a4268f47a0b361d41318d9439a1bfe66ef0b`
- productDigest：`sha256:4f3e34659d01056242694e655c6be331acfe2467426dda16a740a7d832a82d2b`

主管用相同 `HARNESS_LITE_CANDIDATE_VERSION=0.12.0` 独立运行两次 build，两个
输出逐字节相同，candidate SHA 均为上述值。旧 `dba60`、`70e669` 和 retained
0.10/0.11 artifact 没有被覆盖。

## CEX-04 正式 Hook 复核

主管直接运行当前源码和物化 candidate 的定向测试（`26/26 PASS`），并读回
正式 `SessionStart`：

- 无 delegation ledger：两个已声明、无依赖、完成标准完整的 runnable unit 都在
  `ParallelWorkUnitsCarrier` 中，`count=2`、`ids=A,B`，各自最小完整包存在，
  没有 `UNKNOWN/leaf-fallback`。
- 只有 A 的 `rejected` ledger row、B 未登记：仍投影 A/B 两个完整包；rejected
  不会被当作 accepted，也不会解锁依赖。
- malformed ledger、普通 leaf fallback、accepted-only、active+runnable 和
  1800 字符预算仍 fail-closed/保持既有语义。

## 绑定证据和测试

F06 writer 重新生成的 candidate-bound 行为/调用证据为：

- behavior：`...ef33cf10...-behavior.json`，
  `sha256:db042c36c7a9b2757faf199559fa5ea10c30c7bfcdebe936648eace368708530`
- invocation ledger：`...ef33cf10...-invocation-ledger.json`，
  `sha256:f01ba0928f863c1f30f74b985fb37bce7ca888d43941d43eadc1fffea4332fd1`

两份文件的 candidate digest 都绑定到 `ef33cf...`；真实 evaluator 为 Codex
`gpt-5.6-sol` + Grok `grok-4.6`，`96/96` 成功样本、`32/32` cells 各 `3/3`，
另有一条 provider/format failure 如实保留。raw frozen rubric 是 FAIL，尚无
F08 attestation，故不提前宣称行为通过。

主管另跑：

- `HL12_F07_ARTIFACT=<ef33 candidate> node --test test/hl12-f03-work-unit-truth.test.js test/hl12-f06-joined.test.js test/hl12-f07-candidate.test.js`：`26/26 PASS`。
- `HL12_F07_ARTIFACT=<ef33 candidate> npm test`：`211/211 PASS`、`0 fail`、`0 skip`。

## 范围边界

本轮未真实安装、未写 `/home/synadmin/.codex`、未 push/tag/release/deploy，未
触碰 Poracode、watchdog、bridge；临时目录已清理。没有修改旧报告或旧证据，
也没有增加日常命令、确认步骤、风险类别、provider、daemon 或第二授权系统。

## 接受决定

F06 R51 满足 candidate 重建、正式 Hook 两路径和回归测试完成标准，记为
`accepted`，允许 F07 对 `ef33cf...` 继续做行为证据收口。F07/F08 必须使用
该新 candidate 的新绑定证据；旧 candidate 的证据不能顶替。
