# Harness Lite 0.12 HL12F01 writer report

日期：2026-09-02  
work unit：`HL12F01 — install boundary ownership uninstall`  
writer 状态：`reported_complete`，等待主管直接读回；本报告不声明 `accepted`  
执行边界：只完成 F01；没有开始 F02–F07，没有修改 Hook 公共接线、版本、package 或 candidate

## 一、结果

HL12F01 在 writer 写面内完成：

- CEX-01 的正式 CLI 坏路径已转绿：synthetic HOME 的全局 Codex 根、symlink alias 和 alias 下后代路径，在读取 target 内文件前返回说人话的 `HOLD`，零 target 内容读取、零写。
- CEX-01 正例继续通过：普通非 Git 项目，以及名字同样是 `.codex` 但不属于当前用户全局根的普通项目，都能安装和卸载。
- CEX-06 坏路径已转绿：official 0.10 → current upgrade 后 uninstall 恢复用户 `AGENTS.md` 原 bytes，删除生成的 `CLAUDE.md`、stable runtime 和已登记 rollback carrier。
- fresh、official 0.9、official 0.10、retained official 0.11 四条路径都完成 upgrade/uninstall bytes 矩阵；用户 instruction 和无关二进制文件逐字节不变。
- current runtime manifest 新增显式 `instructionOwnership` 与 `rollbackCarriers` 合同；rollback carrier 内另有绑定 canonical target 和 runtime image digest 的 `rollback-ownership.json`。
- 用户修改 owned block、marker 破损、marker 重复、owned segment 歧义，或 fresh target 只有 marker 而没有 runtime ownership 时，uninstall/install 都在第一次写入前 `HOLD`，不模糊删除相似文本。
- uninstall 把 stable runtime 与 rollback carrier 先移入同文件系统事务 tomb；instruction、Hook、managed registry、native 任一点 fault 都恢复完整 preimage。
- 原 source suite（排除仍由 F02–F04 owning unit 负责的 F00 known-red 文件）为 130 tests / 129 pass / 0 fail / 1 scope skip。

F01 没有增加新的风险种类、用户命令或确认；push、Stop continuation 和 Harness owned 写面原硬门槛仍由原实现与原回归覆盖。

## 二、正式 caller 与实际修复

### 2.1 pre-read global-root boundary

共用入口为 `lib/install.js:160 targetBoundary`：

1. 从 `CODEX_HOME` 或当前用户 HOME 的 `.codex` 得到真实全局 Codex 根；
2. 对 target 与全局根做“最近已存在 ancestor 的 realpath + 缺失 suffix” canonicalization；
3. 同时沿 target ancestor 做 `dev:ino` 核对，symlink/alias 和缺失 descendant 不能绕过；
4. 仅当 canonical target 等于或落入全局根，或 inode ancestor 命中全局根时 HOLD；不按目录名猜测。

边界在以下正式项目 target 入口的任何 target 内容读取之前生效：

- `verify06`、`inspect`、historical identity checker、`health`、host-health record；
- `install`/upgrade、`uninstall`；
- extension install/uninstall、native install/probe/state；
- `managed.installGlobal`/`verifyGlobal`、project registry prepare/state 和 managed gateway project cwd。

`bin/hl.js` 的 install/upgrade/uninstall 分支仍调用上述正式 API；本 unit 没有修改 F06 才拥有的公共 CLI/Hook 接线。

测试中的 read observer 只拦截 disposable 子进程的 `fs.readFileSync`：exact global、symlink alias、alias descendant，以及 `inspect`、`verify06`、`health`、`uninstall` 均没有 target content read log。普通项目正例返回 `INSTALLED` 后又返回 `UNINSTALLED`。

### 2.2 instruction ownership

`instructionOwnership.schemaVersion=1` 为 `AGENTS.md`、`CLAUDE.md` 分别记录：

- 原文件是否存在、原 mode、原 bytes 的 base64 与 SHA-256；
- 当前 installed body digest、owned block digest；
- 安装器实际加入的完整 owned segment bytes 与 SHA-256。

install 只接受零个 marker，或唯一且完整的已知 official block。fresh target 中没有 runtime ownership 的现成 Harness block 被视为所有权歧义，不自动接管。升级时，已有有效 receipt 会跨版本保留最初用户 preimage；official 0.9–0.11 旧 runtime 则只迁移精确已知 block。

uninstall 必须同时满足：receipt schema 有效、文件为普通可逆 UTF-8、BEGIN/END 各唯一、block bytes 精确等于当前 owned block、完整 owned segment 在文件中恰好出现一次。完全未改的 postimage 恢复原 bytes；只改 owned segment 之外的用户文字时，仅移除精确 owned segment并保留这些用户改动；任何 owned 内容歧义都 HOLD。

