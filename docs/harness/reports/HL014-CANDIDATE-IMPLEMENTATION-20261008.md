# Harness Lite 0.14 源码候选：实现与验证

状态：`SOURCE CANDIDATE VERIFIED / LIVE HOST UNKNOWN / NOT RELEASED`

## 1. 结论与边界

0.14 源码、内部入口说明和隔离候选已实现。源码与物化候选在实际 Node 22 和 Node 24 下分别通过当前门槛，各 **237/237，0 failed，0 skipped**。没有用绿测代替真实宿主或用户结果验收。

本轮仅修改源码、测试及相应说明，安装验证只在一次性隔离项目进行。**没有安装或迁移 Syn，没有提交源码、push、tag 或 release，没有修改用户全局指令、登录或凭据。**

下列结论尚不能声明：

- 真实 Codex / Cursor 自然请求能连续推进多个工作单元：`UNKNOWN`。
- 相同模型、工具和起点的 0.13/0.14 代表任务负担对照：`NOT-COVERED`。
- Desktop 四事件实际执行和 native pre-push 实际有效：`UNKNOWN`。
- Syn 混合 0.8 runtime / 0.13 anchor 已完成迁移：`NOT-COVERED`，本轮未动。
- Grok 独立代码复核已通过：没有返回结论，不记 PASS。

## 2. 本版实际改动

### 真话、局部停点和范围

- 空 verify 返回并保存 `ran:false / ok:null / status:not-run`，不再声称通过；历史 `no checks` 只在读取时纠正，不改写记录或复活旧成功。
- 无有效 current/allowed 投影时范围为 `UNKNOWN`，不把所有文件判为禁止；合并 stage 与 leaf 明确禁区，允许前缀中的明确禁止子路径也进入报告。
- pending push 只停止明确等待同 session/turn、同 HEAD 和 push URL 的精确目标；旧 pending 不停止独立开发，也不变成 push 许可。
- 每个相关事件只记录最终决定和一个原因，Stop 清掉 turn 前留原因；status 按需展示，不保存原始命令或用户消息。

### 现有能力的生产接线

- `UserPromptSubmit` 记录来源，给主管一个短的来源/文档指针。主管判断完整用户语义后，通过真实宿主 Bash 工具调用固定 `--work-intent` 内部入口。
- native `PreToolUse` 是登记写入者，补齐绑定和期限，调用已有 `issue / pause / resume / exit`；standalone helper 只读匹配结果，不能自行授权或移动 leaf。
- 固定字段覆盖 execute、non-execution、revoke、pause、resume、exit，仍只有六个 `hl` 顶级接口，用户日常 Harness 命令为 0。
- 源码验证来源、当前 leaf/stage、精确目标、时间窗及证据覆盖。主管仍负责语义许可和直接结果验收，文件存在或摘要不是完成证明。
- 不在 Stop 发放或续期租约。同一来源重放不刷新时间，撤回不能同源复活；最终 Stop 将来源 ID 留在已有观察账，临时 turn 删除后也不能重新开窗。
- 无关 session 的仅评审意图不关闭已有执行绑定。多个 current 或未知目标只停用相应自动能力，不移动用户文件。
- 入口只接受支持的字面 launcher 和命令形状，拒绝活跃 shell 展开及附加动作；读取 dispatcher 中的 flag 不再被误判为登记。

### 身份、所有权和兼容

- 0.14 Hook 产品摘要规范化合法直接 Node launcher，实际配置仍保留绝对启动路径；拒绝 wrapper、shell 附加、其它 dispatcher、matcher/timeout 改动和伪 Node。
- health 分开本地产品身份、验证器 Node 环境、配置、信任和真实事件观察；本地身份一致不代表宿主已执行或 effective。
- 发布 0.13 固定 package/instruction/path/anchor 身份，要求显式升级；旧 project Hook 按当时 launcher 重建并精确移除。managed 0.13 未使用的本地 Hook 摘要保留历史绑定，受保护 global gateway 在改写前另行校验。
- Cursor 复合自定义命令为 UNKNOWN/HOLD，不假认 owned；合并和卸载保留外来字段、数组分隔、空声明、模式及后续用户修改。profile 迁移按实际新增事件重新记录 preimage。
- 项目宿主回执 join 接受事件适用的最终决定，但仍要求精确 event/session/turn/package/definition 和 receipt cursor；managed gateway 回执仍单独解释。

## 3. 验证结果

证据目录：`/home/synadmin/workspace/hl014-upgrade-20261007-qzykyrvp`

