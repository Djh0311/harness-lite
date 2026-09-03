# HL12-F07 writer report R9

status: reported_complete

加强 migration regression：

- no-upgrade 使用 `write:true`，断言 `status=HOLD`、`kind=previous-11-snapshot`、`written=0`，并比较完整项目 snapshot 前后一致。
- upgrade 后核对 runtime/source、manifest 与 installation anchor（manifestDigest、sourcePackageDigest、anchorDigest）；已安装 dispatcher 通过实际执行并检查身份载荷。
- uninstall 后核对用户 instruction 字节精确恢复，runtime、anchor、rollback carrier、CLAUDE 及旧 marker 均无残留。
- 测试接受外部 `HL12_F07_ARTIFACT`/`HL12_F07_BEHAVIOR`，可在 source 和 materialized candidate 运行。

最终 candidate：`harness-lite-0.12.0-94985d33bb8ab0677e39a0f5d8506aceba59e6e062db6d51d81b9a4f8edf1680.json`，1,392,042 bytes，51 files/14 product JS；两次 build 逐字节一致。行为 A/B 因无真实 connector 继续 UNKNOWN。

验证：F07 外部路径 3 pass；`npm test` 180 tests，179 pass，0 fail，1 existing scope skip。未真实安装到全局、发布或触碰宿主。
