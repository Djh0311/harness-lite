# Harness Lite 0.12 HL12F00 writer report

日期：2026-09-02  
work unit：`HL12F00 — baseline and counterexamples`  
writer 状态：`reported_complete`，等待主管直接读回；本报告不声明 `accepted`  
执行边界：只做 F00 基线和测试载体；没有修改产品行为，没有开始 F01–F07

## 一、结果

HL12F00 已达到 writer 侧完成条件：

- 按严格 HTML marker 原始字节口径重算 0.12 Decision-Digest，declared 与 actual 精确一致。
- retained 0.11 artifact 身份、字节数、文件数、product JavaScript 数和双构建一致性已重新核实。
- 六个 0.11 决定性反例都通过当前正式调用路径稳定复现；新增回归测试在 0.11 上正好 6 个已知失败。
- 每个反例都有一个正常正例；六个正例与硬风险冻结 probe 共 7 个全部通过。
- 原有 0.11 suite（排除新增的 F00 已知红例文件）仍为 124 tests / 123 pass / 0 fail / 1 scope skip。
- 产品 JavaScript 摘要保持 retained 0.11 的 `sha256:cd2d34af1f654af2dde947562a6f051ebfb216621d3aac32f2c1941f819abdb9`，因此 F00 没有改变产品行为，也没有增加硬风险种类。
- 所有写入/安装/升级/卸载 probe 都位于 `/tmp/hl12-f00-*` disposable root，并使用该 root 内 synthetic HOME；最终没有任何该前缀目录残留。

这里的 6 个失败是 F00 故意冻结的 0.11 产品缺陷，不是 F00 实现失败，也不能被当作已修复。后续 owning unit 应让各自红例转绿，同时保持对应正常正例继续通过。

## 二、冻结身份

### 2.1 Decision-Digest

严格口径：读取 `docs/harness/plans/HL12-UPGRADE-PLAN.md` 原始 bytes；从 begin marker 行 LF 后的下一 byte 开始，到 end marker 起始 byte 前结束；两条 marker 不进入摘要，不 trim，不规范化换行。

| 字段 | 值 |
| --- | --- |
| decision bytes | `6,876` |
| declared | `8de421b32e79cf2e5b880d26ffe2c44c4bcfc067fc0e8e136086668e1e0803b7` |
| actual | `8de421b32e79cf2e5b880d26ffe2c44c4bcfc067fc0e8e136086668e1e0803b7` |
| result | `MATCH` |

整份计划当前 SHA-256 为 `103ce036ef266362b3dc4866c64276781e592ba7d90f06592a3952fbc5953328`，与 R1 复核记录一致。

### 2.2 retained 0.11

| 字段 | 实算值 |
| --- | --- |
| artifact | `docs/harness/artifacts/harness-lite-0.11.0-8e14e641b7d0fe3641a5e74c49b11a60761e0dc63fb75866ff8226e6b3687ae5.json` |
| SHA-256 | `8e14e641b7d0fe3641a5e74c49b11a60761e0dc63fb75866ff8226e6b3687ae5` |
| bytes | `1,096,150` |
| version | `0.11.0` |
| files | `42` |
| product JavaScript | `14` |
| fileDigest | `sha256:c591777438f9f6dd092da02cada69b10b5a0841a3140ffae986e3272eb0416bb` |
| productDigest | `sha256:cd2d34af1f654af2dde947562a6f051ebfb216621d3aac32f2c1941f819abdb9` |

在新增 F00 测试之前，从 working source 内存构建两次，两个 artifact text 均为 1,096,150 bytes、SHA-256 `8e14e641...`，两者逐字节相同并逐字节等于 retained 0.11。

新增 F00 测试后，working snapshot 的输入文件变为 43 个，fileDigest 变为 `sha256:3ed7d37d74159cfd0eefd6223319513e6938ef0bc07f969ccfa0c644004f3997`；这是新增测试载体造成的正常变化，不是新 candidate。14 个产品 JS 和 productDigest 均保持不变。

retained 0.10 也只读复算为 1,061,071 bytes、SHA-256 `d73f4b4f83e6034e33168995c24ca4514d69bcd70ccc19f8aa255da42d218daa`，供 CEX-06 official upgrade 基线使用；其字节未修改。

## 三、六个正式 caller

