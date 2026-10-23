# Lens developer documentation design

Design for the customer-facing Lens developer docs, tracked in
[MOD-20119](https://redislabs.atlassian.net/browse/MOD-20119).

## Decisions

- **Name:** "Lens" in prose, never "Iris Lens". Section folder:
  `content/develop/ai/context-engine/lens/`.
- **Context Gateway, not Context Retriever.** Prose always says Context Gateway. API
  literals such as `GetContextRetrieverResult` stay as they are in the generated reference.
- **Packages:** instrumentation ships in `redis-iris` (`redis_iris.lens`); the read client is
  `redis-agent-lens`. Install both unpinned. Every release so far is a prerelease, which pip
  and uv install when no stable release exists. Model-call tracing needs the
  `redis-iris[llm-tracing]` extra.
- **Languages:** Python and cURL. Instrumentation uses the Python SDK; the read API works
  from any language over HTTP.
- **Audience:** developers with a provisioned Lens instance and API keys. Install, upgrade,
  and runbooks are operator docs, tracked in
  [MOD-18980](https://redislabs.atlassian.net/browse/MOD-18980).
- **Present what Lens does.** Lens is in Beta. Say where a capability is present, not where
  it's missing: "Playbook discovery results include their similarity score", not "Agent
  Memory recalls have no score". Name the cases that have a capability so readers don't
  assume it applies everywhere. Leave out unshipped features entirely. One short Beta note on
  the landing page; no lists of gaps.
- **Customer-facing only.** Leave out storage tiers, internal service names, internal span
  and attribute names (`iris.lens.*`, `iris.component.*`), cursor internals, and design
  history.
- **Diagrams:** two SVGs in `static/images/ai/context-engine/`, each with a full-sentence alt
  text. `lens-how-it-works.svg` on the landing page shows your agent and the Iris products
  sending traces through the `redis-iris` SDK to Lens, read in the UI or through the read API.
  `lens-turn.svg` in concepts shows one turn as its steps: memory recall, Playbook discovery,
  prompt assembly (fetched vs. used), model call, Context Gateway tool call, and outcome.
- **Operator handoff:** until the MOD-18980 pages exist (presumably
  `content/operate/iris/lens/`), state the prerequisite ("ask your administrator for your
  Lens endpoint, an ingest key, and a read key"), add a TODO comment at each handoff point,
  and don't link to unpublished paths. Handoff points: quickstart "Before you begin",
  configure "API keys and scopes", and limits.
- **Opaque IDs:** one sentence in concepts, phrased as guidance: use opaque values, such as
  internal IDs or hashes, for session, thread, user, and agent IDs.
- **Out of scope for now:** Pydantic AI, turn sampling, the turn `feedback` field, the
  "masked" content state (generated API reference only), and `stats()`.

## Sources

Check against the latest `origin/main` of each repo, not a local checkout.

- `redis-iris` `docs/core/lens.md` and `src/redis_iris/lens/`: SDK calls, settings, export
  behavior.
- `iris` `lens/dataplane/api/redis.ai.lens.dataplane.smithy`: read API, outcomes, content
  states, score bands, limits.
- `iris` `iris/ui/src/screens/lens/`: UI views and labels.
- `iris-sdks` `lens-python-sdk`: the `redis-agent-lens` read client (`LENS_API_KEY`).
- `redis-applied-ai/iris-onprem-preview` `examples/`: LangGraph, Google ADK, and OpenAI
  Agents SDK agents that use Agent Memory, Agent Playbooks, and Context Gateway in one turn.

## Structure

Section: `content/develop/ai/context-engine/lens/`, linked from the Redis Iris context
engine index. Each topic has one home; other pages link to it.

```
lens/

_index.md  Lens
  - What Lens shows you         One trace per agent turn: what was fetched, what entered
                                the prompt, tokens, timing, outcome
  - Why use Lens                See why the agent answered the way it did; Iris products
                                trace themselves; built on OpenTelemetry; works alongside
                                your existing APM
  - How it works                Diagram (lens-how-it-works.svg): your agent > redis-iris
                                SDK > Lens > UI and read API
  - Where to start              Quickstart, concepts, agent frameworks
  (Short Beta note)

concepts.md  Lens concepts
  - Sessions, threads, turns    You choose session and thread IDs; a turn is one trace,
                                and its trace ID is the turn ID. Use opaque values, such as
                                internal IDs or hashes, for all IDs
                                (Diagram: lens-turn.svg)
  - What a turn records         Retrievals, memory recalls, prompt assembly, model calls,
                                tool calls, and Memory, Playbooks, and Context Gateway calls
  - Fetched vs. used context    What a source returned, what entered the prompt, and
                                retrievals that came back empty. Playbook discovery results
                                include their similarity score; Context Gateway results
                                include their hybrid search score
  - Turn outcomes               completed, failed, abandoned, refused, timeout
  - Agents                      One agent ID per agent; all agents share an instance
  - Content capture             Prompts, completions, retrieved text; on by default. With
                                capture off, Lens keeps IDs, hashes, counts, and sizes
  - Retention                   Lens keeps turn structure, timing, and scores for the full
                                retention window; captured text has a shorter window

quickstart.md  Lens quickstart
  - Before you begin            Lens endpoint, ingest key, and read key from your
                                administrator; Python 3.11 or later (TODO: operator link)
  - Install the SDK             redis-iris, plus the llm-tracing extra for model calls
  - Configure the SDK           IRIS_LENS_ENDPOINT, IRIS_LENS_API_KEY, IRIS_LENS_AGENT_ID
  - Trace one turn              Turn + memory recall + prompt assembly; no model key needed
  - Find the turn               Get its ID, open it in the UI, fetch it with the read API
  - Next steps                  Instrument, agent frameworks

instrument.md  Instrument an agent
  - Turn Lens on                Set the endpoint, pass Lens settings to Iris, or call
                                lens.init() to also trace model calls
  - Open a turn                 lens.turn(): session, thread, user, agent, outcome
  - What Iris products record   Memory, Playbooks, and Context Gateway calls record
                                their own steps, sync or async
  - Trace model calls           OpenAI, Anthropic, Bedrock, LangChain with llm-tracing
  - Record retrievals           lens.retrieval(): query, data source, results with scores
  - Record memory recalls       lens.memory_recall()
  - Record prompt assembly      fetched() and used()
  - Add custom spans            lens.span()
  - Include other spans         lens.include() exports spans from other libraries
  - Get the turn ID             current_trace_id(), to link a turn to your own logs
  - Carry a turn across processes  inject() and continue_from()
  - Shut down                   shutdown() flushes and turns Lens off for the process

agent-integration.md  Integrate with agent frameworks
  - Where the turn opens        Table per framework
  - LangGraph                   attach() opens a turn for every graph run
  - OpenAI Agents SDK           Wrap Runner.run in lens.turn()
  - Google ADK                  Wrap runner.run_async in lens.turn()
  - Your own agent loop         workflows.turn() or workflows.aturn()
  - Example: one turn across Iris products  Memory, Playbooks, and Context Gateway

inspect-sessions.md  Inspect sessions
  - Connect to Lens             Sign in, or paste a read key
  - Find a session              Filter by agent, time range, user, outcome, session ID
  - Read a turn's steps         Order, timing, call outcome, result counts, scores
  - View captured content       What each step returned, while its text is retained

configure.md  Configure Lens
  - Settings                    Endpoint, API key, agent ID, service name, enabled,
                                content capture
  - Advanced settings           Own tracer provider, insecure endpoint, drop scopes,
                                drop Redis commands, thread instrumentation
  - API keys and scopes         ingest for agents (IRIS_LENS_API_KEY), read for people and
                                tools (LENS_API_KEY for the read client), full for both;
                                your administrator creates keys (TODO: operator link)
  - Control content capture     For Lens, and separately for your own tracer
  - Use Lens with your existing OpenTelemetry setup  Lens joins your tracer provider;
                                Iris product spans reach your APM whether Lens is on or off
  - Connect over TLS            Use an https endpoint; loopback works for local testing

read-api.md  Query sessions and turns
  - Authenticate                Read key as a bearer token
  - List agents
  - List sessions               Agent ID and time range, optional filters, cursor
                                pagination; the response returns the effective range
  - Get a session               Threads, turns, and outcome counts
  - Get a turn                  Steps and context manifest
  - Get captured content        By content hash
  - Get a Context Gateway tool result

limits.md  Limits and errors
  - Request limits              Up to 200 sessions per page; sessions up to 10,000 turns;
                                ingest requests up to 8 MiB by default; session, thread,
                                user, and agent IDs up to 256 bytes (the SDK truncates
                                longer IDs and logs a warning); your administrator sets
                                retention windows and can change the ingest cap
                                (TODO: operator link)
  - How Lens exports            Export runs in the background and retries transient
                                errors; your agent never waits on or fails because of Lens
  - Errors                      Ingest and read error codes
  - Troubleshoot a missing turn Endpoint not set, process exited before shutdown(),
                                missing session ID

api-reference.md  Lens API reference  (generated from the public read API OpenAPI document)
```

## Examples

Runnable examples use the repo's tabbed code example system: Python sources in
`local_examples/lens/<set>/` with `STEP_START`/`STEP_END` markers, rendered with the
`clients-example` shortcode. cURL goes inline in the shortcode body. Every example reads
its endpoint and keys from environment variables and uses placeholders, never real values.

| Set | Page | Steps | Needs a model key |
|---|---|---|---|
| `quickstart` | quickstart | configure, trace a turn, get the turn ID, fetch the turn (Python and cURL) | No |
| `instrument` | instrument | open a turn, retrieval, memory recall, prompt assembly, custom span, include, cross-process, shutdown | No |
| `langgraph` | agent-integration | attach a graph, run one turn | Yes |
| `openai_agents` | agent-integration | wrap a run in a turn | Yes |
| `google_adk` | agent-integration | wrap a run in a turn | Yes |
| `own_loop` | agent-integration | workflows.turn around one message | No |
| `iris_products` | agent-integration | one turn across Agent Memory, Agent Playbooks, and Context Gateway | No |
| `read_api` | read-api | list agents, list sessions, get a session, get a turn, get content (Python and cURL) | No |

Settings and environment variables on the configure page are plain code blocks, not
example sets.

## Validation

- **Examples:** run every example set end to end against a Lens instance with Agent Memory,
  Agent Playbooks, and Context Gateway available (the iris-onprem-preview local stack works).
  Each run passes when the read API returns the turn the example created, with the expected
  steps. Framework examples run once with a model key.
- **Facts:** check every value in the limits page, the outcome list, and the settings
  against the source files in [Sources](#sources) at the release being documented.
- **Build:** the Hugo build passes with no unresolved link warnings, and every page is
  linked from the section index.

## Remaining work

- [ ] Write the ten pages and two diagrams.
- [ ] Write and validate the example sets.
- [ ] Generate the API reference from the public read API OpenAPI document.
- [ ] Link the section from the context engine index.
- [ ] Technical and docs review.
- [ ] When the MOD-18980 operator pages land, replace the administrator wording and resolve
      the TODO comments.
- [ ] Product owner approves publication. Keep the PR as a draft until then, since merging
      to `main` publishes the pages.