### 2.3 rollback ownership 与 uninstall transaction

upgrade 在移动旧 stable runtime 后创建 rollback receipt，内容绑定：

- canonical project target；
- 新 stable package digest；
- 旧 runtime 的完整 runtime-image digest。

新 stable manifest 记录 carrier、runtime、receipt 相对路径及 image/receipt digest。下一次 install 或 uninstall 都要求 manifest 列表与物理 `.harness-lite.rollback-*` 集合完全一致；未声明、缺 receipt、额外内容、symlink、target 不匹配或 runtime 漂移全部 HOLD。

uninstall 的写事务顺序为：

1. 所有 instruction、Hook、native、managed registry、rollback identity 完成只读 preflight；
2. stable runtime 和每个已登记 rollback carrier 原子 rename 到同文件系统 tomb；
3. 应用 registry、instruction、Hook、native removal；
4. final commit 前 fault 点通过后，才删除 tomb。

任一步在 commit 前失败，按逆序恢复 registry、Hook、native、instruction、rollback carrier 和 stable runtime；并发 postimage 不匹配时不会覆盖现场，而是明确报告 recovery difference。

## 三、直接测试证据

新增持续回归载体：`test/hl12-f01-install-ownership.test.js`。

| 证据组 | 直接结果 |
| --- | --- |
| canonical pre-read | exact synthetic global、symlink alias、alias descendant、inspect/verify/health/uninstall 全部 HOLD；read log 不存在；global user bytes 不变 |
| 普通正例 | 非 Git、普通同名 `.codex` project install/uninstall 正常，原 `AGENTS.md` bytes 精确恢复 |
| uninstall matrix | fresh、0.9、0.10、0.11 共四条路径全部 `UNINSTALLED`；原 instruction/unrelated bytes 相同；generated `CLAUDE.md`、stable runtime、rollback carrier 均不存在 |
| ownership HOLD | modified block、broken marker、duplicate marker、fresh unowned exact block 均 HOLD，调用前后完整 project snapshot 相同 |
| fault rollback | instruction-written、hooks-written、uninstall-commit、rollback-tomb 四个 fault 都返回 `PARTIAL` 并恢复完整 project snapshot |
| managed | managed project uninstall 删除 registry binding 和 project owned instruction；system bundle 除 registry 预期变化外逐字节不变 |

执行命令与结果：

- `node --check lib/install.js`：exit 0。
- `node --check lib/managed.js`：exit 0。
- `node --check test/hl12-f01-install-ownership.test.js`：exit 0。
- `node --test test/hl12-f01-install-ownership.test.js`：exit 0；6 tests / 6 pass / 0 fail / 0 skip。矩阵和 fault 组合都在六个顶层 tests 内真实执行，没有条件 skip。
- `node --test --test-name-pattern='CEX-01' test/hl12-f00-counterexamples.test.js`：exit 0；2/2 pass。
- `node --test --test-name-pattern='CEX-06' test/hl12-f00-counterexamples.test.js`：exit 0；2/2 pass。
- `node --test test/hl12-f00-counterexamples.test.js`：exit 1；13 tests / 9 pass / 4 fail / 0 skip。CEX-01 与 CEX-06 的坏路径和正例均已通过；四个失败精确是尚未开工的 CEX-02、CEX-03、CEX-04、CEX-05。
- `node --test test/nv02-capabilities.test.js test/nv05-integration.test.js test/hl11-event-upgrade.test.js`：exit 0；23 tests / 23 pass / 0 fail / 0 skip。
- 枚举当前 test files、仅排除 `test/hl12-f00-counterexamples.test.js` 后执行 `node --test`：exit 0；130 tests / 129 pass / 0 fail / 1 skip。

唯一 skip 是既有 `R3F03 active indexes...` lifecycle 文档 scope skip：source candidate 不包含本地 lifecycle documents。它不覆盖 F01 的 boundary、upgrade、uninstall、ownership、rollback 或 fault 验收；F01 新测试和 CEX-01/CEX-06 均无 skip。

## 四、working snapshot 与文件身份

这是 F01 working snapshot，不是 0.12 candidate，不是 release identity。内存构建两次逐字节一致：

| 字段 | 值 |
| --- | --- |
| artifact text bytes | `1,183,162` |
| working snapshot SHA-256 | `7969ecd957f9bb2d77951e5a8b2c59a332c90f8f8829c9eac4ee46449b20c6e3` |
| input files | `44` |
| product JavaScript | `14` |
| fileDigest | `sha256:a7d689f5df9f12b54c8a5c10871bc504f54fa9ec6246c47dcc7e18692eb3a9ce` |
| productDigest | `sha256:9f2b8d3ab881aaf541445615a928d8896c4a3b0bd7d73042b2958a0fc078ab7e` |

