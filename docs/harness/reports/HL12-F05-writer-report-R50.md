# HL12-F05 writer report R50

status: `reported_complete`

R49 的 Sol `real-hard-risk-gate` 样本是实际 guidance 缺口：push gate 虽然已有结构化 `pushGate.target`，但 primary decision 的 focus、decisionQuestion 和 nextAction 没有重复带出精确目标，也没有明确“只针对该目标、不暂停全局”。这会让模型只复述“请确认”或产生 broad-confirmation。

## 本轮最小修改

- `lib/guidance.js`：仅在完整、真实 push gate 命中且事件为 `push-attempt` 时，把 `gate.target` 注入唯一 decision 的 focus、decisionQuestion、nextAction；nextAction 明确只针对该目标、不暂停全局。保留既有五项 `pushGate` 结构（动作、目标、边界、风险、用户决定）。普通事件、无效 gate 和无 gate 路径不增加 push 内容或确认。
- `test/hl12-f05-guidance.test.js`：新增动态 gate 回归，验证 exact target 同时出现在三个 primary decision 字段和文本中，并验证局部范围说明；既有普通路径、无效 gate、九事件和 malformed 回归保留。

## 文件与 SHA-256

- `lib/guidance.js` — `sha256:20e8cafe0224642f6c20b7486d16d6782bbc90f5170ed2fc63b4de8ddea20291`（16,851 bytes）
- `test/hl12-f05-guidance.test.js` — `sha256:a46eee12f3d8e92fbc2ecbdd2ab62843764dafa651a4796611c1802d96c2e655`（8,317 bytes）

## 验证

- `node --check lib/guidance.js`：通过。
- `node --test test/hl12-f05-guidance.test.js`：10/10 pass。
- `node --test test/hl12-f05-guidance.test.js test/hl12-f06-joined.test.js test/hl12-f07-behavior-scorer.test.js`：45/45 pass。
- `npm test`：210 pass / 1 fail / 0 skip。唯一失败为 `F07 candidate builds deterministically as 0.12.0 and matches retained artifact`，运行时缺少 `HL12_F07_ARTIFACT`（`HL12_F07_ARTIFACT is required for materialized candidate runs`），与本轮 guidance 修改无关；未放宽、删除或 skip 该测试。

未修改 `lib/hook.js`、F03/F06、candidate、retained artifacts、dispatcher、install/current instruction、全局配置或宿主；未安装、发布、push、tag、release 或 deploy。R50 仅报 `reported_complete`，不自称 accepted，也未启动 F07 重建。

