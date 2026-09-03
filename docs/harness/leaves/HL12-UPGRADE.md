# HL12 Upgrade Candidate

阶段：stage-hl12-upgrade
来源收据：2026-09-02T02:27:24+08:00 用户明确要求一个实现子代理完成开发、主代理验收、不通过则返修。
目标：完成 Harness Lite 0.12 产品升级并形成主管和独立复核均通过的唯一 candidate。
产品：Harness Lite 0.12 source candidate
证据：直接源码读回、六个双向反例、三个保证、source/materialized tests、真实模型 A/B、双构建和独立 reviewer
载体：working copy plus offline source candidate；not installed runtime；not release

相关权威设计：

- `docs/harness/plans/HL12-UPGRADE-PLAN.md`，Decision-Digest `sha256:8de421b32e79cf2e5b880d26ffe2c44c4bcfc067fc0e8e136086668e1e0803b7`。
- `docs/harness/reports/HL12-independent-plan-review-R1.md`，独立计划复核 PASS。

相关事实：

- 当前源码为 0.11.0；第二次独立产品复核为 FAIL，存在六个正式生产路径反例。
- 当前目录不是 Git repo；不能声称 commit、push、tag 或 release。
- 当前没有项目使用 0.6–0.8；0.12 migration/uninstall 验收从 official 0.9 开始。
- retained 0.10/0.11 和真实全局配置在本 leaf 写面外。

完成标准：

- 六个 0.11 决定性反例在正式 source 和 materialized candidate 路径全部消失，并且六个正常正例不被误伤。
- Harness 异常时普通工作不断档；真实拦截说人话；Harness owned 内容可精确撤回。
- 多事件形成单一 focus/decision/next action；用户目标和完整完成标准不静默截断；同一语义单一运行时来源。
- 现有硬风险不扩大，用户日常 Harness 命令仍为 0，普通安全任务不新增确认或全局停点。
- official 0.9/0.10/0.11 upgrade、rollback、project/managed uninstall、runtime identity 和 existing capabilities 全部回归。
- 真实模型 A/B 满足冻结 rubric；源码和物化 candidate 的关键矩阵无 scope skip。
- 两次 candidate build 逐字节一致；主管直接验收 PASS；未参与实现 reviewer 独立产品复核 PASS。

允许动：

- `bin/**`
- `hooks/**`
- `lib/**`
- `skills/**`
- `test/**`
- `scripts/**`
- `package.json`
- `docs/harness/artifacts/harness-lite-0.12.0-*.json`
- 当前 HL12 lifecycle、delegation、专用评测结果和新验收报告

不许动：

- `/home/synadmin/.codex/AGENTS.md` 与真实全局配置
- retained 0.10/0.11 artifacts
- 历史 `docs/harness/plans/**`、`docs/harness/reports/**`、`docs/harness/done/**`，本 stage 新报告除外
- 0.6–0.8 runtime 获取、合成、恢复或验收
- Poracode、watchdog、bridge 进程
- push、tag、release、deploy

入口：

- `lib/install.js`
- `hooks/dispatcher.js`
- `lib/tree.js`
- `lib/work.js`
- `lib/delegation.js`
- `lib/capabilities.js`
- `lib/guidance.js`
- `lib/hook.js`
- `scripts/build-candidate.js`

已否定路线：

- 用更多规则或确认修复漏洞。
- runtime 内 manifest 自证 current runtime。
- 拒绝所有未知 work unit 或 capability 后让普通工作整体停摆。
- 只跑绿测或只检查 prompt 关键词就宣布产品 PASS。
- 把 candidate 冒充真实安装、push 或 release。

UNKNOWN：

- 0.12 external anchor、candidate digest 和真实模型行为结果尚未实现，必须由本 leaf 直接证明。

routeBasis：先冻结 0.11 反例和正常正例，再按独立写面修复；唯一 integration owner 接线后做 source/materialized/behavior 三层验证，最后由未参与实现 reviewer 独立复核。
dependencies：无
resultContract：每个 unit 由实现子代理报告实际改动和证据；主代理独立读回后 accepted 或给精确返修；最终报告绑定唯一 candidate。

## HL12F00 — baseline and counterexamples

goal：冻结 Decision-Digest、0.11 candidate 身份、六个决定性反例、六个正常正例和现有硬风险行为。
completionStandards：declared/actual Decision-Digest 精确一致；六个坏路径在 0.11 上可复现；六个正常正例有基线；临时目录精确清理。
allowed：test/hl12-*, disposable test helpers, docs/harness/reports/HL12-F00-*, 当前 lifecycle/delegation
forbidden：产品行为修改, 真实全局 target, retained artifacts, 历史报告, push/release
authorityDesign：HL12 plan F00、六个双向反例和不变严格度
facts：0.11 failed candidate digest 8e14e641；Decision-Digest 8de421b3
entryPoints：HL12 plan, HL11 second review, current source callers
disprovenRoutes：用旧 PASS 或绿测数量替代反例
unknowns：无
routeBasis：先把错误实现和正常路径同时固定
dependencies：无
resultContract：F00 writer report、可重放 fixture 和精确摘要

