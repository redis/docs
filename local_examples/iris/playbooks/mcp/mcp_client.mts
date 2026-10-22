// EXAMPLE: iris_playbook_mcp_client
// STEP_START playbook-mcp-client
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Set ${name}`);
  return value;
}
function readResult(value: Awaited<ReturnType<Client["callTool"]>>) {
  const result = CallToolResultSchema.parse(value);
  if (result.isError) throw new Error(`Playbook tool failed: ${JSON.stringify(result.content)}`);
  if (result.structuredContent !== undefined) return result.structuredContent;
  const text = result.content.find(block => block.type === "text");
  if (!text || text.type !== "text") throw new Error("Playbook tool returned no JSON text.");
  return JSON.parse(text.text);
}
const url = `${requiredEnv("PLAYBOOK_URL").replace(/\/+$/, "")}/v1/playbooks/${requiredEnv("PLAYBOOK_ID")}/mcp`;
const client = new Client({ name: "playbook-example", version: "1.0.0" });
const transport = new StreamableHTTPClientTransport(new URL(url), {
  requestInit: { headers: { Authorization: `Bearer ${requiredEnv("PLAYBOOK_API_KEY")}` } },
});
try {
  await client.connect(transport);
  console.log("Tools:", (await client.listTools()).tools.map(tool => tool.name));
  const result = await client.callTool({
    name: "discover_entries",
    arguments: {
      query: "Draft a reply to a customer whose refund status shows Processing.", limit: 3,
    },
  });
  console.log(JSON.stringify(readResult(result), null, 2));
} finally {
  await client.close();
}
// STEP_END
