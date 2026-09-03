# HLNEXT-REPAIR FIX02 R1 supervisor direct acceptance

日期：2026-08-31（Asia/Shanghai）

结论：`PASS / FIX02 ACCEPTED AFTER R1 / FIX03 READY / CANDIDATE ONLY / NOT PUSHED / NOT RELEASED`

## R1 反例闭合

- 安装文档与两份相关 skill 现在统一要求指导模型从已安装项目根加载 `require("./.claude/harness-lite/lib/delegation.js")`，明确不假设 npm package 解析、不要求用户运行 CLI。
- 主管重新创建临时新项目并真实 install；安装 runtime 的 README 包含该 specifier，从项目根执行文档路径 status 0。
- 同一独立进程实际调用 `recordAgentStatus()` 后返回 `RECORDED`，`read()` 为 live；channel=`collaboration`、model=`gpt-5.5`、modelFamily=`openai-engineering`、reasoning=`xhigh`、dependencies、writeScope、status 全部从安装项目 carrier 读回。
- 旧错误 bare specifier `require("harness-lite/lib/delegation.js")` 在当前产品/skills/tests 无命中。

## 完整 FIX02 直接验收

- 本轮主管在真实项目 carrier 上使用受支持 API 回填两名真实 writer 的 channel/model/modelFamily/reasoning、两轮首候选心跳、FIX02 R1 五轮心跳和 reported_complete；读回精确一致。API 只记账，不调用 agent/provider。
- 临时安装探针分别记录 heartbeat、activity、evidence-bound semantic progress、reported_complete、accepted；reported 不解锁 FIX03，accepted 后才解锁。
- 制造两个同一 stable problem、同 family、跨 channel/session 的直接验收有效失败，再制造 provider transport failure：API 的 effective counts 依次 1/2/2；磁盘为 effective=2、counted=2、non-counting=1、problem=1，证明换 channel/session 不复位且普通工具/provider 故障不增加。
- 原 ordinary 5 → Terra once → Sol default 3/configurable 1..5、重复否定路线 drift、PASS 清问题租约等 recovery 回归保持通过；未建立第二状态系统、CLI 或 provider/agent adapter。

## 测试

- `node --test test/fix02-delegation-record.test.js`：4/4 PASS，其中 1 项为真实 install 后从项目根加载并最小 record/readback。
- `npm test`：91/91 PASS；原 85 项全部保留。
- R1 监督使用五个完整 `300000ms` wait/status 窗口，第六次同参数等待提前返回 COMPLETE；没有 30/60 秒忙轮询或无证据介入。

R1 精确反例已闭合。历史有效失败保留为 audit，当前 stable problem 由本次 direct acceptance PASS 关闭；FIX02 登记 accepted，FIX03 可解锁。
