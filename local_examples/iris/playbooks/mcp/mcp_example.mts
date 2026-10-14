// EXAMPLE: iris_playbook_mcp
// STEP_START playbook-mcp-example
import { Agent, MCPServerStreamableHttp, run } from "@openai/agents";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Set ${name}`);
  return value;
}
const url = `${requiredEnv("PLAYBOOK_URL").replace(/\/$/, "")}/v1/playbooks/${requiredEnv("PLAYBOOK_ID")}/mcp`;
const playbook = new MCPServerStreamableHttp({
  name: "Agent Playbooks",
  url,
  requestInit: {
    headers: { Authorization: `Bearer ${requiredEnv("PLAYBOOK_API_KEY")}` },
  },
  cacheToolsList: true,
  clientSessionTimeoutSeconds: 30,
});

try {
  await playbook.connect();
  const agent = new Agent({
    name: "Support assistant",
    model: "gpt-5-mini",
    instructions:
      "Use Agent Playbooks to find published guidance before answering. " +
      "For reply-drafting tasks, call load_skill with the entry identifier and version from discovery. " +
      "Fetch the reply template using its uri from load_skill; never construct a file URI. " +
      "Follow the skill instructions and return the completed customer reply. " +
      "If no relevant knowledge is available or a tool fails, say so.",
    mcpServers: [playbook],
  });
  const result = await run(
    agent,
    "Draft a customer reply using the refund-support-reply skill and template. " +
    "The customer says their refund stage is Processing.",
  );
  for (const item of result.newItems) {
    if (item.type === "tool_call_item" && item.rawItem.type === "function_call") {
      console.log("Tool:", item.rawItem.name, item.rawItem.arguments);
    }
  }
  console.log(result.finalOutput);
} finally {
  await playbook.close();
}
// STEP_END
