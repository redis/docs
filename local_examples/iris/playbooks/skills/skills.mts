// EXAMPLE: iris_playbook_skills
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

// STEP_START playbook-skill-create
const { readFile } = await import("node:fs/promises");
const packageBase64 = (await readFile("refund-support-reply.zip")).toString("base64");
const skillContext = {
  intents: ["Draft a refund support reply", "Choose a refund reply template"],
  attributes: { locale: "en-US", topic: "refund" },
};
const skillDraft = await playbook.createSkill({ packageBase64, content: skillContext });
const skillId = skillDraft.entry.entryId;
const skillVersion = skillDraft.version.version;
console.log(skillId, skillVersion);
// STEP_END

// STEP_START playbook-skill-review
const storedSkill = await playbook.getSkillVersion(skillId, skillVersion);
console.log(storedSkill.content);
// STEP_END

// STEP_START playbook-skill-publish
await playbook.publishSkill(skillId, { version: skillVersion });
// STEP_END

// STEP_START playbook-skill-append
const updatedContext = {
  ...skillContext,
  attributes: { ...skillContext.attributes, channel: "chat" },
};
const replacement = (await readFile("refund-support-reply.zip")).toString("base64");
const skillUpdate = await playbook.appendSkillVersion(skillId, {
  packageBase64: replacement, content: updatedContext,
});
console.log("Review before publishing:", skillUpdate.version);
// STEP_END

// STEP_START playbook-skill-load
const selected = await playbook.getSkillVersion(skillId, skillVersion);
if (!("skill" in selected.content.payload)) throw new Error("Expected a skill");
const skill = selected.content.payload.skill;
console.log(skill.instructions);
const resource = skill.resources.find(r => r.path === "references/reply-template.md");
if (!resource) throw new Error("Reply template is missing");
const response = await playbook.getSkillResource(selected.entryId, selected.version, resource.resourceId);
console.log(await new Response(response.result).text());
// STEP_END

// STEP_START playbook-skill-list
let skillCursor: string | undefined;
while (true) {
  const page = await playbook.listSkills(
    "updatedAt", "DESC", undefined, undefined, undefined, 50, skillCursor,
  );
  for (const entry of page.items) console.log(entry.entryId, entry.latestVersion, entry.publication);
  skillCursor = page.nextCursor;
  if (skillCursor === undefined) break;
}
// STEP_END

// STEP_START playbook-skill-state
const entry = await playbook.getSkill(skillId);
console.log(entry.latestVersion, entry.publication);
// STEP_END

// STEP_START playbook-skill-history
let skillVersionCursor: string | undefined;
while (true) {
  const page = await playbook.listSkillVersions(skillId, undefined, undefined, 50, skillVersionCursor);
  for (const item of page.items) console.log(item.version, item.contentDigest, item.content);
  skillVersionCursor = page.nextCursor;
  if (skillVersionCursor === undefined) break;
}
// STEP_END
