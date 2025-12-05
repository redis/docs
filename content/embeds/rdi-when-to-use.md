### When to use RDI

RDI is a good fit when:

- You want to use Redis as the target database for caching data.
- You want to transfer data to Redis from a *single* source database.
- You must use a slow database as the system of record for the app.
- The app must always *write* its data to the slow database.
- Your app can tolerate *eventual* consistency of data in the Redis cache.
- You want a self-managed solution or AWS based solution.
- The source data changes frequently in small increments.
- There are no more than 10K changes per second in the source database.
- The total data size is not larger than 100GB.
- RDI throughput during
  [full sync]({{< relref "/integrate/redis-data-integration/data-pipelines#pipeline-lifecycle" >}}) would not exceed 30K records per second and during
  [CDC]({{< relref "/integrate/redis-data-integration/data-pipelines#pipeline-lifecycle" >}})
  would not exceed 10K records per second.
- You don’t need to perform join operations on the data from several tables
  into a [nested Redis JSON object]({{< relref "/integrate/redis-data-integration/data-pipelines/data-denormalization#joining-one-to-many-relationships" >}}).
- RDI supports the [data transformations]({{< relref "/integrate/redis-data-integration/data-pipelines/transform-examples" >}}) you need for your app.
- Your data caching needs are too complex or demanding to implement and maintain yourself.
- Your database administrator has reviewed RDI's requirements for the source database and
  confirmed that they are acceptable.

### When not to use RDI

RDI is not a good fit when:

- You are migrating an existing data set into Redis only once.
- Your app needs *immediate* cache consistency (or a hard limit on latency) rather
  than *eventual* consistency.
- You need *transactional* consistency between the source and target databases.
- The data is ingested from two replicas of Active-Active at the same time.
- The app must *write* data to the Redis cache, which then updates the source database.
- Your data set will only ever be small.
- Your data is updated by some batch or ETL process with long and large transactions - RDI will fail
  processing these changes.
- You need complex stream processing of data (aggregations, sliding window processing, complex 
  custom logic).
- You need to write data to multiple targets from the same pipeline (Redis supports other
  ways to replicate data across Redis databases such as replicaOf and  Active Active).
- Your database administrator has rejected RDI's requirements for the source database.

### Decision tree for using RDI

Use the decision tree below to determine whether RDI is a good fit for your architecture:

