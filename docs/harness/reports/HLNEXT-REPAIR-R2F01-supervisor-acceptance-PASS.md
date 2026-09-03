# HLNEXT-REPAIR R2F01 supervisor acceptance

日期：2026-08-31（Asia/Shanghai）

结论：`PASS / R2F01 ACCEPTED / R2F03 STILL LOCKED UNTIL R2F02 ACCEPTED / CANDIDATE REPAIR ONLY / NOT PUSHED / NOT RELEASED`

## 写面与实现合同

- writer `/root/hlnext_r2f01_writer` 使用当前可用普通工程模型 `gpt-5.5/xhigh`；当前工具面无 Grok/Gemini，未占用 Terra/Sol。
- 实际 recent-write 边界只有 `lib/capabilities.js` 与 `test/r2-capability-visibility.test.js`；`lib/hook.js` hash 仍为 `sha256:ef645be8ae352b4cfd066ddf6160ef6898d88e5176f5a9f4ed5a73307b95e8b3`，mtime 早于 R2 writer 派发，公共接线未被偷做。
- `capabilities.project()` 保留完整 `models[]`，并新增 `modelsComplete`、`modelCount` 与结构化 `carrier`：完整模型字段、projection/manifest digest、manifest bytes、project-relative read path、complete/incompleteReason。
- 两个 Grok channel 分立且 explicit family 均为 grok；名字含 Grok 但缺 explicit family 的 row 仍为 unclassified。missing/invalid/oversize 保持 UNKNOWN；oversize 明确 `complete=false / incompleteReason=manifest-too-large`，不伪装完整。
- 未引入静态目录、provider adapter、UI/错误文本猜测、credential、daemon 或 transcript 依赖。

## 主管 fresh-install 直接证据

durable receipt：`docs/harness/reports/HLNEXT-REPAIR-R2F01-R2F02-contract-acceptance.json`，SHA-256 `sha256:e1c26f37fc4f0a6f017b3aeb40094ab17d41713bcdbcfbb0d6a6d7863e0b4fac`。

- 当前 source 真实安装为 INSTALLED，verify06=true。
- installed capability API 对 Antigravity/Gemini、Cursor/Grok、GrokBuild/Grok、NameOnly/Grok-label 四行返回完整 channel/model/reasoning/family/status/availability；modelCount=4、modelsComplete=true。
- carrier path `.codex/harness-lite/capabilities.json` 在项目内真实存在，raw model count=4；carrier manifest/projection digest 均为 SHA-256，maxBytes=65536。
- installed Hook 仍显示首项加 `…+3`，证明 R2F01 没有用 helper contract 冒充 R2F03 joined PASS；Hook 接线继续锁定。

## 回归

- R2 capability 专用测试 4/4 PASS；R2F01/R2F02 新合同合计 11/11 PASS。
- 相关 capability/guidance/delegation/hook tests 49/49 PASS。
- `npm test` 103/103 PASS；`node --check lib/capabilities.js` PASS。
- 当前仅是中间 WIP candidate：36 files / 13 product JS / `sha256:fcc429a62a53a3eec02581794326823287a3cfe3e1a37f65e3ce9c00e62cc548`，不是 R2F04 candidate acceptance。
- disposable contract root 已精确删除，不可恢复；无 R2 temp residue。

稳定问题 `capability-manifest-all-models-visible` 的继承有效失败保持 1，没有新增失败。主管 direct acceptance PASS；本报告落盘后登记对应 acceptance_pass 并将 R2F01 accepted，但 R2F03 在 R2F02 accepted 前继续锁定。
