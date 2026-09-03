# HLNEXT-REPAIR FIX03 R1A supervisor direct acceptance

日期：2026-08-31（Asia/Shanghai）

结论：`FAIL / FIX03 R1B REPLAY REQUIRED / NON-COUNTING EVIDENCE-TASK CONFLICT / CANDIDATE UNCHANGED`

已通过的真实证据：

- 唯一指导模型从 root 实时工具面直接调用 `collaboration.spawn_agent`，派出 `/root/hlnext_fix03_r1_disposable_worker`，model=`gpt-5.4`、reasoning=`xhigh`。Harness 源码没有调 agent。
- 监督只调用一次 `wait_agent(timeout_ms=300000)`，工具在 worker COMPLETE 时提前返回，没有短轮询。
- 新建临时 Git 项目 `/tmp/hl-fix03-r1-live-EiO3uv`并真实安装 current candidate，`verify06.ok=true`。installed SessionStart=1313 chars、UserPromptSubmit=1369 chars，实际可见 LIV01 goal/direct acceptance/route basis/boundaries、known/available capability projection 与 300000ms heartbeat。
- installed delegation ledger 在派发前保存 channel=`collaboration.spawn_agent`、model=`gpt-5.4`、modelFamily=`openai-engineering`、reasoning=`xhigh`、writeScope=`README.md`。
- worker 明确 COMPLETE 后才登记 reported_complete；README marker `HL-FIX03-R1-LIVE-WORKER-PASS` 精确出现 1 次，此时 LIV02 `ready=false / LIV01 accepted=false`。

直接验收失败：

- R1A 任务同时要求 worker “自己运行 installed SessionStart”和“期间除 README 外项目字节不变”。真实 SessionStart Hook 会合法更新 `docs/harness/usage/.observed.json` / `.observed.jsonl`；时间戳直接显示该生产观测发生在 worker Hook 运行时。
- 因此 pre/post 非 README tree digest 从 `sha256:6d72d9fd60b90bd103dc1820be7ef2959b1815c2d3e798725951994f84f6a750` 变为 `sha256:4b1e5d3681509ab869d2c3a722dce63d12816eee329e9c535a56b8a956fc9512`；不能按 R1A 字面 direct acceptance 证明“worker 期间除 README 外零变更”。
- 这不是产品 candidate 语义失败，而是验收任务把必需的生产 Hook 观测副作用与 worker 写面零变更设为互相冲突。登记 non-counting `exploration-negative`，不升级 Terra/Sol。

精确 R1B：用新的 disposable 真实安装项目；指导模型在 worker 派发前自己运行并直读两个 Hook，再冻结所有非 README 字节。worker 只读 AGENTS.md/CLAUDE.md 并只写 README marker，不再自行运行有状态观测的 Hook。worker COMPLETE 后、任何主管 ledger 写入前先重算非 README tree；相同才继续 reported/accepted 解锁。
