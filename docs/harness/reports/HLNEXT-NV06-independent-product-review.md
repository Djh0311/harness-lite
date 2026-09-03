# HLNEXT NV06 — Independent Product Review

日期：`2026-08-31`

Reviewer：独立只读 reviewer（未参与 NV00-NV05 实现）

范围：完整阅读 `NEXT-VERSION-DISPATCH-PLAN.md`，核对当前源码、tests、candidate builder、安装/回滚/managed/native 逻辑，以及 NV00-NV05 supervisor reports 仅作历史线索；不信任既有 PASS 结论，全部以本次直接证据重算。

结论：`PASS / NV05 CANDIDATE ACCEPTED / CANDIDATE ONLY / NOT PUSHED / NOT RELEASED`

## 候选摘要

- 版本：`0.10.0`（`package.json:3`，`lib/install.js:11-13`）
- 当前源码载体：非 Git repo；`git status --short --branch` 直接返回 `fatal: not a git repository (or any of the parent directories): .git`
- candidate 双构建独立重算一致：
  - `fileCount=31`
  - `productFileCount=13`
  - `fileDigest=sha256:23714549b1bc3663141a416419a2d94457130f0c977be92c53d718dab5222929`
  - `productDigest=sha256:b80c021d3047d9f0199f12f13265acec42af4b07eb168021d49b3dc90713ff24`
  - `candidateDigest=sha256:bf33bfdce121e19a22fb7c236918301607f39c635f54dab3fe9814dc70746828`
- 以上 candidateDigest 与 NV05 supervisor 摘要一致，但此处为我独立重算结果，不依赖其报告。

## 实际执行的核验命令

- `npm test`
  - 结果：`85 tests / 85 pass / 0 fail / duration_ms 3966.500692`
- `npm run selfcheck`
  - 结果：`实现 4325`、`测试 3546`、`技能 56`、`内部接口 6（目标 6）`
  - 并再次实跑全测：`全测：通过 4.04s`
- `node --check` 覆盖 13 个产品 JS：
  - `bin/hl.js`
  - `hooks/dispatcher.js`
  - `lib/authorization.js`
  - `lib/capabilities.js`
  - `lib/delegation.js`
  - `lib/evidence.js`
  - `lib/hook.js`
  - `lib/install.js`
  - `lib/io.js`
  - `lib/limits.js`
  - `lib/managed.js`
  - `lib/tree.js`
  - `lib/work.js`
  - 结果：全部 `PASS`
- 双 candidate CLI：
  - `sha256sum` 显示两份 artifact 均为 `bf33bfdce121e19a22fb7c236918301607f39c635f54dab3fe9814dc70746828`
  - 两份 summary 均为 `18272993586208a537687a4c1b389b3b4e39a07744f4c6b359a04180e054eb64`
  - `cmp -s` 对 artifact 和 summary 都返回一致

## 我追加的直接探针

这些不是复述现有 tests，而是 reviewer 额外独立探针：

- capability 反例探针：
  - 输入只有 `channel/model/reasoning`，模型名伪装成 `gpt-5.6-terra`
  - 输出：`{"state":"known","family":"unclassified","status":"UNKNOWN","suitability":[]}`
  - 证明按名字不猜 family/status/suitability
- 最小 work-unit 投影探针：
  - 仅写 `目标` 与 `直接验收`
  - 输出：`status="work-unit"`，且 `routeBasis/facts/unknowns` 全显式为 `UNKNOWN`
  - 证明最小上下文投影成立，缺字段不会补脑
- accepted-only 解锁探针：
  - `A -> reported_complete` 时 `B.ready=false`
  - `A -> accepted` 后 `B.ready=true`
  - 证明 `reported_complete` 不解锁，只有 `accepted` 解锁
- 禁用面扫描：
  - 未发现 `providerAdapter`、静态 model catalog、credential store、`setInterval(` daemon、`transcript_path` 依赖、Harness 自己调 agent 的实现面

## 需求与验收结论

### R01-R04：PASS

- Harness 只投影规则，不负责 agent 调度：
  - `lib/install.js:108-110`
  - `hooks/dispatcher.js:25-37`
  - `hooks/README.md:3-11`
- 动态 capability manifest、UNKNOWN fail-closed、无名字猜模：
  - `lib/capabilities.js:17-80`
  - 直接探针已证明 name-only 输入保持 `unclassified/UNKNOWN`
- 稳定家族能力提示仅 Grok/Gemini/Terra/Sol：
  - `lib/capabilities.js:6-32`

### R05-R06：PASS

- 最小上下文字段与 UNKNOWN 显式投影：
  - `lib/tree.js:13-25`
  - `lib/tree.js:82-95`
  - `lib/tree.js:254-278`
- route basis 与 direct acceptance 进入最小派发包，而不是整仓预读：
  - `lib/install.js:108-110`
  - 直接探针证明缺字段保留 `UNKNOWN`

### R07-R11：PASS

- Harness 不设固定全局并发数；独立 unit 可并行：
  - `lib/delegation.js:623-667`
  - `test/nv03-delegation.test.js:83-92`
- 写面冲突必须 `integration-owner-or-split-or-serial`：
  - `lib/delegation.js:617-639`
  - `test/nv03-delegation.test.js:166-190`
- `reported_complete` 不解锁，`accepted` 才解锁：
  - `lib/delegation.js:640-650`
  - `lib/delegation.js:681-689`
  - `test/nv03-delegation.test.js:97-114`
  - 直接探针复现同结论
- `blocked/partial` 只冻结依赖分支：
  - `lib/delegation.js:644-650`
  - `test/nv03-delegation.test.js:196-220`
