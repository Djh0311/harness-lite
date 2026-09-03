# HLNEXT NV01 supervisor acceptance

结论：`PASS / ACCEPTED AFTER R2 / NOT PUSHED / NOT RELEASED`

## 实现结果

- `tree.workUnitPackage()` 投影 goal、direct acceptance、allowed/forbidden、facts、entry points、disproven routes、UNKNOWN、route basis、dependencies 与 result contract。
- `delegation.json` 绑定 schema、project、stage 与唯一 current leaf；missing 返回 UNKNOWN，identity/schema/shape/unsafe carrier 返回 stale，均不冒充 live。
- event ID 重放幂等；冲突重放 HOLD；`reported_complete` 不设置 `acceptedAt`，只有 supervisor `accepted` 解锁依赖。
- event schema 拒绝 credential/secret/token/password/prompt/transcript/code 字段，不保存完整调度内容。

## 主管反例与返修

- 首候选 FAIL：无 current leaf 仍写入 `leaf=UNKNOWN` live 账；malformed JSON 被当 missing 并覆盖。
- R1 后同根补充反例发现合法 JSON `null` 抛 TypeError；R2 增加顶层非数组 object 门。
- 最终 fresh 验证 `null`、array、string、number、malformed JSON、directory、symlink、unknown schema、bad shape 全部 stale/UNKNOWN、零写并保留载体。

## fresh checks

- `npm test`：27/27 PASS。
- `npm run selfcheck`：PASS。
- 双 candidate digest：`sha256:54e54e9194e346bfc19c62392617a9e290f577aba53846138f2c080c6d93843b`。
- `productFileCount=12`，`productDigest=sha256:f02ff35004c83094d199cf05700012175f492814e4d5874087272b7c12cd29a9`。

本 PASS 只解锁 NV02，并不证明 hook/work 集成、恢复链、安装候选或最终产品验收。
