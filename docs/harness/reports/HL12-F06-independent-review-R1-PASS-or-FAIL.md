# HL12F06 独立产品复核：FAIL

复核对象：当前工作树 F06 R2（writer report R1 仅作声明参考；本结论以复核时源码为准）。本复核只读检查产品和临时目录，未修改产品、测试或宿主。

## 结论

FAIL。F06 的正常 joined Hook、push 人话和官方 0.9/0.10/0.11 卸载回归基本可用，但当前正式 Hook 仍有一个决定性错误：长 completion carrier 在被改成外部引用时，无论底层 carrier 是否完整，都硬编码输出 `complete=true;truncated=false`。因此带 UNKNOWN 完成标准的当前 leaf 会被正式 Hook 错报成完整，违反“UNKNOWN 不冒充 complete”以及“不用截断假装完整”的 0.12 合同。

另外，全量回归仍未通过：当前 `npm test` 有 14 个失败、1 个 skip（测试总数 171）。失败主要是 F06 新的单一 Decision/新 0.12 instruction 与旧 0.11/R2/R3 wire 断言冲突，但在现有验收口径下不能称为 full regression PASS。

## 命令与证据

### 1. 定向、语法和既有反例

通过：

```text
node --check lib/hook.js
node --test test/hl12-f06-joined.test.js test/hl12-f04-capability-freshness.test.js test/hl12-f05-guidance.test.js
16 tests / 16 pass / 0 fail
node --test test/hl12-f00-counterexamples.test.js test/hl12-f01-install-ownership.test.js test/hl12-f02-runtime-anchor.test.js test/hl12-f03-work-unit-truth.test.js test/hl12-f04-capability-freshness.test.js test/hl12-f05-guidance.test.js test/hl12-f06-joined.test.js
38 tests / 38 pass / 0 fail
```

这些结果证明：单一 Decision、旧 `Guidance[...]` 不出现在新的 F06 正常上下文、两 runnable 的 CEX-04、stale capability、ghost unit、全局根、tamper、push gate 和 uninstall CEX 在定向范围内通过。

### 2. 三个以上 runnable/active 的正式 Hook

自建临时 leaf，声明 RUN1/RUN2/RUN3，各自有 goal、completion standard、design、fact、write scope；写入三个合法 runnable ledger 事件后调用正式 `hook.sessionStart()`。

结果（当前实现）：

```text
ParallelWorkUnits：...complete=complete...units=3...runnable=3
ParallelWorkUnitsCarrier：complete=true；inline=false；truncated=false；count=3；ref=docs/harness/leaves/L.md；readApi=tree.workUnitPackages；digest=...；sentinelCount=3
```

当前 R2 已把 3+ unit 收成一个有 count/ref/readApi/digest/sentinel 的 carrier；在同一临时项目内调用 `work.parallelWorkUnitContext()` 可读回 3 个完整 package，且每个 `dispatchReady=true`。这一项本身 PASS（未发现 `UNKNOWN/leaf-fallback` 丢包）。但该 carrier 的 digest 是 Hook 自己选取字段的摘要，报告没有独立定义其与 `tree.workUnitPackages()` 完整结果的绑定格式；建议后续补一个正式解包/校验测试。

### 3. 长 completion standards 的决定性反例

自建临时 current leaf，目标为 `G`，声明 40 条长 completion standards；另测同样 40 条但最后一条为 `UNKNOWN`。两次均从正式 `hook.sessionStart()` 取 `additionalContext`。

正常长 carrier 的输出为外部引用，长度仍在预算内：

```text
CompletionCarrier：complete=true;truncated=false;inline=false;ref=docs/harness/leaves/L.md;readApi=guidance.completionCarrier;...;standardsCount=40;sentinel=STANDARD-00-...|STANDARD-39-...|40
```

坏输入（最后一条是 UNKNOWN）仍输出：

```text
CompletionCarrier：complete=true;truncated=false;inline=false;ref=docs/harness/leaves/L.md;...;standardsCount=40;sentinel=S0-...|UNKNOWN|40
```

