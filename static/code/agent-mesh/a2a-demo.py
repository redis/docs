"""Loopback-only A2A subscription demo. Run: python a2a-demo.py."""

import asyncio
import os
from contextlib import asynccontextmanager
from pathlib import Path

import uvicorn
from a2a.server.agent_execution import AgentExecutor
from a2a.server.request_handlers import DefaultRequestHandler
from a2a.types import (
    AgentCapabilities, AgentCard, AgentInterface, AgentSkill, Artifact, Part, Task,
    TaskArtifactUpdateEvent, TaskState, TaskStatus, TaskStatusUpdateEvent,
)
from a2a.utils import TransportProtocol
from redis.asyncio import Redis
from redis_iris.agent_mesh.a2a import RedisTaskStore
from redis_iris.agent_mesh.a2a.routes import (
    create_resumable_rest_routes, resumable_streams_extension,
)
from starlette.applications import Starlette
from starlette.middleware import Middleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from starlette.responses import FileResponse, PlainTextResponse
from starlette.routing import Route


class LocalRequestsOnly(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        # Keep this deliberately unauthenticated example on the local machine.
        if request.client is None or request.client.host not in {"127.0.0.1", "::1"}:
            return PlainTextResponse("This demo accepts loopback clients only", status_code=403)
        origin = request.headers.get("origin")
        if origin and origin != f"{request.url.scheme}://{request.headers['host']}":
            return PlainTextResponse("Cross-origin requests are disabled", status_code=403)
        # Native EventSource cannot set A2A-Version. This demo serves A2A 1.0 only.
        if "a2a-version" not in request.headers:
            request.scope["headers"] = [*request.scope["headers"], (b"a2a-version", b"1.0")]
        return await call_next(request)


class CountingAgent(AgentExecutor):
    async def execute(self, context, event_queue):
        await event_queue.enqueue_event(Task(
            id=context.task_id, context_id=context.context_id,
            status=TaskStatus(state=TaskState.TASK_STATE_WORKING),
        ))
        for number in range(1, 21):
            # Simulated work, independent of the browser's subscription.
            await asyncio.sleep(1)
            await event_queue.enqueue_event(TaskArtifactUpdateEvent(
                task_id=context.task_id, context_id=context.context_id,
                artifact=Artifact(
                    artifact_id=f"update-{number}",
                    parts=[Part(text=f"Update {number} of 20")],
                ),
                last_chunk=True,
            ))
        await self.finish(context, event_queue, TaskState.TASK_STATE_COMPLETED)

    async def cancel(self, context, event_queue):
        await self.finish(context, event_queue, TaskState.TASK_STATE_CANCELED)

    async def finish(self, context, event_queue, state):
        await event_queue.enqueue_event(TaskStatusUpdateEvent(
            task_id=context.task_id, context_id=context.context_id,
            status=TaskStatus(state=state),
        ))


redis_url = os.environ.get("REDIS_URL")
if not redis_url:
    raise ValueError("Set REDIS_URL before running this demo")
redis = Redis.from_url(redis_url, socket_timeout=5)
store = RedisTaskStore(
    redis,
    namespace="quickstart:a2a-browser",
    # Explicit single-user demonstration policy. Use verified identity in an application.
    owner_resolver=lambda context: "local-demo-user",
)
events = store.event_stream()
card = AgentCard(
    name="Counting agent", description="Produces twenty numbered updates", version="1.0",
    capabilities=AgentCapabilities(streaming=True, extensions=[resumable_streams_extension()]),
    default_input_modes=["text/plain"], default_output_modes=["text/plain"],
    skills=[AgentSkill(id="count", name="Count", description="Counts to twenty", tags=["demo"])],
    supported_interfaces=[AgentInterface(
        protocol_binding=TransportProtocol.HTTP_JSON,
        protocol_version="1.0", url="http://127.0.0.1:8000/",
    )],
)
handler = DefaultRequestHandler(
    agent_executor=store.heartbeat(CountingAgent()), agent_card=card,
    task_store=store, event_stream=events,
)


@asynccontextmanager
async def lifespan(app):
    async with redis:
        await redis.ping()
        try:
            yield
        finally:
            # Bound shutdown even if someone stops the demo while a task is working.
            await asyncio.wait_for(handler.aclose(), timeout=30)


async def home(request):
    return FileResponse(Path(__file__).with_name("a2a-demo.html"))


app = Starlette(
    routes=[Route("/", home), *create_resumable_rest_routes(
        handler, store=store, event_stream=events,
    )],
    lifespan=lifespan,
    middleware=[
        Middleware(TrustedHostMiddleware, allowed_hosts=["127.0.0.1", "localhost"]),
        Middleware(LocalRequestsOnly),
    ],
)

if __name__ == "__main__":
    print("Open http://127.0.0.1:8000 in your browser.")
    uvicorn.run(app, host="127.0.0.1", port=8000)