| 检查 | 结果 | 持久证据 |
| --- | --- | --- |
| 源码当前门槛，Node v24.21.0 | 237/237 | `current-gate-after-review-node24.tap` |
| 源码当前门槛，Node v22.16.0 | 237/237 | `current-gate-after-review-node22.tap` |
| 同一物化候选，Node 24 | 237/237 | `candidate-second-node24.tap` |
| 同一物化候选，Node 22 | 237/237 | `candidate-second-node22.tap` |
| project/managed，22→24 及 24→22 安装、验证、事件协议、卸载 | 4 组合通过，12 个阶段记录 | `cross-node-final.json` |
| 发布 0.13，两 profile、两方向、升级后卸载及直接卸载 | 8 组合通过，用户字节恢复 | `cross-node-013-final.json` |
| 0.13 升级故障回滚、混装及用户修改 HOLD | 当前门槛覆盖 | `test/hl14-upgrade.test.js` |
| 独立复核反例 | 十项先 RED 后修正，最终门槛 PASS | `independent-review-resolutions.json` |
| CLI 数量、十四个产品 JS 的语法 | 当前门槛覆盖 | `test/current-contracts.test.js` |
| 原 WIP/HEAD 与空白检查 | 保留，`git diff --check` PASS | `baseline.json`、`tracked-wip.patch`、`preimages/` |

矩阵来自实际两个不同 Node 二进制，不只用 symlink 或修改 `process.execPath` 模拟。事件由已安装 dispatcher / 隔离 managed gateway 处理，**它们仍是协议验证，不是 live-host 自然请求验收**。

当前门槛保留原有 Terra/Sol 与旧版历史契约排除，不新增排除来换取 PASS；历史套件本轮未另行全跑，不混算为当前 0.14 回归。

### 候选物化的测试依赖

candidate builder 不包含可变 `docs/harness` 或历史大型 artifact。首次直接跑物化候选时，因缺少旧 0.10/0.11/0.12 artifact 出现六个测试 setup 失败和一个 skip。随后只补齐三个已有、摘要固定的历史 **测试输入**，不修改候选文件或产品代码，再通过完整门槛。

这些输入不是 0.14 新包内容，清单与摘要在 `candidate-first-test-fixtures.json`。0.13 fixture 已作为自包含、固定二十个运行文件的测试数据纳入候选。

## 4. Grok 与独立复核

实际调用使用 `grok-4.7` + `high`，返回后台模型 `grok-4.7-build`。设计子任务一轮以 `end_turn` 完成，证据为 `grok-entry-design-bounded-result.json`。没有把此前 CLI 参数/认证路径失败概括成“用户没登录”，没有重新登录或更改凭据。

采用其来源绑定、不在 Stop 续期、证据覆盖建议；没有采用“一次来源只允许一个操作”“resume 后必须第二次用户请求”等增负规则。

独立实现复核分为意图/授权、安装/身份、真话投影/文档三组。十项发现都由主线程单独复现，再修正并加入反例；其中 shell 展开反例只作为 stdin 命令字符串送给 Hook，**未执行 payload 或实际 push**。

两次 Grok 代码复核分别在 240 秒内没有返回结论，退出 124。它们不是设计完成的证据，也不是代码评审 PASS。CLI 最初空 tools 参数的错误另行保留，非产品失败。汇总为 `grok-outcomes.json`。

## 5. 候选身份与原工作保护

- 源码路径仍为 `/home/synadmin/harness-lite-0.9.1`，目录名是历史名称，不移动用户目录。
- Git HEAD 保持 `aac6bd5fe721aa126cf6d9203e5d96d2db540913`；0.14 是未提交的工作副本候选。
- 版本/来源为 `0.14.0 / working-copy:0.14.0-candidate`。
- 最终 artifact：`candidate-second.json`，物化目录：`candidate-second-source/`。
- 候选 65 文件，十四个产品 JS；源码、artifact、物化文件的 file/product 摘要一致。
- Candidate digest：`sha256:1ef27c7cd3686303788742edba35d9cfddd684b9e0e93a0cce137b3122b9fafd`。
- File digest：`sha256:e0f75a2c525d2c1dac63d779418435863deb148e9370957e7093f299e3f0b75a`。
- Product JS digest：`sha256:77785b5afe3779e85d6384297b34000981bcb3f0e3e828eabf7baa4193719921`。
- 安装 runtime package digest：`sha256:4b24dda2038404b53a21bbb8461ca588ca902dc1709577e9cb86565a32874600`，与 builder 的 JS/artifact 摘要用途不同。

原 `AGENTS.md`、plan、HL12 leaf/stage 和 Astra 方案的五个 preimage 摘要逐一一致。原 Cursor 代码 WIP 的 preimage/patch 保留，新实现是在其上增量修正，不撤回用户工作，不清理其它 untracked 文件。

原 tracked WIP patch SHA256：`015da2a3f0322286b1709e219fa1b7de27699c34b21b92cd8801413fcbf05a0e`。

本文记录源码候选验证，不是 current authority、正式发布回执或 Syn 验收。
