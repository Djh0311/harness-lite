# HL12F06 writer report R9

状态：`reported_complete`（R8 FAIL 后返修）

- 极端 pushGate 压力下，过长 gate 不再半截显示；改为明确 `complete=false;inline=false;truncated=true` 的安全引用，保留 ref、digest 和五字段名。
- 必需并行/完成 carrier 使用有界 start/middle/end sentinel，避免长 sentinel 经普通预算器截断。
- 并行 carrier IDs/count/ref/readApi/digest 保持可核验；短 ID 直接列出，长 ID 用 digest/count。
- F06 定向测试新增并通过：8/8。

本轮未删除或放宽测试，未改 guidance helper/dispatcher，未真实安装、全局修改、发布或碰宿主。全量旧 wire 迁移状态由主管复核继续处理。

SHA：`lib/hook.js f5cf6ebd29e3a55f894d3476bbe62ffb87ffa7de6acbc988ba58305cea91d1c3`；`test/hl12-f06-joined.test.js c0e3b04791524066bd34e1796a31bc766dd4102586610832cb711e2daa5d6dbf`。
