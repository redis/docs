
```decision-tree {id="when-to-use-rdi"}
id: when-to-use-rdi
scope: rdi
indentWidth: 25
rootQuestion: cacheTarget
questions:
    cacheTarget:
        text: |
            Do you want to use Redis as the target database?
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
                    label: "⚠️ Check deployment options to see if RDI is suitable for your needs before proceeding"
                    id: deploymentMismatch
                    sentiment: "indeterminate"
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
                    label: "⚠️ Check that RDI's performance meets your latency requirements before proceeding (RDI can't guarantee *immediate* consistency)"
                    id: needsImmediate
                    sentiment: "indeterminate"
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
                    label: "⚠️ Check that RDI can handle your data change pattern before proceeding (RDI will fail with batch/ETL processes and transactions beyond a certain size)"
                    id: batchProcessing
                    sentiment: "indeterminate"
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
                    label: "⚠️ RDI is fast but there are practical limits on throughput - check that RDI can handle your change rate before proceeding"
                    id: exceedsChangeRate
                    sentiment: "indeterminate"
            yes:
                value: "Yes"
                nextQuestion: dataSize
    dataSize:
        text: |
            Is your total data size smaller than 100GB?
        whyAsk: |
            RDI has practical limits on the total data size it can manage, based
            on the throughput requirements for full sync.
        answers:
            no:
                value: "No"
                outcome:
                    label: "⚠️ RDI might be unacceptably slow during the full-sync phase. Check that performance will be acceptable for your needs"
                    id: dataTooLarge
                    sentiment: "indeterminate"
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
                    label: "⚠️ RDI may not be suitable - complex joins are not well supported, so check that RDI's data transformations will meet your needs"
                    id: complexJoins
                    sentiment: "indeterminate"
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
                    label: "⚠️ RDI supports a wide range of data transformations, but doesn't support free-form code execution. Check that RDI's data transformations will meet your needs"
                    id: unsupportedTransformations
                    sentiment: "indeterminate"
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
                    label: "⚠️ RDI has requirements that might conflict with practical considerations for your database (such as security policies). Check with your DBA before proceeding"
                    id: adminReviewNeeded
                    sentiment: "indeterminate"
            yes:
                value: "Yes"
                outcome:
                    label: "✅ RDI is a good fit for your use case"
                    id: goodFit
                    sentiment: "positive"
```
