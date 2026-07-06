---
linkTitle: "Migrate an index: vector quantization, resume, backup, and wizard"
title: "Migrate an Index: Vector Quantization, Resume, Backup, and Wizard"
weight: 14
url: '/develop/ai/redisvl/0.20.1/user_guide/how_to_guides/index_migration/'
---


{{< warning >}}
The index migrator is an **experimental** feature. APIs, CLI commands, and
on-disk formats (plans, backups) may change in future releases. Review
migration plans carefully before applying them to production indexes.
{{< /warning >}}

This guide walks through a **vector quantization** migration
(`float32` -> `float16`) end to end using the programmatic API. You will
learn how to:

- Build a schema patch that describes the change
- Generate and review a migration **plan** (read-only)
- **Apply** the migration with a mandatory on-disk backup
- Find **where the backup lives** and inspect its progress header
- Understand **crash-safe resume** and safely re-run a migration
- **Reload original vectors from the backup** (rollback)
- Build and apply the same migration through the **wizard**

For conceptual background see
[Index Migrations]({{< relref "../../concepts/index-migrations" >}}) and the
[Migrate an Index how-to]({{< relref "migrate-indexes" >}}).

**Prerequisites:** a running Redis 8.0+ (or Redis Stack) at
`redis://localhost:6379` and `redisvl` installed.


```python
import os
import glob
import numpy as np
import yaml

from redisvl.index import SearchIndex
from redisvl.redis.utils import array_to_buffer
from redisvl.query import VectorQuery

REDIS_URL = "redis://localhost:6379"
INDEX_NAME = "products"
DIMS = 8
N_DOCS = 600

np.random.seed(42)


def delete_matching(client, pattern, batch_size=500):
    deleted = 0
    batch = []
    for key in client.scan_iter(match=pattern, count=batch_size):
        batch.append(key)
        if len(batch) >= batch_size:
            deleted += client.delete(*batch)
            batch = []
    if batch:
        deleted += client.delete(*batch)
    return deleted
```

## 1. Create a source index with float32 vectors

We start with a small Hash index whose `embedding` field stores full
precision `float32` vectors, then load some random data.


```python
schema = {
    "index": {
        "name": INDEX_NAME,
        "prefix": "product",
        "storage_type": "hash",
    },
    "fields": [
        {"name": "name", "type": "text"},
        {"name": "category", "type": "tag"},
        {
            "name": "embedding",
            "type": "vector",
            "attrs": {
                "algorithm": "flat",
                "dims": DIMS,
                "distance_metric": "cosine",
                "datatype": "float32",
            },
        },
    ],
}

index = SearchIndex.from_dict(schema, redis_url=REDIS_URL)
if index.exists():
    index.delete(drop=True)
stale_keys = delete_matching(index.client, "product:*")
if stale_keys:
    print(f"Removed {stale_keys} stale demo key(s)")
index.create()

vectors = np.random.rand(N_DOCS, DIMS).astype(np.float32)
data = [
    {
        "name": f"product {i}",
        "category": "electronics" if i % 2 == 0 else "books",
        "embedding": array_to_buffer(vectors[i], dtype="float32"),
    }
    for i in range(N_DOCS)
]
keys = index.load(data)
print(f"Loaded {len(keys)} documents into '{INDEX_NAME}'")
```

    Loaded 600 documents into 'products'



```python
!rvl index listall --url redis://localhost:6379
```

    Indices:
    1. products


## 2. Describe the change with a schema patch

A **schema patch** lists only what changes. Here we update the
`embedding` field's datatype from `float32` to `float16` (a 2x memory
reduction). We write it to a YAML file the planner can read.


```python
patch = {
    "version": 1,
    "changes": {
        "update_fields": [
            {"name": "embedding", "attrs": {"datatype": "float16"}},
        ]
    },
}

with open("schema_patch.yaml", "w") as f:
    yaml.safe_dump(patch, f, sort_keys=False)

print(open("schema_patch.yaml").read())
```

    version: 1
    changes:
      update_fields:
      - name: embedding
        attrs:
          datatype: float16
    


