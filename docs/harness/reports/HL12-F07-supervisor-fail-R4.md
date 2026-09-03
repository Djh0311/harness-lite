# Harness Lite 0.12 HL12F07 supervisor review R4

结论：FAIL，返修。

本轮只复核 F07 的 0.11 official retained candidate 到 0.12 candidate 的真实升级路径；没有改产品，也没有触碰真实全局安装或宿主进程。

## 直接证据

在一次性临时项目中，先用 retained 0.11 candidate
`8e14e641b7d0fe3641a5e74c49b11a60761e0dc63fb75866ff8226e6b3687ae5`
安装：

```text
old install: INSTALLED
old verify:  ok=true, runtimeVersion=0.11.0,
             sourceCommit=working-copy:0.11.0-candidate
```

随后以本轮 candidate
`8c9bc085744357f1c778a674192745b10c13c18f9f00f6fe4300b23f586a41ec`
作为 source，调用正式升级入口：

```text
candidate runtime identity: 0.12.0 / working-copy:0.12.0-candidate
install({ upgrade: true, write: true }):
  status=HOLD, kind=drift, written=0
  differences=[runtimeVersion]
  reason=runtime identity 不允许增量混装
```

因此旧 0.11 runtime 没有被升级，当前 manifest/anchor/dispatcher 也没有形成 0.12 结果。写入数为 0，说明这不是半升级，而是升级入口在识别阶段就拒绝了合法历史载体。

## 根因定位

candidate-only builder 把嵌入的当前 `VERSION/SOURCE_COMMIT` 改为 0.12，这是必要的；但 `lib/install.js` 的 `inspect()` 仍先执行：

```js
if (value.runtimeVersion === VERSION) { ... previous-11 ... }
if (value.runtimeVersion) return { kind: 'drift', differences: ['runtimeVersion'] };
```

当 `VERSION` 变成 0.12、目标 manifest 仍是 0.11 时，代码在到达 `verifyPrevious11Snapshot()` 之前就返回通用 `drift`。同一临时项目直接调用当前模块的 `verifyPrevious11Snapshot()` 已得到 `ok=true, kind=previous-11-snapshot`，故 retained 0.11 的载荷本身有效，坏的是跨版本识别路由。

## 必须返修

1. 让 0.12 candidate 的正式 `inspect()/install()` 无条件先识别固定的 retained 0.11 identity，再按 `upgrade` 要求处理；不能依赖 `value.runtimeVersion === 当前 VERSION` 才尝试 previous-11。
2. `upgrade:false` 仍必须对已识别的 0.11 返回明确 HOLD；`upgrade:true` 必须完成一次原子 0.11→0.12 升级，并由 `verify()`、manifest、installation anchor、dispatcher 共同证明当前身份为 0.12。
3. 保留并回归 0.9/0.10/0.11 retained snapshot 的固定身份和显式升级门槛；本轮不扩展 0.6–0.8 范围。
4. 增加正式 F07 源码与物化 candidate 回归：旧 0.11 安装 → 未授权升级 HOLD → 显式升级成功 → verify/anchor/dispatcher 全通过 → uninstall 后用户原有字节恢复，且没有旧 rollback carrier 或 instruction block 残留。
5. 重新构建并只保留一个最终 candidate，重新运行必要矩阵；行为 A/B 仍可在没有真实模型连接器时记 `UNKNOWN`，不得模拟 PASS。

在上述证据补齐前，F07 不能 accepted，也不能进入 F08。

