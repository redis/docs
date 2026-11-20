// EXAMPLE: iris_playbook_proposals_update
// STEP_START playbook-update-submit
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { Playbook } from "@redis-iris/agent-playbook";
import type { ProposalActionInput, ProposalInputContent } from "@redis-iris/agent-playbook/models";

const serverURL = process.env.IRIS_AGENT_PLAYBOOKS_URL;
if (!serverURL) throw new Error("Set IRIS_AGENT_PLAYBOOKS_URL");
const playbook = new Playbook({
  serverURL,
  playbookId: process.env.IRIS_AGENT_PLAYBOOKS_PLAYBOOK_ID,
  apiKey: process.env.IRIS_AGENT_PLAYBOOKS_API_KEY,
});
const entryId = process.env.PLAYBOOK_ENTRY_ID;
const basedOnVersion = Number(process.env.PLAYBOOK_BASED_ON_VERSION);
if (!entryId || !Number.isSafeInteger(basedOnVersion) || basedOnVersion < 1) {
  throw new Error("Set the existing entry ID and its positive basis version");
}

function actionFor(filename: string, entryId: string): ProposalActionInput {
  const content: ProposalInputContent = JSON.parse(readFileSync(filename, "utf8"));
  return {
    update: {
      target: { existingEntry: { entryId, basedOnVersion } },
      candidate: { content },
    },
  };
}

const proposal = await playbook.createProposal({
  action: actionFor("proposal-content.json", entryId),
});
console.log(proposal.proposalId, proposal.revision);
// STEP_END

// STEP_START playbook-update-review
const reviewed = await playbook.getProposal(proposal.proposalId);
console.log(reviewed.action);
const revised = await playbook.replaceProposal(reviewed.proposalId, {
  expectedRevision: reviewed.revision,
  action: actionFor("proposal-content-reviewed.json", entryId),
});
console.log(revised.action, revised.revision);
if (!("update" in revised.action)) throw new Error("Expected an UPDATE proposal");
const payload = revised.action.update.candidate.content.payload;
if ("skill" in payload) {
  const resource = payload.skill.resources.find(r => r.path === "references/reply-template.md");
  if (!resource) throw new Error("Missing the proposed reply template");
  const response = await playbook.getProposalResource(
    revised.proposalId, resource.resourceId, revised.revision,
  );
  const contents = Buffer.from(await new Response(response.result).arrayBuffer());
  const digest = "sha256:" + createHash("sha256").update(contents).digest("hex");
  if (digest !== resource.digest) throw new Error("Proposal file digest mismatch");
  console.log(contents.toString("utf8"));
}
// STEP_END

// STEP_START playbook-update-accept
const accepted = await playbook.acceptProposal(revised.proposalId, {
  expectedRevision: revised.revision,
});
if (!("versionCreated" in accepted.result)) {
  throw new Error("Expected an acceptance receipt for a version");
}
const receipt = accepted.result.versionCreated;
const version = receipt.entryKind === "FAQ"
  ? await playbook.getFaqVersion(receipt.entryId, receipt.version)
  : await playbook.getSkillVersion(receipt.entryId, receipt.version);
console.log(receipt.entryId, receipt.version, version.content);
// STEP_END

// STEP_START playbook-update-publish
if (receipt.entryKind === "FAQ") {
  await playbook.publishFaq(receipt.entryId, { version: receipt.version });
} else {
  await playbook.publishSkill(receipt.entryId, { version: receipt.version });
}
// STEP_END
