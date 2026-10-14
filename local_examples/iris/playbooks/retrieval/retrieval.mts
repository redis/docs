// EXAMPLE: iris_playbook_retrieval
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

// STEP_START playbook-retrieval-discover
const discovery = await playbook.discoverEntries({ query: "Draft a reply for a customer whose refund shows Processing", limit: 5 });
console.log(JSON.stringify(discovery, null, 2));
// STEP_END

// STEP_START playbook-retrieval-pin
const skillId = requiredEnv("PLAYBOOK_SKILL_ID");
const pinned = await playbook.discoverEntries({
  query: "Draft a reply for a customer whose refund shows Processing",
  pinnedEntries: [{ entryId: skillId }],
});
const selectedPreview = pinned.pinnedEntries[0];
if (!selectedPreview) throw new Error("Pinned skill is missing");
console.log(selectedPreview.entryId, selectedPreview.version);
// STEP_END

// STEP_START playbook-retrieval-budget
console.log("Result limit reached:", pinned.truncated);
console.log("Preview budget reached:", pinned.budgetTruncated ?? false);
// STEP_END

// STEP_START playbook-retrieval-load
const selected = await playbook.getSkillVersion(selectedPreview.entryId, selectedPreview.version);
if (!("skill" in selected.content.payload)) throw new Error("Expected a skill");
const skill = selected.content.payload.skill;
console.log(skill.instructions);
const resource = skill.resources.find(r => r.path === "references/reply-template.md");
if (!resource) throw new Error("Reply template is missing");
const response = await playbook.getSkillResource(selected.entryId, selected.version, resource.resourceId);
console.log(await new Response(response.result).text());
// STEP_END

// STEP_START playbook-retrieval-search
const faqResults = await playbook.searchFaqs({ query: "Where is my refund?", limit: 5 });
const skillResults = await playbook.searchSkills({ query: "Draft a reply about a reported refund stage", limit: 5 });
console.log(JSON.stringify(faqResults, null, 2));
console.log(JSON.stringify(skillResults, null, 2));
// STEP_END

// STEP_START playbook-retrieval-threshold
const tuned = await playbook.searchFaqs({ query: "Where is my refund?", minimumScore: 0.75, limit: 3 });
console.log(tuned.matches);
// STEP_END

// STEP_START playbook-retrieval-filter
const filtered = await playbook.searchFaqs({
  query: "Where is my refund?",
  filter: { and: [
    { eq: { name: "locale", value: "en-US" } },
    { eq: { name: "topic", value: "refund" } },
  ] },
});
console.log(JSON.stringify(filtered, null, 2));
// STEP_END
