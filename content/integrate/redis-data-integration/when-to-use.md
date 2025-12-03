---
Title: When to use RDI
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Understand when (and when not) to use RDI.
group: di
hideListLinks: false
linkTitle: When to use RDI
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 5
---

RDI is designed to support apps that must use a disk based database as the system of record
but must also be fast and scalable. This is a common requirement for mobile and web
apps with a rapidly-growing number of users; the performance of the main database is fine at first
but it will soon struggle to handle the increasing demand without a cache.

## When to use RDI

You should use RDI when:

- You must use a slow database as the system of record for the app.
- The app must always *write* its data to the slow database.
- You already intend to use Redis for the app cache.
- The data changes frequently in small increments.
- Your app can tolerate *eventual* consistency of data in the Redis cache.
- RDI throughput during
  [full sync]({{< relref "/integrate/redis-data-integration/data-pipelines#pipeline-lifecycle" >}}) would not exceed 30K records per second and during
  [CDC]({{< relref "/integrate/redis-data-integration/data-pipelines#pipeline-lifecycle" >}})
  would not exceed 10K records per second.

## When not to use RDI

You should *not* use RDI when:

- You are migrating an existing data set into Redis only once.
- Your app needs *immediate* cache consistency rather than *eventual* consistency.
- The data is ingested from two replicas of Active-Active at the same time.
- The app must *write* data to the Redis cache, which then updates the source database.
- Your data set will only ever be small.
- Your data is updated by some batch or ETL process with long and large transactions - RDI will fail
  processing these changes.

## Decision tree for using RDI

Use the decision tree below to determine whether RDI is a good fit for your architecture:

```decision-tree {id="when-to-use-rdi"}
id: when-to-use-rdi
scope: rdi
rootQuestion: systemOfRecord
questions:
    systemOfRecord:
        text: |
            Does your app require a disk-based database as the system of record?
        whyAsk: |
            RDI is designed to keep Redis in sync with a primary database. If you don't need a primary database, RDI is not necessary.
        answers:
            yes:
                value: "Yes"
                nextQuestion: writeLocation
            no:
                value: "No"
                outcome:
                    label: "RDI is not necessary for your use case"
                    id: notNecessary
                    sentiment: "negative"
    writeLocation:
        text: |
            Does your app write data directly to the disk-based database?
        whyAsk: |
            RDI requires the primary database to be the system of record. If your app writes to Redis first, RDI won't work.
        answers:
            yes:
                value: "Yes"
                nextQuestion: consistency
            no:
                value: "No"
                outcome:
                    label: "RDI won't work - your app must write to the primary database"
                    id: wrongWritePattern
                    sentiment: "negative"
    consistency:
        text: |
            Can your app tolerate eventual consistency in the Redis cache?
        whyAsk: |
            RDI provides eventual consistency, not immediate consistency. If your app needs real-time cache consistency, RDI is not suitable.
        answers:
            yes:
                value: "Yes"
                nextQuestion: throughput
            no:
                value: "No"
                outcome:
                    label: "RDI is not suitable - you need immediate cache consistency"
                    id: needsImmediate
                    sentiment: "negative"
    throughput:
        text: |
            Will your throughput stay within RDI limits (≤30K records/sec during full sync, ≤10K records/sec during CDC)?
        whyAsk: |
            RDI has throughput limits. Exceeding these limits will cause processing failures and data loss.
        answers:
            yes:
                value: "Yes"
                nextQuestion: dataPattern
            no:
                value: "No"
                outcome:
                    label: "RDI throughput limits will be exceeded"
                    id: exceedsLimits
                    sentiment: "negative"
    dataPattern:
        text: |
            Is your data updated frequently in small increments (not by batch/ETL with large transactions)?
        whyAsk: |
            RDI captures changes from the database transaction log. Large batch transactions or ETL processes can cause RDI to fail.
        answers:
            yes:
                value: "Yes"
                nextQuestion: dataSize
            no:
                value: "No"
                outcome:
                    label: "RDI will fail with batch/ETL processes and large transactions"
                    id: batchProcessing
                    sentiment: "negative"
    dataSize:
        text: |
            Is your data set large enough to benefit from caching?
        whyAsk: |
            RDI adds operational complexity. If your data set is small, you may not need caching at all.
        answers:
            yes:
                value: "Yes"
                nextQuestion: dataSource
            no:
                value: "No"
                outcome:
                    label: "RDI is not necessary - your data set is too small"
                    id: tooSmall
                    sentiment: "negative"
    dataSource:
        text: |
            Is your data ingested from a single source (not from two Active-Active replicas simultaneously)?
        whyAsk: |
            RDI cannot handle data ingested from two Active-Active replicas at the same time, as this creates conflicting change events.
        answers:
            yes:
                value: "Yes"
                outcome:
                    label: "✅ RDI is a good fit for your use case"
                    id: goodFit
                    sentiment: "positive"
            no:
                value: "No"
                outcome:
                    label: "RDI won't work with Active-Active replicas"
                    id: activeActive
                    sentiment: "negative"
```


