# Harness Lite 0.12 HL12F04 独立复核 R3：FAIL

日期：2026-09-02（Asia/Shanghai）

复核范围：`lib/capabilities.js`、`test/hl12-f04-capability-freshness.test.js`、F04 writer report R3，以及临时目录中的恶意输入。此次只读复核没有修改产品代码、测试、delegation、真实全局配置或宿主进程。

## 结论

`FAIL / NOT ACCEPTED`。

正常 F04/R3 定向测试通过，但恶意类型审计仍有未处理异常，因此不能仅凭绿测接受 F04。

复核时产品文件 SHA-256：

- `lib/capabilities.js`: `eed4536c3452f11f4226277e13fdb381728ba97eea6eecd96a1b7a7362153965`
- `test/hl12-f04-capability-freshness.test.js`: `cccaaffa26995faf6cb8e1891072b0711e7e280ce30651106fe10ce33a3b9278`

## 已通过的直接检查

运行：

```text
node --test test/hl12-f04-capability-freshness.test.js \
  test/r3-capability-carrier.test.js test/nv02-capabilities.test.js \
  test/r2-capability-visibility.test.js test/fix03-joined-runtime.test.js
```

结果：`19 pass / 0 fail`。

直接确认：

- carrier `schemaVersion` 改写、缺失 binding、错误 project、错误 source 会降级；
- nested `provenance.binding` 的错误 project/session/turn/event/source/type 会降级；
- 非法 `now` 返回 `invalid-freshness-now`；
- 错误 binding 不创建 carrier 目录；
- R3 五模型、二十四模型、超大输入和 unsafe carrier directory 回归通过；
- 静态项目 capability 文件即使自述 freshness/provenance/binding，也返回 `UNKNOWN`。

## 决定性失败证据

### 1. 顶层 `binding: null` 会抛未处理异常

在 synthetic `mkdtemp` 项目中调用：

```js
capabilities.project(root, {
  writeDynamicCarrier: true,
  eventName: 'UserPromptSubmit',
  sessionId: 's',
  turnId: 't',
  now: '2026-09-02T00:00:00Z',
  manifest: {
    schemaVersion: 1,
    kind: capabilities.KIND,
    models: [{ channel: 'x', model: 'm', reasoning: 'high' }],
    binding: null,
  },
});
```

实际异常：

```text
TypeError: Cannot convert undefined or null to object
    at Function.hasOwn (node:internal)
    at bindingValue (lib/capabilities.js:128)
```

要求应是返回 `UNKNOWN`/`binding-shape-mismatch`，且不写 carrier；当前是直接抛异常。`binding: 3`、字符串、数组、布尔值已经能降级，但 `null` 这个常见恶意 JSON 类型仍穿过 `bindingValue()`。

### 2. carrier projection 的恶意类型仍需保持异常安全

此前对 carrier 做了内部 digest 和文件名同步伪造，将 `projection.models` 改成 `null`，可在旧 R3 快照中触发：

```text
TypeError: Cannot read properties of null (reading 'length')
```

当前读回代码已经增加 `Array.isArray(value.projection.models)` 和模型形状检查；该项在当前定向复核中已不再复现。但它说明 carrier 反例必须保留在验收证据中，不能只测普通篡改（普通篡改会先被 projection digest 拦截）。

## 其他恶意类型结果

对 Hook manifest 的 `null`、`undefined`、数字、字符串、数组、函数等顶层 manifest 值，当前可降级为 `UNKNOWN` 且不写 carrier。

对 `provenance` 的数字、字符串、数组、布尔值、函数，当前新代码可返回 `provenance-shape-mismatch` 且不写 carrier；合法普通对象仍按当前 binding 规则处理。

因此本轮 FAIL 的剩余决定性缺口是顶层 `binding: null` 的未处理异常。该问题必须修复并重新跑上述定向测试、no-write 反例和全量 source suite；在修复前不能标记 F04 accepted，也不能解锁后续 F05/F06。

## 边界确认

- 没有真实安装、push、tag、release、deploy；
- 没有读取或写入 `/home/synadmin/.codex` 的真实全局配置；
- 没有杀死、重启或干扰 Poracode、watchdog、bridge；
- 临时目录均在复核结束后精确清理；
- 本报告是独立复核结果，不是 accepted，也不启动后续 work unit。
