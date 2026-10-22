# Harness Lite 0.14 就绪报告

状态：`SOURCE CANDIDATE / CODEX + CLAUDE CODE REAL-HOST VERIFIED / TEST UPKEEP INCLUDED / NOT RELEASED`

日期：2026-10-22。证据目录：`/home/synadmin/workspace/hl014-validation-20261022/`，下文的证据路径都相对这个目录。

依据：

- [收尾工作计划](../plans/HL014-WORK-PLAN.md)；
- 用户当天的追加要求：
  - 测试维护必须带上，可以放在阶段收尾，或者用实测证明没用；
  - Claude 必须装上并能用；
  - Cursor 可以不装；
- 晚间的决定：
  - agy 不再做；
  - “需求变了”时要在回复里写改测试的理由；
  - 常驻指令加一句 AGENTS.md 由用户维护；
  - 以后只做轻量测试。

## 结论

**Codex 和 Claude Code 两条路径已具备发布条件。测试维护已带上，并在真实 Codex 会话中验证。** 是否发布等用户决定。

- **Codex（gpt-6-astra，推理 medium）**：
  - 首轮真实运行发现，新装项目里模型不知道开工前要先建 stage 和 leaf，开工登记 4 次全部被拒（G1）。
  - 修复后用同一脚本复跑：模型自己把计划落盘，然后恢复、登记、实现、测试、退场，三件事全部完成，没有发“继续”，也没有多余提问。
- **Claude Code（2.1.306，claude-opus-5-5）**：
  - 安装器把四个 Hook 写进项目 `.claude/settings.json`，与用户原有设置合并，卸载时逐字节还原。
  - 用同一脚本跑真实会话：Q0、Q1、Q2、Q4、Q5 PASS，Q3 NOT-COVERED；三件事全部完成，“继续” 0 次。
- **Cursor**：默认不装。适配代码保留，没有在真实宿主上验证过。
- **agy**：按用户决定不做。0.14 不接 agy Hook，发布说明也不写。
- **测试维护**：阶段最后一个 leaf 退场时，Harness 在返回结果里给模型一条写全的收尾要求。
  - 收尾要求的内容：
    - 先点名这一轮改过的测试文件，要求在交付说明里写为什么改；
    - 再要求把这阶段相关的测试文件都看一遍，合并重复、保留边界用例、删掉只测已删除功能的测试、无关测试不动。
  - 真实 Codex 的结果：
    - 阶段收尾整理 2/2（之前所有版本 0/7）；
    - 无关小任务 4/4 没被带偏，修产品 2/2；
    - “需求变了”时回复里写理由，改法定下后跑了 1 次，通过。
  - 实测无效、已撤回的做法：常驻指令补句（抽象写法、具体写法各试过），以及退场必填字段。
- **AGENTS.md**：常驻指令加了一句“AGENTS.md 和 CLAUDE.md 由用户维护，用户明确要求才改；要长期记住的决定写进 docs/harness 的 plan 或 stage。”
  - 其余文字与 0.13 逐字节相同；已装 0.13 的项目照样能升级、卸载。
  - 这次的测试场景没复现“AI 擅自改 AGENTS.md”：现版本的模型也没去改。所以这一句的效果没有得到证明，要在实际使用中观察。
- **全测**：最终源码做了完整 W5（final8）：
  - 源码和物化候选在 Node 24、Node 22 下各 268/268；
  - 跨 Node 12 项、真实发布 0.13 的升级卸载 8 项，全部通过；
  - HEAD 未变，用户其余 108 个文件逐字节未动。
- **独立复核**：
  - Grok 4.7 high 共调用 28 次，19 块得出结论，另有 1 块由 gpt-6-astra 替代复核。
  - 复核确认的问题都先写复现测试再修复，其余疑点逐条核实。
- **Stop 兜底续跑**：两种宿主的真实运行里一次都没触发，因为模型没有提前停下。发布说明不能写“自动续跑”。

