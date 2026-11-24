import { ContextGateway } from "@redis-iris/context-gateway";

const gateway = new ContextGateway({
  url: process.env.IRIS_CONTEXT_GATEWAY_URL!,
  agentKey: process.env.IRIS_CONTEXT_GATEWAY_API_KEY!,
});
const client = await gateway.connect();

type ToolDefinition = {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
  _meta?: Record<string, unknown>;
};

// Set GATEWAY_MODE=full to use a full-mode Gateway.
const mode = process.env.GATEWAY_MODE ?? "search";

try {
  let tools: ToolDefinition[];
  if (mode === "search") {
    const found = await client.callTool({
      name: "search_tools",
      arguments: { query: "filter_provider", limit: 5 },
    });
    if (found.isError) throw new Error(JSON.stringify(found.content));
    const data = found.structuredContent as { tools?: ToolDefinition[] } | undefined;
    if (!Array.isArray(data?.tools)) throw new Error("Search returned no tool definitions.");
    tools = data.tools;
  } else if (mode === "full") {
    tools = [];
    let cursor: string | undefined;
    do {
      const page = await client.listTools(cursor ? { cursor } : {});
      tools.push(...page.tools);
      cursor = page.nextCursor;
    } while (cursor);
  } else {
    throw new Error("Choose search or full mode.");
  }
  for (const tool of tools) console.log(tool.name, tool.description);

  const providerFilter = tools.find(
    (tool) => tool.name === "scheduling__filter_provider",
  );
  if (!providerFilter) throw new Error("The sample tool was not found.");
  console.log(JSON.stringify(providerFilter.inputSchema, null, 2));

  const toolArgs = {
    tag_conditions: [{ field: "specialty", value: "cardiology" }],
    limit: 100,
  };

  if (mode === "search") {
    const identity = providerFilter._meta?.["com.redis.context-gateway/tool"] as
      | { upstreamId?: string; originalName?: string }
      | undefined;
    if (!identity?.upstreamId || !identity.originalName) {
      throw new Error("The discovered tool has no identity.");
    }
    const result = await client.callTool({
      name: "run_tool",
      arguments: {
        tool: { upstreamId: identity.upstreamId, originalName: identity.originalName },
        toolArgs,
      },
    });
    if (result.isError) throw new Error(JSON.stringify(result.content));
    console.log(JSON.stringify(result.structuredContent ?? result.content, null, 2));
  } else {
    const result = await client.callTool({
      name: providerFilter.name,
      arguments: toolArgs,
    });
    if (result.isError) throw new Error(JSON.stringify(result.content));
    console.log(JSON.stringify(result.structuredContent ?? result.content, null, 2));
  }
} finally {
  await client.close();
}
