# HL12F02 writer report — runtime trust anchor and clean degradation

状态：`reported_complete`，等待主管独立读回、重放和 acceptance；本报告不宣布 `accepted`，不表示 0.12 candidate 或整个 HL12 已完成。

## 1. 权威与范围

- 执行单元：`HL12F02`，只处理 current runtime 可信锚点、formal dispatcher 先验身份和 identity UNKNOWN 降级。
- 权威：`HL12-UPGRADE.md` 的 F02、`HL12-UPGRADE-PLAN.md` 的第八节 current runtime 可信锚点、CEX-02、保证 A。
- Decision-Digest：declared/actual 都沿用 F00 已核实的 `sha256:8de421b32e79cf2e5b880d26ffe2c44c4bcfc067fc0e8e136086668e1e0803b7`。
- 未执行 F03–F07；未改公共 `lib/hook.js`、CLI 接线、work-unit/capability/guidance、package/version/candidate、lifecycle/delegation、retained artifact 或真实全局配置。

## 2. 产品事实

### 2.1 runtime 外安装锚点

- fresh install、current upgrade 和 official 0.9/0.10/0.11 upgrade 现在创建项目内 `.codex/harness-lite/installation.json`，模式为 `0600`；它位于 `.claude/harness-lite` runtime 自证边界之外。
- anchor 绑定 canonical target、runtime version、source commit、profile、source package digest、Hook definition digest、`ownership.json` 原始字节 digest，以及 managed paths、instruction ownership、rollback carriers、extensions 的结构化 digest。
- `verify06()` 不再只用 runtime 内 manifest 自证；内部 package/manifest 检查通过后还必须通过同一 external anchor。anchor missing、普通修改、symlink、wrong target、wrong package 和 manifest-only ownership forge 都是 identity drift。
- retained 0.11 只通过固定的 20-path package digest `sha256:e7bf325fc23af9e5344aa00d70c35f1e815b4887fe0e0210b9c995867dff0f21`、固定 source/instruction/Hook identity 和严格 manifest schema 被识别为 `previous-11-snapshot`；它仍要求显式 upgrade，不能把任意无 anchor 的 current runtime 当成旧 official。

### 2.2 formal dispatcher 的加载顺序与降级

- `hooks/dispatcher.js` 顶层只加载 Node built-ins。它先独立读取 external anchor 和内部 manifest，核对 target、manifest bytes、Hook definition、core package、mode/path surface 和 extension ledger，成功后才 `require('../lib/hook.js')`。
- source `verify06`、installed `verify06` probe 和 formal dispatcher 因此都消费同一个 anchor 合同；dispatcher 没有调用被核对 runtime 来替自己建立信任。
- identity UNKNOWN 时，SessionStart/UserPromptSubmit 只返回短的 UNKNOWN 降级上下文；普通非 push Bash 零输出、exit 0；PreToolUse push 返回 deny、exit 0；native pre-push 和 push assertion fail closed。所有这些路径都不写 usage、ledger 或 host observation，也不把整个任务标成 blocked。
- 正常 runtime 仍执行原有 Hook；旧 hard-risk 集合没有扩展，普通 Bash 不新增确认或拦截。

### 2.3 ownership、隐私与事务

- 新 `instructionOwnership` 不再写 `originalBodyBase64`，只保留原内容 digest、mode 和 Harness 自己写入的 exact owned segment；uninstall 用 exact segment 得出 postimage，再用 original digest 校验，所以不需要长期复制用户原 instruction/prompt/code bytes。
- `originalBodyBase64` 只保留为旧 receipt 的只读兼容校验分支；新 writer 不产生该字段。专用 canary 用唯一用户字符串及其 Base64 同时证明新 manifest 不含原用户 bytes。
- anchor 与 runtime swap、instruction、Hook、registry 和 authorization 同属 install/upgrade rollback；uninstall 先做全量 preflight，再事务删除 anchor；extension ledger 的 install/uninstall 也同步更新 anchor并可回滚。
- fresh fault rollback 会撤回 Harness 本次创建的空 `.claude`、`.codex`、`.codex/harness-lite` 和空 extension carrier；正常 uninstall 只在这些目录由本次安装记录为 created 且仍为空时删除，不删除非空用户目录。

## 3. 正式 caller 读回

- source/CLI 写入口：`bin/hl.js` 调 `lib/install.js::verify06`。
- install post-swap：source `verify06`，随后 `runtimeProbe(..., 'verify')` 调 installed `lib/install.js::verify06`。
- formal Codex Hook、native pre-push、push assertion：`hooks/dispatcher.js::bootstrapVerify` 在加载 `lib/hook.js` 前执行。
- 其他现有 caller：health、host list/event receipts、extension、native install/probe，以及 `lib/managed.js` project binding 都继续走 `verify06`，因此会消费 anchor。

## 4. 双向反例与专用证据

`test/hl12-f02-runtime-anchor.test.js` 有 6 个顶层 tests，内部覆盖：

1. healthy fresh anchor、source verify、installed bootstrap、formal SessionStart、精确 uninstall；manifest 不含用户原 bytes。
2. runtime `lib/hook.js` 与内部 manifest coherent tamper：source/installed verify 拒绝；formal dispatcher 在加载该模块前降级；sentinel 不出现；usage 不变；普通 Bash继续，push/native 仍 fail closed。
3. 只伪造内部 instruction ownership：external anchor 拒绝，uninstall `HOLD` 且完整项目快照不变。
4. anchor missing、modified、file symlink、wrong target、wrong package：verify 拒绝，dispatcher exit 0 且零受管写，uninstall 零写 `HOLD`。
5. official 0.9/0.10/0.11 upgrade、rollback-carrier binding、managed project identity 和 uninstall。
6. fresh/current/official upgrade、uninstall、extension 的 anchor fault injection；完整目录和文件快照回到事务前字节。

