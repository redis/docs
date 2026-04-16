Static endpoints on Redis Cloud start with `redis-<port>.c<number>` (or `redis-<port>.internal.c<number>` for the private endpoint). For example, a static endpoint might look like this:

```text
redis-12345.c12345.us-east-1-mz.ec2.cloud.rlrcp.com
```

Dynamic endpoints on Redis Cloud always contain three words and a random number, and end in `db.redis.io`. For example, a dynamic endpoint might look like this:

```text
horse-battery-staple-12345.db.redis.io
```

You can see the Dynamic endpoints for databases with both static and dynamic endpoints by expanding the **Dynamic endpoints** section in the **General** section of the **Configuration** tab. 

{{<image filename="images/rc/databases-configuration-general-endpoints-legacy.png" alt="The General section of the Configuration tab of the database details page for a database created before April 21, 2026." >}}