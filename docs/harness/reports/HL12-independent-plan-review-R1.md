# Harness Lite 0.12 R1 独立计划复核

复核日期：2026-09-02  
复核类型：`independent-plan-review-R1`  
被复核文件：`docs/harness/plans/HL12-UPGRADE-PLAN.md`  
被复核文件实算 SHA-256：`103ce036ef266362b3dc4866c64276781e592ba7d90f06592a3952fbc5953328`  
最终 verdict：**PASS**

## 一、决定性结论

### 1. declared Decision-Digest 与 actual 严格一致

按计划第 9 行声明的精确口径，以原始文件 bytes 查找：

- begin marker：`<!-- HL12-DECISIONS:BEGIN -->`；
- 从 begin marker 行 LF 后的下一行起；
- 到 `<!-- HL12-DECISIONS:END -->` marker 起始 byte 前，即 marker 前一行结束；
- 两条 marker 均不纳入，保留范围内原始 UTF-8/LF，不 trim、不规范化换行。

实际决策区为 6,876 bytes，SHA-256 为：

`8de421b32e79cf2e5b880d26ffe2c44c4bcfc067fc0e8e136086668e1e0803b7`

它与计划第 7 行 declared Decision-Digest 逐字一致。独立的 raw-buffer 计算和 Perl 整文件正则提取计算得到同一摘要。

该检查还有两道不可跳过的未来门：

- HL12F00 完成标准要求先按精确 marker 口径重算；不一致立即停止（第 349–355 行）。F01/F03/F04/F05 都依赖 F00 accepted，不能绕过。
- 唯一 Kickoff 入口要求 declared=actual 后才可把 digest 与用户开工 receipt 写入新 stage/current leaf（第 490–499 行）。

R0 的冻结身份失败已经消失。

### 2. 0.6–0.8 已按当前用户决定完整退出 0.12 范围

当前用户已经决定：没有项目使用 0.6–0.8；0.12 不承担这三个版本的 migration/uninstall 支持或验收，也不寻找、合成或恢复其 runtime。该取舍是本轮最高权威，不是证据缺口。

计划各关键表面一致：

| 表面 | 直接证据 | 结论 |
| --- | --- | --- |
| 用户决定 | 第 22 行明确 0.6–0.8 不承担升级/卸载验收，迁移保证从 official 0.9–0.11 开始 | PASS |
| 冻结 WHAT | 第 104 行把精确撤回限定为 official 0.9–0.11；第 125 行明确排除 0.6–0.8 且不寻找、合成、恢复或作新兼容声明 | PASS |
| 三保证验收 | 第 225–230 行只要求 fresh project/managed 与 0.9/0.10/0.11 upgrade 后 uninstall | PASS |
| migration matrix | 第 319–330 行明确为 official 0.9、0.10、0.11 → 0.12，另含 fresh、reinstall、drift、rollback、project/managed uninstall | PASS |
| owning work unit | HL12F01 第 357–363 行明确 fresh/0.9–0.11 upgrade uninstall；F06 统一接入；F07/F08 重放 | PASS |
| scope skip | 第 434–438 行只把 fresh/0.9/0.10/0.11 upgrade/uninstall 列为不可 skip | PASS |
| Definition of Done | 第 440–455 行只要求 official 0.9/0.10/0.11 upgrade | PASS |
| non-goal | 第 459–471 行明确不获取、合成、恢复或验收 0.6–0.8 runtime | PASS |

计划中的泛称 `official fresh/upgrade`、`previous official drift` 或“迁移合同”受第 22、125、319–330、468 行冻结范围共同约束，不能重新扩大为 0.6–0.8。当前源码仍保留历史 0.6–0.8 识别分支，不等于 0.12 为其作新支持声明，也不进入 0.12 PASS 证据。

0.9–0.11 的物理基线可直接进入未来验收：

- `test/fixtures/previous-09-snapshot.js` 是自包含的 0.9.1 installed-carrier copy；本 reviewer 只读解包内存数据后核对 17/17 文件的 path、mode、size 和 SHA-256，与 `lib/install.js:45-77` 的 `PREVIOUS_09_SNAPSHOT` 完全一致，差异为 0。
- retained 0.10 artifact 实算 SHA-256 为 `d73f4b4f83e6034e33168995c24ca4514d69bcd70ccc19f8aa255da42d218daa`，1,061,071 bytes。
- retained 0.11 artifact 实算 SHA-256 为 `8e14e641b7d0fe3641a5e74c49b11a60761e0dc63fb75866ff8226e6b3687ae5`，1,096,150 bytes。

