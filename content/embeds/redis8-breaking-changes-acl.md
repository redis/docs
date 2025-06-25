### Potentially breaking changes to ACLs

{{< note >}}
The following content is relevant to all Redis distributions (RS, RC, and ROS).
{{< /note >}}

Redis 8 includes Redis Query Engine, as well as JSON, time series, Bloom filter, cuckoo filter, top-k, count-min sketch, and t-digest data types.
The integration of these features into Redis also comes with improvements to Redis [ACL]({{< relref "/operate/oss_and_stack/management/security/acl" >}}) rules.

{{< warning >}}
These ACL changes may introduce breaking changes for some users, which must be analyzed carefully.
{{< /warning >}}

#### Extension to the existing ACL categories

Before Redis 8, the existing ACL categories @read, @write, @dangerous, @admin, @slow, and @fast did not include commands for the Redis Query Engine and the JSON, time series, and probabilistic data structures.

Starting with Redis 8, Redis includes all Query Engine, JSON, time series, Bloom filter, cuckoo filter, top-k, count-min sketch, and t-digest commands in these existing ACL categories.

As a result:

- Existing ACL rules such as `+@read +@write` will allow access to more commands than in previous versions of Redis. Here are some examples:
  - A user with `+@read` access will be able to execute `FT.SEARCH`.
  - A user with `+@write` access will be able to execute `JSON.SET`. 

- ACL rules such as `+@all -@write`  will allow access to fewer commands than previous versions of Redis. For example:
  - A user with `+@all -@write` will not be able to execute `JSON.SET`.

Note that the `@all` category did not change, as it always included all the commands.

Additionally, ACL rules such as `+@read +JSON.GET` can now be simplified as `+@read` because `JSON.GET` is included in the `@read` category.

#### Who is affected by this change?

Users who currently use the Redis Query Engine and/or the JSON, time series, or probabilistic data structures, and use custom ACL rules.

You should reanalyze your ACL rules to make sure they are aligned with your security and access control requirements.
