# HL12F06 writer report R4

状态：`reported_complete`（R3 主管 FAIL 后返修，等待重新验收）

本轮修复：

- 组合压力时改走 essential wire：移除非必需 intro/scope/provenance/重复 activity 等 metadata，保留 Decision 三字段、CompletionCarrier、ParallelWorkUnitsCarrier 和 heartbeat；必需行不再交给最终 `slice(0,1800)` 尾截。
- 并行整体 carrier digest 现在覆盖每个完整 package 的 id/status/goal/completionStandards/authorityDesign/facts/entryPoints/disprovenRoutes/unknowns/routeBasis/dependencies/resultContract/allowed/forbidden/writeScope/readiness/dispatchReady/source/agent。
- `parallelContext.complete` 原值用于 inline/整体 carrier，不再硬编码并行完成状态。
- 长 completion carrier 继承底层 `complete`、`truncated`；UNKNOWN standards 会显式不完整。
- 新增长 UNKNOWN 和三-unit carrier 的真实 ref/readApi/count/digest/sentinel 测试。

验证：`node --check` 四个正式 caller 全部通过；F06 定向 6/6；`npm test` 173 tests / 159 pass / 13 fail / 1 skip。13 个失败仍是旧 0.11/R2/R3 wire 断言（要求 Guidance fragments、remaining 或逐行 inline），未删改测试。

文件 SHA：

```text
lib/hook.js                  d8faf0319e860e2f6db6713678b23d3a33c033a72fb823ff41508f16ccd7dca4
lib/install.js               bc1d6c468035e5412b4404affa4d8214ba265d95f0307c74cb93534886066aaa
bin/hl.js                    676dce1d4664c52f8c74f1c5796e8064d3097c6c5b72eca7541a3bcf6c8725f2
hooks/README.md              e8ec9787e2c71afd08a775fa28c62c88c6b0ee4e16260b5ae0d2d413484e3b4b
test/hl12-f06-joined.test.js 1ce57cb230a3e8eef672d75eab2348f18457f47b31c5566962f828d85c53a2b5
```

`hooks/dispatcher.js` 未修改，保持 F02 accepted SHA `9db94a9904696e9bf1a88b9000805a5fd2fd5eda7f6d3b0308246fd911dde15b`。未真实安装、修改全局、push/tag/release/deploy，未启动 F07。