## 3. Create a migration plan (read-only)

`create_plan` snapshots the live index, diffs it against the patch, and
returns a `MigrationPlan`. **No data is modified.** Review the warnings
and the classified changes before applying.


```python
from redisvl.migration import MigrationPlanner, MigrationExecutor
from redisvl.migration.utils import write_yaml

planner = MigrationPlanner()
plan = planner.create_plan(
    index_name=INDEX_NAME,
    schema_patch_path="schema_patch.yaml",
    redis_url=REDIS_URL,
)

print("Index:     ", plan.source.index_name)
print("Mode:      ", plan.mode)
print("Requested: ", plan.requested_changes)
print("Warnings:  ")
for w in plan.warnings:
    print("  -", w)

# Plans can be persisted to YAML and reloaded later (or via the CLI)
write_yaml(plan.model_dump(), "migration_plan.yaml")
print("\nSaved plan to migration_plan.yaml")
```

    Index:      products
    Mode:       drop_recreate
    Requested:  {'version': 1, 'changes': {'add_fields': [], 'remove_fields': [], 'update_fields': [{'name': 'embedding', 'attrs': {'datatype': 'float16'}, 'options': {}}], 'rename_fields': [], 'index': {}}}
    Warnings:  
      - Index downtime is required
    
    Saved plan to migration_plan.yaml


## 4. Apply the migration with a mandatory backup

The executor requires `backup_dir` before applying any migration. For
quantization, it writes original vectors to disk before mutating them. If
you omit `backup_dir`, or pass a path that cannot be created or written,
the migration fails before touching the index. The returned report records
the resolved backup directory and any backup file prefixes used.

We also pass a `progress_callback` to watch each phase.

{{< note >}}
This drops and recreates the index definition. Documents are preserved;
only the index structure and vector encoding change. Pause writes during
the migration window.
{{< /note >}}


```python
BACKUP_DIR = "./migration_backups"

# The migration does not start without a usable backup directory.
executor = MigrationExecutor()
try:
    executor.apply(plan, redis_url=REDIS_URL, backup_dir=None)
except ValueError as exc:
    print("Missing backup_dir is rejected before migration:", exc)

BAD_BACKUP_DIR = "./not_a_backup_dir"
if os.path.isdir(BAD_BACKUP_DIR):
    os.rmdir(BAD_BACKUP_DIR)
with open(BAD_BACKUP_DIR, "w") as f:
    f.write("this file intentionally blocks directory creation")
try:
    executor.apply(plan, redis_url=REDIS_URL, backup_dir=BAD_BACKUP_DIR)
except ValueError as exc:
    print("Invalid backup_dir is rejected before migration:", exc)
finally:
    if os.path.exists(BAD_BACKUP_DIR):
        os.remove(BAD_BACKUP_DIR)


def on_progress(step, detail=None):
    print(f"[{step}] {detail or ''}")


report = executor.apply(
    plan,
    redis_url=REDIS_URL,
    backup_dir=BACKUP_DIR,
    batch_size=100,
    num_workers=1,
    progress_callback=on_progress,
)

print("\nResult:           ", report.result)
print("Total duration:   ", report.timings.total_migration_duration_seconds, "s")
print("Quantize duration:", report.timings.quantize_duration_seconds, "s")
print("Schema match:     ", report.validation.schema_match)
print("Doc count match:  ", report.validation.doc_count_match)
print("Backup dir:       ", report.backup.backup_dir)
print("Backup prefixes:  ", report.backup.backup_paths)

BACKUP_PREFIX = report.backup.backup_paths[0]
```

    Missing backup_dir is rejected before migration: A backup directory is required to apply migrations. Provide --backup-dir or backup_dir=...; migrations are not started without a backup directory.
    Invalid backup_dir is rejected before migration: Could not create or access backup directory './not_a_backup_dir': [Errno 17] File exists: 'not_a_backup_dir'. A writable backup directory is required to safely migrate.
    [enumerate] Enumerating indexed documents...
    [enumerate] found 600 documents (0.003s)
    [dump] Backing up original vectors...
    [dump] 100/600 docs
    [dump] 200/600 docs
    [dump] 300/600 docs
    [dump] 400/600 docs
    [dump] 500/600 docs
    [dump] 600/600 docs
    [dump] done (0.009s)
    [drop] Dropping index definition...
    [drop] done (0.001s)
    [quantize] Re-encoding vectors from backup...
    [quantize] 100/600 docs
    [quantize] 200/600 docs
    [quantize] 300/600 docs
    [quantize] 400/600 docs
    [quantize] 500/600 docs
    [quantize] 600/600 docs
    [quantize] done (600 docs in 0.009s)
    [create] Creating index with new schema...


    [create] done (0.004s)
    [index] Waiting for re-indexing...
    [index] 22/115 docs (19%)


    [index] 600/600 docs (100%)
    [index] done (0.508s)
    [validate] Validating migration...
    [validate] done (0.01s)
    
    Result:            succeeded
    Total duration:    0.554 s
    Quantize duration: 0.009 s
    Schema match:      True
    Doc count match:   True
    Backup dir:        /Users/nitin.kanukolanu/workspace/redis-vl-python/docs/user_guide/migration_backups
    Backup prefixes:   ['/Users/nitin.kanukolanu/workspace/redis-vl-python/docs/user_guide/migration_backups/migration_backup_products_0a3e27b8']


