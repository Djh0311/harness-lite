# HL12-F07 writer report R1

status: reported_complete
date: 2026-09-02

## Candidate

F07 candidate is built with `HARNESS_LITE_CANDIDATE_VERSION=0.12.0` without mutating retained 0.11 source. Builder patches the embedded candidate `package.json` row to 0.12.0, so outer metadata and materialized package version agree. Two independent builds are byte-identical.

- artifact: `docs/harness/artifacts/harness-lite-0.12.0-be88eb96e05fbce34ef8a8d99210241032dc5c8ffaab841005c3eeb81e9f37f6.json`
- candidate digest: `sha256:be88eb96e05fbce34ef8a8d99210241032dc5c8ffaab841005c3eeb81e9f37f6`
- bytes: 1,382,402
- files: 51; product JS: 14
- fileDigest: `sha256:af8cf89d970330a962beeb6fa5679736df748b1dca8bf0bc5d717f0cf4200e30`
- productDigest: `sha256:e9aceba57f2ff2ca7f65b62b8ceeb80fd990f413de43af842263f4a41723fb54`

## Behavior evaluation

No real model connector/tool is callable in this execution environment. The eight required scenarios are frozen in `harness-lite-0.12.0-behavior.json` with status `UNKNOWN`; no keyword, simulated, or self-reported model output is treated as PASS, and no cross-family claim is made.

## Verification

- `node --test test/hl12-f07-candidate.test.js`: 2 pass.
- `npm test`: 179 tests, 178 pass, 0 fail, 1 existing scope skip.
- No real install/global write/push/tag/release/deploy; retained 0.10/0.11 untouched.
