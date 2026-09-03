# HL12F05 writer report R2

状态：`reported_complete`（返修实现者报告；不自称 `accepted`）

日期：2026-09-02

## 判断

判断：R1 主管验收指出的 malformed 输入和 push gate 边界已最小修复；怎么确认的：逐项构造非数组 summary、循环/BigInt/非字符串 carrier 字段、非字符串 events、完整/不完整 gate，并运行 F05、兼容和全量测试。

## R2 修复

- `stateEvents`/`eventFacts` 对 `accepted`、`runnable`、`active`、`reported`、recovery 等非数组或异常对象只按空值处理，不把字符串或对象当 work-unit ID，也不向宿主抛异常。
- `completionCarrier` 使用安全字符串列表；正常字符串原样保留（包括首尾空格），异常值变为 `UNKNOWN` 并使载体不完整。循环、BigInt 等不可序列化内容不会抛出；载体带稳定 `sha256` 摘要、条目 sentinel、`complete/truncated/carrier` 标志。
- 非字符串 `intent/events` 降级为空事件；原有未知字符串 intent（如 `spawn-now`）仍拒绝，保持旧合同。
- 完整结构化 `pushGate`/`gate` 单独传入时自动触发 `push-attempt` 和唯一决定，并在人话说明中包含动作、目标、既有边界、风险、用户决定。不完整 gate 不产生 push 内容；普通路径没有 push 提示或新增确认。
- mixed `UNKNOWN` completion standards 不再被视为完整或可派发。

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
lib/guidance.js                         15108 bytes  sha256:bbd8de439e1dd4041c7f0a5233939aff3f7e3c7461346b1a9089eaad586432f6
skills/split-work.md                     1484 bytes  sha256:49891962447ffba76ba62583b66592b791612ef5b1a5c5565ff55130275c4634
skills/root-cause.md                     1520 bytes  sha256:17b62a40d46f27f94bca3130b7a48cf9643aff95046ec305445011d167149be0
test/hl12-f05-guidance.test.js           7303 bytes  sha256:4cee8d35a40b2fd2f4f8b9da0ac9d1cca8c7070d943993d4649718100be69bda
```

## 已知边界

- 正式 Hook 接线、current instruction、installed runtime 和真实模型行为仍归 F06/F07；本 unit 不声称新 decision 已进入宿主最终上下文。
- R2 只证明 helper/skills 结构和现有 source suite；不能替代六个 joined 反例、迁移、candidate 或独立 reviewer。
- 旧 Hook 在 F06 接线前仍可能读取兼容 `fragments` 并显示旧行，这是已知集成边界。

## 停点

返修已完成，状态仍为 `reported_complete`，等待主代理和独立 reviewer 重新验收；不启动 F06。

> 注：R2 文件摘要是 R2 当时的历史快照；R3 对 carrier 预算和直接 helper 边界做了最小后续返修，当前源码与最新摘要以 `HL12-F05-writer-report-R3.md` 为准。
