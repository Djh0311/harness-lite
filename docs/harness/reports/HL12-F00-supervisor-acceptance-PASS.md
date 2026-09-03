# Harness Lite 0.12 HL12F00 supervisor acceptance

日期：2026-09-02  
work unit：`HL12F00 — baseline and counterexamples`  
结论：`PASS / ACCEPTED`

## 验收结论

主管没有沿用 writer 的结论，而是直接读回测试和报告、重新计算冻结摘要，并独立重跑决定性测试。HL12F00 已完成其唯一职责：在不修改产品行为的前提下，把 0.11 的六个决定性缺陷固定成可持续重放的红例，同时记录对应正常正例和现有硬风险基线。

这不是 0.12 产品 PASS。六个红例现在仍然失败，后续 owning units 必须逐项修成绿色。

## 独立复算

- 0.12 Decision 区：`6,876` bytes；SHA-256 为 `8de421b32e79cf2e5b880d26ffe2c44c4bcfc067fc0e8e136086668e1e0803b7`，与 declared digest 一致。
- retained 0.11 artifact：SHA-256 `8e14e641b7d0fe3641a5e74c49b11a60761e0dc63fb75866ff8226e6b3687ae5`；`1,096,150` bytes；`42` files / `14` product JavaScript；版本 `0.11.0`。
- retained product digest：`sha256:cd2d34af1f654af2dde947562a6f051ebfb216621d3aac32f2c1941f819abdb9`。
- 当前 source snapshot 连续内存构建两次逐字节一致；新增 F00 测试后为 `43` files，但仍为 `14` 个 product JavaScript，product digest 与 retained 0.11 完全一致。
- 测试文件 SHA-256：`92b355fc74bf495063d51c9a64576647f470c4e61e9c6118f761281b0714503a`。
- writer report SHA-256：`7ae39c35c46f7a57e046d923b9a1a39d22239a0ea7d838b3ed1d2ee2d36284a4`。

## 直接执行结果

- `node --check test/hl12-f00-counterexamples.test.js`：PASS。
- F00 完整反例文件：`13` tests / `7` pass / `6` fail / `0` skip。失败精确为 CEX-01～CEX-06，没有 setup 或额外失败。
- 只跑正常正例和硬风险冻结：`7/7` PASS。
- 排除 F00 文件后的原 0.11 suite：`124` tests / `123` pass / `0` fail / `1` 既有 scope skip。
- 复跑后 `/tmp/hl12-f00-*` 无残留。

六个红例分别直接观察到：全局 Codex 根会被写入、coherent tamper 会自证并写 usage、幽灵 unit 会 accepted 并解锁依赖、多 runnable 正式 Hook 丢失最小包、静态 capability 冒充 current、upgrade uninstall 遗留 owned instruction/rollback carrier。六个配对正常场景全部继续工作。

## 安全与范围

- 所有 install、upgrade、uninstall 和 dispatcher probe 都在 `/tmp/hl12-f00-*` 与 synthetic HOME 内执行。
- hard-risk probe 只调用分类和授权函数；测试文本中的递归删除命令没有被执行。
- 未读取或写入真实 `/home/synadmin/.codex`，未修改 retained artifact，未 install、push、tag、release 或 deploy，也未干扰 Poracode、watchdog 或 bridge。

主管决定：`HL12F00 accepted`。可以按依赖图开始后续 owning unit；本决定不接受任何尚未修复的 0.12 产品行为。
