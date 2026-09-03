# HL12F06 独立产品复核 R2：FAIL

复核对象：F06 R3 writer 之后的当前工作树（随后主管继续修复中的实时状态）。本复核只读，不修改产品、测试或宿主；使用临时目录的 leaf/ledger 反例，临时目录均在命令结束时清理。

## 结论

FAIL。长 `UNKNOWN` completion carrier 这一项已经修好：正式 Hook 会保留 `complete=false`。但 3+ runnable 的 aggregate carrier 仍没有绑定完整的 work-unit package 投影；同时在长 package/combined-pressure 下，carrier 的 sentinel 会被普通 `fitLine()` 加 `...` 截断，却仍标 `truncated=false`。因此不能证明模型拿到的是完整且可核验的 carrier。

全量回归也仍未通过：当前 `npm test` 为 173 tests、159 pass、13 fail、1 skip。旧 wire 断言冲突很多，但这不能覆盖上述两个仍可独立重现的正式 Hook 缺口。

## 通过项目

```text
node --check lib/hook.js
node --test test/hl12-f06-joined.test.js test/hl12-f04-capability-freshness.test.js test/hl12-f05-guidance.test.js
18 tests / 18 pass / 0 fail
```

定向的 F00 CEX-01..06、F01 ownership、F02 anchor、F03 work-unit、F04 capability 和 F05 guidance 反例此前均能通过；官方 fresh/0.9/0.10/0.11 uninstall 回归此前也通过。本轮没有真实全局安装、push、tag、release 或 deploy。

长 UNKNOWN 反例当前输出：

```text
CompletionCarrier：complete=false;truncated=false;inline=false;ref=docs/harness/leaves/L.md;readApi=guidance.completionCarrier;digest=sha256:b6521c3763b33090108672b3e476c1bbec583fea0f9c6de3425998d1ace2becc;standardsCount=40;sentinel=S0-...|UNKNOWN|40
```

该状态与底层 `guidance.completionCarrier().complete === false` 一致；长度为 1095，未超 1800。此项 PASS。

## 决定性失败一：3+ aggregate digest 不是完整 package digest

自建 3 个合法 runnable unit，各自含 goal、两端 standards、authorityDesign、facts、allowed/forbidden、dependencies、entryPoints、writeScope、resultContract。正式 Hook 输出 aggregate carrier：

```text
ParallelWorkUnitsCarrier：complete=true；inline=false；truncated=false；count=3；ref=docs/harness/leaves/L.md；readApi=tree.workUnitPackages；digest=sha256:c0aee3969b999297d2a657f75e84952ac65f68310181cd54788345ace17c4770；sentinelStart=RUN1-STANDARD；sentinelEnd=RUN3-STANDARD；sentinelCount=3
```

当前实现的 digest payload 虽已比 R3 增加字段，但仍是 `hook.js` 手工挑选字段，不是 `tree.workUnitPackages()` 的完整投影；例如没有 `schemaVersion`、`kind`、`workUnit`/`stage`/`leaf`、`package` 等完整包身份字段。正式测试只验证 digest 格式和 count，没有通过 `ref/readApi` 重算完整包 digest。

因此当前 carrier 只能证明“某组挑选字段的摘要”，不能证明“每个 runnable unit 的完整最小任务包”。最小返修是让 digest 输入稳定 canonical 的完整 package projection，或让 readApi 明确返回并校验同一 digest；测试需逐项核对所有 package 字段。

## 决定性失败二：combined pressure 仍尾切必需 carrier metadata

自建 8 个 active unit，长 stage/leaf 和每个 unit 的长 standards/design/facts，调用正式 `hook.sessionStart()`。结果长度为 1250（小于 1800），但 `ParallelWorkUnitsCarrier` 行被 `fitLine(..., 620)` 尾切：

```text
ParallelWorkUnitsCarrier：complete=complete；inline=false；truncated=false；count=8；ref=docs/harness/leaves/L.md；readApi=tree.workUnitPackages；digest=sha256:85ad35c16d69354653c0e5c54429a2551ce78811fb4d8aff7f5a7c064d922ba4；sentinelStart=RUN1-STANDARD-XXXX...；sentinelEnd=RUN8-STANDARD-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX...
```

`...` 出现在必需 carrier 的 sentinel 中，而 carrier 仍声称 `truncated=false`。根因仍在 `contextWithinBudget()`/`fitLine()`：即使 aggregate carrier 是外部引用，也把该行当普通 prose 压缩；最终 `text.slice(0, limit)` 也仍存在。这个结果不能作为“前中后 sentinel 证明完整”的证据。

最小返修：把 aggregate/completion carrier 行标记为不可普通截断；若 metadata 放不下，只缩短非必要 metadata，或生成真实可读的二级 carrier，并令 `truncated` 反映真实状态。必须增加长 3+ unit combined-pressure 正式测试，断言 carrier 行没有 `...` 且 ref/readApi/digest/sentinel 全部保留。

## 全量回归

```text
npm test
173 tests / 159 pass / 13 fail / 1 skip
```

失败集中在：旧 0.11 instruction/Guidance wire、F00 push guidance 的历史文字、F01 modified fixture 仍替换旧 0.11 文本、R2/R3 旧 `remaining=N`/oversize `complete=true` 断言，以及压力场景仍要求旧 lifecycle 行。它们需要 F06 owning unit 逐项迁移或修复，不能删除、跳过或放宽；在 0 fail 前不能给阶段 PASS。

## owning unit

Owning unit：**F06 formal joined Hook integration（`lib/hook.js`）及其迁移/压力 fixture**。

1. 完整 canonical package projection 绑定 aggregate digest，并提供可重算的 ref/readApi 校验。
2. 禁止 carrier/sentinel 经普通 `fitLine` 产生 `...`；预算不足时显式外部 carrier，真实反映 complete/truncated。
3. 迁移旧 wire 测试并修正 F01 当前 instruction mutation fixture，然后重跑完整 suite。

## 复核时 SHA-256

```text
lib/hook.js                   d8faf0319e860e2f6db6713678b23d3a33c033a72fb823ff41508f16ccd7dca4
lib/install.js                bc1d6c468035e5412b4404affa4d8214ba265d95f0307c74cb93534886066aaa
bin/hl.js                     676dce1d4664c52f8c74f1c5796e8064d3097c6c5b72eca7541a3bcf6c8725f2
hooks/README.md               e8ec9787e2c71afd08a775fa28c62c88c6b0ee4e16260b5ae0d2d413484e3b4b
test/hl12-f06-joined.test.js  1ce57cb230a3e8eef672d75eab2348f18457f47b31c5566962f828d85c53a2b5
writer report R3             001765144ebf4a0567a1da7cb039b8541ae4349c064e1a09c0ab69804ed8fce3
```

