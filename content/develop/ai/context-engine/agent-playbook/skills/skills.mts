// Generated from skills.md; edit the page, then run examples.py --refresh-downloads.
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

const storedSkill = await playbook.getSkillVersion(skillId, skillVersion);
console.log(storedSkill.content);

await playbook.publishSkill(skillId, { version: skillVersion });

const updatedContext = {
  ...skillContext,
  attributes: { ...skillContext.attributes, channel: "chat" },
};
const replacement = (await readFile("refund-support-reply.zip")).toString("base64");
const skillUpdate = await playbook.appendSkillVersion(skillId, {
  packageBase64: replacement, content: updatedContext,
});
console.log("Review before publishing:", skillUpdate.version);

const selected = await playbook.getSkillVersion(skillId, skillVersion);
if (!("skill" in selected.content.payload)) throw new Error("Expected a skill");
const skill = selected.content.payload.skill;
console.log(skill.instructions);
const resource = skill.resources.find(r => r.path === "references/reply-template.md");
if (!resource) throw new Error("Reply template is missing");
const response = await playbook.getSkillResource(selected.entryId, selected.version, resource.resourceId);
console.log(await new Response(response.result).text());

let skillCursor: string | undefined;
while (true) {
  const page = await playbook.listSkills(
    "updatedAt", "desc", undefined, undefined, undefined, 50, skillCursor,
  );
  if (skillCursor === undefined) console.log("Total skills:", page.total ?? "unknown");
  for (const entry of page.skills) console.log(entry.entryId, entry.latestVersion, entry.publication);
  skillCursor = page.nextCursor;
  if (skillCursor === undefined) break;
}

const entry = await playbook.getSkill(skillId);
console.log(entry.latestVersion, entry.publication);

let skillVersionCursor: string | undefined;
while (true) {
  const page = await playbook.listSkillVersions(skillId, undefined, undefined, 50, skillVersionCursor);
  for (const item of page.versions) console.log(item.version, item.contentDigest, item.content);
  skillVersionCursor = page.nextCursor;
  if (skillVersionCursor === undefined) break;
}
