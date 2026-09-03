# HL12F06 writer report R6

状态：`reported_complete`（R5 FAIL 后返修，等待主管验收）

- 长 sentinel 统一转换为有界原文或 `sha256:` token，CompletionCarrier/ParallelWorkUnitsCarrier 不再把长 sentinel 塞进 620 字符后再截断。
- aggregate carrier 的 complete/truncated 继续读取真实 context/packageList/carrier 状态；digest 覆盖完整 canonical package projection。
- 新增 8 个长 standards/design/facts unit 压力测试，验证 carrier 长度、无 ellipsis、count/digest/sentinel。

验证：`node --check lib/hook.js`；F06 定向 7/7；全量 174 tests / 160 pass / 13 fail / 1 skip。旧失败均为历史 0.11/R2/R3 wire 断言冲突，未删改或放宽。

当前 SHA：`lib/hook.js ca018050379759060f64cc742023e5ef20928d7905f53e1b593e838cbc20adb7`；`test/hl12-f06-joined.test.js 97f972fc38e58b5321057bc88cfc0f9760b781a0f70782802a0b0fdf850c0905`。

未改 dispatcher（F02 accepted hash 保持），未真实安装、全局修改、push/tag/release/deploy，未启动 F07。
