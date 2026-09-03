# Harness Lite 0.12 HL12F07 supervisor acceptance PASS R43

日期：2026-09-03（Asia/Shanghai）
work unit：HL12F07 — behavior candidate supervisor handoff
复核对象：HL12F07 writer R42、当前 working copy、唯一 0.12.0 offline candidate
独立复核：HL12-F08-independent-product-review-R43.md

## 结论

**PASS，接受 HL12F07；接受 dba60 作为当前唯一 0.12.0 source candidate。**

本结论只表示当前 source、物化 candidate、行为证据和外部 F08 attestation 同时满足本 leaf 的完成标准。它不表示真实安装、Git commit、push、tag、release、deploy，也不自动关闭 stage/leaf 或启动 0.13。

## 1. Candidate 身份

候选文件：
docs/harness/artifacts/harness-lite-0.12.0-dba60a222f87b1e222861ffb851c03542113018668dc0d44814286ba9e6322d2.json

- candidate SHA-256：sha256:dba60a222f87b1e222861ffb851c03542113018668dc0d44814286ba9e6322d2
- bytes：1523554；files：55；product JavaScript：14
- fileDigest：sha256:737b306010bee5c1d5b56faf2679b78735ef4e54610883e05055288f793af725
- productDigest：sha256:40f5b7168bd436c3d904a91044cbf06993ee3839f1e7825651f18724e22a9022
- candidate package version：0.12.0
- Git authority：none（当前目录不是 Git repository）

主管用 HARNESS_LITE_CANDIDATE_VERSION=0.12.0 连续构建两次；两份输出都等于 dba60，逐字节与 retained candidate 相同。候选测试同时覆盖物理 file rows、0.11→0.12 显式升级和卸载恢复。

retained 历史 artifact 未改动：
- 0.10：sha256:d73f4b4f83e6034e33168995c24ca4514d69bcd70ccc19f8aa255da42d218daa
- 0.11：sha256:8e14e641b7d0fe3641a5e74c49b11a60761e0dc63fb75866ff8226e6b3687ae5

## 2. Source、物化 candidate 与反例

主管独立运行当前 source：
- npm test：207 pass / 0 fail / 0 skip
- hl12-f00-counterexamples：13 pass / 0 fail / 0 skip

又从 dba60 的 55 个 file rows 新建 disposable materialized root
/tmp/hl12-final-materialized-main-9tOalt，只注入 retained 0.10/0.11 和本轮 0.12 evidence；同两组测试结果仍为 207/0/0 与 13/0/0。

13 项 CEX 覆盖六个决定性坏路径、六个对应正常正例和原有 push hard-risk freeze：全局根零读零写、coherent tamper 拒绝与降级、ghost unit、multi-runnable carrier、stale capability、精确 uninstall/rollback 均未发现反例。F01/F02 的 fresh、managed、official 0.9/0.10/0.11 upgrade、anchor、rollback 和 instruction bytes 恢复也通过。

没有向真实 /home/synadmin/.codex 写入内容；真实全局 AGENTS.md 仍为 434 bytes，SHA-256 为
a060f3cc75512b49e5e4c605841cbad47eda4028ce53251e11d199e8c629e0ae。

## 3. Fresh 真实模型 A/B 与 blind receipts

fresh 证据目录：/tmp/hl12-final-eval-dba60-hMZ5gv/。当前 artifact 目录中的证据 SHA-256：

- behavior.json：sha256:106adcc3466e09fae8170246b29054f326890575d38658742bd7f74cdc5e2f8a
- invocation-ledger.json：sha256:60f12430e19307b22a801777d2d0950a8c4068072d4ade0c46c86aac6fa6f983
- blind-receipts.json：sha256:ce16fcf9cbf9c9d629a13f5cc21719b18e30e9d3e99039df7186395fbdbe1d18
- behavior-scored.json：sha256:76507e3af48f87440ad3db7ccb658ff9767bf3239203e1a471da7a269e6549e1
- attestation.json：sha256:8ee5b7b9a1f96f3ff7b7acb62abd51b4900cd9a40e51f4e8e85c9f091c492f64
- attestation-key.json：公钥副本（仅用于复验，不进入 candidate）

behavior 有 96/96 个成功样本、32 个 canonical cells。两家族（Sol、Grok）的全部 16 个 0.12 cells 都是 3/3；盲审收据 reviewed=96/required=96、failures=0，六个 adversarial checks 为 6/6，五个预期 FAIL 与一个 hard-positive PASS 均正确。

原 evaluator 中保留的 3 个 provider transport timeout 是旧 0.11 对照诊断，不是 0.12 成功样本缺失；补足后 ledger 和 blind receipts 完整。旧基线低分没有被改绿，scored 单独记录 baselineRubricObserved=false，只用于 0.11→0.12 对照。

评分器重新读回 canonical artifact 输出：
status=PASS；successfulSamples=96；cells=32；receiptsBinding.valid=true；candidateRubricGate=true；
matrixExact=true；sampleCountExact=true；firstActionNotLower=true；completionNotLower=true；
nuisanceStrictlyLower=true；governanceStrictlyLower=true。

严格对照数值：
- firstAction：0.11=42，0.12=48
- completion：0.11=43，0.12=48
- unnecessaryQuestion：0.11=4，0.12=0
- governance：0.11=4，0.12=0

## 4. 外部 F08 attestation

未参与实现的 reviewer 直接读取 dba60、fresh behavior/ledger/receipts，并独立重跑 source 与物化 suite，报告为
docs/harness/reports/HL12-F08-independent-product-review-R43.md
报告 SHA-256：sha256:31a299a3ed47a4a38dcdc0d4a95171b36b67f0e1758b5568a2e0d69910556c2b。

使用在 reviewer 看到最终证据前已生成并承诺的 Ed25519 公钥：
- fingerprint：sha256:bc03b6bd671c556afca7badf333c26fe1a421302788188ce22e640e114de2ea4
- reviewerId：hl12-f08-independent-reviewer-bc03b6bd
- method：independent-supervisor-f08
- status：PASS

公钥 PEM 的可复验副本（不含私钥）为：
docs/harness/artifacts/harness-lite-0.12.0-attestation-key.json

主管独立重算 candidate、behavior、ledger、receipts、scorer 的 SHA-256，确认 payload 逐字一致，并用该公钥验签为 true。当前 scorer 对复制后的 canonical artifact 仍输出 PASS。签名私钥未写入 workspace/candidate，也未发送。

## 5. 范围和后续停点

- 本轮只接受 offline source candidate 和证据，不声称安装、commit、push、tag、release、deploy。
- 没有真实安装到项目或全局根，没有修改真实全局 AGENTS.md。
- 没有触碰 retained 0.10/0.11、历史 plans/reports/done（本报告和 R43 独立报告除外）。
- 没有获取、合成、恢复或验收 0.6–0.8 runtime。
- 没有杀死、重启或干扰 Poracode、watchdog、bridge。
- 旧 R30–R41 FAIL/UNKNOWN 和 R42 writer report 保留；本 PASS 不覆盖历史失败，只接受当前 dba60 最新证据。
- 当前 live stage/leaf 保持不变，尚未执行 archive/closeout；不自动开始 0.13。

因此 HL12F07 主管验收为 PASS，F08 R43 独立复核为 PASS，dba60 是当前唯一被接受的 0.12.0 candidate。任何真实安装或发布动作都需要用户另行明确授权。