这些是未来 F01/F06/F07/F08 的输入载体，不是本轮已执行 migration 的声明。

### 3. R0 其余 A–J 通过项未因修订产生新冲突

修订只增加了新的用户范围决定、修正 digest，并把对应版本范围落实到 migration/uninstall 表面以及 Kickoff/F00 digest 门；没有增加硬风险、用户确认、第二授权系统或新 work unit，也没有改变六个反例、三个保证、threat boundary、行为 A/B、依赖图和 NOT ACTIVE 边界。

## 二、R1 A–J 逐项验收矩阵

| 项 | 结果 | 事实与判断 |
| --- | --- | --- |
| A. 用户决定覆盖与范围 | **PASS** | 第 15–22、49–128 行完整覆盖版本 0.12、轻量硬风险内核、正常工作自主、prompt/guidance、三个保证、六个反例和新迁移取舍；Decision-Digest 与实际 WHAT 一致。无偷加审批或风险扩容。 |
| B. 六个 0.11 反例 | **PASS** | 第 196–207 行逐条有坏路径和正常正例；F01 owning CEX-01/06，F02 owning CEX-02，F03 owning CEX-03/04，F04 owning CEX-05，F06 joined，F07/F08 重放；第 436 行禁止 skip。 |
| C. 三个新增保证 | **PASS** | 第 84–104、209–230 行提供 runtime/ledger/capability/carrier 故障、正常继续路径、硬风险不绕过、人话说明字段、bytes 级卸载和 fault/歧义场景；F01–F06 有实现和集成 owner。 |
| D. 不得更严格 | **PASS** | 第 51–64、106–119、255–261 行明确用户命令 0、普通安全工作不需 work unit/确认、UNKNOWN 不扩大为全局 blocked、accepted 不是开工授权。`lib/install.js:18-23` 的 0.6/0.7 历史 instruction 也直接证明这是原始核心，不是新管制。 |
| E. guidance、保真、单一来源、A/B | **PASS** | 第 75–82、161–194、232–295 行保留一个 focus/decision/next action、完整 carrier/sentinel、单一语义来源、八类真实行为场景、盲评、两模型家族、每格三次成功调用和可证伪阈值。 |
| F. runtime trust anchor | **PASS** | 第 305–310 行要求 runtime 自证边界外 anchor 且 formal dispatcher 每次核对，并诚实排除同时改写 runtime、anchor、验证器和宿主配置的全面攻击；F02 第 365–371 行绑定 exact coherent-tamper 负例、healthy 正例、零受管写和干净降级。 |
| G. global-root、ownership、capability、ghost、多 runnable | **PASS** | 第 196–230、297–332 行闭合 canonical pre-read guard、外部 ownership、freshness/session binding、ghost HOLD/零写和多 runnable 完整 carrier；每项均有不误伤正常路径。 |
| H. work-unit 图、依赖、并行和写面 | **PASS** | 第 334–347 行无循环；F01→F02 串行，F03/F04/F05 只在 fresh-check 写面分离后并行，F06 等待四个 owning unit accepted 并是唯一公共 Hook/CLI/instruction/candidate 接线 owner。 |
| I. migration、rollback、candidate、独立复核 | **PASS** | 支持范围已按用户决定闭合为 0.9–0.11；第 319–332、405–457 行覆盖 fresh/reinstall/drift/rollback/project-managed uninstall、source/materialized/behavior/independent 层级、deterministic double build、关键 no-skip 与独立复核。 |
| J. NOT ACTIVE 与授权边界 | **PASS** | 第 3、11、121–128、473–505 行明确 `NOT ACTIVE/NOT EXECUTED`；计划 PASS 只能到 `KICKOFF READY`，不创建 stage/leaf、不开始 F00、不授权产品修改、真实安装、全局写入或发布。 |

## 三、六个反例与当前生产根因的直接对照

本轮重新读取了相关正式 caller；计划 owner 没有漂移：

