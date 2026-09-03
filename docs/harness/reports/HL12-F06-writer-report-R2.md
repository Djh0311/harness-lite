# HL12F06 writer report R2

状态：`reported_complete`（R1 主管验收 FAIL 后返修；等待重新独立验收）

## R1 返修

1. 正式并行 Hook 不再把第三个及后续 runnable/active unit 折叠为 `remaining=N`。`hookParallelWorkUnitLines()` 现在请求全部 unit inline；短包逐个输出 id、goal、完成标准、设计、事实、依赖、写面和 agent。单个包过长时改为 `ParallelUnitCarrier`，带真实 current-leaf ref、`tree.workUnitPackages` 读取 API、完整 payload 字节计数、digest 和 standards sentinel，不再伪装成局部省略。
2. completion carrier 的 inline 文本超过预算时改为 `complete=true;truncated=false;inline=false;ref=<current leaf 相对路径>;readApi=guidance.completionCarrier;digest;standardsCount;sentinel`，明确模型应读取完整安全 carrier；不再把长 standards 静默 `...` 截断后仍声称 inline 完整。短 carrier 保留完整 goal、全部 standards 和 sentinel。
3. 未改 F02 已接受的 `hooks/dispatcher.js`（SHA `9db94a9904696e9bf1a88b9000805a5fd2fd5eda7f6d3b0308246fd911dde15b`）。

## 验证

```text
node --check lib/hook.js
node --check lib/install.js
node --check bin/hl.js
node --check hooks/dispatcher.js
node --test test/hl12-f06-joined.test.js test/hl12-f05-guidance.test.js
13 tests / 13 pass / 0 fail / 0 skip
node --test test/r3-joined-runtime.test.js
6 tests / 3 pass / 2 fail / 1 skip
```

R3 的两个失败是旧 wire 合同仍要求 `ParallelWorkUnitsCarrier:remaining=3` 和 oversize capability 上出现 `complete=true`；R3 现行产品要求逐个 unit carrier 和不误报完整，故未删改或放宽旧测试。

本轮全量回归：171 tests / 157 pass / 13 fail / 1 skip。新增失败主要是旧 R2/R3 wire 测试仍要求 `remaining=N` 或每个 unit 逐行 inline；新 F06 在超预算时使用单个真实 current-leaf/tree API carrier，避免尾部截断和虚假完整。未删改或放宽旧测试。

## 文件 SHA-256

```text
lib/hook.js                  ab8036b2d1c2960cb2e92396663f8f55fdc00ccd6d8172d538a45e62d009fe48
lib/install.js               bc1d6c468035e5412b4404affa4d8214ba265d95f0307c74cb93534886066aaa
bin/hl.js                    676dce1d4664c52f8c74f1c5796e8064d3097c6c5b72eca7541a3bcf6c8725f2
hooks/README.md              e8ec9787e2c71afd08a775fa28c62c88c6b0ee4e16260b5ae0d2d413484e3b4b
test/hl12-f06-joined.test.js 692dacf2a9edada5a4c469980862a7694ee62af49beed8be0579a07d8c438e33
```

没有 candidate、真实安装、全局配置、push/tag/release/deploy，也没有启动 F07。