## 5. Where is the backup, and what's in it?

Backups are written under `report.backup.backup_dir`. For a single-worker
Hash quantization migration there are two files per index:

- `migration_backup_<index>_<hash>.header` -- JSON: phase + progress counters
- `migration_backup_<index>_<hash>.data` -- binary: original vectors, batched

The `<hash>` suffix is a short digest of the index name, which avoids
collisions. `report.backup.backup_paths` stores the path prefix without
`.header` or `.data`. Multi-worker migrations record one prefix per
worker.

Backups are **retained after success** so you can audit or roll back;
delete them manually when no longer needed.


```python
for path in sorted(glob.glob(os.path.join(report.backup.backup_dir, '*'))):
    size = os.path.getsize(path)
    print(f"{path}  ({size:,} bytes)")
```

    /Users/nitin.kanukolanu/workspace/redis-vl-python/docs/user_guide/migration_backups/migration_backup_products_0a3e27b8.data  (47,730 bytes)
    /Users/nitin.kanukolanu/workspace/redis-vl-python/docs/user_guide/migration_backups/migration_backup_products_0a3e27b8.header  (209 bytes)



```python
from redisvl.migration.backup import VectorBackup

# load() takes the path prefix, without .header or .data.
backup = VectorBackup.load(BACKUP_PREFIX)
h = backup.header
print("backup prefix:             ", BACKUP_PREFIX)
print("index_name:                ", h.index_name)
print("phase:                     ", h.phase)
print("batch_size:                ", h.batch_size)
print("dump_completed_batches:    ", h.dump_completed_batches)
print("quantize_completed_batches:", h.quantize_completed_batches)
```

    backup prefix:              /Users/nitin.kanukolanu/workspace/redis-vl-python/docs/user_guide/migration_backups/migration_backup_products_0a3e27b8
    index_name:                 products
    phase:                      completed
    batch_size:                 100
    dump_completed_batches:     6
    quantize_completed_batches: 6


## 6. Crash-safe resume and checkpointing

If a migration is interrupted by a crash, network drop, or `Ctrl+C`, just
re-run the same command with the same `backup_dir`. The executor loads the
backup header, validates that it belongs to the planned source index, and
continues from the next unfinished batch.

The header is the checkpoint for single-index migrations:

- `phase` shows where the previous run stopped: `dump`, `ready`, `active`, or `completed`
- `dump_completed_batches` counts original-vector batches safely written to `.data`
- `quantize_completed_batches` counts batches already re-encoded and written back to Redis

```bash
# Re-running the same CLI command resumes automatically:
rvl migrate apply --plan migration_plan.yaml \
  --backup-dir ./migration_backups --url redis://localhost:6379
```

Batch migrations use the same per-index backup headers, plus a batch state
YAML file that records the current index, completed indexes, failed
indexes, and the `backup_dir`. Resume rejects a different backup directory
so the checkpoint and backup files stay together.

