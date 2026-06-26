### When to use RDI

RDI is a good fit when:

- You want your app/micro-services to read from Redis to scale reads at speed.
- You want to transfer data to Redis from a *single* source database.
- You must use a slow database as the system of record for the app.
- The app must always *write* its data to the slow database.
- Your app can tolerate *eventual* consistency of data in the Redis cache.
- You want a self-managed solution or AWS based solution.
- The source data changes frequently in small increments.
- The source database has no more than 10K changes per second.
- RDI throughput during [full sync]({{< relref "/integrate/redis-data-integration/data-pipelines#pipeline-lifecycle" >}})
  stays below 30K records per second, assuming an average record size of 1KB and a pipeline without transformations.
- RDI throughput during [CDC]({{< relref "/integrate/redis-data-integration/data-pipelines#pipeline-lifecycle" >}})
  stays below 10K records per second, assuming an average record size of 1KB and a pipeline without transformations.
- The total data size is no larger than 100GB, so a full sync completes in under an hour without exceeding the throughput
  limits above.
- You don’t need to perform join operations on the data from several tables
  into a [nested Redis JSON object]({{< relref "/integrate/redis-data-integration/data-pipelines/data-denormalization#joining-one-to-many-relationships" >}}).
- RDI supports the [data transformations]({{< relref "/integrate/redis-data-integration/data-pipelines/transform-examples" >}}) you need for your app.
- Your data caching needs are too complex or demanding to implement and maintain yourself.
- Your database administrator has reviewed RDI's requirements for the source database and
  confirmed that they are acceptable.

{{< note >}}The throughput and data-size limits above assume the
[classic processor]({{< relref "/integrate/redis-data-integration/architecture/classic-vs-flink" >}}).
The Flink processor (currently in Preview) roughly doubles each limit.{{< /note >}}

### When not to use RDI

RDI is not a good fit when:

- You are migrating an existing data set into Redis only once.
- Your app needs *immediate* cache consistency (or a hard limit on latency) rather
  than *eventual* consistency.
- You need *transactional* consistency between the source and target databases.
- The app must *write* data to the Redis cache, which then updates the source database
  (write-behind/write-through patterns).
- Your data set will only ever be small.
- Your data is updated by some batch or ETL process with long and large transactions - RDI will fail
  processing these changes.
- You need complex stream processing of data (aggregations, sliding window processing, complex 
  custom logic).
- You need to write data to multiple targets from the same pipeline (Redis supports other
  ways to replicate data across Redis databases such as replicaOf and  Active Active).
- Your database administrator has rejected RDI's requirements for the source database.
