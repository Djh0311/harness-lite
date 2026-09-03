# HL12F04 writer report R1

日期：2026-09-02（Asia/Shanghai）

结论：`reported_complete / WRITER REPORT ONLY / AWAITING SUPERVISOR DIRECT ACCEPTANCE`。本报告不表示 accepted，不启动 F05/F06。

## 实际改动与边界

- `lib/capabilities.js`：收紧 Hook provenance source；`readDynamicCarrier` 要求当前 event/session/turn；校验 binding、modelFields、sourceBytes、source snapshot、normalization/projection 一致性、freshness、digest 与 carrier path；project-file 一律视为无 live source，返回 `UNKNOWN/incomplete`。
- `test/hl12-f04-capability-freshness.test.js`：补充错误 provenance source、缺失 read binding、篡改 modelFields/sourceBytes、静态自证来源、projection/source 完整性相关反例。
- 未修改 `hook.js`、dispatcher、install、tree/work/delegation/guidance、版本、candidate、R2/FIX03 旧 fixture；未进行真实安装、push、tag、release、deploy 或宿主进程操作。

SHA-256：

- `lib/capabilities.js`: `59ae2e5d0b35cb7eb4f24189c3435a8d18ede313c3b530da5aa4044952a39185`
- `test/hl12-f04-capability-freshness.test.js`: `60bcc1d98fc7c96d997ba0e6b6dc62a82034587e3b3090db06a8c44a8292ba04`

## 直接测试证据

- F04/CEX-05/R3 定向：20/20 通过。
- F04 专测：3/3 通过。
- 全量 `npm test`：158 tests，153 pass，4 fail，1 existing skip。
- 4 个既有失败均为静态 project capability 正向 fixture 与新合同冲突：
  - `test/fix03-joined-runtime.test.js:134-163` 写入无 live binding 的 `.codex/harness-lite/capabilities.json`，`phaseA` 在 `:451-452` 期待 `known`。
  - `test/r2-capability-visibility.test.js:118-148` 直接 Hook-input fixture 缺 event/session/turn opts；
    `:150-172` 与 `:202-235` 通过无绑定 project file 期待 complete carrier。

## 旧 fixture 迁移建议（暂未修改，待主管批准）

1. R2 `:118-148`：把 direct projection 调用改为显式 Hook-input opts（`eventName/sessionId/turnId/now`），保持原模型断言；不放宽静态 project file。
2. R2 `:150-172`：改为显式 Hook-input manifest + `writeDynamicCarrier:true`，从 carrier API 断言 40 行；或将该 project-file 正例改为 `UNKNOWN/incomplete`。
3. R2 `:202-235`：installed dispatcher 的静态 manifest 只能断言 `UNKNOWN/incomplete`；完整 4 行 carrier 应通过每次 Hook 调用注入结构化 manifest 并校验当前 binding。
4. FIX03 `:134-163, :437-463`：保留模型 family/name-inference 断言，但改为 Hook-input 动态 manifest；SessionStart/UserPromptSubmit 调用注入匹配的 session/turn，避免静态文件自证 current。

这些建议只涉及 fixture/input 迁移或将 stale 正例改为 UNKNOWN，不改变产品断言语义；当前未获得批准前不执行。

## 清理与风险

所有新增 F04 专测使用 `mkdtemp` synthetic roots，并在 `finally` 精确递归清理。当前保留的唯一已知回归是上述 4 个旧静态正向 fixture；它们不能在不恢复 stale 信任的前提下继续 `known`。普通工作路径不因 capability `UNKNOWN` 被整体阻塞。

