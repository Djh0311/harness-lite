# HL12-F07 writer report R11

status: reported_complete

本轮完成 F07 行为评测接线与候选一致性收口，未宣称 accepted；没有真实全局安装、宿主改写、push、tag、release 或 deploy。

## 实际修改

- `test/hl12-f07-behavior-evaluator.js`（SHA-256 `be29fbbc65553a29a87fc9f5527299af5eed7cd7b0b5427d9778918143cbc59c`）：持久化真实模型 A/B 评测器。使用 Codex `gpt-5.6-sol` 与 Grok 请求模型 `grok-4.6`，固定 8 场景、0.11/0.12 guidance 配对，每格最多补采样至 3 个成功调用；隔离临时 cwd、read-only/plan、禁 subagents，清空 `PORACODE_HOOK_URL`/secret/thread。只保存响应摘要、digest、盲评分字段与失败类别，不保存完整 prompt/transcript。旧版不支持的 intent 映射到 closest supported event；push 两版本使用相同显式 gate 文本。
- `test/hl12-f07-candidate.test.js`：行为 artifact 支持 UNKNOWN/PASS/FAIL 三态；PASS/FAIL 必须有 2 家族、32 cells、每格至少 3 次和候选 identity（digest/bytes/files/product JS）校验；候选文件数随持久化 evaluator 更新为 52。
- `docs/harness/artifacts/harness-lite-0.12.0-behavior.json`：记录本轮 96 个成功真实调用、13 个 transport 重试失败、逐样本摘要与版本盲评分结果（按 evaluator 最新规则重算 hard-risk 非适用字段）。结论为 `FAIL`（调用数达标，但 0.12/0.11 盲评分未达产品门槛；少量 Sol 的 direct-progress/single-focus 不稳定），没有把模型结果伪装成 PASS。
- 唯一 0.12 candidate：`harness-lite-0.12.0-dd17891c7099e7a7ba2aa9687b61c9836e9137dc3137cddab37d48bd80cf8499.json`。候选 SHA-256 `sha256:dd17891c7099e7a7ba2aa9687b61c9836e9137dc3137cddab37d48bd80cf8499`，1,417,079 bytes，52 files / 14 product JS；fileDigest `sha256:827f372080769cf8f740d4aa21fed97b33f96dff4e788b8e010991c9b5d7577e`，productDigest `sha256:6d290c19ff4ca07158b19c79eb44014632fc3c1398635700ab53393650ec37d4`。双 build 逐字节一致，artifact identity 已绑定 behavior report。

## 证据与测试

- `node --check test/hl12-f07-behavior-evaluator.js test/hl12-f07-candidate.test.js`：通过。
- `node --test test/hl12-f07-candidate.test.js`：3/3 pass（确定性构建、行为 artifact 合同、0.11 retained → 显式 upgrade → uninstall 用户字节恢复）。
- `npm test`：180 tests，179 pass，0 fail，1 个既有 scope skip。
- 行为评测 source：2 families × 2 versions × 8 scenarios × 3 successful calls = 96；artifact `status=FAIL`，`successfulSamples=96`，`failures=13`，无 PASS 声明。失败/评分明细与 candidate identity 在 behavior artifact 中可复核。

## 已知边界

真实模型行为评测证明了当前接口可调用并完成 96 个成功样本，但盲评分揭示模型在部分场景（主要是 hard-risk 结构化字段和少量 single-focus/direct-progress）不稳定，因此 F07 行为门槛仍 FAIL；这不是产品代码被自动修改或绕过门槛的理由。需主管独立复核后决定是否返修 guidance 或保持 FAIL。
