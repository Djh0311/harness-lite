# HL12F06 writer report R1

状态：`reported_complete`（等待主管独立验收；不是 accepted）

## 本轮做了什么

F06 把 F05 的九类事件综合结果接到了正式 Hook 上：`SessionStart` 和 `UserPromptSubmit` 的模型上下文现在只投影一个 `Decision`（focus、decisionQuestion、nextAction），并附带完整性、目标、全部完成标准和 sentinel 的 `CompletionCarrier`。原有 work-unit、并行、依赖、heartbeat、capability、recovery 和来源收据行仍由正式 caller 投影，预算继续限制为 1800 字符。

`PreToolUse` 的真实 push 拦截改为人话说明，包含动作、目标、既有边界、实际风险和本次需要用户决定的事项；普通 Bash 不增加确认。现有 runtime identity、global-root、accepted-only、动态 capability、Stop 和卸载逻辑沿用 F01–F05 已接受实现，没有新增授权系统或全局停点。

当前 instruction block 更新为 0.12 纠偏口径：普通已授权工作由模型继续，异常记 UNKNOWN，硬风险才精确拦截，写入按 ownership 撤回，用户日常命令仍为 0；保留旧 0.11 词头和 digest 兼容，便于 official 0.11 upgrade/uninstall 精确回滚。

## 实际修改

- `lib/hook.js`：正式上下文接入 `guidance.select()` 的单一 decision package；压缩 carrier 保留 goal、全部 standards、sentinel；push gate 人话说明。
- `lib/install.js`：current instruction 接线和旧 0.11 instruction digest 兼容。
- `bin/hl.js`：未知内部命令提示更新为 0.12 口径。
- `hooks/README.md`：说明九事件单一 decision、carrier 完整性和普通路径零新增确认。
- `test/hl12-f06-joined.test.js`：正式 SessionStart/PreToolUse/installed dispatcher/instruction joined tests。

未修改 `hooks/dispatcher.js`（沿用 F02 已接受的 bootstrap/identity fail-closed caller）；未修改 F05 guidance helper、tree/work/delegation/capabilities；未做 F07 candidate、真实模型评测、真实安装、全局配置、push/tag/release/deploy。

## 证据

语法检查：

```text
node --check lib/hook.js
node --check lib/install.js
node --check bin/hl.js
node --check hooks/dispatcher.js
```

定向测试：

```text
node --test test/hl12-f06-joined.test.js test/hl12-f05-guidance.test.js
13 tests / 13 pass / 0 fail / 0 skip
```

F06 定向覆盖：正式 SessionStart 单一 Decision、carrier goal/standards/sentinel、普通 Bash 不拦截、真实 push 拦截说明、installed dispatcher 正式路径和 instruction 合同。

回归：

```text
npm test
171 tests / 164 pass / 6 fail / 1 skip
```

6 个失败来自旧 0.11/R2/R3 用例仍把已废弃的多段 `Guidance[...]` 或 oversize 场景中的 `complete=true` 当作旧 wire 合同；F06 新 joined 用例和 F05 helper 全部通过。这些失败已如实保留，不能据此声称全量 PASS，需主管判断是否作为版本迁移测试更新或返修。

## 当前文件 SHA-256

```text
lib/hook.js                  d7850306b3b7e56d62b4cdb997c6f6dfbc47c36606f37232abdb5d7bdcaaa2d7
lib/install.js               7f95310d3c76c895c0b12c5329b4d81dc4ef587886a875b85740985def3bce8e
bin/hl.js                    676dce1d4664c52f8c74f1c5796e8064d3097c6c5b72eca7541a3bcf6c8725f2
hooks/README.md              e8ec9787e2c71afd08a775fa28c62c88c6b0ee4e16260b5ae0d2d413484e3b4b
test/hl12-f06-joined.test.js 692dacf2a9edada5a4c469980862a7694ee62af49beed8be0579a07d8c438e33
```

## 未覆盖/边界

- F06 没有把 package/runtime 版本改成 0.12；candidate/version 接线属于 F07。
- F06 没有真实宿主连接、真实模型 A/B 或物化 candidate 复核。
- 异常不断档依赖 F02 dispatcher 的 identityDegraded 合同；本轮只验证正常 installed formal caller。
- 全量旧 wire 兼容失败如上，等待主管独立验收决定是否返修；本报告不把 `reported_complete` 当作接受。
