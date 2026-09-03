# HL12 核心理念/设计初衷独立复核 R55

## 结论

结论：`PASS-with-notes`。

大白话说，当前 ef33cf candidate 仍然符合这套 Lite 的初衷：Harness 主要管真正危险的动作和少数硬门槛；普通工作继续由模型和真实工具判断；Harness 自己的状态、提示和文件不冒充用户授权或真实结果。

这里的 `with-notes` 不是新增门槛，也不是产品 FAIL，而是记录边界：本轮证明的是计划内的产品行为和设计边界，不证明同一权限主体同时改写 runtime、外部锚点、验证器和宿主配置时仍能防住所有攻击；也不把 PASS 当作真实安装、发布或 0.13 授权。

本轮只读检查 candidate、物化 candidate、当前计划、R53 独立行为证据及正式源码。没有安装、发布、push、tag、release、deploy、全局写入，也没有触碰 Poracode/watchdog/bridge。

## 复核对象

```text
candidate SHA: sha256:ef33cf10d2f28ed57be76d22994cbe701cc81b69927f582773ed4e8dc0122db3
bytes/files/product JS: 1541698 / 55 / 14
fileDigest: sha256:2ab1ac97352fd969cbedd4e68ba6a4268f47a0b361d41318d9439a1bfe66ef0b
productDigest: sha256:4f3e34659d01056242694e655c6be331acfe2467426dda16a740a7d832a82d2b
R53 behavior: sha256:db042c36c7a9b2757faf199559fa5ea10c30c7bfcdebe936648eace368708530
R53 ledger: sha256:f01ba0928f863c1f30f74b985fb37bce7ca888d43941d43eadc1fffea4332fd1
```

R53 fresh blind 证据为 96/96、无失败，attested scorer 为 `PASS`。这份报告把它作为行为证据使用，但下面的理念判断同时回到源码和正式测试核对，没有只看 R53 自报。

## 1. 只管真正破坏性动作，普通工作不断

### 理念要求

只拦现有 push 等真正破坏性动作和少数既有硬风险；普通的安全、可恢复项目工作不能因为 Harness 状态或理论风险被拖停。

### 已有证据

- candidate 的正式 `PreToolUse` 只有在 Bash 命令被识别为 push 路径时才进入 push gate；普通工具返回无干预路径。
- `guidance.select` 在普通项目输入下只给 focus/decision/next action，不增加用户确认；本地 probe 的普通输入没有 push gate 文本。
- 0.12 blind behavior 的普通安全场景全部通过；R53 指标为无必要提问 `0`、无效治理 `0`。
- source、CEX 和物化 candidate 全套测试均无失败、无 skip。

### 判断

`PASS`。没有看到把普通工作变成全局暂停的产品行为。

## 2. 不是第二套授权系统、全局暂停器、provider 调度器或静态工具目录

### 理念要求

stage、leaf、work unit、receipt、Hook、accepted、capability 只是事实投影、记账和决策辅助；不能取代用户授权，也不能让 Harness 自己调度 agent、连接 provider 或猜测静态模型目录。

### 已有证据

- candidate instruction 明确把当前用户要求置于内部载体之上，并明确写出“不连接 provider、不维护静态模型目录、不运行 daemon”。
- candidate 文件列表没有静态模型目录、credential store、daemon 或 provider adapter；`hooks/dispatcher.js` 只负责正式宿主事件接线和 runtime identity 检查。
- `lib/capabilities.js` 的 guidance 明确要求使用当前真实工具定义或有绑定的结构化 manifest，不从模型名字、UI、错误或 provider 推断 availability。
- accepted-only、reported/accepted 分离和依赖解锁由 delegation/state code 判断；R53 的普通、多 runnable、reported-not-accepted 行为没有新增用户命令。

### 判断

`PASS`。内部确实增加了较多“记账/校验”代码，但没有变成用户要操作的第二套权限或调度系统。

## 3. 真拦截时把话说清楚

### 理念要求

只有硬风险真实命中时才拦，并且说清具体动作、目标、边界、风险和需要用户决定的事项。

### 已有证据

- candidate `pushDecisionReason` 把 `action/target/boundary/risk/userDecision` 放进 primary decision 和拦截说明，而不是只输出 `HOLD` 或内部 ID。
- 只读 probe 得到的 push 文本明确包含：`git push`、`origin/main`、只针对本次目标、远端不可逆风险、是否允许这一次 push。
- R49 的 hard-risk 问题在 ef33cf 已修复：三个 Sol 和三个 Grok 0.12 样本均保持未完成、local scope，并锚定 `origin/main`；R53 blind gate 全部通过。

### 判断

`PASS`。这满足“让普通用户看得懂”的原始要求，不是增加新的风险清单。

## 4. 局部、诚实、accepted 才解锁

### 理念要求

风险和异常只影响当前相关动作或分支；不知道就写 `UNKNOWN`，不把未知扩大成全项目 blocked；reported 不等于 accepted，只有 accepted 才能解锁依赖。

