# Harness Lite 0.12 HL12F05 独立复核 R1：FAIL

日期：2026-09-02（Asia/Shanghai）

复核范围：当前 F05 的 `lib/guidance.js`、`skills/split-work.md`、`skills/root-cause.md`、F05 专测、F05 writer report 和计划要求。复核只读；除本报告外没有修改产品代码、测试、delegation、真实全局配置或宿主进程。

## 结论

`FAIL / NOT ACCEPTED`。

九事件、正常多事件排序、正常 completion carrier、push gate 正常正例、旧兼容字段和现有测试都基本通过，但“malformed/no-throw”仍有决定性缺口，且结构化 push gate 的触发边界不完整。

当前实现文件 SHA-256：

- `lib/guidance.js`: `f7b748fb8407e7e24ba800c28bf86dd49aa25356819c848693d42e03d36f06b0`
- `skills/split-work.md`: `49891962447ffba76ba62583b66592b791612ef5b1a5c5565ff55130275c4634`
- `skills/root-cause.md`: `17b62a40d46f27f94bca3130b7a48cf9643aff95046ec305445011d167149be0`
- `test/hl12-f05-guidance.test.js`: `12d15f0ce2535b69f9df59f3449e6fdb288cff967670a3df4446d9583076b1dd`

## 测试结果

定向命令：

```text
node --test test/hl12-f05-guidance.test.js \
  test/hl11-event-upgrade.test.js test/nv03-hook-work.test.js
```

当前 F05 专测及相关回归通过：`23 pass / 0 fail`（writer report 的定向口径）。本次独立重新运行的 F05/R3/R2/FIX03 组合定向为 `19 pass / 0 fail`；全量命令：

```text
npm test
```

结果：`164 tests; 163 pass / 0 fail / 1 existing scope skip`。

绿测没有覆盖下列 malformed 输入。

## 决定性失败证据

### 1. malformed `summary.accepted` 会抛异常

命令：

```js
guidance.select(null, { summary: { accepted: {} } }, {});
guidance.select(null, { summary: { accepted: 3 } }, {});
```

实际异常分别为：

```text
object is not iterable (cannot read property Symbol(Symbol.iterator))
number 3 is not iterable (cannot read property Symbol(Symbol.iterator))
```

原因是 `stateEvents()` 直接执行 `new Set(summary.accepted || [])`，没有先确认 `accepted` 是数组。

这违反 F05 writer report 自己声明的“malformed summary 返回确定性 UNKNOWN/空事件结果，不抛未处理错误”。最小修复是非数组 `accepted` 按空数组处理；字符串也不能被当成字符集合，否则可能误触发 `leaf-closeout`。

### 2. completion carrier 对恶意循环值会抛异常

构造 `chain.leaf.authorityDesign=[circularObject]`、`facts=[circularObject]` 或 `completionStandards=[circularObject]` 后调用：

```text
guidance.select(chain, { summary: {} }, {})
```

实际异常：

```text
Converting circular structure to JSON
```

原因是 `completionCarrier()` 无条件执行 `JSON.stringify(result)` 计算 `serializedChars`。

即使正常项目文件来自 JSON、通常不会带循环引用，F05 明确要求 malformed/no-throw；直接 helper 输入仍应 fail-closed，不能把 Harness 自身异常抛给宿主。最小修复是对 carrier 序列化做安全捕获并返回 `complete=false`、`truncated=true`、`carrier=external-required` 或确定的 `UNKNOWN`，不能抛异常。

### 3. malformed events/options 仍可能抛异常

命令：

```js
guidance.select(null, null, { events: [{}] });
guidance.select(null, null, { events: [3] });
guidance.select(null, null, { intent: {} });
```

实际均抛：

```text
unknown guidance intent: [object Object]
unknown guidance intent: 3
```

已有 0.11 兼容测试要求未知字符串（例如 `spawn-now`）继续抛 `unknown guidance intent`，因此最小修复不应放宽该旧字符串断言；应至少让非字符串 malformed intent/event 降级为空/UNKNOWN，而不是调用 `String()` 后当成意图抛异常。

### 4. 结构化 gate 单独输入会被物理忽略

使用完整结构化 gate：

```js
const gate = {
  action: 'push', target: 'origin/main', boundary: 'existing',
  risk: 'remote change', userDecision: 'allow?',
};
guidance.select(null, { summary: {} }, { pushGate: gate });
guidance.select(null, { summary: {} }, { gate });
```

两次结果都是：

```text
events=[]
decisionEvent=null
```

计划和 writer report 写的是 `push-attempt` 只在“显式 intent/结构化 gate 输入”时出现。当前实现只有在已经选中 `push-attempt` 后才读取 gate，因此“结构化 gate 输入”单独不能触发真实 gate 说明。

按当前文字，这应补成：完整结构化 gate 本身可以产生 `push-attempt`；不完整 gate 不产生 push 内容。若产品决定“必须显式 intent 才触发”，则必须把计划和 writer report 的“结构化 gate 输入”口径改清楚，并新增反例测试。

## 已通过的边界

- `INTENTS` 保留九事件；全九事件显式输入仍只产生一个 `decisionEvent`、一个 focus、一个 decisionQuestion 和一个 nextAction；乱序多事件结果确定性一致；
- completion standards 缺失、空值、非字符串或 `UNKNOWN` 会使 carrier `complete=false`；显式小预算会标记 `truncated=true`、`external-required`，不静默截尾；
- 普通 guidance 不含 push 内容；完整 push gate 正例会结构化输出动作、目标、边界、风险和用户决定；
- `events/fragments/text` 等旧字段仍保留，旧 `spawn-now`/`not-allowlisted` 字符串拒绝兼容通过；
- skill 文件只保留短方法，未新增事件总线、规则数据库、provider、daemon、完整 prompt 持久化或扩大硬风险；
- 未发现 F05 写面之外的产品文件修改。

## 最小返修项

1. `stateEvents()` 对 `summary.accepted` 做数组形状保护，malformed summary 返回空事件而不是抛异常；
2. `completionCarrier()` 对序列化失败 fail-closed，不抛异常；
3. 对 malformed 非字符串 intent/event 做 UNKNOWN/空事件降级，同时保留旧未知字符串的兼容拒绝；
4. 明确并实现结构化 push gate 单独输入的触发合同，补充完整/不完整 gate 的直接测试。

修复后需重新跑 F05 专测、旧兼容回归、全量 suite 和上述恶意输入。F05 在主管独立验收前保持 active，不解锁 F06。

## 边界

本轮没有真实安装、push、tag、release、deploy；没有读取或写入 `/home/synadmin/.codex`；没有杀死、重启或干扰 Poracode、watchdog、bridge；没有改动任何产品或测试文件。
