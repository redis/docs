### When to use RDI

RDI is a good fit when:

- You want your app/micro-services to read from Redis to scale reads at speed.
- You want to transfer data to Redis from one or more source databases.
- You must use a slow database as the system of record for the app.
- The app must always *write* its data to the slow database.
- Your app can tolerate *eventual* consistency of data in the Redis cache.
- You want a self-managed solution or AWS based solution.
- The source data changes frequently in small increments.
- The source database has no more than 20K changes per second.
- RDI throughput during [full sync](/content/integrate/redis-data-integration/data-pipelines/_index.md#pipeline-lifecycle)
  stays below 60K records per second, assuming an average record size of 1KB and a pipeline without transformations.
- RDI throughput during [CDC](/content/integrate/redis-data-integration/data-pipelines/_index.md#pipeline-lifecycle)
  stays below 20K records per second, assuming an average record size of 1KB and a pipeline without transformations.
- The total data size is no larger than 200GB, so a full sync completes in under an hour without exceeding the throughput
  limits above. RDI can ingest larger datasets, but it will take longer than an hour.
- You don’t need to perform join operations on the data from several tables
  into a [nested Redis JSON object](/content/integrate/redis-data-integration/data-pipelines/data-denormalization.md#joining-one-to-many-relationships).
- RDI supports the [data transformations](/content/integrate/redis-data-integration/data-pipelines/transform-examples/_index.md) you need for your app.
- Your data caching needs are too complex or demanding to implement and maintain yourself.
- Your database administrator has reviewed RDI's requirements for the source database and
  confirmed that they are acceptable.
