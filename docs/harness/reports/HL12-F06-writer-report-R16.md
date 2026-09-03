# HL12-F06 writer report R16

status: reported_complete
date: 2026-09-02

本轮只新增混合多-runnable 证据并修正测试合同：

- `lib/hook.js` 无新增修改（R15 计数修复保持）。
- `test/hl12-f06-joined.test.js` 新增可重放 fixture：2 active + 6 runnable，直接调用正式 `hook.sessionStart()`，再通过已安装 dispatcher 重放；两者均断言 `active=2`、`runnable=6`、`acceptedOnlyUnlock=true`、carrier `count=8`。

验证：

- `node --check lib/hook.js`：通过。
- F00-F06 matrix：53 tests，53 pass，0 fail。
- F06 定向：10 pass。
- `npm test`：177 tests，176 pass，0 fail，1 existing scope skip。

未修改 dispatcher、未真实安装到全局、未发布或触碰宿主。

`lib/hook.js` SHA-256：`f5529f912cc51465da8d77f3af70cb473cbbb7ee715ae1c7284d0aa20bb23206`。
