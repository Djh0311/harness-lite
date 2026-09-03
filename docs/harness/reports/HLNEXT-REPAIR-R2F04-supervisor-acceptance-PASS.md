# H﻿LNEXT-REPAIR R2F04 主管验收 — PASS

日期：2026-08-31（Asia/Shanghai）

状态：`PASS / R2F04 ACCEPTED / R2F05 READY / CANDIDATE ONLY / NOT PUSHED / NOT RELEASED`

writer 的 COMPLETE 已先登记为 `reported_complete`，此时 R2F05 gate 仍为 false。主管随后独立重算文档边界、重跑完整测试/安全矩阵、自检/语法并重新构建两份 candidate；本报告不采信 writer 自述替代 direct acceptance。

## 文档与历史保护

- `NEXT-VERSION-DISPATCH-PLAN.md` 顶部现明确为 `HISTORICAL FROZEN DISPATCH BASELINE / NOT CURRENT EXECUTION STATE`。
- active 期间 authoritative current leaf 指向 `docs/harness/leaves/HLNEXT-REPAIR-R2.md`；最终索引只列计划中的 R2 done 和 R2F04/R2F05/final closeout 报告路径，并明确这些路径不代表尚未发生的验收。
- 顶部明确 R2F05 尚未 PASS；不再把已归档 R1 leaf 当 current，也不再把历史 `NOT ACTIVE / NOT EXECUTED` 当当前状态。
- 主管以从 `## 一、冻结的需求基线` 开始、到 `## 二、产品边界` 之前结束的精确字节重算：start=931、end=3047、bytes=4772、R01-R18 digest=`sha256:1a69fc8dbbef7304938b9da1f20af9daf47f6b24b131b6d8861c8c906d66a719`，与 R2F00 冻结值完全相同。
- writer 写面只有 NEXT 顶部和新的 R2F04 writer 报告；产品/测试代码、delegation、stage/leaf、done 与历史 PASS/FAIL 报告未由 writer 修改。external memory 未修改。

## 完整回归与安全矩阵

- `npm test`：105/105 PASS，fail=0。
- `node bin/hl.js selfcheck --run --json`：`ok=true`，其内全测 PASS；用户命令=0，内部接口=6。
- candidate 定义的 13 个产品 JavaScript 均独立 `node --check` PASS。
- `node --test test/nv05-integration.test.js`：11/11 PASS，fail=0。
- NV05 真实 disposable 集成覆盖并通过：fresh project install、managed global/project install、固定 embedded 17-path 0.9.1 upgrade、coherent tamper 与 relabel/extra-path HOLD 零写、host evidence exact join、swap/instruction/hook/managed-registry fault rollback 保留 preimage、disposable local Git + bare remote native pre-push gate，以及 candidate completeness/禁止架构面。
- 产品面仍无 provider adapter、静态模型目录、credential store、daemon；Harness 源码不调用 agent 工具。

## 主管确定性 candidate

主管用两个全新精确 disposable root 独立连续构建完整 artifact，逐字节比较后删除：

- A：`/tmp/hl-r2f04-supervisor-A-AZyppA/candidate.json`
- B：`/tmp/hl-r2f04-supervisor-B-OKws7I/candidate.json`
- version：`0.10.0`
- files：37；product JS：13
- file digest：`sha256:6712ce695518c3181fda608473981373e78c9989d82b284ef187c5374014ed1c`
- product digest：`sha256:f0ed420560bcd12aa1cca521cf04d0f8f94292ff063bc00786520e78020045de`
- candidate/artifact digest A = B：`sha256:285fffb4a7f873d0a9959f7a04eabcc2d57c4f6ad5d28894619463da3083e558`
- artifact size A = B：978575 bytes；byte-for-byte identical=true
- provenance：`working-copy-snapshot / git.repo=false / git.head=null`；当前目录不是 Git repo，未伪造 provenance。
- 删除后 `/tmp` 下 `hl-r2f04-*` 与 `hl-r2f04-supervisor-*` 精确匹配目录均为 0。

第一次主管矩阵编排命令因包含执行层禁止的 `rm -rf` 风格清理而在启动前被拒绝，没有执行 candidate 或产品代码，也未产生临时目录。主管随后改用带 `/tmp/hl-r2f04-supervisor-{A,B}-*` 前缀断言并在 `finally` 精确删除的 Node 探针；该编排工具错误不计产品有效失败。

## 生命周期与结论

R2F04 writer 在首个 `wait_agent(timeout_ms=300000)` 内提前返回 COMPLETE；没有 30/60 秒忙轮询、message、interrupt 或 takeover。主管验收期间 R2 leaf/stage 仍为 current，R2F05 未提前开始或关闭。

未执行 push、tag、release、deploy；未更新 external memory；未杀死、重启或干扰 Poracode、watchdog、bridge。

主管 direct acceptance：`PASS`。本报告落盘后才登记 R2F04 `accepted` 并解锁 R2F05；R2 leaf/stage 仍保持 current，只有全新独立 reviewer 明确 PASS 且主管终验后才可关闭。
