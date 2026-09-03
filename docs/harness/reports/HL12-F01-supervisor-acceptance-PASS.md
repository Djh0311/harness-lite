# Harness Lite 0.12 HL12F01 supervisor acceptance

日期：2026-09-02  
work unit：`HL12F01 — install boundary ownership uninstall`  
结论：`PASS / ACCEPTED（仅限 F01 分面）`

## 主管结论

主管直接对照 retained 0.11 字节检查产品差异，并独立重跑正式 CLI/API、迁移、卸载、歧义和回滚路径。F01 已让 CEX-01 与 CEX-06 从红转绿，配对正常场景未被误伤，实际产品写面仅为 `lib/install.js` 与 `lib/managed.js`。

本结论不表示 0.12 产品完成。CEX-02～CEX-05 仍为 known-red；runtime 外部可信锚点属于 F02，公共 CLI/Hook 的最终共用边界接线属于 F06，必须在各自 unit 直接证明。

## 独立执行证据

- `node --check`：两个产品文件与 F01 test 均通过。
- F01 专测：`6/6` PASS，无 skip。
- F00 中 CEX-01、CEX-06 的坏路径和正常正例：`4/4` PASS。
- 相关旧回归：`23/23` PASS，无 skip。
- 排除仍故意保留四个红例的 F00 文件后，当前 source suite：`130` tests / `129` pass / `0` fail / `1` 既有 lifecycle scope skip。
- 连续两次 working snapshot 构建逐字节一致：`44` files / `14` product JavaScript，product digest `sha256:9f2b8d3ab881aaf541445615a928d8896c4a3b0bd7d73042b2958a0fc078ab7e`。
- retained 0.10/0.11 SHA-256 仍分别为 `d73f4b4f...` 与 `8e14e641...`。
- 所有 supervisor/writer probe 完成后，`/tmp/hl12-f01-*` 与 `/tmp/hl12-supervisor-f01-*` 均无残留。

## 直接行为读回

- synthetic global Codex root、symlink alias 和 alias descendant 在正式 install/inspect/verify/health/uninstall 路径中于目标内容读取前 `HOLD`；普通同名 `.codex` 非 Git 项目仍可安装和卸载。
- fresh、0.9、0.10、0.11 四条路径 upgrade/uninstall 后，Harness instruction、stable runtime 和登记 rollback carrier 退场，用户 instruction 与无关二进制 bytes 不变。
- modified、broken、duplicate 和无 runtime ownership 的 marker 场景保持零写 `HOLD`。
- uninstall 的 instruction、Hook、commit、rollback-tomb fault 均恢复完整 preimage。
- 主管另测安装后用户在 owned segment 外追加文字：uninstall 只移除 Harness segment，并保留新增用户文字。

## 后续不得误读的边界

主管额外 canary 证明当前 F01 中的 `instructionOwnership` 仍位于 runtime 内 `ownership.json`，且会记录原 instruction bytes；这只能作为 F01 的事务载体，不能自行证明可信，也不能冒充 0.12 最终的 runtime 外安装锚点。F02 必须建立 runtime 自证边界外的可信来源并处理 ownership/manifest 绑定；F07 还必须核对最终产品没有违反“不持久化完整用户 prompt 或代码”的合同。

主管还直接观察到当前 `hl status --target <synthetic-global-root>` 会在 `health()` 边界前由 work/status 读取目标 lifecycle 文件。它不改写 `AGENTS.md`，不推翻 F01 对安装分面的验收；但“所有接受 target/root 的 CLI 共用 pre-read helper”仍未完成，F06 公共 CLI 接线必须修复并加入 read-observer 反例。

主管决定：`HL12F01 accepted`。这只解锁后续依赖，不提前接受 F02/F06/F07 的结果。
