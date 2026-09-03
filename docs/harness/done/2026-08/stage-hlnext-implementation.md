# HLNEXT — Harness Lite 下一版本候选

状态：`COMPLETE / NV00-NV06 ACCEPTED / INDEPENDENT REVIEW PASS / CANDIDATE sha256:bf33bfdce121e19a22fb7c236918301607f39c635f54dab3fe9814dc70746828 / NOT PUSHED / NOT RELEASED`

目标：完成 `NEXT-VERSION-DISPATCH-PLAN.md` 冻结的 R01-R18，经 NV00-NV06 直接验收形成下一版本候选。

## 顺序

- [x] NV00 可验证源码基线
- [x] NV01 最小上下文与委派账（首候选 FAIL；R2 后 supervisor accepted）
- [x] NV02 当前工具面与指导文本（supervisor accepted）
- [x] NV03 依赖感知并行与五分钟监督（R4 supervisor accepted）
- [x] NV04 有效失败与模型恢复链（R4 supervisor accepted）
- [x] NV05 集成、安装与候选验收（R1 supervisor accepted）
- [x] NV06 独立产品验收（independent reviewer PASS / supervisor accepted）

相关权威设计：

- `NEXT-VERSION-DISPATCH-PLAN.md` R01-R18、代码改动图、work-unit 图和整体验收矩阵

相关现有实现：

- `bin/hl.js`、`lib/tree.js`、`lib/hook.js`、`lib/work.js`、`lib/install.js`
- `lib/managed.js`、`lib/evidence.js`、`lib/limits.js` 与现有 skills/hooks 文档

必须保持的架构边界：

- 指导模型直接使用宿主 agent 工具；Harness 不接 provider、不 spawn/poll/interrupt agent。
- 唯一 current leaf 不被 work units 取代；用户指令高于内部状态。
- 不保存 credential、完整 prompt/transcript 或静态逐模型目录。
- 不弱化安装身份、升级/回滚、证据或 push gate。

不许动：

- push、release、deploy、tag 或伪造 Git provenance
- `PREVIOUS_06/07/08_*` 历史迁移常量的正文
- Poracode.exe、watchdog、bridge 及其相关宿主进程
