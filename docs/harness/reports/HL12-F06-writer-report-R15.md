# HL12-F06 writer report R15

status: reported_complete

修复混合场景 pressured header 的 active 计数：不再使用 aggregate `activeCount`，改用真实 `active.length` 或 `runningCount`；runnable 与 acceptedOnlyUnlock 保持原值。这样 2 active + 6 runnable 显示 active=2、runnable=6，4 场景同理。

验证：`node --check lib/hook.js` 通过；`npm test` 176 tests，175 pass，0 fail，1 existing scope skip。未真实安装、发布或触碰宿主。

当前 `lib/hook.js` SHA-256：`f5529f912cc51465da8d77f3af70cb473cbbb7ee715ae1c7284d0aa20bb23206`。
