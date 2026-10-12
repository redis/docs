# Generated from skills.md; edit the page, then run examples.py --refresh-downloads.
set -euo pipefail

mkdir -p refund-support-reply/references
cat > refund-support-reply/SKILL.md <<'SKILL'
---
name: refund-support-reply
description: Draft a customer reply for an existing refund using a reported refund stage or a report that no refund is listed. Use the matching reply template. Do not use to request a new refund.
---

# Draft a refund support reply

1. Check whether the customer supplied a displayed refund stage or said no refund is listed. If neither is known, ask what their order history shows before drafting a reply.
2. Read references/reply-template.md for the listed and missing refund templates.
3. If a stage is supplied, choose the listed refund template and replace <displayed-stage> with that exact stage.
4. If no refund is listed, choose the missing refund template. Do not invent a stage.
5. Return only the completed customer reply. Do not leave placeholders in it.

Do not claim to have accessed the order system, claim a refund was issued, or promise a bank posting date.
SKILL
cat > refund-support-reply/references/reply-template.md <<'TEMPLATE'
Refund listed: Your order history shows "<displayed-stage>". Support can help if you need more information about that stage.

Refund missing: Contact support with your order number and explain that no refund appears in your order history.
TEMPLATE
zip -r refund-support-reply.zip refund-support-reply
