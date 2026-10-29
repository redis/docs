# Agent Mesh documentation

- Agent Mesh is a beta Python SDK integration distributed through `redis-iris`.
  Imports use `redis_iris.agent_mesh`.
- Lead with resumable event streams on Redis. Present A2A task state storage as
  a supporting capability, and A2A and FastAPI SSE as two Python integration paths.
- Distinguish the independent `[a2a]` and `[fastapi-sse]` extras. The A2A
  integration does not require the FastAPI SSE integration. Both extras can be
  installed together; their shared redis-py range is `>=8.0.1,<9`. Keep Redis
  server requirements (8.6.2+ for both, with JSON also required for A2A) distinct
  from Python client versions.
- Use Agent2Agent (A2A), server-sent events (SSE), Task snapshots, event replay,
  and application-owned execution. Explain acronyms on first use on each page.
- Write for the intended released package. Use package-index installation
  commands with the documented extras, not PR refs, source installs or commit pins.
  Do not invent a release version.
- Applications supply authentication and agent execution. A2A accepts application-owned
  Redis clients; FastAPI uses SDK-managed pools and producer lifecycle.
  Task IDs and cursors are not credentials. Derive ownership from verified identity
  in deployed applications. The explicitly authorized loopback-only browser demos
  use a fixed demo owner without authentication; keep that exception local.
- Replay is bounded by retention and can fall back to a current snapshot. Do not
  promise automatic execution restart or exactly-once external effects.
- Keep the standalone Go mesh and its `agentmesh` HTTP client out of this SDK
  quickstart. Their deployment and Redis requirements are separate.
- Keep user-facing integration guides here. Link exhaustive signatures and
  implementation contracts to redis-iris documentation.
  Preserve the product beta banner and qualification limitations.

- Keep an overview, one quickstart with both integrations, and one SDK guide
  per integration. Each quickstart example reaches one first result. Keep
  detailed configuration, authorization, replay and recovery in the SDK guides.
