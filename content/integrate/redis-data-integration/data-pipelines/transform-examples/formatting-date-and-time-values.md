---
Title: Formatting date and time values
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: null
group: di
linkTitle: Formatting date and time values
summary: Redis Data Integration keeps Redis in sync with a primary database in near
  real time.
type: integration
weight: 40
---

The way you format date and time values depends on the source database, the data type of the field, and how it is represented in the incoming record. Below are some examples for different databases and data types.

## Oracle

Oracle supports the following date and time data types:

- `DATE` - represented by debezium as a 64-bit integer representing the milliseconds since epoch
  ```yaml
  transform:
  - uses: add_field
    with:
      fields:
        - field: formatted_date
          language: sql
          # Date is stored as a Unix timestamp in milliseconds so you need to
          # divide it by 1000 to convert it to seconds.
          expression: STRFTIME('%Y-%m-%d %H:%M:%S', DATE / 1000, 'unixepoch')
          # Example: 1749047572000 is transformed to 2025-06-04 14:32:52
  ```
- `TIMESTAMP` - the value is represented by Debezium as a 64-bit integer and depends on the number of decimal places of precision of the column, representing fractions of a second. For example, if the column is defined as `TIMESTAMP(6)`, there are six decimal places and so the value is represented as microseconds since epoch (since there are 10^6 microseconds in each second).
You can format it similarly to `DATE`, but you need to divide the value by the appropriate factor based on the precision.

- `TIMESTAMP WITH TIME ZONE` - the value is represented as string representation of the timestamp with time zone information.

- `TIMESTAMP WITH LOCAL TIME ZONE` - the value is represented as string representation of the timestamp with local time zone information.

  Both `TIMESTAMP WITH TIME ZONE` and `TIMESTAMP WITH LOCAL TIME ZONE` are supported by SQLite and can be formatted using the `STRFTIME` function.

  ```yaml
  transform:
    - uses: add_field
      with:
        fields:
          - field: seconds_since_epoch
            language: sql
            # Convert the timestamp with local time zone to seconds since epoch.
            expression: STRFTIME('%s', TIMESTAMP_FIELD)

          - field: date_from_timestamp
            language: sql
            # Convert the timestamp with local time zone to date and time.
            expression: STRFTIME('%Y-%m-%d %H:%M:%S', TIMESTAMP_FIELD)
  ```

----

## SQL Server
SQL Server supports the following date and time data types:

- `date` - represented by Debezium as number of days since epoch (1970-01-01). You can multiply the value by 86400 (the number of seconds in a day) to convert it to seconds since epoch and then use the `STRFTIME` or `DATE` functions to format it.
  ```yaml
  transform:
    - uses: add_field
      with:
        fields:
          - field: with_default_date_format
            language: sql
            # Uses the default DATE format
            expression: DATE(event_date * 86400, 'unixepoch')
  
          - field: with_custom_date_format
            language: sql
            # Uses the default DATE format
            expression: STRFTIME('%Y/%m/%d', event_date * 86400, 'unixepoch')
  ```

- `datetime`, `smalldatetime` - represented by Debezium as number of milliseconds since epoch. You have to divide the value by 1000 to convert it to seconds since epoch and then use the `STRFTIME` function to format it.
  ```yaml
  transform:
    - uses: add_field
      with:
        fields:
          - field: formatted_datetime
            language: sql
            expression: STRFTIME('%Y-%m-%d %H:%M:%S', event_datetime / 1000, 'unixepoch')
  ```

- `datetime2` - similar to `datetime` but with higher precision. For `datetime2(0-3)` the representation is the same as for `datetime`. For `datetime2(4-6)` it is the number of microseconds since epoch. and for `datetime2(7)` it is the number of nanoseconds since epoch. You can use the same approach as for `datetime` but you need to divide by 1000, 1000000 or 1000000000 depending on the precision.

- `time` - the time of milliseconds since midnight.
  ```yaml
  transform:
    - uses: add_field
      with:
        fields:
          - field: formatted_time
            language: sql
            expression: TIME(event_time, 'unixepoch', 'utc')
  ```

- `datetimeoffset` - represented as a timestamp with timezone information e.g. `2025-05-27T15:21:42.864Z` and `2025-01-02T14:45:30.123+05:00`. 
  ```yaml
  transform:
  - uses: add_field
    with:
      fields:
        - field: formatted_datetimeoffset
          language: sql
          expression: STRFTIME('%Y-%m-%d %H:%M:%S', event_datetimeoffset)
  ```




<!-- TODO [ilianiliev-redis]: Test and document the dynamic expressions for the rest of the supported databases - MySQL, PostgresSQL, MongoDB -->



----

## PostgreSQL

PostgreSQL supports the following date and time data types:

- `date` - represented by Debezium as number of days since epoch (1970-01-01). You can multiply the value by 86400 (the number of seconds in a day) to convert it to seconds since epoch and then use the `STRFTIME` or `DATE` functions to format it.
  ```yaml
    transform:
        - uses: add_field
          with:
            fields:
              - field: with_default_date_format
                language: sql
                # Uses the default DATE format
                expression: DATE(event_date * 86400, 'unixepoch')
  ```

- `time` - the time of microseconds since midnight.
  ```yaml
  transform:
    - uses: add_field
      with:
        fields:
          - field: formatted_time
            language: sql
            # Divide by 1000000 to convert microseconds to seconds
            expression: TIME(event_time / 1000000, 'unixepoch', 'utc')
  ```

- `time with time zone` - a string representation of the time with timezone information, where the timezone is GMT, example `07:15:00Z`.
  ```yaml
  transform:
    - uses: add_field
      with:
        fields:
          - field: formatted_time_with_tz
            language: sql
            expression: STRFTIME('%H:%M:%S', event_time_with_time_zone)
  ```

- `timestamp` - represented by Debezium as a 64-bit integer representing the microseconds since epoch. You can use the `STRFTIME` function to format it.
  ```yaml
  transform:
    - uses: add_field
      with:
        fields:
          - field: formatted_timestamp
            language: sql
            # Divide by 1000000 to convert microseconds to seconds
            expression: STRFTIME('%Y-%m-%d %H:%M:%S', event_timestamp / 1000000, 'unixepoch')
  ```

- `timestamp with time zone` - represented by Debezium as a string representation of the timestamp with time zone information, where the timezone is GMT, e.g. `2025-06-07T10:15:00.000000Z`
  ```yaml
  transform:
    - uses: add_field
      with:
        fields:
          - field: formatted_timestamp_with_tz
            language: sql
            # Divide by 1000000 to convert microseconds to seconds
            expression: STRFTIME('%Y-%m-%d %H:%M:%S', event_timestamp_with_time_zone)
  ```
