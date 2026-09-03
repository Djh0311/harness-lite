# HLNEXT-REPAIR FIX04 supervisor direct acceptance

日期：2026-08-31（Asia/Shanghai）

结论：`PASS / FIX04 ACCEPTED / FIX05 READY / CANDIDATE ONLY / NOT PUSHED / NOT RELEASED`

## 主管直接集成证据

- `node --test test/nv05-integration.test.js`：11/11 PASS。该物理临时项目矩阵覆盖 fresh project install、managed global/project install、真实固定 17-path 0.9.1 upgrade、coherent-tamper 与 relabel/extra-path HOLD 零写、host evidence 精确 join、swap/instruction/hook/managed-registry fault rollback、disposable local Git + bare remote native pre-push gate、candidate completeness 及禁止架构面。
- `npm test`：92/92 PASS，原 85 项全部保留并通过，新增 FIX01-FIX03 joined 回归同时通过。
- `node bin/hl.js selfcheck --run --json`：`ok=true`，内含同一 92/92 直接测试结果。
- candidate 定义的 13 个产品 JS 全部 `node --check` status 0；新增产品文件 `hooks/dispatcher.js` 已包含在此精确列表。
- 产品面没有 agent/provider 调用实现；命中的 spawn/wait/interrupt/provider 文字只是指导模型可见规则或 fail-closed 拒绝键。未引入 provider adapter、daemon、credential store、UI scraping、transcript 依赖、静态模型目录或第二套调度器。

## 确定性 candidate

在历史派发文档收敛为不随 FIX05 结果过期的 authoritative closeout 指针后，主管独立连续构建两个完整 artifact：

- version：`0.10.0`
- files：34；product JS：13
- file digest：`sha256:5daef70dacc7e8a178448802d8b30dd2dc699a4cd82b658a244038fdf597e266`
- product digest：`sha256:adb56138a4c0979fb586ca58aab3861cda506f25fa08d40963f463625c228c05`
- candidate/artifact digest A = B：`sha256:ee3a584a949016a1b447f7e7f7257f1fbb3e1d86299730fc06a3192c66ecac60`
- artifact size A = B：914283 bytes；byte-for-byte identical = true
- provenance：`git.repo=false / head=null`，当前载体不是 Git repo，未伪造 Git 身份。

## 文档与历史保护

- `NEXT-VERSION-DISPATCH-PLAN.md` 现为 `HISTORICAL FROZEN DISPATCH BASELINE / NOT CURRENT EXECUTION STATE`，明确历史 `NOT ACTIVE / NOT EXECUTED` 已不是当前状态，并只指向当前 leaf、FIX04/FIX05 报告和 final closeout；本文档不预判 FIX05 结果。
- R01-R18 历史冻结块重算为 `sha256:1a69fc8dbbef7304938b9da1f20af9daf47f6b24b131b6d8861c8c906d66a719`，与返修前基线相同。
- 16 份原 NV00-NV06 PASS/FAIL/closeout 报告逐份重算，与 FIX00 冻结的历史 hash 集合完全一致；未覆盖历史结论。
- 外部 memory 未修改；是否记录本次返修只列为需用户另行确认的后续动作。

FIX04 writer 在首个 `wait_agent(timeout_ms=300000)` 内提前返回 COMPLETE，因此无需为形式凑满五分钟；没有 30/60 秒忙轮询或无证据介入。上述全矩阵由主管在 COMPLETE 后直接重跑。FIX04 满足直接验收，只在本 PASS 后登记 accepted 并解锁 FIX05。
