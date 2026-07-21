# Redis docs — writing conventions (humans + AI)

Base style: **Google developer documentation style**; fall back to the **Microsoft Writing Style Guide** where Google is silent. Follow these on every docs change. AI tools working in this repo inherit these rules automatically.

## Voice & tone

- Address the reader as **"you."** Use **present tense** and **active voice**.
- Be direct and friendly. **No marketing tone** — avoid "best-in-class," "seamless," "powerful," "simply," "just," "easily."
- **Minimalism:** cut intro fluff, get to the action, say what's needed and stop.

## Structure

- **Sentence-case headings** ("Configure a database," not "Configure A Database").
- **Task/procedure titles start with a verb** ("Create a role," "Enable auditing").
- Follow the reader's **real workflow, in order.** Number sequential steps; **one action per step.**
- Don't stack notes back-to-back. **No directional language** ("above/below/on the left") — link to the thing instead.

## Terminology & accessible language

- Use official **product / feature / UI names** exactly. <!-- TODO: link the canonical product/feature name list once confirmed -->
- Prefer plain, inclusive terms: **replica** (not slave/master), **turn off** (not disable), **end** (not kill), **allowlist/denylist**.
- Spell out an acronym on first use.

## Links

- **Descriptive link text** ("see the [database configuration reference]") — never "click here" or a bare URL.
- Internal links use the relref shortcode: `{{< relref "/operate/rs/..." >}}`.

## Frontmatter (every page)

```yaml
---
title: <full page title>
linkTitle: <short nav title>
description: <one sentence; used in search + nav>
weight: <order within its section>
categories: [docs, operate]   # match the section
---
```

## Coverage-aware authoring — do this FIRST

- Before creating a page, **check whether the topic already exists.** Prefer to **fold into / extend / cross-link** an existing page over making a new one.
- Create a new page only when it's genuinely new — and **never leave it orphaned**: link it from its section index.

## Code & security

- In code and command examples, use **angle-bracket placeholders** — `<your-cluster-name>` — never real values. (This is the one exception to "match the UI exactly.")
- **Never** include real credentials, PII, customer IPs, or SSH keys.

## Before opening a PR

- Run the self-check (`/docs:review-doc` once it exists); at minimum run **Vale**, the **link check**, and a **Hugo build**.
- Confirm frontmatter is complete and the page is linked from its section.
