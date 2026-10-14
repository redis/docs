// EXAMPLE: iris_playbook_mcp_client
// STEP_START playbook-mcp-client
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";
import { writeFile } from "node:fs/promises";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Set ${name}`);
  return value;
}
function readResult<T>(value: Awaited<ReturnType<Client["callTool"]>>): T {
  const result = CallToolResultSchema.parse(value);
  if (result.isError) throw new Error(`Playbook tool failed: ${JSON.stringify(result.content)}`);
  if (result.structuredContent) return result.structuredContent as T;
  const text = result.content.find(block => block.type === "text");
  if (!text || text.type !== "text") throw new Error("Playbook tool returned no JSON text.");
  return JSON.parse(text.text) as T;
}
type Preview = {
  entryId: string; version: number; entryType: string; faq?: { answer: string };
};
type Previews = { pinnedEntries: Preview[]; discoveredEntries: Preview[] };
type LoadedSkill = {
  content: { instructions: string; resources: { path: string; uri: string }[] };
};
const url = `${requiredEnv("PLAYBOOK_URL").replace(/\/+$/, "")}/v1/playbooks/${requiredEnv("PLAYBOOK_ID")}/mcp`;
const client = new Client({ name: "playbook-example", version: "1.0.0" });
const transport = new StreamableHTTPClientTransport(new URL(url), {
  requestInit: { headers: { Authorization: `Bearer ${requiredEnv("PLAYBOOK_API_KEY")}` } },
});
try {
  await client.connect(transport);
  console.log("Tools:", (await client.listTools()).tools.map(tool => tool.name));
  const previews = readResult<Previews>(await client.callTool({
    name: "discover_entries",
    arguments: {
      query: "Draft a reply to a customer whose refund status shows Processing.", limit: 3,
    },
  }));
  const entries = [...previews.pinnedEntries, ...previews.discoveredEntries];
  for (const entry of entries) {
    if (entry.entryType === "faq") console.log("FAQ:", entry.faq?.answer);
  }
  const skill = entries.find(entry => entry.entryType === "skill");
  if (!skill) {
    console.log("No skill preview returned; check the query, publication, and discovery budget.");
  } else {
    const loaded = readResult<LoadedSkill>(await client.callTool({
      name: "load_skill", arguments: { entry_id: skill.entryId, version: skill.version },
    }));
    if (typeof loaded.content.instructions !== "string") {
      throw new Error("Skill response has no valid instructions.");
    }
    console.log(loaded.content.instructions);
    const resource = loaded.content.resources.find(item => item.path === "references/reply-template.md");
    if (!resource) {
      console.log("This skill has no refund reply template.");
    } else {
      const file = readResult<{ text?: string; blob?: string }>(await client.callTool({
        name: "fetch_resource", arguments: { uri: resource.uri },
      }));
      if (file.text !== undefined) {
        console.log(file.text);
      } else if (file.blob !== undefined) {
        await writeFile("resource.bin", Buffer.from(file.blob, "base64"));
        console.log("Saved binary resource to resource.bin");
      } else {
        throw new Error("Resource response has no text or blob.");
      }
    }
  }
} finally {
  await client.close();
}
// STEP_END
