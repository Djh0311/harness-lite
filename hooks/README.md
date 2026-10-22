# Harness Lite Hooks

Codex 与 Claude Code 的四个事件共用 `hooks/dispatcher.js`：Codex 读项目 `.codex/hooks.json`，Claude Code 读项目 `.claude/settings.json`，并以每次提问的 `prompt_id` 作为轮次。Cursor 适配未经真实宿主验证，默认不安装。`SessionStart` 和 `UserPromptSubmit` 恢复短链与 current leaf 最小投影，并只根据当前 leaf/委派/恢复状态加载已触发的 guidance；无 active 不展示 heartbeat，无失败不展示恢复链，无派发事件不展示 capability。`UserPromptSubmit` 另记录 user-role 来源 receipt 和 Git baseline；`Stop` 只在已登记 execute 意图、短期授权文件与当前 project/session/turn/leaf/stage 精确绑定且委派账出现带 evidenceRef 的 semantic progress 时返回顶层 `decision: "block"`；固定 continuation 先判为 internal，不能自签授权或扩大范围。`PreToolUse` 只匹配 `^Bash$`，消费固定 work-intent 入口并硬拦未确认的精确 push。

Hook 自身只投影和记账，不 spawn、poll、interrupt、takeover，也不维护后台 timer。leaf 内 work unit 可并行的依据是依赖和写面：无依赖且写面不重叠可同时 active；写面前缀重叠或共享状态冲突必须 integration owner、重拆或串行；`reported_complete` 与 `accepted` 分离，只有 `accepted` 解锁依赖。

指导模型在真实 spawn/wait/status/message/interrupt/takeover 工具调用之后，从已安装项目根目录加载稳定 runtime 模块：`const delegation = require("./.claude/harness-lite/lib/delegation.js")`，再直接调用 `delegation.recordAgentStatus()`、`recordAgentObservation()`、`recordAgentFailure()` 或 `recordAgentRecovery()` 记账；用户不需要、也不应运行 Harness 命令来同步 agent 状态。这个路径来自安装到项目内的 Harness runtime，不假设 npm package 解析。这些接口只写 delegation ledger，不连接 provider，不等待 agent，不中断 agent，不保存 prompt/transcript/code/credential。active unit 的 channel、model、modelFamily、reasoning、dependencies、writeScope、status 和 heartbeat/activity/progress 从同一 carrier 读回。

300000ms heartbeat 是只读 reminder。heartbeat 只更新 `heartbeatAt`，activity 只更新 `activityAt/activityKind`，semantic progress 只允许 verified-fact、route-eliminated、acceptance-advanced、root-cause-isolated、actionable-blocker 且必须绑定 evidenceRef。旧的文件/head/verify activity 不再冒充 semantic progress；当前 Stop 不再使用“同处失败三次”续跑/停点逻辑。

wait/status 观察以 300000ms 为单次上限：指导模型等待真实 agent 时，最多一次 wait/status 到这个窗口；到期只记录 heartbeat 或 activity，不能把沉默、long-tool、provider delay 当 semantic progress。只有真实完成标准直接验证后才记录 `reported_complete` 或 `accepted`；`reported_complete` 只触发主管验收，`accepted` 必须携带 `evidenceRef` 才解锁依赖。

无法从状态可靠观测的语义动作，由指导模型用只读 `hl status --intent <intent> --json` 取当次 guidance。九类事件（`leaf-definition`、`route-clarification`、`pre-dispatch`、`agent-active`、`agent-reported`、`problem-recovery`、`leaf-closeout`、`legacy-fact`、`push-attempt`）统一综合成一个 `focus`、一个 `decisionQuestion` 和一个 `nextAction`；intent 不授权、不伪造状态、不持久化，未知值拒绝。完整目标和完成标准通过带完整性标记与 sentinel 的 completion carrier 传递。只有真实命中的既有硬风险才出现拦截说明，普通路径不增加确认。

`project` profile 把 definition 精确合并到权威 root checkout 的 `.codex/hooks.json` 并保留外来组。`managed` profile 不写项目 Harness Hook，由管理员配置的 `managed_dir` 统一加载 global gateway；gateway 校验受保护 registry、allowlist 和 global runtime 后才转发。非法 JSON、未知 Harness 冲突、未知 digest 或不安全路径进入 HOLD。

