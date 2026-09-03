# HLNEXT-REPAIR FIX00 supervisor direct acceptance

日期：2026-08-31（Asia/Shanghai）

结论：`PASS / FIX00 ACCEPTED / REPAIR BASELINE FROZEN / CANDIDATE ONLY / NOT PUSHED / NOT RELEASED`

## Fresh-check

- 当前目录不是 Git repo：`git rev-parse` 与 `git status` 均返回 `fatal: not a git repository`；因此不虚构 branch/commit/clean WIP。文件边界以 candidate digest、当前生命周期和实时 agent 状态固定。
- 本轮开始前 `status --json` 为无 current stage/leaf、health healthy；历史 writer/reviewer 全部 COMPLETE，无活动 agent 或共享写面竞争。
- `node scripts/build-candidate.js --json` 重算：version `0.10.0`、31 files、13 product JS、candidate `sha256:bf33bfdce121e19a22fb7c236918301607f39c635f54dab3fe9814dc70746828`，与用户指定基线精确一致。
- 本轮真实 agent 工具定义没有 Grok/Gemini；可用于普通工程实现的当前模型含 `gpt-5.5`、`gpt-5.4`、`gpt-5.6-luna`。按用户规则选择 `gpt-5.5/xhigh` 作为 FIX01/FIX02 普通工程 writer；Terra/Sol 保留给有效失败恢复。

## 八条直接反例

1. 临时新项目真实 project install 成功，实际 `AGENTS.md` 与 `CLAUDE.md` 均不含“产品实现/修复必须派 writer、讨论/只读分析不为形式强制派”的完整区分。
2. 两份实际指导文本均不含 Grok 偏工程、Gemini 偏前端。
3. 两份实际指导文本均不含“先用最短直接证据”及“诊断方式不自动成为最终产品架构”。
4. 在临时项目建立带唯一 sentinel 的 goal、directAcceptance、routeBasis，并向两个 Hook 输入结构化 capability manifest；`workUnitPackage()` 可直接返回三个 sentinel，但实际 SessionStart（819 chars）和 UserPromptSubmit（894 chars）均看不到 goal、direct acceptance、route basis 或 capability model sentinel。
5. 全仓生产 caller 搜索：`workUnitPackage()` 只有 `lib/tree.js` 定义和 `test/nv01-delegation.test.js` 调用；`normalizeManifest()` 只有 `lib/capabilities.js` 定义和 `test/nv02-capabilities.test.js` 调用，无 joined production caller。
6. 临时真实 delegation event 写入 channel/model/modelFamily/reasoning 后状态为 `RECORDED`；读回四项全部为 null，而 dependencies/writeScope/status 可读，精确证明 agent 身份丢失。
7. 历史 FAIL 报告明确累计有效失败（NV03 最多 4、NV04 最多 4、NV05 为 1），但当前 `docs/harness/delegation.json` 没有 `failures` 字段，recovery events/problems 均为 0。
8. 当前 `NEXT-VERSION-DISPATCH-PLAN.md` 顶部仍写 `NOT ACTIVE / NOT EXECUTED` 并声称“不创建 stage/current leaf、不启动 writer”，与已发生执行及当前返修状态冲突。

所有临时项目已删除；FIX00 未修改产品代码。上述反例全部可重复，旧 NV06 PASS 仅登记为历史，不用于当前验收。

## 并行写面判断

- FIX01：`lib/install.js`、`lib/tree.js`、`lib/capabilities.js`、`lib/hook.js`、唯一测试 `test/fix01-guidance-runtime.test.js`。
- FIX02：`lib/delegation.js`、`lib/work.js`、必要时 `bin/hl.js`、两份 skills、`hooks/README.md`、唯一测试 `test/fix02-delegation-record.test.js`。
- 精确文件集合不重叠；两者不改共享 lifecycle/delegation carrier/candidate 文档。因此允许在同一 leaf 内并行，由主管统一验收并在两者 accepted 后才解锁 FIX03。
