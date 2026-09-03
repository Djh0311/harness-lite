# HLNEXT-REPAIR R2F00 supervisor acceptance

日期：2026-08-31（Asia/Shanghai）

结论：`PASS / R2F00 ACCEPTED / R2F01-R2F02 READY / CANDIDATE REPAIR ONLY / NOT PUSHED / NOT RELEASED`

## Candidate 与 current 边界

- 在建立 R2 lifecycle 前，`tree.readChain()` 为 healthy、currentCount=0、stage=null、leaf=null、unfinished=0。
- 被拒 candidate fresh rebuild 精确为 34 files / 13 product JS；file digest `sha256:5daef70dacc7e8a178448802d8b30dd2dc699a4cd82b658a244038fdf597e266`，product digest `sha256:adb56138a4c0979fb586ca58aab3861cda506f25fa08d40963f463625c228c05`，candidate digest `sha256:ee3a584a949016a1b447f7e7f7257f1fbb3e1d86299730fc06a3192c66ecac60`。
- 当前目录仍不是 Git repo，git.repo=false/head=null；没有修改或伪造 provenance。
- R01-R18 冻结正文从 `## 一、冻结的需求基线` 到 `## 二、产品边界` 前的精确 hash 仍为 `sha256:1a69fc8dbbef7304938b9da1f20af9daf47f6b24b131b6d8861c8c906d66a719`。
- 已建立唯一 `stage-hlnext-repair-r2` / `HLNEXT-REPAIR-R2`，plan authority current，baseline digest `sha256:13480c18df475db601cfbad9fbcb15b5bdadf5804d72e9fcc991327ae47bbab7`，plan digest `sha256:e6789eef5376083b280eef39397f67759e550381ea7c658febb1b0bf17c63601`，plan-review current/PASS。

## 两个 fresh-install 直接反例

完整 durable receipt：`docs/harness/reports/HLNEXT-REPAIR-R2F00-counterexamples.json`，SHA-256 `sha256:080ad806be275e1693c5ee929818bd77eaf19add26ac6f5205639a436eea7620`。

主管在 disposable root 从当前 source 真实安装，install=`INSTALLED`、verify06=true；不向 Hook 注入 `work_unit_id`。同一项目写入三个 explicit-family available 模型，并用 installed delegation API 建立 PAR01/PAR02 两个无依赖、写面分别为 README-A.md/README-B.md 的 active unit。

SessionStart 与 UserPromptSubmit 均重复：

1. capability projection 内确有 Antigravity/Gemini、Cursor/Grok、GrokBuild/Grok 三个完整 normalized rows，但 Hook 只输出 `Antigravity/Gemini 3.7 Flash .../high:available…+2`；Cursor 与 GrokBuild 的 channel/model/reasoning/family/status 无真实可读取载体。稳定问题：`capability-manifest-all-models-visible`。
2. delegation ledger 确有 PAR01/PAR02 两个 active unit及 agent identity，Hook 却输出 `WorkUnit：id=UNKNOWN；status=leaf-fallback`；PAR01/PAR02 的 goal、direct acceptance、dependencies 和 unit write scope 均丢失。稳定问题：`parallel-active-work-unit-min-context`。

两个 context SHA 分别为 SessionStart `sha256:6a248bde50c40b1e7bf8f6531f7ba278c555ab2e3d73a736f2843494ffc2f390`、UserPromptSubmit `sha256:ce1c5f5b8cef93a97892a099a51a7df0922efc4d9fb994b930cdd855299eceff`。这两个失败来自 installed dispatcher 生产 caller，不是 helper/module 自测。

## Writer family 与失败继承

- 归档 R1 ledger `docs/harness/done/2026-08/HLNEXT-REPAIR-delegation.json` hash 为 `sha256:4eef6c707592c2ff8976b94b32f5134d18aaae21ebe584af2dfcd958dfa83d0b`。
- 两个失败涉及的 candidate-included `lib/capabilities.js`、`lib/tree.js`、`lib/hook.js` 均在 FIX01 writer 写面；实际 writer identity 为 channel=`collaboration.spawn_agent`、model=`gpt-5.5`、modelFamily=`openai-engineering`、reasoning=`xhigh`。FIX03 R1 的 gpt-5.4 replay 只写主管 evidence report，不是该产品实现 writer。
- 因此本报告落盘后，在 R2 ledger 中对两个稳定问题各继承且只登记一次 `openai-engineering` claimed-complete candidate effective failure；不是 92 次，也不因新 leaf/channel/session 清零。

## 当前工具面与派发边界

- 本轮 `collaboration.spawn_agent` 的真实 schema 提供 `gpt-5.5`、`gpt-5.4`、`gpt-5.6-luna`，以及恢复专用 `gpt-5.6-terra`/`gpt-5.6-sol`；没有 Grok/Gemini 可调用项。
- R2F01/R2F02 是普通工程任务，选择 `gpt-5.5/xhigh`，依据是当前可用普通工程模型中能力最接近；不占用 Terra/Sol，不为形式调用 Gemini。
- R2F01 仅 `lib/capabilities.js` + 专用 test；R2F02 仅 `lib/tree.js`/`lib/work.js` + 专用 test，真实写面不重叠，可并行。两者均禁止修改 `lib/hook.js`，公共接线归 R2F03。
- 旧 parser 尚不识别 `R2F00` 这种单字母后接数字的精确 ID；文档与 ledger 已按用户 ID 建立，该最小 ID 兼容作为 R2F02 `lib/tree.js` HOW 一并处理，不新增第三个 candidate failure、不扩大产品目标。

## 临时载体与禁止项

- counterexample receipt 固化后，精确删除 disposable `/tmp/hl-r2f00-OFv3yH`。
- fresh-check 另发现 8 个历史 `/tmp/hl-nv04-*.json` 普通 candidate artifact；逐个验证 realpath/type/kind/hash 后精确删除。删除不可恢复，但这些是旧 Harness 核验临时文件，不是工作区或用户数据。
- 终态 `/tmp` 无 `hl-r2f00-*` 或 `hl-nv04-*` 残留。
- 未派 writer、未修改产品、未 push/tag/release/deploy、未更新 external memory、未干扰 Poracode/watchdog/bridge。

R2F00 direct acceptance PASS。本报告落盘后才登记 R2F00 accepted；随后 R2F01/R2F02 可按互斥写面并行派发。
