# EXAMPLE: iris_agent_memory_memory_etl
# HIDE_START
import base64
import os
import time
from pathlib import Path

from redis_iris import Iris

OWNER_ID = "quickstart-user"
EXTRACTOR_ID = os.environ["EXTRACTOR_ID"]
notes = Path("trip-notes.md")
if not notes.exists():
    notes.write_text("Trip to Kyoto, April 3 to April 10. I am vegetarian and want to try local tofu dishes.\n")

memory = Iris.from_env().agent_memory()
# HIDE_END

# STEP_START memory-etl-submit
accepted = memory.client.create_document_ingestion(
    document_id="example-trip-notes",
    revision="1",
    content=base64.b64encode(Path("trip-notes.md").read_bytes()).decode("ascii"),
    media_type="text/markdown",
    owner_id=OWNER_ID,
    extractor_id=EXTRACTOR_ID,
    idempotency_key="example-trip-notes-revision-1",
)
ingestion_id = accepted.result.ingestion_id
print("Ingestion ID:", ingestion_id)
# STEP_END

# STEP_START memory-etl-status
for _ in range(90):
    status = memory.client.get_document_ingestion(ingestion_id=ingestion_id).ingestion.status
    if status.processing.value in {"SUCCEEDED", "PARTIAL", "FAILED"}:
        print(status.model_dump_json(by_alias=True, exclude_none=True))
        break
    time.sleep(10)
else:
    raise TimeoutError(f"Continue polling ingestion {ingestion_id}")
# STEP_END

# STEP_START memory-etl-outputs
output_ids = []
cursor = None
while True:
    page = memory.client.list_document_ingestion_outputs(
        ingestion_id=ingestion_id, limit=100, cursor=cursor
    )
    output_ids.extend(page.items)
    cursor = page.next_cursor
    if not cursor:
        break
print("Output memory IDs:", output_ids)
if status.processing.value != "SUCCEEDED":
    raise RuntimeError(f"Inspect ingestion {ingestion_id}: {status.processing.value}")
if not output_ids:
    raise SystemExit("The extractor published no memories from this document.")
# STEP_END

# STEP_START memory-etl-provenance
memory_id = output_ids[0]
source_cursor = None
while True:
    links = memory.client.list_memory_source_links(
        memory_id=memory_id, limit=100, cursor=source_cursor
    )
    for source in links.items:
        print(source.model_dump_json(by_alias=True, exclude_none=True))
        evidence_cursor = source.evidence_next_cursor
        while evidence_cursor:
            more = memory.client.list_memory_source_evidence(
                memory_id=memory_id, source_id=source.source_id,
                limit=100, cursor=evidence_cursor,
            )
            print(more.source.model_dump_json(by_alias=True, exclude_none=True))
            evidence_cursor = more.source.evidence_next_cursor
        if source.kind.value != "DOCUMENT":
            continue  # reverse lookup covers document sources
        related_cursor = None
        while True:
            related = memory.client.list_source_memories(
                source_id=source.source_id, owner_id=OWNER_ID,
                limit=100, cursor=related_cursor,
            )
            for record in related.items:
                print("From the same source:", record.memory_id, record.text)
            related_cursor = related.next_cursor
            if not related_cursor:
                break
    source_cursor = links.next_cursor
    if not source_cursor:
        break
# STEP_END
