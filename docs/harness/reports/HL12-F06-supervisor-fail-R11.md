# Harness Lite 0.12 HL12F06 主管验收：FAIL（R11）

日期：2026-09-02（Asia/Shanghai）  
复核对象：R11 当前工作树；writer report `HL12-F06-writer-report-R11.md`  
当前 `lib/hook.js` SHA-256：`sha256:7253d5925013e1a21c6155151b4ceae945dcda70a68698b290796ec4826e8eb2`

## 结论

**FAIL，不能接受，返回同一 owning unit 继续 R12。** R11 的定向 F06 仍为 8/8，
但全量回归仍有 7 个失败；而且“必需行不可静默截断”的产品边界还没有在最终预算器中
形成可证明的硬保证。

## 直接证据

### 全量回归

主管独立重跑 `npm test`：

```text
175 tests / 167 pass / 7 fail / 1 skip
```

失败位置：

- `test/fix01-guidance-runtime.test.js:222`：压力 fixture 仍要求旧单 unit 字段集合；当前
  0.12 carrier 输出未完成迁移。
- `test/fix03-joined-runtime.test.js:432`：同类旧 WorkUnit wire 断言未迁移。
- `test/hl12-f03-work-unit-truth.test.js:276`：正式二 unit Hook 仍断言旧逐 unit goal/standard，
  没有改成 aggregate carrier 的 count/ref/readApi/digest/sentinel 合同。
- `test/nv02-capabilities.test.js:121`：instruction 断言仍是旧文本集合。
- `test/nv03-hook-work.test.js:337`：高压生命周期断言仍要求被 0.12 明确压缩的旧行布局。
- `test/nv04-recovery.test.js:1182`：mixed recovery 压力断言未按当前 Scope/Recovery/heartbeat
  合同迁移。
- `test/r3-joined-runtime.test.js:442`：三 active unit 仍断言旧 aggregate carrier 文本布局。

这些不是可直接留下的 scope skip；R8 已授权的迁移范围要求保留原安全/完整性意图，
改为当前 0.12 单一 Decision、aggregate carrier、accepted-only 和有界上下文断言。

### 必需载荷的预算边界仍缺少硬保证

R11 把 carrier 放进较大槽位，并把超长 HardBoundary/PushGate 改成 digest/external 形式，
方向正确；但 `contextWithinBudget()` 仍可对所有 slot 调用普通 `fitLine()`，最终仍有
`text.slice(0, limit)`。当前没有 `required`/不可截断行的最终保护，因此未来更长的合法
ref、Decision 或 carrier 仍可能被切成 `...` 却保留 `truncated=false`。必须从预算器层面
证明：必需行要么完整出现，要么先生成明确 `complete=false;truncated=true;inline=false`
的可重算外部载体；不能静默半行。

R11 的 `packageList.complete=false` 显式优先修补和 F06 8/8 结果已核对，但不能覆盖上述
全量失败与预算缺口。

## 必须返修

1. 完成 R8 授权的七个旧测试迁移，保留负向安全断言，不删、不 skip、不放宽、不恢复
   `Guidance[...]` 或 `remaining=N`。
2. 给 WorkUnit/Parallel/Completion carrier、HardBoundary、真实 PushGate 建立最终预算器
   的 required 保护；极长合法输入下无普通省略号假完整，状态真实可读。
3. 增加 source 与 installed 的单 unit、leaf fallback、2/3/8 unit、长 ref、长 UNKNOWN、
   mixed recovery、极端 gate probes，并独立重算 digest/ref/readApi/count/前中后 sentinel。
4. `node --check`、F06、F00-F06 矩阵和 `npm test` 全部重跑；目标为全量 0 fail（现有唯一
   明确 scope skip 除外）。

本轮未真实安装、全局修改、push/tag/release/deploy，也未干扰 Poracode、watchdog、bridge。
F07/F08 不得启动。