## HL12F01 — install boundary ownership uninstall

goal：修复 global-root 与 uninstall residue，建立精确 ownership/rollback。
completionStandards：pre-read canonical guard；普通项目不回归；fresh/0.9–0.11 uninstall 清除 owned 内容且用户 bytes 不变；歧义零写；fault rollback 完整。
allowed：lib/install.js, lib/managed.js, 必要 installation/authorization helper, test/hl12-*, docs/harness/reports/HL12-F01-*
forbidden：真实全局配置, 整文件重写用户 instruction, 扩大硬风险
authorityDesign：HL12 F01、CEX-01、CEX-06、保证 C
facts：当前 install 在 guard 前读写 target instruction；uninstall 不清 owned block/rollback
entryPoints：lib/install.js, lib/managed.js, bin/hl.js
disprovenRoutes：按目录名猜全局根；模糊删除相似文本
unknowns：external anchor 接线由 F02 完成
routeBasis：共用 canonical boundary 和显式 ownership receipt
dependencies：HL12F00
resultContract：F01 writer report、双向 path/uninstall/fault evidence

## HL12F02 — runtime trust anchor and degradation

goal：修复 current coherent tamper，并让 Harness identity 异常时干净降级。
completionStandards：runtime+manifest tamper 被 verify 和 dispatcher 拒绝且零受管写；healthy official 正常；identity UNKNOWN 不拖死宿主普通工作；迁移/rollback identity 回归。
allowed：lib/install.js identity/anchor, hooks/dispatcher.js, 必要 IO helper, test/hl12-*, docs/harness/reports/HL12-F02-*
forbidden：self-manifest 自证, 夸大全面本机攻击防护, 身份失败写 usage/ledger, 全任务 blocked
authorityDesign：HL12 F02、CEX-02、保证 A、限定 threat boundary
facts：当前 verify06 将 digest 与同一 runtime ownership.json 比较
entryPoints：lib/install.js, hooks/dispatcher.js
disprovenRoutes：在 runtime 内再写一份同权 manifest
unknowns：具体 anchor HOW 由实现选择并由 materialized probe 证明
routeBasis：runtime 自证边界外 anchor 加 formal dispatcher 每次核对
dependencies：HL12F01
resultContract：F02 writer report、coherent-tamper/healthy/degraded evidence

## HL12F03 — work-unit truth and multi-runnable packages

goal：修复 ghost unit 和多 runnable carrier，不把 work unit 变成执行授权。
completionStandards：ghost package/event/accepted/dependency 零有效写；合法 unit 不回归；每个 runnable 有完整最小包；leaf fallback 不冒充 unit package。
allowed：lib/tree.js, lib/work.js, lib/delegation.js, 必要 evidence helper, test/hl12-*, docs/harness/reports/HL12-F03-*
forbidden：所有安全工作强制 work unit, 完整 prompt 持久化, 用户命令
authorityDesign：HL12 F03、CEX-03、CEX-04、不变严格度
facts：当前 leaf fallback 可让 ghost dispatch-ready；Hook 多 runnable 退 UNKNOWN
entryPoints：lib/tree.js, lib/work.js, lib/delegation.js
disprovenRoutes：关闭 leaf-level 普通工作来消灭 ghost
unknowns：公共 Hook 接线由 F06 完成
routeBasis：membership 只约束 unit claim，structured list 保留每个合法包
dependencies：HL12F00
resultContract：F03 writer report、ghost/multi-runnable 双向 evidence

## HL12F04 — current capability freshness

goal：修复 stale capability 冒充当前工具面并保持 UNKNOWN 不挡普通工作。
completionStandards：无 freshness/provenance/binding、过期、未来时间或错误 session/source 都不称 current/complete；有效动态增删；UNKNOWN 不冻结普通工作；现有 capability 回归。
allowed：lib/capabilities.js, test/hl12-*, docs/harness/reports/HL12-F04-*
forbidden：静态模型目录, provider adapter, UI/transcript/error scraping, 按名字猜 authority
authorityDesign：HL12 F04、CEX-05、保证 A
facts：当前固定项目文件可无 freshness/provenance 被声明 known/complete
entryPoints：lib/capabilities.js
disprovenRoutes：删除 capability 功能换取 stale 反例消失
unknowns：公共 Hook 接线由 F06 完成
routeBasis：当前结构化输入严格验证，缺失则诚实 UNKNOWN
dependencies：HL12F00
resultContract：F04 writer report、fresh/stale/dynamic/UNKNOWN evidence

