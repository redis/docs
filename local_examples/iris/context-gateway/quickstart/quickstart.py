import json

from redis_iris import Iris

gateway = Iris.from_env().context_gateway()

mode = "search"  # Use "full" for a full-mode Gateway.
if mode == "search":
    tools = gateway.search("filter_provider")
elif mode == "full":
    tools = gateway.tools()
else:
    raise ValueError("Choose search or full mode.")

for tool in tools:
    print(tool.name, tool.description)

provider_filter = next(
    (tool for tool in tools if tool.name == "scheduling__filter_provider"),
    None,
)
if provider_filter is None:
    raise RuntimeError("The sample tool was not found. Check the scheduling Upstream.")

print(json.dumps(provider_filter.input_schema, indent=2))

result = gateway.call(
    provider_filter.name,
    tag_conditions=[{"field": "specialty", "value": "cardiology"}],
    limit=100,
)
if result.is_error:
    raise RuntimeError(result.as_text())

print(json.dumps(result.data, indent=2))
