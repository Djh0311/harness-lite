# HL12 F06 writer report R51

status: reported_complete

## Candidate

基于 F05 R50 accepted 后的当前 working copy 重建了新的 0.12 candidate，未覆盖
旧 dba60/R44 或 70e669/R47：

- `docs/harness/artifacts/harness-lite-0.12.0-ef33cf10d2f28ed57be76d22994cbe701cc81b69927f582773ed4e8dc0122db3.json`
- candidate SHA-256：`sha256:ef33cf10d2f28ed57be76d22994cbe701cc81b69927f582773ed4e8dc0122db3`
- bytes：`1,541,698`；files：`55`；product JS：`14`
- fileDigest：`sha256:2ab1ac97352fd969cbedd4e68ba6a4268f47a0b361d41318d9439a1bfe66ef0b`
- productDigest：`sha256:4f3e34659d01056242694e655c6be331acfe2467426dda16a740a7d832a82d2b`

两次 `HARNESS_LITE_CANDIDATE_VERSION=0.12.0 node scripts/build-candidate.js`
输出逐字节一致。

## F06 formal Hook

source 与 materialized candidate 均通过正式 SessionStart：

- 无 delegation ledger：两个独立 unit 输出完整 `ParallelWorkUnitsCarrier`，
  `count=2; ids=A,B`，无 UNKNOWN/leaf-fallback。
- 只写 A 的 rejected lifecycle row、B 未登记：仍输出 A/B 完整包，未绕过
  accepted-only。
- malformed delegation carrier 保持 UNKNOWN/fail-closed；普通 leaf fallback、
  依赖锁、active+runnable 和 1800 字符预算回归通过。

## F07 行为评测

用新 candidate 运行正式 evaluator（Codex `gpt-5.6-sol`、Grok `grok-4.6`，
隔离 temp cwd/read-only/plan/no-subagents，PORACODE 环境为空）：96/96 成功调用、
32/32 cells 各 3/3；1 条 provider/format failure 单独记录。Frozen rubric 结果
为真实 `FAIL`，不宣称行为 PASS，也未生成 F08 attestation。

candidate-bound 证据：

- `...-ef33cf10...-behavior.json` SHA `db042c36c7a9b2757faf199559fa5ea10c30c7bfcdebe936648eace368708530`
- `...-ef33cf10...-invocation-ledger.json` SHA `f01ba0928f863c1f30f74b985fb37bce7ca888d43941d43eadc1fffea4332fd1`

两份证据均绑定 candidate SHA `sha256:ef33cf10...`，旧 dba60/70e669 行为与
attestation 文件保持原样。

## 测试

- F03/F06/F07 定向：26/26 PASS
- 全量 `npm test`（绑定 ef33cf candidate）：211/211 PASS，0 fail，0 skip

未真实安装到全局、未写 `/home/synadmin/.codex`、未 push/tag/release/deploy，
未触碰 Poracode/watchdog/bridge；临时评测目录已清理。
