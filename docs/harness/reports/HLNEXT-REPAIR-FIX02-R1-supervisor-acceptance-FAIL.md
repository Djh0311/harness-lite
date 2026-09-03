# HLNEXT-REPAIR FIX02 R1 supervisor direct acceptance

日期：2026-08-31（Asia/Shanghai）

结论：`FAIL / FIX02 REPAIR REQUIRED / FIX03 LOCKED / CANDIDATE ONLY / NOT PUSHED / NOT RELEASED`

主管已通过的部分：受支持 API 本体可在安装 runtime 以绝对/实际相对路径调用；agent 四项身份、依赖、写面、heartbeat/activity/progress、reported/accepted 均在同一 carrier 恢复；reported 不解锁、accepted 解锁；有效失败 API 与落盘 ledger 同源计数；换 channel/session 不复位同一问题；provider fault 不计数；20/20 定向与 recovery、90/90 全测通过。

直接验收失败：

- 当前新安装项目的 `hooks/README.md` 指导模型调用 `require("harness-lite/lib/delegation.js").recordAgentStatus()` 等接口。
- 主管在临时真实 install 后，从项目根执行该文档 specifier：Node status 1、`MODULE_NOT_FOUND`。
- 同一安装实际可用的 `require("./.claude/harness-lite/lib/delegation.js")` status 0，`recordAgentStatus` 为 function。
- 因此 API 虽存在，但模型可读的受支持生产入口写错；新项目不能按当前指导直接记账，不满足“稳定、零用户负担、仅供指导模型使用”的 joined 入口。

精确返修：FIX02 只修正 installed-project 可解析的稳定 module specifier/调用示例，并新增真实 install 后按文档路径加载和执行最小 record 的回归。不要改 FIX01 写面，不要建立 CLI/第二状态系统。

有效失败账：`claimed-complete-acceptance-failure`，stable problem `installed-record-api-module-specifier`，普通 `openai-engineering` family 第 1 次；API 与磁盘均为 event=1、counted=1、effective=1、problems=1、leases=0，tier ordinary。未触发 Terra/Sol。
