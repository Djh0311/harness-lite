# Harness Lite 0.12 HL12F05 主管验收 R50：PASS

日期：2026-09-03（Asia/Shanghai）

## 结论

**PASS。** 这是主管对 R49 指定的 guidance 缺口的直接验收。F05 只接受
`lib/guidance.js` 及其回归测试的最小修复；不把这次验收当成 candidate、正式
Hook、独立复核或整版 0.12 的通过。

## 修复是否对准反例

R49 的真实信号是：完整 push gate 命中时，唯一 primary decision 没有明确带出
精确目标，也没有说明只针对这一次目标、不暂停全局。当前修改只在
`validGate && event === 'push-attempt'` 时生效，把同一个 `gate.target` 放进
`focus`、`decisionQuestion`、`nextAction`；既有 `pushGate` 五项
（动作、目标、边界、风险、用户决定）保持不变。

## 主管现场复核

- `node --check lib/guidance.js`：通过。
- F05 定向回归（含普通路径、无效 gate、动态 exact-target gate）：`45/45 pass`。
- 用当前源码临时生成 candidate，并以 `HL12_F07_ARTIFACT` 绑定该文件运行完整套件：
  `211/211 pass / 0 fail / 0 skip`。这确认新 guidance 已进入物化 candidate，且没有
  依赖缺失造成的假绿。
- 现场读回确认：普通事件和无效/不完整 gate 不出现 push 拦截说明、不增加确认；
  完整真实 gate 的 primary decision 同时含 exact target 和局部范围；既有
  action/target/boundary/risk/user-decision 结构仍在。

临时 candidate 仅用于本次验收，未登记为发布 candidate，随后精确清理；旧
`dba60`、`70e669` 及 retained 0.10/0.11 artifact 不覆盖、不改写。

## 文件身份

- `lib/guidance.js` — `sha256:20e8cafe0224642f6c20b7486d16d6782bbc90f5170ed2fc63b4de8ddea20291`
- `test/hl12-f05-guidance.test.js` — `sha256:a46eee12f3d8e92fbc2ecbdd2ab62843764dafa651a4796611c1802d96c2e655`
- writer report：`docs/harness/reports/HL12-F05-writer-report-R50.md`

本次临时物化验证文件的摘要为 `sha256:ef33cf10d2f28ed57be76d22994cbe701cc81b69927f582773ed4e8dc0122db3`，
仅作验收证据，不是后续 F06 要重建的正式 candidate。

## 范围边界

未修改 `lib/hook.js`、F03/F06 接线、dispatcher、CLI、安装/卸载合同、全局配置、
retained artifacts 或宿主；没有真实安装、push、tag、release、deploy，也没有读取
或写入 `/home/synadmin/.codex`，没有干扰 Poracode、watchdog、bridge。没有新增
风险类别、日常确认、provider、daemon 或第二授权系统。

## 接受决定

F05 R50 满足当前完成标准，记为 `accepted`，允许 F06 按新的源码重建唯一新
candidate。F07/F08 必须重新绑定新 candidate 的行为和独立证据；本报告不提前
宣称它们通过。
