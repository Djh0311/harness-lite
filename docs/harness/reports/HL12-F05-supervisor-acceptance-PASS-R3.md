# Harness Lite 0.12 HL12F05 主管验收 R3：PASS

日期：2026-09-02（Asia/Shanghai）

## 结论

**PASS。** 这是主管在 R1 失败、R2/R3 返修后的独立验收；不是实现子代理自报完成的替代品。F05 只接受 guidance synthesizer、completion carrier 和两个 skill 的写面，不提前声称正式 Hook、installed runtime、candidate 或整版 0.12 已完成。

## 直接读回的当前文件

- `lib/guidance.js`：`sha256:de676f51f76515b3556770018262996d4dc661a069c98163d109eef34bf7f59e`
- `skills/split-work.md`：`sha256:49891962447ffba76ba62583b66592b791612ef5b1a5c5565ff55130275c4634`
- `skills/root-cause.md`：`sha256:17b62a40d46f27f94bca3130b7a48cf9643aff95046ec305445011d167149be0`
- `test/hl12-f05-guidance.test.js`：`sha256:d2aa0823f2094d0e0d0d2434261d41c75d8837a77bbbda3b739372de288d63b5`
- writer R3 report：`sha256:945cead6523ba0455c60765f5560e778dd109118e574617f7b54dfc64bbdf4bb`
- 未参与实现的 independent reviewer R3 report：`sha256:fca1e9fd0787dfba47650c913bc37debaf06dbe4048832fd4820660008b7b0e6`

R1 的 FAIL 报告和 R2/R3 writer 记录均保留，没有用新报告覆盖失败证据。

## 主管独立验证

实际执行：

```text
node --check lib/guidance.js
node --test test/hl12-f05-guidance.test.js test/hl11-event-upgrade.test.js test/nv03-hook-work.test.js
npm test
```

结果：定向 `26 tests; 26 pass / 0 fail`；全量 `167 tests; 166 pass / 0 fail / 1 existing scope skip`。唯一 skip 是既有 R3F03 source candidate 不含 local lifecycle documents，不是 F05 新增或放宽。

主管又独立构造并读回：

- `summary.accepted` 为对象、数字、字符串和 null 时不抛异常、不误触发 closeout；malformed recovery、runnable、active、reported 同样降级为空值。
- completion standards、authorityDesign、facts 含循环对象、BigInt 或非字符串时不抛异常，异常项为 `UNKNOWN`；正常字符串（含首尾空格）逐字保留。
- 非字符串 `intent/events` 只产生空事件；旧的未知字符串 intent 仍按兼容合同拒绝。
- 完整 `gate`/`pushGate` 单独输入触发 `push-attempt`，说明含动作、目标、既有边界、风险、用户决定；缺字段和普通路径没有 push 说明或新增确认。
- `completionCarrier.serializedChars` 与最终 JSON 长度一致，含 digest 和自身长度字段；预算等界限正确，超限明确 `external-required`，不静默截尾，末尾 sentinel 保留。
- 九事件和乱序多事件均确定性地只给一个 `decisionEvent`、focus、decisionQuestion、nextAction；兼容字段不进入新的同级文本决定。

## 范围和边界

当前改动只在 F05 允许的 `lib/guidance.js`、`skills/split-work.md`、`skills/root-cause.md`、`test/hl12-*` 和 `docs/harness/reports/HL12-F05-*`。未修改 `lib/hook.js`、`lib/install.js`、dispatcher、CLI、版本接线、candidate、retained artifacts 或真实全局配置；没有新增事件总线、规则数据库、provider、daemon、完整 prompt 持久化或硬风险种类。

正式 Hook/current instruction/installed runtime 接线由 F06；行为评测与 candidate 由 F07；最终独立产品复核由 F08。没有真实安装、push、tag、release、deploy，也没有读取或写入 `/home/synadmin/.codex`，没有干扰 Poracode、watchdog、bridge。

## 接受决定

F05 满足其当前完成标准，记为 `accepted` 并解锁依赖 F05 的 F06；这不解锁 F07/F08，也不代表 0.12 candidate 或发布已经完成。