When `phase` is `completed`, re-running is safe if the live index already
matches the target schema: the executor detects the finished backup, skips
completed work, and leaves the already-created index in place. If you have
rolled back and the live index is back on the source schema, the old
completed backup is stale for a new migration run; the executor discards
that checkpoint and writes a fresh backup.


```python
skip = backup.header.quantize_completed_batches
print(f"Checkpoint says {skip} batch(es) were already quantized.")
print(f"Current phase: {backup.header.phase}")

print("\nRe-running apply with the same backup_dir to exercise resume detection...")
resume_report = executor.apply(
    plan,
    redis_url=REDIS_URL,
    backup_dir=BACKUP_DIR,
    batch_size=100,
    num_workers=1,
    progress_callback=on_progress,
)
print("Resume result:     ", resume_report.result)
print("Resume backup dir: ", resume_report.backup.backup_dir)
print("Resume prefixes:   ", resume_report.backup.backup_paths)
```

    Checkpoint says 6 batch(es) were already quantized.
    Current phase: completed
    
    Re-running apply with the same backup_dir to exercise resume detection...
    [enumerate] skipped (resume from backup)
    [drop] skipped (already dropped)
    [quantize] skipped (already completed)
    [create] Creating index with new schema...
    [create] done (0.004s)
    [index] Waiting for re-indexing...
    [index] 600/600 docs (100%)
    [index] done (0.001s)
    [validate] Validating migration...
    [validate] done (0.008s)
    Resume result:      succeeded
    Resume backup dir:  /Users/nitin.kanukolanu/workspace/redis-vl-python/docs/user_guide/migration_backups
    Resume prefixes:    ['/Users/nitin.kanukolanu/workspace/redis-vl-python/docs/user_guide/migration_backups/migration_backup_products_0a3e27b8']


## 7. Verify the quantized index

The documents were preserved and the `embedding` field is now `float16`.
We reconnect to the live index and run a vector query (encoding the query
vector to match the new datatype).


```python
restored = SearchIndex.from_existing(INDEX_NAME, redis_url=REDIS_URL)
emb = next(f for f in restored.schema.to_dict()['fields'] if f['name'] == 'embedding')
print("embedding datatype now:", emb['attrs']['datatype'])

q = VectorQuery(
    vector=vectors[0].tolist(),
    vector_field_name="embedding",
    return_fields=["name", "category"],
    dtype="float16",
    num_results=3,
)
for r in restored.query(q):
    print(r["name"], "| category:", r["category"], "| dist:", r["vector_distance"])
```

    embedding datatype now: float16
    product 0 | category: electronics | dist: 0
    product 223 | category: books | dist: 0.0458984375
    product 23 | category: books | dist: 0.04736328125


## 8. Recover original vectors from the backup (rollback)

Because the backup holds the original `float32` bytes, you can recover the
pre-migration vector data. The CLI provides a one-liner:

```bash
rvl migrate rollback --backup-dir ./migration_backups \
  --index products --url redis://localhost:6379
```

Below is the equivalent **Python API**: iterate the backup batches and
write the original bytes back with `HSET`. Rollback restores **data only**;
afterwards recreate the original index definition so the index encoding
matches the restored vectors again.


```python
client = restored.client

restored_count = 0
for batch_keys, originals in backup.iter_batches():
    pipe = client.pipeline(transaction=False)
    for key in batch_keys:
        if key in originals:
            for field_name, original_bytes in originals[key].items():
                pipe.hset(key, field_name, original_bytes)
                restored_count += 1
    pipe.execute()

print(f"Restored original bytes for {restored_count} vector field(s)")

# Recreate the ORIGINAL float32 index definition over the restored data
original_index = SearchIndex.from_dict(schema, redis_url=REDIS_URL)
original_index.create(overwrite=True, drop=False)

check = SearchIndex.from_existing(INDEX_NAME, redis_url=REDIS_URL)
emb = next(f for f in check.schema.to_dict()['fields'] if f['name'] == 'embedding')
print("embedding datatype after rollback:", emb['attrs']['datatype'])
```

    Restored original bytes for 600 vector field(s)
    embedding datatype after rollback: float32