F00 重放结果：CEX-02 坏例和正常正例都已转绿。整个 F00 文件为 13 tests / 10 pass / 3 fail；三个失败精确是 F03 owning 的 CEX-03/CEX-04 和 F04 owning 的 CEX-05，CEX-01、CEX-02、CEX-06 及各自正常正例全部通过。

## 5. 执行命令与结果

- `node --check lib/install.js && node --check hooks/dispatcher.js`：exit 0。
- `node --test test/hl12-f02-runtime-anchor.test.js`：exit 0；6 tests / 6 pass / 0 fail / 0 skip。
- `node --test --test-name-pattern='CEX-02' test/hl12-f00-counterexamples.test.js`（synthetic HOME/CODEX_HOME）：exit 0；2 tests / 2 pass。
- `node --test test/hl12-f00-counterexamples.test.js`（synthetic HOME/CODEX_HOME）：exit 1；13 tests / 10 pass / 3 fail；只剩 CEX-03/04/05 的计划内 known-red。
- `node --test test/nv05-integration.test.js test/hl11-event-upgrade.test.js test/hl12-f01-install-ownership.test.js`：exit 0；22 tests / 22 pass / 0 fail / 0 skip。
- 枚举 `test/*.test.js`、只排除仍故意包含三个后续 known-red 的 `test/hl12-f00-counterexamples.test.js`，使用 synthetic HOME/CODEX_HOME 执行 `node --test`：exit 0；136 tests / 135 pass / 0 fail / 1 skip。
- 唯一 skip 是既有 `R3F03 active indexes point to the existing R3 current leaf...`，原因仍是 `source candidate does not include local lifecycle documents`；F02 没有新增条件 skip。

## 6. 实际改动与 SHA-256

| 文件 | 用途 | SHA-256 |
|---|---|---|
| `lib/install.js` | external anchor、previous-11 migration、ownership privacy、install/upgrade/uninstall/extension transaction | `f8dd95afd07eb815ead0d3d23c2291499e7ef5f4f116f71209ce211790b7fff6` |
| `hooks/dispatcher.js` | runtime 模块加载前的独立 bootstrap identity 与 clean degradation | `b59334f269f81715562f886b02a3535b0bba9c6ee50812db6162003a635ec095` |
| `test/hl12-f02-runtime-anchor.test.js` | F02 双向、tamper、migration、degradation、fault probes | `216e87ff215651c5118209935dac8376279f20ed39f246e24b25c1c726124cae` |
| `docs/harness/reports/HL12-F02-writer-report.md` | 本报告 | 写完后由主管直接读回，不把自摘要当 acceptance |

retained artifacts 未写：0.11 artifact 仍为 `8e14e641b7d0fe3641a5e74c49b11a60761e0dc63fb75866ff8226e6b3687ae5`，0.10 artifact 仍为 `d73f4b4f83e6034e33168995c24ca4514d69bcd70ccc19f8aa255da42d218daa`。

## 7. UNKNOWN、边界和未做事项

- 当前源代码的 package/runtime version 仍是 0.11.0；F02 没有得到 F07 的 version/candidate 权限。这里证明的是 F02 产品行为，不是 0.12 candidate identity。
- 没有物化新 candidate，没有真实 install、push、tag、release、deploy 或真实宿主 E2E；所有 target 写入都只发生在 `/tmp` disposable roots，最终权威测试计数全部用 synthetic HOME/CODEX_HOME 重跑。
- 0.12 的 CEX-03/04/05 仍是后续 F03/F04 的 known-red；公共 CLI/Hook 最终共用边界接线仍属于 F06。
- threat boundary 只承诺检测 runtime 与内部 manifest coherent tamper、anchor 缺失/漂移和计划内反例；不宣称能抵抗同一权限主体同时重写 runtime、external anchor、dispatcher/verifier 和宿主配置。
- `reported_complete` 不是 supervisor acceptance；是否接受 F02、是否需要返修由主管独立决定。

## 8. 清理与宿主边界

- 专用 tests 的每个 disposable root 都由 `test.after` 做路径/type 核对后精确删除；最终 suite synthetic HOME 使用 `mktemp` 精确创建并经 prefix 校验后删除。
- 完成后 `/tmp` 中没有 `hl12-f02-*` 临时目录；没有读取真实全局配置文件内容，也没有写入真实 `/home/synadmin/.codex`；早期探索命令的目录 metadata 例外见下段。
- 未运行会干扰 Poracode、watchdog 或 bridge 的命令；未操作任何宿主进程。

过程偏差必须如实记录：在最终 synthetic-HOME 重跑前，有一次探索性全 source suite 和一次 targeted regression 命令没有显式覆盖 `HOME/CODEX_HOME`。这些 probe 的 target 仍全是 disposable project；代码路径不会读取真实全局配置文件内容，也没有任何真实全局写入，但 `targetBoundary()` 可能对 `/home/synadmin/.codex` 做过 `realpath/stat` 元数据核对。因此若“读取”包含目录元数据访问，本 writer 不能声称全过程严格零 metadata read；上面的“没有读取”仅指未读取配置文件内容。最终作为报告依据的 136-test suite、F00 和 CEX-02 命令都已在 synthetic HOME/CODEX_HOME 下重跑。该过程偏差交主管决定是否要求返修或重开干净执行证据。
