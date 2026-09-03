# HLNEXT NV02 supervisor acceptance

结论：`PASS / ACCEPTED / DYNAMIC MANIFEST ONLY / NOT PUSHED / NOT RELEASED`

## 直接结果

- `normalizeManifest()` 只消费显式 schema 的结构化 manifest，输出临时 channel/model/reasoning/family/status projection；缺失、空或非法输入为 UNKNOWN。
- model 名不推断 family/availability；未知 family 为 `unclassified`，availability、capability 与 suitability 分离。
- 稳定 family hint 只有 Grok engineering、Gemini frontend、Terra/Sol xhigh problem recovery；它们不是可用模型目录。
- 当前 `INSTRUCTION` 明确 Harness 不调度 agent，指导模型直接使用本轮宿主工具；用户权威、最小上下文、澄清边界与旧系统只读诊断边界已写入。
- 输入旧 0.9.1 current instruction 以精确 `PREVIOUS_09_INSTRUCTION` 保留并可迁移；未知编辑继续 HOLD。

## 历史与回归

- `PREVIOUS_06/07/08_*` 与 `OFFICIAL_06/07/08` 摘要逐项等于 NV02 输入基线。
- `npm test`：34/34 PASS；`npm run selfcheck`：PASS。
- 双 candidate digest：`sha256:c0230ef5f7c7f64adffa571d1ecfad3bef2287c12afc45bccde54a3027ab4cc0`。
- `productFileCount=13`，`productDigest=sha256:751245e58a447c078423a552ff58fd1bdf9de483245831542b4ba8a1c55510a7`。

本 PASS 与 NV01 accepted 共同解锁 NV03；它不证明 heartbeat/hook/work 集成、恢复链、安装候选或最终产品验收。
