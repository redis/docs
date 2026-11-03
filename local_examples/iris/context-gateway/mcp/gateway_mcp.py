import asyncio
import os

from redis_iris import ContextGateway

HANDLE_META_KEY = "com.redis.context-gateway/handle"

TOOL_META = "com.redis.context-gateway/tool"
FILTER = {
    "tag_conditions": [{"field": "specialty", "value": "cardiology"}],
    "limit": 100,
}


def checked(result):
    if result.is_error:
        raise RuntimeError(result.model_dump_json(by_alias=True))
    return result


async def main():
    key = os.environ["IRIS_CONTEXT_GATEWAY_API_KEY"]
    full = ContextGateway.from_env()
    async with full.client.connect() as session:
        listed = (await session.list_tools()).tools
        print("Full-mode tools:", [tool.name for tool in listed])
        provider_filter = next(
            tool for tool in listed
            if (tool.meta or {}).get(TOOL_META, {}).get("originalName")
            == "filter_provider"
        )
        print("Filter schema:", provider_filter.input_schema)
        result = checked(await session.call_tool(provider_filter.name, FILTER))
        print("Cardiologists:", result.model_dump_json(by_alias=True))

    search = ContextGateway.from_env({
        "IRIS_CONTEXT_GATEWAY_URL": os.environ["SEARCH_GATEWAY_URL"],
        "IRIS_CONTEXT_GATEWAY_API_KEY": key,
    })
    async with search.client.connect() as session:
        found = checked(await session.call_tool(
            "search_tools", {"query": "filter_provider", "limit": 100}
        ))
        provider_filter = next(
            tool for tool in found.structured_content["tools"]
            if tool.get("_meta", {}).get(TOOL_META, {}).get("originalName")
            == "filter_provider"
        )
        identity = provider_filter["_meta"][TOOL_META]
        reference = {
            "upstreamId": identity["upstreamId"],
            "originalName": identity["originalName"],
        }
        result = checked(await session.call_tool(
            "run_tool", {"tool": reference, "toolArgs": FILTER}
        ))
        print("Search-mode call:", result.model_dump_json(by_alias=True))

        stub = checked(await session.call_tool(
            "run_tool_as_handle", {"tool": reference, "toolArgs": FILTER}
        ))
        held = (stub.meta or {}).get(HANDLE_META_KEY)
        if held is None:
            raise RuntimeError("Explicit capture returned no handle")
        handle = held["handle"]
        try:
            for name, arguments in [
                ("describe_result", {"handle": handle}),
                ("page_results", {"handle": handle, "offset": 0, "limit": 2}),
                ("count_results", {"handle": handle, "groupBy": "location_id"}),
            ]:
                answer = checked(await session.call_tool(name, arguments))
                print(name, answer.model_dump_json(by_alias=True))
        finally:
            checked(await session.call_tool("release_results", {"handle": handle}))


if __name__ == "__main__":
    asyncio.run(main())