## 需要用户决定的事项

1. **提交与发布**：都需要用户另行授权。装到 Syn 之前，建议先在 Syn 的副本上演练一次升级和回滚，起点是“0.8 运行时 + 0.13 登记”的混装状态。
2. **`~/.codex/config.toml` 里 5 处无法归因的差异是否还原**：见“副作用与清理”。默认不还原。

## 本轮源码改动

只改了计划内的文件，没有提交。HEAD 仍是 `aac6bd5`，用户其余 108 个 WIP 和未跟踪文件与开工时逐字节一致（`w5/final8-diff-vs-start.md`）。

**开工入口（W3，依据 W1 证据）**

- `hooks/README.md` 新增「开工前：建 stage 和 leaf」一节，说明只规划和开工两种情况、文件格式，以及三处容易踩的坑：
  - 完成标准里的逗号、顿号、分号会把一条拆成多条；
  - leaf 文件名只能用 ASCII；
  - 工作单元标题的编号后接空格，不能接冒号。

  另外写明纯提问、只 push 不用登记。
- `lib/hook.js`：
  - 每轮 WorkIntent 行按状态给出。已有 current leaf 时，直接给出本轮可用的 execute 命令；没有时，指向「开工前」。
  - 登记被拒时说明缺什么、去哪里补。
  - push 写法不精确时，改为提示换成精确写法，不再请用户确认一条无法放行的命令。

**Claude Code 接入**

- `lib/install.js`：
  - 安装时把 SessionStart、UserPromptSubmit、PreToolUse（匹配 `Bash`）、Stop 四个 Hook 合并进 `.claude/settings.json`；用户已有的设置和 Hook 原样保留。
  - 卸载时逐字节还原：文件原本不存在就删除；原本没有 `hooks` 键就去掉；空对象的原有空白也还原。
  - 用户自己的 Hook 只要提到 Harness 路径、又不是 Harness 写入的，就进入 HOLD，零写入。
  - project 切到 managed 时撤掉项目里的 Claude Hook。换 Node 版本后仍能认出自己写入的 Hook。
- `hooks/dispatcher.js`：Claude 不发 `turn_id`，以每次提问的 `prompt_id` 作为轮次。

**Cursor 默认不装**

安装不再写 `.cursor/hooks.json`。卸载只在清单记录过 Cursor 安装时才碰它，这种清单只来自早先的 0.14 候选；用户自己的 Cursor 配置不受影响。

**阶段收尾的测试整理（W4v5、W4v5b、W8b）**

`lib/hook.js`：退的是 stage 的最后一个 leaf 时，即没有 current leaf、同一 stage 也没有 unfinished leaf，`--work-intent` 的返回结果带一条 `nextAction`，内容是：

> 〈stage〉的 leaf 都已完成。〔这一轮改了 〈测试文件〉：交付说明里要有一句写为什么改。〕阶段收尾：先把这阶段相关的测试文件都看一遍，再整理——重复的用例合并成一处（边界用例保留），只测已删除功能的测试删掉，过时的断言改成当前需求；与这阶段无关的测试不动，没有要整理的就不整理。跑全量测试后交付，交付说明里用一句话写这阶段测试改了什么、为什么。

- 方括号里那句只在这一轮改过测试文件时出现，最多列 5 个。
- 怎么算“这一轮改过”：
  - 轮次开始时就已经改过的文件，只有内容又变了才算；只是暂存或提交了用户原有的改动，不算；
  - 读不出内容的文件不算。
- 这条提示不拦截任何动作，不要求填字段，也不改授权和状态。读不出 stage 链或 git 状态时，只是少了提示或文件清单。
- `hooks/README.md` 的 exit 一行加了一句说明。

**常驻指令加一句（用户批准）**

