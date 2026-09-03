# HL12F04 writer report R3

日期：2026-09-02（Asia/Shanghai）

结论：`reported_complete / WRITER REPORT ONLY / AWAITING SUPERVISOR DIRECT ACCEPTANCE`。不表示 accepted，不启动 F05/F06。

## R3 修复

- `readDynamicCarrier` 现在要求 `schemaVersion=1`；缺失或改写为其他版本 fail closed。
- carrier binding 必须是完整对象，精确包含 `project/sessionId/turnId/eventName/source`；字段类型、canonical project、当前调用期望和 source 均严格匹配，缺失/null/错误类型均 UNKNOWN。
- Hook manifest 的 nested `provenance.binding` 若存在，逐项校验 project/session/turn/event/source；嵌套错误 source、类型或绑定均 UNKNOWN。
- `manifest.provenance` 直接声明的 project/session/turn/event/source 别名逐项严格匹配；空值、错误类型和恶意嵌套 binding 均 fail closed。
- malformed root/options/manifest 不抛未处理异常；canonical root、path、opts 和 JSON 输入均安全降级。
- 非法 `now` 不再静默替换系统当前时间；返回 `invalid-freshness-now`。合法 ISO/Date 仍通过。
- `writeDynamicCarrier:false` 的 known Hook projection 也携带 canonical 当前 binding。
- 静态 project-file 仍无 live source，始终 `UNKNOWN/incomplete`。

## 专测/回归

F04 专测新增 schema、完整 binding、nested/direct provenance、非法 now、malformed input、modelFields/sourceBytes/source snapshot 反例；F04 专测 `3/3`，F04+R3 carrier 定向 `7/7`，F04/R2/FIX03/R3 定向 `12/12` 通过。

全量 `npm test`：`157 pass / 0 fail / 1 existing scope skip`（158 tests，duration 9761ms）。

所有新增测试使用 synthetic `mkdtemp` roots，在 `finally` 精确清理；未触碰公共 Hook/dispatcher/install、Poracode/watchdog/bridge、真实全局配置或 `/home/synadmin/.codex`。

## 实际文件 SHA-256

- `lib/capabilities.js`: `325a6d2238c6f75df42361742ed2d3e976b470b123441ce90d7c3bb29a9d20d9`
- `test/hl12-f04-capability-freshness.test.js`: `8059b661cd5ac56a10023ce35323e9e7cbce5aa109efac33835292092046f6d2`
- `docs/harness/reports/HL12-F04-writer-report-R3.md`: 以本文件落盘后重新计算。

## 已知边界

正式 installed dispatcher 的静态 capability fallback 保持 UNKNOWN；只有当前结构化 Hook-input 与完整绑定读回才能得到 known/complete。普通安全工作仍可继续，不因 UNKNOWN 整体阻塞。
