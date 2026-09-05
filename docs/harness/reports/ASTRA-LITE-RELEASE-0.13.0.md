# Harness Lite 0.13.0

This is a GitHub source release for the independently accepted 0.13.0 candidate. It does not rename the package: the package remains `harness-lite`.

## Changes

- Focus the supervisor instruction and new recovery workflow on GPT-6 Astra, without requiring GPT-5.6/Terra/Sol as supervisor or recovery dependencies.
- Generate guidance from real reported work units and dependencies; do not invent downstream work or pause unrelated authorized work.
- Keep recovery bounded to the current problem, distinguish semantic failures from provider/transport faults, and preserve legacy recovery records as read-only history.
- Consolidate diagnosis and behavior-focused testing methods into the existing lightweight skills. GitHub CI/comment workflows, writing cleanup, and Sentry remain external and on demand.
- Separate the current 0.13/Astra test gate from retained historical contracts, while preserving explicit 0.12 upgrade and rollback coverage.

## Verification

- Current gate: `npm test` — 178/178 PASS.
- Independent review: accepted implementation and bounded behavior evidence.
- Astra decision scenarios: 8/8 PASS (`ASTRA-LITE-ASTRA-EXECUTION-FINAL3.json`).
- Grok decision scenarios: 8/8 PASS (`ASTRA-LITE-GROK-EXECUTION-FINAL3.json`).
- Astra isolated file tasks: previous/candidate instructions each passed 3/3, total 6/6 (`ASTRA-LITE-ASTRA-TASKS-FINAL2.json`).
- Model evaluation used `repeats=1`: this is bounded fixture PASS / no observed regression, not a statistical stability claim.
- Historical contracts remain separately runnable; their old-version differences are not the current release gate.

The accepted source is bound by:

- File digest: `sha256:3d53f8247271e84d68e52dfb052639f17a60c76cb29463b69213cf991392083c`.
- Product digest: `sha256:312fcc206dd396dea431493e42828b71b9041b247ba6c515a40cbed09e1970f8`.
- Accepted working-copy candidate digest: `sha256:21fe1b72125d0c4c869c31d652f60eafa7f24f45313c7b541cf7fbce3c3b6cc4`, recorded before the release commit on base `1124b1eeac83991fe72d7e08be79e466bc2b46d9`.

The candidate envelope includes Git HEAD, so committing identical source changes its candidate digest through provenance only. The file and product digests above identify the reviewed source bytes; final release checks must preserve both. Historical execution reports are retained unchanged.

## Scope

The user explicitly authorized this release and push after independent acceptance. This release publishes source and a version tag on GitHub only. It does not publish to npm, install into a user project or global Codex root, or deploy a running system. The provider smoke proves read-only reachability only; full installed runtime, Hook, real delegation, recovery, and production outcomes remain outside the model-evaluation evidence.

License: Apache-2.0.
