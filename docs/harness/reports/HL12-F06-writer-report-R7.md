# HL12F06 writer report R7

状态：`reported_complete`（R6 FAIL 后返修）

aggregate carrier digest 现直接对 `unit.package`（即 `tree.workUnitPackages` 返回的完整 package projection）做递归 key-sort canonical JSON，再计算 SHA-256；没有在 Hook 层手工挑字段。无 package 的测试 fixture 才回退完整 unit 对象。carrier 保留 ids/count/ref/readApi/digest/有界 sentinel。新增字段变更会导致 digest 变化的测试。

定向：`node --check lib/hook.js`；F06 8/8 pass。未删改旧测试，未真实安装或发布，dispatcher 未改。

SHA：`lib/hook.js 0400c15f7cb31ac0427c8a4ff855f4b0e0fb5c06eff406ffa0a91f228651d25c`；`test/hl12-f06-joined.test.js 6902771f1a8ebe80e93186172df1a9fd605a3f0bea82dab7c8a0dbb186633c0b`。
