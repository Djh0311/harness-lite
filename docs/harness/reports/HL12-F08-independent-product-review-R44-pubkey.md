# HL12-F08 独立产品复核 R44 公钥登记

日期：2026-09-03T13:53:36+08:00
work unit：HL12F08
reviewerId：hl12-f08-independent-reviewer-982524bd
method：independent-product-review-f08
status：KEY REGISTERED / REVIEW IN PROGRESS / NOT SIGNED

本文件只登记本轮独立 reviewer 的公钥。登记时尚未对最终 candidate、行为证据或测试结果作出 PASS/FAIL 裁决，也尚未签名。

本 reviewer 未参与 0.12 实现，不是用户授权人。私钥保留在 workspace 外 `/tmp/hl12-f08-reviewer-key-giFBOM/private.pem`，未写入产品、candidate、报告或本文件。

## 公钥

```text
reviewerId: hl12-f08-independent-reviewer-982524bd
fingerprint: sha256:982524bd501798859a722cdd69798779a4816851b361defac19c2fed0ee0f202
algorithm: Ed25519
```

```text
-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEASSWNkATJEQbj3YzFpR3ufz//f/dVQr5susrKTOmpkis=
-----END PUBLIC KEY-----
```

本轮只允许写独立复核报告、临时 fixture 和证据输出。不修改产品代码或 candidate，不真实安装，不改真实全局 AGENTS.md，不 push/tag/release/deploy，不获取 0.6–0.8 runtime，不干扰 Poracode、watchdog、bridge。

旧 writer/supervisor/F08 R43 PASS 不是本轮结论。只有本 reviewer 独立核对全部必需项后，才可对绑定 candidate、行为证据和测试证据的 payload 签名。
