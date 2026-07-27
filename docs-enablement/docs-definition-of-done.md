# Definition of Done: Docs

"Docs are part of the definition of done" — here's what that concretely means, scaled to the size of the change so it's realistic.

A change is **docs-done** when the matching row is satisfied:

| Change type | What's required |
|---|---|
| No user-facing impact (refactor, internal, tests, CI) | Assert **"no docs needed"** on the PR. |
| New **product or major feature area** | A net-new docs section — **coordinate with the docs team on structure and placement first**, then contribute pages from the templates. |
| New or changed user-facing **feature, behavior, setting, or default** | A **docs PR** — a task or concept page from the template, meeting the contribution bar, **tested (steps/commands actually run)**. |
| New or changed **API, CRD, or config field** | The relevant **reference updated** (often auto-generated — coordinate with docs). |
| **Deprecation or removal** | A **release-note entry** + affected pages updated. |

## How it's enforced (engineering-owned, not docs-policed)
- **PR template** docs checklist — self-attested by the author.
- **Eng lead** confirms at PR review / sprint close.
- **Docs team provides** the templates, style, tooling, and final review — *not* enforcement. (If docs chases every PR, the bottleneck just moves.)

## The bar for a docs PR
See [CONTRIBUTING.md](../CONTRIBUTING.md) — template used, placed coverage-aware, builds clean, technically accurate.

## Division of labor
**Author** owns technical accuracy + a solid first draft. **Docs team** owns voice, structure, and placement.

## A note on enforcement
The exact enforcement mechanism (a self-attested PR checkbox versus a required merge gate) is still being finalized with engineering leadership. For now, treat the table above as the working definition — and if a row doesn't match how your team actually ships, flag it in **#docs** so we can adjust it.