- `lib/install.js` 的 `INSTRUCTION` 在“按需审阅技能与常驻指令，冲突时说明来源。”之后多了一句：“AGENTS.md 和 CLAUDE.md 由用户维护，用户明确要求才改；要长期记住的决定写进 docs/harness 的 plan 或 stage。”其余文字与 0.13 逐字节相同。
- 0.13 原文保留为 `PREVIOUS_13_INSTRUCTION`。已发布 0.13 的安装在校验、升级、卸载时都用这份原文，所以照样能升级成新文字、直接卸载回用户原文。
- 被改过的 Harness 段，升级时仍然 HOLD，不会被覆盖。

**复核发现的修复，每处都先写复现测试**

| 位置 | 问题 |
| --- | --- |
| `hooks/dispatcher.js` | Cursor 的 WSL 路径改写没有锚定在开头 |
| `lib/work.js` | 自有文件条目按前缀匹配，误把 `.cursor/hooks.json.bak` 等路径算作 Harness 所有 |
| `lib/work.js` | 记录为失败的 verify 回执可能被显示成“未执行” |
| `lib/work.js` | status 文本可以借存储字段伪造出额外的行，包括 U+2028 这类分隔符 |
| `scripts/timed-test.js` | Node 24 输出格式下，“0 个测试判失败”的检查不生效 |
| `lib/hook.js` | 没有 turn_id 时，已完结的来源可以被重放成新来源 |
| `lib/hook.js` | 退场证据填 `.` 时，hook 会一直卡到宿主超时 |
| `lib/install.js` | Node 启动器接受转义写法或带 shell 字符的路径，Hook 已坏却仍报“已配置” |
| `lib/install.js` | 卸载后留下安装时新建的空 `.cursor/` 目录，0.13 没有这个残留 |
| `lib/install.js` | project 切到 managed 时，项目里的 Claude Hook 遗留，清单也随之丢失 |
| `lib/install.js` | 安装时新建的 settings 文件被用户清空后，卸载会留下 `{}` |
| `lib/install.js` | Node 22 装、Node 24 卸时，Claude Hook 被判为未知而 HOLD（W5 跨版本检查发现） |
| `lib/hook.js` | 收尾提示读链失败时，已经完成的退场命令什么都不输出 |
| `lib/hook.js` | 点名“这一轮改过的测试”时按 git 状态而不是按内容判断，会把用户原有改动、`docs/spec/`、JSON 夹具算进来 |

**已撤回**：常驻指令里的测试维护补句（W4、W4v2）、退场必填字段（W4v3）。源码里没有 `testUpkeep` 残留。

**测试**：

- 新增：
  - `test/hl14-entry-guidance.test.js`
  - `test/hl14-review-fixes.test.js`
  - `test/hl14-claude-host.test.js`
  - `test/hl14-stage-closeout.test.js`
  - `test/hl14-resident-instruction.test.js`
- 更新：
  - `test/hl14-intent-entry.test.js` 中对 WorkIntent 行文的断言；
  - `test/cursor-host.test.js` 的安装用例，改为断言“安装不碰 Cursor 配置”。

## 验证明细