## 9. Build and apply a migration with the wizard

For exploratory work, `MigrationWizard` can build the same schema patch and
migration plan interactively. In a notebook, we script the answers so the
cell can execute without blocking. The sequence below means: update a
field, choose `embedding`, keep the current algorithm, change datatype to
`float16`, keep the distance metric, then finish.

The wizard still only creates the patch and plan. Applying the plan remains
a separate reviewed step, and `backup_dir` is still required.


```python
import builtins
import copy
from contextlib import contextmanager

from redisvl.migration import MigrationWizard
from redisvl.migration.utils import wait_for_index_ready

WIZARD_INDEX_NAME = "wizard_products"
WIZARD_PREFIX = "wizard_product"
WIZARD_PATCH_PATH = "wizard_schema_patch.yaml"
WIZARD_PLAN_PATH = "wizard_migration_plan.yaml"
WIZARD_TARGET_SCHEMA_PATH = "wizard_target_schema.yaml"
WIZARD_BACKUP_DIR = "./wizard_migration_backups"

wizard_schema = copy.deepcopy(schema)
wizard_schema["index"]["name"] = WIZARD_INDEX_NAME
wizard_schema["index"]["prefix"] = WIZARD_PREFIX

# Start from a clean wizard demo index and keyspace.
try:
    existing_wizard_index = SearchIndex.from_existing(
        WIZARD_INDEX_NAME, redis_url=REDIS_URL
    )
    existing_wizard_index.delete(drop=True)
except Exception:
    pass
delete_matching(client, f"{WIZARD_PREFIX}:*")

wizard_index = SearchIndex.from_dict(wizard_schema, redis_url=REDIS_URL)
wizard_index.create()
wizard_index.load(data, id_field=None)
wait_for_index_ready(wizard_index)
print(f"Loaded {N_DOCS} documents into '{WIZARD_INDEX_NAME}'")


@contextmanager
def scripted_inputs(answers):
    original_input = builtins.input
    iterator = iter(answers)

    def fake_input(prompt=""):
        answer = next(iterator)
        print(f"{prompt}{answer}")
        return answer

    builtins.input = fake_input
    try:
        yield
    finally:
        builtins.input = original_input


wizard_answers = [
    "2",          # Update field
    "embedding",  # Select the vector field
    "",           # Keep algorithm
    "float16",    # Quantize datatype
    "",           # Keep distance metric
    "8",          # Finish
]

with scripted_inputs(wizard_answers):
    wizard_plan = MigrationWizard().run(
        index_name=WIZARD_INDEX_NAME,
        redis_url=REDIS_URL,
        plan_out=WIZARD_PLAN_PATH,
        patch_out=WIZARD_PATCH_PATH,
        target_schema_out=WIZARD_TARGET_SCHEMA_PATH,
    )

print("\nWizard patch:")
print(open(WIZARD_PATCH_PATH).read())
print("Wizard plan mode:", wizard_plan.mode)
print("Wizard warnings:", wizard_plan.warnings)
```

    Loaded 600 documents into 'wizard_products'
    Building a migration plan for index 'wizard_products'
    Current schema:
    - Index name: wizard_products
    - Storage type: hash
      - name (text)
      - category (tag)
      - embedding (vector)
    
    Choose an action:
    1. Add field        (text, tag, numeric, geo)
    2. Update field     (sortable, weight, separator, vector config)
    3. Remove field
    4. Rename field     (rename field in all documents)
    5. Rename index     (change index name)
    6. Change prefix    (rename all keys)
    7. Preview patch    (show pending changes as YAML)
    8. Finish
    Enter a number: 2
    Updatable fields:
    1. name (text)
    2. category (tag)
    3. embedding (vector)
    Select a field to update by number or name: embedding
    Current vector config for 'embedding':
      algorithm: FLAT
      datatype: float32
      distance_metric: cosine
      dims: 8 (cannot be changed)
    
    Leave blank to keep current value.
      Algorithm: vector search method (FLAT=brute force, HNSW=graph, SVS-VAMANA=compressed graph)
    Algorithm [current: FLAT]: 
      Datatype: float16, float32, bfloat16, float64, int8, uint8
                (float16 reduces memory ~50%, int8/uint8 reduce ~75%)
    Datatype [current: float32]: float16
      Distance metric: how similarity is measured (cosine, l2, ip)
    Distance metric [current: cosine]: 
    
    Choose an action:
    1. Add field        (text, tag, numeric, geo)
    2. Update field     (sortable, weight, separator, vector config)
    3. Remove field
    4. Rename field     (rename field in all documents)
    5. Rename index     (change index name)
    6. Change prefix    (rename all keys)
    7. Preview patch    (show pending changes as YAML)
    8. Finish
    Enter a number: 8
    
    Wizard patch:
    version: 1
    changes:
      add_fields: []
      remove_fields: []
      update_fields:
      - name: embedding
        attrs:
          datatype: float16
        options: {}
      rename_fields: []
      index: {}
    
    Wizard plan mode: drop_recreate
    Wizard warnings: ['Index downtime is required']



