# HL12-F07 writer report R13

status: reported_complete

本轮只修行为评测口径与证据，不改 guidance、Hook 或任何产品管制；未真实安装到全局、push、tag、release、deploy，也未触碰宿主进程。

## 改动

- `test/hl12-f07-behavior-evaluator.js`：保留模型自报 rubric 作为对照，新增 `fixedScore-v1`，从 action/reason、asksUser、complete 与固定场景合同独立判定 ordinary 直接推进、unknown-route 最短取证、single-focus、parallel package、accepted-only hold、局部故障边界、缺失产品结果及 hard-risk gate。旧版不支持的 intent 仍映射到明确 closest supported event，push 两版使用同一固定 gate 文本。
- `test/hl12-f07-behavior-scorer.js`：独立可重放 scorer；读取已有 96 样本、重算 fixedRubric/matrix/paired scores/status，写回完整 behavior artifact，并记录自身 SHA。这样 artifact 不依赖手工补字段。
- `test/hl12-f07-behavior-scorer.test.js`：合成正/反例合同，覆盖 ordinary direct、hard-risk hold、accepted-only hold、single-focus 动作形状。
- `test/hl12-f07-candidate.test.js`：校验新的候选文件数与 behavior candidate identity。

## 评测重算结果

使用同一批真实样本重算（未把模型枚举字段当作唯一证据）：96 successful samples、13 transport retries，32 cells。fixed scorer 结果仍为 `FAIL`，原因是若干 Sol 样本的 accepted-only 必要提问/局部边界或 single-focus 不稳定；hard-risk 四格均通过固定合同。FAIL 是诚实结论，不是删样本或放宽门槛。

## 候选与测试

- 唯一 0.12 candidate：`harness-lite-0.12.0-26f0841629f66f242a468037b618c69d1183b2427855fa043e6b42349b0f0f21.json`
- candidate SHA-256：`sha256:26f0841629f66f242a468037b618c69d1183b2427855fa043e6b42349b0f0f21`
- 1,427,470 bytes；54 files / 14 product JS
- fileDigest：`sha256:3869fb9d307828d66e186b80457333c53511d0785e7fed0c7a1cc44a5a739af3`
- productDigest：`sha256:6d290c19ff4ca07158b19c79eb44014632fc3c1398635700ab53393650ec37d4`
- 双 build 逐字节一致，behavior artifact 的 candidate identity、evaluator/scorer SHA 均已绑定。
- `node --check`：全部新增/修改 JS 通过。
- F07 定向（candidate + scorer contracts）：6/6 pass。
- `npm test`：183 tests，182 pass，0 fail，1 个既有 scope skip。

## 边界

本轮没有重新调用模型；fixed scorer 对现有 96 个真实响应做可重放重评分。若主管要求改变场景合同或补采样，应另开评测轮次；不得以关键词计数或模型自报标签直接宣称 PASS。
