# HL12-F08 独立产品复核 R44

日期：2026-09-03
reviewerId：`hl12-f08-independent-reviewer-982524bd`
公钥 fingerprint：`sha256:982524bd501798859a722cdd69798779a4816851b361defac19c2fed0ee0f202`
公钥登记：`docs/harness/reports/HL12-F08-independent-product-review-R44-pubkey.md`
方法：先读用户决定和冻结计划，自建验收清单和反例，再读实现报告；直接核对 source、正式 CLI/Hook/dispatcher、物化 candidate、0.9/0.10/0.11 迁移和行为证据。

结论：**FAIL**。

最小 owning unit：**HL12F03**（`lib/work.js` 的 `parallelWorkUnitContext` / 无 live ledger 时的多 runnable 任务包）。正式 Hook 接线在 HL12F06，但现有 F06 已按 `activeCount>1` 使用 parallel carrier；当前缺口是无账本时 F03 不把叶面已声明、无依赖、可派发的多个 unit 投影为 runnable packages，Hook 因而退回 `WorkUnit：id=UNKNOWN；status=leaf-fallback`。

本结论不复述 writer/supervisor/F08 R43 PASS。R43 外部 attestation 对 dba60 行为文件的签名是有效的，但不能覆盖本轮直接复现的 CEX-04 原路径。未对 dba60 签署本 reviewer 的 PASS attestation。私钥未写入 workspace，也未发送。

本轮没有修改产品代码或 candidate，没有真实安装，没有改真实全局 `AGENTS.md`，没有 push/tag/release/deploy，没有获取 0.6–0.8 runtime，没有干扰 Poracode、watchdog、bridge。

## 1. 绑定身份

| 项 | 独立实算 |
| --- | --- |
| Decision-Digest | `sha256:8de421b32e79cf2e5b880d26ffe2c44c4bcfc067fc0e8e136086668e1e0803b7`，declared=actual |
| 唯一 0.12 candidate | `docs/harness/artifacts/harness-lite-0.12.0-dba60a222f87b1e222861ffb851c03542113018668dc0d44814286ba9e6322d2.json` |
| candidate SHA-256 | `dba60a222f87b1e222861ffb851c03542113018668dc0d44814286ba9e6322d2` |
| bytes / files / product JS | 1,523,554 / 55 / 14 |
| 两次 `HARNESS_LITE_CANDIDATE_VERSION=0.12.0` build | 逐字节相同，并逐字节等于 retained dba60 |
| 物化 runtime | `VERSION='0.12.0'`，inspect 识别 previous-11 |
| retained 0.10 | `sha256:d73f4b4f83e6034e33168995c24ca4514d69bcd70ccc19f8aa255da42d218daa` 未改 |
| retained 0.11 | `sha256:8e14e641b7d0fe3641a5e74c49b11a60761e0dc63fb75866ff8226e6b3687ae5` 未改 |
| 真实 `/home/synadmin/.codex/AGENTS.md` | 434 bytes，`sha256:a060f3cc75512b49e5e4c605841cbad47eda4028ce53251e11d199e8c629e0ae`，复核前后不变 |
| working copy `package.json` | 仍为 `0.11.0`；0.12 身份只存在于 env 构建的 candidate。这是 F07 的构建约定，不是本轮 FAIL 原因。 |

source `npm test`：207 pass / 0 fail / 0 skip。  
物化 candidate `npm test`：207 pass / 0 fail / 0 skip。  
绿测不能覆盖下面的直接反例。

## 2. 决定性反例：CEX-04 原路径仍在

0.11 第二次独立复核写明的 CEX-04 是：

> 两个独立 runnable、**无 live ledger** 的 SessionStart 实际输出 `WorkUnit：id=UNKNOWN；status=leaf-fallback`，没有输出任一 work unit 的最小任务包。

本轮在物化 dba60 上按同一正式路径重放，不先写入 delegation 事件：