底层 `guidance.completionCarrier()` 对该坏输入的 `complete` 实际为 `false`；错误来自 `lib/hook.js` 的外部 fallback 硬编码：

```js
`complete=true;truncated=false;inline=false;...`
```

这不是旧测试措辞问题，而是正式 Hook 对模型的状态声明错误。最小返修：外部引用分支必须保留 `carrier.complete` 和 `carrier.truncated` 的真实值；若 standards 含 UNKNOWN，至少输出 `complete=false`，不能宣称完整。

### 4. capability、异常降级和 push

- `test/hl12-f04-capability-freshness.test.js` 通过；stale/unbound、future/wrong binding、unsafe path 和 oversize 都降为 UNKNOWN/incomplete，未冒充当前工具面。
- 临时安装项目中把 delegation JSON 和 capability JSON 写成损坏 JSON，再运行 installed dispatcher 的 `SessionStart`；均 status 0、输出短上下文、没有未处理异常。宿主 identity 损坏路径也由 `hooks/dispatcher.js` 输出 UNKNOWN 降级；push 仍 fail closed。
- `hook.preTool()` 对普通 `printf ok` 返回空；对 `git push origin HEAD:main` 返回 deny，并包含“动作、目标、边界、风险、现在请用户决定”；不增加普通 Bash 确认。
- 官方 fresh/0.9/0.10/0.11 upgrade 后 uninstall 的既有 F01 用例通过，用户 instruction bytes 和 rollback carrier 回归通过。没有真实全局安装、push、tag、release 或 deploy。

### 5. 全量回归

```text
npm test
171 tests / 14 fail / 156 pass / 1 skip
```

本轮失败包括：

- `nv02-capabilities.test.js` 仍硬断言 0.11 instruction 词头；当前 F06 已换成 0.12 instruction；
- `nv03-hook-work.test.js` / `fix03-joined-runtime.test.js` 仍硬断言旧 `Guidance[agent-*]` 行；新合同要求旧 Guidance 物理缺席；
- `r2-joined-runtime.test.js`、`r3-capability-carrier.test.js`、`r3-joined-runtime.test.js` 的旧 oversize 断言把任意 `complete=true` 都视为 capability 完整，以及旧 3+ lifecycle 线合同；
- `hl12-f01-install-ownership.test.js` 的 modified fixture 仍替换旧 `Harness Lite 0.11 内部核心` 文本，当前 0.12 instruction 中没有该字符串，导致该 fixture 未真正修改而得到 `UNINSTALLED`。

这些多数是需要由 F06 owning unit 更新的迁移 fixture/断言，但在修复或明确迁移基线前，全量 suite 不能 PASS。

## owning unit 与最小返修

Owning unit：**F06 正式 Hook joined integration**（`lib/hook.js`；必要的 F06 migration fixture/test）。

1. 先修 `carrierText` 外部引用分支，保留底层 `complete/truncated`，并增加长 UNKNOWN standards 的正式测试。
2. 对 3+ package carrier 增加从 `ref/readApi` 读回并验证 count、所有 unit 的 goal/standards/boundaries 和 digest 的测试。
3. 更新或明确标记旧 0.11/R2/R3 wire 断言；F01 modified fixture 改为实际修改当前 0.12 owned block。修完后重跑 `npm test`，在 0 fail（保留已有合理 skip）前不能给 F06 PASS。

## 复核时 SHA-256

```text
lib/hook.js                  ab8036b2d1c2960cb2e9239663f8f55fdc00ccd6d8172d538a45e62d009fe48
lib/install.js               bc1d6c468035e5412b4404affa4d8214ba265d95f0307c74cb93534886066aaa
bin/hl.js                    676dce1d4664c52f8c74f1c5796e8064d3097c6c5b72eca7541a3bcf6c8725f2
hooks/README.md              e8ec9787e2c71afd08a775fa28c62c88c6b0ee4e16260b5ae0d2d413484e3b4b
test/hl12-f06-joined.test.js 692dacf2a9edada5a4c469980862a7694ee62af49beed8be0579a07d8c438e33
```

