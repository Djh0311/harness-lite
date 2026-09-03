# Harness Lite 0.12 独立计划复核

复核日期：2026-09-02  
复核类型：`independent-plan-review`  
被复核文件：`docs/harness/plans/HL12-UPGRADE-PLAN.md`  
被复核文件实算 SHA-256：`70b43c3da50c8715a3559c626567d79c43e39ba895d08eee66979ec9d1eca4aa`  
最终 verdict：**FAIL**

## 一、决定性结论

### 1. 冻结决定摘要的声明 digest 与实际字节不一致

这是直接事实，不是对文字风格的评价。

- 计划第 7 行声明 `Decision-Digest=sha256:76a1782f647b85aa8d7b1d2bbab9d1216cbaa1d9ee44d542f64d01370cc3f85a`。
- 按计划第 9 行自述口径，从 `HL12-DECISIONS:BEGIN` marker 后的下一行起，到 `HL12-DECISIONS:END` marker 前一行止，保留原始 LF 和 UTF-8 字节，实际范围为 6,699 bytes，实算为 `sha256:ba6a074cf0e017397a06775ab8b4b1ac77552aa1cc011d65015b9ffeb5989a95`。
- 整份计划的实算 SHA-256 为 `70b43c3da50c8715a3559c626567d79c43e39ba895d08eee66979ec9d1eca4aa`。
- 计划第 492 行要求未来把该 `Decision-Digest` 写入新 stage/current leaf。当前声明值不代表当前冻结 WHAT，因此不能用它建立可追溯 Kickoff 身份，也不能把本计划判为 `KICKOFF READY`。

### 2. 0.6–0.8 official migration/uninstall 门槛缺少真实历史载体的 owning work

计划正确地把 official 0.6–0.11 upgrade/uninstall、materialized candidate 和关键项不可 skip 写进门槛（第 225–228、319–330、409、434–455 行），但没有闭合当前已知的证据缺口：

- 当前 `docs/harness/artifacts/` 只有 retained 0.10 和 0.11 两份 artifact，没有 0.6、0.7、0.8 的完整 runtime artifact。
- `lib/install.js:24-43` 的 `OFFICIAL_06/07/08` 是版本、摘要和 managed path 元数据；`lib/install.js:278-331` 能拿现场文件与这些摘要比较，但这些常量不是历史 runtime 的完整字节载体。与之相对，0.9 fixture 在 `lib/install.js:45-77,249-276` 才有逐文件 mode、size 和 SHA-256 记录。
- `test/nv02-capabilities.test.js:159-167` 对 0.6–0.8 只固定 instruction/metadata 的 digest。第二次独立产品复核已把 0.6/0.7/0.8 真实 official upgrade 判为 `UNKNOWN`，原因正是缺完整历史 runtime bytes/artifact（`HL11-second-independent-product-review.md:307,371-374`）。
- HL12F00 只明确在 0.11 failed candidate 上复现六个反例和基线（计划第 347–353 行）；HL12F01 直接承担 0.6–0.11 upgrade/uninstall 的通过结果（第 355–361 行），但没有 work unit 负责获取、鉴真并冻结 0.6–0.8 的真实字节及 provenance。

因此当前图允许实现者用“按元数据合成的 fixture”再次把 `official` 说成已执行，或到 F07/F08 才发现不可 skip 的门无法执行。二者都不满足证据优先的计划闭合要求。真实历史字节也许能从当前仓外恢复，但本次没有该证据；在恢复和鉴真前，该项只能是 `UNKNOWN`，不能预先写成可授予 PASS 的既定执行路径。

### 3. 其余核心设计没有发现会改变结论的范围偷换

计划正文准确保留了版本 0.12、正常工作由模型自主推进、硬风险不扩容、prompt/guidance 改造方向、三个新增保证和六个 0.11 反例；也明确没有开工授权。六个反例的 owner、双向产品路径、joined/materialized/independent 重放和不可 skip 门总体清楚。external runtime anchor 的承诺也明确限制在报告中的 coherent tamper，并诚实排除了“同一主体同时改写 runtime、anchor、验证器和宿主配置”的全面攻击（第 303–309 行）。这些通过项不能覆盖上述两个决定性失败。

