# Harness Lite 0.12 HL12F04 supervisor acceptance R0

日期：2026-09-02
work unit：`HL12F04 — current capability freshness`
结论：`FAIL / NOT ACCEPTED / RETURNED FOR REPAIR`

## 主管决定

实现子代理已报告完成，但主管独立验收不通过。本次没有把子代理的测试摘要当作 acceptance；F04 仍保持 active，必须由原 owning 实现子代理返修后重新验收。

## 直接证据

- 当前实现读回：`lib/capabilities.js` SHA-256 `a0fd79e4faf268cfe278db4953aa9843510cbc7f6a9e95181a7cde98b9a18a6d`；F04 专测 SHA-256 `103c6f87bddc11876e7508e579689aeab1a77c40a053324de3a1719cce297426`。
- `node --check lib/capabilities.js` 通过；F04/CEX-05/R3 定向 20/20 通过。
- 独立重跑 `npm test`：158 tests，153 pass，4 fail，1 existing scope skip。4 个失败均是既有静态 capability 正向回归（`test/fix03-joined-runtime.test.js` 1 项、`test/r2-capability-visibility.test.js` 3 项），不是 setup 偶发失败。
- 正常动态 Hook-input 与 R3 5/24 carrier 在正式测试中通过；这不能覆盖静态回归或未覆盖的载体完整性边界。

## 决定性缺口

1. Hook-input 的 `provenance.source=project-file` 仍可通过。正式绑定检查只检查 `binding`/顶层 source，没有拒绝嵌套 provenance 的错误 source；错误来源不能得到 `known/modelsComplete=true`。
2. `readDynamicCarrier(root, rel, {now})` 在没有 event/session/turn 期望值时仍返回 `known`。因此未绑定调用可以把 carrier 当作 current，违反错误或缺失当前调用绑定必须降级的边界。
3. carrier 读回未核对 `modelFields`、`sourceBytes`，也未证明 source snapshot 经过同一 manifest normalization 后与 projection 相等；这些字段被篡改时仍可能返回 `known`。
4. project-file 只要自述 freshness/provenance/project/binding 就可 known，`sourceDigest` 仍是可选的，且没有外部可验证的 source receipt。必须明确并实现“可验证来源”边界，不能让静态文件靠自述重新冒充 current。
5. 全量既有 capability 回归尚未闭合。不能用保留 4 个失败、加 skip 或放宽断言宣布 F04 PASS；需要在不恢复 stale 信任的前提下，对明确的旧 fixture 采用新的有效动态/绑定正例，或将其改成诚实 UNKNOWN 断言。

## 返修要求

- 只修改 F04 owning 写面：`lib/capabilities.js`、`test/hl12-f04-capability-freshness.test.js`，以及主管批准的最小 fixture-only 回归文件；不得改公共 Hook、dispatcher、install、tree/work/delegation、guidance、版本或 candidate。
- 补齐错误 source、缺失/错误 read binding、future/expired、projection/source/model-field/size/path integrity 和普通工作不断档的直接测试。
- 不新增 provider、静态模型目录、daemon、第二授权系统或用户确认；不把 UNKNOWN 扩大为普通任务 blocked。
- 修复后先提供精确 fixture 文件清单和 writer report；主管将重新独立运行全量 source suite、正式 installed 动态 carrier、静态 stale 反例和普通工作正例，再决定 PASS 或继续返修。

## 边界

本轮没有真实全局安装、push、tag、release、deploy；未修改 retained 0.10/0.11 artifact、真实全局配置或宿主进程。F04 未 accepted，不解锁 F05/F06。