1. `hl install --write` 到 disposable 普通项目；
2. 写入含 `HL12RUN1`、`HL12RUN2` 的 current leaf（各自有完成标准、无依赖）；
3. 不写 ledger；
4. 调用已安装 `hooks/dispatcher.js` 的 `SessionStart`。

实测：

```text
Decision：focus=先保证 writer 拿到能交付结果的最小完整任务包
WorkUnit：id=UNKNOWN；status=leaf-fallback；完成标准=leaf-std；dispatchReady=true
has HL12RUN1-STANDARD = false
has HL12RUN2-STANDARD = false
has ParallelWorkUnits = false
```

同一 candidate、同一 leaf，只要先写入 writer 测试用的 `status=rejected` ledger 事件，Hook 就会给出 `ParallelWorkUnits` 和两个完整包。也就是说：F00/F03 绿测走的是改过的场景，不是 0.11 复核当时的原路径。

根因直接读源码：

- `lib/work.js` `parallelWorkUnitContext`：`if (!state.live) return { runnable: [], units: [], activeCount: UNKNOWN }`。
- `lib/hook.js` 只有 `parallelContext.state === 'known' && activeCount > 1` 才发多 unit carrier；否则 `currentWorkUnitId` 在 `units.length !== 1` 时返回 null，`workUnitPackage(root, null)` 变成 `leaf-fallback`。
- `lib/guidance.js` 在 `!live && leafRunnable` 时已经发出 `pre-dispatch`。产品知道这是多 unit 派发前夜，却仍用伪 work-unit 行冒充任务包。

这不是“无账本时诚实 UNKNOWN”。面向模型的正式 Hook 仍然输出 `WorkUnit：id=UNKNOWN；status=leaf-fallback`，并丢掉两个已声明 unit 的完成标准。冻结 WHAT 要求 leaf-level fallback 不再冒充 unit package。

对应正常正例成立：单 runnable 的正式 SessionStart 含 `ONLY1` 和 `ONLY-STANDARD`，无 leaf-fallback。

最小返修：HL12F03 让无 live ledger 时，current leaf 中已声明、完成标准已知、依赖为空的多个 unit 进入 parallel package list；正式 Hook 不得再输出伪 `UNKNOWN/leaf-fallback` work-unit 行。修复后必须重建 candidate，并由 F06 在正式 dispatcher 上重放**无 ledger** 和 **ledger-backed** 两条路径。不要再靠 `status=rejected` 才能让两个 unit 可见。

## 3. 其他 13 项独立核对

下列项在本轮自建反例或正式 suite 上通过。它们不能覆盖 CEX-04。