## 二、独立验收清单与证据顺序

本 reviewer 没有先接受 0.12 计划的自述，实际读取和建立清单的顺序为：

1. `NEXT-VERSION-PROMPT-GUIDANCE-IMPROVEMENTS.md`：冻结用户结果/完整完成标准最高保真、单一综合焦点、一个语义一个运行时权威来源、精确硬边界和真实模型行为 A/B；结构测试不能代替行为 PASS（第 41–69、92–138、158–204 行）。
2. `HL11-second-independent-product-review.md`：把 global-root、current coherent tamper、ghost unit、multi-runnable、stale capability、uninstall residue 六条正式生产路径反例逐项设为硬门（第 13–22、163–272 行）。
3. 当前生产实现：读取 `PREVIOUS_06_INSTRUCTION`、`PREVIOUS_07_INSTRUCTION` 和当前 `INSTRUCTION`（`lib/install.js:18-23,121-123`），并追踪 CLI、install、identity、dispatcher、work-unit、capability 和 uninstall caller。
4. 只有前三步清单固定后才读取 `HL12-UPGRADE-PLAN.md`。
5. 初判形成后才读取旧 `HL11-F06-independent-product-review-PASS.md` 和 `HL11-supervisor-closeout-PASS.md` 作为旁证；其中 “older official/uninstall 有绿测即 PASS” 的旧结论（分别第 22 行、第 12 行）已被第二次直接复核否定，没有被用作当前产品事实。

预先固定的验收条件是：用户日常 Harness 命令为 0；普通安全工作不新增审批或全局 blocked；leaf/work unit/accepted 不成为执行授权；六个反例各有明确 owner、正式负例、正常正例和不可 skip 门；三个新增保证可制造故障直接验收；guidance、上下文保真、单一语义来源和真实模型 A/B 有可证伪阈值；runtime trust boundary 不自证；migration/candidate/独立复核均有真实载体。

## 三、A–J 逐项验收矩阵

