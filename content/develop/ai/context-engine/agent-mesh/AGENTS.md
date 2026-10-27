# Agent Mesh documentation

- Agent Mesh is a preview Python SDK integration distributed through `redis-iris`.
  Imports use `redis_iris.agent_mesh`.
- Lead with resumable event streams on Redis. Present A2A task state storage as
  a supporting capability, and A2A and FastAPI SSE as two Python integration paths.
- Distinguish the independent `[a2a]` and `[fastapi-sse]` extras. The A2A
  integration does not require the FastAPI SSE integration.
- Use Agent2Agent (A2A), server-sent events (SSE), Task snapshots, event replay,
  and application-owned execution. Explain acronyms on first use on each page.
- Write for the intended released package. Use package-index installation
  commands with the documented extras, not PR refs, source installs or commit pins.
  Do not invent a release version.
- Applications own authentication, Redis clients, agent execution and lifecycle.
  Task IDs and cursors are not credentials. Derive ownership from verified identity
  in deployed applications. The explicitly authorized loopback-only browser demos
  use a fixed demo owner without authentication; keep that exception local.
- Replay is bounded by retention and can fall back to a current snapshot. Do not
  promise automatic execution restart or exactly-once external effects.
- Keep the standalone Go mesh and its `agentmesh` HTTP client out of this SDK
  quickstart. Their deployment and Redis requirements are separate.
- Link detailed implementation and API guidance to redis-iris documentation.
  Preserve the product preview banner and qualification limitations.

- Keep two public pages: an overview and one quickstart with both integrations.
  Each example reaches one first result. Keep feature walkthroughs and detailed
  configuration outside the quickstart.
