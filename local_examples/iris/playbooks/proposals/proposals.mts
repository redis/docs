// EXAMPLE: iris_playbook_proposals
// HIDE_START
import { Playbook } from "@redis-iris/agent-playbook";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Set ${name}`);
  return value;
}

const playbook = new Playbook({
  serverURL: requiredEnv("PLAYBOOK_URL"),
  playbookId: requiredEnv("PLAYBOOK_ID"),
  apiKey: requiredEnv("PLAYBOOK_API_KEY"),
  retryConfig: { strategy: "none" },
});
console.log(await playbook.getPlaybookHealth());
// HIDE_END

// STEP_START playbook-proposal-inbox
let inboxCursor: string | undefined;
while (true) {
  const page = await playbook.listProposals("inbox", "updatedAt", "desc", 50, inboxCursor);
  if (inboxCursor === undefined) console.log("Total inbox proposals:", page.total ?? "unknown");
  for (const item of page.proposals) console.log(item.proposalId, item.status, item.evidenceCount, item.action);
  inboxCursor = page.nextCursor;
  if (inboxCursor === undefined) break;
}
// STEP_END

// STEP_START playbook-proposal-search
const related = await playbook.searchProposals({
  query: "Contact support about a missing refund",
  minimumScore: 0.7,
  actionType: "add",
  entryType: "faq",
  limit: 5,
});
for (const match of related.matches) console.log(match.proposal.proposalId, match.score, match.proposal.action);
// STEP_END

// STEP_START playbook-proposal-create
const action = { add: {
  target: { newEntry: {} },
  candidate: { content: {
    intents: ["Contact support about a missing refund"],
    attributes: { locale: "en-US", topic: "refund" },
    payload: { faq: {
      question: "What should I send support about a missing refund?",
      answer: "Send your order number and the date you requested the refund.",
    } },
  } },
} };
const proposal = await playbook.createProposal({
  action,
  source: {
    type: "document",
    reference: { documentId: "sample-refund-policy" },
  },
});
const proposalId = proposal.proposalId;
console.log(proposalId, proposal.proposalRevision);
// STEP_END

// STEP_START playbook-proposal-evidence
const { randomUUID } = await import("node:crypto");
const evidenceId = "evd_" + randomUUID().replaceAll("-", "");
const observedAt = new Date();
const evidence = await playbook.submitProposalEvidence(proposalId, evidenceId, {
  observedAt,
  producer: { name: "docs-example", promptVersion: "refund-review-v1" },
  source: {
    type: "document",
    reference: { documentId: "sample-refund-policy" },
    content: { excerpt: "For refund inquiries, collect the order number and request date. Do not request full card details." },
  },
});
console.log(evidence.disposition);
// STEP_END

// STEP_START playbook-proposal-read
const reviewed = await playbook.getProposal(proposalId);
console.log(JSON.stringify(reviewed, null, 2));
// STEP_END

// STEP_START playbook-proposal-replace
if (!("add" in reviewed.action)) throw new Error("Expected an add proposal");
if (!("newEntry" in reviewed.action.add.target)) throw new Error("Expected a new-entry target");
const reviewedContent = reviewed.action.add.candidate.content;
if (!("faq" in reviewedContent.payload)) throw new Error("Expected an FAQ proposal");
const revisedAction = { add: {
  target: { newEntry: reviewed.action.add.target.newEntry },
  candidate: { content: {
    ...reviewedContent,
    payload: { faq: {
      ...reviewedContent.payload.faq,
      answer: reviewedContent.payload.faq.answer + " Do not send full card details.",
    } },
  } },
} };
const revised = await playbook.replaceProposal(proposalId, {
  action: revisedAction, expectedProposalRevision: reviewed.proposalRevision,
});
console.log(revised.proposalRevision, revised.action);
// STEP_END

// STEP_START playbook-proposal-trash
await playbook.dismissProposal(proposalId, {
  expectedProposalRevision: revised.proposalRevision,
});
await playbook.restoreProposal(proposalId);
// To purge a trashed proposal instead of restoring it:
// await playbook.purgeProposal(proposalId);
// STEP_END

// STEP_START playbook-proposal-final-review
const finalReview = await playbook.getProposal(proposalId);
console.log(finalReview.action, finalReview.evidence);
// STEP_END

// STEP_START playbook-proposal-accept
const accepted = await playbook.acceptProposal(proposalId, {
  expectedProposalRevision: finalReview.proposalRevision,
});
if (!("versionCreated" in accepted.result)) {
  throw new Error("Review the unrecognized acceptance result before publishing");
}
const receipt = accepted.result.versionCreated;
const acceptedVersion = await playbook.getFaqVersion(receipt.entryId, receipt.version);
console.log(receipt.entryId, receipt.version, acceptedVersion.content);
// STEP_END

// STEP_START playbook-proposal-publish
await playbook.publishFaq(receipt.entryId, { version: receipt.version });
// STEP_END

// STEP_START playbook-proposal-history
let trashCursor: string | undefined;
while (true) {
  const page = await playbook.listProposals("trash", "updatedAt", "desc", 50, trashCursor);
  if (trashCursor === undefined) console.log("Total trash proposals:", page.total ?? "unknown");
  for (const item of page.proposals) console.log(item.proposalId, item.status, item.evidenceCount, item.action);
  trashCursor = page.nextCursor;
  if (trashCursor === undefined) break;
}
// STEP_END
