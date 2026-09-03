# HLNEXT-REPAIR R3F01 R2 supervisor acceptance

日期：2026-09-01（Asia/Shanghai）

结论：`PASS / R3F01 SUPERVISOR ACCEPTED`

## Concrete candidate direct acceptance

主管在 writer R2 COMPLETE 登记 reported_complete 后，重新构建 candidate artifact、按 `contentBase64/mode` 物化全新 source 并 fresh install 到新项目；项目同时存在三模型 file manifest，Hook-input 使用用户指定的五个精确模型。

- candidate：`sha256:af1024e1a7469ac67c828e1e169b1272c6efc9248808f1467a38ce003adbde70`
- files=38；product JS=13
- fileDigest=`sha256:e76958d3a5f5bde2a13c93145710436f754f97c12b0e33ad08bf5be90ab1b435`
- productDigest=`sha256:73f9ac6f54d863a5093144e165c17825ac9ba3560309d4382ecd3e8393ebda3e`

SessionStart/UserPromptSubmit 的五模型 additionalContext 分别为 1613/1669 chars，均：

- 不含 `shown=0/5` 或 `embedded-projection:embedded`；
- 明确 `carrierBacked=5/5`、`complete=true`、project-relative carrier path、source=hook-input、TTL；
- dispatcher 退出后由另一个 Node 进程按相对路径读回五个模型的 channel/model/reasoning/family/status；Terra/Sol 均存在，项目三模型 manifest 未覆盖 Hook-input；
- source/projection digest、eventName、createdAt/expiresAt/ttlMs 可验证，projection digest 与读回 payload 一致。

SessionStart/UserPromptSubmit 的 24 模型 additionalContext 分别为 1629/1685 chars，均：

- 不含 `shown=0/24` 或 embedded carrier；明确 `carrierBacked=24/24`；
- dispatcher 退出后新进程读回全部 24 行，动态 channel/model/reasoning/family/status 完整；
- source/projection digest 与 freshness 绑定通过。

超过 64 KiB 的 Hook-input 直接返回 UNKNOWN、`incomplete=hook-input-manifest-too-large`、complete=false、无可读 carrier；unsafe symlink carrier dir 也 fail closed。

## 回归

- `node --test test/r3-capability-carrier.test.js`：4/4 PASS。
- `npm test`：109/109 PASS。
- `node --check`：`lib/capabilities.js`、`lib/hook.js`、R3 test 全部 PASS。
- 产品代码中已无 `shown=0/5`、`shown=0/24` 或 `CapabilityModelsInline` 输出点；仅测试保留禁止断言。
- 一次主管独立 reader 探针最初误把 absolute path 传给只接受 project-relative path 的安全检查而被拒；修正输入后通过。该探针参数错误不是产品/direct-acceptance 失败，不进入 recovery ledger。

## Recovery disposition

R3F01 R1 concrete candidate 的 `shown=0/5` 已作为该稳定 problem 第二次 ordinary-family 有效失败登记。R2 修复完成本次直接验收后，登记 acceptance_pass，只关闭 `hook-input-dynamic-model-carrier-readable` 问题租约；未触发 Terra/Sol。

未 push/tag/release/deploy，未更新 external memory，未干扰 Poracode/watchdog/bridge。