| 项 | 结果 | 事实与判断 |
| --- | --- | --- |
| A. 用户决定覆盖与范围 | **FAIL** | 正文第 15–21、48–126 行准确覆盖且未发现扩大的硬风险；但冻结决定的声明 digest 与实算不一致，未来 authority binding 不成立。内容覆盖不能替代身份正确。 |
| B. 六个 0.11 反例 | **PASS** | 第 194–205 行逐项给出坏路径和正常路径；F01/F02/F03/F04 分别 owning，F06 joined，F07/F08 重放；第 434–436 行禁止关键 skip。详见下一节映射。 |
| C. 三个新增保证 | **PASS** | 第 83–103、207–228 行把异常降级、人话拦截和精确撤回写成可制造故障的产品合同；异常降级由 F02/F03/F04/F05 分面并由 F06 集成，人话说明由 F05/F06 owning，精确撤回由 F01/F06 owning，不只是口号。 |
| D. 不得更严格 | **PASS** | 第 50–63、105–118、253–259 行明确用户命令 0、普通安全工作不需 work unit/确认、UNKNOWN 不扩大成全局 blocked、accepted 不授予执行权。`PREVIOUS_06/07_INSTRUCTION` 也直接证明“用户日常命令为 0、正常工作自主处理”是历史核心，而非 0.12 新增口号。 |
| E. guidance、保真、单一来源、A/B | **PASS** | 第 74–81、159–193、230–293 行有单一 focus/decision/next action、完整 carrier、sentinel、单一语义表、八类场景、同条件配对、盲评、两个模型家族、每格三次成功调用和关键失败/非关键阈值。评测看下一动作和完成判断，不只看措辞。 |
| F. runtime trust anchor | **PASS** | 第 303–309 行要求 runtime 自证边界外的 anchor，绑定 target/version/candidate/package/Hook，并要求 formal dispatcher 每次核对；第 308 行诚实收窄 threat model。F02 第 363–369 行含 exact coherent-tamper 负例、healthy official 正例、零受管写和干净降级，足以击败第二次报告中的直接反例。实现时仍必须由 F07/F08 证明验证器实际位于所声明的可信边界。 |
| G. global-root、ownership、capability、ghost、多 runnable | **PASS** | 第 194–228、295–330 行分别定义 canonical pre-read guard、外部 ownership、freshness/session binding、ghost HOLD/零写和多 runnable 完整 carrier；F01/F03/F04/F06 有明确写面和 joined owner，且每项有不误伤正例。 |
| H. work-unit 图、依赖、并行和写面 | **PASS** | 第 332–345 行图无循环；F01→F02 串行，F03/F04/F05 仅 fresh-check 证明写面分离后并行；F06 等待 F02/F03/F04/F05 accepted 并作为唯一公共 Hook/CLI/instruction/candidate 接线 owner。未发现两个并行 unit 必须同时写同一公共文件的硬冲突。 |
| I. migration、rollback、candidate、独立复核 | **FAIL** | source/materialized/behavior/independent 层级、deterministic double build、scope-skip 门和 release 分层本身充分（第 403–455 行）；但 0.6–0.8 authentic historical carrier 当前缺失且无 acquiring/authentication owner，使 mandatory official migration 路径不可直接实施或验收。 |
| J. NOT ACTIVE 与授权边界 | **PASS** | 第 3、11、120–126、470–502 行反复明确 `NOT ACTIVE/NOT EXECUTED`，计划 PASS 不创建 stage/leaf，不授权产品、真实安装、全局写、push/tag/release/deploy，也不自动启动后继版本。 |

## 四、六个反例的 owner 与不可 skip 映射

| 反例 | owning implementation | 正式集成/复核 | 双向与 no-skip 证据 |
| --- | --- | --- | --- |
| CEX-01 global-root | HL12F01 | HL12F06、F07、F08 | 计划第 200、297–301、355–361、401、409、417、434 行 |
| CEX-02 coherent tamper | HL12F02 | HL12F06、F07、F08 | 第 201、303–309、363–369、401、409、417、434 行 |
| CEX-03 ghost unit | HL12F03 | HL12F06、F07、F08 | 第 202、371–377、401、409、417、434 行 |
| CEX-04 multi-runnable | HL12F03 | HL12F06、F07、F08 | 第 203、371–377、401、409、417、434 行 |
| CEX-05 stale capability | HL12F04 | HL12F06、F07、F08 | 第 204、379–385、401、409、417、434 行 |
| CEX-06 uninstall residue | HL12F01 | HL12F06、F07、F08 | 第 205、310–315、355–361、401、409、417、434 行 |

这些映射与当前生产根因相符：

- global target 目前由 `bin/hl.js:40,47-56` 直接 `path.resolve` 后进入 `install()`；`lib/install.js:716-729,824-878` 在 guard 前读取和写入根内 instruction。
- current identity 目前由 `lib/install.js:210-226` 将实际 digest 与同一 runtime 内 `ownership.json.packageDigest` 比较；正式 dispatcher 在 `hooks/dispatcher.js:25-36` 信任该结果。
- 未声明 unit 目前在 `lib/tree.js:264-301` 回退 leaf；`lib/delegation.js:614-634` 可据 fallback readiness 记录 accepted，依赖只看 ledger 字符串状态（第 433–438、731–738 行）。
- multi-runnable 目前在 `lib/hook.js:41-50,191-209` 只有单 runnable 或多 active 才选完整 carrier。
- static capability 目前由 `lib/capabilities.js:14-17,336-360` 从项目文件直接归一化，无 freshness/provenance/session 门。
- uninstall 目前在 `lib/install.js:1050-1078` 只处理 runtime、registry、Hook 和 native，没有 instruction/upgrade rollback 清理；安装 instruction 写面在第 716–750 行。

