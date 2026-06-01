# Redis semantic-cache demo (Java + Jedis)

See `_index.md` for the full walkthrough. Quick start:

```bash
# 1. Make sure Redis with the Search module is running on localhost:6379.
# 2. Build the fat jar (first build pulls Jedis, DJL, and the PyTorch
#    native libraries; takes a minute or two):
mvn -q package

# 3. Run. The first run downloads the sentence-transformers/all-MiniLM-L6-v2
#    PyTorch weights into the local DJL cache (~90 MB).
java -jar target/semantic-cache-jedis.jar

# Or with Maven directly:
mvn -q exec:java
```

Then open <http://localhost:8089>.

Notable flags (full list with `--help`):

| Flag                      | Default            |
|---------------------------|--------------------|
| `--port`                  | `8089`             |
| `--redis-host`            | `localhost`        |
| `--redis-port`            | `6379`             |
| `--index-name`            | `semcache:idx`     |
| `--key-prefix`            | `cache:`           |
| `--ttl-seconds`           | `3600`             |
| `--threshold`             | `0.5`              |
| `--llm-latency-ms`        | `1500.0`           |
| `--no-reset`              | (re-seeds by default) |
