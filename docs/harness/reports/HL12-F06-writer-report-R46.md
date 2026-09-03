# HL12 F06 writer report R46

status: reported_complete

本轮接回 R44 失败路由，在 F03 R45 已接受修复的基础上完成 F06 正式接线复核，
并为 F07 新 candidate 提供 source/materialized 证据。未修改 F06 公共接线逻辑。

## 正式 SessionStart 证据

- source runtime：当前 leaf 声明两个独立、无依赖、完整 standards 的 unit，
  delegation.json 不存在；`hook.sessionStart` 输出
  `ParallelWorkUnitsCarrier`，`count=2`、真实 `ids=A,B`，包内容可从
  `work.parallelWorkUnitContext` 读取，未出现 UNKNOWN/leaf-fallback。
- source runtime：同一 leaf 只记录 A 的 rejected lifecycle row，B 未登记；
  accepted-only 仍不被绕过，正式 SessionStart 仍输出 A/B 两个完整包。
- materialized 0.12 candidate：通过已安装 dispatcher 重放上述两条路径，输出
  与 source 相同的 count/ids 和完整 package carrier。
- malformed delegation JSON：继续 UNKNOWN/fail-closed，不投影静态 package；
  普通无 work-unit leaf fallback、依赖 accepted-only、active+runnable、1800
  字符预算回归均通过。

## 验证命令

- `node --check lib/work.js test/hl12-f03-work-unit-truth.test.js test/hl12-f07-candidate.test.js`
- `HL12_F07_ARTIFACT=docs/harness/artifacts/harness-lite-0.12.0-70e6699721e99612f666da21d7945fb8ad44e69c08a047cc9dbc92d17da92621.json node --test test/hl12-f03-work-unit-truth.test.js test/hl12-f06-joined.test.js test/hl12-f07-candidate.test.js`：26/26 PASS
- `npm test`：210/210 PASS，0 fail，0 skip

## 边界

旧 `harness-lite-0.12.0-dba60...json` 保留作 R44 FAIL 历史身份；本轮未覆盖或
删除它，也未改 retained 0.10/0.11、真实全局文件、Poracode 宿主或发布状态。

