---
Title: Set custom expiration times / TTL
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: null
group: di
linkTitle: Set expiration times / TTL
summary: How to set expiration times / TTL for keys
type: integration
weight: 40
---


You can configure custom key expiration times (TTL) for keys written to Redis by using the `expire` parameter in the `output` section of the job file. This parameter specifies the duration, in seconds, that a newly created key will remain in Redis before being automatically deleted. If the `expire` parameter is not provided, the keys will persist indefinitely.

There are two ways to set the expiration time:

- as a static value
- as a dynamic value using a JMESPath or SQL expression


## Static expiration time

The following example sets the expiration time to 100 seconds for all keys:

```yaml
output:
  - uses: redis.write
    with:
      data_type: hash
      expire: 100
```

## Dynamic expiration time

You can use a JMESPath or SQL expression to set the expiration time dynamically when it is based on a field in the source data. For example, you can set the expiration time to the value of a `ttl` field in the source data:

```yaml
output:
  - uses: redis.write
    with:
      data_type: hash
      expire:
        expression: ttl
        language: jmespath
```

## Dynamic expiration time based on a date, datetime, or timestamp field

In some cases, you can also set the expiration time based on a field that contains a date, datetime, or timestamp value, but it depends on the source database and the data types it supports. See the examples below for your specific source database and data type.

There are two main approaches you can use to set the expiration time based on a date, datetime, or timestamp field:

- For values representing an elapsed time since epoch start (in milliseconds, for example), you have to convert the value to seconds since epoch and then subtract the current time (also in seconds since epoch). The difference between the two is the time until expiration.

    ```yaml
    output:
        - uses: redis.write
          with:
            data_type: hash
            expire:
              # To set the expiration time to a date field, convert the value to
              # seconds (e.g. divide it by 1000 if the fields has milliseconds precision) 
              # and subtract the current time in seconds since epoch.
              expression: EXPIRES_TIMESTAMP / 1000 - STRFTIME('%s', 'now')
              language: sql
    ```

- For values matching the subset of ISO 8601 supported by SQLite (for example, `2023-10-01T12:00:00`, `2023-10-01T12:00:00Z`, or `2025-06-05T13:40:14.784000+02:00`), you can use the `STRFTIME` function to convert the value to seconds since epoch and subtract the current time in seconds since epoch from it.

  ```yaml
  output:
    - uses: redis.write
      with:
        data_type: hash
        expire:
          language: sql
          expression: STRFTIME('%s', EXPIRATION_TS) - STRFTIME('%s', 'now')
  ```

For more examples on how to manipulate date and time values, see the [Formatting date and time values]({{< relref "/integrate/redis-data-integration/data-pipelines/transform-examples/formatting-date-and-time-values/">}}) page.