```python
wizard_report = MigrationExecutor().apply(
    wizard_plan,
    redis_url=REDIS_URL,
    backup_dir=WIZARD_BACKUP_DIR,
    batch_size=100,
    num_workers=1,
)

wizard_live = SearchIndex.from_existing(WIZARD_INDEX_NAME, redis_url=REDIS_URL)
wizard_embedding = next(
    f for f in wizard_live.schema.to_dict()["fields"] if f["name"] == "embedding"
)

print("Wizard migration result:", wizard_report.result)
print("Wizard schema match:    ", wizard_report.validation.schema_match)
print("Wizard doc count match: ", wizard_report.validation.doc_count_match)
print("Wizard backup dir:      ", wizard_report.backup.backup_dir)
print("Wizard backup prefixes: ", wizard_report.backup.backup_paths)
print("Wizard embedding dtype: ", wizard_embedding["attrs"]["datatype"])
```

    Wizard migration result: succeeded
    Wizard schema match:     True
    Wizard doc count match:  True
    Wizard backup dir:       /Users/nitin.kanukolanu/workspace/redis-vl-python/docs/user_guide/wizard_migration_backups
    Wizard backup prefixes:  ['/Users/nitin.kanukolanu/workspace/redis-vl-python/docs/user_guide/wizard_migration_backups/migration_backup_wizard_products_def8cdf8']
    Wizard embedding dtype:  float16


## 10. Cleanup (optional)

Remove the demo indexes and the artifacts this notebook created. In
production, delete backups only once you are certain rollback is no longer
needed.


```python
delete_matching(client, "product:*")
if check.exists():
    check.delete(drop=False)

delete_matching(client, f"{WIZARD_PREFIX}:*")
if wizard_live.exists():
    wizard_live.delete(drop=False)

for backup_dir in (report.backup.backup_dir, wizard_report.backup.backup_dir):
    for f in glob.glob(os.path.join(backup_dir, '*')):
        os.remove(f)
    if os.path.isdir(backup_dir):
        os.rmdir(backup_dir)

for f in (
    "schema_patch.yaml",
    "migration_plan.yaml",
    "not_a_backup_dir",
    WIZARD_PATCH_PATH,
    WIZARD_PLAN_PATH,
    WIZARD_TARGET_SCHEMA_PATH,
):
    if os.path.exists(f):
        os.remove(f)
print("Cleaned up demo indexes, demo keys, backups, and YAML files")
```

    Cleaned up demo indexes, demo keys, backups, and YAML files


## Learn more

- [Migrate an Index (how-to)]({{< relref "migrate-indexes" >}}) -- full CLI
  workflow, batch migration, performance tuning, and troubleshooting
- [Index Migrations (concepts)]({{< relref "../../concepts/index-migrations" >}}) -- modes,
  supported vs blocked changes, backup internals, sync vs async
- For very large datasets, use `num_workers > 1` and the async executor
  (`AsyncMigrationExecutor`) to parallelize re-encoding.
