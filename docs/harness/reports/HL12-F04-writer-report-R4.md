# HL12F04 writer report R4

日期：2026-09-02（Asia/Shanghai）

结论：`reported_complete / WRITER REPORT ONLY / AWAITING SUPERVISOR DIRECT ACCEPTANCE`；不表示 accepted。

R4 仅修改 F04 owning 写面：

- `lib/capabilities.js`：显式 `manifest.binding`/`manifest.provenance` 必须为 plain object；carrier projection/schema/models/model rows、完整 binding、digest、source bytes/snapshot 和 freshness 均 fail-closed 严格检查；malformed root/options/manifest/now 不抛异常。
- `test/hl12-f04-capability-freshness.test.js`：补 binding/provenance 非法类型、projection.models 非法类型、null manifest 和恶意输入回归。

验证：F04/R2/FIX03/R3 定向 12/12；全量 `npm test` 158 tests，157 pass、0 fail、1 existing scope skip。

SHA-256：

- `lib/capabilities.js`: `eed4536c3452f11f4226277e13fdb381728ba97eea6eecd96a1b7a7362153965`
- `test/hl12-f04-capability-freshness.test.js`: `cccaaffa26995faf6cb8e1891072b0711e7e280ce30651106fe10ce33a3b9278`
- 本报告：落盘后重新计算。

所有测试使用 synthetic disposable roots 并精确清理；未修改公共 Hook/dispatcher/install、其他产品文件或旧 fixture，未干扰 Poracode/watchdog/bridge。

