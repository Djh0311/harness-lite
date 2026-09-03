# HL12-F07 writer report R7

status: reported_complete

新增正式 migration regression：外部 retained 0.11 artifact 物化为 previous source，candidate 0.12 物化为当前 source；创建 disposable project 写入用户原始 `AGENTS.md`，执行旧安装，candidate `inspect()` 识别 `previous-11-snapshot`，`upgrade:false` 保持 HOLD/零写，`upgrade:true` 成功安装。随后断言 runtime VERSION/SOURCE_COMMIT、ownership manifest、verify06、已安装 dispatcher 均为 0.12；uninstall 后用户字节逐字节恢复且 runtime/CLAUDE/rollback 残留清零。

F07 测试通过外部 `HL12_F07_ARTIFACT` 与 `HL12_F07_BEHAVIOR` 可在物化 candidate 运行。最终 candidate 只保留：

`harness-lite-0.12.0-ded2d3d192e1d40aae2abf83d94728c539909fd46fb49392c0a9fdef402b0f1b.json`

1,390,258 bytes；51 files；14 product JS；candidateDigest=`sha256:ded2d3d192e1d40aae2abf83d94728c539909fd46fb49392c0a9fdef402b0f1b`。两次 deterministic build 逐字节一致。

验证：F07 外部路径 3 pass；`npm test` 180 tests，179 pass，0 fail，1 existing scope skip。行为 A/B 无真实 connector，仍为 UNKNOWN，未模拟 PASS。未真实安装到全局、发布或触碰宿主。
