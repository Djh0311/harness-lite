# HLNEXT-REPAIR FIX03 supervisor direct acceptance

日期：2026-08-31（Asia/Shanghai）

结论：`PASS / FIX03 ACCEPTED / JOINED RUNTIME AND REAL AGENT WORKFLOW PASS / FIX04 READY / CANDIDATE ONLY / NOT PUSHED / NOT RELEASED`

## 真实 agent 工作流

- 主管直接使用宿主 `collaboration.followup_task` 派出唯一 integration owner（`gpt-5.5/xhigh`，本轮无 Grok）；Harness 产品没有调用 agent 工具。
- 主管用一次完整 `wait_agent(timeout_ms=300000)` 得到真实五分钟 timeout，第二次同参数在 COMPLETE 时提前返回；没有 30/60 秒轮询或无证据介入。
- 项目真实 delegation carrier 由受支持 API 保存 FIX03 的 channel=`collaboration.followup_task`、model=`gpt-5.5`、modelFamily=`openai-engineering`、reasoning=`xhigh` 和 heartbeatAt；writer COMPLETE 后只登记 `reported_complete`。
- 此时 FIX04 依赖直读为 `ready=false / FIX03 reported_complete accepted=false`，证明报告完成没有解锁。

## 主管 joined direct acceptance

- 主管另建临时新项目执行真实 install，并把本轮实际可用 writer/等待工具投影为一次性结构化 manifest；未向 Hook 人工传 `work_unit*`。唯一 active ledger unit 自动选择 FIX03。
- 安装 runtime SessionStart 长 1240 chars，实际可见 FIX03 goal、direct acceptance、route basis、boundaries 和 `collaboration.followup_task/gpt-5.5/xhigh:available`；同测试还覆盖 UserPromptSubmit、manifest 缺失时的真实工具定义/UNKNOWN 指引及 1800 chars 分类保留。
- 通过安装 runtime 的 `./.claude/harness-lite/lib/delegation.js` 记录本次真实 agent 四项身份、300000ms heartbeat、reported_complete 和 accepted：reported 时下游不解锁，主管 PASS/accepted 后解锁。
- disposable temp carrier 中制造 evidence-bound claimed-complete failure：API effective=1、磁盘 effective=1；再记录 provider transport fault，provider counted=false、磁盘 non-counting=1；随后 acceptance_pass 关闭该受控问题。项目真实 recovery ledger 未被测试污染。
- joined E2E 另以跨 channel/session 的第二条实质不同 route 验证仍为同一 problem/lease；不是按 channel/session 复位。
- 产品 13 JS 扫描无 `spawn_agent/wait_agent/followup_task/interrupt_agent` 调用，无 provider adapter、daemon、credential/static catalog、UI/transcript 依赖；指导文本中的名称不是产品调用。

## 集成修复与测试

- joined 测试在正常生产上下文暴露两个 dependency 被旧单项摘要截断，integration owner 仅把 TaskData dependency 样本增至 2 并微调该行预算；这是完成前的直接集成发现，不是 claimed-complete failure。
- 新增 `test/fix03-joined-runtime.test.js`，从真实临时 Git project install → installed dispatcher → installed record API 完整贯穿。
- `node --test test/fix03-joined-runtime.test.js`：1/1 PASS。
- `npm test`：92/92 PASS；原 85 项全部保留。

FIX03 direct acceptance PASS，登记 accepted 后才解锁 FIX04。
