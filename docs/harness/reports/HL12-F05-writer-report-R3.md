# HL12F05 writer report R3

状态：`reported_complete`（返修实现者报告；不自称 `accepted`）

日期：2026-09-02

## 判断

判断：R2 主管验收指出的 carrier 预算边界和直接 helper 异常边界已修复；怎么确认的：安全序列化后重新计算最终载体大小，测试 exact-boundary；直接调用 `stateEvents`、循环/BigInt 字段、非数组 summary 和完整/不完整 push gate 全部跑恶意 probe。

## R3 修复

- `completionCarrier.serializedChars` 现在包含 digest、完整元数据和自身数字字段，使用固定点计算，显式 `maxChars` 的等界/少一字节边界均正确；超限后重新计算最终 external-required 载体大小。
- `stateEvents` 导出函数自身加 fail-closed 包装；坏 summary、Proxy/getter、非数组 accepted 等只产生空事件，不抛异常。
- 其他 R2 修复保持：安全字符串列表保留正常输入原文；异常结构转 `UNKNOWN`/incomplete；非字符串 intent/events 忽略而未知字符串 intent 仍拒绝；完整 gate 单独输入触发 push-attempt，五项说明只在完整 gate 出现。

## 写面与边界

只改原 F05 写面：

- `lib/guidance.js`
- `skills/split-work.md`
- `skills/root-cause.md`
- `test/hl12-f05-guidance.test.js`
- 本报告

未修改 Hook、install、dispatcher、CLI、candidate、真实全局配置；未启动 F06；未干扰宿主进程。

## 验证命令

```text
node --check lib/guidance.js
node --test test/hl12-f05-guidance.test.js test/hl11-event-upgrade.test.js test/nv03-hook-work.test.js
npm test
```

结果：定向 26 tests，26 pass、0 fail；全量 167 tests，166 pass、0 fail、1 existing skip（R3F03 active indexes，source candidate 不含 local lifecycle documents，非本次新增）。

## 文件摘要

```text
lib/guidance.js                         15759 bytes  sha256:de676f51f76515b3556770018262996d4dc661a069c98163d109eef34bf7f59e
skills/split-work.md                     1484 bytes  sha256:49891962447ffba76ba62583b66592b791612ef5b1a5c5565ff55130275c4634
skills/root-cause.md                     1520 bytes  sha256:17b62a40d46f27f94bca3130b7a48cf9643aff95046ec305445011d167149be0
test/hl12-f05-guidance.test.js           7642 bytes  sha256:d2aa0823f2094d0e0d0d2434261d41c75d8837a77bbbda3b739372de288d63b5
```

## 已知边界

- 正式 Hook 接线、current instruction、installed runtime 和真实模型行为仍归 F06/F07；本 unit 不声称新 decision 已进入宿主最终上下文。
- R3 只证明 helper/skills 结构和现有 source suite；不能替代六个 joined 反例、迁移、candidate 或独立 reviewer。
- 旧 Hook 在 F06 接线前仍可能读取兼容 `fragments` 并显示旧行，这是已知集成边界。

## 停点

返修已完成，状态仍为 `reported_complete`，等待主代理和独立 reviewer 重新验收；不启动 F06。
