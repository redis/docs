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
summary: How to set expiration times / TTL to keys
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

Settings the expiration time dynamically using a JMESPath or SQL expression is useful when the expiration time is based on a field in the source data. For example, you can set the expiration time to the value of a `ttl` field in the source data:

```yaml
output:
  - uses: redis.write
    with:
      data_type: hash
      expire:
        expression: ttl
        language: jmespath
```

Settings the expiration according to a field that contains a date, datetime, or timestamp value is also possible, but it depends on the source database and the data types it supports.


### Oracle examples
The transformation depends on the data type of the field in the source database:

- `DATE` - represented by debezium as 64-bit integer representing the milliseconds since epoch
  ```yaml
  output:
    - uses: redis.write
      with:
        data_type: hash
        expire:
          # To set the expiration time to a date field, convert the value to seconds and subtract the current time in seconds since epoch
          expression: EXPIRES_DATE / 1000 - STRFTIME('%s', 'now')
          language: sql
  ```
- `TIMESTAMP` - the value is represented by debezium as 64-bit integer and depends on the fractional second precision of the column. For example, if the column is defined as `TIMESTAMP(6)`, the value is represented as microseconds since epoch.
  ```yaml
    output:
      - uses: redis.write
        with:
          data_type: hash
          expire:
            # To set the expiration time to a date field, convert the value to seconds (divider differs based on the fractional second precision) and subtract the current time in seconds since epoch. Example below is for 6 digits of precision.
            expression: EXPIRES_TIMESTAMP / 1000000 - STRFTIME('%s', 'now')
            language: sql
  ```
- `TIMESTAMP WITH TIME ZONE` - the value is represented as string representation of the timestamp with time zone information.
- `TIMESTAMP WITH LOCAL TIME ZONE` - the value is represented as string representation of the timestamp with local time zone information.
  
  For both `TIMESTAMP WITH TIME ZONE` and `TIMESTAMP WITH LOCAL TIME ZONE`, a two-step approach is needed. First, calculate the difference between the given time and now in seconds and then invert the value. 
    ```yaml
      transform:
        - uses: add_field
          with:
            fields:
              - field: expire_seconds
                language: jmespath
                expression: time_delta_seconds(EXPIRES_TS_TZ)
      output:
        - uses: redis.write
          with:
            data_type: hash
            expire:
              # `time_delta_seconds` Returns the number of seconds between a given dt and now. 
              # A negative value means that the given dt is in the future, so we need to invert it.
              # A positive value means that the given dt is in the past, so we set the expiration to -1 (expire immediately).
              expression: CASE WHEN expire_seconds < 0 THEN -expire_seconds ELSE -1 END
              language: sql
    ```
