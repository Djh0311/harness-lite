# Harness Lite 0.12 HL12F07 supervisor review R8

结论：FAIL，返修。

R7 的手工重放仍能走通迁移，但正式回归测试没有把关键安全断言写进去，因此不能把 `3 pass` 当成完成证据。

## 直接缺口

`test/hl12-f07-candidate.test.js` 当前迁移测试的关键行是：

```js
const held = api.install(project, { write: false, upgrade: false, source: candidate });
assert.notEqual(held.status, 'INSTALLED');
```

这只排除了一个状态，不能证明正式写入口在未授权升级时返回 `HOLD`，也不能证明 `written === 0`。而且它使用 `write:false`，没有覆盖用户真正调用写入口时的零写保护。

升级后的断言也只检查了 manifest 的两个字段和 dispatcher 进程退出码：

- 没有读取并核对 `.codex/harness-lite/installation.json` 的 0.12 绑定和 digest；
- 没有核对已安装 dispatcher 的 `bootstrapVerify()`/identity 输出确实是 0.12，而不是仅仅 exit 0；
- uninstall 后没有明确检查 `.codex/harness-lite/installation.json`、旧 rollback carrier（包括 `.claude/.harness-lite.rollback-*`）和旧 0.11 instruction marker 全部清除。

因此测试可以在关键断言缺失时继续报绿，不能满足 F07 的迁移验收标准。

## 必须返修

1. 把未授权调用改成 `write:true, upgrade:false`，逐项断言 `status === 'HOLD'`、`kind === 'previous-11-snapshot'`、`written === 0`，并在调用前后对项目快照做逐字节相等检查。
2. 升级后读取 installation anchor，断言 `runtimeVersion/sourceCommit`、`sourcePackageDigest`、`manifestDigest`、`anchorDigest` 和当前 manifest 一致；调用已安装 dispatcher 的 bootstrap/identity 检查，而不是只看退出码。
3. uninstall 后显式检查：用户文件原始字节恢复；`.claude/harness-lite`、`.codex/harness-lite/installation.json`、所有 rollback carrier、`CLAUDE.md` 及 0.11 核心 instruction marker 不残留。若 Harness 基线文件按既有合同保留，要在测试中明确区分它们，不得把“目录还在”误报成清理完成。
4. 在 source 与 materialized candidate 两条路径各运行该测试，重建并核对唯一 retained candidate；行为 A/B 若仍未完成真实样本继续 UNKNOWN。

在这些断言补齐并由主管重跑前，F07 不能 accepted，也不能进入 F08。

