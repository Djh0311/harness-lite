# HLNEXT NV05 v1 — Supervisor Acceptance FAIL

结论：`FAIL / SAME WRITER REPAIR R1 / NV06 NOT STARTED`

候选：`sha256:068cc60bcc909b3541ed7c75c994ad84fc7c72cfa58ec77a76e29a91fa2dce89`

已通过的候选证据：writer 报告 82/82 tests、selfcheck、13 个产品 JS 语法和双 candidate 一致；project/managed install、显式升级门、故障注入、宿主事件证据和原生 worktree probe 已有覆盖。

主管直接验收失败：0.9.1 升级身份由待升级目录自己的可变 manifest 自证，未绑定 NV00 冻结的真实 0.9.1 载体。

- 主管先按候选测试的方法把当前 0.10 源复制并仅改写版本字段，安装成所谓 0.9.1；再篡改已安装的 `lib/work.js`，同时重算 manifest 自报的 `packageDigest`。
- 当前 `inspect()` 返回 `ok=true`、`kind=previous-09-snapshot`、`differences=[]`；显式 upgrade dry-run 也返回 `READY`。这证明攻击者可同步改文件和 manifest 后被当作已知可升级载体。
- `verifyPrevious09Snapshot()` 只比较版本/source/profile/instruction 字段、当前 required-path 子集、manifest 自报文件表、自报 package digest 与自报 hook definition；没有把旧载体的 managed paths、逐文件摘要、package digest 和 hook definition digest 绑定到只读冻结常量。
- 候选测试的旧版本 fixture 来自当前 0.10 源副本，只改 package/version/source/instruction；它有当前 13 个产品 JS。NV00 冻结的真实基线只有 11 个产品 JS，因此该测试没有证明真实 0.9.1→0.10 升级。

R1 必须：以真实 NV00 0.9.1 快照建立不可由待升级目录自改的固定身份；对 exact managed paths 和逐文件内容/摘要 fail closed；使用真实 11-product-JS 基线做成功升级；新增“改任一 runtime 文件并同步重算所有可变 manifest 摘要”的 coherent-tamper 攻击，要求 `HOLD`、零写入且旧目录不变。不得弱化当前 0.10 身份、回滚、证据或 push gate。

计数：本完整 NV05 v1 候选按 claimed-complete acceptance failure 一个主因计；普通 writer 家族在 NV05 累计 1 次有效失败，未触发升级。

载体：snapshot working copy；not pushed；not released。