## 五、事实、推断与 UNKNOWN

### 事实

- 被复核计划 SHA-256 为 `70b43c3da50c8715a3559c626567d79c43e39ba895d08eee66979ec9d1eca4aa`。
- 声明的 Decision-Digest 与按声明范围实算的 `ba6a074cf0e017397a06775ab8b4b1ac77552aa1cc011d65015b9ffeb5989a95` 不同。
- 当前 artifact 目录只有 0.10 和 0.11 两个 retained JSON；0.6–0.8 没有完整 artifact。
- 当前目录不是有效 Git repository；`git status --short` 返回 `fatal: not a git repository`。本复核没有据此声称任何 commit、branch、tag 或 push 状态。
- 计划本身明确 `NOT ACTIVE`，没有给出产品实施、真实安装或发布授权。

### 推断

- 如果未来按计划第 492 行绑定当前声明 Decision-Digest，stage/leaf 中的摘要将不能证明绑定了当前这份冻结决定文本。
- 在缺少真实 0.6–0.8 bytes/provenance 时，只依据 metadata 和合成文件跑通升级，不能把结果提升为 “official runtime upgrade/uninstall 已证明”。该推断由当前物理载体、验证代码粒度和第二次直接复核共同支持。
- external anchor 方案在计划声明的有限 threat boundary 内可实现；是否真正避免 self-verifying validator，只能由实现后的 formal dispatcher 和 materialized coherent-tamper probe 决定，不能由计划文字预先授予 PASS。

### UNKNOWN

- 0.6、0.7、0.8 的真实 official runtime 字节是否存在于当前仓库之外、能否取得并验证 provenance，本次未联网搜索或获取，保持 `UNKNOWN`。
- 0.12 external anchor 的具体文件位置、宿主绑定方式和原子事务 HOW 尚未实现；这是计划允许实现者选择的 HOW，不在本次伪装成当前产品事实。
- 没有 Git authority 和发布 receipt，任何历史 push/tag/release 状态均未由本复核确认。

## 六、最小返修范围

本 reviewer 不修改计划。要使计划重新具备独立 PASS 条件，最小返修仅需：

1. 校正冻结身份：若当前 decision section 字节就是预期 WHAT，把第 7 行更新为实算 `sha256:ba6a074cf0e017397a06775ab8b4b1ac77552aa1cc011d65015b9ffeb5989a95`；若还要修改 decision section，则修改后重新按第 9 行口径计算。增加一个在 Kickoff/F00 前不可跳过的 declared-vs-actual digest 检查。
2. 在 F00（优先）或 F01 前增加明确 owner 和停点：获取并鉴真 0.6–0.8 完整 official runtime bytes，记录来源、文件清单、mode、逐文件 digest 和整包 identity；没有真实载体时保持 migration `UNKNOWN` 并禁止 F01/F07/F08 PASS。不得把按常量合成的 fixture 称为 official。把对应 fixture/artifact 写面和 provenance 验收写清楚。
3. 修订后重新做独立计划复核。无需借此改动六个反例设计、扩大硬风险、增加审批，或启动任何产品 work unit。

## 七、实际写面与未执行动作

本复核在工作区唯一新增/更新的文件是：

`docs/harness/reports/HL12-independent-plan-review.md`

执行的检查仅包括文件读取、行号检索、SHA-256/字节范围计算、artifact 文件名核对和只读 Git 状态探测。没有运行 product test、candidate build、install、upgrade、uninstall、migration 或会写真实数据的 probe；没有创建或修改 stage、leaf、delegation、candidate、`docs/harness/plan.md`、历史 report/done/artifact、package、源码、测试或全局配置；没有 push、tag、release、deploy；没有杀死、重启或干扰 Poracode、watchdog、bridge。

本次到此停止。**FAIL** 不构成产品返修、开工或后续版本授权。
