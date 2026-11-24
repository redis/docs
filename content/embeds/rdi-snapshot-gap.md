A new snapshot copies existing source rows. It does not replay missed deletes or remove
target records for rows absent from the snapshot.

The timeline shows one row whose delete event is lost before collection resumes.
Time progresses from top to bottom.

```mermaid
%%{init: {"sequence": {"actorMargin": 15, "diagramMarginX": 5, "width": 90, "mirrorActors": false}}}%%
sequenceDiagram
    participant Source as Source<br/>database
    participant RDI as RDI<br/>collector
    participant Redis as Target<br/>Redis

    Source->>RDI: Capture<br/>row 42
    RDI->>Redis: Write<br/>row 42
    Note over RDI: Collection stops
    Note over Source: Delete row 42
    Note over Source,RDI: Required log<br/>history expires
    RDI->>Source: Restart with<br/>when_needed
    Note over Source,RDI: Saved position unavailable<br/>New snapshot
    Source->>RDI: Current rows<br/>(without row 42)
    RDI->>Redis: Write snapshot<br/>rows
    Note over Redis: Row 42 is stale<br/>Delete missed
```

An interruption alone does not cause this gap. If the saved position and the required
log history are still available, the collector can resume and capture the delete.
In this example, the history expires before the collector resumes, and the new snapshot
contains no row 42 to overwrite or delete its target record. Streaming resumes after
the snapshot, but the stale record can remain in Redis.
