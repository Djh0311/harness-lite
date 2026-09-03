# HLNEXT NV05 R1 — Supervisor Acceptance PASS

结论：`PASS / ACCEPTED / NV06 UNLOCKED / CANDIDATE ONLY / NOT PUSHED / NOT RELEASED`

候选：`sha256:bf33bfdce121e19a22fb7c236918301607f39c635f54dab3fe9814dc70746828`

## 主管直接证据

- 使用 `/home/synadmin/workspace/syn/.claude/harness-lite` 的只读真实 0.9.1 carrier 复制 17 个固定 runtime source 文件到隔离临时目录；逐文件 mode/size/SHA-256、package digest `947fb2…9b0b` 和 NV00 的 11-product-JS digest `bee187…1666` 全部匹配。
- 真实旧 runtime 安装后，current `inspect()` 返回 `previous-09-snapshot`；未给 explicit upgrade 时为 `HOLD/written=0` 且目录逐字节不变；显式升级为 `INSTALLED`，current verify 通过并读回 0.10.0、19 runtime paths。
- coherent-tamper 攻击直接修改旧 runtime 自己的 `lib/install.js`，再用篡改后 runtime 同步重算 manifest 的 package、Hook definition 和 instruction digest。结果仍为 `drift`，差异含 `packageDigest`、`size/content:lib/install.js`、`fixed-packageDigest`；upgrade 为 `HOLD/written=0`，拒绝前后全目录 fingerprint 一致。
- exact old files 加 `rogue.js` 并把 extra path 写进 managedPaths、同步重算 package digest，仍因 fixed identity 判 `drift`，upgrade `HOLD/written=0` 且 byte-stable。
- 测试中的原始 0.9.1 fixture 已自包含于 candidate，不依赖 Syn/Trading 现场路径；解包后固定 17 paths、11 product JS 和全部摘要一致。

## 回归与候选

- `npm test`：85 tests / 85 pass / 0 fail。
- `npm run selfcheck`：PASS，并再次实际运行全测；实现 4325、测试 3546、技能 56、内部接口 6。
- 13 个 `bin/**`、`hooks/**`、`lib/**` 产品 JS：`node --check` 全 PASS。
- candidate 连续两次完全一致：31 files、13 product files、file digest `sha256:23714549b1bc3663141a416419a2d94457130f0c977be92c53d718dab5222929`、product digest `sha256:b80c021d3047d9f0199f12f13265acec42af4b07eb168021d49b3dc90713ff24`。
- provenance 如实为 `git.repo=false/head=null`；当前目录不是 Git repo，没有伪造 commit、push 或 release。
- `PREVIOUS_06/07/08_*` 与 `OFFICIAL_06/07/08` 固定摘要保持通过；project/managed install、host evidence exact join、fault rollback、native pre-push disposable probe 和 uninstall 均在本次全测通过。
- 产品面扫描未发现 provider adapter、静态 model catalog、daemon timer/spawn 或 credential store；Poracode/watchdog/bridge 只出现在禁止干扰的指导文本中。

## 残留与边界

- `/tmp` 未发现 `hl-nv05-*`、`hl-supervisor-*`、`harness-lite-global-*`、`hl-native-probe-*` 或 `hl-candidate-*` 残留。
- 未发现本候选 test/build 临时进程。现场已有通用 Codex/Electron/Node listener 未被归因、未被触碰。
- NV05 普通 writer v1 有 1 次有效验收失败，R1 通过，未触发 Terra/Sol 恢复。

本 PASS 只解锁 NV06 独立产品验收；不等于整个 leaf PASS，也不构成 push/release 授权。
