# H﻿LNEXT-REPAIR R2F05 supervisor direct acceptance — PASS

日期：2026-09-01（Asia/Shanghai）

状态：`PASS / R2F05 DIRECT ACCEPTANCE / ACCEPTED AFTER THIS REPORT / CANDIDATE ONLY / NOT PUSHED / NOT RELEASED`

独立 reviewer `/root/hlnext_r2f05_r1_independent_reviewer`（gpt-5.6-luna/xhigh，未参与 R2F01-R2F04 实现）先返回明确 PASS；其报告 SHA-256 为 `sha256:aaff0ca7c8c68c5c14c40f23ecadec0d59adfc36e4210fc49fde7619076cefcf`。主管先把该结果登记为 `reported_complete`，此时 R2F05 不在 accepted 集合；随后完整读回报告并执行以下独立终验。

## Candidate artifact 与 joined production caller

- 主管重新构建并独立 hash 当前 artifact：37 files / 13 product JS，978575 bytes。
- candidate/artifact digest：`sha256:285fffb4a7f873d0a9959f7a04eabcc2d57c4f6ad5d28894619463da3083e558`。
- file digest：`sha256:6712ce695518c3181fda608473981373e78c9989d82b284ef187c5374014ed1c`。
- product digest：`sha256:f0ed420560bcd12aa1cca521cf04d0f8f94292ff063bc00786520e78020045de`。
- provenance 如实为 `git.repo=false / head=null`；未伪造 Git 身份。
- 主管从 artifact 的 `files/contentBase64/mode` 物化全新 candidate source，再从该 source 安装全新项目；install=`INSTALLED`、installed `verify06=true`。没有只从工作副本安装冒充 candidate acceptance。
- 生产调用链重新追踪为 `lib/capabilities.js:project()`、`lib/tree.js:workUnitPackages()`、`lib/work.js:parallelWorkUnitContext()` → `lib/hook.js:hookContext()/sessionStart()/userPrompt()/dispatch()` → installed `hooks/dispatcher.js`，不是 helper-only 路线。

## 两个原始反例与 lifecycle

- 未向 dispatcher 输入 `work_unit`、`workUnit`、`work_unit_id`、`workUnitId` 或 `harness_lite_work_unit`。
- 注入 Cursor/Grok 4.6 High、GrokBuild/Grok 4.6 High、Antigravity/Gemini 3.7 Flash High；SessionStart 与 UserPromptSubmit 逐项显示 channel/model/reasoning/explicit family/status，没有模型首项加 `…+2`。
- 建立 R2F51/R2F52 两个无依赖、写面不重叠 active unit；两个 Hook 事件均显示各自 id/goal/direct acceptance/dependencies/write scope/agent identity，没有 `WorkUnit：id=UNKNOWN` 或 `leaf-fallback`。
- SessionStart=1587 chars，SHA `sha256:9167985f5af3fc4413ff7b51ed26c6d9207bf85daf154acd5fdcf003542df9b9`；UserPromptSubmit=1643 chars，SHA `sha256:0811cf4fd0a10fc4743e88b44f3cfc66623ec103f4770bff95366f9024f952f2`；均小于 1800。
- `reported_complete` 时 dependent ready=false；主管 `accepted` 后 ready=true。独立 reviewer 另直接通过 blocked/partial branch-local、write conflict、missing/name-only/large/oversize manifest、heartbeat/activity/progress 分离。

## 恢复账、监督与完整矩阵

- 独立 reviewer 在 disposable installed ledger 上完整走 ordinary 5 → Terra xhigh 1 → Sol xhigh default 3，以及配置 Sol limit=2、provider/tool/auth/quota 非计数、换 channel/session 不复位、重复 route 只 drift、acceptance_pass 只清当前租约；未污染 workspace ledger。
- workspace 真实 recovery ledger 在主管终验前保持：failure events=2、counted=2、effective=2、problem=2、lease=0；两个稳定问题各 count=1/status=accepted。R2F05 R0 tool-surface blocker没有进入产品 failure ledger。
- 原始 root orchestration JSONL 从 R2 Kickoff line 4538 后重新解析，主管终验读取时共有 10 次 `collaboration.wait_agent`，timeout 值集合仅 `[300000]`，完整到期 4 次，所有 call 均有 matching output；30000/60000 次数为 0。
- R0 gpt-5.4 reviewer 未做产品验收且缺 collaboration 工具，已精确登记 `BLOCKED / NON-COUNTING`；报告 SHA `sha256:f0071f5e78bf011c54dfd1712a0b187af711c2912c473539f44f5020ffad1a53`。R1 reviewer 在两个完整五分钟 heartbeat 后，于第三次同规格 wait 内提前 PASS；无无证据 message/interrupt/takeover。
- 主管终态复跑：`npm test` 105/105 PASS；selfcheck `ok=true` 且内部接口=6/用户命令=0；产品 JS 13/13 syntax PASS；NV05 integration 11/11 PASS。
- 主管双 candidate 构建 byte-for-byte identical，digest 均为 `sha256:285fffb4a7f873d0a9959f7a04eabcc2d57c4f6ad5d28894619463da3083e558`。
- R01-R18 frozen bytes=4772，digest 仍为 `sha256:1a69fc8dbbef7304938b9da1f20af9daf47f6b24b131b6d8861c8c906d66a719`。
- fresh/managed install、固定 0.9.1 upgrade、coherent tamper/relabel/extra-path HOLD 零写、fault rollback preimage、host evidence 和 native disposable pre-push gate 均由 reviewer 与主管复跑的物理矩阵通过。
- 无 provider adapter、静态目录、daemon、credential store、UI scraping、产品 transcript 依赖或 Harness agent 调用。

## 临时载体与禁止项

独立 reviewer 与主管的精确 `/tmp/hl-r2f05-review-*`、`/tmp/hl-r2f05-supervisor-*`、`/tmp/hl-r2f05-final-matrix-*` 均经 prefix/realpath 校验后由 Node 精确删除；终态匹配目录为 0。删除的是 disposable 验收载体，不是用户或工作区数据，且不可恢复。

未 push、tag、release、deploy；未更新 external memory；未杀死、重启或干扰 Poracode、watchdog、bridge。

主管 direct acceptance：`PASS`。只有本报告落盘后才登记 R2F05 `accepted`；随后按用户顺序归档 leaf、stage 与最终 delegation ledger，停止在 candidate-only。