| 反例 | 当前正式调用链和根因 |
| --- | --- |
| CEX-01 global root | `bin/hl.js:40,47-56` 将任意 `--target` 解析后直接交给 install/uninstall；`lib/install.js:824-849` 在没有 global-root guard 时进入 surface/inspect/instruction；`lib/install.js:716-750,871` 读取并写 instruction。 |
| CEX-02 coherent tamper | `hooks/dispatcher.js:25-36` 每次正式事件调用 `verify06` 后执行 runtime；`lib/install.js:210-226` 仅将实际 runtime digest 与同一 runtime 内 `ownership.json.packageDigest` 比较；通过后 `lib/hook.js:255-264` 写 usage observation。 |
| CEX-03 ghost unit | `lib/tree.js:264-301` 对显式不存在 ID 退回 leaf package；`lib/delegation.js:614-634` 允许据此 accepted；`lib/delegation.js:433-438,731-738` 只按 ledger 字符串 accepted 解锁依赖。 |
| CEX-04 multi-runnable | formal dispatcher 经 `hooks/dispatcher.js:36` 进入 `lib/hook.js:476-481`；`lib/hook.js:41-50,191-210` 只选择单 runnable，parallel carrier 又只在 activeCount 大于 1 时启用；两个 runnable 因而退为 UNKNOWN leaf fallback。 |
| CEX-05 stale capability | `lib/capabilities.js:14-17,293-360` 搜索并信任固定项目 JSON，没有 freshness/provenance/session binding；正式 pre-dispatch 由 `lib/hook.js:199-208`，CLI status 由 `lib/work.js:637-641` 调用。 |
| CEX-06 uninstall residue | `lib/install.js:716-750,848-878` 安装/升级 instruction，`lib/install.js:476-492` 保留 rollback carrier；`bin/hl.js:54` 进入 `lib/install.js:1050-1078` uninstall，但该路径只移除 stable runtime/Hook/native/registry。 |

## 四、双向反例结果

可持续重放载体：`test/hl12-f00-counterexamples.test.js`，558 行，23,537 bytes，SHA-256 `92b355fc74bf495063d51c9a64576647f470c4e61e9c6118f761281b0714503a`。

| 编号 | 0.11 坏路径实测 | 正常正例实测 |
| --- | --- | --- |
| CEX-01 | synthetic HOME 的 `.codex` 被正式 CLI 返回 `INSTALLED`；read observer 观察到 target 内文件读取；`AGENTS.md` 被改，runtime 和 lifecycle 被创建。红例 FAIL。 | 普通非 Git 项目返回 `INSTALLED`，runtime 存在，用户前缀保留并追加 Harness block。PASS。 |
| CEX-02 | runtime `lib/tree.js` 与 manifest digest 同步 tamper 后，source `verify06` 仍为 `ok=true/kind=current`；正式 SessionStart 正常运行并写 `.observed.json/.jsonl`。红例 FAIL。 | 未改 runtime `verify06=true`；正式 dispatcher 返回 SessionStart context 并记录 observation。PASS。 |
| CEX-03 | `GHOST99` package 为 `leaf-fallback/dispatchReady=true`；accepted 返回 `RECORDED`，ledger 改写，ghost 存在，dependent 变 ready。红例 FAIL。 | 已声明 unit 的 reported_complete 不解锁；带 supervisor evidenceRef 的 accepted 后才解锁 dependent。PASS。 |
| CEX-04 | 两个 runnable 的正式 SessionStart context 不含任一 unit 标准，出现 `id=UNKNOWN/status=leaf-fallback`。红例 FAIL。 | 单 runnable context 含真实 unit ID、goal、completion standard 和 `status=work-unit`。PASS。 |
| CEX-05 | 无 freshness/provenance/binding 的 `docs/harness/capabilities.json` 被投影为 `state=known/modelsComplete=true`，旧 model 为 available。红例 FAIL。 | 当前 Hook-input carrier 带 event/session/turn 和 TTL，支持从两个 model 动态移除为一个，保持 `known/complete`。PASS。 |
| CEX-06 | retained 0.10 → current 0.11 upgrade 后 uninstall 返回 `UNINSTALLED`，但用户 instruction 未恢复、生成的 `CLAUDE.md` 仍在、`.harness-lite.rollback-*` 仍在；stable runtime 已删除。红例 FAIL。 | fresh uninstall 删除 stable runtime，用户原前缀和无关二进制文件 bytes 保持。PASS；owned block 残留由左侧红例负责。 |

测试命令和结果：