## HL12F05 — decision guidance

goal：把九类 fragments 改成一个当前决定，保证用户结果保真并在真实拦截时说人话。
completionStandards：多事件单一 focus/decision/next action；同一语义单一来源；完整 carrier/sentinel；无关语义物理缺席；普通路径无新确认；真实 gate 说明可读。
allowed：lib/guidance.js, skills/split-work.md, skills/root-cause.md, test/hl12-*, docs/harness/reports/HL12-F05-*
forbidden：新事件总线, 规则数据库, 长期失败例子, 完整 prompt 持久化, 扩大硬风险
authorityDesign：HL12 F05、prompt guidance design、保证 B
facts：当前 guidance 对多事件做 fragments 拼接
entryPoints：lib/guidance.js, skills/split-work.md, skills/root-cause.md
disprovenRoutes：只缩短句子但仍并列规则片段
unknowns：current instruction 和 Hook 接线由 F06 完成
routeBasis：结构化状态先综合，面向模型只给当前一个决定
dependencies：HL12F00
resultContract：F05 writer report、结构/保真/不打扰 evidence

## HL12F06 — joined integration and migration

goal：作为唯一 integration owner 接入正式 Hook、CLI、instruction、installed runtime 和 migration。
completionStandards：六个双向反例和三个保证在正式 caller 通过；九事件 decision package；existing dynamic model/parallel/heartbeat/accepted/recovery/Stop/push/migration 回归；普通路径零新增命令或确认。
allowed：lib/hook.js, bin/hl.js, lib/install.js current instruction, hooks/README.md, 必要 build/fixture, test/hl12-*, docs/harness/reports/HL12-F06-*
forbidden：第二授权系统, 固定并发, daemon/timer/provider adapter, UNKNOWN 全局 blocked, 历史删除
authorityDesign：HL12 F06、joined matrix、single integration owner
facts：F01–F05 分面实现必须统一接线才能证明产品能力
entryPoints：hooks/dispatcher.js, lib/hook.js, bin/hl.js, lib/install.js
disprovenRoutes：只测 helper 不走正式 Hook/CLI/installed runtime
unknowns：candidate 和行为评测由 F07 完成
routeBasis：公共文件单 owner，source 与 disposable installed joined 重放
dependencies：HL12F02, HL12F03, HL12F04, HL12F05
resultContract：F06 writer report、joined/migration/no-regression evidence

## HL12F07 — behavior candidate supervisor handoff

goal：完成行为 A/B、版本 0.12.0、唯一 deterministic candidate 和主管验收所需完整证据。
completionStandards：真实模型 A/B PASS；关键矩阵无 skip；源码与物化 candidate 全部通过；双 build 字节一致；记录 candidate identity；保留 artifacts/global boundary。
allowed：evaluation fixtures/results, scripts/build-candidate.js, package.json, test/hl12-*, docs/harness/artifacts/harness-lite-0.12.0-*, docs/harness/reports/HL12-F07-*
forbidden：关键词替代模型行为, provider 故障算模型失败, 历史模型目录, push/tag/release/deploy
authorityDesign：HL12 F07、behavior rubric、candidate DoD
facts：当前版本 0.11.0；0.12 artifact 尚不存在
entryPoints：scripts/build-candidate.js, package.json, test, materialized candidate
disprovenRoutes：candidate build 后继续改输入而不重建
unknowns：最终 candidate digest 和行为结果待实现
routeBasis：集成稳定后 paired behavior，再双 build 和物化重放
dependencies：HL12F06
resultContract：F07 writer report、behavior records、candidate identity、主管验收包

## HL12F08 — independent product review

goal：未参与实现的 reviewer 独立检查用户决定、六个反例、三个保证、正式 caller、迁移、行为和唯一 candidate。
completionStandards：独立 reviewer 自建反例并给唯一 PASS；没有关键 UNKNOWN/scope skip/误伤正常工作；candidate 身份和边界直接核实。
allowed：只读产品/candidate/lifecycle, disposable fixtures, docs/harness/reports/HL12-F08-*
forbidden：reviewer 修改产品或 candidate, 真实安装, push/tag/release/deploy, 干扰宿主
authorityDesign：HL12 F08、最终 DoD
facts：只有 F07 accepted 后才存在可复核 candidate
entryPoints：HL12 plan, current user authority, actual source, materialized candidate, behavior records
disprovenRoutes：复述 writer/supervisor PASS 或测试数量
unknowns：review verdict pending
routeBasis：独立清单、正式 caller、直接反例、物化验证
dependencies：HL12F07 reported_complete → HL12F08 fresh replay；最终 accepted 只在有效外部 attestation 后由主管写入
resultContract：独立 Verdict PASS/FAIL；FAIL 精确返回 owning unit；PASS 只覆盖 candidate