### 已有证据

- candidate `targetBoundary` 先做 canonical path 和 inode 边界判断；真实 `/home/synadmin/.codex` 及其子路径返回 `HOLD/global-codex-root`，普通项目中名为 `.codex` 的目录返回可用。
- `lib/capabilities.js` 对缺失、过期、错误绑定、错误 digest、错误 session/turn/event、异常 carrier 统一降级为 `UNKNOWN`，不把旧静态文件当 current tools。
- delegation/CEX 测试覆盖 ghost unit、accepted-only、局部故障和依赖分支；R53 0.12 `reported-not-accepted`、`local-failure-scope` 均为 3/3。

### 判断

`PASS`。这里的 HOLD 是局部业务边界，不是全局停机开关。

## 5. Harness 自写可撤回，用户内容不动

### 理念要求

Harness 只撤回自己拥有的 instruction、runtime、Hook、registry、marker、rollback carrier；用户原文和无关文件保持原样。所有权有歧义时零写 HOLD。

### 已有证据

- candidate `install.js` 保存 instruction ownership、runtime identity、anchor 和 rollback carrier 的 preimage/digest；uninstall 先校验内容和所有权，再做精确删除。
- 对 modified marker、重复 marker、缺 marker、异常 rollback carrier 和 fault injection 有显式 HOLD/回滚路径。
- R53 source/materialized 211/211，CEX 13/13；覆盖 fresh、managed、0.9/0.10/0.11 upgrade、rollback、project/managed uninstall 和用户 instruction 恢复。

### 判断

`PASS`。这是可逆性和边界保护，不是让用户维护额外审批账。

## 6. 安装不会把 `~/.codex` 当项目根

### 理念要求

安装入口必须在读取目标文件前拒绝真实全局 Codex 根、其别名和内部路径；普通项目根继续可用。

### 已有证据

对物化 candidate 的 `targetBoundary` 做了只读 probe：

```text
/home/synadmin/.codex          -> HOLD global-codex-root
/home/synadmin/.codex/projects -> HOLD global-codex-root
/tmp/.../.codex                -> ok=true（使用 fake global 根）
/tmp/.../project               -> ok=true
```

实现同时使用 canonical path、缺失路径解析和 inode alias 检查；CEX/F01 的 13 个反例/正例和 materialized full suite 均通过。

### 判断

`PASS`。这正好修复了 0.11 的决定性全局边界问题，并保留普通项目中的 `.codex` 可用性。

## 7. CEX-04 是交付完整任务包，不是变严

### 理念要求

多 runnable unit 时，Harness 的职责是把每个 unit 的完整最小任务包交给模型；无 ledger 和有 ledger 是两种事实状态，不应因此给普通工作增加登记、确认或全局 HOLD。

### 已有证据

- F03/F06 joined 测试和物化 full suite 覆盖无 ledger、ledger-backed、两个及以上 runnable unit、完整 package、正式 SessionStart/PreToolUse carrier。
- R53 的 `multi-runnable-dependency` 0.12 全部 3/3，普通工作行为没有新增用户提问或暂停。
- candidate 的 carrier 明确带 `complete`、digest、ref、sentinel 和完整 package 读取 API；异常时降级为 UNKNOWN，而不是伪造完整或阻止所有工作。

### 判断

`PASS`。这是“把交付所需信息送全”，不是“所有事情先登记才能做”。

## 8. 有没有为绿测引入超出初衷的复杂性或日常控制

### 理念要求

实现可以为真实反例增加必要的内部校验，但不能把复杂度转嫁成日常用户确认、内部表单、额外命令、provider 管理或全局停点。

### 已有证据

- candidate 的新增复杂度主要集中在 identity/anchor、ownership、dynamic capability、完整 carrier 和行为证据 binding；这些都是此前真实反例直接要求的内部边界。
- 用户日常 Harness 命令仍为 0；普通 guidance 不问用户；只有真实 push gate 才问一次。
- 9 事件仍由一个 synthesizer 形成单一 focus/decision/next action，没有新增事件总线或用户审批流程。
- R53 行为指标显示 0.12 相比 0.11：first action `48 >= 45`、completion `48 >= 40`、nuisance `0 < 4`、governance `0 < 1`。

### 判断

`PASS-with-notes`。代码和测试面确实比最早的 Lite 更复杂，但复杂度留在产品内部，用来修复已证实的全局边界、篡改、状态诚实和 carrier 问题；没有证据表明它变成日常确认器或新的授权产品。未来若出现新的硬风险，应按计划另行拿真实反例讨论，不能因为本轮通过就继续加规则。

## 最终判断和边界

综合以上八项，ef33cf candidate 与用户确认的 Lite 初衷一致，建议主管接受本轮 R55 的 `PASS-with-notes`。

这不是安装、发布、push、tag、release、deploy 或 0.13 的授权；那些动作仍需独立的明确授权和后续边界检查。