```decision-tree {id="when-to-use-rdi"}
id: when-to-use-rdi
scope: rdi
indentWidth: 25
rootQuestion: cacheTarget
questions:
    cacheTarget:
        text: |
            Do you want to use Redis as the target database for caching data?
        whyAsk: |
            RDI is specifically designed to keep Redis in sync with a primary database. If you don't need Redis as a cache, RDI is not the right tool.
        answers:
            no:
                value: "No"
                outcome:
                    label: "❌ RDI only works with Redis as the target database"
                    id: noRedisCache
                    sentiment: "negative"
            yes:
                value: "Yes"
                nextQuestion: singleSource
    singleSource:
        text: |
            Are you transferring data from a single source database?
        whyAsk: |
            RDI is designed to work with a single source database. Multiple sources or Active-Active replicas create conflicting change events.
        answers:
            no:
                value: "No"
                outcome:
                    label: "❌ RDI won't work with multiple source databases"
                    id: multipleSourcesOrActiveActive
                    sentiment: "negative"
            yes:
                value: "Yes"
                nextQuestion: systemOfRecord
    systemOfRecord:
        text: |
            Does your app always *write* to the source database and not to Redis?
        whyAsk: |
            RDI requires the source database to be the authoritative source of truth. If your app writes to Redis first, RDI won't work.
        answers:
            no:
                value: "No"
                outcome:
                    label: "❌ RDI doesn't support syncing data from Redis back to the source database"
                    id: notSystemOfRecord
                    sentiment: "negative"
            yes:
                value: "Yes"
                nextQuestion: consistency
    consistency:
        text: |
            Can your app tolerate eventual consistency in the Redis cache?
        whyAsk: |
            RDI provides eventual consistency, not immediate consistency. If your app needs real-time cache consistency or hard latency limits, RDI is not suitable.
        answers:
            no:
                value: "No"
                outcome:
                    label: "❌ RDI does not provide immediate cache consistency"
                    id: needsImmediate
                    sentiment: "negative"
            yes:
                value: "Yes"
                nextQuestion: deployment
    deployment:
        text: |
            Do you want a self-managed solution or an AWS-based solution?
        whyAsk: |
            RDI is available as a self-managed solution or as an AWS-based managed service. If you need a different deployment model, RDI may not be suitable.
        answers:
            no:
                value: "No"
                outcome:
                    label: "❌ RDI may not be suitable - check deployment options"
                    id: deploymentMismatch
                    sentiment: "negative"
            yes:
                value: "Yes"
                nextQuestion: dataChangePattern
    dataChangePattern:
        text: |
            Does your source data change frequently in small increments?
        whyAsk: |
            RDI captures changes from the database transaction log. Large batch transactions or ETL processes can cause RDI to fail.
        answers:
            no:
                value: "No"
                outcome:
                    label: "❌ RDI will fail with batch/ETL processes and large transactions"
                    id: batchProcessing
                    sentiment: "negative"
            yes:
                value: "Yes"
                nextQuestion: changeRate
    changeRate:
        text: |
            Are there fewer than 10K changes per second in the source database?
        whyAsk: |
            RDI has throughput limits. Exceeding these limits will cause processing failures and data loss.
        answers:
            no:
                value: "No"
                outcome:
                    label: "❌ RDI throughput limits will be exceeded"
                    id: exceedsChangeRate
                    sentiment: "negative"
            yes:
                value: "Yes"
                nextQuestion: dataSize
    dataSize:
        text: |
            Is your total data size smaller than 100GB?
        whyAsk: |
            RDI has practical limits on the total data size it can manage. Very large datasets may exceed these limits.
        answers:
            no:
                value: "No"
                outcome:
                    label: "❌ RDI may not be suitable - your data set is probably too large"
                    id: dataTooLarge
                    sentiment: "negative"
            yes:
                value: "Yes"
                nextQuestion: joins
    joins:
        text: |
            Do you need to perform join operations on data from several tables into a nested Redis JSON object?
        whyAsk: |
            RDI has limitations with complex join operations. If you need to combine data from multiple tables into nested structures, you may need custom transformations.
        answers:
            yes:
                value: "Yes"
                outcome:
                    label: "❌ RDI may not be suitable - complex joins are not well supported"
                    id: complexJoins
                    sentiment: "negative"
            no:
                value: "No"
                nextQuestion: transformations
    transformations:
        text: |
            Does RDI support the data transformations you need for your app?
        whyAsk: |
            RDI provides built-in transformations, but if you need custom logic beyond what RDI supports, you may need a different approach.
        answers:
            no:
                value: "No"
                outcome:
                    label: "❌ RDI may not be able to perform the required data transformations"
                    id: unsupportedTransformations
                    sentiment: "negative"
            yes:
                value: "Yes"
                nextQuestion: adminReview
    adminReview:
        text: |
            Has your database administrator reviewed RDI's requirements for the source database
            and confirmed they are acceptable?
        whyAsk: |
            RDI has specific requirements for the source database (binary logging, permissions, etc.). Your DBA must confirm these are acceptable before proceeding.
        answers:
            no:
                value: "No"
                outcome:
                    label: "❌ RDI requirements for the source database can't be met"
                    id: adminRejected
                    sentiment: "negative"
            yes:
                value: "Yes"
                outcome:
                    label: "✅ RDI is a good fit for your use case"
                    id: goodFit
                    sentiment: "positive"
```
