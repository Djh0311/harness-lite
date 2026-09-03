# Harness Lite 0.10.0 R4 cleanup erratum repair stage

状态：`CURRENT / R4C00-R4C02 ACCEPTED / R4C03 SUPERVISOR CLOSEOUT / CANDIDATE FROZEN / NOT PUSHED / NOT RELEASED`

目标：精确清理 R4F05 验收遗留的五个已授权 disposable 目录，纠正零残留错误结论，并证明原 retained candidate 完全未变。

- [x] R4C00 baseline frozen and supervisor accepted
- [x] R4C01 exact cleanup writer supervisor accepted
- [x] R4C02 independent cleanup verification supervisor accepted
- [ ] R4C03 additive erratum authority and physical archive in progress

顺序：`R4C00 → R4C01 → R4C02 → R4C03`。writer `COMPLETE` 只登记 `reported_complete`；只有主管 `accepted` 解锁下游。

相关权威设计：

- 2026-09-01 用户明确授权的 Harness Lite 0.10.0 R4 cleanup erratum repair Kickoff
- 原 R4 产品和 candidate acceptance 保持冻结；本轮只修 closeout residue claim

相关现有实现：

- retained artifact `docs/harness/artifacts/harness-lite-0.10.0-d73f4b4f83e6034e33168995c24ca4514d69bcd70ccc19f8aa255da42d218daa.json`
- `lib/tree.js` lifecycle 与 `lib/delegation.js` 轻量记账接口
- candidate 外 `docs/harness/**` 治理载体

必须保持的架构边界：

- 不修改任何 candidate input、retained artifact、R4 archived stage/leaf/ledger 或历史报告。
- 只允许删除 Kickoff 列出的五个字面量 `/tmp` 目录；未知路径一律 HOLD。
- Harness 不调用 agent；指导模型直接使用真实 collaboration 工具并以 300000ms 心跳监督。
- inherited cleanup failure 只属于 closeout acceptance，不属于产品或 candidate；普通计数不足五次，不触发 Terra/Sol。

不许动：

- retained artifact、LICENSE、package.json、NEXT、bin、hooks、lib、scripts、skills、test
- 原 R4 archived stage、leaf、delegation ledger 和历史报告
- 允许列表之外的任何路径
- push、tag、release、deploy、Git provenance、external memory
- Poracode、watchdog、bridge 及相关宿主进程
