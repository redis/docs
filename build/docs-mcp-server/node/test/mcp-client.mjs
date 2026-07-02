// Manual local test: drive the built stdio server through the real MCP client
// (spawn -> initialize -> tools/list -> tools/call), against the local fixture.
//   node test/mcp-client.mjs
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "node:url";

const feed =
  process.env.DOCS_NDJSON ?? fileURLToPath(new URL("./fixture.ndjson", import.meta.url));
const serverEntry = fileURLToPath(new URL("../dist/index.js", import.meta.url));

const transport = new StdioClientTransport({
  command: "node",
  args: [serverEntry],
  env: { ...process.env, DOCS_NDJSON: feed },
});

const client = new Client({ name: "local-test-client", version: "0.0.1" }, { capabilities: {} });
await client.connect(transport);
console.log("connected to server\n");

const tools = await client.listTools();
console.log("tools/list ->", tools.tools.map((t) => t.name).join(", "), "\n");

const search = await client.callTool({
  name: "search_docs",
  arguments: { query: "append an entry to a stream" },
});
console.log("tools/call search_docs('append an entry to a stream'):");
console.log(search.content[0].text, "\n");

const amb = await client.callTool({ name: "get_page", arguments: { id: "install" } });
console.log(`tools/call get_page(id='install') -> isError=${amb.isError}`);
console.log(amb.content[0].text, "\n");

const page = await client.callTool({
  name: "get_page",
  arguments: { url: "https://redis.io/docs/latest/commands/xadd/", roles: ["parameters"] },
});
console.log(`tools/call get_page(url=.../commands/xadd/, roles=['parameters']) -> isError=${page.isError}`);
console.log(page.content[0].text);

await client.close();
console.log("\nclosed cleanly");
