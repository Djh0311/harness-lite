# Harness Lite 0.12 HL12F07 supervisor review R10

结论：FAIL，返修行为评测。

## 直接可用的模型连接证据

在与项目和 Poracode 环境隔离的临时目录中，主管实际调用了两个不同家族：

```text
Codex  gpt-5.6-sol       exit=0，收到 agent_message JSON
Grok   grok-4.6-build    exit=0，收到 end_turn JSON
```

两次调用都使用只读/plan 约束，提示明确要求不调用工具、不写文件；两者都返回了预期 JSON。环境中没有 `PORACODE_HOOK_URL/SECRET/THREAD_ID`，因此没有宿主状态转发。这个证据足以说明“当前没有真实 model connector”不成立。

## 当前载体的问题

`docs/harness/artifacts/harness-lite-0.12.0-behavior.json` 仍是：

```json
{"status":"UNKNOWN","families":[],"reason":"No real model connector ..."}
```

它没有任何 0.11/0.12 配对调用、模型家族、成功样本、盲评 rubric 或场景级结论。`test/hl12-f07-candidate.test.js` 也把这个过时的 UNKNOWN 形状当作唯一合法结果。因此当前 F07 既没有完成计划要求的行为 PASS，也没有诚实记录已知可用连接器。

## 必须返修

1. 保留八类既定场景，固定同一用户目标、事实和工具；只替换 0.11/0.12 guidance。场景至少覆盖普通安全任务、关键未知、多事件单重点、多 runnable、reported 未 accepted、局部失败、绿测但缺用户结果、真实 hard-risk gate。
2. 使用执行时真实可调用的两个不同家族（当前可用的 `gpt-5.6-sol` 与 `grok-4.6-build`），每个版本×场景×家族至少完成 3 次成功调用；认证、传输、provider、排队和工具故障单独记为环境问题并补样本，不能算模型失败。
3. 评测记录要有版本盲化的 rubric 结果：第一动作、是否直接推进、是否无谓提问/治理轮次、依赖与 accepted 判断、局部失败边界、完成判断和 hard-risk 范围。不能只比较关键词或回答措辞；不能把完整 prompt/transcript 塞进运行时产品。
4. 将调用状态、family、场景、样本数、每格通过数、关键失败和必要的响应摘要/摘要 digest 写成新的 behavior artifact；更新 F07 测试同时接受并严格验证真实 PASS 结构，只有确实无法完成时才记录带精确原因的 UNKNOWN。
5. 若真实结果发现 guidance 产品缺陷，退回最小 owning unit（不要在评测结果里偷偷修改产品）；行为未达到计划阈值时 F07 必须 FAIL。重新跑 source/materialized 必要矩阵和 deterministic candidate。

在真实配对样本和盲评证据齐全前，F07 不能 accepted，也不能进入 F08。

