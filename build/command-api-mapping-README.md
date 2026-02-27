# Command API Mapping

The `data/command-api-mapping/` directory contains individual JSON files mapping Redis commands to their client library method signatures.

## Structure

Each file is named after a Redis command (e.g., `GET.json`, `SET.json`, `BF.ADD.json`) and contains the API mappings for that command:

```json
{
  "api_calls": {
    "redis_py": [...],
    "jedis": [...],
    "lettuce_sync": [...],
    "lettuce_async": [...],
    "lettuce_reactive": [...],
    "go-redis": [...],
    "node_redis": [...],
    "ioredis": [...],
    "redis_rs_sync": [...],
    "redis_rs_async": [...],
    "nredisstack_sync": [...],
    "nredisstack_async": [...],
    "php": [...]
  }
}
```

## Adding a New Command

1. Create a new file named `data/command-api-mapping/COMMAND_NAME.json` (e.g., `MGET.json`)
2. Add the `api_calls` structure with method signatures for each client
3. Run the merge script to generate the combined output

## Merging Files

To combine all individual files into a single `command-api-mapping.json`:

```bash
./build/merge-command-api-mapping.sh                      # Output to data/command-api-mapping.json
./build/merge-command-api-mapping.sh /path/to/output.json # Output to custom location
```

## Files

- `data/command-api-mapping/*.json` - Individual command mapping files (273 commands)
- `build/merge-command-api-mapping.sh` - Script to combine all files into a single JSON
- `build/command-api-mapping-README.md` - This file

