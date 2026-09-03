# Harness Lite 0.12 HL12F04 独立复核 R5：PASS

日期：2026-09-02（Asia/Shanghai）

复核范围：R5 修复后的 `lib/capabilities.js`、F04 专测、R3 carrier 回归，以及三类恶意输入审计。本轮只读检查；只新增本报告，没有修改产品代码、测试、delegation、真实全局配置或宿主进程。

## 结论

`PASS`（R5 指定的独立恶意类型复核范围）。

R5 已修复 R3 发现的 `binding=null` 异常，且没有发现新的未处理异常或越过 F04 写面的行为。

当前复核的产品文件 SHA-256：

- `lib/capabilities.js`: `7c4b372a9ffd56a153c6d631821d48a5f8eeb516cced7ddb704398f63294a8eb`
- `test/hl12-f04-capability-freshness.test.js`: `c3454e9944fe7ce4d55aee4f4551279b86a0f4cc1bad09cfdba940899b87445b`

## 测试证据

定向命令：

```text
node --test test/hl12-f04-capability-freshness.test.js \
  test/r3-capability-carrier.test.js test/nv02-capabilities.test.js \
  test/r2-capability-visibility.test.js test/fix03-joined-runtime.test.js
```

结果：`19 pass / 0 fail`。

全量命令：

```text
npm test
```

结果：`158 tests; 157 pass / 0 fail / 1 existing scope skip`。

## 三类恶意输入复核

### 1. `binding` 为 null 或 primitive

使用当前 live Hook 绑定调用 `capabilities.project()`，分别传入：

```text
binding: null
binding: 3
binding: "x"
binding: []
binding: true
```

五种输入均得到：

```text
state=UNKNOWN
reason=binding-shape-mismatch
managedWrite=false
```

没有抛异常，也没有创建 `.codex` carrier 目录。R5 修复的 `bindingValue()` 顺序已确认生效。

### 2. malformed `provenance`

分别传入数字、字符串、数组、布尔值、函数和 null。所有输入均得到：

```text
state=UNKNOWN
reason=provenance-shape-mismatch
managedWrite=false
```

没有异常，也没有写入 carrier。合法对象形式的 nested `provenance.binding` 仍按 project/session/turn/event/source 逐项校验。

### 3. `projection.models` 为 null 或 object，并同步重算 digest/path

在临时 carrier 中将 `projection.models` 改为 `null` 或 `{}`，同时重算 `projectionDigest` 和 carrier 文件名，绕过普通 digest mismatch 的早期检查。

两种输入均得到：

```text
state=UNKNOWN
reason=invalid-carrier-shape
```

没有出现 `.length` 访问异常；数组类型检查在访问长度前生效。

## 其他边界确认

- `schemaVersion` 错误或缺失的 carrier fail closed；
- carrier 完整 binding（project/sessionId/turnId/eventName/source）及当前调用匹配通过；
- 非法 `now` 返回 `invalid-freshness-now`；
- 错误 binding 在写 carrier 前停止，保持 zero-write；
- 静态项目 capability 文件仍不能凭自述 freshness/provenance/binding 变成 `known/modelsComplete=true`；
- 5 模型、24 模型、超大输入、unsafe carrier directory 的动态回归通过；
- 未发现 F04 以外的公共 Hook、dispatcher、install、tree/work/delegation、guidance 或版本文件新增修改。

## 边界

本轮没有真实安装、push、tag、release、deploy；没有读取或写入 `/home/synadmin/.codex`；没有杀死、重启或干扰 Poracode、watchdog、bridge。R5 报告本身不替代主管 acceptance 流程。
