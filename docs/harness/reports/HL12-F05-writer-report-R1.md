# HL12F05 writer report R1

状态：`reported_complete`（实现者报告；不自称 `accepted`）

日期：2026-09-02

## 判断

判断：F05 的 guidance helper 已把九类事件收敛为一个可验证的 decision package；怎么确认的：先用最小复现证明旧 `select()` 在多事件时只拼接并列 fragments，再由新增定向测试和全量 suite 直接检查单一决策、事件优先级、完整载体、push 命中与 malformed 降级。

## 实际写入

只写了 F05 授权范围内的文件：

- `lib/guidance.js`
- `skills/split-work.md`
- `skills/root-cause.md`
- `test/hl12-f05-guidance.test.js`
- 本报告

未修改 `lib/hook.js`、`lib/install.js`、dispatcher、CLI、candidate、真实全局配置或宿主进程；未启动 F06。

## 产品结果

- `INTENTS` 保留并允许九个事件：`leaf-definition`、`route-clarification`、`pre-dispatch`、`agent-active`、`agent-reported`、`problem-recovery`、`leaf-closeout`、`legacy-fact`、`push-attempt`。
- `select()` 对事件集合做稳定规范排序，并按固定优先级选出唯一 `decisionEvent`；面向模型的 `decision` 只有一个 `focus`、`decisionQuestion`、`nextAction`，并带当前相关 `stateFacts` 与 `hardBoundaries`。
- `events`、`fragments`、`text` 仍保留给 0.11 调用兼容；fragments 仅是兼容视图，`text` 不再拼接旧规则片段。
- `completionCarrier` 原样携带 leaf 的 goal、全部 completion standards、authority design 和 facts，提供 `complete`、`truncated`、`carrier`、序列化长度及前/后 sentinel。超过显式预算时标记 `external-required`，不静默 tail-cut。
- push-attempt 只在显式 intent/结构化 gate 输入时出现；真实 gate 可结构化表达动作、目标、既有边界、风险和用户决定，普通路径不带 push 提示或新增确认。
- malformed chain/summary/options 返回确定性的 UNKNOWN/空事件结果，不因 Harness 自身异常抛出未处理错误；completion standards 任一 UNKNOWN、空值或非字符串均不视为完整。
- 两个 skill 改为只提供短方法，并引用运行时 decision package；保留 activity/progress、accepted/evidence、heartbeat、失败恢复和“用户目标清楚就直接继续”等既有边界，不新增事件总线、规则库、provider、daemon 或完整 prompt 持久化。

## 验证命令

定向与兼容回归：

```text
node --check lib/guidance.js
node --test test/hl12-f05-guidance.test.js test/hl11-event-upgrade.test.js test/nv03-hook-work.test.js
```

结果：23 tests，23 pass、0 fail。

最终全量：

```text
npm test
```

结果：164 tests，163 pass、0 fail、1 existing skip（`R3F03 active indexes ...`，因 source candidate 不含 local lifecycle documents；未由 F05 新增或放宽）。

## 文件摘要

```text
lib/guidance.js                         12238 bytes  sha256:f7b748fb8407e7e24ba800c28bf86dd49aa25356819c848693d42e03d36f06b0
skills/split-work.md                     1484 bytes  sha256:49891962447ffba76ba62583b66592b791612ef5b1a5c5565ff55130275c4634
skills/root-cause.md                     1520 bytes  sha256:17b62a40d46f27f94bca3130b7a48cf9643aff95046ec305445011d167149be0
test/hl12-f05-guidance.test.js           5188 bytes  sha256:12d15f0ce2535b69f9df59f3449e6fdb288cff967670a3df4446d9583076b1dd
```

## 已知边界

- 当前正式 Hook 仍由 F06 负责接线；本 unit 只改 helper、skills 和结构测试，因此不能据此声称 installed Hook 已经把新 `decision` 接到宿主上下文。
- 真实模型 A/B、candidate、migration/uninstall 和六个双向反例的 joined 证明留给后续 owning units。
- 兼容字段仍会被旧 Hook 读取；在 F06 接线前，旧 Hook 的 `Guidance[event]` 行仍可能出现，这是已知集成边界，不是本 unit 对产品最终接线的声明。

## 停点

实现已完成并报告 `reported_complete`，等待主代理独立读回、独立测试和验收；不启动后续 work unit。
