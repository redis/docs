# Redis agent memory demo (Java + Jedis)

See `_index.md` for the full walkthrough. Quick start:

```bash
# 1. Make sure Redis with the Search and JSON modules is running on
#    localhost:6379 (Redis Stack ships both, or Redis 8 with the
#    modules enabled).
# 2. Build the fat jar (first build pulls Jedis, DJL, and the PyTorch
#    native libraries; takes a minute or two):
mvn -q package

# 3. Run. The first run downloads the
#    sentence-transformers/all-MiniLM-L6-v2 PyTorch weights into the
#    local DJL cache (~90 MB).
java -jar target/agent-memory-jedis.jar

# Or with Maven directly:
mvn -q exec:java
```

Then open <http://localhost:8092>.

Notable flags (full list with `--help`):

| Flag                          | Default            |
|-------------------------------|--------------------|
| `--port`                      | `8092`             |
| `--redis-host`                | `localhost`        |
| `--redis-port`                | `6379`             |
| `--mem-index-name`            | `agentmem:idx`     |
| `--mem-key-prefix`            | `agent:mem:`       |
| `--session-key-prefix`        | `agent:session:`   |
| `--event-key-prefix`          | `agent:events:`    |
| `--session-ttl-seconds`       | `3600`             |
| `--dedup-threshold`           | `0.20`             |
| `--recall-threshold`          | `0.55`             |
| `--no-reset`                  | (off — re-seed)    |
