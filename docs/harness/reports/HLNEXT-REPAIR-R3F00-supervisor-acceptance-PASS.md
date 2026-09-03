# HLNEXT-REPAIR R3F00 supervisor acceptance

日期：2026-09-01（Asia/Shanghai）

结论：`PASS / R3F00 SUPERVISOR ACCEPTED`

- 从当前源码构建 artifact，candidate digest 精确为 `sha256:285fffb4a7f873d0a9959f7a04eabcc2d57c4f6ad5d28894619463da3083e558`；37 files / 13 product JS，file/product digest 与 R2 closeout 一致。
- 从 artifact `contentBase64/mode` 物化新 source，再 fresh install 到新项目；不是只调用工作目录 helper。
- 五模型 Hook-input 在 SessionStart/UserPromptSubmit 均输出 `shown=0/5`、`embedded-projection:embedded` 和 `complete=true`，Terra/Sol 均未进入 additionalContext。
- 24 模型 Hook-input 在两个事件均输出 `shown=0/24`、`embedded-projection:embedded` 和 `complete=true`，dispatcher 退出后没有读取路径。
- 当前 fresh-check 前 tree health.ok=true、currentCount=0、unfinishedLeaves=0、stage=null、leaf=null，live delegation 缺失；R2 archive 存在，但 NEXT 顶部仍称 R2F04 current/R2F05 未 PASS，plan 仍把 R2 stage/leaf 列为 active。
- R01-R18 精确区间 bytes=4772，digest=`sha256:1a69fc8dbbef7304938b9da1f20af9daf47f6b24b131b6d8861c8c906d66a719`。
- R2 archived ledger 将产品载体公共接线绑定到 R2F03、索引绑定到 R2F04；两者 writer 均为 `modelFamily=openai-engineering`。因此两个稳定 problem 各登记一次当前 candidate 有效失败；五模型/24模型是同一问题重放，不重复计数。
- 本轮真实 collaboration 工具模型只有 `gpt-5.6-sol`、`gpt-5.6-terra`、`gpt-5.6-luna`、`gpt-5.5`、`gpt-5.4`；无 Grok/Gemini。Terra/Sol 保留升级，普通工程实现选当前普通工程模型。
- 当前目录不是 Git repo，provenance 为 `git.repo=false/head=null`；未 push、tag、release、deploy，未更新 external memory，未干扰 Poracode/watchdog/bridge。

证据载体：`docs/harness/reports/HLNEXT-REPAIR-R3F00-counterexamples.json`。

R3F00 direct acceptance PASS，允许解锁 R3F01/R3F02。