| 工作包 | 结果 | 证据 |
| --- | --- | --- |
| W0 开工核对 | HEAD 和候选摘要与计划一致；已记录起点快照与工具版本 | `w0/` |
| W1 Codex T1/T2 | Q0 PASS；Q1–Q3 NOT-COVERED；Q4 在 T2 中 PASS；Q5 FAIL；发现 G1 | `w1/report.md` |
| W1 Codex T3（修复后） | Q0、Q1、Q2、Q4、Q5 PASS；Q3 NOT-COVERED | `w1/report-t3.md` |
| W1 Claude Code | Q0、Q1、Q2、Q4、Q5 PASS；Q3 NOT-COVERED；工具调用 17 次，其中 Harness 相关 7 次 | `w1/report-claude.md` |
| W2 测试维护基线 | S1 FAIL×2（只差理由）；S2 PASS×2；S3 FAIL×2；S4 PASS×2 | `w2/report.md` |
| W4 抽象补句 | S1 FAIL×2；S2 PASS×2；S3 FAIL×2（其中 1 次部分改善）；S4 PASS×2；已撤回 | `w4/report.md` |
| W4v2 具体补句 | S3 FAIL×2；S4 PASS×1；其余中止；已撤回 | `w4v2/report.md` |
| W4v3 退场字段 | S3 FAIL×1；S4 PASS×2，其中 1 次在字段里写了不实的自报；其余中止；已撤回 | `w4v3/report.md` |
| W4v4 用户明说（诊断） | S3 FAIL（partial）×1：第一次出现测试整理，但 D1、D3 仍重复 | `w4v4/report.md` |
| W4v5 收尾 nextAction | S3：1 PASS、1 FAIL（partial：只整理了打开过的文件）；S4 PASS×2 | `w4v5/report.md` |
| W4v5b 补“先看一遍” | S3 PASS×2；S4 PASS×2；S2 PASS×2；S1 FAIL（partial：P7）×2，与基线相同 | `w4v5b/report.md` |
| W8 / W8b 理由与 AGENTS.md | S1：W8 仍缺理由，W8b 点名测试文件后 PASS（含 P7，1 次）；S4 PASS×2；S5 基线没复现擅改 AGENTS.md；4 次有效运行里 AGENTS.md、CLAUDE.md 都没动 | `w8/report.md` |
| W5 final8（最终源码，发布依据） | `git diff --check` 干净；源码与物化候选在 Node 24、Node 22 下各 268/268；跨 Node 12 项、真实 0.13 升级卸载 8 项 0 失败；候选 70 个文件，fileDigest `sha256:bf45bf92…` | `w5/summary.md`、`w5/final8-*` |
| W5 早先几轮 | final4（259）、final5、final6（263）、final7（267），都已被 final8 取代 | `w5/summary.md` |
| W6 独立复核 | Grok 调用 28 次（19 块有结论）+ 1 块 gpt-6-astra 替代复核；修复见上表，其余逐条核实 | `w6/triage.md` |

## 未覆盖与未知

- **Stop 兜底续跑**：Codex 三轮、Claude 一轮真实运行都没有出现提前停下，这个能力从未在真实宿主上触发过。
- **AGENTS.md 那一句的实际效果**：测试场景没复现问题，效果未经证明，需要在实际使用中观察。
- **宿主流程**：没有覆盖到的有：
  - 持久化的 hook 信任流程（Codex 用了绕过参数）；
  - Claude 的交互式信任与权限流程（用了 `-p` 和跳过权限）；
  - Codex Desktop；
  - 用户确认 push 后的一次性放行。
- **测试维护只在 Codex 上验证过**：Claude Code 上没有跑测试维护场景。提示走的是同一条 `--work-intent` 命令输出，理论上一样，但没有实测。
- **样本量**：
  - 每种宿主修复后只跑了 1 轮；
  - 测试维护场景每个版本最多 2 次有效运行；
  - “需求变了”写理由的最终改法只跑了 1 次；
  - 阶段收尾整理的 2/2 来自 W4v5b，之后 W8、W8b 只改了提示开头和理由部分，没有再跑这个场景；
  - 最终候选在 W8b 上多了 M8 的文件归属修正，只有单测覆盖。
  - 模型行为有随机性。
- **记忆混杂**：用户的 Codex 记忆里本来就有测试维护原则，所有 Codex 运行都能读到。它在各版本之间不变，不影响版本对比的结论。
- **Cursor、agy**：都没有在真实宿主上验证；Cursor 默认不装，agy 不做。

## 副作用与清理

