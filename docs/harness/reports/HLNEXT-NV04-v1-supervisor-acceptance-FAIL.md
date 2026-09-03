# HLNEXT NV04 v1 — Supervisor Acceptance FAIL

结论：`FAIL / SAME WRITER REPAIR R1 / NV05 NOT STARTED`

候选：`sha256:3ac9565224f8c1fbbc78e3b92af39cdaa9d41810747a4eb5d9c375543cae9acf`

主因：问题级 lease 只是结果投影，没有成为后续 effective failure 的权威 tier 门；去重/drift 也只在 family problem 内判断，而不是 lease/problem 全域。

独立直接复现：

- 没有普通五次时，首个 `modelFamily=terra + completeRecovery=true` 被计数并直接生成 Sol lease。
- 普通 family 五次已触发 Terra 后，第 6 个同 family ordinary failure 仍 `counted=true`；切另一普通 family 还能再累计完整五次。
- Terra 已失败并进入 Sol 后，第 2 个 Terra complete recovery 仍计数；Sol 第 3 次 exhausted 后，第 4 次仍 `counted=true`，Sol problem count 变为 4。
- Grok 已证伪的同一 primary cause/substantive route 换成 Gemini family 后被当作新有效失败，`drift=false`。
- 一个问题 exhausted、独立问题 Terra active 时，汇总被压成全局 `tier=exhausted/status=blocked/next=blocked`；虽然 active 列仍存在，但顶层投影会把独立 active 分支误表述为整体阻塞。

必须保持：现有 evidence-bound 分类、事件幂等、nested shape、PASS 精确清 lease、NV03 lifecycle/1800 预算与全部旧回归。

计数：同一完整候选的多条断言归为一个 primary cause；普通 writer 家族在 NV04 累计 1 次有效失败，未触发升级。

载体：snapshot working copy；not pushed；not released。
