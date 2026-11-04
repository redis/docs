import asyncio

from redis_iris import Iris

TOOL_META_KEY = "com.redis.context-gateway/tool"
HANDLE_META_KEY = "com.redis.context-gateway/handle"

FILTER = {
    "tag_conditions": [
        {"field": "specialty", "value": "cardiology"}
    ],
    "limit": 100,
}


def checked(result):
    if result.is_error:
        raise RuntimeError(result.model_dump_json(by_alias=True))
    return result


async def main():
    gateway = Iris.from_env().context_gateway()

    async with gateway.client.connect() as session:
        # Find the filter and inspect its schema.
        found = checked(
            await session.call_tool(
                "search_tools",
                {"query": "filter_provider", "limit": 100},
            )
        )
        matches = [
            tool
            for tool in found.structured_content["tools"]
            if tool.get("_meta", {})
            .get(TOOL_META_KEY, {})
            .get("originalName") == "filter_provider"
        ]
        if len(matches) != 1:
            raise RuntimeError(
                "Expected one provider filter from the sample setup. "
                "Inspect the discovered tools and select the intended Upstream."
            )

        provider_filter = matches[0]
        print("Filter schema:", provider_filter["inputSchema"])

        identity = provider_filter["_meta"][TOOL_META_KEY]
        reference = {
            "upstreamId": identity["upstreamId"],
            "originalName": identity["originalName"],
        }

        # Call the tool normally.
        result = checked(
            await session.call_tool(
                "run_tool",
                {"tool": reference, "toolArgs": FILTER},
            )
        )
        print("Cardiologists:", result.model_dump_json(by_alias=True))

        # Call it again and explicitly request a stored result.
        captured = checked(
            await session.call_tool(
                "run_tool_as_handle",
                {"tool": reference, "toolArgs": FILTER},
            )
        )
        handle_metadata = (captured.meta or {}).get(HANDLE_META_KEY)
        if handle_metadata is None:
            raise RuntimeError("Explicit capture returned no handle")

        handle = handle_metadata["handle"]
        try:
            operations = [
                ("describe_result", {"handle": handle}),
                (
                    "page_results",
                    {"handle": handle, "offset": 0, "limit": 2},
                ),
                (
                    "count_results",
                    {"handle": handle, "groupBy": "location_id"},
                ),
            ]

            for name, arguments in operations:
                answer = checked(
                    await session.call_tool(name, arguments)
                )
                # Inspect completeness and warning in the responses
                # before interpreting pages or counts as complete.
                print(name, answer.model_dump_json(by_alias=True))
        finally:
            checked(
                await session.call_tool(
                    "release_results",
                    {"handle": handle},
                )
            )


if __name__ == "__main__":
    asyncio.run(main())
