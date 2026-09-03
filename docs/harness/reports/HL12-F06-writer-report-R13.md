# HL12-F06 writer report R13

status: reported_complete
date: 2026-09-02

本轮按 supervisor R12 只做最小修复：

- 正式多-runnable Hook 保留 `ParallelWorkUnits` header（state/status/active/runnable/acceptedOnlyUnlock），并保留 aggregate carrier 的 ids/count/ref/readApi/digest/三 sentinel/conflicts。
- pressured essential wire 加入 Capabilities/CapabilityCarrier；已知动态 manifest 时标 required，未知 manifest 仍输出可降级 UNKNOWN/incomplete，不静默冒充当前工具面。
- 保持 required carrier 不经 `fitLine`/final slice、`complete=false` 显式优先、1800 字符边界和无 silent ellipsis。

未修改 dispatcher、guidance/tree/work/delegation；未真实安装、全局改写、发布或干扰宿主。

验证：

- `node --check lib/*.js bin/*.js hooks/*.js`：通过。
- F00-F06 matrix：52 tests，52 pass，0 fail。
- `npm test`：176 tests，175 pass，0 fail，1 existing scope skip。
- F06 定向：9 pass。

当前 `lib/hook.js` SHA-256：`f2cf6f5e24d73ddd2635aedae3d044a9d519aa8123d7db277c11d618af7156d2`。
