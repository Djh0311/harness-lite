# HL12-F06 writer report R14

status: reported_complete
date: 2026-09-02

R13 supervisor 指出的正式 Hook header 丢失已最小修复：

- `hasCarrierLine` 过滤现在保留 `ParallelWorkUnits：` header；普通压力下保留 state/status/complete/active/runnable/acceptedOnlyUnlock，aggregate carrier 继续提供 ids/count/ref/readApi/digest/三 sentinel/conflicts。
- pressuredWire 仅压缩 header 字段长度，必需载荷和 capability carrier 合同不变；package digest、UNKNOWN/incomplete、1800 字符和无静默省略保持。
- 新增 source 直接 helper 与 installed R2 dispatcher 断言，验证多-runnable header + carrier。

验证：

- `node --check lib/*.js bin/*.js hooks/*.js`：通过。
- F00-F06 matrix：52/52 pass。
- F06 定向：9/9 pass。
- `npm test`：176 tests，175 pass，0 fail，1 existing scope skip。

未修改 dispatcher/guidance/tree/work/delegation；未真实安装到全局、未发布、未触碰宿主。

当前 `lib/hook.js` SHA-256：`c2eb53c7d34c9b5106f7a3cc25a1fd835acaa2f11caee05e412ae45575689486`。
