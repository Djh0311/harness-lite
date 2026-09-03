# Harness Lite 0.12 HL12F04 主管验收 R5：PASS

日期：2026-09-02（Asia/Shanghai）

## 结论

**PASS。** 这是主管对 F04 R5 的独立验收，不是实现子代理自报的替代品。

F04 已把 capability 的可信来源收紧为当前结构化 Hook-input，并把静态项目文件降为不可信历史缓存：静态文件即使自述 freshness、provenance、project、session/turn，也不会得到 `known` 或 `modelsComplete=true`。有效动态输入必须绑定当前 canonical project、event、session、turn 和 `hook-input` source；读回 carrier 还会检查 schema、freshness、projection、完整模型字段、source snapshot、字节数、digest 和路径。缺失或异常时只返回 `UNKNOWN`，不把普通工作整体冻结。

## 主管直接读回

本轮直接读取并核对了：

- `lib/capabilities.js`（SHA-256 `7c4b372a9ffd56a153c6d631821d48a5f8eeb516cced7ddb704398f63294a8eb`）
- `test/hl12-f04-capability-freshness.test.js`（SHA-256 `c3454e9944fe7ce4d55aee4f4551279b86a0f4cc1bad09cfdba940899b87445b`）
- `test/r2-capability-visibility.test.js`（SHA-256 `713fee357be1ff35dc7220af44d64a1ce593c413cbd5e5b8bc965acb3d12e42b`）
- `test/fix03-joined-runtime.test.js`（SHA-256 `4db2a8e0103b0090ab777b1353df0004c2093c1c065ae307d59ca362f68b48ed`）
- writer R5 report（SHA-256 `448bcaabc5d7bfe659696b4e4c25f85dec8da0dc9f2ce3f835e5570642759437`）
- 未参与实现的独立 reviewer R5 report（SHA-256 `557a25f55e73e397a9753219415c4345a938f40c4821e8f6ddfe54939bd15286`）

R0 和 R3 的失败报告保留在原处；R5 是在独立复核发现问题后返修的结果，没有覆盖或删除失败证据。

## 直接测试证据

主管实际执行：

```text
node --check lib/capabilities.js
node --test test/hl12-f04-capability-freshness.test.js \
  test/r2-capability-visibility.test.js test/fix03-joined-runtime.test.js \
  test/r3-capability-carrier.test.js test/r3-joined-runtime.test.js
```

结果：`18 tests; 17 pass / 0 fail / 1 existing scope skip`。唯一 skip 是既有的本地 lifecycle 文件不在 source candidate 的范围限制，不是 F04 或关键反例的 skip。

主管又实际执行全量：

```text
npm test
```

结果：`158 tests; 157 pass / 0 fail / 1 existing scope skip`，进程退出码为 0。

## 恶意输入和正常输入复核

主管在精确 `mkdtemp` 临时根中重新构造了以下输入，并在 `finally` 递归清理临时根：

- 合法 Hook-input（有/无 carrier 写入）得到 `known`，no-write 结果也带 canonical binding；
- 静态 capability 文件和自述 freshness/provenance/binding 得到 `UNKNOWN/incomplete`；
- carrier 缺失、错误 schema、错误 project/session/turn/event/source、过期和未来 freshness、projection/modelFields/sourceBytes/source snapshot/path 篡改均 fail closed；
- `manifest.binding` 为 null、数字、字符串、数组、布尔值，`manifest.provenance` 为 null、数字、字符串、数组、布尔值和函数，均为 `UNKNOWN`，不抛异常且不创建 carrier 目录；
- carrier 的 `projection.models` 改成 null、对象或含 null 行，即使同步重算 projection digest，也返回 `UNKNOWN`，不访问不存在的 `.length`；
- nested/direct provenance binding 的错误类型和值均被拒绝；5 模型、24 模型、超大输入和 unsafe carrier directory 回归通过。

## 写面和边界

F04 产品写面只有 `lib/capabilities.js`；旧 capability fixture 的迁移只发生在已批准的 `test/r2-capability-visibility.test.js` 和 `test/fix03-joined-runtime.test.js`，并保留了静态 UNKNOWN 负例和原有模型/完整 carrier 断言。新增测试只在 F04 专测文件。没有修改公共 Hook、dispatcher、install、tree/work/delegation、guidance、版本或 candidate 文件。

没有真实安装、upgrade、uninstall、全局配置写入、push、tag、release、deploy；没有读取或写入 `/home/synadmin/.codex`；没有杀死、重启或干扰 Poracode、watchdog、bridge。F05/F06 尚未启动。

## 仍然未证明的事项

F04 的公共 Hook 接线、0.12 instruction、candidate 物化和行为评测由后续 F06/F07/F08 负责；本 PASS 只接受 F04 的 capability helper 和其 source/regression 证据，不提前声称整个 0.12 完成。