官方 wire 字段使用 `hook_event_name`、`session_id`、turn 事件的 `turn_id`，Bash 命令使用 `tool_input.command`。`transcript_path` 不是稳定接口。PreToolUse 拒绝使用 `hookSpecificOutput.permissionDecision: "deny"`；普通非 push、非登记工具输出为空，绝不返回尚未支持的 `ask`。

Cursor 是第二条宿主适配，不改 Codex definition digest。`project` profile 把同一 `dispatcher.js --host cursor` 精确合并到 `.cursor/hooks.json` 的 `sessionStart`、`beforeSubmitPrompt`、`stop`、`beforeShellExecution`，并保留外来组。dispatcher 把 Cursor stdin（`sessionStart` / `beforeSubmitPrompt` / `stop` / `beforeShellExecution` / `preToolUse`+Shell）归一成上述四个 Codex 事件后走同一 `hook.dispatch`；stdout 只使用 Cursor 字段：`additional_context`、`permission`、`followup_message`。`conversation_id`/`generation_id`/`workspace_roots[0]`/`command` 映射到 `session_id`/`turn_id`/`cwd`/`tool_input.command`。观察账 `source` 为 `cursor-host-hook`。这只证明配置与 wire 适配，不能冒充 live Cursor host-events 或 health observed。

健康状态必须分别证明 installed、configured、trusted/policyTrusted、四事件 observed，以及 native pre-push configured/probed。证据 bundle 保存精简 hooks/list 前后快照、started/completed run id 和无秘密 receipt，再做 exact/ambiguous/missing join。Desktop、CLI、unknown-live 和 synthetic 分开计算，离线直接执行 dispatcher 不能补真实宿主或 Desktop。

原生 Git pre-push 是单独、repo-wide 的维护动作；需要精确授权后才链式保留外来 hook，并用 disposable local bare remote probe。它与 Codex PreToolUse 共用同一 pending + user-role event + 模型 push-assert 的一次性绑定和密钥扫描逻辑。wrapper 在已管理 worktree 发现 runtime identity 或 marker 损坏时 fail closed；未安装当前 Harness Lite runtime 的其它 worktree不介入，只链外来 hook。

## 0.14 内部工作意图

这是主管模型使用的内部接线，不是用户需要执行的新命令。主管先按完整请求判断目标、边界和动作，普通已授权工作直接推进。仅评审、规划、撤回和叫停不能登记为执行；代码不按 prompt 关键词判断许可。六个 `hl` 顶级接口保持不变，用户日常 Harness 命令为 0。纯提问、只做 push 都不用登记；push 由既有 push gate 单独处理。

### 开工前：建 stage 和 leaf

`execute`、`pause`、`exit` 都需要唯一的 current leaf，以及它对应的 stage。缺任何一个，登记都会以 `intent:current` 被拒，其他工具照常可用。leaf 由主管按用户的完整请求来写；它是工作投影，不是授权票。

- **只规划**（用户要先拆计划、暂不动代码）：把计划写成 `docs/harness/unfinished/<leaf>.md`，建好对应的 stage 文件，再登记 `non-execution`。计划落了盘，换了会话也能接着做。
- **开工**：`unfinished/` 里已有对应计划时，用 `resume` 恢复它，同一轮再登记 `execute`。没有计划时，直接新建 `docs/harness/leaves/<leaf>.md`（current 只能有一个），再登记 `execute`。

stage 文件放在 `docs/harness/stages/stage-<id>.md`：

```md
# 第二阶段
目标：本阶段要交给用户的结果
```

leaf 文件放在 `docs/harness/leaves/<leaf>.md`，只规划时放在 `docs/harness/unfinished/`：

```md
# 书签标签
阶段：stage-<id>
目标：用户最后拿到的结果
完成标准：
- 一条可以直接验收的结果
- 另一条可以直接验收的结果
允许动：
- src
```

