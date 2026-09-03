# Harness Lite 0.12 HL12F07 supervisor review R2

日期：2026-09-02（Asia/Shanghai）  
work unit：`HL12F07 — behavior evaluation, candidate and supervisor acceptance`  
复核对象：R1 当前工作树；writer report `HL12-F07-writer-report-R1.md`

## 结论

**FAIL，返回同一 owning unit 修复后再验收。**

候选包在源码目录中可以重复构建，但从 retained candidate 物化到一个新的目录后，
它自己的 F07 测试在加载阶段就崩溃。因此“source 和 materialized candidate 的必需矩阵”
还没有闭合；这不是可以忽略的环境噪声，也不能用 source 侧 2/2 绿测代替。

另外，八类真实模型 A/B 仍然明确为 `UNKNOWN`。当前环境没有可调用的真实模型连接器，
所以不能把这部分误记成行为 PASS；即使候选物化问题修好，F07 仍需在有两个模型家族、
每格三次成功调用和盲评记录时重新判断。

## 主管独立重放

### 1. 源码 candidate 身份（通过）

- 两次执行 `HARNESS_LITE_CANDIDATE_VERSION=0.12.0 node scripts/build-candidate.js`
  逐字节相同，并与 retained artifact 相同；
- artifact：`docs/harness/artifacts/harness-lite-0.12.0-be88eb96e05fbce34ef8a8d99210241032dc5c8ffaab841005c3eeb81e9f37f6.json`；
- 1,382,402 bytes，51 files，14 product JS；candidate digest 为
  `sha256:be88eb96e05fbce34ef8a8d99210241032dc5c8ffaab841005c3eeb81e9f37f6`；
- outer candidate metadata 和解码后的嵌入 `package.json` 都是 `0.12.0`；
- retained 0.10/0.11 未改写，没有真实安装、全局写入、push/tag/release/deploy，
  也没有干扰 Poracode、watchdog、bridge。

### 2. 物化 candidate 的决定性失败

主管把 artifact 的 51 个文件按记录的 bytes/mode 解包到 disposable root，然后直接运行：

```text
node --test test/hl12-f07-candidate.test.js
```

结果为进程级 FAIL（1 test failed）。`test/hl12-f07-candidate.test.js:11` 在模块加载时
直接对 `docs/harness/artifacts` 做 `readdirSync`；物化 candidate 不包含这个 retained
artifact 目录，于是得到：

```text
ENOENT: no such file or directory, scandir '<materialized-root>/docs/harness/artifacts'
```

这证明 candidate 自己无法重跑它声称的 F07 验证，不能标成“materialized 无 skip”。
测试必须在源码和物化目录都能运行，并明确把 retained artifact 作为外部只读输入（或
采用等价、不依赖未随 candidate 携带目录的验证方式）；不能在加载阶段依赖工作树路径，
也不能加 skip 掩盖缺口。修复后要重新物化并重跑完整决定性矩阵。

### 3. 行为评测状态

`docs/harness/artifacts/harness-lite-0.12.0-behavior.json` 列出全部 8 个场景，但
`status=UNKNOWN`、`families=[]`，理由是没有真实 model connector。没有使用模拟回答、
关键词命中或 reviewer 自身回答冒充模型样本；因此这一项保持未证明，不能授予 F07 PASS。

## R3 最小返修要求

1. 修正 F07 candidate 测试的 artifact 输入边界：源码运行可核对 retained artifact，
   物化运行也必须有明确、可复核的外部 artifact 参数/路径；不得在模块顶层无条件扫描
   物化目录不存在的 `docs/harness/artifacts`，不得删除断言或加无条件 skip。
2. 重新生成唯一 retained 0.12 artifact，并让两次独立 build、文件名 digest、bytes、
   files/product JS、外层/嵌入版本完全一致；解包后运行该测试和 F00–F06 joined/migration
   必需矩阵，关键项 0 skip、0 fail。
3. 保留当前诚实的行为 `UNKNOWN`；若环境仍无两个真实模型家族，报告中明确这是 F07
   尚未完成的外部门槛，不得用本地模拟补 PASS。候选结构修好后由主管重新独立判断，
   F08 在 F07 accepted 前不得启动。

