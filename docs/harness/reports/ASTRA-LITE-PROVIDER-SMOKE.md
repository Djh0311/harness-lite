# Astra provider smoke

日期：2026-09-05

结果：`PASS — provider reachable for a read-only smoke only`

- 请求模型：`gpt-6-astra`
- 接口：Responses-compatible `codex exec --json`
- 临时目录：`/tmp/hl-astra-smoke-5gsNrQ`
- 返回：`{"provider":"gpt-6-astra","readOnly":true}`
- 线程：`01a06ff4-e0b0-7720-966f-f5b5f40c6f6f`

这个结果只证明当前 CLI 能调用 Astra 并返回一条只读响应，不证明 Harness Lite 的真实任务协作、委派、恢复或产品结果已经通过。Grok 固定场景执行另存为 `ASTRA-LITE-GROK-EXECUTION.json`；当前为 `UNKNOWN`。