实际产品/测试文件：

| 文件 | bytes | SHA-256 |
| --- | ---: | --- |
| `lib/install.js` | 142,252 | `29ccbd73d7163b50decc9c95696076642e82d8201e27100874b42846795dddbb` |
| `lib/managed.js` | 35,297 | `f67fee81abbe91b85d2652bb0e4b99a67f0c9285b6895649104128963b90e27d` |
| `test/hl12-f01-install-ownership.test.js` | 16,428 | `d2018140627d11f7f686c74083de917368454c66887260fb7c07c90c8d25b3a3` |

本报告本身是第四个实际新增文件：`docs/harness/reports/HL12-F01-writer-report.md`；其最终 bytes/SHA 应由主管在 writer 停笔后直接实算。

retained artifacts 只读复算仍为：

- 0.10：`d73f4b4f83e6034e33168995c24ca4514d69bcd70ccc19f8aa255da42d218daa`；
- 0.11：`8e14e641b7d0fe3641a5e74c49b11a60761e0dc63fb75866ff8226e6b3687ae5`。

没有写 retained artifact，也没有把 working snapshot 保存为 candidate。

## 五、事实、UNKNOWN 与范围边界

### 已证明事实

- CEX-01、CEX-06 通过各自正式 CLI/API 路径转绿，两个正常正例未受伤。
- source 与 disposable installed runtime 都实际经过 identity、upgrade、uninstall；不是只测字符串 helper。
- official 0.9 使用仓内固定 snapshot fixture；0.10/0.11 使用 retained artifact 原 bytes 物化到 disposable source；artifact 本身未改。
- managed 与 project profile、native uninstall 原回归、install fault rollback 和 current identity 原回归都继续通过。
- 没有修改 `bin/**`、`hooks/**`、guidance、work-unit、capability、public Hook wiring、package/version、candidate、lifecycle 或 delegation。

### 尚未完成 / 不属于 F01

- CEX-02 external runtime trust anchor 和 dispatcher identity degradation 属于 F02，仍是 known-red。
- CEX-03/CEX-04 work-unit membership 与 multi-runnable package 属于 F03，仍是 known-red。
- CEX-05 current capability freshness 属于 F04，仍是 known-red。
- public joined CLI/Hook/instruction integration 属于 F06；0.12 版本与唯一 candidate、materialized full matrix、真实模型 A/B 属于 F07。
- 当前 source 版本仍是 `0.11.0`；本报告不声称 0.12 candidate、真实安装、push、tag、release 或 deploy。

## 六、清理与宿主边界

所有 F01 写入 probe 使用 `/tmp/hl12-f01-*` disposable root；boundary subprocess 使用 root 内 synthetic HOME，direct test worker 也把 `CODEX_HOME` 绑定到 `/tmp/hl12-f01-process-home-*` 并在 suite 结束精确删除。每个 case 的 teardown 先核对 root 是非 symlink directory，再只删除该精确 root并断言不存在。

最终 `find /tmp -maxdepth 1 -type d -name 'hl12-f01-*' -print` 无输出。没有将 `/home/synadmin/.codex` 作为 target，没有读取或改写其中的用户文件；产品 boundary 为 canonical/inode 判断只需要目录 metadata。

没有真实 install、push、tag、release、deploy；没有杀死、重启或干扰 Poracode、watchdog、bridge。

## 七、交给主管的直接验收点

主管不应只采用本报告或绿测数量，建议直接：

1. 用 synthetic HOME 重放 exact/alias/descendant，并在 `fs.readFileSync` observer 下核对 target pre-read HOLD；
2. 自建 fresh exact-but-unowned、modified、broken、duplicate marker，比较调用前后完整 bytes；
3. 物化 retained 0.9/0.10/0.11，逐条 upgrade/uninstall，检查 instruction、rollback 和 unrelated bytes；
4. 在 uninstall instruction/Hook/registry/rollback-tomb/commit 点注入 fault，核对完整 snapshot 恢复；
5. 读回 manifest/rollback receipt 的路径、digest 和 canonical target 绑定，并确认未声明 carrier 不会被模糊删除；
6. 重跑原 suite与 F00，确认当前只剩 F02–F04 的四个 known-red。

writer 结论：`reported_complete`。只有主管直接验收后才能把 HL12F01 标为 `accepted` 并开始后续 unit。
