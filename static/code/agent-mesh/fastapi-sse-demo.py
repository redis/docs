"""Loopback-only simulated agent demo with FastAPI events. Run: python fastapi-sse-demo.py."""

import asyncio
import os
import logging
from pathlib import Path
from uuid import UUID, uuid4

import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, StreamingResponse
from redis_iris.agent_mesh.fastapi_sse import FastAPIRedis, StreamBackendDep
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from starlette.responses import PlainTextResponse


class LocalRequestsOnly(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        if request.client is None or request.client.host not in {"127.0.0.1", "::1"}:
            return PlainTextResponse("This demo accepts loopback clients only", status_code=403)
        origin = request.headers.get("origin")
        if origin and origin != f"{request.url.scheme}://{request.headers['host']}":
            return PlainTextResponse("Cross-origin requests are disabled", status_code=403)
        return await call_next(request)


redis_url = os.environ.get("REDIS_URL")
if not redis_url:
    raise ValueError("Set REDIS_URL before running this demo")
# The upstream SDK owns its pools and in-process producer tasks.
os.environ.setdefault("REDIS_PREFIX", "quickstart:sse-browser")
os.environ.setdefault("REDIS_STREAM_DONE_TTL", "3600")
jobs = {}


# Scripted agent activity keeps this example runnable without a model account.
AGENT_STEPS = (
    "Reading your request",
    "Identifying the trip length and interests",
    "Listing candidate sights",
    "Looking up the historic center in the sample travel notes",
    "Comparing morning walking routes",
    "Selecting a starting point",
    "Checking the sample museum information",
    "Allowing time for a museum visit",
    "Looking up lunch options in the sample notes",
    "Choosing a lunch stop near the route",
    "Planning the afternoon walk",
    "Adding a rest break",
    "Comparing evening viewpoints",
    "Selecting a sunset stop",
    "Estimating time between stops",
    "Checking the itinerary for backtracking",
    "Balancing sightseeing and breaks",
    "Drafting the itinerary",
    "Adding a reminder to check opening times",
    "Preparing your answer",
)
AGENT_ANSWER = (
    "Spend the morning walking from the Pantheon to Piazza Navona. "
    "Have lunch nearby, then visit the Capitoline Museums in the afternoon. "
    "Take a coffee break before walking to the Orange Garden for an evening view. "
    "Check opening times and ticket availability before your visit."
)


async def produce(job_id, writer):
    try:
        for number, message in enumerate(AGENT_STEPS, start=1):
            await asyncio.sleep(1)  # Simulated work, independent of subscriptions.
            await writer.append("progress", {"number": number, "message": message})
            jobs[job_id]["produced"] = number
        await writer.finish("completed", {"count": len(AGENT_STEPS), "answer": AGENT_ANSWER})
        jobs[job_id]["state"] = "completed"
    except asyncio.CancelledError:
        jobs[job_id]["state"] = "canceled"
        raise
    except Exception:
        jobs[job_id]["state"] = "failed"
        logging.exception("Demo event producer failed")
        raise


app = FastAPI()
FastAPIRedis(app).lifespan().streams()
app.add_middleware(LocalRequestsOnly)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["127.0.0.1", "localhost"])


def get_job(job_id):
    job = jobs.get(str(job_id))
    if job is None:
        raise HTTPException(status_code=404, detail="Unknown demo job")
    return job


@app.get("/", include_in_schema=False)
async def home():
    return FileResponse(Path(__file__).with_name("fastapi-sse-demo.html"))


@app.post("/jobs")
async def start_job(streams: StreamBackendDep):
    job_id = str(uuid4())
    # One fixed owner for this local demonstration; no request-supplied identity.
    scope = f"job:{job_id}"
    jobs[job_id] = {"scope": scope, "produced": 0, "state": "working"}
    await streams.start(lambda writer: produce(job_id, writer), scope=scope, stream_id=job_id)
    return {"job_id": job_id}


@app.get("/jobs/{job_id}")
async def job_state(job_id: UUID):
    job = get_job(job_id)
    return {"job_id": str(job_id), "produced": job["produced"], "state": job["state"]}


@app.get(
    "/jobs/{job_id}/events",
    response_class=StreamingResponse,
    responses={200: {"content": {"text/event-stream": {}}}},
)
async def events(job_id: UUID, request: Request, streams: StreamBackendDep):
    # This local demo has one owner. Authorize resource access in a deployed app.
    job = get_job(job_id)
    return await streams.sse(str(job_id), request=request, scope=job["scope"])


if __name__ == "__main__":
    print("Open http://127.0.0.1:8000 in your browser.")
    uvicorn.run(app, host="127.0.0.1", port=8000)
