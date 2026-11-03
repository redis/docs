These examples continue from the [quickstart]({{< relref "/develop/ai/context-engine/agent-memory/quickstart" >}}). Load the same `.env` connection values and reuse its user ID. Expand an example to copy a complete program that connects for you.

Each run repeats every write in the program. Session-event writes and memory creates with a new idempotency key add new records, so run cleanup or change the identifiers before rerunning.