| # | 要求 | 结果 | 独立证据 |
| --- | --- | --- | --- |
| 1 | 全局 Codex 根零读零写 | 通过 | synthetic HOME `.codex`、symlink alias、nested 目标：正式 `hl install --write` 均 HOLD；preload 未记录 target 内读取；普通项目仍可 install/uninstall |
| 2 | runtime+manifest coherent tamper 不能自证 | 通过 | 改 `lib/tree.js` 并同步 `ownership.json.packageDigest` 后，dispatcher SessionStart 降级、不写 usage；未改 runtime 正常 |
| 3 | ghost unit 不能 accepted/解锁 | 通过 | `GHOST99` status=UNKNOWN、dispatchReady=false；accepted HOLD 零写。合法 UNITA 为 work-unit |
| 4 | 多 runnable 正式 Hook 不丢包 | **失败** | 见第 2 节。ledger-backed 正路径可用，原无 ledger 路径不可用 |
| 5 | 过期/无绑定 capability 不能冒充当前工具面 | 通过 | 项目静态文件 `state=UNKNOWN`、`modelsComplete≠true`；带 kind 的 Hook-input 动态 carrier 为 known/complete |
| 6 | uninstall 精确清 Harness 自写、保留用户原文 | 通过 | fresh、0.9/0.10/0.11 upgrade 后 uninstall：AGENTS 用户 bytes 恢复、unrelated.bin 不变、runtime/anchor/rollback/CLAUDE.md 退场；改写 owned block 时 HOLD 零写 |
| 7 | Harness 异常不断档，硬风险不绕过 | 通过 | tamper 后普通 `node --test` 无 deny；`git push origin HEAD:refs/heads/main` 仍 deny 且说明 identity 失败 |
| 8 | 真正拦截说人话 | 通过 | 拦截含动作、目标、边界、风险、现在请用户决定 |
| 9 | 多事件一个 focus/decision/next | 通过 | guidance.select 多事件只一条 `当前重点` |
| 10 | 用户目标和完成标准不静默截断 | 通过（有 leaf 时） | carrier `complete=true`、`truncated=false`、内含 `KEEP-THIS-STANDARD-EXACT`。CEX-04 无 ledger 路径丢掉的是 unit 标准，不是 leaf 标准 |
| 11 | 不因 0.12 增加命令/确认/全局停点 | 通过 | CLI 仍为 status/verify/map/mistake/install/selfcheck；instruction 含“用户日常 Harness 命令仍为 0”；普通 Bash 无新确认 |
| 12 | 旧能力不回退 | 通过 | accepted-only 在 F00 正例和 207 suite 中回归；heartbeat、recovery、Stop、dynamic capability、0.9/0.10/0.11 迁移均在 source/物化 suite 中通过 |
| 13 | 真实模型行为有盲审和外部证据 | 行为层通过，产品不能 PASS | 见第 4 节 |
| 14 | 两次 build 逐字节一致，身份准确 | 通过 | 见第 1 节 |

managed：在 `managed.installGlobal` + git 项目根上，profile=managed 的 install/uninstall 通过，用户 AGENTS bytes 恢复。

常驻 instruction 正文 899 个 Unicode 字符，未破 900 上限。

## 4. 行为证据

artifact SHA-256：

- behavior.json `106adcc3466e09fae8170246b29054f326890575d38658742bd7f74cdc5e2f8a`
- invocation-ledger.json `60f12430e19307b22a801777d2d0950a8c4068072d4ade0c46c86aac6fa6f983`
- blind-receipts.json `ce16fcf9cbf9c9d629a13f5cc21719b18e30e9d3e99039df7186395fbdbe1d18`
- behavior-scored.json `76507e3af48f87440ad3db7ccb658ff9767bf3239203e1a471da7a269e6549e1`
- scorer.js `b3806ca715c7024239c944c4352fee8fd979d646a0cbbbcef5e990c1d6edfe1c`

独立读回：96 样本、32 cells、Sol/Grok 两家族；receipt 绑定 response digest 且不泄漏 version/family；对抗 6/6 符合预期；16 个 0.12 cells 全部 3/3。抽查 0.12 动作：普通任务是派发/编辑 README，不是全局停；reported 未 accepted 时 HOLD/暂停 B；测试绿但缺结果时 complete=false；硬风险 asksUser 且不执行。

无本 reviewer 公钥时重跑 scorer：`status=UNKNOWN`（fail-closed）。旧 R43 attestation 用已登记公钥验签为 true，payload 与上述文件 SHA 一致。本轮不把该旧签名当成产品 PASS。

## 5. 范围与下一步

FAIL 只退回 **HL12F03**。不要扩版本，不要加新硬风险，不要把无 ledger 的多 unit 变成新的用户确认。修复后必须：

1. 用原 0.11 路径重放：无 live ledger、两个独立 declared unit、正式 SessionStart；
2. 保留现有 ledger-backed 正例；
3. 重建唯一 0.12 candidate 并再做双 build；
4. 由未参与实现的 reviewer 重新独立复核。

独立复核不是第二套用户授权。本 FAIL 不启动 0.13，不授权安装或发布。
