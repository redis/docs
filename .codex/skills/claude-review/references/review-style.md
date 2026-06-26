# Claude Review Style

Use a code-review stance. Prioritize bugs, behavioral regressions, docs inaccuracies, missing tests, and maintainability risks. Findings come first.

## Output Shape

If there are findings:

```markdown
Findings

- [severity] `path:line` Short title. Explain the concrete problem, impact, and why the current change introduces or preserves it.

Open Questions

- Only include questions that affect whether a finding is valid or how it should be fixed.

Notes

- Briefly mention tests not run, review limits, or residual risk.
```

If there are no findings:

```markdown
No findings.

Notes: Mention tests not run, files not reviewed, or residual risk.
```

## Severity

- `blocker`: very likely to break builds, publishing, production behavior, or core examples.
- `major`: real correctness, data, security, or user-facing docs issue that should be fixed before merge.
- `minor`: localized bug, confusing docs, missing edge-case handling, or test gap with limited blast radius.
- `nit`: small clarity or maintainability issue; use sparingly.

## Review Discipline

- Do not include praise-padding.
- Do not speculate. If the evidence is incomplete, say what would need to be checked.
- Do not bury findings under a summary.
- Prefer one precise finding over several variants of the same root cause.
- Cite current file paths and lines whenever possible.
- Use exact commands or tests only when they help the author reproduce or verify the issue.
- Keep the final summary short and secondary.

## No-Findings Discipline

When no issues are found, say so plainly. Still mention any meaningful review limits, such as tests not run, unavailable PR context, or areas that were outside the supplied diff.