- `<leaf>` 只能用英文字母、数字和 `.`、`_`、`-`。`阶段` 后的第一个词必须等于 stage 文件名（不含 `.md`）。
- 用户明确不许动的路径，写在 `不许动：` 列表里。
- 一条完成标准里不要用逗号、顿号或分号，否则会被拆成多条。`exit` 时，按上下文显示的完成标准逐条给证据。
- 需要分工时，再加 `## 工作单元 A1 <标题>` 小节：编号后接空格，不要接冒号。字段写法相同，可以加 `依赖：`。

### 登记命令

真实 `UserPromptSubmit` 的上下文里有一行 `WorkIntent：`，内容取决于是否已有可用的 current leaf：

- 已有：这一行直接给出本轮可用的 `execute` 命令。
- 还没有：这一行给出本轮的 `sourceReceipt`，并指向上面的「开工前」。

登记时，在已安装项目的根目录，通过宿主 Bash 工具单独调用：

```sh
node ".claude/harness-lite/hooks/dispatcher.js" --work-intent '{"sourceReceipt":"u-<本轮20位十六进制来源>","action":"execute"}'
```

替换来源值，不复制示例占位符。需要自动生成安全 shell quoting 时，可用已安装 `lib/hook.js` 的 `intentCommand(request)` 返回命令，再通过真实 Bash 工具执行。不要把 helper 包进 `node -e`、`cd &&`、管道或附加 shell 动作。命令里的 JSON 只接受固定字段：

| action | 除 `sourceReceipt`、`action` 外的字段 | 含义 |
| --- | --- | --- |
| `execute` | 可选 `waitingForPush`，必须是当前精确 pending ID | 登记本轮执行，不包含 push 许可。只有确实只能等待该目标时才写等待字段，独立工作继续时省略 |
| `non-execution` | 无 | 规划或评审，关闭本轮执行登记 |
| `revoke` | 无 | 撤回或叫停，关闭本轮执行登记 |
| `pause` | `reason`、`resume`，均为非空字符串 | 安全暂停唯一 current leaf，记录原因和恢复条件 |
| `resume` | `leaf`，是 unfinished 中唯一、精确的文件名，可带 `.md` | 没有 current 时恢复该 leaf；同一真实用户轮可随后 `execute` |
| `exit` | `evidence` 数组，每项只有 `standard`、`evidenceRef` | 当前 leaf 退场，每条完成标准都必须覆盖；退的是这个 stage 最后一个 leaf 时，输出里的 `nextAction` 就是阶段收尾要做的事 |

`exit` 的 `standard` 要逐字匹配当前 leaf 完成标准，`evidenceRef` 必须是项目内安全的相对路径，指向非空普通文件，不能经过符号链接。可由同一证据文件覆盖多条标准。代码检查覆盖和文件摘要，**不证明内容满足标准**；主管仍须直接验收真实结果，不能用自报 complete、日志存在或测试绿替代。只有真实结果成立才调用 `exit`，无需用户移动文件。

写入只发生在宿主 `PreToolUse` 消费命令时；它从真实事件补齐 project/session/turn/leaf/stage 和到期时间，再调用既有 issuer 或生命周期函数。随后 dispatcher helper 只读回匹配的成功结果；绕过宿主直接启动 helper 不会生成许可或移动 leaf。不接受手写绑定、`authorized`、`expiresAt` 或注入字段，也不接受 agent 来源、跨轮来源、多个 current 或猜测目标。

同一来源重放不刷新开始时间或租约，内部 continuation 不开启新登记窗口；原有有效 execute 的重放仅可读回，不续命。`non-execution` 或 `revoke` 之后，同一来源不能再执行；无关 session 的仅评审意图不关闭另一 session 的执行绑定。授权上限仍是本轮开始后 24 小时，Stop 不签发或续期，只作证据绑定的兜底；最终不续跑时只关闭匹配该轮的活动授权。最终 Stop 把来源 ID 留在既有观察账，再删除临时 turn；后续重放已收口的同一来源不能重新开启 24 小时窗口。

`.observed.jsonl` 只留每事件的最终决定、一个原因及必要来源/意图摘要，不保存原始命令或用户消息。`hl status` 按需展示近期原因。入口被拒绝只影响该次登记，普通安全工具和独立分支不被冻结；遇到 UNKNOWN 不擅自清理、改写或扩权。