| 反例 | 当前生产根因 | 计划闭环 |
| --- | --- | --- |
| CEX-01 global-root | `bin/hl.js:40,47-56` 直接解析 target；`lib/install.js:716-750,824-878` 读取/写入根内 instruction | F01 canonical pre-read guard；F06 joined；F07/F08 重放 |
| CEX-02 coherent tamper | `lib/install.js:210-226` 仍把 runtime digest 与同一 runtime manifest 比较；`hooks/dispatcher.js:25-36` 信任结果 | F02 external anchor + formal dispatcher；F06/F07/F08 |
| CEX-03 ghost unit | `lib/tree.js:264-301` 未声明 ID 仍 leaf fallback；`lib/delegation.js:614-634,731-738` 接受 readiness/ledger 字符串 | F03 membership/event/dependency 零写拒绝；F06/F07/F08 |
| CEX-04 multi-runnable | `lib/hook.js:41-50,191-209` 只在单 runnable 或多 active 时选现有完整 carrier | F03 完整 package；F06 formal Hook；F07/F08 |
| CEX-05 stale capability | `lib/capabilities.js:14-17,336-360` 仍读取无 freshness/binding 的静态项目文件 | F04 freshness/provenance/session；F06/F07/F08 |
| CEX-06 uninstall residue | instruction 写面在 `lib/install.js:716-750`；uninstall 第 1050–1078 行未处理 instruction/upgrade rollback | F01 ownership/bytes/fault；F06/F07/F08 |

六条均有正式负例、正常正例、owning unit、公共 integration owner、source/materialized/主管/独立重放和不可 skip 门。计划没有通过关闭 install、work unit、capability 或普通 Hook 路径来消灭反例。

## 四、事实、推断与 UNKNOWN

### 事实

- 被复核计划为 36,469 bytes，SHA-256 `103ce036ef266362b3dc4866c64276781e592ba7d90f06592a3952fbc5953328`。
- 决策区为 6,876 bytes，declared 与 actual SHA-256 均为 `8de421b32e79cf2e5b880d26ffe2c44c4bcfc067fc0e8e136086668e1e0803b7`。
- 计划只有三处直接出现 0.6–0.8：第 22、125、468 行，三处都是明确排除；所有 mandatory migration/uninstall 门均从 0.9 开始。
- 0.9 自包含 fixture 的 17 个文件与冻结 snapshot identity 核对无差异；0.10/0.11 retained artifact 实算摘要命中文件名。
- R0 报告 `docs/harness/reports/HL12-independent-plan-review.md` SHA-256 仍为 `00c569f7e0995a01d9f09e5cae596518351fce533c8b8eba11d4c3e8c8a60ce3`，本 reviewer 未改其字节。
- 当前 `stages/`、`leaves/`、`unfinished/` 没有文件；本复核未创建 lifecycle 或 delegation。

### 推断

- 由于冻结 WHAT、迁移矩阵、F01、scope-skip、DoD 和 non-goal 同向，泛称 migration/official upgrade 不会把 0.6–0.8 重新带回 0.12 验收。
- external anchor 的 HOW 尚未实现，但计划给出的外部可信边界、精确反例和正式 dispatcher 门可实施且可证伪；最终是否成立仍须由 candidate 产品复核证明。
- R1 PASS 说明计划已经具备未来 Kickoff 的完整门槛，不说明任何产品反例当前已经修复。

### UNKNOWN

- 0.12 的实际 external anchor 文件布局、事务实现和 candidate digest 尚不存在，保持 `UNKNOWN`，由 F01/F02/F06/F07 实现和验收。
- 真实模型行为 A/B 的当时可用模型、实际记录和结果尚不存在；第七节门槛正确阻止提前 PASS。
- 当前目录无 Git authority，任何历史或未来 push/tag/release 状态均未由本复核确认。

这些 UNKNOWN 都是未来实施结果，不是计划合同缺口。

## 五、实际写面与未执行动作

本复核在工作区唯一新增/更新的文件是：

`docs/harness/reports/HL12-independent-plan-review-R1.md`

执行的检查仅包括文件读取、行号/版本面检索、raw-byte SHA-256 计算、0.9 fixture 的内存解码与逐文件 identity 核对、0.10/0.11 artifact 摘要核对、R0 摘要核对和 lifecycle 目录只读检查。

没有修改 R0、计划、产品源码、测试、package、candidate、`docs/harness/plan.md`、stage/leaf/delegation、历史 reports/done/artifacts 或全局配置；没有运行测试 suite、candidate build、install、upgrade、uninstall、push、tag、release 或 deploy；没有杀死、重启或干扰 Poracode、watchdog、bridge。

## 六、最终结论与停点

**PASS**。

修订计划已经修复 R0 的 Decision-Digest 身份问题，并按当前用户决定把 migration/uninstall 支持与验收精确收敛到 official 0.9、0.10、0.11。其余 A–J 项保持闭合，没有发现新的决定性冲突、范围扩大或不可实施要求。

本 PASS 只使计划达到 `KICKOFF READY`；它不创建 stage/leaf，不开始 HL12F00，不授权产品修改、真实安装、全局写入、push、tag、release、deploy 或后续版本。