- heartbeat 为只读、300000ms、summary 合并：
  - `lib/delegation.js:12`
  - `lib/delegation.js:652-659`
  - `lib/work.js:123-131`
  - `hooks/README.md:7`
  - `test/nv03-delegation.test.js:222-241`
- activity/progress/report/accepted 分开：
  - `lib/delegation.js:16-17`
  - `lib/delegation.js:660-693`
  - `lib/work.js:97-162`
  - `lib/hook.js:251-271`
  - `test/nv03-hook-work.test.js:201-228`
- Stop 只因 evidence-bound semantic progress 才 continuation；verify/file/head 不冒充 progress：
  - `lib/hook.js:251-271`
  - `hooks/README.md:3-7`
  - `test/nv03-hook-work.test.js` 中相应场景在 `npm test` 已全部通过

### R12-R14：PASS

- 有效失败、非计数失败、问题级租约、drift 去重：
  - `lib/delegation.js:18-28`
  - `lib/delegation.js:463-565`
  - `skills/root-cause.md:12-20`
- Terra/Sol 问题级恢复链、Sol 默认 3 且支持 1..5：
  - `lib/delegation.js:26-28`
  - `lib/delegation.js:488-565`
  - `lib/delegation.js:695-717`
  - `test/nv04-recovery.test.js:232-359` 证明 stable problem/family/tier 行为
  - 全测中 `Sol attempt limits 1 through 5...`、`ordinary five triggers Terra...`、`pass clears only that lease` 全通过
- `accepted` 后只清当前 problem lease，不污染其他分支：
  - `lib/delegation.js:502-508`
  - `skills/root-cause.md:20`

### R15-R18：PASS

- 只在真实产品选择/关键歧义时问用户；可直接查明的事实自己查：
  - `lib/install.js:109`
- 旧系统失去未来权威，但不自动禁止只读：
  - `lib/install.js:109`
- 当前用户指令最高：
  - `lib/install.js:109`
- push gate、真实证据、安装身份、回滚和载体区分保留：
  - `hooks/dispatcher.js:17-29`
  - `lib/hook.js:231-250`
  - `lib/install.js:196-212`
  - `lib/install.js:897-911`
- 明确禁止干扰 Poracode/watchdog/bridge：
  - `lib/install.js:109`
  - 本次 review 未执行任何 kill/restart/interfere 类操作

## 安装、兼容、回滚、host evidence、native push gate

这一组要求我既看实现也看 integration tests 的真实执行结果：

- 当前 0.10 runtime identity 与 19-path managed surface：
  - `lib/install.js:78-98`
  - `lib/install.js:196-212`
  - `test/current-contracts.test.js:68-96`
- 0.9.1 固定 17-path/11-product-JS baseline 与显式 upgrade：
  - `lib/install.js:45-77`
  - `lib/install.js:214-241`
  - `test/nv05-integration.test.js:26-47`
  - `test/nv05-integration.test.js:273-303`
- coherent tamper / relabel HOLD zero-write：
  - `lib/install.js:214-241`
  - `lib/install.js:323-335`
  - `test/nv05-integration.test.js:309-360`
- rollback 与 fault recovery：
  - `lib/install.js:787-848`
  - `lib/install.js:1011-1040`
  - `lib/managed.js:271-302`
  - `test/nv05-integration.test.js:407-450`
- host evidence exact join、四事件 observed 才可信：
  - `lib/evidence.js`
  - `lib/install.js:883-911`
  - `test/current-contracts.test.js:136-199`
  - `test/nv05-integration.test.js:363-405`
- managed/global gateway、project binding、allowlist/registry/manifest：
  - `lib/managed.js:271-356`
  - `lib/managed.js:404-459`
  - `test/nv05-integration.test.js:237-271`
- native pre-push gate 仅在 disposable local bare remote probe 下验证，并可 clean uninstall：
  - `lib/install.js:1089-1138`
  - `test/nv05-integration.test.js:452-476`
- `PREVIOUS_06/07/08_*` 和官方摘要不改写：
  - `lib/install.js:18-107`
  - `test/nv02-capabilities.test.js` 中历史摘要 hash 场景在 `npm test` 全通过

## Candidate 自包含与 Lite 边界

- `scripts/build-candidate.js:9-12` 与 `108-150` 只打包 `LICENSE`、派发包、`package.json`、`bin/hooks/lib/scripts/skills/test`
- provenance 如实写 `working-copy-snapshot` 与 `git.repo=false/head=null`：
  - `scripts/build-candidate.js:66-75`
  - `scripts/build-candidate.js:108-150`
- tests/selfcheck 为非零执行：
  - `scripts/timed-test.js:25-49`
  - 本次 `npm test` 与 `npm run selfcheck` 已实跑成功
- 当前产品面无 provider adapter、daemon、credential store、静态模型目录：
  - `test/nv05-integration.test.js:500-508`
  - 本次 `rg` 扫描同结论

## 残留事实与现场清洁

- `/tmp` 终态复查：未发现 `hl-nv05-*`、`hl-candidate-*`、`hl-nv03-*`、`hl-nv04-*`、`hl-nv06-probe-*`、`harness-lite-global-*` 残留目录
- `pgrep -af 'hl-nv05|hl-candidate|harness-lite-global|native-pre-push|hl-nv06-probe'`：无结果
- `ss -ltnp | rg 'harness-lite|native-pre-push'`：无结果
- 复查过程中曾短暂看到一个 `hl-nv06-probe-*` reviewer 临时目录；随后复查已不存在，终态清洁
- 较早的 `ss` 观测到 Electron/Codex 通用 listener，但无 Harness-specific listener，且本 review 未触碰任何宿主进程

## 未完成项

- 无产品级 blocker
- 无需回退 NV01-NV05
- 保持边界：本 PASS 只表示 `NV06 independent product review PASS`，不表示 pushed、released 或获得任何新的外部写授权
