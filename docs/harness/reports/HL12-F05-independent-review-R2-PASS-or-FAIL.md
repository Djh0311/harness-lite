# Harness Lite 0.12 HL12F05 独立复核 R2：PASS

日期：2026-09-02（Asia/Shanghai）

复核对象：F05 R3 writer report 对应的当前实现。复核重新从当前文件开始，没有沿用 R1/R2 结论；只读检查，除本报告外没有修改产品代码、测试、delegation、真实全局配置或宿主进程。

## 唯一结论

`PASS`（F05 helper/skills 范围；不是 F06 joined integration、F07 candidate 或最终 0.12 收口）。

当前文件 SHA-256：

- `lib/guidance.js`: `de676f51f76515b3556770018262996d4dc661a069c98163d109eef34bf7f59e`
- `skills/split-work.md`: `49891962447ffba76ba62583b66592b791612ef5b1a5c5565ff55130275c4634`
- `skills/root-cause.md`: `17b62a40d46f27f94bca3130b7a48cf9643aff95046ec305445011d167149be0`
- `test/hl12-f05-guidance.test.js`: `d2aa0823f2094d0e0d0d2434261d41c75d8837a77bbbda3b739372de288d63b5`
- `docs/harness/reports/HL12-F05-writer-report-R3.md`: `945cead6523ba0455c60765f5560e778dd109118e574617f7b54dfc64bbdf4bb`

## 测试证据

运行 `node --check lib/guidance.js`，通过。

运行 `node --test test/hl12-f05-guidance.test.js test/hl11-event-upgrade.test.js test/nv03-hook-work.test.js`，结果 `26 tests; 26 pass / 0 fail`。

运行 `npm test`，结果 `167 tests; 166 pass / 0 fail / 1 existing scope skip`。唯一 skip 是既有 R3F03 source candidate 不含 local lifecycle documents，不是 F05 新增或放宽。

## 独立对抗性复核

### malformed accepted、循环值和 BigInt

直接调用 `select`、导出的 `stateEvents`、`decisionFor`、`completionCarrier`：

- `summary.accepted={}`、`3`、字符串、null：均返回空事件，不抛异常，也不会误触发 `leaf-closeout`；
- `authorityDesign`、`facts`、`completionStandards` 含循环对象：不抛异常，异常条目转为 `UNKNOWN`；completion standards 异常时 `complete=false`；
- `authorityDesign` 含 BigInt：不抛异常，转为 `UNKNOWN`；
- malformed recovery、Proxy/getter、非数组 runnable/active/reported：不抛异常，按空值处理。

### 非字符串 intent/events

`{events:[{}]}`、`{events:[3]}`、`{intent:{}}`、`{intent:3}` 均得到 `events=[]、decisionEvent=null`，没有异常。旧兼容的未知字符串 intent（如 `spawn-now`）仍按原合同抛出 `unknown guidance intent`，相关旧测试通过。

### 结构化 push gate

完整的 `gate` 或 `pushGate` 单独输入会得到 `events=["push-attempt"]、decisionEvent="push-attempt"`，并输出动作、目标、边界、风险和用户决定。缺任意必需字段时，push gate 物理缺席；普通路径没有 push 提示或新增确认。显式 `intent:'push-attempt'` 没有完整 gate 时只保留当前决策，不伪造 `pushGate` 说明，符合当前合同。

### completion carrier 精确预算和保真

- `serializedChars` 与最终 `JSON.stringify(carrier).length` 一致，包含 digest、元数据和自身长度字段；
- `maxChars === serializedChars` 保持 inline/未截断；`maxChars === serializedChars - 1` 标记 `truncated=true、carrier=external-required`；
- 小预算不会静默 tail-cut，完整 completion standards 和末尾 sentinel 仍保留；
- 目标、completion standards、authority design、facts 的正常首尾空格逐字保留；
- 缺失、空值、非字符串或 `UNKNOWN` completion standards 不会得到 `complete=true`。

### 九事件、多事件和无关语义

- 九个 allowlisted event 均可得到一个决定；
- 九事件全量或乱序输入结果确定性一致，只产生一个 `decisionEvent`、一个 focus、一个 decisionQuestion 和一个 nextAction；
- 多事件文本只呈现被选中的当前决定，不把 active、recovery、heartbeat 等无关语义拼进同级文本；兼容 `events/fragments/text` 字段仍保留供旧调用读取；
- 普通路径不带 push 内容，不新增确认；`agent-active` 的 300000ms 只读观察和 recovery 的既有分层说明仍保留在对应决定中。

## 范围核对

当前 F05 变更只落在计划允许的三个实现/skill 文件、F05 专测和 F05 reports。没有发现修改 `lib/hook.js`、`lib/install.js`、dispatcher、CLI、candidate、版本接线或其他 F05 禁止写面；没有新增事件总线、规则数据库、provider、daemon、完整 prompt 持久化或硬风险。

## 边界与后续

F05 PASS 只证明 guidance synthesizer、carrier 和两个 skill 的独立合同。正式 Hook/current instruction/installed runtime 接线仍由 F06，candidate 和行为评测由 F07，最终独立产品收口由 F08 负责。没有真实安装、push、tag、release、deploy；没有读取或写入 `/home/synadmin/.codex`；没有干扰 Poracode、watchdog、bridge。
