# HL12F06 writer report R8

状态：`reported_complete`（R8 migration scope；等待主管验收）

产品修复：aggregate carrier 现在明确输出短 IDs（或 idsDigest/count）、真实 ref/readApi/count/digest/有界 sentinel；digest 基于完整 package projection。单 unit 长字段改用真实 leaf/tree carrier。canonical/digest 异常安全降级为 UNKNOWN/incomplete，不抛出。

迁移：按 R8 范围机械更新了旧 0.11 instruction、Guidance fragment、remaining 和 oversize complete 断言，保留原安全/完整性意图，未恢复废弃语义或删除测试。

验证：F06 定向 8/8 pass；`npm test` 175 tests / 168 pass / 6 fail / 1 skip。剩余 6 项为压力场景旧生命周期可见性断言与新 essential wire 的明确取舍，以及个别 R2/R3 inline 断言；详见主管复核。未真实安装、全局修改、push/tag/release/deploy；dispatcher 未改。

当前 `lib/hook.js` SHA：`0bae5ac80289b97e8903528f8effe331f4c3693a390bfe7fa93568fb146a9d48`；`test/hl12-f06-joined.test.js` SHA：`4ebb2c712b99583eceb1cb74d711393d299e5aae93c55abcc3b3c6b46f70a04f`。
