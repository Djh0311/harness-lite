# HL12-F07 writer report R14

status: reported_complete

本轮只修行为评测证据层，不改 guidance、Hook 或管制语义；没有真实全局安装、push、tag、release、deploy 或宿主操作。

## 评测证据修正

- `test/hl12-f07-behavior-evaluator.js` 新增 `contractFor()` 与 `independentVerdict()`。每个样本现在落盘固定合同：`inputDigest`、`allowed`、`forbidden`、`mustAsk`、`mustHold`、`mustRemainIncomplete`、`scope` 和独立 `verdict`。模型的 `asksUser/complete` 仅作为 observation 保存，不直接决定 PASS。
- hard-risk、accepted bypass、route bypass、fake complete、否定词误命中均由独立 verdict 层判定；ordinary 允许工具事实明确时直接派发/编辑；multi-event 依据 action 的实际可执行主动作判断 single-focus。
- `test/hl12-f07-behavior-scorer.js` 是唯一重放入口：读取已有 96 个真实样本，重新生成完整 verdict/matrix/scores/status，不靠手工补 JSON；记录 scorer SHA 和生成路径。
- `test/hl12-f07-behavior-scorer.test.js` 增加 5 个 adversarial contract 与正例：hard bypass、accepted bypass、route bypass、fake complete、否定词，以及对应安全路径。

## 结果

使用同一批 96 个真实样本重评分，`successfulSamples=96`、`failures=13`，32 cells；独立 verdict 结论仍为 `FAIL`，原因是部分真实模型响应违反固定合同，未伪造 PASS，也未删样本或加 skip。

## 候选与测试

- 唯一候选：`harness-lite-0.12.0-c1caf0ee317ff5a7f901547aa938d287753dd9f9a1a06501c6a4e6395c64099f.json`
- SHA-256：`sha256:c1caf0ee317ff5a7f901547aa938d287753dd9f9a1a06501c6a4e6395c64099f`
- 1,434,642 bytes；54 files / 14 product JS
- fileDigest：`sha256:3bebc22a6c69238c972b39b2b1958c272ce217e9a6bdcf9571d2694e747b151e`
- productDigest：`sha256:6d290c19ff4ca07158b19c79eb44014632fc3c1398635700ab53393650ec37d4`
- evaluator SHA-256：`dedfbe5b84b5ef0638a735b276c66ae08cb27bec7b26b7c30897d0b97e8c84c2`
- scorer SHA-256：`727ae0595a305b2b8d215aa363ece454c8456591ddd8e44b605f636bad4c5979`
- 双 build 逐字节一致，behavior artifact candidate identity 与 scorer/evaluator SHA 已绑定。
- F07 + scorer 定向：7/7 pass。
- `npm test`：184 tests，183 pass，0 fail，1 个既有 scope skip。