- **`~/.codex/config.toml`**：
  - 测试期间，Codex 为每个可写测试目录自动加了项目信任（不是 hook 信任），共 128 段，分三次删除：W1/W2 后删 20 段，18:23 删 102 段，21:19 删 6 段。
  - 删除只针对测试目录的段，删除后文件仍能正常解析，测试路径条目为 0。每次删除前都留了完整备份，最近一份是 `~/.codex/config.toml.bak-hl014-cleanup-20261022T211934`（权限 600）。
  - 与开工时的备份（`~/.codex/config.toml.bak-hl014-20261022`）相比，另有 5 处差异，无法确定来源。都是 Windows 版 Codex 桌面相关的条目：
    - `[desktop]` 段被删；
    - `[mcp_servers.cua_repl]` 被删；
    - `[shell_environment_policy.set]` 被删；
    - bundled marketplace 的 source 改成了 WSL 路径；
    - `codex-app-tools` 插件被关闭。
  - 已知线索：WSL 下的 bundled marketplace 目录建于 04:59，当时只有本轮的 W4v2 Codex 运行在跑；前 4 处在 07:2x 已经出现，第 5 处出现在 07:24 到 18:23 之间。
  - 为免覆盖用户或其他工具的改动，这 5 处都没有还原。
- **Codex 额度**：今天在测试目录里启动的可写 Codex 会话约 130 次，以删掉的 128 段项目信任为准。其中大量中途失败，也消耗了用户的 Codex 额度。晚间改为轻量测试：每项改动 1 次有效运行，每次最多尝试 3 次。
- **Claude Code**：Claude Code 为测试项目建了 `~/.claude/projects/-home-…-linkshelf-claude/`，内含 4 份会话记录和一个空的 `memory/`；记录已复制到证据目录。`~/.claude.json` 只变了 4 个缓存或时间戳键。
- **Codex 记忆**：用户开着 `generate_memories`。目前没有发现测试会话进入记忆。
- **agy**：在 `/tmp` 下做过额度探测和 Hook 列表检查，都没有消耗 token；agy 可能为探测留下会话记录。临时目录已删除。
- **Framer 技能被误触发**：W4 的 S4 一次运行中，用户的全局 Framer 技能被“页面编辑”触发，模型在测试副本里运行了 `npx @framer/agent@latest setup`。没有输出，只在副本里留下两个空目录。
- **未动的范围**：
  - 没有动 Syn 或任何真实项目，只读查过这些项目的 git 历史和会话记录；
  - 没有提交、push 或发布；
  - 没有改全局 AGENTS.md，也没有改 Claude 或 agy 的全局设置。

## 0.14 发布说明草稿

只写有证据的内容：

- 支持 Claude Code：安装时把 Hook 写进项目 `.claude/settings.json`，与已有设置合并，卸载时逐字节还原。已在真实会话中验证 1 轮。
- 新装项目里，模型能自己保存计划、开工登记、完成后退场，不用用户维护任何 Harness 命令。Codex、Claude Code 各验证 1 轮。
- 阶段收尾时整理测试：
  - 阶段最后一个 leaf 退场后，Harness 先点名这一轮改过的测试文件、要求写明为什么改，再要求合并重复、删掉已删功能的测试、无关测试不动。
  - 在 Codex 真实会话中，阶段收尾整理 2/2 做到，无关小任务和修产品都没被带偏，“需求变了”时写理由 1/1。
- 常驻指令写明 AGENTS.md 和 CLAUDE.md 由用户维护，长期决定写进 Harness 的 plan 或 stage。实际效果还在观察。
- 一项检查都没跑时显示“未执行”，不再显示“通过”。
- 旧的待确认 push 不会卡住其他工作；push 写法不精确时，会提示改成精确写法。
- 换 Node 版本不再误报 Harness 被改动；但 Hook 命令的启动器被改写时会如实报告。
- 升级、卸载会保留用户自己的配置；卸载后不留空目录。
- Cursor Hook 不再默认安装。
- 不写：自动续跑（未验证）、agy（不做）。
