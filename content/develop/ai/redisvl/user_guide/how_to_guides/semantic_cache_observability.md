---
linkTitle: Tune the semantic cache with telemetry
title: Tune the Semantic Cache with Telemetry
aliases:
- /integrate/redisvl/user_guide/how_to_guides/15_semantic_cache_observability
weight: 15
---


This notebook runs a small FAQ cache, sends it a mix of lookups and reads back the telemetry RedisVL emits through [OpenTelemetry](https://opentelemetry.io/): a trace for every lookup, a hit rate, and the distance of the nearest match on every lookup, hits and misses alike. The last part uses those distances to weigh a change to `distance_threshold`.

[Observe the Semantic Cache with OpenTelemetry]({{< relref "observability" >}}) is the reference for every span, metric and attribute used here.

## Prerequisites

- RedisVL with the `otel` extra, the OpenTelemetry SDK and sentence-transformers: `pip install "redisvl[otel]" "opentelemetry-sdk>=1.32" sentence-transformers`
- For the local stack only: the OTLP exporter, `pip install opentelemetry-exporter-otlp-proto-http`, and redis-py 7.4 or later for its command metrics
- A running Redis instance ([Redis 8+](https://redis.io/downloads/) or [Redis Cloud](https://redis.io/cloud)) at `localhost:6379`, or set `REDIS_URL`

To see the same telemetry in Grafana, start the local stack described in the guide's [Explore with a local stack](observability.md#explore-with-a-local-stack) section, and set `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318` before you start Jupyter. Without it, everything stays in memory.

## What you'll learn

- How an application configures OpenTelemetry, and why RedisVL needs nothing more
- What one cache lookup looks like as a trace
- How to read the hit rate and the distance distribution from the metrics
- How to use those distances to judge a threshold change, and where they stop being enough

## Configure OpenTelemetry

RedisVL depends only on the OpenTelemetry API. The application owns the SDK: it sets a tracer provider and a meter provider once, at start-up, and every instrumented library picks them up.

Here both providers keep their data in memory, so the notebook can read it back. When `OTEL_EXPORTER_OTLP_ENDPOINT` is set, they also export it over OTLP, and redis-py's own command metrics are turned on so the dashboard can show search and TTL refresh latency.


```python
import os

from opentelemetry import metrics, trace
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import (
    InMemoryMetricReader,
    PeriodicExportingMetricReader,
)
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor, SimpleSpanProcessor
from opentelemetry.sdk.trace.export.in_memory_span_exporter import (
    InMemorySpanExporter,
)

# The service name identifies this process in every backend.
resource = Resource.create({"service.name": "redisvl-semantic-cache-example"})

spans = InMemorySpanExporter()
tracer_provider = TracerProvider(resource=resource)
tracer_provider.add_span_processor(SimpleSpanProcessor(spans))

reader = InMemoryMetricReader()
metric_readers = [reader]

export_otlp = "OTEL_EXPORTER_OTLP_ENDPOINT" in os.environ
if export_otlp:
    from opentelemetry.exporter.otlp.proto.http.metric_exporter import (
        OTLPMetricExporter,
    )
    from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter

    tracer_provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter()))
    metric_readers.append(
        PeriodicExportingMetricReader(OTLPMetricExporter(), export_interval_millis=10_000)
    )

trace.set_tracer_provider(tracer_provider)
meter_provider = MeterProvider(resource=resource, metric_readers=metric_readers)
metrics.set_meter_provider(meter_provider)

if export_otlp:
    from redis.observability import MetricGroup, OTelConfig, get_observability_instance

    get_observability_instance().init(
        OTelConfig(
            metric_groups=[
                MetricGroup.CONNECTION_BASIC,
                MetricGroup.RESILIENCY,
                MetricGroup.COMMAND,
            ]
        )
    )

print("Exporting over OTLP" if export_otlp else "Keeping telemetry in memory only")
```

    Keeping telemetry in memory only


## Build an FAQ cache

The cache uses `redis/langcache-embed-v2`, an embedding model trained for semantic caching, the default threshold of 0.1 in cosine distance, and a one-hour TTL, which every hit refreshes. Nothing in this cell is specific to OpenTelemetry: the cache reports to whichever providers the application set.


```python
from redisvl.extensions.cache.llm import SemanticCache
from redisvl.utils.vectorize import HFTextVectorizer

os.environ["TOKENIZERS_PARALLELISM"] = "false"

vectorizer = HFTextVectorizer(
    model="redis/langcache-embed-v2",
    cache_folder=os.getenv("SENTENCE_TRANSFORMERS_HOME"),
)
cache = SemanticCache(
    name="faq_cache",
    vectorizer=vectorizer,
    distance_threshold=0.1,
    ttl=3600,
    redis_url=os.getenv("REDIS_URL", "redis://localhost:6379"),
    overwrite=True,
)

faq = {
    "What is the capital of France?": "Paris.",
    "How do I reset my password?": "Choose 'Forgot password' on the sign-in page.",
    "What are your opening hours?": "9am to 6pm, Monday to Saturday.",
    "How long does shipping take?": "Three to five working days.",
    "Can I return an item after 30 days?": "Yes, returns are accepted up to 45 days after delivery.",
}
for prompt, response in faq.items():
    cache.store(prompt=prompt, response=response)

print(f"Stored {len(faq)} entries")
```

    Stored 5 entries


## Send a mix of lookups

The lookups fall into three groups: rewordings of a stored question, which you would want served from the cache; different questions that happen to sit close to a stored one, which you would not; and unrelated questions.


```python
lookups = {
    "How can I reset my password?": "paraphrase",
    "Which city is the capital of France?": "paraphrase",
    "What's the capital city of France?": "paraphrase",
    "What hours are you open?": "paraphrase",
    "How many days does shipping take?": "paraphrase",
    "I forgot my password, how do I reset it?": "paraphrase",
    "Can I exchange an item after 30 days?": "different question",
    "Can I return an item after 60 days?": "different question",
    "What's the weather like today?": "unrelated",
    "Recommend a good book": "unrelated",
    "How do I delete my account?": "unrelated",
}

spans.clear()
for prompt in lookups:
    cache.check(prompt=prompt)
```

`check` returns the matching entries, or an empty list, but never the distance that decided it. RedisVL reports that distance through telemetry instead: each lookup's `retrieval` span carries `redisvl.cache.distance`, the nearest candidate's distance, on misses as well as hits. Matching each lookup span with its retrieval span recovers it:


```python
def lookup_rows(finished):
    by_trace = {}
    for span in finished:
        by_trace.setdefault(span.context.trace_id, {})[span.name.split(" ")[0]] = span
    checks = [s for s in finished if s.name == "semantic_cache.check"]
    for prompt, check in zip(lookups, sorted(checks, key=lambda s: s.start_time)):
        retrieval = by_trace[check.context.trace_id]["retrieval"]
        yield (
            prompt,
            lookups[prompt],
            check.attributes["redisvl.cache.result"],
            retrieval.attributes["redisvl.cache.distance"],
        )


rows = list(lookup_rows(spans.get_finished_spans()))
print(f"{'lookup':42} {'kind':20} {'result':6} distance")
for prompt, kind, result, distance in sorted(rows, key=lambda row: row[3]):
    print(f"{prompt:42} {kind:20} {result:6} {distance:.3f}")
```

    lookup                                     kind                 result distance
    How can I reset my password?               paraphrase           hit    0.025
    Which city is the capital of France?       paraphrase           hit    0.074
    What's the capital city of France?         paraphrase           hit    0.077
    Can I exchange an item after 30 days?      different question   miss   0.113
    How many days does shipping take?          paraphrase           miss   0.126
    What hours are you open?                   paraphrase           miss   0.137
    I forgot my password, how do I reset it?   paraphrase           miss   0.142
    Can I return an item after 60 days?        different question   miss   0.144
    How do I delete my account?                unrelated            miss   0.521
    Recommend a good book                      unrelated            miss   0.632
    What's the weather like today?             unrelated            miss   0.645


Three paraphrases hit. Three more miss by a small margin, at a distance not far above 0.1, and the two different questions sit in the same band. The unrelated lookups are far away. Remember that pattern: it is what the threshold section below is about.

## Read one trace

A **trace** is the record of one operation, made of **spans**: timed steps, each with a name, a parent and attributes. Every `check` produces a `semantic_cache.check` span with two children, one for embedding the prompt and one for the vector search:


```python
def print_trace(finished, trace_id):
    members = sorted(
        (s for s in finished if s.context.trace_id == trace_id),
        key=lambda s: s.start_time,
    )
    for span in members:
        depth = 0 if span.parent is None else 1
        duration_ms = (span.end_time - span.start_time) / 1e6
        print(f"{'    ' * depth}{span.name}  [{span.kind.name}]  {duration_ms:.2f} ms")
        for key, value in span.attributes.items():
            print(f"{'    ' * depth}    {key} = {value}")


finished = spans.get_finished_spans()
first_check = min(
    (s for s in finished if s.name == "semantic_cache.check"), key=lambda s: s.start_time
)
print_trace(finished, first_check.context.trace_id)
```

    semantic_cache.check  [INTERNAL]  19.93 ms
        redisvl.cache.name = faq_cache
        redisvl.cache.result = hit
        embeddings redis/langcache-embed-v2  [CLIENT]  13.06 ms
            gen_ai.operation.name = embeddings
            gen_ai.provider.name = hf
            gen_ai.request.model = redis/langcache-embed-v2
            gen_ai.embeddings.dimension.count = 768
        retrieval faq_cache  [CLIENT]  2.46 ms
            gen_ai.operation.name = retrieval
            gen_ai.data_source.id = faq_cache
            gen_ai.retrieval.top_k = 1
            db.system.name = redis
            db.collection.name = faq_cache
            db.operation.name = FT.SEARCH
            redisvl.cache.distance_threshold = 0.1
            redisvl.cache.distance = 0.0253240466118


Embedding the prompt usually dominates: here it runs a local model, and with a hosted provider it is a network call. The span records no prompt text. RedisVL captures prompts only when you opt in, as the guide's [Privacy](observability.md#privacy-and-content-capture) section describes.

## Read the metrics

Traces describe single operations; **metrics** aggregate them. RedisVL records two histograms for the cache:

- `redisvl.semantic_cache.operation.duration`, one point per operation, split by `redisvl.cache.operation` and, for lookups, by `redisvl.cache.result`. Its `check` count is the number of lookups, so it also gives the hit rate.
- `redisvl.semantic_cache.distance`, the nearest distance of every lookup, in buckets.

A real application exports these every minute or so; here the in-memory reader collects them on demand.


```python
def histogram_points(name):
    data = reader.get_metrics_data()
    for resource_metrics in data.resource_metrics:
        for scope_metrics in resource_metrics.scope_metrics:
            for metric in scope_metrics.metrics:
                if metric.name == name:
                    yield from metric.data.data_points


lookups_by_result = {
    point.attributes["redisvl.cache.result"]: point.count
    for point in histogram_points("redisvl.semantic_cache.operation.duration")
    if point.attributes["redisvl.cache.operation"] == "check"
}
hits, misses = lookups_by_result.get("hit", 0), lookups_by_result.get("miss", 0)
print(f"{hits} hits, {misses} misses: hit rate {hits / (hits + misses):.0%}")
```

    3 hits, 8 misses: hit rate 27%


The distance histogram counts lookups per bucket. Bucket boundaries are 0.01 apart up to 0.1, then coarser up to 2, the largest cosine distance. Printing the misses' non-empty buckets shows where they fall:


```python
distances = {
    point.attributes["redisvl.cache.result"]: point
    for point in histogram_points("redisvl.semantic_cache.distance")
}
miss_distances = distances["miss"]
lower = 0.0
for upper, count in zip(miss_distances.explicit_bounds, miss_distances.bucket_counts):
    if count:
        print(f"{lower:.3f} to {upper:.3f}  {'#' * count}  {count}")
    lower = upper
```

    0.100 to 0.125  #  1
    0.125 to 0.150  ####  4
    0.500 to 0.750  ###  3


## Weigh a threshold change

The histogram answers a "what if" question directly: how many of today's misses would a looser threshold have served? Because each bucket is a count, the share of misses at or below a candidate threshold is the sum of the buckets up to it, divided by all the misses that recorded a distance. A miss with no candidate at all, such as one whose filter excluded every entry, records none. The candidate must be a bucket boundary.


```python
def share_of_misses_within(threshold):
    within = sum(
        count
        for upper, count in zip(miss_distances.explicit_bounds, miss_distances.bucket_counts)
        if upper <= threshold
    )
    return within / miss_distances.count


for candidate in (0.125, 0.15, 0.2):
    print(f"threshold {candidate}: {share_of_misses_within(candidate):.0%} of misses would hit")
```

    threshold 0.125: 12% of misses would hit
    threshold 0.15: 62% of misses would hit
    threshold 0.2: 62% of misses would hit


A looser threshold would serve more lookups, but the metric cannot say whether those matches would be right. This notebook knows which lookups are which, so it can show what loosening to 0.15 would actually serve:


```python
for prompt, kind, result, distance in sorted(rows, key=lambda row: row[3]):
    if result == "miss" and distance <= 0.15:
        print(f"{distance:.3f}  {kind:20} {prompt}")
```

    0.113  different question   Can I exchange an item after 30 days?
    0.126  paraphrase           How many days does shipping take?
    0.137  paraphrase           What hours are you open?
    0.142  paraphrase           I forgot my password, how do I reset it?
    0.144  different question   Can I return an item after 60 days?


The paraphrases are wins. The two different questions are not: each would receive the answer to a question nobody asked. Someone asking about a return after 60 days would be told yes, although the window closes at 45.

In production you do not have the `kind` column. To see which prompts sit near the threshold, turn on content capture for a while, which puts the prompt on each retrieval span, and inspect the traces in that band before moving the threshold. The guide's [Tune the distance threshold](observability.md#tune-the-distance-threshold) section covers this, and the PromQL to run against a real backend.

## Send traffic to the dashboard

This cell only applies when you are exporting to the local stack. It sends a steady stream of the same lookups for three minutes so the dashboard has something to draw, then flushes. Open Grafana at http://localhost:3000 while it runs.


```python
# NBVAL_SKIP
import random
import time

if export_otlp:
    deadline = time.monotonic() + 180
    while time.monotonic() < deadline:
        cache.check(prompt=random.choice(list(lookups)))
        time.sleep(0.2)
    tracer_provider.force_flush()
    meter_provider.force_flush()
    print("Done. Open http://localhost:3000")
else:
    print("Set OTEL_EXPORTER_OTLP_ENDPOINT before starting Jupyter, then rerun the notebook to export.")
```

    Set OTEL_EXPORTER_OTLP_ENDPOINT before starting Jupyter, then rerun the notebook to export.


## Clean up


```python
cache.delete()
tracer_provider.shutdown()
meter_provider.shutdown()
```
