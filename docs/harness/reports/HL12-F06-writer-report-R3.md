# HL12F06 writer report R3

状态：`reported_complete`（R2 主管 FAIL 后返修，等待独立验收）

## 本轮修复

- 长 completion carrier 不再硬编码完整状态：沿用底层 `carrier.complete` 和 `carrier.truncated`。含 UNKNOWN standards 的长 carrier 显式 `complete=false;truncated=true`；只有真实完整的外部 carrier 才保持完整。
- 多于两个 runnable/active unit 时使用单个整体 `ParallelWorkUnitsCarrier`，指向 current leaf 相对路径，声明 `readApi=tree.workUnitPackages`，并携带全部 unit payload 的 count/digest、首尾 sentinel 和 unit count。短包仍逐 unit inline；不会出现 `remaining=N` 或被通用 `fitLine` 尾截。
- 压力上下文压缩重复 lifecycle 元数据，保留 Decision、heartbeat 和 carrier；完成标准过长时使用安全 external ref，不输出 `...` 假完整。
- 新增 F06 测试：长 UNKNOWN carrier 状态、3-unit carrier 的真实 ref/readApi/count/digest/sentinel 校验。

## 验证

```text
node --check lib/hook.js
node --check lib/install.js
node --check bin/hl.js
node --check hooks/dispatcher.js
node --test test/hl12-f06-joined.test.js
6 tests / 6 pass / 0 fail / 0 skip
npm test
173 tests / 159 pass / 13 fail / 1 skip
```

剩余 13 个失败均为旧 0.11/R2/R3 wire 断言，要求废弃的 `Guidance[...]` 多段文本、`remaining=N` 或 oversize 场景出现 `complete=true`；未删除、跳过或放宽任何测试。F06 新合同要求单一 Decision、整体 carrier 和真实完整性状态，故这些历史断言与当前合同冲突，交主管决定是否迁移测试。

未运行真实安装、全局配置、push/tag/release/deploy；未启动 F07；未修改 F02 accepted 的 `hooks/dispatcher.js`（SHA `9db94a9904696e9bf1a88b9000805a5fd2fd5eda7f6d3b0308246fd911dde15b`）。

## SHA-256

```text
lib/hook.js                  ca189fb69271916768e47ea124399d949e1e9bb561da29837089f4c984271315
lib/install.js               bc1d6c468035e5412b4404affa4d8214ba265d95f0307c74cb93534886066aaa
bin/hl.js                    676dce1d4664c52f8c74f1c5796e8064d3097c6c5b72eca7541a3bcf6c8725f2
hooks/README.md              e8ec9787e2c71afd08a775fa28c62c88c6b0ee4e16260b5ae0d2d413484e3b4b
test/hl12-f06-joined.test.js 1ce57cb230a3e8eef672d75eab2348f18457f47b31c5566962f828d85c53a2b5
```
