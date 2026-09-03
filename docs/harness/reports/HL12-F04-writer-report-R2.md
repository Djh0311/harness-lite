# HL12F04 writer report R2

日期：2026-09-02（Asia/Shanghai）

结论：`reported_complete / WRITER REPORT ONLY / AWAITING SUPERVISOR DIRECT ACCEPTANCE`。本报告不表示 accepted，不启动 F05/F06。

## R1 返修

- Hook-input provenance 现在拒绝顶层、嵌套 `provenance` 或 `binding` 中的错误 source。
- `readDynamicCarrier` 要求调用方提供当前 event/session/turn；carrier 必须有完整 binding，且 `binding.project` 非空并等于 canonical root，逐项匹配 source/event/session/turn。
- 读回校验 `modelFields`、`sourceBytes`、source snapshot digest、source snapshot normalization 与 projection 一致性、projection digest、freshness、model count 和 carrier path。
- project-file 一律标记 `project-file-no-live-source`，拒绝静态文件靠自述 freshness/provenance/binding 自证 current。

## 允许的 fixture 迁移

按主管批准，仅修改 `test/r2-capability-visibility.test.js` 与 `test/fix03-joined-runtime.test.js`：旧静态正向改为显式 Hook-input（当前 event/session/turn）正例，保留原模型字段、family/name-inference 和完整 carrier 断言；各自新增静态无 live source `UNKNOWN/incomplete` 断言。未修改其他旧测试或公共产品接线。

## 实际文件 SHA-256

- `lib/capabilities.js`: `729069b852a9c9332644fa762db7a14a5e2602c84445cce8bbf26ee64c03c771`
- `test/hl12-f04-capability-freshness.test.js`: `91a0935122315602f6072dcd63ffbabf9cd41c65f2ee01d28dcab930a3d305cc`
- `test/r2-capability-visibility.test.js`: `713fee357be1ff35dc7220af44d64a1ce593c413cbd5e5b8bc965acb3d12e42b`
- `test/fix03-joined-runtime.test.js`: `4db2a8e0103b0090ab777b1353df0004c2093c1c065ae307d59ca362f68b48ed`

## 测试与清理

- F04/CEX-05/R3 定向：20/20 通过。
- F04、R2、FIX03、R3 定向：12/12 通过。
- 全量 `npm test`：157 pass，0 fail，1 existing scope skip（总计 158 tests）。
- 所有 F04 专测使用 synthetic `mkdtemp` roots，并在 `finally` 精确递归清理；未触碰 Poracode/watchdog/bridge、真实全局配置或 `/home/synadmin/.codex`。

## 已知边界

完整 carrier 只能由当前结构化 Hook-input 生成并在带期望 binding 的读回中判定 known；普通无 capability 输入仍降级 UNKNOWN，不冻结普通工作。没有真实 source receipt 的 project-file 保持 UNKNOWN。