- `node --check test/hl12-f00-counterexamples.test.js`：exit 0。
- `node --test test/hl12-f00-counterexamples.test.js`：exit 1；13 tests / 7 pass / 6 fail / 0 skip。六个 fail 精确为 CEX-01 至 CEX-06 known-red；没有 setup failure。
- `node --test --test-name-pattern='normal-positive|F00 hard-risk freeze' test/hl12-f00-counterexamples.test.js`：exit 0；7 tests / 7 pass / 0 fail / 0 skip。
- inline Node runner 枚举原 18 个 `test/*.test.js`、排除新增 F00 文件后执行 `node --test`：exit 0；124 tests / 123 pass / 0 fail / 1 skip。
- inline Node runner 枚举当前 19 个 test files 后执行完整 suite：child status 1；137 tests / 130 pass / 6 fail / 1 skip。六个失败仍只有冻结红例。

原 suite 的 1 个 skip 是既有 lifecycle 文档 scope skip；它没有参与任何 CEX 或正常正例的 PASS。F00 新增的六个反例、六个正例和硬风险 probe 均无 skip。

## 五、现有硬风险冻结

F00 记录的当前产品硬停点来源没有新增：

1. push 的 PreToolUse/native 一次性 gate；
2. Stop 续跑的精确短期 authorization、真实 semantic progress、forbidden 和 pending-push 条件；
3. Harness 自有写面的 runtime identity、filesystem surface 和已知 ownership 前置条件。

新增 hard-risk probe 直接证明：普通 `node --test` Bash 命令没有 permission gate；即便命令文本是非 push 的递归删除，当前 Harness 也不把它扩展成新 gate；`git push` 才进入现有 deny 说明。原 0.11 suite 同时继续通过 Stop exact binding、native pre-push、unsafe surface、identity 和 ownership 回归。

由于本 unit 没有修改 `bin/**`、`hooks/**`、`lib/**`、`skills/**`、`scripts/**` 或 `package.json`，且 14-product-JS digest 与 retained 0.11 相同，F00 没有新增风险类别、确认或用户 Harness 命令。

## 六、事实、UNKNOWN 与证据边界

### 事实

- Decision-Digest、retained 0.10/0.11 identity 和 0.11 product digest 均重新实算命中冻结值。
- 六个反例和六个正例全部直接执行；不是从旧报告或测试名称推断。
- CEX-01 的 target read 由仅在 disposable 子进程加载的 `fs.readFileSync` observer 记录；真实 `/home/synadmin/.codex` 没有作为 target，也没有被本 unit 读取或散列。
- CEX-02/CEX-04 使用 disposable installed runtime 的正式 dispatcher；CEX-01/CEX-06 使用正式 CLI；CEX-03/CEX-05 直接调用正式生产库入口。
- 没有修改 retained artifacts、历史 plans/reports/done、当前 lifecycle/delegation 或产品文件。

### UNKNOWN / 尚未实现

- 六个反例仍是 0.11 当前产品事实；F01–F04/F06 尚未修复，状态不是 PASS。
- 0.12 external anchor、ownership receipt、multi-runnable carrier、fresh capability 合同和 guidance synthesizer 的具体 HOW 仍为 UNKNOWN，留给各 owning unit。
- 本 unit 不读取真实全局 Codex 根，因此不提供它的 fresh bytes/hash；只声明所有 probe 的解析 target 都在 synthetic HOME。
- 本 unit 没有生成 0.12 candidate，没有执行 materialized 0.12 suite、真实模型 A/B、主管验收或独立产品复核。

## 七、实际写面和清理

本 writer 实际新增：

- `test/hl12-f00-counterexamples.test.js`
- `docs/harness/reports/HL12-F00-writer-report.md`

没有修改产品行为文件、package、candidate、retained artifact、历史报告、plan/stage/leaf/delegation 或全局配置。

所有 probe 每次都用 `fs.mkdtempSync(/tmp/hl12-f00-<case>-)` 建立精确 root；清理前校验 top-level 是 `/tmp/hl12-f00-*` 下的非 symlink directory，只递归删除该精确 root，并断言其不存在。最终 `find /tmp -maxdepth 1 -type d -name 'hl12-f00-*' -print` 无输出。

没有真实 install、push、tag、release、deploy；没有杀死、重启或干扰 Poracode、watchdog、bridge。

## 八、交给主管的验收点

主管应直接重算 Decision-Digest 和 test/report bytes，读回六个正式 caller，并至少重跑：

1. `node --test test/hl12-f00-counterexamples.test.js`，确认只有六个 known-red 失败；
2. normal-positive/hard-risk pattern，确认 7/7 pass；
3. 原 0.11 suite 排除 F00 红例，确认 123 pass / 0 fail / 1 skip；
4. `/tmp/hl12-f00-*` 无残留，且本 unit 没有产品写面变化。

writer 结论：`reported_complete`。只有主管直接验收后才能标记 HL12F00 `accepted` 并解锁依赖 unit。
