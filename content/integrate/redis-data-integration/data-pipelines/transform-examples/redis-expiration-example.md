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

In some cases, you can also set the expiration time based a field that contains a date, datetime, or timestamp value, but it depends on the source database and the data types it supports. See the examples below for your specific source database and data type.

### Oracle examples

The transformation depends on the data type of the field in the source database:

- `DATE` - represented by debezium as a 64-bit integer representing the milliseconds since epoch
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
- `TIMESTAMP` - the value is represented by Debezium as a 64-bit integer and depends on the number of decimal places of precision of the column, representing fractions of a second. For example, if the column is defined as `TIMESTAMP(6)`, there are six decimal places and so the value is represented as microseconds since epoch (since there are 10^6 microseconds in each second).
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
              # A positive value means that the given dt is in the past, so set the expiration to -1 (expire immediately).
              expression: CASE WHEN expire_seconds < 0 THEN -expire_seconds ELSE -1 END
              language: sql
    ```

----

### SQL Server examples
SQL Server supports the following date and time data types:

- `date` - represented in Debezium as number of days since epoch (1970-01-01). Please note that due to the lack of time information, this method is not very accurate.
  ```yaml
    output:
    - uses: redis.write
      with:
        data_type: hash
        expire:
          # Calculate the number of seconds equivalent to the number of days and subtract the current time in seconds since epoch.
          expression: (event_date * 86400) - strftime('%s', 'now')
          language: sql
  ```

- `datetime`, `smalldatetime` - represented in Debezium as number of milliseconds since epoch.
  ```yaml
    output:
    - uses: redis.write
      with:
        data_type: hash
        expire:
          # Since event_datetime is in miliseconds, you must divide it by 1000 to convert it to seconds.
          expression: event_datetime / 1000 - strftime('%s', 'now')
          language: sql
  ```
- `datetime2` - similar to `datetime` but with higher precision. For `datetime2(0-3)` the representation is the same as for `datetime`. For `datetime2(4-6)` it is the number of microseconds since epoch. and for `datetime2(7)` it is the number of nanoseconds since epoch. You can use the same approach as for `datetime` but you need to divide by 1000, 1000000 or 1000000000 depending on the precision.

- `time` - the time of milliseconds since midnight.
  ```yaml
    output:
    - uses: redis.write
      with:
        data_type: hash
        expire:
          # Convert the time to seconds and subtract the current time in seconds since midnight.
          expression: (event_time / 1000.0) -
            (
              CAST(strftime('%H', 'now') AS INTEGER) * 3600 +
              CAST(strftime('%M', 'now') AS INTEGER) * 60 +
              CAST(strftime('%S', 'now') AS INTEGER)
            )
          language: sql
  ```
- `datetimeoffset` - represented as a timestamp with timezone information, where the timezone is GMT
  ```yaml
  output:
    - uses: redis.write
      with:
        data_type: hash
        expire:
          # We convert the time to seconds and subtract the current time in seconds since epoch.
          expression: strftime('%s', event_datetimeoffset) - strftime('%s', 'now')
          language: sql
  ```

<!-- TODO [ilianiliev-redis]: Test and document the dynamic expressions for the rest of the supported databases - MySQL, PostgresSQL, MongoDB -->
