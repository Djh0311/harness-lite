# Harness Lite 0.14.0

This is a GitHub source release for the 0.14.0 candidate accepted on 2026-10-22. The package name stays `harness-lite`.

## Changes

- **Claude Code support.**
  - A project install merges the four Harness hooks (SessionStart, UserPromptSubmit, PreToolUse on `Bash`, Stop) into `.claude/settings.json`, next to the user's own settings and hooks.
  - Uninstall restores the original bytes.
  - Claude's per-prompt `prompt_id` is used as the turn.
- **Cursor hooks are no longer installed by default.** The adapter code remains, but it has not been verified on a real Cursor host.
- **Starting work in a fresh project.**
  - The per-turn WorkIntent line and the refusal hints tell the model how to create the stage and leaf and register its work.
  - `hooks/README.md` gains a "before starting" section.
  - Users still run no Harness commands.
- **Stage close-out test upkeep.**
  - When the last leaf of a stage exits, the `--work-intent` result carries a `nextAction`.
  - It first names the test files changed in the current turn and asks for one sentence on why they changed. Attribution is by content, so the user's earlier edits that were only staged or committed are not counted.
  - It then asks the model to read the stage's related tests and merge duplicates (keeping boundary cases), delete tests that only cover removed features, update stale assertions, and leave unrelated tests alone.
  - No new commands, required fields, events or interception.
- **Resident instruction.**
  - One sentence was added: AGENTS.md and CLAUDE.md belong to the user and change only on the user's request; durable decisions go to the Harness plan or stage.
  - The released 0.13 text is kept for verifying, upgrading and uninstalling 0.13 installs.
- **Truthful receipts and status.**
  - A verify run with no checks shows "not run".
  - A failed verify receipt is not shown as not run.
  - Status text cannot be forged through stored fields.
- **Pushes.**
  - A stale pending push no longer blocks unrelated work.
  - An inexact push command gets a hint to use the exact form instead of a confirmation request that could not authorize it.
- **Node launcher.**
  - Changing the Node version no longer reports drift; a rewritten launcher is still reported.
  - Escaped or shell-active launcher paths are rejected.
- **Install, upgrade and uninstall.**
  - User configuration is kept, and no empty directories are left behind.
  - Hooks installed under one Node binary are recognized under another.

## Verification

- **Current gate**: `npm test` passes 268/268 on Node 24 and Node 22. The materialized candidate passes the same gate on both.
- **Cross-version checks**:
  - cross-Node install, verify and uninstall: 12/12;
  - upgrading and directly uninstalling a published 0.13.0 install (project and managed profiles, both Node directions): 8/8.
- **Real hosts**: Codex (gpt-6-astra) and Claude Code (claude-opus-5-5) each completed a scripted natural-language session without any "continue" prompt: plan, register, implement, test, exit.
- **Test upkeep on real Codex sessions**, judged against criteria fixed before the runs:
  - stage close-out tidy: 2/2 (earlier variants: 0/7);
  - unrelated small task: 4/4 with no collateral test edits;
  - broken product: 2/2 without weakening tests;
  - the reason sentence after a requirement change: 1/1 with the final wording.
- **Measured and reverted**: test-upkeep wording in the resident instruction, and a required exit field. Neither changed real-model behavior.
- **Independent review**: Grok 4.7 high, 28 calls. Every confirmed defect was fixed with a regression test.
- **Not covered**:
  - Stop continuation was never triggered on a real host.
  - The effect of the AGENTS.md sentence was not reproduced in a test scenario.
  - Test upkeep was exercised on Codex only.
  - Cursor and agy are not supported.

The accepted source is bound by:

- File digest: `sha256:bf45bf92f122ae7fbaec4e519aafada838aaedbf211d436a08d72b723a5bc523`.
- Product digest: `sha256:740a524691ede9ea796b9b1404c9f04b1506791b602a79175d911db60a7baf20`.
- Accepted working-copy candidate digest: `sha256:ebbe956c386400489f88558197f4e60e8ed4f7dff0c1b702ef71a4d32dcb3748`, recorded before the release commit on base `aac6bd5fe721aa126cf6d9203e5d96d2db540913`.

The candidate envelope includes Git HEAD, so committing identical source changes its candidate digest through provenance only. The file and product digests above identify the reviewed source bytes; the release checks preserve both. The detailed record is `HL014-RELEASE-READINESS-20261022.md`.

## Scope

The user explicitly authorized this release on 2026-10-22. It publishes source and a version tag on GitHub only. It does not publish to npm, install into any user project or global Codex root, or deploy a running system.

License: Apache-2.0.
