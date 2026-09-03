# HLNEXT-IMPLEMENTATION — 唯一 current leaf

阶段：stage-hlnext-implementation

状态：`COMPLETE / NV00-NV06 ACCEPTED / INDEPENDENT REVIEW PASS / CANDIDATE sha256:bf33bfdce121e19a22fb7c236918301607f39c635f54dab3fe9814dc70746828 / NOT PUSHED / NOT RELEASED`

目标：在一个 leaf 内按 NV00→(NV01,NV02)→NV03→NV04→NV05→NV06 的硬依赖完成下一版本候选、主管验收和独立 reviewer PASS。

来源收据：2026-08-31 当前用户明确要求完成 `NEXT-VERSION-DISPATCH-PLAN.md` 工作。

产品：Harness Lite 下一版本候选

证据：NV00-NV04 均经 supervisor 直接验收 accepted；NV05 v1 因 0.9.1 mutable manifest 自证而 FAIL，R1 已通过仓外真实 17-file old→current 升级、coherent tamper/extra-path HOLD 零写、85/85 tests、selfcheck、语法和双 candidate 主管验收。NV06 由未参与实现的 gpt-5.4/xhigh reviewer 独立核验 R01-R18、85/85、自检、语法、双 candidate 和额外反例探针 PASS，supervisor closeout accepted。

载体：snapshot working copy；当前无 Git provenance；candidate-only / not pushed / not released

允许动：

- `NEXT-VERSION-DISPATCH-PLAN.md` 代码改动图所列下一版本产品、测试、脚本和文档面
- `docs/harness/**` 当前生命周期、验收报告与状态投影

不许动：

- push、release、deploy、tag 或伪造 Git provenance
- provider credential、完整 prompt/transcript、静态逐模型目录、daemon 或 UI scraping
- 杀死、重启或干扰 Poracode.exe、watchdog、bridge 及相关宿主进程
